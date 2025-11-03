import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating roadmap for profile:", profile);

    // Build the system prompt
    const systemPrompt = `You are an expert career mentor and curriculum designer specializing in software engineering and tech careers. 
Your role is to create personalized, realistic, and actionable learning roadmaps that guide users from their current skill level to their career goals.

Key principles:
- Be specific and practical
- Break down complex goals into achievable milestones
- Consider the user's current experience level
- Recommend real-world resources and technologies
- Focus on hands-on learning and building projects`;

    // Build the user prompt
    const userPrompt = `Create a personalized learning roadmap for the following profile:

Career Goal: ${profile.career_goal}
Current Role: ${profile.current_job_role || 'Not specified'}
Experience: ${profile.experience_years} years
Current Skills: ${profile.skills?.join(', ') || 'Not specified'}
Skill Levels: ${JSON.stringify(profile.skill_levels || {})}

Generate a JSON roadmap with the following structure:
{
  "title": "Clear, inspiring roadmap title",
  "description": "Brief overview of the learning path",
  "duration_months": number (realistic timeframe),
  "milestones": [
    {
      "title": "Milestone title",
      "description": "What will be learned and achieved",
      "duration_weeks": number,
      "order_index": number,
      "topics": ["topic1", "topic2"],
      "learning_outcomes": ["outcome1", "outcome2"],
      "recommended_actions": ["action1", "action2"]
    }
  ]
}

Create 5-8 milestones that progressively build skills. Each milestone should be achievable in 2-6 weeks.
Return ONLY valid JSON, no markdown formatting or explanatory text.`;

    // Call Lovable AI
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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI Gateway returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log("AI Response:", content);

    // Parse the JSON response
    let roadmapData;
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      roadmapData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to generate valid roadmap. Please try again.");
    }

    return new Response(JSON.stringify({ roadmap: roadmapData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in generate-roadmap function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});