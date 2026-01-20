export interface UserProfile {
  id: string;
  email: string;
  credits: number;
  name: string;
}

export interface AnamnesisData {
  age: number;
  occupation: string;
  totalInvested: number;
  financialGoals: string[];
  familyStatus: 'single' | 'married' | 'married_kids' | 'single_parent';
}

export interface CSVRow {
  date: string;
  description: string;
  amount: number;
  category?: string;
  [key: string]: any;
}

export interface Subscription {
  name: string;
  cost: number;
  frequency: string;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface DailyBurn {
  date: string;
  amount: number;
  cumulative: number;
}

export interface Transaction {
  id: string;
  description: string;
  category: string;
  date: string;
  amount: number;
  icon?: string;
}

export interface DeepAnalyticsMetrics {
  total_income: number;
  total_expense: number;
  savings_rate_percentage: number;
  discretionary_spending_percentage: number;
  runway_days_estimate: number;
}

export interface Breakdown503020 {
  needs: number;
  wants: number;
  savings: number;
}

export interface AnalysisInsights {
  advice_text: string;
  wasteful_expenses: string[];
  largest_category: string;
  anomaly_detected?: string | null;
  immediate_actions?: { title: string; description: string; type: 'danger' | 'warning' | 'success' }[];
  market_comparison?: string; // New field for comparative analysis
}

export interface FinancialReportData {
  financial_health_score: number;
  metrics: DeepAnalyticsMetrics;
  breakdown_50_30_20: Breakdown503020;
  subscriptions: Subscription[];
  categories: CategoryData[];
  daily_burn_rate: DailyBurn[];
  insights: AnalysisInsights;
  transactions: Transaction[];
  user_profile?: AnamnesisData; // Store profile in report
}

export type AnalysisStatus = 'idle' | 'uploading' | 'parsing' | 'anamnesis' | 'analyzing' | 'complete' | 'error';