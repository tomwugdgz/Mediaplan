import React, { useState } from 'react';
import { CustomMediaConfig } from '../types';
import { Plus, Trash2, Loader2, DollarSign, Calendar, MapPin, Layers } from 'lucide-react';

interface Props {
  isGenerating: boolean;
  onGenerate: (budget: number, regions: string[], duration: string, customMedia: CustomMediaConfig[], selectedTypes: string[]) => void;
}

const STANDARD_MEDIA_OPTIONS = [
  '社区单元门灯箱',
  '社区门禁广告门',
  '开门App开屏/弹窗',
  '社区道闸广告',
  '写字楼电梯海报',
  '写字楼梯内视频',
  '公交候车亭灯箱',
  '商圈户外LED大屏',
  '地铁灯箱/包车'
];

export const PlanGenerator: React.FC<Props> = ({ isGenerating, onGenerate }) => {
  const [budget, setBudget] = useState<number>(50000);
  const [regions, setRegions] = useState<string>('北京, 上海');
  const [duration, setDuration] = useState<string>('1个月');
  
  // New: Standard Media Selection
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['社区单元门灯箱', '社区门禁广告门', '开门App开屏/弹窗']);
  
  const [customMedia, setCustomMedia] = useState<CustomMediaConfig[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Temp state for new custom media
  const [newMedia, setNewMedia] = useState<CustomMediaConfig>({
    name: '', format: '', effects: '', imageUrl: '', cityCoverage: '', rateCardPrice: 0, discount: 1
  });

  const toggleMediaType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const addCustomMedia = () => {
    // Validation
    if (!newMedia.name.trim()) {
      alert("请输入媒体名称");
      return;
    }
    if (newMedia.rateCardPrice < 0) {
      alert("请输入有效的刊例价 (>=0)");
      return;
    }
    if (newMedia.discount < 0 || newMedia.discount > 1) {
      alert("请输入有效的折扣 (0-1之间)");
      return;
    }

    setCustomMedia([...customMedia, newMedia]);
    setNewMedia({ name: '', format: '', effects: '', imageUrl: '', cityCoverage: '', rateCardPrice: 0, discount: 1 });
    setShowCustomForm(false);
  };

  const handleSubmit = () => {
    onGenerate(budget, regions.split(/,|，/).map(s => s.trim()), duration, customMedia, selectedTypes);
  };

  const formatBudget = (val: number) => {
    if (val >= 100000000) return (val / 100000000).toFixed(1) + '亿';
    if (val >= 10000) return (val / 10000).toFixed(0) + '万';
    return val;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      
      {/* 1. Basic Config */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
           <span className="w-1 h-6 bg-brand-600 rounded-full"></span>
           基础投放配置
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={16}/> 总预算
              </div>
              <span className="text-brand-600 font-bold text-lg">¥{budget.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min="10000"
              max="50000000"
              step="10000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>¥1万</span>
              <span>¥5000万</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin size={16}/> 投放区域 (逗号分隔)
            </label>
            <input
              type="text"
              value={regions}
              onChange={(e) => setRegions(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16}/> 投放周期
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="例如: 3个月"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Standard Media Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
           <span className="w-1 h-6 bg-brand-600 rounded-full"></span>
           媒体形式偏好 (多选)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STANDARD_MEDIA_OPTIONS.map(type => (
            <label key={type} className={`
              flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all
              ${selectedTypes.includes(type) 
                ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-sm' 
                : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50 text-gray-700'}
            `}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedTypes.includes(type) ? 'bg-brand-500 border-brand-500' : 'border-gray-300 bg-white'}`}>
                {selectedTypes.includes(type) && <Layers size={12} className="text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={selectedTypes.includes(type)} 
                onChange={() => toggleMediaType(type)} 
              />
              <span className="font-medium">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Custom Media */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
            自定义媒体资源 (可选)
          </h2>
          <button 
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="text-brand-600 font-medium hover:bg-brand-50 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus size={18} /> 添加媒体
          </button>
        </div>

        {showCustomForm && (
          <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="媒体名称" className="p-2 rounded border" value={newMedia.name} onChange={e => setNewMedia({...newMedia, name: e.target.value})} />
            <input placeholder="媒体形式" className="p-2 rounded border" value={newMedia.format} onChange={e => setNewMedia({...newMedia, format: e.target.value})} />
            <input placeholder="特效/效果" className="p-2 rounded border" value={newMedia.effects} onChange={e => setNewMedia({...newMedia, effects: e.target.value})} />
            <input placeholder="图片链接 URL" className="p-2 rounded border" value={newMedia.imageUrl} onChange={e => setNewMedia({...newMedia, imageUrl: e.target.value})} />
            <input placeholder="覆盖城市" className="p-2 rounded border" value={newMedia.cityCoverage} onChange={e => setNewMedia({...newMedia, cityCoverage: e.target.value})} />
            <div className="flex gap-2">
               <input type="number" placeholder="刊例价" className="p-2 rounded border w-1/2" value={newMedia.rateCardPrice || ''} onChange={e => setNewMedia({...newMedia, rateCardPrice: Number(e.target.value)})} />
               <input type="number" placeholder="折扣 (0-1)" className="p-2 rounded border w-1/2" value={newMedia.discount} step="0.1" onChange={e => setNewMedia({...newMedia, discount: Number(e.target.value)})} />
            </div>
            <button onClick={addCustomMedia} className="md:col-span-2 bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700">确认添加</button>
          </div>
        )}

        <div className="space-y-3">
          {customMedia.map((media, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <div className="font-semibold text-gray-800">{media.name}</div>
                <div className="text-xs text-gray-500">{media.format} · {media.cityCoverage}</div>
              </div>
              <button onClick={() => setCustomMedia(customMedia.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-2 rounded-full">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {customMedia.length === 0 && !showCustomForm && (
            <p className="text-gray-400 text-center py-4 text-sm">暂无自定义媒体</p>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
      >
        {isGenerating ? <Loader2 className="animate-spin" /> : null}
        {isGenerating ? 'AI正在生成策略...' : '生成智能投放方案'}
      </button>
    </div>
  );
};