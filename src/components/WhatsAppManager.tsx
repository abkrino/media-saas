import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  MoreVertical, 
  Send, 
  UserCircle2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Bot,
  User,
  Settings,
  FileText,
  Zap,
  Phone,
  Plus
} from 'lucide-react';
import { WhatsAppConversation, WhatsAppMessage } from '../data';
import { cn } from '../lib/utils';
import { Language, translations } from '../locales';

interface WhatsAppManagerProps {
  key?: string;
  conversations: WhatsAppConversation[];
  onSendMessage: (conversationId: string, text: string) => void;
  language: Language;
}

export function WhatsAppManager({ conversations, onSendMessage, language }: WhatsAppManagerProps) {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'Inbox' | 'Auto Replies' | 'Qualification' | 'Follow-up' | 'Templates'>('Inbox');
  const [selectedConv, setSelectedConv] = useState<WhatsAppConversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showIntelligence, setShowIntelligence] = useState(false);

  const handleSend = () => {
    if (!selectedConv || !messageInput.trim()) return;
    onSendMessage(selectedConv.id, messageInput);
    setMessageInput('');
  };

  const tabs = [
    { id: 'Inbox', label: t.inbox },
    { id: 'Auto Replies', label: t.autoReplies },
    { id: 'Qualification', label: t.qualification },
    { id: 'Follow-up', label: t.followUp },
    { id: 'Templates', label: t.templates }
  ];

  return (
    <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-12rem)] flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#4A3B3B] tracking-tight">{t.whatsappManager}</h2>
          <p className="text-[#B9AFAF] text-xs md:text-sm">{t.whatsappStatus}</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#FEE2E2] rounded-2xl p-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab.id ? "bg-[#4A3B3B] text-white shadow-lg shadow-[#4A3B3B]/10" : "text-[#B9AFAF] hover:text-[#4A3B3B]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-4 md:gap-6 min-h-0 relative">
        {/* Conversations List */}
        <div className={cn(
          "w-full md:w-96 bg-white border border-[#FEE2E2] rounded-[2rem] md:rounded-[2.5rem] flex flex-col overflow-hidden transition-all",
          selectedConv ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 md:p-6 border-b border-[#FEE2E2]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B9AFAF]" />
              <input 
                type="text" 
                placeholder={t.searchConversations}
                className="w-full pl-12 pr-6 py-3 bg-[#FFF5F5]/50 border border-[#FEE2E2] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A3B3B]/10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#FEE2E2]">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={cn(
                  "w-full p-4 md:p-6 text-left hover:bg-[#FFF5F5]/20 transition-colors flex items-start gap-4",
                  selectedConv?.id === conv.id && "bg-[#FFF5F5]/50"
                )}
              >
                <div className="relative">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#FFF5F5] border border-[#FEE2E2] flex items-center justify-center">
                    <UserCircle2 className="w-5 h-5 md:w-6 md:h-6 text-[#4A3B3B]" />
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-rose-500 text-white text-[8px] md:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs md:text-sm font-black text-[#4A3B3B] truncate">{conv.customerName || conv.customerPhone}</h4>
                    <span className="text-[8px] md:text-[10px] font-bold text-[#B9AFAF]">
                      {new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] md:text-xs text-[#B9AFAF] truncate mb-2">{conv.lastMessage}</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#FFF5F5] text-[#4A3B3B] text-[8px] font-black uppercase tracking-widest rounded-full border border-[#FEE2E2]">
                      {conv.intent}
                    </span>
                    <div className="flex items-center gap-1 text-[8px] font-black text-green-600 uppercase tracking-widest">
                      <TrendingUp className="w-2 h-2" />
                      {t.score}: {conv.leadScore}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {conversations.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-sm text-[#B9AFAF]">{t.noConversations}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 bg-white border border-[#FEE2E2] rounded-[2rem] md:rounded-[2.5rem] flex flex-col overflow-hidden transition-all",
          !selectedConv ? "hidden md:flex" : "flex"
        )}>
          {selectedConv ? (
            <>
              <div className="p-4 md:p-6 border-b border-[#FEE2E2] flex items-center justify-between bg-[#FFF5F5]/10">
                <div className="flex items-center gap-3 md:gap-4">
                  <button onClick={() => setSelectedConv(null)} className="md:hidden p-2 -ml-2 text-[#4A3B3B]">
                    <Search className="w-5 h-5 rotate-90" /> {/* Using search as a back arrow for now or similar */}
                  </button>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white border border-[#FEE2E2] flex items-center justify-center">
                    <UserCircle2 className="w-5 h-5 md:w-6 md:h-6 text-[#4A3B3B]" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-black text-[#4A3B3B]">{selectedConv.customerName || selectedConv.customerPhone}</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500" />
                      <span className="text-[8px] md:text-[10px] font-bold text-[#B9AFAF] uppercase tracking-widest">{t.activeNow}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowIntelligence(!showIntelligence)}
                    className="p-2 md:p-3 bg-white border border-[#FEE2E2] rounded-2xl text-[#4A3B3B] hover:bg-[#FFF5F5] transition-colors lg:hidden"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                  <button className="p-2 md:p-3 bg-white border border-[#FEE2E2] rounded-2xl text-[#4A3B3B] hover:bg-[#FFF5F5] transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 bg-[#FFF5F5]/5">
                <div className="flex justify-center">
                  <span className="px-4 py-1 bg-white border border-[#FEE2E2] rounded-full text-[8px] md:text-[10px] font-bold text-[#B9AFAF] uppercase tracking-widest">
                    {t.today}
                  </span>
                </div>
                
                <div className="flex items-start gap-3 md:gap-4 max-w-[90%] md:max-w-[80%]">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF5F5] border border-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[#4A3B3B]" />
                  </div>
                  <div className="bg-white border border-[#FEE2E2] rounded-2xl rounded-tl-none p-3 md:p-4 shadow-sm">
                    <p className="text-xs md:text-sm text-[#4A3B3B] leading-relaxed">{selectedConv.lastMessage}</p>
                    <span className="text-[8px] md:text-[10px] font-bold text-[#B9AFAF] mt-2 block">10:42 AM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4 max-w-[90%] md:max-w-[80%] ml-auto flex-row-reverse">
                  <div className="w-8 h-8 rounded-lg bg-[#4A3B3B] border border-[#4A3B3B] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-[#4A3B3B] text-white rounded-2xl rounded-tr-none p-3 md:p-4 shadow-lg shadow-[#4A3B3B]/10">
                    <p className="text-xs md:text-sm leading-relaxed">
                      {language === 'ar' ? 'أهلاً بيكي! أنا المساعد الذكي لكوزميتيكا. أقدر أساعدك إزاي النهاردة في اختيار المنتجات المناسبة ليكي؟' : "Hello! I'm the AI Assistant for Cosmetica. How can I help you today with our product range?"}
                    </p>
                    <span className="text-[8px] md:text-[10px] font-bold text-white/50 mt-2 block">10:43 AM</span>
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 border-t border-[#FEE2E2] bg-white">
                <div className="flex items-center gap-3 md:gap-4">
                  <button className="p-2 md:p-3 bg-[#FFF5F5] text-[#4A3B3B] rounded-2xl hover:bg-[#FEE2E2] transition-colors">
                    <Zap className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={t.typeMessage}
                      className="w-full pl-4 md:pl-6 pr-12 md:pr-16 py-3 md:py-4 bg-[#FFF5F5]/50 border border-[#FEE2E2] rounded-[2rem] text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#4A3B3B]/10"
                    />
                    <button 
                      onClick={handleSend}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-[#4A3B3B] text-white rounded-full hover:bg-[#2D2424] transition-all"
                    >
                      <Send className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-center justify-center items-center flex-col p-10 md:p-20 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#FFF5F5] rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-[#B9AFAF]" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-[#4A3B3B] mb-2">{t.selectConversation}</h3>
              <p className="text-[#B9AFAF] text-xs md:text-sm max-w-xs">{t.chooseCustomer}</p>
            </div>
          )}
        </div>

        {/* Lead Intelligence Sidebar */}
        <div className={cn(
          "w-full lg:w-80 space-y-6 fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-0 bg-[#FFF9F9] lg:bg-transparent p-6 lg:p-0 transition-all",
          showIntelligence ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          <div className="bg-white border border-[#FEE2E2] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs md:text-sm font-black text-[#4A3B3B] uppercase tracking-widest">{t.leadIntelligence}</h3>
              <button onClick={() => setShowIntelligence(false)} className="lg:hidden p-2">
                <Plus className="w-6 h-6 rotate-45 text-[#8B7E7E]" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest mb-2">{t.intentClassification}</p>
                <div className="flex items-center gap-2 px-4 py-3 bg-[#FFF5F5] border border-[#FEE2E2] rounded-2xl">
                  <Zap className="w-4 h-4 text-[#4A3B3B]" />
                  <span className="text-[10px] md:text-xs font-black text-[#4A3B3B]">{selectedConv?.intent || 'Analyzing...'}</span>
                </div>
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest mb-2">{t.leadScore}</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-[#FEE2E2] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(selectedConv?.leadScore || 0)}%` }}
                      className="h-full bg-green-500"
                    />
                  </div>
                  <span className="text-[10px] md:text-xs font-black text-[#4A3B3B]">{selectedConv?.leadScore || 0}%</span>
                </div>
              </div>
              <div className="pt-6 border-t border-[#FEE2E2]">
                <button className="w-full py-3 md:py-4 bg-[#4A3B3B] text-white rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-[#2D2424] transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {t.approveDraft}
                </button>
                <button className="w-full py-3 md:py-4 mt-3 bg-white border border-[#FEE2E2] text-[#4A3B3B] rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-[#FFF5F5] transition-all flex items-center justify-center gap-2">
                  <UserCircle2 className="w-4 h-4" />
                  {t.handoffToSales}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#2D2424] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-[#FF9A9E]" />
              <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest">{t.aiSuggestion}</h3>
            </div>
            <p className="text-[10px] md:text-xs text-white/70 leading-relaxed mb-6 italic">
              {language === 'ar' 
                ? '"واضح إنها مهتمة بسيروم النضارة. رأيي نبعتلها كود خصم 15% على أول أوردر عشان نشجعها تشتري دلوقتي."'
                : '"The customer seems interested in the Glow Serum. I recommend offering the 15% first-purchase discount to close the sale."'
              }
            </p>
            <button className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#FF9A9E] hover:underline">
              {t.applySuggestion}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
