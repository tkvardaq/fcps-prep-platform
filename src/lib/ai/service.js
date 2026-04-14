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
      console.error('[Mistral Error]', mistralError.message || mistralError)
      throw new Error('Both AI providers failed. Content being prepared, check back in a few hours.')
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
