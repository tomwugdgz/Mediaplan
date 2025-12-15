import React from 'react';
import { AdPlan } from '../types';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';

interface Props {
  planA: AdPlan;
  planB: AdPlan;
  onBack: () => void;
}

export const PlanComparison: React.FC<Props> = ({ planA, planB, onBack }) => {
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">方案对比分析</h1>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Headers */}
        <div className="bg-white p-6 rounded-t-2xl border-b-4 border-brand-500 shadow-sm text-center">
            <h2 className="text-xl font-bold text-gray-800">{planA.name}</h2>
            <p className="text-brand-600 font-bold mt-2 text-lg">¥{planA.totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-t-2xl border-b-4 border-indigo-500 shadow-sm text-center">
            <h2 className="text-xl font-bold text-gray-800">{planB.name}</h2>
            <p className="text-indigo-600 font-bold mt-2 text-lg">¥{planB.totalBudget.toLocaleString()}</p>
        </div>

        {/* Basic Info Row */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-4">基本信息</h3>
            <div className="space-y-2">
                <p><strong>投放周期:</strong> {planA.duration}</p>
                <p><strong>覆盖区域:</strong> {planA.regions.join(', ')}</p>
                <p><strong>媒体数量:</strong> {planA.allocations.length} 种</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-4">基本信息</h3>
            <div className="space-y-2">
                <p><strong>投放周期:</strong> {planB.duration}</p>
                <p><strong>覆盖区域:</strong> {planB.regions.join(', ')}</p>
                <p><strong>媒体数量:</strong> {planB.allocations.length} 种</p>
            </div>
        </div>

        {/* Media Allocations */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
             <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-4">媒体组合 (Top 5)</h3>
             <ul className="space-y-3">
                 {planA.allocations.sort((a,b) => b.percentage - a.percentage).slice(0,5).map((item, i) => (
                     <li key={i} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0">
                         <span>{item.name}</span>
                         <span className="font-bold text-brand-600">{item.percentage}%</span>
                     </li>
                 ))}
             </ul>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
             <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-4">媒体组合 (Top 5)</h3>
             <ul className="space-y-3">
                 {planB.allocations.sort((a,b) => b.percentage - a.percentage).slice(0,5).map((item, i) => (
                     <li key={i} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0">
                         <span>{item.name}</span>
                         <span className="font-bold text-indigo-600">{item.percentage}%</span>
                     </li>
                 ))}
             </ul>
        </div>

        {/* ROI Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full max-h-[400px] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-4 sticky top-0 bg-white pb-2">ROI 评估</h3>
            <div className="prose prose-sm prose-blue">
                <ReactMarkdown>{planA.analysis.roi}</ReactMarkdown>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full max-h-[400px] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-4 sticky top-0 bg-white pb-2">ROI 评估</h3>
            <div className="prose prose-sm prose-indigo">
                <ReactMarkdown>{planB.analysis.roi}</ReactMarkdown>
            </div>
        </div>
        
         {/* SWOT Analysis */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full max-h-[400px] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-4 sticky top-0 bg-white pb-2">SWOT 分析</h3>
            <div className="prose prose-sm prose-purple">
                <ReactMarkdown>{planA.analysis.swot}</ReactMarkdown>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full max-h-[400px] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-4 sticky top-0 bg-white pb-2">SWOT 分析</h3>
            <div className="prose prose-sm prose-purple">
                <ReactMarkdown>{planB.analysis.swot}</ReactMarkdown>
            </div>
        </div>

      </div>
    </div>
  );
};