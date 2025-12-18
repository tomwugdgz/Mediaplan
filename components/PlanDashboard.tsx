
import React, { useState, useMemo, useEffect } from 'react';
import { AdPlan, MediaAllocation } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from 'recharts';
import { 
  TrendingUp, ShieldAlert, Target, Search, MessageSquare, 
  FileText, Image as ImageIcon, Save, RefreshCw, Printer, 
  FileJson, FileSpreadsheet, Star, Send, Edit3, CheckCircle2, 
  Info, Sparkles, Lightbulb, Loader2, Share2, Copy, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  plan: AdPlan;
  onOpenChat: () => void;
  onSavePlan: (plan: AdPlan) => void;
  onReset: () => void;
  onUpdatePlan: (plan: AdPlan) => void;
  readOnly?: boolean;
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 12} dy={8} textAnchor="middle" fill="#6b7280" className="text-xs font-medium">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} dy={8} textAnchor="middle" fill={fill} className="text-lg font-bold">
        {`¥${(value as number).toLocaleString()}`}
      </text>
      <text x={cx} y={cy + 32} dy={8} textAnchor="middle" fill="#9ca3af" className="text-xs">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  );
};

const LoadingState = ({ label, colorClass, icon: Icon }: any) => (
  <div className={`flex flex-col items-center justify-center py-20 px-6 rounded-3xl bg-opacity-5 ${colorClass.replace('text-', 'bg-')} border-2 border-dashed ${colorClass.replace('text-', 'border-')} animate-fade-in`}>
    <div className={`mb-6 p-4 rounded-2xl bg-white shadow-sm ${colorClass} animate-spin`}>
      <Icon size={40} />
    </div>
    <div className={`text-xl font-bold ${colorClass} animate-pulse-glow flex items-center gap-2`}>
      AI 专家正在{label}...
    </div>
    <p className="mt-3 text-gray-500 text-center max-w-sm text-sm">
      正在实时检索市场趋势并构建投放模型，这可能需要一点时间。
    </p>
  </div>
);

export const PlanDashboard: React.FC<Props> = ({ plan, onOpenChat, onSavePlan, onReset, onUpdatePlan, readOnly }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'roi' | 'swot' | '4p' | 'creative'>('overview');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSorted, setIsSorted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastEditedIndex, setLastEditedIndex] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Feedback state
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const pieData = useMemo(() => {
    const data = plan.allocations.map(a => ({ name: a.name, value: a.budget, type: a.type }));
    if (isSorted) {
      return [...data].sort((a, b) => b.value - a.value);
    }
    return data;
  }, [plan.allocations, isSorted]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleSave = () => {
    onSavePlan(plan);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleShare = () => {
    try {
      const base64Data = btoa(JSON.stringify(plan));
      const url = `${window.location.origin}${window.location.pathname}#share=${base64Data}`;
      setShareUrl(url);
      setIsShareModalOpen(true);
    } catch (e) {
      console.error("Failed to generate share link", e);
      alert("生成分享链接失败");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(plan, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.name}_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const headers = ['媒体名称', '类型', '规格/点位', '占比(%)', '预算(¥)', '推荐理由'];
    const rows = plan.allocations.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.type}"`,
      `"${(item.specifications || '标准规格').replace(/"/g, '""')}"`,
      `${item.percentage}%`,
      item.budget,
      `"${item.reasoning.replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.name}_投放明细_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMarkdown = () => {
    const { name, totalBudget, duration, regions, allocations, analysis } = plan;
    
    const allocationsTable = allocations.map(item => 
      `| ${item.name} | ${item.type} | ${item.specifications || '标准规格'} | ${item.percentage}% | ¥${item.budget.toLocaleString()} | ${item.reasoning.replace(/\n/g, ' ')} |`
    ).join('\n');

    const markdownContent = `
# ${name} - 户外媒体投放方案

**生成日期:** ${new Date(plan.createdAt).toLocaleDateString()}  
**总预算:** ¥${totalBudget.toLocaleString()}  
**投放周期:** ${duration}  
**覆盖区域:** ${regions.join(', ')}

---

## 1. 媒体投放组合策略

| 媒体名称 | 类型 | 规格/点位 | 占比 | 预算 | 推荐理由 |
|---|---|---|---|---|---|
${allocationsTable}

---

## 2. 竞品分析 (Competitor Analysis)
${analysis.competitorInsight}

---

## 3. 创意表现建议
${analysis.creativeSuggestions || '暂无内容'}

---

## 4. 投资回报率 (ROI) 预估
${analysis.roi}

---

## 5. SWOT 分析
${analysis.swot}

---

## 6. 4P 营销策略建议
${analysis.marketing4p}

---
*Generated by OOH小助手 - 您的户外媒体投放专家*
    `.trim();

    const blob = new Blob([`\uFEFF${markdownContent}`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_投放方案_${new Date().toLocaleDateString().replace(/\//g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAllocationChange = (index: number, field: keyof MediaAllocation, value: any) => {
    if (readOnly) return;
    setIsSyncing(true);
    setLastEditedIndex(index);
    const newAllocations = [...plan.allocations];
    
    if (field === 'percentage') {
        let newPercentage = Math.min(100, Math.max(0, Number(value)));
        const otherBudget = plan.allocations.reduce((sum, item, i) => i === index ? sum : sum + item.budget, 0);
        let newBudget = newAllocations[index].budget;

        if (otherBudget === 0) {
            newBudget = Math.round(plan.totalBudget * (newPercentage / 100));
        } else {
            if (newPercentage >= 99.9) newPercentage = 99.9;
            newBudget = Math.round(otherBudget * (newPercentage / (100 - newPercentage)));
        }
        
        newAllocations[index] = { ...newAllocations[index], budget: newBudget };
        const newTotalBudget = newAllocations.reduce((sum, item) => sum + item.budget, 0);

        if (newTotalBudget > 0) {
            newAllocations.forEach((item, i) => {
                newAllocations[i].percentage = Number(((item.budget / newTotalBudget) * 100).toFixed(1));
            });
        }
        
        onUpdatePlan({ ...plan, totalBudget: newTotalBudget, allocations: newAllocations });

    } else if (field === 'budget') {
        const newBudget = Math.max(0, Number(value));
        newAllocations[index] = { ...newAllocations[index], budget: newBudget };
        const newTotalBudget = newAllocations.reduce((sum, item) => sum + item.budget, 0);
        
        if (newTotalBudget > 0) {
            newAllocations.forEach((item, i) => {
                newAllocations[i].percentage = Number(((item.budget / newTotalBudget) * 100).toFixed(1));
            });
        }

        onUpdatePlan({ ...plan, totalBudget: newTotalBudget, allocations: newAllocations });
    } else {
        newAllocations[index] = { ...newAllocations[index], [field]: value };
        onUpdatePlan({ ...plan, allocations: newAllocations });
    }

    setTimeout(() => {
        setIsSyncing(false);
        setTimeout(() => setLastEditedIndex(null), 1500);
    }, 400);
  };

  const handleFeedbackSubmit = () => {
    setFeedbackSubmitted(true);
  };

  const isAnalysisLoading = (content: string | undefined) => {
    return !content || content === "分析生成中..." || content === "建议生成中...";
  };

  const TabButton = ({ id, label, icon: Icon, isLoading, colorClass }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-4 font-bold transition-all border-b-2 whitespace-nowrap relative ${
        activeTab === id 
          ? `border-${colorClass.split('-')[1]}-600 ${colorClass.replace('text-', 'text-')} bg-white shadow-[inset_0_-3px_0_currentColor]` 
          : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon size={18} className={isLoading ? "animate-spin" : ""} />
      {label}
      {isLoading && (
        <span className="absolute top-1 right-1 flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorClass.replace('text-', 'bg-')}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${colorClass.replace('text-', 'bg-')}`}></span>
        </span>
      )}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {isSyncing && (
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-100 overflow-hidden">
            <div className="h-full bg-brand-600 animate-[shimmer_1.5s_infinite] w-1/3"></div>
          </div>
        )}
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{plan.name}</h1>
            {readOnly ? (
               <span className="flex items-center gap-1.5 text-xs font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-lg border border-brand-100">
                <Share2 size={12} /> 只读方案
              </span>
            ) : isSyncing ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-brand-500 bg-brand-50 px-2 py-1 rounded-lg border border-brand-100 animate-pulse">
                <Loader2 size={12} className="animate-spin" /> 正在同步
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                <CheckCircle2 size={12} /> 数据已就绪
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-2 font-medium">总预算: <span className="text-brand-700 font-bold">¥{plan.totalBudget.toLocaleString()}</span> | 周期: {plan.duration} | 区域: {plan.regions.join(', ')}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {!readOnly && (
            <button 
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 bg-white rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 shadow-sm transition-all font-bold text-sm active:scale-95"
            >
              <RefreshCw size={16} /> 重置
            </button>
          )}
          
          <div className="h-10 w-[1px] bg-gray-100 mx-1"></div>

          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2.5 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 transition-all font-bold text-sm shadow-sm border border-brand-100">
            <Share2 size={16} /> 分享
          </button>
          <button onClick={handleExportJSON} title="导出 JSON" className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all font-bold text-sm shadow-sm">
            <FileJson size={16} />
          </button>
          <button onClick={handleExportMarkdown} className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 shadow-md transition-all font-bold text-sm active:scale-95">
            <FileText size={16} /> 导出 Markdown
          </button>
          
          <div className="h-10 w-[1px] bg-gray-100 mx-1"></div>

          {!readOnly && (
            <button 
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white shadow-lg transition-all font-bold active:scale-95 ${
                isSaved ? 'bg-green-600' : 'bg-brand-600 hover:bg-brand-700'
              }`}
            >
              <Save size={18} /> {isSaved ? '已存档' : '保存'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
           {/* Chart */}
           <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 print:break-inside-avoid relative overflow-hidden group">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-gray-900 text-lg">预算资源配比</h3>
                <button onClick={() => setIsSorted(!isSorted)} className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors print:hidden">
                   {isSorted ? '默认顺序' : '按金额排序'}
                </button>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                      className="cursor-pointer outline-none"
                      animationDuration={800}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Media Editor (Read-only if requested) */}
           <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 print:break-inside-avoid">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                   {readOnly ? <FileText size={20} className="text-brand-500" /> : <Edit3 size={20} className="text-brand-500" />}
                   媒体组合详情 {readOnly && "(只读)"}
                 </h3>
             </div>
             <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar print:max-h-none print:overflow-visible">
               {plan.allocations.map((item, idx) => (
                 <div 
                   key={idx} 
                   className={`p-5 rounded-2xl border transition-all group relative overflow-hidden ${
                     lastEditedIndex === idx 
                       ? 'bg-green-50 border-green-200' 
                       : 'bg-gray-50 border-gray-100 hover:border-brand-200 hover:bg-white hover:shadow-md'
                   }`}
                 >
                   {!readOnly && (
                     <div className={`absolute top-0 right-0 p-3 transition-opacity duration-500 ${lastEditedIndex === idx ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-green-700 bg-green-200/50 px-2 py-1 rounded-lg shadow-sm">
                          <CheckCircle2 size={12} /> 实时更新
                        </span>
                     </div>
                   )}

                   <div className="flex flex-col gap-4">
                     <div className="flex justify-between items-start gap-2">
                        <div className="font-bold text-gray-900 truncate pr-2 flex-1 text-base">
                          {item.name}
                        </div>
                        <div className={`flex items-center gap-1 shrink-0 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 transition-all shadow-sm ${!readOnly ? 'focus-within:ring-2 focus-within:ring-brand-500 group-hover:border-brand-300' : ''}`}>
                            <input
                                type="number"
                                readOnly={readOnly}
                                value={item.percentage}
                                onChange={(e) => handleAllocationChange(idx, 'percentage', e.target.value)}
                                className={`w-12 text-right text-base font-black text-brand-600 focus:outline-none border-none p-0 bg-transparent ${readOnly ? 'cursor-default' : ''}`}
                            />
                            <span className="text-xs font-bold text-gray-300">%</span>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-3 text-xs">
                        <span className="px-3 py-1 bg-gray-200 rounded-full text-gray-700 font-bold uppercase tracking-wider">{item.type}</span>
                        <div className={`flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 transition-all shadow-sm ${!readOnly ? 'focus-within:ring-2 focus-within:ring-brand-500 group-hover:border-brand-300' : ''}`}>
                          <span className="text-gray-300 font-black">¥</span>
                          <input
                              type="number"
                              readOnly={readOnly}
                              value={item.budget}
                              onChange={(e) => handleAllocationChange(idx, 'budget', e.target.value)}
                              className={`w-28 focus:outline-none border-none p-0 text-gray-700 font-bold bg-transparent ${readOnly ? 'cursor-default' : ''}`}
                          />
                        </div>
                     </div>

                     <div className="relative">
                        <textarea
                          readOnly={readOnly}
                          value={item.reasoning}
                          onChange={(e) => handleAllocationChange(idx, 'reasoning', e.target.value)}
                          className={`w-full text-sm text-gray-600 bg-white p-4 rounded-xl border border-gray-200 leading-relaxed resize-none transition-all h-28 shadow-sm ${!readOnly ? 'focus:ring-2 focus:ring-brand-500 focus:border-brand-500 group-hover:border-brand-300' : 'cursor-default'}`}
                          placeholder="推荐理由..."
                        />
                        {!readOnly && (
                          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit3 size={14} className="text-gray-400" />
                          </div>
                        )}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Right Column: Analysis Tabs */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col print:min-h-0 print:shadow-none print:border-none">
            <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50 print:hidden">
              <TabButton 
                id="overview" 
                label="品牌洞察" 
                icon={Search} 
                isLoading={isAnalysisLoading(plan.analysis.competitorInsight)}
                colorClass="text-brand-600"
              />
              <TabButton 
                id="creative" 
                label="创意实验室" 
                icon={Lightbulb} 
                isLoading={isAnalysisLoading(plan.analysis.creativeSuggestions)}
                colorClass="text-pink-600"
              />
              <TabButton 
                id="roi" 
                label="效果预估" 
                icon={TrendingUp} 
                isLoading={isAnalysisLoading(plan.analysis.roi)}
                colorClass="text-green-600"
              />
              <TabButton 
                id="swot" 
                label="竞争局势" 
                icon={ShieldAlert} 
                isLoading={isAnalysisLoading(plan.analysis.swot)}
                colorClass="text-purple-600"
              />
              <TabButton 
                id="4p" 
                label="整合营销" 
                icon={Target} 
                isLoading={isAnalysisLoading(plan.analysis.marketing4p)}
                colorClass="text-orange-600"
              />
            </div>

            <div className="p-10 flex-grow overflow-y-auto custom-markdown print:overflow-visible print:h-auto bg-white">
              <div className="print:hidden">
                  {activeTab === 'overview' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                       <h2 className="text-3xl font-black mb-8 flex items-center gap-4 text-brand-900">
                         <Search size={32} className="text-brand-500" /> 市场与竞品洞察
                       </h2>
                       {isAnalysisLoading(plan.analysis.competitorInsight) ? (
                         <LoadingState label="搜寻实时市场动态" colorClass="text-brand-600" icon={Search} />
                       ) : (
                         <div className="prose prose-blue max-w-none prose-lg animate-in fade-in duration-700">
                           <ReactMarkdown>{plan.analysis.competitorInsight}</ReactMarkdown>
                         </div>
                       )}
                    </div>
                  )}

                  {activeTab === 'creative' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <div className="flex justify-between items-start mb-8">
                        <h2 className="text-3xl font-black flex items-center gap-4 text-pink-900">
                          <Lightbulb size={32} className="text-pink-500" /> 创意实验室
                        </h2>
                        {!isAnalysisLoading(plan.analysis.creativeSuggestions) && (
                          <div className="flex items-center gap-2 text-xs font-black text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100">
                            <Sparkles size={16} /> AI 核心创意
                          </div>
                        )}
                      </div>

                      {isAnalysisLoading(plan.analysis.creativeSuggestions) ? (
                        <LoadingState label="激发创意表现力" colorClass="text-pink-600" icon={Lightbulb} />
                      ) : (
                        <div className="animate-in fade-in duration-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <div className="p-6 bg-gradient-to-br from-pink-50/50 to-white rounded-3xl border border-pink-100 shadow-sm group hover:shadow-md transition-all">
                              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-pink-500 group-hover:scale-110 transition-transform">
                                <ImageIcon size={24} />
                              </div>
                              <h4 className="font-black text-pink-900 text-lg mb-2">视觉风格建议</h4>
                              <p className="text-sm text-pink-700 leading-relaxed font-medium">深度融合品牌调性与户外场景，提供具备冲击力的色彩与布局策略。</p>
                            </div>
                            <div className="p-6 bg-gradient-to-br from-brand-50/50 to-white rounded-3xl border border-brand-100 shadow-sm group hover:shadow-md transition-all">
                              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-brand-500 group-hover:scale-110 transition-transform">
                                <FileText size={24} />
                              </div>
                              <h4 className="font-black text-brand-900 text-lg mb-2">文案互动策略</h4>
                              <p className="text-sm text-brand-700 leading-relaxed font-medium">捕捉受众停留时刻的心理共鸣，设计直击人心的利益点沟通话术。</p>
                            </div>
                          </div>
                          <div className="bg-gray-50/50 rounded-3xl p-10 border border-gray-100 prose prose-pink max-w-none prose-lg shadow-inner">
                            <ReactMarkdown>{plan.analysis.creativeSuggestions || ""}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'roi' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <h2 className="text-3xl font-black mb-8 flex items-center gap-4 text-green-900">
                        <TrendingUp size={32} className="text-green-500" /> 转化与 ROI 预估
                      </h2>
                      {isAnalysisLoading(plan.analysis.roi) ? (
                        <LoadingState label="测算投放收益率" colorClass="text-green-600" icon={TrendingUp} />
                      ) : (
                        <div className="prose prose-green max-w-none prose-lg animate-in fade-in duration-700">
                          <ReactMarkdown>{plan.analysis.roi}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'swot' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                       <h2 className="text-3xl font-black mb-8 flex items-center gap-4 text-purple-900">
                        <ShieldAlert size={32} className="text-purple-500" /> 品牌 SWOT 态势
                      </h2>
                      {isAnalysisLoading(plan.analysis.swot) ? (
                        <LoadingState label="研判竞争局势" colorClass="text-purple-600" icon={ShieldAlert} />
                      ) : (
                        <div className="prose prose-purple max-w-none prose-lg animate-in fade-in duration-700">
                          <ReactMarkdown>{plan.analysis.swot}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === '4p' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                       <h2 className="text-3xl font-black mb-8 flex items-center gap-4 text-orange-900">
                        <Target size={32} className="text-orange-500" /> 整合营销 4P 路径
                      </h2>
                      {isAnalysisLoading(plan.analysis.marketing4p) ? (
                        <LoadingState label="构建营销组合" colorClass="text-orange-600" icon={Target} />
                      ) : (
                        <div className="prose prose-orange max-w-none prose-lg animate-in fade-in duration-700">
                          <ReactMarkdown>{plan.analysis.marketing4p}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          {!readOnly && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 print:hidden transition-all hover:shadow-md">
              {!feedbackSubmitted ? (
                <div className="flex flex-col md:flex-row gap-10 items-center">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black text-gray-900 mb-3">方案是否满足您的需求？</h3>
                    <p className="text-gray-500 font-medium">每一份反馈都将帮助我们的 AI 专家为您提供更专业的建议。</p>
                  </div>
                  <div className="flex flex-col items-center gap-6 w-full md:w-auto">
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          onClick={() => setRating(star)}
                          className="transition-all hover:scale-125 active:scale-95"
                        >
                          <Star 
                            size={40} 
                            className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-100"} 
                          />
                        </button>
                      ))}
                    </div>
                    <div className="flex w-full gap-3">
                      <input 
                        type="text" 
                        placeholder="有什么具体需求或改进建议吗？" 
                        className="flex-1 border border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-gray-50 font-medium shadow-inner"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                      <button 
                        onClick={handleFeedbackSubmit}
                        disabled={rating === 0}
                        className="bg-brand-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-brand-700 disabled:bg-gray-200 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                      >
                        <Send size={20} /> 提交
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 animate-in zoom-in duration-500">
                  <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">感谢您的信任与反馈！</h3>
                  <p className="text-gray-500 font-medium">我们将持续打磨模型，为您带来超越期待的营销洞察。</p>
                  <button 
                    onClick={() => setFeedbackSubmitted(false)} 
                    className="mt-6 text-brand-600 font-black hover:underline active:scale-95"
                  >
                    重新评价
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900">分享投放方案</h3>
                <p className="text-gray-500 mt-1 font-medium">生成的链接包含方案的所有实时数据</p>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 break-all text-xs font-mono text-gray-600 mb-6 max-h-32 overflow-y-auto custom-scrollbar">
              {shareUrl}
            </div>
            
            <button 
              onClick={copyToClipboard}
              className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-3 ${copySuccess ? 'bg-green-600' : 'bg-brand-600 hover:bg-brand-700'}`}
            >
              {copySuccess ? <CheckCircle2 size={20} /> : <Copy size={20} />}
              {copySuccess ? '复制成功!' : '复制分享链接'}
            </button>
            
            <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
              提示：分享链接较长（包含完整方案数据），建议在电脑端打开或通过笔记工具保存。
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={onOpenChat}
        className="fixed bottom-10 right-10 bg-brand-600 text-white px-8 py-5 rounded-full shadow-2xl hover:bg-brand-700 transition-all transform hover:scale-110 active:scale-95 z-50 flex items-center gap-4 print:hidden group"
      >
        <div className="relative">
          <MessageSquare size={28} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </div>
        <span className="font-black text-lg tracking-tight">对话专家 Tom</span>
      </button>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px rgba(14, 165, 233, 0.2)); }
          50% { opacity: 0.5; filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.4)); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
