// Supabase Edge Function for Audio Transcription (Groq Whisper)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { audioData, fileExtension = 'wav' } = await req.json()

    if (!audioData) {
      return new Response(
        JSON.stringify({ error: 'Missing audioData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Groq API key
    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured')
    }

    // Convert base64 to blob
    const audioBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
    const audioBlob = new Blob([audioBytes], { type: `audio/${fileExtension}` })

    // Create form data
    const formData = new FormData()
    formData.append('file', audioBlob, `audio.${fileExtension}`)
    formData.append('model', 'whisper-large-v3')
    formData.append('response_format', 'json')
    formData.append('language', 'en') // Optional: auto-detect if not specified

    // Call Groq Whisper API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: formData,
    })

    if (!groqResponse.ok) {
      const error = await groqResponse.text()
      console.error('Groq API error:', error)
      throw new Error('Failed to transcribe audio')
    }

    const result = await groqResponse.json()

    return new Response(
      JSON.stringify({ text: result.text }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

