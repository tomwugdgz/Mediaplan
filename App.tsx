import React, { useState } from 'react';
import { UserProfile, AdPlan, CustomMediaConfig } from './types';
import { generatePlanAllocations, performAnalysis } from './services/geminiService';
import { Questionnaire } from './components/Questionnaire';
import { PlanGenerator } from './components/PlanGenerator';
import { PlanDashboard } from './components/PlanDashboard';
import { ChatBot } from './components/ChatBot';
import { Layout } from './components/Layout';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [view, setView] = useState<'onboarding' | 'config' | 'dashboard'>('onboarding');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<AdPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleProfileComplete = (data: UserProfile) => {
    setProfile(data);
    setView('config');
  };

  const handleGeneratePlan = async (budget: number, regions: string[], duration: string, customMedia: CustomMediaConfig[]) => {
    if (!profile) return;
    setIsProcessing(true);
    
    try {
      // 1. Generate Allocations (Flash Model)
      const allocations = await generatePlanAllocations(profile, budget, regions, customMedia);

      // 2. Perform Analysis (Parallel with Search & Reasoning)
      const analysis = await performAnalysis(profile, allocations, regions);

      const newPlan: AdPlan = {
        id: Date.now().toString(),
        name: `${profile.products} 推广方案`,
        createdAt: Date.now(),
        userProfile: profile,
        totalBudget: budget,
        duration,
        regions,
        allocations,
        analysis
      };

      setPlan(newPlan);
      setView('dashboard');
    } catch (e) {
      console.error("Failed to generate plan", e);
      alert("AI 生成方案失败，请稍后重试");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-brand-600 text-white p-1.5 rounded-lg font-bold">OOH</div>
              <span className="font-bold text-xl tracking-tight text-gray-900">小助手</span>
            </div>
            {view !== 'onboarding' && (
              <div className="flex items-center">
                 <button onClick={() => setView('config')} className="text-gray-500 hover:text-brand-600 text-sm font-medium mr-4">新方案</button>
                 <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold border border-brand-200">U</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="py-10">
        {view === 'onboarding' && (
          <div className="animate-fade-in-up">
             <div className="text-center mb-10">
               <h1 className="text-3xl font-bold text-gray-900 mb-4">定制您的专属户外营销方案</h1>
               <p className="text-gray-500 max-w-2xl mx-auto">回答5个核心问题，AI 将为您生成包含媒体组合、预算分配、竞品分析及 ROI 预测的完整策划书。</p>
             </div>
             <Questionnaire onComplete={handleProfileComplete} />
          </div>
        )}

        {view === 'config' && (
           <div className="animate-fade-in-up">
              <div className="text-center mb-10">
                <h1 className="text-2xl font-bold text-gray-900">配置投放参数</h1>
                <p className="text-gray-500">根据已建立的客户档案，配置预算与媒体资源</p>
              </div>
              <PlanGenerator isGenerating={isProcessing} onGenerate={handleGeneratePlan} />
           </div>
        )}

        {view === 'dashboard' && plan && (
          <PlanDashboard plan={plan} onOpenChat={() => setIsChatOpen(true)} />
        )}
      </main>

      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default App;