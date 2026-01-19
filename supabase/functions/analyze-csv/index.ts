import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

// ============================================================================
// Types
// ============================================================================

interface AnalyzeCSVRequest {
    csv_data: any[];
    anamnesis?: any;
}

// ============================================================================
// Utils (Inlined)
// ============================================================================

function sanitizePersonalName(text: string): string {
    if (!text || typeof text !== 'string') return '[REDACTED]';

    // Email masking
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(text)) {
        const [username] = text.split('@');
        if (username.length > 2) {
            const masked = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
            return masked + '@[REDACTED]';
        }
        return text;
    }

    // Name masking
    const nameWords = text.split(' ');
    if (nameWords.length > 1) {
        return nameWords.map(word => {
            if (word.length > 2) {
                return word.charAt(0) + '*'.repeat(word.length - 1);
            }
            return word;
        }).join(' ');
    }

    return '[REDACTED]';
}

function sanitizeFinancialData(data: any[]): any[] {
    return data.map(row => {
        const sanitized = { ...row };

        const sensitivePatterns = [
            /cpf/i, /nome/i, /rg/i, /cnpj/i, /titular/i,
            /beneficiário/i, /pagador/i, /account.*holder/i,
            /account.*name/i, /beneficiary/i
        ];

        Object.keys(sanitized).forEach(key => {
            const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));

            if (isSensitive) {
                if (typeof sanitized[key] === 'string') {
                    sanitized[key] = sanitizePersonalName(sanitized[key]);
                } else {
                    sanitized[key] = '[REDACTED]';
                }
            }
        });

        return sanitized;
    });
}

function validateCSVStructure(data: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(data) || data.length === 0) {
        return { valid: false, errors: ['No data provided or empty CSV'] };
    }

    const requiredFields = ['date', 'amount', 'description'];
    const firstRow = data[0];

    requiredFields.forEach(field => {
        if (!(field in firstRow)) {
            errors.push(`Missing required field: ${field}`);
        }
    });

    return { valid: errors.length === 0, errors };
}

function buildAnalysisPrompt(data: any[], anamnesis?: any): string {
    const groundingVolume = data.reduce((sum, row) => sum + Math.abs(Number(row.amount) || 0), 0);

    let profileSection = '';
    if (anamnesis) {
        const familyStatusMap: Record<string, string> = {
            'single': 'Solteiro(a)',
            'married': 'Casado(a)',
            'married_kids': 'Casado(a) com Filhos',
            'single_parent': 'Pai/Mãe Solo',
        };

        const status = familyStatusMap[anamnesis.familyStatus] || anamnesis.familyStatus;
        profileSection = `
    USER PROFILE (ANAMNESIS):
    - Age: ${anamnesis.age}
    - Occupation: ${anamnesis.occupation}
    - Family Status: ${status}
    - Declared Investments: R$ ${anamnesis.totalInvested}
    - Primary Goals: ${anamnesis.financialGoals?.join(', ') || 'N/A'}
    `;
    }

    return `You are an expert Personal CFO and Data Scientist specializing in the Brazilian financial market.
Analyze the following CSV transaction data to generate a comprehensive financial health report.

${profileSection}

CRITICAL INSTRUCTION ON LANGUAGE AND CURRENCY:
1. **Detect Language:** Check the transaction descriptions.
2. **Currency Context:** 
   - If descriptions are Portuguese or involve BRL, **ASSUME BRAZILIAN REAL (BRL)**.
   - **DO NOT convert to USD.** Keep numeric values raw.
   - Use "R$" in text output.

*** IMPORTANT MATH GROUNDING ***
The sum of absolute values in the provided data is approximately **${Math.round(groundingVolume)}**.
- Your calculated (Total Income + Total Expenses) should be in the magnitude of **${Math.round(groundingVolume)}**.
- Do not divide values by any exchange rate. Treat the input numbers as the final currency units.

IMPORTANT: You must respond with a valid JSON object only, no markdown formatting, no extra text.

JSON structure must be exactly:
{
  "financial_health_score": number (0-100),
  "metrics": {
    "total_income": number,
    "total_expense": number,
    "savings_rate_percentage": number (0-100),
    "discretionary_spending_percentage": number (0-100),
    "runway_days_estimate": number
  },
  "breakdown_50_30_20": {
    "needs": number,
    "wants": number,
    "savings": number
  },
  "subscriptions": [
    { "name": string, "cost": number, "frequency": "monthly" | "yearly" }
  ],
  "categories": [
    { "name": string, "value": number }
  ],
  "daily_burn_rate": [
    { "date": string (YYYY-MM-DD), "amount": number, "cumulative": number }
  ],
  "insights": {
    "advice_text": string (comprehensive advice, 3-4 paragraphs in Portuguese),
    "wasteful_expenses": string[] (specific items with amounts),
    "largest_category": string,
    "anomaly_detected": string | null,
    "immediate_actions": [
      { "title": string, "description": string, "type": "danger" | "warning" | "success" }
    ],
    "market_comparison": string (optional)
  },
  "transactions": [
    { "id": string, "description": string, "category": string, "date": string, "amount": number }
  ]
}

Financial data to analyze (${data.length} transactions, showing first 400 for context):
${JSON.stringify(data.slice(0, 400), null, 2)}`;
}

// Helper for retry logic
async function generateWithRetry(model: any, prompt: string, retries = 3, initialDelay = 2000) {
    let delay = initialDelay;
    for (let i = 0; i < retries; i++) {
        try {
            return await model.generateContent(prompt);
        } catch (error: any) {
            const isTransient = error.message?.includes('503') || error.message?.includes('429') || error.message?.includes('overloaded');
            if (i === retries - 1 || !isTransient) throw error;

            console.log(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

// ============================================================================
// Main Handler
// ============================================================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

        if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
            throw new Error('Missing environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Authenticate
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 2. Parse Body
        let body: AnalyzeCSVRequest;
        try {
            body = await req.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { csv_data, anamnesis } = body;

        // 3. Validate
        const validation = validateCSVStructure(csv_data);
        if (!validation.valid) {
            return new Response(JSON.stringify({ error: 'Invalid CSV', details: validation.errors }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 4. Check Credits
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return new Response(JSON.stringify({ error: 'Profile not found' }), {
                status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (profile.credits <= 0) {
            return new Response(JSON.stringify({ error: 'Insufficient credits', message: 'Please top up your credits.' }), {
                status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 5. Sanitize & Normalize
        const sanitizedData = sanitizeFinancialData(csv_data).map(row => ({
            ...row,
            amount: Number(row.amount) || 0 // Ensure number
        }));

        // 6. AI Processing
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = buildAnalysisPrompt(sanitizedData, anamnesis);


        const result = await generateWithRetry(model, prompt);
        const response = await result.response;
        const text = response.text();

        let aiAnalysis;
        try {
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            aiAnalysis = JSON.parse(cleaned);
        } catch (e) {
            console.error('AI Parse Error:', text.substring(0, 200));
            throw new Error('Failed to parse AI response');
        }

        // 7. Save Report
        const { data: report, error: saveError } = await supabase
            .from('reports')
            .insert({
                user_id: user.id,
                raw_data: csv_data,
                ai_analysis: aiAnalysis
            })
            .select()
            .single();

        if (saveError) {
            console.error('Save Report Error:', saveError);
            throw new Error('Failed to save report');
        }

        // 8. Deduct Credit
        await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id);

        // 9. Return
        return new Response(JSON.stringify({
            success: true,
            report_id: report.id,
            analysis: aiAnalysis,
            remaining_credits: profile.credits - 1
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Unhandled Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Server Error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});