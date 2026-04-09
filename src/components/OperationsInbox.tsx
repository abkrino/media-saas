import React from 'react';
import { motion } from 'motion/react';
import { 
  Inbox, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  UserCircle2,
  ArrowRight,
  MoreVertical,
  Tag
} from 'lucide-react';
import { AgentTask, AIAgent } from '../data';
import { cn } from '../lib/utils';
import { Language, translations } from '../locales';

interface OperationsInboxProps {
  key?: string;
  tasks: AgentTask[];
  agents: AIAgent[];
  onAssign: (taskId: string, agentId: string) => void;
  language: Language;
}

export function OperationsInbox({ tasks, agents, onAssign, language }: OperationsInboxProps) {
  const t = translations[language];
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#4A3B3B] tracking-tight">{t.operationsInbox}</h2>
          <p className="text-[#B9AFAF] text-xs md:text-sm">{t.inboxStatus}</p>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B9AFAF]" />
            <input 
              type="text" 
              placeholder={t.searchTasks}
              className="w-full md:w-64 pl-12 pr-6 py-3 bg-white border border-[#FEE2E2] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#4A3B3B]/10"
            />
          </div>
          <button className="p-3 bg-white border border-[#FEE2E2] rounded-full text-[#4A3B3B] hover:bg-[#FFF5F5] transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#FEE2E2] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
        <div className="p-4 md:p-6 border-b border-[#FEE2E2] bg-[#FFF5F5]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button className="text-xs md:text-sm font-black text-[#4A3B3B] border-b-2 border-[#4A3B3B] pb-1 whitespace-nowrap">{t.allTasks}</button>
            <button className="text-xs md:text-sm font-bold text-[#B9AFAF] hover:text-[#4A3B3B] transition-colors pb-1 whitespace-nowrap">{t.pending}</button>
            <button className="text-xs md:text-sm font-bold text-[#B9AFAF] hover:text-[#4A3B3B] transition-colors pb-1 whitespace-nowrap">{t.inProgress}</button>
            <button className="text-xs md:text-sm font-bold text-[#B9AFAF] hover:text-[#4A3B3B] transition-colors pb-1 whitespace-nowrap">{t.completed}</button>
          </div>
          <span className="text-[10px] md:text-xs font-bold text-[#B9AFAF]">{tasks.length} {t.totalTasks}</span>
        </div>

        <div className="divide-y divide-[#FEE2E2]">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} agents={agents} onAssign={onAssign} language={language} />
          ))}
          {tasks.length === 0 && (
            <div className="p-10 md:p-20 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FFF5F5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-6 h-6 md:w-8 md:h-8 text-[#B9AFAF]" />
              </div>
              <h3 className="text-base md:text-lg font-black text-[#4A3B3B] mb-1">{t.inboxEmpty}</h3>
              <p className="text-[#B9AFAF] text-xs md:text-sm">{t.allCleared}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, agents, onAssign, language }: { task: AgentTask, agents: AIAgent[], onAssign: (tid: string, aid: string) => void, key?: string, language: Language }) {
  const t = translations[language];
  const getPriorityColor = (priority: AgentTask['priority']) => {
    switch (priority) {
      case 'Urgent': return 'text-rose-600 bg-rose-50';
      case 'High': return 'text-amber-600 bg-amber-50';
      case 'Medium': return 'text-blue-600 bg-blue-50';
      case 'Low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: AgentTask['type']) => {
    switch (type) {
      case 'Onboarding': return <Tag className="w-3 h-3" />;
      case 'Research': return <Search className="w-3 h-3" />;
      case 'Content': return <Tag className="w-3 h-3" />;
      case 'WhatsApp': return <Tag className="w-3 h-3" />;
      default: return <Tag className="w-3 h-3" />;
    }
  };

  const assignedAgent = agents.find(a => a.id === task.assignedTo);

  return (
    <div className="p-4 md:p-6 hover:bg-[#FFF5F5]/20 transition-colors group">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0",
            task.status === 'Completed' ? "bg-green-50 border-green-100 text-green-600" : "bg-white border-[#FEE2E2] text-[#4A3B3B]"
          )}>
            {task.status === 'Completed' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div className="md:hidden">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
              getPriorityColor(task.priority)
            )}>
              {t[task.priority.toLowerCase() as keyof typeof t] || task.priority}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="text-sm font-black text-[#4A3B3B] truncate">{task.title}</h4>
            <span className={cn(
              "hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
              getPriorityColor(task.priority)
            )}>
              {t[task.priority.toLowerCase() as keyof typeof t] || task.priority}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold text-[#B9AFAF] uppercase tracking-widest">
              {getTypeIcon(task.type)}
              {t[task.type.toLowerCase() as keyof typeof t] || task.type}
            </div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold text-[#B9AFAF] uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              {new Date(task.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 pt-4 md:pt-0 border-t md:border-t-0 border-[#FEE2E2]">
          <div className="w-full md:w-48">
            {assignedAgent ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFF5F5] border border-[#FEE2E2] flex items-center justify-center">
                  <UserCircle2 className="w-4 h-4 text-[#4A3B3B]" />
                </div>
                <div>
                  <p className="text-[8px] md:text-[10px] font-black text-[#4A3B3B] uppercase tracking-widest leading-none mb-1">{t.assignedTo}</p>
                  <p className="text-[8px] md:text-[10px] font-bold text-[#B9AFAF] truncate">{assignedAgent.name}</p>
                </div>
              </div>
            ) : (
              <select 
                onChange={(e) => onAssign(task.id, e.target.value)}
                className="w-full bg-white border border-[#FEE2E2] rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#4A3B3B] focus:outline-none focus:ring-2 focus:ring-[#4A3B3B]/10"
              >
                <option value="">{t.assignAgent}</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}
          </div>

          <button className="p-2 text-[#B9AFAF] hover:text-[#4A3B3B] transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
