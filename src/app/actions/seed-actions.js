'use server'

import { createClient } from '@/lib/supabase/server'
import { generateTopicMCQs } from './ai-actions'

export async function seedInitialMCQs() {
  const supabase = await createClient()
  
  // 1. Get all subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .order('sort_order')

  if (!subjects) return { success: false, error: 'No subjects found' }

  let totalGenerated = 0
  const results = []

  // 2. For each subject, get the first 3 topics and generate MCQs
  for (const subject of subjects) {
    const { data: topics } = await supabase
      .from('topics')
      .select('id, name')
      .eq('subject_id', subject.id)
      .limit(3)
    
    if (topics) {
      for (const topic of topics) {
        console.log(`[Seeding] Generating MCQs for: ${subject.name} -> ${topic.name}`)
        try {
          // generateTopicMCQs already parses AI output and inserts into DB
          const result = await generateTopicMCQs(topic.id)
          if (result.success) {
            totalGenerated += result.count
            results.push({ topic: topic.name, count: result.count })
          }
        } catch (e) {
          console.error(`Failed to seed ${topic.name}:`, e.message)
        }
      }
    }
  }

  return { success: true, totalGenerated, details: results }
}
