import { GoogleGenAI, Type } from "@google/genai";
import { FinancialReportData, AnamnesisData } from "../types";

// In a real production app, this call would happen in a Supabase Edge Function
// to keep the API key secure. For this demo, we call it client-side.
const API_KEY = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey: API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    financial_health_score: { type: Type.NUMBER, description: "Score from 0 to 100 based on financial health" },
    metrics: {
      type: Type.OBJECT,
      properties: {
        total_income: { type: Type.NUMBER },
        total_expense: { type: Type.NUMBER },
        savings_rate_percentage: { type: Type.NUMBER, description: "Percentage of income saved" },
        discretionary_spending_percentage: { type: Type.NUMBER },
        runway_days_estimate: { type: Type.NUMBER, description: "Estimated days user can survive on current funds" },
      },
      required: ["total_income", "total_expense", "savings_rate_percentage", "discretionary_spending_percentage", "runway_days_estimate"]
    },
    breakdown_50_30_20: {
      type: Type.OBJECT,
      properties: {
        needs: { type: Type.NUMBER, description: "Total amount spent on needs" },
        wants: { type: Type.NUMBER, description: "Total amount spent on wants" },
        savings: { type: Type.NUMBER, description: "Total amount allocated to savings/debt" },
      },
      required: ["needs", "wants", "savings"]
    },
    subscriptions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          cost: { type: Type.NUMBER },
          frequency: { type: Type.STRING }
        }
      }
    },
    categories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.NUMBER }
        }
      }
    },
    daily_burn_rate: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "YYYY-MM-DD" },
          amount: { type: Type.NUMBER, description: "Daily spending amount" },
          cumulative: { type: Type.NUMBER, description: "Cumulative spending up to this day" }
        }
      }
    },
    insights: {
      type: Type.OBJECT,
      properties: {
        advice_text: { type: Type.STRING, description: "Comprehensive strategic financial advice (3-4 sentences)" },
        wasteful_expenses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific wasteful recurring expenses with amounts" },
        largest_category: { type: Type.STRING },
        anomaly_detected: { type: Type.STRING, nullable: true, description: "Any detected spending anomalies" },
        immediate_actions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["danger", "warning", "success"] }
            }
          }
        }
      },
      required: ["advice_text", "wasteful_expenses", "largest_category"]
    },
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          date: { type: Type.STRING },
          amount: { type: Type.NUMBER }
        }
      }
    }
  },
  required: ["financial_health_score", "metrics", "breakdown_50_30_20", "subscriptions", "categories", "daily_burn_rate", "insights", "transactions"]
};

/**
 * Calculates the total volume of absolute values in the CSV data.
 * This acts as a grounding truth for the AI to prevent currency conversion hallucinations.
 */
const calculateGroundingVolume = (csvData: string): number => {
  try {
    const data = JSON.parse(csvData);
    let totalVolume = 0;
    
    if (Array.isArray(data)) {
      data.forEach(row => {
        // Find amount column (values are already cleaned numbers from csvService)
        const amountKey = Object.keys(row).find(key => 
          key.toLowerCase().includes('amount') || 
          key.toLowerCase().includes('valor') || 
          key.toLowerCase().includes('quantia') ||
          key.toLowerCase().includes('saldo') ||
          key.toLowerCase().includes('value')
        );
        
        if (amountKey && typeof row[amountKey] === 'number') {
          totalVolume += Math.abs(row[amountKey]);
        }
      });
    }
    return Math.round(totalVolume);
  } catch (e) {
    return 0; // Fallback if parsing fails
  }
};

export const analyzeFinancesWithGemini = async (csvData: string, profile: AnamnesisData): Promise<FinancialReportData> => {
  if (!API_KEY) {
    throw new Error("Missing API Key. Please configure process.env.API_KEY.");
  }

  const model = "gemini-3-flash-preview";
  
  // Calculate control metric
  const groundingVolume = calculateGroundingVolume(csvData);

  // Format profile goals for the prompt
  const goals = profile.financialGoals.join(", ");
  const familyStatusMap: Record<string, string> = {
    'single': 'Single',
    'married': 'Married',
    'married_kids': 'Married with Children',
    'single_parent': 'Single Parent'
  };

  const prompt = `
    You are an expert Personal CFO and Data Scientist specializing in the Brazilian financial market.
    Analyze the following CSV transaction data to generate a high-level financial health report, considering the specific user profile provided below.

    USER PROFILE (ANAMNESIS):
    - Age: ${profile.age}
    - Occupation: ${profile.occupation}
    - Family Status: ${familyStatusMap[profile.familyStatus]}
    - Declared Investments: R$ ${profile.totalInvested}
    - Primary Goals: ${goals}

    CRITICAL INSTRUCTION ON LANGUAGE AND CURRENCY:
    1. **Detect Language:** Check the transaction descriptions.
    2. **Currency Context:** 
       - If descriptions are Portuguese or involve BRL, **ASSUME BRAZILIAN REAL (BRL)**.
       - **DO NOT convert to USD.** Keep numeric values raw.
       - Use "R$" in text output.
    
    *** IMPORTANT MATH GROUNDING ***
    The sum of absolute values in the provided data is approximately **${groundingVolume}**.
    - Your calculated (Total Income + Total Expenses) should be in the magnitude of **${groundingVolume}**.
    - If your calculated totals are significantly lower (e.g., around ${Math.round(groundingVolume / 5)}), you are incorrectly applying a USD/BRL exchange rate. **STOP AND USE THE RAW NUMBERS.**
    - Do not divide values by 5. Treat the input numbers as the final currency units.

    Analysis Requirements:
    1. **Financial Health Score (0-100):** Be strict. <50 is poor, >80 is excellent.
    2. **Subscriptions:** Identify recurring charges (Netflix, Spotify, Smart Fit, Sem Parar, etc.).
    3. **Categories:** Group expenses intelligently (Housing, Food, Transport, etc.).
    4. **50/30/20 Rule:** Accurately split expenses.
    5. **Wasteful Expenses:** Identify small leaks.
    6. **Immediate Actions:** 4-5 concrete actions.
    7. **Advice Text:** 3 paragraphs. 
       - Para 1: Overall status & Income vs Benchmark comparison.
       - Para 2: Spending habits & Waste.
       - Para 3: Path to goals (${goals}) & Investment commentary.

    CSV Data:
    ${csvData}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      }
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");

    const data = JSON.parse(textResponse) as FinancialReportData;
    
    // Attach the user profile to the report data for UI usage
    data.user_profile = profile;
    
    return data;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};