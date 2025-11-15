// Supabase Edge Function for Text-to-Speech (Groq PlayAI TTS)

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
    const { text, voice = 'Aaliyah-PlayAI' } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Missing text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Groq API key
    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured')
    }

    // Call Groq TTS API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'playai-tts',
        voice: voice,
        input: text,
        response_format: 'wav',
      }),
    })

    if (!groqResponse.ok) {
      const error = await groqResponse.text()
      console.error('Groq TTS error:', error)
      throw new Error('Failed to generate speech')
    }

    // Get audio as arraybuffer
    const audioBuffer = await groqResponse.arrayBuffer()
    
    // Convert to base64 (in chunks to avoid stack overflow)
    const audioArray = new Uint8Array(audioBuffer)
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < audioArray.length; i += chunkSize) {
      const chunk = audioArray.slice(i, i + chunkSize)
      binary += String.fromCharCode(...chunk)
    }
    const audioBase64 = btoa(binary)

    return new Response(
      JSON.stringify({ audioData: audioBase64 }),
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

