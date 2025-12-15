import React, { useState } from 'react';
import { AdPlan } from '../types';
import { Eye, Trash2, ArrowRightLeft, Calendar, MapPin, DollarSign } from 'lucide-react';

interface Props {
  plans: AdPlan[];
  onView: (plan: AdPlan) => void;
  onDelete: (id: string) => void;
  onCompare: (plans: AdPlan[]) => void;
}

export const PlanHistory: React.FC<Props> = ({ plans, onView, onDelete, onCompare }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(pid => pid !== id));
    } else {
      if (selectedIds.length < 2) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const handleCompare = () => {
    const selectedPlans = plans.filter(p => selectedIds.includes(p.id));
    if (selectedPlans.length === 2) {
      onCompare(selectedPlans);
    }
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="text-gray-400 mb-4">暂无保存的方案</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">历史方案库</h2>
        <button
          onClick={handleCompare}
          disabled={selectedIds.length !== 2}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
            selectedIds.length === 2
              ? 'bg-brand-600 text-white shadow-lg hover:bg-brand-700 transform hover:-translate-y-0.5'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ArrowRightLeft size={18} /> 
          对比选中的方案 ({selectedIds.length}/2)
        </button>
      </div>

      <div className="grid gap-4">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`bg-white p-6 rounded-xl border transition-all hover:shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
              selectedIds.includes(plan.id) ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-4 flex-1">
              <input 
                type="checkbox" 
                checked={selectedIds.includes(plan.id)}
                onChange={() => toggleSelection(plan.id)}
                className="mt-1 w-5 h-5 text-brand-600 rounded focus:ring-brand-500"
              />
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{plan.name}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><DollarSign size={14}/> ¥{plan.totalBudget.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><MapPin size={14}/> {plan.regions.join(', ')}</span>
                  <span className="flex items-center gap-1"><Calendar size={14}/> {plan.duration}</span>
                  <span className="text-gray-400">创建于 {new Date(plan.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => onView(plan)} 
                className="flex items-center gap-1 px-3 py-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              >
                <Eye size={16} /> 查看
              </button>
              <button 
                onClick={() => onDelete(plan.id)} 
                className="flex items-center gap-1 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} /> 删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};