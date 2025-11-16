// Supabase Edge Function for Groq AI Chat
// Deploy with: supabase functions deploy chat-ai

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { message, chatId, userId, userMessageId, aiMessageId, conversationHistory } = await req.json()

    if (!message || !chatId || !userId || !userMessageId || !aiMessageId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Groq API key
    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured')
    }

    // Save user message to database (using client-provided ID to prevent duplicates)
    await supabase.from('messages').insert({
      id: userMessageId,
      chat_id: chatId,
      user_id: userId,
      content: message,
      role: 'user',
      message_type: 'text',
      metadata: {}
    })

    // Build conversation context with CBT system prompt
    const systemPrompt = {
      role: 'system',
      content: `You are a compassionate AI therapy companion trained in Cognitive Behavioral Therapy (CBT) techniques. Your role is to:

1. Listen empathetically and validate feelings
2. Ask thoughtful questions to help users explore their thoughts and emotions
3. Gently guide users to identify negative thought patterns
4. Suggest evidence-based coping strategies when appropriate
5. Encourage self-reflection and personal growth
6. Maintain appropriate boundaries - remind users you're not a replacement for professional therapy
7. Be warm, supportive, and non-judgmental

Key CBT techniques to use:
- Cognitive restructuring (challenging negative thoughts)
- Behavioral activation
- Mindfulness and grounding exercises
- Problem-solving strategies
- Emotion regulation techniques

Keep responses conversational, warm, and concise (2-4 sentences usually). Ask one question at a time. Never provide medical advice or diagnoses.`
    }

    // Prepare messages array with history
    const messages = [
      systemPrompt,
      ...(conversationHistory || []).slice(-10), // Last 10 messages for context
      { role: 'user', content: message }
    ]

    // Call Groq API with streaming
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        messages: messages,
        model: 'llama-3.3-70b-versatile', // Better for conversational AI than gpt-oss
        temperature: 0.8, // Slightly creative but focused
        max_completion_tokens: 500, // Keep responses concise
        top_p: 0.9,
        stream: true,
        stop: null
      })
    })

    if (!groqResponse.ok) {
      const error = await groqResponse.text()
      console.error('Groq API error:', error)
      throw new Error('Failed to get AI response')
    }

    // Stream the response back to client
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        const reader = groqResponse.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices[0]?.delta?.content || ''
                  
                  if (content) {
                    fullResponse += content
                    // Send chunk to client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e)
                }
              }
            }
          }

          // Save AI response to database (using client-provided ID)
          await supabase.from('messages').insert({
            id: aiMessageId,
            chat_id: chatId,
            user_id: userId,
            content: fullResponse,
            role: 'assistant',
            message_type: 'text',
            metadata: { model: 'llama-3.3-70b-versatile' }
          })

          // Update chat session
          // First get current message count
          const { data: sessionData } = await supabase
            .from('chat_sessions')
            .select('message_count')
            .eq('id', chatId)
            .single()

          const currentCount = sessionData?.message_count || 0

          await supabase.from('chat_sessions')
            .update({
              last_message: fullResponse.substring(0, 100),
              last_message_at: new Date().toISOString(),
              message_count: currentCount + 2 // user + AI
            })
            .eq('id', chatId)

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

