'use server'

import { generateContent } from '@/lib/ai/service'
import { getMCQPrompt, getStudyPlanPrompt, getNotesPrompt } from '@/lib/ai/prompts'
import { createClient } from '@/lib/supabase/server'

export async function generateDiagnosticMCQs() {
  const supabase = await createClient()
  
  const { data: mcqs, error } = await supabase
    .from('mcqs')
    .select('*, topics(name), subjects(name)')
    .eq('is_published', true)
    .limit(35)
    
  if (error || !mcqs || mcqs.length === 0) {
    return { success: true, mcqs: [] }
  }
  
  return { success: true, mcqs }
}

export async function generateStudyPlan(examDate, dailyHours, paperFocus, weakSubjects, strongSubjects) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }
  
  const { data: allSubjectsRaw } = await supabase.from('subjects').select('name')
  const availableSubjects = allSubjectsRaw ? allSubjectsRaw.map(s => s.name).join(', ') : 'Anatomy, Physiology, Pathology, Medicine, Surgery'
  
  const prompt = getStudyPlanPrompt(examDate, dailyHours, paperFocus, weakSubjects.join(', '), strongSubjects.join(', '), availableSubjects)
  
  try {
    const contentJson = await generateContent({
      cacheKey: `study_plan_${user.id}_${examDate}`,
      type: 'study_plan',
      prompt: prompt,
      jsonMode: true,
    })
    
    // contentJson is already parsed by the service
    let planArray = Array.isArray(contentJson) ? contentJson : []
    
    if (planArray.length === 0 && typeof contentJson === 'string') {
      try {
        const jsonMatch = contentJson.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          planArray = JSON.parse(jsonMatch[0])
        }
      } catch (e) {
        console.error('Failed to parse AI JSON', e)
        return { success: false, error: 'AI returned malformed plan format.' }
      }
    }
    
    // Insert schedule entries into study_schedule
    if (planArray.length > 0) {
      // Resolve subject and topic names to IDs
      const { data: allSubjects } = await supabase.from('subjects').select('id, name')
      const { data: allTopics } = await supabase.from('topics').select('id, name, subject_id')
      
      // If AI returned too few entries, supplement with deterministic plan
      if (planArray.length < 14 && allSubjects?.length > 0) {
        const taskTypes = ['learn', 'learn', 'learn', 'learn', 'learn', 'learn', 'learn', 'learn', 'revise', 'revise', 'revise', 'revise', 'mock', 'mock']
        for (let d = 0; d < 14; d++) {
          const dt = new Date()
          dt.setDate(dt.getDate() + d)
          const dateStr = dt.toISOString().split('T')[0]
          // Check if this date already has entries
          const hasDate = planArray.some(e => e.date === dateStr)
          if (!hasDate) {
            const subj = allSubjects[d % allSubjects.length]
            planArray.push({
              date: dateStr,
              subject_name: subj.name,
              topic_name: 'General',
              task_type: taskTypes[d] || 'learn',
              hours_allocated: dailyHours ? Math.round(dailyHours / 2) : 2,
              paper_number: 1
            })
          }
        }
      }

      // Clear old schedule for this user
      await supabase.from('study_schedule').delete().eq('user_id', user.id)

      const scheduleRows = planArray
        .map(entry => {
          if(!entry.subject_name) return null;
          // Fuzzy match subject
          let subject = allSubjects?.find(s => s.name.toLowerCase() === entry.subject_name.toLowerCase())
          if (!subject) {
             subject = allSubjects?.find(s => s.name.toLowerCase().includes(entry.subject_name.toLowerCase()) || entry.subject_name.toLowerCase().includes(s.name.toLowerCase()))
          }
          if (!subject) subject = allSubjects?.[Math.floor(Math.random() * allSubjects.length)]
          
          if (!subject) return null; // Very unlikely

          // Match topic
          let topicMatch = null;
          if (entry.topic_name && entry.topic_name !== 'General') {
              topicMatch = allTopics?.find(t => t.name.toLowerCase() === entry.topic_name.toLowerCase() && t.subject_id === subject.id)
              if (!topicMatch) {
                  topicMatch = allTopics?.find(t => (t.name.toLowerCase().includes(entry.topic_name.toLowerCase()) || entry.topic_name.toLowerCase().includes(t.name.toLowerCase())) && t.subject_id === subject.id)
              }
          }
          // Fallback: pick any topic from this subject
          if (!topicMatch) {
              const subTopics = allTopics?.filter(t => t.subject_id === subject.id) || [];
              if (subTopics.length > 0) {
                  topicMatch = subTopics[Math.floor(Math.random() * subTopics.length)]
              } else {
                  topicMatch = allTopics?.[Math.floor(Math.random() * allTopics.length)]
              }
          }
          
          if (!topicMatch) return null
          
          return {
            user_id: user.id,
            scheduled_date: entry.date,
            subject_id: subject.id,
            topic_id: topicMatch.id,
            hours_allocated: entry.hours_allocated || 2,
            task_type: entry.task_type || 'learn',
            is_completed: false
          }
        })
        .filter(Boolean)

      if (scheduleRows.length > 0) {
        // Insert in batches of 50 to avoid payload limits
        for (let i = 0; i < scheduleRows.length; i += 50) {
          const batch = scheduleRows.slice(i, i + 50)
          await supabase.from('study_schedule').insert(batch)
        }
      }
    }
    
    return { success: true, planId: 'generated', daysPlanned: planArray.length }
    
  } catch (err) {
    console.error('Error generating study plan:', err)
    return { success: false, error: err.message }
  }
}

export async function generateTopicNotes(topicId) {
  const supabase = await createClient()
  
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('*, subjects(*)')
    .eq('id', topicId)
    .single()
    
  if (topicError || !topic) return { success: false, error: 'Topic not found' }
  
  const references = 'Ten Teachers, Dewhurst, High Yield FCPS'
  const prompt = getNotesPrompt(topic.name, topic.subjects.name, references)
  
  try {
    const result = await generateContent({
      cacheKey: `notes_${topicId}`,
      type: 'notes',
      prompt: prompt,
      jsonMode: false,
    })
    
    // result is { html: "..." } when jsonMode is false
    let cleanHtml = result.html || result
    if (typeof cleanHtml === 'string') {
      cleanHtml = cleanHtml.replace(/^```html\n/, '').replace(/\n```$/, '').replace(/^```\n/, '')
    }
    
    // Save to notes table (matching actual DB schema)
    const { data: inserted, error: insertError } = await supabase
      .from('notes')
      .insert({
        topic_id: topicId,
        title: topic.name,
        content_html: typeof cleanHtml === 'string' ? cleanHtml : JSON.stringify(cleanHtml),
        reference_books: [references],
        is_verified: false,
      })
      .select()
      .single()
      
    if (insertError) throw insertError
    
    return { success: true, id: inserted.id, content: inserted.content_html }
  } catch (err) {
    console.error('Error generating topic notes:', err)
    return { success: false, error: err.message }
  }
}

export async function generateTopicMCQs(topicId) {
  const supabase = await createClient()
  
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('*, subjects(*)')
    .eq('id', topicId)
    .single()
    
  if (topicError || !topic) return { success: false, error: 'Topic not found' }
  
  const references = 'Ten Teachers, Dewhurst, High Yield FCPS'
  const prompt = getMCQPrompt(topic.name, topic.subjects.name, topic.subjects.paper_number, references)
  
  try {
    const contentJson = await generateContent({
      cacheKey: `mcqs_${topicId}_${Date.now()}`,
      type: 'mcq',
      prompt: prompt,
      jsonMode: true,
    })
    
    // contentJson is already parsed by the service
    let mcqsArray = Array.isArray(contentJson) ? contentJson : []
    
    if (mcqsArray.length === 0 && typeof contentJson === 'string') {
      try {
        const jsonMatch = contentJson.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          mcqsArray = JSON.parse(jsonMatch[0])
        }
      } catch (e) {
        console.error('Failed to parse AI JSON for MCQs', e)
        return { success: false, error: 'AI returned malformed JSON format.' }
      }
    }
    
    // Map AI output to match actual DB schema for mcqs table
    const insertData = mcqsArray.map(mcq => ({
      subject_id: topic.subject_id,
      topic_id: topic.id,
      paper_number: topic.subjects.paper_number,
      question: mcq.question,
      option_a: mcq.option_a,
      option_b: mcq.option_b,
      option_c: mcq.option_c,
      option_d: mcq.option_d,
      correct_answer: mcq.correct_answer,
      explanation: mcq.explanation,
      difficulty: mcq.difficulty || 'medium',
      question_type: mcq.question_type || 'factual',
      reference_book: mcq.reference_book,
      is_published: true,
    }))
    
    const { data: inserted, error: insertError } = await supabase
      .from('mcqs')
      .insert(insertData)
      .select()
      
    if (insertError) throw insertError
    
    return { success: true, count: inserted.length }
  } catch(err) {
    console.error("AI Error:", err)
    return { success: false, error: err.message }
  }
}
