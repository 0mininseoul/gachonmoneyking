import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { filePath, userId } = await req.json();
    if (!filePath || !userId) {
      throw new Error("Missing filePath or userId");
    }

    // 1. Download screenshot file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('screenshots')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download screenshot: ${downloadError?.message || 'No data'}`);
    }

    // Convert blob to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Image = btoa(binary);

    // 2. Fetch API Key for AI Model
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured in Supabase environment secrets");
    }

    // 3. Call AI Vision Model (using gemini-2.5-flash model as requested)
    const modelName = "gemini-2.5-flash"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

    const promptText = `
      Analyze this image which is expected to be a mobile banking screenshot showing a bank account balance.
      Identify if the image contains a mobile banking screen showing a balance.
      If it does not look like a bank account statement/balance screen, set is_bank_statement to false.
      If it does, set is_bank_statement to true, identify the primary total balance amount, and return the balance as a whole integer (without commas or currency symbols).
      
      Return your response in strict JSON format matching this schema:
      {
        "is_bank_statement": boolean,
        "balance": number
      }
    `;

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: fileData.type || "image/png",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI model API returned error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error("AI model returned an empty response");
    }

    // Parse output JSON
    const parsedResult = JSON.parse(responseText.trim());
    const isVerified = parsedResult.is_bank_statement === true;
    const extractedBalance = Number(parsedResult.balance) || 0;

    // 4. Update the Leaderboard record in Supabase DB
    // Get user details to cache nickname and nationality
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('nickname, nationality')
      .eq('id', userId)
      .single();

    const publicUrl = supabaseClient.storage.from('screenshots').getPublicUrl(filePath).data.publicUrl;

    const { error: upsertError } = await supabaseClient
      .from('leaderboard')
      .upsert({
        user_id: userId,
        nickname: profile?.nickname || 'Anonymous',
        nationality: profile?.nationality || 'en',
        balance: isVerified ? extractedBalance : 0,
        screenshot_url: publicUrl,
        status: isVerified ? 'verified' : 'rejected',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) {
      throw new Error(`Failed to update leaderboard: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: isVerified, 
        balance: extractedBalance 
      }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
