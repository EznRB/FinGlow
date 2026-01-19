import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';
import { sanitizeFinancialData, validateCSVStructure } from '../utils/dataSanitizer.ts';
import type { AnalyzeCSVRequest, AnalyzeCSVResponse } from '../types/index.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

serve(async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { csv_data, user_id }: AnalyzeCSVRequest = await req.json();

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (user.id !== user_id) {
            return new Response(JSON.stringify({ error: 'User ID mismatch' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const validation = validateCSVStructure(csv_data);
        if (!validation.valid) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Invalid CSV structure',
                details: validation.errors
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user_id)
            .single();

        if (profileError || !profile) {
            return new Response(JSON.stringify({ error: 'User profile not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (profile.credits <= 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'No credits available',
                message: 'Please purchase credits to continue'
            }), {
                status: 402,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sanitizedData = sanitizeFinancialData(csv_data);

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are a financial AI assistant. Analyze this CSV financial data and provide a comprehensive financial health assessment.

IMPORTANT: You must respond with a valid JSON object only, no markdown formatting, no extra text.

JSON structure must be exactly:
{
  "health_score": number (0-100),
  "savings_rate": number (0-100 percentage),
  "subscriptions_found": [
    {
      "name": string,
      "amount": number,
      "frequency": "monthly"|"yearly"
    }
  ],
  "advice_text": string (max 500 characters),
  "insights": [
    {
      "category": string,
      "total": number,
      "percentage": number,
      "recommendations": string[]
    }
  ]
}

Financial data to analyze:
${JSON.stringify(sanitizedData, null, 2)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        let aiAnalysis;
        try {
            const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            aiAnalysis = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiResponse);
            throw new Error('Failed to parse AI response');
        }

        const { data: report, error: reportError } = await supabase
            .from('reports')
            .insert({
                user_id,
                raw_data: csv_data,
                ai_analysis: aiAnalysis
            })
            .select()
            .single();

        if (reportError) {
            throw new Error('Failed to save report');
        }

        const { error: creditError } = await supabase
            .from('profiles')
            .update({ credits: profile.credits - 1 })
            .eq('id', user_id);

        if (creditError) {
            console.error('Failed to deduct credit:', creditError);
        }

        const responseBody: AnalyzeCSVResponse = {
            success: true,
            report_id: report.id,
            analysis: aiAnalysis
        };

        return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in analyze-csv:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});