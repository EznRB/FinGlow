import { FinancialReportData, AnamnesisData } from "../types";
import { analyzeCSV } from "./apiService";

/**
 * Legacy adapter for AI analysis.
 * Now delegates execution to the secure backend API.
 */
export const analyzeFinancesWithGemini = async (csvData: string, profile: AnamnesisData): Promise<FinancialReportData> => {
  try {
    // Parse the CSV string back to object for the API
    // Note: In a real refactor, we should pass the object directly, 
    // but we are maintaining signature compatibility for now.
    const parsedData = JSON.parse(csvData);

    console.log("Delegating analysis to backend API...");

    const response = await analyzeCSV({
      csvData: parsedData,
      anamnesis: profile
    });

    if (!response.success || !response.analysis) {
      throw new Error(response.error || "Failed to analyze data via backend");
    }

    // Attach user profile as the original service did
    const result = response.analysis;
    result.user_profile = profile;

    return result;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};