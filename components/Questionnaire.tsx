import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const questions = [
  {
    key: 'painPoints',
    question: '您目前在营销工作中遇到的主要痛点是什么？',
    placeholder: '例如：品牌知名度不高、产品销售额停滞不前、目标用户触达不精准等'
  },
  {
    key: 'goals',
    question: '您此次投放广告的主要目的是什么？',
    placeholder: '例如：提高品牌曝光度、推广新产品上市、提升活动参与度、促进销售转化等'
  },
  {
    key: 'scenarios',
    question: '您希望在哪些场景或地点解决这些痛点？',
    placeholder: '例如：特定的地理区域、目标用户经常出入的场所等，您目前考虑的渠道是线上还是其他方法？'
  },
  {
    key: 'products',
    question: '您计划选择哪款或哪几款产品作为此次营销的突破口？',
    placeholder: '请输入具体产品名称或系列'
  },
  {
    key: 'measurement',
    question: '您希望通过什么方法来衡量和归因广告投放效果？',
    placeholder: '例如：销售数据增长、线上流量提升、用户调研反馈等'
  }
];

export const Questionnaire: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswer = (val: string) => {
    setAnswers(prev => ({ ...prev, [questions[step].key]: val }));
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Complete
      onComplete(answers as unknown as UserProfile);
    }
  };

  const currentQ = questions[step];

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-brand-600">Step {step + 1} of {questions.length}</span>
          <span className="text-sm text-gray-500">{Math.round(((step + 1) / questions.length) * 100)}% Completed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-brand-600 h-2 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100 min-h-[400px] flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{currentQ.question}</h2>
        
        <textarea
          className="w-full flex-grow p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none text-lg"
          placeholder={currentQ.placeholder}
          value={answers[currentQ.key] || ''}
          onChange={(e) => handleAnswer(e.target.value)}
        />

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!answers[currentQ.key]}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold transition-all ${
              !answers[currentQ.key] 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-brand-600 hover:bg-brand-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {step === questions.length - 1 ? '生成客户档案' : '下一题'}
            {step === questions.length - 1 ? <CheckCircle2 size={20} /> : <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};