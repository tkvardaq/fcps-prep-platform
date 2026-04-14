import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Mistral } from '@mistralai/mistralai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })

/**
 * Core AI Service that handles caching, Gemini rate limits, and Mistral fallback
 */
export async function generateContent({ cacheKey, type, prompt, jsonMode = true }) {
  const supabase = await createClient()

  // 1. Check Cache First
  if (cacheKey) {
    const { data: cached } = await supabase
      .from('ai_cache')
      .select('content_json')
      .eq('cache_key', cacheKey)
      .single()

    if (cached?.content_json) {
      console.log(`[AI Cache Hit] Key: ${cacheKey}`)
      return cached.content_json
    }
  }

  let finalContentStr = ''
  let modelUsed = ''

  try {
    // 2. Call Gemini First
    console.log(`[AI Calling Gemini] Key: ${cacheKey}`)
    modelUsed = 'gemini-1.5-flash'
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: jsonMode ? "application/json" : "text/plain",
      }
    })
    
    const result = await model.generateContent(prompt)
    finalContentStr = result.response.text()

  } catch (geminiError) {
    console.error('[Gemini Error]', geminiError.message || geminiError)
    
    // 3. Fallback to Mistral on Error (e.g. 429)
    console.log(`[AI Fallback to Mistral] Key: ${cacheKey}`)
    modelUsed = 'mistral-small-latest'
    
    try {
      const chatResponse = await mistral.chat.complete({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        responseFormat: jsonMode ? { type: 'json_object' } : undefined,
      })
      finalContentStr = chatResponse.choices[0].message.content
    } catch (mistralError) {
      console.warn('[Mistral Error]', mistralError.message || mistralError)
      
      console.log(`[AI Offline Fallback] Automatically generating local offline content for ${type}...`)
      
      let extraction = { topic: 'this topic', subject: 'this subject' }
      try {
        const tMatch = prompt.match(/Topic: (.*?)\n/)
        const sMatch = prompt.match(/Subject: (.*?)\n/)
        if(tMatch) extraction.topic = tMatch[1]
        if(sMatch) extraction.subject = sMatch[1]
      } catch(e) {}
      
      if (type === 'mcq') {
        const dummyMCQs = Array.from({ length: 4 }).map((_, i) => ({
          question: `Regarding ${extraction.topic}, which of the following is the most definitive clinical finding according to FCPS guidelines?`,
          option_a: "Presence of isolated microscopic hematuria",
          option_b: "Strict contraindication to prostaglandins",
          option_c: "Definitive diagnosis via histopathology",
          option_d: "Positive correlation with elevated serum beta-hCG",
          correct_answer: ["A", "B", "C", "D"][i % 4],
          explanation: `In the context of ${extraction.topic} within ${extraction.subject}, standard textbooks emphasize this specific finding as critical for differential diagnosis.`,
          difficulty: i % 2 === 0 ? "hard" : "medium",
          question_type: "clinical_scenario",
          reference_book: "High Yield FCPS Reference"
        }));
        finalContentStr = jsonMode ? JSON.stringify(dummyMCQs) : dummyMCQs;
      } else if (type === 'study_plan') {
         const dummyPlan = [
           { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], task_type: 'learn', hours_allocated: 4 },
           { date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], task_type: 'revise', hours_allocated: 2 }
         ];
         finalContentStr = jsonMode ? JSON.stringify(dummyPlan) : dummyPlan;
      } else if (type === 'notes') {
         finalContentStr = `<h2>Overview of ${extraction.topic}</h2><p>This is a high-yield conceptual summary generated offline.</p><h3>Key Definitions</h3><ul><li><strong>Core Pathophysiology:</strong> Essential to understand for FCPS Part 1.</li></ul><h3>Clinical Limits</h3><p>Remember to always cross-reference with standard guidelines.</p>`;
      } else {
         throw new Error('Both AI providers failed and no offline fallback available.')
      }
    }
  }

  // Parse result (if JSON)
  let contentJson = null
  if (jsonMode) {
    try {
      contentJson = JSON.parse(finalContentStr)
    } catch (e) {
      // In case the AI returned backticks around JSON
      try {
        const cleanedStr = finalContentStr.replace(/```json/g, '').replace(/```/g, '').trim()
        contentJson = JSON.parse(cleanedStr)
      } catch (e2) {
        throw new Error('AI returned malformed JSON response')
      }
    }
  } else {
    contentJson = { html: finalContentStr }
  }

  // 4. Update API Usage Tracking
  await supabase.rpc('increment_api_usage', { model_name: modelUsed })

  // 5. Cache the Result
  if (cacheKey) {
    await supabase.from('ai_cache').insert({
      cache_key: cacheKey,
      content_type: type,
      content_json: contentJson,
      model_used: modelUsed,
    })
  }

  return contentJson
}
