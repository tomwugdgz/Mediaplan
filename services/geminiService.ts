import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, CustomMediaConfig, MediaAllocation, AnalysisData } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to clean JSON string if markdown blocks exist
const cleanJson = (text: string) => {
  return text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
};

export const generatePlanAllocations = async (
  profile: UserProfile,
  totalBudget: number,
  regions: string[],
  customMedia: CustomMediaConfig[],
  selectedTypes: string[]
): Promise<MediaAllocation[]> => {
  
  const systemInstruction = `
    You are an expert Outdoor Media (OOH) Planner for the brand "${profile.brandName}".
    Your goal is to distribute a budget of ${totalBudget} CNY across different media channels based on the user's profile, competitors (${profile.competitors}), and goals.
    
    Rules:
    1. You MUST prioritize the user's selected media types: ${selectedTypes.join(', ')}.
    2. You can also select from the provided Custom Media list if they fit the strategy.
    3. Provide specific reasoning for why each media was chosen based on the user's pain points and goals.
    4. The percentages must add up to 100%.
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
    
    Generate a media allocation plan.
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: `One of: ${selectedTypes.join(', ')} or Custom Name` },
        name: { type: Type.STRING, description: "Display name of the media" },
        percentage: { type: Type.NUMBER, description: "Allocation percentage (0-100)" },
        budget: { type: Type.NUMBER, description: "Calculated budget for this item" },
        reasoning: { type: Type.STRING, description: "Why this media was chosen" },
        specifications: { type: Type.STRING, description: "Suggested format/size/effects" },
        location: { type: Type.STRING, description: "Suggested placement strategy" }
      },
      required: ["type", "name", "percentage", "budget", "reasoning"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    // Fallback if AI fails (use first 3 selected types or defaults)
    const defaults = selectedTypes.length >= 1 ? selectedTypes : ['社区单元门灯箱', '广告门'];
    return defaults.slice(0, 3).map((type, index) => ({
        type: type,
        name: type,
        percentage: 33,
        budget: totalBudget * 0.33,
        reasoning: "Fallback strategy based on user selection",
        location: "High traffic areas"
    }));
  }
};

export const performAnalysis = async (
  profile: UserProfile,
  allocations: MediaAllocation[],
  regions: string[]
): Promise<AnalysisData> => {

  const context = `
    Brand: ${profile.brandName}
    Competitors: ${profile.competitors}
    Profile: ${JSON.stringify(profile)}
    Plan Allocations: ${JSON.stringify(allocations)}
    Regions: ${regions.join(', ')}
  `;

  // We use parallel requests for speed, but ideally could be one large request.
  // Using gemini-2.5-flash for speed.

  // 1. Competitor & Market Insight (Using Search Grounding)
  const marketPrompt = `
    Analyze the competitive landscape for "${profile.brandName}" vs competitors like "${profile.competitors}" in China.
    Focus on their outdoor media marketing strategies (OOH).
    Analyze current consumer trends and portraits for "${profile.products}".
    Provide a concise report.
  `;

  let competitorInsight = "";
  try {
    const searchRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: marketPrompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    competitorInsight = searchRes.text || "Market analysis unavailable.";
    
    // Append sources if available
    const chunks = searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        const sources = chunks
          .map((c: any) => c.web?.uri ? `[${c.web.title}](${c.web.uri})` : null)
          .filter(Boolean)
          .join('\n');
        if (sources) competitorInsight += `\n\n**Data Sources:**\n${sources}`;
    }

  } catch (e) {
    console.error("Search failed", e);
    competitorInsight = "Unable to fetch real-time market data at this moment.";
  }

  // 2. Analytical Models (ROI, SWOT, 4P)
  const analysisPrompt = `
    Context: ${context}
    Market Insight: ${competitorInsight}

    Please generate 3 separate analysis sections in JSON format:
    1. ROI: Evaluate budget rationality, expected exposure, and ROI for brand ${profile.brandName}.
    2. SWOT: Strengths, Weaknesses, Opportunities, Threats of this specific media mix against competitors ${profile.competitors}.
    3. 4P: Product, Price, Place, Promotion strategy suggestions based on the plan.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      roi: { type: Type.STRING, description: "ROI analysis text (markdown allowed)" },
      swot: { type: Type.STRING, description: "SWOT analysis text (markdown allowed)" },
      marketing4p: { type: Type.STRING, description: "4P analysis text (markdown allowed)" }
    },
    required: ["roi", "swot", "marketing4p"]
  };

  try {
    const analysisRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    roi: "Analysis pending...",
    swot: "Analysis pending...",
    marketing4p: "Analysis pending...",
    competitorInsight
  };
};

export const chatWithTom = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: [
      {
        role: 'user',
        parts: [{ text: "System Instruction: You are Tom, a senior Outdoor Media (OOH) Expert. You are professional, insightful, and helpful. You help users optimize their ad campaigns." }]
      },
      {
        role: 'model',
        parts: [{ text: "Hello! I am Tom, your OOH advertising expert. How can I help you with your media strategy today?" }]
      },
      ...history
    ],
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};