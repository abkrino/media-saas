import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Rocket, 
  Target, 
  Users, 
  ShoppingBag, 
  Layout, 
  Type, 
  Calendar,
  Plus,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { kickoffCampaign } from '../services/campaignService';

interface CampaignBriefFormProps {
  brandId: string;
  ownerId: string;
  onComplete: () => void;
}

export function CampaignBriefForm({ brandId, ownerId, onComplete }: CampaignBriefFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    objective: '',
    offer: '',
    audience: '',
    heroProduct: '',
    secondaryProducts: [] as string[],
    platforms: [] as string[],
    deliverables: [] as string[],
    tone: '',
    deadline: ''
  });

  const [newSecondary, setNewSecondary] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await kickoffCampaign({
        ...formData,
        brandId,
        ownerId,
      });
      onComplete();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlatform = (p: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p) 
        ? prev.platforms.filter(x => x !== p) 
        : [...prev.platforms, p]
    }));
  };

  const toggleDeliverable = (d: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.includes(d) 
        ? prev.deliverables.filter(x => x !== d) 
        : [...prev.deliverables, d]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-[#FEE2E2]"
      >
        <header className="mb-10 text-center">
          <div className="w-16 h-16 bg-[#2D2424] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#2D2424]/10">
            <Rocket className="w-8 h-8 text-[#FF9A9E]" />
          </div>
          <h2 className="text-3xl font-black text-[#2D2424] mb-2">Campaign Mission Control</h2>
          <p className="text-[#8B7E7E]">Define your mission before the AI team takes off.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Objective & Offer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] ml-2">
                <Target className="w-3 h-3" /> Campaign Objective
              </label>
              <textarea 
                required
                value={formData.objective}
                onChange={e => setFormData({...formData, objective: e.target.value})}
                placeholder="e.g. Launching the new Vitamin C serum for summer glow..."
                className="w-full h-32 px-6 py-4 bg-[#FDF2F2] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FFD1D1] outline-none resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] ml-2">
                <Sparkles className="w-3 h-3" /> The Offer
              </label>
              <textarea 
                required
                value={formData.offer}
                onChange={e => setFormData({...formData, offer: e.target.value})}
                placeholder="e.g. Buy 1 Get 1 Free for the first 100 customers..."
                className="w-full h-32 px-6 py-4 bg-[#FDF2F2] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FFD1D1] outline-none resize-none"
              />
            </div>
          </div>

          {/* Section 2: Audience & Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] ml-2">
                  <Users className="w-3 h-3" /> Target Audience
                </label>
                <input 
                  required
                  type="text"
                  value={formData.audience}
                  onChange={e => setFormData({...formData, audience: e.target.value})}
                  placeholder="e.g. Working moms in Cairo, 25-40"
                  className="w-full px-6 py-4 bg-[#FDF2F2] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FFD1D1] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] ml-2">
                  <ShoppingBag className="w-3 h-3" /> Hero Product
                </label>
                <input 
                  required
                  type="text"
                  value={formData.heroProduct}
                  onChange={e => setFormData({...formData, heroProduct: e.target.value})}
                  placeholder="e.g. Glow Serum X"
                  className="w-full px-6 py-4 bg-[#FDF2F2] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FFD1D1] outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] ml-2">
                Secondary Products
              </label>
              <div className="bg-[#FDF2F2] rounded-2xl p-4 min-h-[120px] space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.secondaryProducts.map(p => (
                    <span key={p} className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-[#4A3B3B] flex items-center gap-2">
                      {p}
                      <button type="button" onClick={() => setFormData(prev => ({...prev, secondaryProducts: prev.secondaryProducts.filter(x => x !== p)}))}>
                        <X className="w-3 h-3 text-[#B9AFAF]" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newSecondary}
                    onChange={e => setNewSecondary(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSecondary) {
                          setFormData(prev => ({...prev, secondaryProducts: [...prev.secondaryProducts, newSecondary]}));
                          setNewSecondary('');
                        }
                      }
                    }}
                    placeholder="Add product..."
                    className="flex-1 bg-transparent border-none text-xs outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (newSecondary) {
                        setFormData(prev => ({...prev, secondaryProducts: [...prev.secondaryProducts, newSecondary]}));
                        setNewSecondary('');
                      }
                    }}
                    className="p-1 hover:bg-white rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4 text-[#FF9A9E]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Platforms & Deliverables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] ml-2">
                <Layout className="w-3 h-3" /> Selected Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {['Instagram', 'Facebook', 'TikTok', 'WhatsApp', 'Snapchat'].map(p => (
                  <button 
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      formData.platforms.includes(p) ? "bg-[#2D2424] text-white" : "bg-[#FDF2F2] text-[#8B7E7E]"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] ml-2">
                <Type className="w-3 h-3" /> Requested Deliverables
              </label>
              <div className="flex flex-wrap gap-2">
                {['Content Plan', 'Design Direction', 'Video Scripts', 'Ad Copy', 'Sales Flow'].map(d => (
                  <button 
                    key={d}
                    type="button"
                    onClick={() => toggleDeliverable(d)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      formData.deliverables.includes(d) ? "bg-[#2D2424] text-white" : "bg-[#FDF2F2] text-[#8B7E7E]"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Tone & Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] ml-2">
                Tone & Style
              </label>
              <input 
                required
                type="text"
                value={formData.tone}
                onChange={e => setFormData({...formData, tone: e.target.value})}
                placeholder="e.g. High-end, Minimalist, Educational"
                className="w-full px-6 py-4 bg-[#FDF2F2] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FFD1D1] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] ml-2">
                <Calendar className="w-3 h-3" /> Campaign Deadline
              </label>
              <input 
                required
                type="date"
                value={formData.deadline}
                onChange={e => setFormData({...formData, deadline: e.target.value})}
                className="w-full px-6 py-4 bg-[#FDF2F2] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FFD1D1] outline-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-[#2D2424] text-white rounded-3xl font-black text-lg shadow-2xl shadow-[#2D2424]/20 hover:bg-[#4A3B3B] transition-all flex items-center justify-center gap-4 mt-10"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Rocket className="w-6 h-6" />
                Launch Campaign Mission
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
