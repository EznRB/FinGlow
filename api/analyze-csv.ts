import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalyzeCSVRequest, AnalyzeCSVResponse, AIAnalysisResult, AnamnesisData } from '../types';
import {
    verifyToken,
    getProfileCredits,
    deductCredit,
    saveReport,
    logAudit
} from '../lib/supabase';
import { sanitizeFinancialData, validateCSVStructure, normalizeCSVData } from '../lib/sanitizer';

// ============================================================================
// Configuration
// ============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-flash';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// Vercel API Route Handler
// ============================================================================

export const config = {
    runtime: 'edge',
    maxDuration: 60, // 60 seconds for AI processing
};

export default async function handler(request: Request): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const startTime = Date.now();

    try {
        // ========================================================================
        // 1. Authenticate User
        // ========================================================================
        const authHeader = request.headers.get('Authorization');
        const auth = await verifyToken(authHeader);

        if (!auth) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing authentication token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[analyze-csv] User ${auth.userId} authenticated`);

        // ========================================================================
        // 2. Parse Request Body
        // ========================================================================
        const body: AnalyzeCSVRequest = await request.json();
        const { csv_data, anamnesis } = body;

        if (!csv_data || !Array.isArray(csv_data)) {
            return new Response(
                JSON.stringify({ error: 'Bad Request', message: 'csv_data is required and must be an array' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ========================================================================
        // 3. Validate CSV Structure
        // ========================================================================
        const validation = validateCSVStructure(csv_data);
        if (!validation.valid) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid CSV structure',
                    message: validation.errors.join('; ')
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[analyze-csv] CSV validated: ${csv_data.length} rows`);

        // ========================================================================
        // 4. Check User Credits
        // ========================================================================
        const credits = await getProfileCredits(auth.userId);

        if (credits === null) {
            return new Response(
                JSON.stringify({ error: 'Profile not found', message: 'User profile does not exist' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (credits <= 0) {
            await logAudit(auth.userId, 'analysis_failed', 'credits', undefined, { reason: 'insufficient_credits' }, request);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Payment Required',
                    message: 'Você não possui créditos suficientes. Por favor, adquira um pacote para continuar.'
                }),
                { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[analyze-csv] User has ${credits} credits`);

        // ========================================================================
        // 5. Normalize and Sanitize Data
        // ========================================================================
        const normalizedData = normalizeCSVData(csv_data);
        const sanitizedData = sanitizeFinancialData(normalizedData);

        console.log(`[analyze-csv] Data sanitized, sending to AI`);

        // ========================================================================
        // 6. Call Gemini AI
        // ========================================================================
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = buildAnalysisPrompt(sanitizedData, anamnesis);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiText = response.text();

        // Parse AI response
        let aiAnalysis: AIAnalysisResult;
        try {
            const cleanedResponse = aiText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            aiAnalysis = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('[analyze-csv] Failed to parse AI response:', aiText.substring(0, 500));
            throw new Error('Failed to parse AI response');
        }

        console.log(`[analyze-csv] AI analysis complete, health_score: ${aiAnalysis.financial_health_score}`);

        // ========================================================================
        // 7. Save Report to Database
        // ========================================================================
        const reportId = await saveReport(auth.userId, csv_data, aiAnalysis);

        if (!reportId) {
            throw new Error('Failed to save report to database');
        }

        console.log(`[analyze-csv] Report saved with ID: ${reportId}`);

        // ========================================================================
        // 8. Deduct Credit
        // ========================================================================
        const creditDeducted = await deductCredit(auth.userId);

        if (!creditDeducted) {
            console.error('[analyze-csv] Failed to deduct credit, but report was saved');
        }

        const remainingCredits = credits - 1;

        // ========================================================================
        // 9. Log Success
        // ========================================================================
        await logAudit(auth.userId, 'analysis_completed', 'report', reportId, {
            transactions_count: csv_data.length,
            health_score: aiAnalysis.financial_health_score,
            processing_time_ms: Date.now() - startTime,
        }, request);

        // ========================================================================
        // 10. Return Response
        // ========================================================================
        const responseBody: AnalyzeCSVResponse = {
            success: true,
            report_id: reportId,
            analysis: aiAnalysis,
            remaining_credits: remainingCredits,
        };

        console.log(`[analyze-csv] Request completed in ${Date.now() - startTime}ms`);

        return new Response(JSON.stringify(responseBody), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('[analyze-csv] Error:', error.message);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal Server Error',
                message: error.message || 'An unexpected error occurred'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

// ============================================================================
// Build Analysis Prompt
// ============================================================================

function buildAnalysisPrompt(data: any[], anamnesis?: AnamnesisData): string {
    // Calculate grounding volume for currency validation
    const groundingVolume = data.reduce((sum, row) => sum + Math.abs(row.amount || 0), 0);

    // Format anamnesis if provided
    let profileSection = '';
    if (anamnesis) {
        const familyStatusMap: Record<string, string> = {
            'single': 'Solteiro(a)',
            'married': 'Casado(a)',
            'married_kids': 'Casado(a) com Filhos',
            'single_parent': 'Pai/Mãe Solo',
        };

        profileSection = `
    USER PROFILE (ANAMNESIS):
    - Age: ${anamnesis.age}
    - Occupation: ${anamnesis.occupation}
    - Family Status: ${familyStatusMap[anamnesis.familyStatus] || anamnesis.familyStatus}
    - Declared Investments: R$ ${anamnesis.totalInvested}
    - Primary Goals: ${anamnesis.financialGoals.join(', ')}
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
    "advice_text": string (comprehensive advice, 3-4 paragraphs),
    "wasteful_expenses": string[] (specific items with amounts),
    "largest_category": string,
    "anomaly_detected": string | null,
    "immediate_actions": [
      { "title": string, "description": string, "type": "danger" | "warning" | "success" }
    ],
    "market_comparison": string (optional, compare to market averages)
  },
  "transactions": [
    { "id": string, "description": string, "category": string, "date": string, "amount": number }
  ]
}

Analysis Requirements:
1. **Financial Health Score (0-100):** Be strict. <50 is poor, >80 is excellent.
2. **Subscriptions:** Identify recurring charges (Netflix, Spotify, Smart Fit, iFood, Uber, etc.).
3. **Categories:** Group expenses intelligently (Moradia, Alimentação, Transporte, Lazer, Saúde, etc.).
4. **50/30/20 Rule:** Accurately split expenses into needs/wants/savings.
5. **Wasteful Expenses:** Identify small leaks that add up.
6. **Immediate Actions:** Provide 4-5 concrete, actionable recommendations.
7. **Advice Text:** Write in Portuguese. 3 paragraphs covering overall status, spending habits, and path to goals.

Financial data to analyze (${data.length} transactions):
${JSON.stringify(data.slice(0, 500), null, 2)}`;
}
