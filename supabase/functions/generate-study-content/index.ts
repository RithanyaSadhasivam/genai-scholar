import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, type } = await req.json();
    console.log('Processing request for type:', type);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'topics') {
      systemPrompt = 'You are an educational AI assistant that extracts main topics and key concepts from study material.';
      userPrompt = `Extract and list the main topics and key concepts from the following content. Return only a JSON array of topic strings:\n\n${content}`;
    } else if (type === 'notes') {
      systemPrompt = 'You are an educational AI assistant that creates comprehensive study notes.';
      userPrompt = `Create detailed, well-organized study notes from the following content. Structure them with clear headings and bullet points. Make them comprehensive but concise:\n\n${content}`;
    } else if (type === 'quiz') {
      systemPrompt = 'You are an educational AI assistant that creates effective quiz questions.';
      userPrompt = `Create 10 multiple-choice quiz questions from the following content. Each question should have 4 options (A, B, C, D) with one correct answer. Return a JSON array with objects containing: question, options (array of 4 strings), correctAnswer (letter A-D), and explanation:\n\n${content}`;
    } else if (type === 'flashcards') {
      systemPrompt = 'You are an educational AI assistant that creates effective flashcards for studying.';
      userPrompt = `Create 15 flashcards from the following content. Each flashcard should have a clear question and a concise answer. Return a JSON array with objects containing: question and answer:\n\n${content}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    console.log('Generated content:', generatedText.substring(0, 200));

    // Parse the response based on type
    let result;
    if (type === 'topics') {
      // Extract JSON array from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } else if (type === 'notes') {
      result = generatedText;
    } else if (type === 'quiz' || type === 'flashcards') {
      // Extract JSON array from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-study-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});