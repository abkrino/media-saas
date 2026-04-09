import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCircle2, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Play, 
  Pause, 
  AlertCircle,
  MoreVertical,
  Plus,
  FileText,
  Check,
  X,
  MessageSquare,
  History,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Layout,
  Type,
  Maximize2,
  Rocket,
  Calendar
} from 'lucide-react';
import { AIAgent, Deliverable, DeliverableFeedback, CampaignBrief } from '../data';
import { cn } from '../lib/utils';
import { Language, translations } from '../locales';
import { approveDeliverable, requestRevision } from '../services/deliverableService';
import { CampaignBriefForm } from './CampaignBriefForm';

interface AITeamProps {
  key?: string;
  agents: AIAgent[];
  deliverables: Deliverable[];
  activeBrief: CampaignBrief | null;
  onAssignTask: (agent: AIAgent) => void;
  language: Language;
  userId: string;
  brandId: string;
}

export function AITeam({ agents, deliverables, activeBrief, onAssignTask, language, userId, brandId }: AITeamProps) {
  const t = translations[language];
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [showBriefForm, setShowBriefForm] = useState(false);

  const pendingDeliverables = useMemo(() => 
    deliverables.filter(d => d.status === 'in_review'), 
  [deliverables]);

  const approvedDeliverables = useMemo(() => 
    deliverables.filter(d => d.status === 'approved' || d.status === 'final'), 
  [deliverables]);

  if (!activeBrief && !showBriefForm) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-10 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] p-16 shadow-2xl border border-[#FEE2E2] max-w-2xl space-y-8"
        >
          <div className="w-24 h-24 bg-[#FDF2F2] rounded-[2rem] flex items-center justify-center mx-auto">
            <Rocket className="w-12 h-12 text-[#FF9A9E]" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-[#2D2424]">Mission Required</h2>
            <p className="text-lg text-[#8B7E7E] font-medium">
              The AI Team is ready, but they need a mission. Submit your campaign brief to kick off production.
            </p>
          </div>
          <button 
            onClick={() => setShowBriefForm(true)}
            className="px-10 py-5 bg-[#2D2424] text-white rounded-3xl font-black text-xl shadow-2xl shadow-[#2D2424]/20 hover:bg-[#4A3B3B] transition-all flex items-center gap-4 mx-auto"
          >
            <Plus className="w-6 h-6" />
            Create Campaign Brief
          </button>
        </motion.div>
      </div>
    );
  }

  if (showBriefForm) {
    return (
      <div className="min-h-screen bg-[#FFF5F5]/30 py-10">
        <div className="max-w-4xl mx-auto mb-6 px-4">
          <button 
            onClick={() => setShowBriefForm(false)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] hover:text-[#2D2424] transition-all"
          >
            <X className="w-4 h-4" /> Cancel Mission
          </button>
        </div>
        <CampaignBriefForm 
          brandId={brandId} 
          ownerId={userId} 
          onComplete={() => setShowBriefForm(false)} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 space-y-10 max-w-[1600px] mx-auto">
      {/* Active Mission Header */}
      <section className="bg-[#2D2424] rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF9A9E]/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-[#FF9A9E] text-[#2D2424] rounded-full text-[10px] font-black uppercase tracking-widest">Active Mission</span>
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Launched {new Date(activeBrief!.createdAt).toLocaleDateString()}</span>
            </div>
            <h2 className="text-4xl font-black leading-tight">{activeBrief!.objective}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Offer</p>
                <p className="text-sm font-bold text-[#FF9A9E]">{activeBrief!.offer}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Audience</p>
                <p className="text-sm font-bold">{activeBrief!.audience}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Deadline</p>
                <p className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF9A9E]" />
                  {new Date(activeBrief!.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-end">
            <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Platforms & Deliverables</p>
              <div className="flex flex-wrap gap-2">
                {activeBrief!.platforms.map(p => (
                  <span key={p} className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold">{p}</span>
                ))}
                {activeBrief!.deliverables.map(d => (
                  <span key={d} className="px-3 py-1 bg-[#FF9A9E]/20 text-[#FF9A9E] rounded-lg text-[10px] font-bold">{d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Column: Status & Deliverables */}
        <div className="xl:col-span-8 space-y-10">
          
          {/* Team Status Board */}
          <section>
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B9AFAF]">Team Status Board</h3>
              <button className="text-[10px] font-bold text-[#FF9A9E] hover:underline">View All Agents</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.slice(0, 6).map((agent) => (
                <AgentStatusCard key={agent.id} agent={agent} language={language} />
              ))}
            </div>
          </section>

          {/* Today's Deliverables */}
          <section>
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B9AFAF]">Today's Deliverables</h3>
              <div className="flex gap-2">
                {['All', 'Content', 'Creative', 'Video'].map(f => (
                  <button key={f} className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#FDF2F2] text-[#8B7E7E] hover:bg-[#2D2424] hover:text-white transition-all">
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {deliverables.length > 0 ? (
                deliverables.map((d) => (
                  <DeliverableRow 
                    key={d.id} 
                    deliverable={d} 
                    isSelected={selectedDeliverable?.id === d.id}
                    onClick={() => setSelectedDeliverable(d)}
                  />
                ))
              ) : (
                <div className="bg-white border border-dashed border-[#FEE2E2] rounded-3xl p-12 text-center">
                  <FileText className="w-12 h-12 text-[#FEE2E2] mx-auto mb-4" />
                  <p className="text-[#B9AFAF] font-bold">No deliverables produced yet today.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Review & Decisions */}
        <div className="xl:col-span-4 space-y-10">
          
          {/* Review Panel */}
          <section className="sticky top-10">
            <AnimatePresence mode="wait">
              {selectedDeliverable ? (
                <ReviewPanel 
                  key={selectedDeliverable.id}
                  deliverable={selectedDeliverable} 
                  userId={userId}
                  onClose={() => setSelectedDeliverable(null)}
                />
              ) : (
                <div className="bg-[#2D2424] rounded-[2.5rem] p-10 text-white text-center space-y-6 shadow-2xl shadow-[#2D2424]/20">
                  <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto">
                    <Layout className="w-10 h-10 text-[#FF9A9E]" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black mb-2">Interactive Review</h4>
                    <p className="text-white/40 text-sm leading-relaxed">
                      Select a deliverable from the list to review, approve, or request revisions from your AI team.
                    </p>
                  </div>
                  {pendingDeliverables.length > 0 && (
                    <div className="pt-6 border-t border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#FF9A9E] mb-4">Awaiting Your Input</p>
                      <div className="space-y-2">
                        {pendingDeliverables.slice(0, 3).map(d => (
                          <button 
                            key={d.id}
                            onClick={() => setSelectedDeliverable(d)}
                            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                          >
                            <span className="text-xs font-bold truncate pr-4">{d.title}</span>
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#FF9A9E] transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>

            {/* Pending Decisions Summary */}
            {!selectedDeliverable && (
              <div className="mt-10 space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B9AFAF] px-2">Pending Decisions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-[#FEE2E2] rounded-3xl p-6">
                    <p className="text-2xl font-black text-[#2D2424] mb-1">{pendingDeliverables.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#B9AFAF]">Approvals</p>
                  </div>
                  <div className="bg-white border border-[#FEE2E2] rounded-3xl p-6">
                    <p className="text-2xl font-black text-[#2D2424] mb-1">
                      {deliverables.filter(d => d.status === 'needs_revision').length}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#B9AFAF]">Revisions</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function AgentStatusCard({ agent, language }: { key?: string, agent: AIAgent, language: Language }) {
  const t = translations[language];
  const isWorking = agent.status === 'Working';

  return (
    <div className="bg-white border border-[#FEE2E2] rounded-[2rem] p-6 hover:shadow-xl hover:shadow-[#FEE2E2]/50 transition-all group">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] flex items-center justify-center border border-[#FEE2E2] group-hover:scale-110 transition-transform">
            <UserCircle2 className="w-6 h-6 text-[#4A3B3B]" />
          </div>
          <div className={cn(
            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
            agent.status === 'Working' ? "bg-blue-500" : "bg-gray-300"
          )} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-black text-[#2D2424] truncate">{agent.name}</h4>
          <p className="text-[10px] font-bold text-[#B9AFAF] uppercase tracking-wider">{agent.role}</p>
        </div>
      </div>
      
      <div className="bg-[#FDF2F2] rounded-2xl p-3 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-[#B9AFAF]">Current Activity</span>
          {isWorking && <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
        </div>
        <p className="text-[10px] text-[#4A3B3B] font-bold line-clamp-1">
          {agent.activeTask || 'Standby'}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-[#B9AFAF]" />
          <span className="text-[9px] font-bold text-[#B9AFAF]">
            {new Date(agent.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span className="text-[9px] font-black text-[#2D2424]">{agent.tasksCompleted}</span>
        </div>
      </div>
    </div>
  );
}

function DeliverableRow({ deliverable, isSelected, onClick }: { key?: string, deliverable: Deliverable, isSelected: boolean, onClick: () => void }) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-600';
      case 'needs_revision': return 'bg-amber-100 text-amber-600';
      case 'in_review': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <motion.div 
      layout
      onClick={onClick}
      className={cn(
        "bg-white border rounded-[1.5rem] p-5 flex items-center justify-between cursor-pointer transition-all group",
        isSelected ? "border-[#FF9A9E] shadow-lg shadow-[#FF9A9E]/5 ring-1 ring-[#FF9A9E]" : "border-[#FEE2E2] hover:border-[#FFD1D1]"
      )}
    >
      <div className="flex items-center gap-5">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
          isSelected ? "bg-[#2D2424] text-white" : "bg-[#FDF2F2] text-[#FF9A9E] group-hover:bg-[#FF9A9E] group-hover:text-white"
        )}>
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h4 className="text-sm font-black text-[#2D2424]">{deliverable.title}</h4>
            <span className="text-[8px] font-black px-2 py-0.5 bg-[#FDF2F2] text-[#B9AFAF] rounded-md uppercase tracking-widest">v{deliverable.version}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-[#B9AFAF] uppercase tracking-wider">{deliverable.department}</span>
            <span className="w-1 h-1 bg-[#FEE2E2] rounded-full" />
            <span className="text-[10px] font-medium text-[#8B7E7E]">Updated {new Date(deliverable.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <span className={cn(
          "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
          getStatusStyle(deliverable.status)
        )}>
          {deliverable.status.replace('_', ' ')}
        </span>
        <div className="w-8 h-8 rounded-full bg-[#FDF2F2] flex items-center justify-center group-hover:bg-[#2D2424] group-hover:text-white transition-all">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

function ReviewPanel({ deliverable, userId, onClose }: { key?: string, deliverable: Deliverable, userId: string, onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'history'>('content');

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await approveDeliverable(deliverable, userId);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevise = async (adjustments: string[]) => {
    setIsSubmitting(true);
    try {
      await requestRevision(deliverable, userId, feedback || "Please revise based on selected adjustments.", adjustments);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white border border-[#FEE2E2] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
    >
      {/* Panel Header */}
      <div className="p-8 border-b border-[#FEE2E2] flex items-center justify-between bg-[#FDF2F2]/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#2D2424] rounded-xl flex items-center justify-center text-white">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-lg font-black text-[#2D2424]">Review Deliverable</h4>
            <p className="text-[10px] font-bold text-[#B9AFAF] uppercase tracking-widest">v{deliverable.version} • {deliverable.department}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all">
          <X className="w-5 h-5 text-[#B9AFAF]" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#FEE2E2]">
        <button 
          onClick={() => setActiveTab('content')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'content' ? "text-[#FF9A9E] border-b-2 border-[#FF9A9E]" : "text-[#B9AFAF]"
          )}
        >
          Content
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === 'history' ? "text-[#FF9A9E] border-b-2 border-[#FF9A9E]" : "text-[#B9AFAF]"
          )}
        >
          History
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {activeTab === 'content' ? (
          <>
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-[#B9AFAF]">Deliverable Content</h5>
              <div className="bg-[#FDF2F2] rounded-3xl p-6 border border-[#FEE2E2]">
                <pre className="text-xs text-[#4A3B3B] font-medium leading-relaxed whitespace-pre-wrap font-sans">
                  {JSON.stringify(deliverable.content, null, 2)}
                </pre>
              </div>
            </div>

            {deliverable.status === 'in_review' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-[#B9AFAF]">Refine Direction</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'More Premium', 
                      'More Direct', 
                      'More Educational', 
                      'Stronger Hook', 
                      'Shorter', 
                      'More Egyptian', 
                      'More Sales-focused'
                    ].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => setFeedback(prev => prev ? `${prev}, ${opt}` : opt)}
                        className="px-4 py-3 bg-white border border-[#FEE2E2] rounded-xl text-[10px] font-bold text-[#8B7E7E] hover:border-[#FF9A9E] hover:text-[#FF9A9E] transition-all text-left flex items-center justify-between group"
                      >
                        {opt}
                        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-[#B9AFAF]">Feedback & Revisions</h5>
                  <textarea 
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Add specific instructions for the team..."
                    className="w-full h-24 p-4 bg-[#FDF2F2] border-none rounded-2xl text-xs focus:ring-2 focus:ring-[#FFD1D1] outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-[#FDF2F2] rounded-2xl">
              <History className="w-5 h-5 text-[#FF9A9E]" />
              <p className="text-[10px] font-bold text-[#8B7E7E]">Version history tracking is active for this deliverable.</p>
            </div>
            {/* Version history list would go here */}
          </div>
        )}
      </div>

      {/* Action Footer */}
      {deliverable.status === 'in_review' && (
        <div className="p-8 border-t border-[#FEE2E2] bg-[#FDF2F2]/30 flex gap-4">
          <button 
            onClick={() => handleRevise([])}
            disabled={isSubmitting}
            className="flex-1 py-4 bg-white border border-[#FEE2E2] text-[#2D2424] rounded-2xl font-bold text-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Request Revision
          </button>
          <button 
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 py-4 bg-[#2D2424] text-white rounded-2xl font-bold text-sm hover:bg-[#4A3B3B] transition-all shadow-xl shadow-[#2D2424]/10 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Approve Final
          </button>
        </div>
      )}
    </motion.div>
  );
}
