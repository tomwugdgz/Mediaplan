import React, { useState, useEffect } from 'react';
import { UserProfile, AdPlan, CustomMediaConfig } from './types';
import { generatePlanAllocations, performAnalysis } from './services/geminiService';
import { Questionnaire } from './components/Questionnaire';
import { PlanGenerator } from './components/PlanGenerator';
import { PlanDashboard } from './components/PlanDashboard';
import { ChatBot } from './components/ChatBot';
import { PlanHistory } from './components/PlanHistory';
import { PlanComparison } from './components/PlanComparison';
import { Layout } from './components/Layout';
import { History, LayoutDashboard } from 'lucide-react';

const App = () => {
  const [view, setView] = useState<'onboarding' | 'config' | 'dashboard' | 'history' | 'compare'>('onboarding');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<AdPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Storage & History State
  const [savedPlans, setSavedPlans] = useState<AdPlan[]>([]);
  const [comparePlans, setComparePlans] = useState<AdPlan[]>([]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ooh_saved_plans');
    if (stored) {
      try {
        setSavedPlans(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved plans", e);
      }
    }
  }, []);

  const handleProfileComplete = (data: UserProfile) => {
    setProfile(data);
    setView('config');
  };

  const handleSavePlan = (planToSave: AdPlan) => {
    const exists = savedPlans.some(p => p.id === planToSave.id);
    let newSaved;
    if (exists) {
      newSaved = savedPlans.map(p => p.id === planToSave.id ? planToSave : p);
    } else {
      newSaved = [planToSave, ...savedPlans];
    }
    setSavedPlans(newSaved);
    localStorage.setItem('ooh_saved_plans', JSON.stringify(newSaved));
  };

  const handleDeletePlan = (id: string) => {
    const newSaved = savedPlans.filter(p => p.id !== id);
    setSavedPlans(newSaved);
    localStorage.setItem('ooh_saved_plans', JSON.stringify(newSaved));
    if (plan?.id === id) {
        setPlan(null);
        setView('history');
    }
  };

  const handleViewPlan = (p: AdPlan) => {
    setPlan(p);
    setProfile(p.userProfile);
    setView('dashboard');
  };

  const handleCompareStart = (plans: AdPlan[]) => {
    setComparePlans(plans);
    setView('compare');
  };

  const handleResetPlan = () => {
    setPlan(null);
    setView('config');
  };

  const handleGeneratePlan = async (
    budget: number, 
    regions: string[], 
    duration: string, 
    customMedia: CustomMediaConfig[], 
    selectedTypes: string[]
  ) => {
    if (!profile) return;
    setIsProcessing(true);
    
    try {
      // 1. Generate Allocations (Flash Model) with Selected Types
      const allocations = await generatePlanAllocations(profile, budget, regions, customMedia, selectedTypes);

      // 2. Perform Analysis (Parallel with Search & Reasoning)
      const analysis = await performAnalysis(profile, allocations, regions);

      const newPlan: AdPlan = {
        id: Date.now().toString(),
        name: `${profile.brandName || profile.products} 推广方案`,
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
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('onboarding')}>
              <div className="bg-brand-600 text-white p-1.5 rounded-lg font-bold">OOH</div>
              <span className="font-bold text-xl tracking-tight text-gray-900">小助手</span>
            </div>
            {view !== 'onboarding' && (
              <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setView('history')} 
                    className={`flex items-center gap-1 text-sm font-medium transition-colors ${view === 'history' ? 'text-brand-600' : 'text-gray-500 hover:text-brand-600'}`}
                 >
                    <History size={18} /> 历史方案
                 </button>
                 
                 {plan && (
                   <button 
                      onClick={() => setView('dashboard')} 
                      className={`flex items-center gap-1 text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-brand-600' : 'text-gray-500 hover:text-brand-600'}`}
                   >
                      <LayoutDashboard size={18} /> 当前方案
                   </button>
                 )}

                 <div className="h-6 w-[1px] bg-gray-300 mx-2"></div>

                 <button onClick={() => setView('config')} className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors">
                    + 新方案
                 </button>
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
          <PlanDashboard 
            plan={plan} 
            onOpenChat={() => setIsChatOpen(true)} 
            onSavePlan={handleSavePlan}
            onReset={handleResetPlan}
          />
        )}

        {view === 'history' && (
            <PlanHistory 
                plans={savedPlans} 
                onView={handleViewPlan} 
                onDelete={handleDeletePlan}
                onCompare={handleCompareStart}
            />
        )}

        {view === 'compare' && comparePlans.length === 2 && (
            <PlanComparison 
                planA={comparePlans[0]} 
                planB={comparePlans[1]} 
                onBack={() => setView('history')}
            />
        )}
      </main>

      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default App;