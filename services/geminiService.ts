
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, CustomMediaConfig, MediaAllocation, AnalysisData } from "../types";

// Helper to clean JSON string if markdown blocks exist
const cleanJson = (text: string) => {
  return text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
};

/**
 * Generates initial media allocations based on user profile and budget.
 */
export const generatePlanAllocations = async (
  profile: UserProfile,
  totalBudget: number,
  regions: string[],
  customMedia: CustomMediaConfig[],
  selectedTypes: string[]
): Promise<MediaAllocation[]> => {
  // Always use a new GoogleGenAI instance for each request to ensure current API key usage.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are an expert Outdoor Media (OOH) Planner for the brand "${profile.brandName}".
    Your goal is to distribute a budget of ${totalBudget} CNY across different media channels based on the user's profile, competitors (${profile.competitors}), and goals.
    
    Rules:
    1. You MUST prioritize the user's selected media types: ${selectedTypes.join(', ')}.
    2. You can also select from the provided Custom Media list if they fit the strategy.
    3. Provide specific reasoning for why each media was chosen based on the user's pain points and goals.
    4. The percentages must add up to 100%.
    5. **CRITICAL: ALL OUTPUT FIELDS (reasoning, location, etc.) MUST BE IN SIMPLIFIED CHINESE (简体中文).** If you think in English, you MUST translate the final output to high-quality, professional marketing Chinese.
  `;

  const customMediaPrompt = customMedia.length > 0 
    ? `Available Custom Media to consider: ${JSON.stringify(customMedia)}` 
    : "No custom media provided.";

  const prompt = `
    User Profile:
    - Brand Name: ${profile.brandName}
    - Competitors: ${profile.competitors}
    - Pain Points: ${profile.painPoints}
    - Goals: ${profile.goals}
    - Target Scenarios: ${profile.scenarios}
    - Products: ${profile.products}
    - Measurement: ${profile.measurement}
    
    User Preferred Media Types: ${selectedTypes.join(', ')}
    Target Regions: ${regions.join(', ')}
    ${customMediaPrompt}
    
    Generate a media allocation plan. Ensure all text content in the resulting JSON is in Simplified Chinese.
  `;

  // Define the schema for structured JSON output.
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "媒体类型 (One of preferred types or Custom)" },
        name: { type: Type.STRING, description: "媒体名称 (Chinese)" },
        percentage: { type: Type.NUMBER, description: "预算占比 (0-100)" },
        budget: { type: Type.NUMBER, description: "计算预算 (CNY)" },
        reasoning: { type: Type.STRING, description: "推荐理由 (Simplified Chinese)" },
        specifications: { type: Type.STRING, description: "规格说明 (Simplified Chinese)" },
        location: { type: Type.STRING, description: "点位策略 (Simplified Chinese)" }
      },
      required: ["type", "name", "percentage", "budget", "reasoning"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      }
    });

    if (response.text) {
      return JSON.parse(cleanJson(response.text));
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Plan generation failed", error);
    // Fallback if AI fails
    const defaults = selectedTypes.length >= 1 ? selectedTypes : ['社区单元门灯箱', '广告门'];
    return defaults.slice(0, 3).map((type, index) => ({
        type: type,
        name: type,
        percentage: 33,
        budget: Math.round(totalBudget * 0.33),
        reasoning: "基于用户选择的默认策略（AI 生成失败时的备选）",
        location: "高流量核心区域"
    }));
  }
};

/**
 * Performs deeper market and ROI analysis using Pro model and search grounding.
 */
export const performAnalysis = async (
  profile: UserProfile,
  allocations: MediaAllocation[],
  regions: string[]
): Promise<AnalysisData> => {
  // Always use a new GoogleGenAI instance for each request.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const context = `
    Brand: ${profile.brandName}
    Competitors: ${profile.competitors}
    Profile: ${JSON.stringify(profile)}
    Plan Allocations: ${JSON.stringify(allocations)}
    Regions: ${regions.join(', ')}
  `;

  // 1. Competitor & Market Insight (Using Search Grounding)
  const marketPrompt = `
    Analyze the competitive landscape for "${profile.brandName}" vs competitors like "${profile.competitors}" in China.
    Focus on their outdoor media marketing strategies (OOH).
    Analyze current consumer trends and portraits for "${profile.products}".
    
    **CRITICAL REQUIREMENT**: The final output report MUST be written in SIMPLIFIED CHINESE (简体中文). 
  `;

  let competitorInsight = "";
  try {
    const searchRes = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: marketPrompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    // Access the .text property directly, it is not a method.
    competitorInsight = searchRes.text || "暂无市场分析数据。";
    
    // Extract website URLs from groundingChunks and list them.
    const chunks = searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        const sources = chunks
          .map((c: any) => c.web?.uri ? `[${c.web.title}](${c.web.uri})` : null)
          .filter(Boolean)
          .join('\n');
        if (sources) competitorInsight += `\n\n**数据来源:**\n${sources}`;
    }

  } catch (e) {
    console.error("Search failed", e);
    competitorInsight = "暂时无法获取实时市场数据。";
  }

  // 2. Analytical Models (ROI, SWOT, 4P, Creative)
  const analysisPrompt = `
    Context: ${context}
    Market Insight: ${competitorInsight}

    Please generate 4 separate analysis sections in JSON format.
    **IMPORTANT: All text values in the JSON output MUST be in SIMPLIFIED CHINESE (简体中文).**

    1. ROI: Evaluate budget rationality and expected ROI in Chinese.
    2. SWOT: Strengths, Weaknesses, Opportunities, Threats in Chinese.
    3. 4P: Product, Price, Place, Promotion suggestions in Chinese.
    4. Creative Suggestions: Suggest 3 unique and engaging ad creative/visual directions for "${profile.brandName}" in Chinese.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      roi: { type: Type.STRING, description: "ROI 分析 (Simplified Chinese)" },
      swot: { type: Type.STRING, description: "SWOT 分析 (Simplified Chinese)" },
      marketing4p: { type: Type.STRING, description: "4P 营销建议 (Simplified Chinese)" },
      creativeSuggestions: { type: Type.STRING, description: "创意表现建议 (Simplified Chinese, markdown allowed)" }
    },
    required: ["roi", "swot", "marketing4p", "creativeSuggestions"]
  };

  try {
    const analysisRes = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: analysisPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    
    if (analysisRes.text) {
      const data = JSON.parse(cleanJson(analysisRes.text));
      return {
        ...data,
        competitorInsight
      };
    }
  } catch (e) {
    console.error("Analysis generation failed", e);
  }

  return {
    roi: "分析生成失败，请稍后重试。",
    swot: "分析生成失败，请稍后重试。",
    marketing4p: "分析生成失败，请稍后重试。",
    competitorInsight,
    creativeSuggestions: "建议生成失败，请稍后重试。"
  };
};

/**
 * Chat with Tom, a senior Outdoor Media (OOH) Expert.
 */
export const chatWithTom = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
  // Always use a new GoogleGenAI instance for each request.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are Tom, a senior Outdoor Media (OOH) Expert. You are professional, insightful, and helpful. You help users optimize their ad campaigns. **IMPORTANT**: You must ALWAYS reply in Simplified Chinese (简体中文). Any English concepts should be translated or explained in Chinese.",
    },
    // The history should follow the strict alternating pattern of user and model.
    history: history,
  });

  // chat.sendMessage accepts a message string.
  const result = await chat.sendMessage({ message });
  return result.text;
};
