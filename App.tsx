import React, { useState, useEffect } from 'react';
import { UserProfile, AdPlan, CustomMediaConfig } from './types';
import { generatePlanAllocations, performAnalysis } from './services/geminiService';
import { Questionnaire } from './components/Questionnaire';
import { PlanGenerator } from './components/PlanGenerator';
import { PlanDashboard } from './components/PlanDashboard';
import { ChatBot } from './components/ChatBot';
import { PlanHistory } from './components/PlanHistory';
import { PlanComparison } from './components/PlanComparison';
import { History, LayoutDashboard, Share2 } from 'lucide-react';

const App = () => {
  const [view, setView] = useState<'onboarding' | 'config' | 'dashboard' | 'history' | 'compare'>('onboarding');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<AdPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Storage & History State
  const [savedPlans, setSavedPlans] = useState<AdPlan[]>([]);
  const [comparePlans, setComparePlans] = useState<AdPlan[]>([]);

  // Detect shared plan on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const base64Data = hash.replace('#share=', '');
        const decodedData = JSON.parse(atob(base64Data));
        setPlan(decodedData);
        setIsReadOnly(true);
        setView('dashboard');
        // Clear hash to prevent accidental re-parsing
        window.history.replaceState(null, '', window.location.pathname);
      } catch (e) {
        console.error("Failed to parse shared plan", e);
      }
    }

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
    setIsReadOnly(false);
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
    setIsReadOnly(false);
    setView('dashboard');
  };

  const handleCompareStart = (plans: AdPlan[]) => {
    setComparePlans(plans);
    setView('compare');
  };

  const handleResetPlan = () => {
    setPlan(null);
    setIsReadOnly(false);
    setView('config');
  };

  const handleUpdatePlan = (updatedPlan: AdPlan) => {
    setPlan(updatedPlan);
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
    setIsReadOnly(false);
    
    try {
      const allocations = await generatePlanAllocations(profile, budget, regions, customMedia, selectedTypes);
      const newPlanId = Date.now().toString();
      const initialPlan: AdPlan = {
        id: newPlanId,
        name: `${profile.brandName || profile.products} 推广方案`,
        createdAt: Date.now(),
        userProfile: profile,
        totalBudget: budget,
        duration,
        regions,
        allocations,
        analysis: {
          roi: "分析生成中...",
          swot: "分析生成中...",
          marketing4p: "分析生成中...",
          competitorInsight: "分析生成中...",
          creativeSuggestions: "建议生成中..."
        }
      };

      setPlan(initialPlan);
      setView('dashboard');

      const analysis = await performAnalysis(profile, allocations, regions);
      setPlan(prev => prev && prev.id === newPlanId ? { ...prev, analysis } : prev);
      
    } catch (e) {
      console.error("Failed to generate plan", e);
      alert("AI 生成方案失败，请稍后重试");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 print:bg-white">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('onboarding')}>
              <div className="bg-brand-600 text-white p-1.5 rounded-lg font-bold shadow-sm">OOH</div>
              <span className="font-bold text-xl tracking-tight text-gray-900">小助手</span>
            </div>
            
            <div className="flex items-center gap-4">
               {!isReadOnly && (
                 <>
                   <button 
                      onClick={() => setView('history')} 
                      className={`flex items-center gap-1 text-sm font-medium transition-colors ${view === 'history' ? 'text-brand-600' : 'text-gray-500 hover:text-brand-600'}`}
                   >
                      <History size={18} /> 历史库
                   </button>
                   
                   {plan && (
                     <button 
                        onClick={() => setView('dashboard')} 
                        className={`flex items-center gap-1 text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-brand-600' : 'text-gray-500 hover:text-brand-600'}`}
                     >
                        <LayoutDashboard size={18} /> 当前工作区
                     </button>
                   )}

                   <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>

                   <button onClick={() => setView('config')} className="bg-brand-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-brand-700 transition-all shadow-sm active:scale-95">
                      + 开启新项目
                   </button>
                 </>
               )}
               {isReadOnly && (
                 <button 
                   onClick={() => { setIsReadOnly(false); setView('onboarding'); setPlan(null); }}
                   className="bg-brand-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-brand-700 transition-all shadow-sm active:scale-95"
                 >
                   创建我自己的方案
                 </button>
               )}
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10 print:py-0">
        {view === 'onboarding' && (
          <div className="animate-fade-in-up print:hidden">
             <div className="text-center mb-10 px-4">
               <h1 className="text-3xl font-bold text-gray-900 mb-4">定制您的专属户外营销方案</h1>
               <p className="text-gray-500 max-w-2xl mx-auto">回答核心问题，AI 将为您生成包含媒体组合、预算分配、竞品分析及 ROI 预测的完整策划书。</p>
             </div>
             <Questionnaire onComplete={handleProfileComplete} />
          </div>
        )}

        {view === 'config' && (
           <div className="animate-fade-in-up print:hidden">
              <div className="text-center mb-10">
                <h1 className="text-2xl font-bold text-gray-900">配置投放参数</h1>
                <p className="text-gray-500">基于您的品牌画像，我们将精准匹配最优媒体资源</p>
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
            onUpdatePlan={handleUpdatePlan}
            readOnly={isReadOnly}
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