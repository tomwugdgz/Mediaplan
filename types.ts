export enum MediaType {
  UnitDoor = '社区单元门灯箱', // Must have
  AdDoor = '广告门',
  App = '开门App广告',
  Custom = '自定义媒体'
}

export interface UserProfile {
  painPoints: string;
  goals: string;
  scenarios: string;
  products: string;
  measurement: string;
}

export interface CustomMediaConfig {
  name: string;
  format: string;
  effects: string;
  imageUrl: string;
  cityCoverage: string;
  rateCardPrice: number;
  discount: number;
}

export interface MediaAllocation {
  type: MediaType | string;
  name: string;
  percentage: number;
  budget: number;
  reasoning: string;
  specifications?: string;
  imageUrl?: string;
  location?: string;
}

export interface AnalysisData {
  roi: string;
  swot: string;
  marketing4p: string;
  competitorInsight: string; // From Search
}

export interface AdPlan {
  id: string;
  name: string;
  createdAt: number;
  userProfile: UserProfile;
  totalBudget: number;
  duration: string;
  regions: string[];
  allocations: MediaAllocation[];
  analysis: AnalysisData;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}
