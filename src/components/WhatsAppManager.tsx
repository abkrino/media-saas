import React, { useState, useEffect } from 'react';
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
  Plus,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { WhatsAppConversation, WhatsAppMessage } from '../data';
import { cn } from '../lib/utils';
import { Language, translations } from '../locales';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  setDoc,
  doc,
  addDoc,
  limit,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';

interface WhatsAppManagerProps {
  key?: string;
  brandId?: string;
  conversations: WhatsAppConversation[];
  onSendMessage: (conversationId: string, text: string) => void;
  language: Language;
}

export function WhatsAppManager({ brandId, conversations, onSendMessage, language }: WhatsAppManagerProps) {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'Inbox' | 'Auto Replies' | 'Qualification' | 'Follow-up' | 'Templates' | 'Settings' | 'Debug'>('Inbox');
  const [selectedConv, setSelectedConv] = useState<WhatsAppConversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [hasChannel, setHasChannel] = useState<boolean | null>(null);
  const [phoneNumberId, setPhoneNumberId] = useState<string>('');
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [allChannels, setAllChannels] = useState<any[]>([]);
  const [manualPhoneId, setManualPhoneId] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const fetchLogs = async () => {
    setWebhookError(null);
    try {
      const q = query(collection(db, "webhook_logs"), orderBy("timestamp", "desc"), limit(20));
      const snap = await getDocFromServer(doc(db, 'test', 'connection')); // Just to check connection
      // We use onSnapshot anyway, but this manual trigger can help
    } catch (e: any) {
      setWebhookError("Connection check failed: " + e.message);
    }
  };
  useEffect(() => {
    if (activeTab !== 'Debug') return;
    setWebhookError(null);
    
    // Listen to logs
    const qLogs = query(
      collection(db, "webhook_logs"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setWebhookLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.error("Webhook Logs Listener Error:", err);
      setWebhookError(err.message);
    });

    // Listen to all channels for this user
    const qChannels = query(
      collection(db, "whatsapp_channels"),
      where("ownerId", "==", auth.currentUser?.uid)
    );
    const unsubChannels = onSnapshot(qChannels, (snap) => {
      setAllChannels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubLogs();
      unsubChannels();
    };
  }, [activeTab]);

  useEffect(() => {
    if (!brandId) return;
    const q = query(
      collection(db, "whatsapp_channels"),
      where("brandId", "==", brandId),
      where("ownerId", "==", auth.currentUser?.uid),
      limit(1)
    );
    return onSnapshot(q, (snap) => {
      setHasChannel(!snap.empty);
      if (!snap.empty) {
        setPhoneNumberId(snap.docs[0].data().phoneNumberId || '');
      }
    }, (err) => {
      console.error("WhatsApp Channels Listener Error:", err);
    });
  }, [brandId]);

  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "whatsapp_messages"),
      where("conversationId", "==", selectedConv.id),
      where("ownerId", "==", auth.currentUser?.uid),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WhatsAppMessage[];
      setMessages(msgs);
    }, (err) => {
      console.error("WhatsApp Messages Listener Error:", err);
    });

    return () => unsubscribe();
  }, [selectedConv]);

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
    { id: 'Templates', label: t.templates },
    { id: 'Settings', label: t.settingsTab },
    { id: 'Debug', label: t.debug }
  ];

  if (!brandId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6 bg-[#FFF9F9]">
        <div className="w-20 h-20 bg-white shadow-xl shadow-[#FF9A9E]/10 rounded-[2rem] flex items-center justify-center border border-[#FEE2E2]">
          <AlertCircle className="w-10 h-10 text-[#FF9A9E]" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-[#4A3B3B]">{t.noBrandSelected || "No Brand Selected"}</h3>
          <p className="text-sm text-[#B9AFAF] max-w-xs mx-auto">
            {language === 'ar' 
              ? "يا ريت تختار براند من القائمة الجانبية عشان تقدر تدير محادثات الواتساب."
              : "Please select a brand from the sidebar to manage WhatsApp conversations."}
          </p>
        </div>
        <div className="p-4 bg-white border border-[#FEE2E2] rounded-2xl text-[10px] font-bold text-[#4A3B3B] max-w-xs">
          <p className="uppercase tracking-widest text-[#B9AFAF] mb-2">Pro Tip</p>
          {language === 'ar'
            ? "لو مش لاقي براندات، اتأكد إنك ضفت براند جديد من شاشة الـ Onboarding."
            : "If you don't see any brands, make sure you've added one during onboarding."}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)] flex flex-col gap-3 md:gap-6 p-2 md:p-0 bg-[#FFF9F9]">
      <div className="sticky top-0 z-30 bg-[#FFF9F9]/80 backdrop-blur-md pb-2 space-y-3 md:space-y-4">
        <div className="px-2 md:px-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-2xl font-black text-[#4A3B3B] tracking-tight">{t.whatsappManager}</h2>
            <div className="flex items-center gap-2">
              <p className="text-[#B9AFAF] text-[10px] md:text-sm">{t.whatsappStatus}</p>
              {hasChannel && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-black uppercase rounded-full border border-green-200">
                  Active: {phoneNumberId.slice(-4)}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="relative group">
          <div className="flex items-center gap-2 bg-white border border-[#FEE2E2] rounded-2xl p-1 overflow-x-auto no-scrollbar shadow-sm">
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
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden rounded-r-2xl" />
        </div>
      </div>

      <div className="flex-1 flex gap-3 md:gap-6 min-h-0 relative">
        {hasChannel === false && activeTab !== 'Settings' && activeTab !== 'Debug' && (
          <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 text-center">
            <div className="max-w-md space-y-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FFF5F5] rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-rose-500" />
              </div>
              <h3 className="text-base md:text-lg font-black text-[#4A3B3B]">WhatsApp Not Configured</h3>
              <p className="text-[10px] md:text-sm text-[#B9AFAF]">
                You need to configure your WhatsApp API credentials for this brand before you can receive messages.
              </p>
              <button 
                onClick={() => setActiveTab('Settings')}
                className="px-6 py-2 bg-[#4A3B3B] text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest"
              >
                Go to Settings
              </button>
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className={cn(
          "w-full md:w-96 bg-white border border-[#FEE2E2] rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col overflow-hidden transition-all",
          (selectedConv || activeTab !== 'Inbox') ? "hidden md:flex" : "flex"
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
                    <h4 className="text-xs md:text-sm font-black text-[#4A3B3B] truncate">{conv.customerName || conv.customerWaId}</h4>
                    <span className="text-[8px] md:text-[10px] font-bold text-[#B9AFAF]">
                      {conv.lastMessageAt?.toDate ? conv.lastMessageAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
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

        {/* Chat Area or Settings Area */}
        <div className={cn(
          "flex-1 bg-white border border-[#FEE2E2] rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col overflow-hidden transition-all",
          (!selectedConv && activeTab === 'Inbox') ? "hidden md:flex" : "flex"
        )}>
          {activeTab === 'Settings' ? (
            <WhatsAppSettings brandId={brandId} />
          ) : activeTab === 'Debug' ? (
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 bg-[#FFF9F9]">
              <div className="bg-white border border-[#FEE2E2] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-black text-[#4A3B3B]">System Diagnostics</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          await addDoc(collection(db, "webhook_logs"), {
                            timestamp: serverTimestamp(),
                            type: "frontend_test",
                            message: "Manual test from frontend",
                            ownerId: auth.currentUser?.uid,
                            brandId: brandId
                          });
                        } catch (e: any) {
                          setWebhookError("Failed to add test log: " + e.message);
                        }
                      }}
                      className="px-3 py-1.5 bg-[#4A3B3B] text-white rounded-lg text-[10px] font-bold hover:bg-[#2D2424] transition-colors flex items-center gap-2"
                    >
                      <Zap className="w-3 h-3" />
                      Test Listener
                    </button>
                  </div>
                </div>
                
                {webhookError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {webhookError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-[10px] md:text-xs">
                  <div className="p-3 bg-[#FFF5F5] rounded-xl border border-[#FEE2E2]/50">
                    <p className="font-bold text-[#B9AFAF] uppercase mb-1">User UID</p>
                    <code className="break-all block">{auth.currentUser?.uid}</code>
                  </div>
                  <div className="p-3 bg-[#FFF5F5] rounded-xl border border-[#FEE2E2]/50">
                    <p className="font-bold text-[#B9AFAF] uppercase mb-1">Brand ID</p>
                    <code className="block">{brandId}</code>
                  </div>
                  <div className="p-3 bg-[#FFF5F5] rounded-xl border border-[#FEE2E2]/50">
                    <p className="font-bold text-[#B9AFAF] uppercase mb-1">Phone Number ID</p>
                    <code className="block">{phoneNumberId || 'Not Configured'}</code>
                  </div>
                  <div className="p-3 bg-[#FFF5F5] rounded-xl border border-[#FEE2E2]/50">
                    <p className="font-bold text-[#B9AFAF] uppercase mb-1">Database ID</p>
                    <code className="block">ai-studio-728a75a1-6bf9-4a4d-8d35-5b0c9b21d9cd</code>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#4A3B3B] uppercase tracking-widest">Manual Channel Registration</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={manualPhoneId}
                      onChange={e => setManualPhoneId(e.target.value)}
                      placeholder="Enter Phone Number ID"
                      className="flex-1 px-4 py-2 bg-[#FFF5F5] border border-[#FEE2E2] rounded-xl text-[10px] focus:outline-none"
                    />
                    <button 
                      onClick={async () => {
                        if (!manualPhoneId.trim()) return;
                        setIsRegistering(true);
                        try {
                          await addDoc(collection(db, "whatsapp_channels"), {
                            brandId,
                            ownerId: auth.currentUser?.uid,
                            phoneNumberId: manualPhoneId.trim(),
                            status: 'Connected',
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                          });
                          setManualPhoneId('');
                        } catch (e: any) {
                          setWebhookError("Manual register failed: " + e.message);
                        } finally {
                          setIsRegistering(false);
                        }
                      }}
                      disabled={isRegistering}
                      className="px-4 py-2 bg-[#4A3B3B] text-white rounded-xl text-[10px] font-bold disabled:opacity-50"
                    >
                      {isRegistering ? '...' : 'Register'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-[#4A3B3B] uppercase tracking-widest">Registered Channels</h4>
                    <span className="text-[8px] text-[#B9AFAF] font-bold">Total: {allChannels.length}</span>
                  </div>
                  {allChannels.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-[10px] font-bold">
                      No WhatsApp channels registered yet. Go to Settings to connect your account.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {allChannels.map(ch => (
                        <div key={ch.id} className="p-3 bg-white border border-[#FEE2E2] rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-[#4A3B3B]">{ch.phoneNumberId}</p>
                            <p className="text-[8px] text-[#B9AFAF] uppercase">Brand: {ch.brandId === brandId ? 'Current' : ch.brandId}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[8px] font-black">{ch.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-[#FEE2E2] rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-black text-[#4A3B3B]">Recent Webhook Events</h3>
                  <button 
                    onClick={fetchLogs}
                    className="p-2 text-[#B9AFAF] hover:text-[#4A3B3B] transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {webhookLogs.length === 0 ? (
                    <div className="text-center py-8 md:py-12 space-y-4">
                      <p className="text-[#B9AFAF] text-xs md:text-sm italic">No events recorded yet.</p>
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-[10px] text-left max-w-sm mx-auto">
                        <p className="font-bold mb-1">Troubleshooting Steps:</p>
                        <ol className="list-decimal ml-4 space-y-1">
                          <li>Send a message from WhatsApp to your Business number.</li>
                          <li>Check if "webhook_logs" collection exists in Firestore.</li>
                          <li>Verify the Webhook URL in Meta is exactly: <br/><code className="break-all">https://whatsappwebhook-f7svd6bv2q-uc.a.run.app</code></li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    webhookLogs.map((log) => (
                      <div key={log.id} className="p-3 md:p-4 bg-[#FFF5F5] rounded-xl md:rounded-2xl space-y-2 border border-[#FEE2E2]">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                              log.type === 'raw_event' ? "bg-blue-100 text-blue-700" : 
                              log.type === 'error' ? "bg-rose-100 text-rose-700" :
                              log.type === 'frontend_test' ? "bg-purple-100 text-purple-700" :
                              "bg-green-100 text-green-700"
                            )}>
                              {log.type}
                            </span>
                            {log.phoneNumberId && !allChannels.some(ch => ch.phoneNumberId === log.phoneNumberId) && (
                              <button 
                                onClick={async () => {
                                  try {
                                    await addDoc(collection(db, "whatsapp_channels"), {
                                      brandId,
                                      ownerId: auth.currentUser?.uid,
                                      phoneNumberId: log.phoneNumberId,
                                      status: 'Connected',
                                      createdAt: serverTimestamp(),
                                      updatedAt: serverTimestamp()
                                    });
                                  } catch (e: any) {
                                    setWebhookError("Quick register failed: " + e.message);
                                  }
                                }}
                                className="px-2 py-0.5 bg-[#4A3B3B] text-white rounded text-[8px] font-black uppercase hover:bg-black transition-colors"
                              >
                                Quick Register ID
                              </button>
                            )}
                          </div>
                          <span className="text-[8px] font-bold text-[#B9AFAF]">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                          </span>
                        </div>
                        {log.message && <p className="text-[10px] font-bold text-[#4A3B3B]">{log.message}</p>}
                        <pre className="text-[8px] md:text-[9px] overflow-x-auto p-2 md:p-3 bg-white border border-[#FEE2E2] rounded-lg md:rounded-xl font-mono text-[#4A3B3B]">
                          {JSON.stringify(log, (key, value) => key === 'timestamp' ? undefined : value, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : selectedConv ? (
            <>
              <div className="p-4 md:p-6 border-b border-[#FEE2E2] flex items-center justify-between bg-[#FFF5F5]/10">
                <div className="flex items-center gap-3 md:gap-4">
                  <button onClick={() => setSelectedConv(null)} className="md:hidden p-2 -ml-2 text-[#4A3B3B]">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white border border-[#FEE2E2] flex items-center justify-center">
                    <UserCircle2 className="w-5 h-5 md:w-6 md:h-6 text-[#4A3B3B]" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-black text-[#4A3B3B]">{selectedConv.customerName || selectedConv.customerWaId}</h3>
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
                
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex items-start gap-3 md:gap-4 max-w-[90%] md:max-w-[80%]",
                      msg.direction === 'outbound' ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border",
                      msg.direction === 'outbound' ? "bg-[#4A3B3B] border-[#4A3B3B]" : "bg-[#FFF5F5] border-[#FEE2E2]"
                    )}>
                      {msg.direction === 'outbound' ? (
                        <Bot className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-[#4A3B3B]" />
                      )}
                    </div>
                    <div className={cn(
                      "rounded-2xl p-3 md:p-4 shadow-sm border",
                      msg.direction === 'outbound' 
                        ? "bg-[#4A3B3B] text-white rounded-tr-none border-[#4A3B3B] shadow-lg shadow-[#4A3B3B]/10" 
                        : "bg-white text-[#4A3B3B] rounded-tl-none border-[#FEE2E2]"
                    )}>
                      <p className="text-xs md:text-sm leading-relaxed">{msg.content}</p>
                      <span className={cn(
                        "text-[8px] md:text-[10px] font-bold mt-2 block",
                        msg.direction === 'outbound' ? "text-white/50" : "text-[#B9AFAF]"
                      )}>
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      </span>
                    </div>
                  </div>
                ))}

                {messages.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-xs text-[#B9AFAF]">No messages yet.</p>
                  </div>
                )}
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

function WhatsAppSettings({ brandId }: { brandId?: string }) {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [channel, setChannel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!brandId) return;
    const q = query(
      collection(db, "whatsapp_channels"),
      where("brandId", "==", brandId),
      where("ownerId", "==", auth.currentUser?.uid),
      limit(1)
    );
    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setChannel({ id: snap.docs[0].id, ...data });
        setPhoneNumberId(data.phoneNumberId || '');
        setAccessToken(data.accessToken || '');
        setWabaId(data.wabaId || '');
      }
    }, (err) => {
      console.error("WhatsApp Settings Listener Error:", err);
    });
  }, [brandId]);

  const handleSave = async () => {
    if (!brandId || !auth.currentUser) return;
    
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const data = {
        brandId,
        ownerId: auth.currentUser.uid,
        phoneNumberId: phoneNumberId.trim(),
        accessToken: accessToken.trim(),
        wabaId: wabaId.trim(),
        status: 'Connected',
        updatedAt: serverTimestamp()
      };

      if (channel) {
        await setDoc(doc(db, 'whatsapp_channels', channel.id), data, { merge: true });
      } else {
        await addDoc(collection(db, 'whatsapp_channels'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-8 overflow-y-auto">
      <div>
        <h3 className="text-base md:text-xl font-black text-[#4A3B3B] mb-1 md:mb-2">WhatsApp API Configuration</h3>
        <p className="text-[10px] md:text-sm text-[#B9AFAF]">Connect your WhatsApp Business Account using Meta Graph API credentials.</p>
      </div>

      <div className="space-y-4 md:space-y-6 max-w-xl">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest ml-2 md:ml-4">Phone Number ID</label>
          <input 
            type="text" 
            value={phoneNumberId}
            onChange={e => setPhoneNumberId(e.target.value)}
            placeholder="e.g. 105938475629384"
            className="w-full px-4 md:px-6 py-3 md:py-4 bg-[#FFF5F5]/50 border border-[#FEE2E2] rounded-xl md:rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#4A3B3B]/10"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest ml-2 md:ml-4">System User Access Token</label>
          <input 
            type="password" 
            value={accessToken}
            onChange={e => setAccessToken(e.target.value)}
            placeholder="EAAB..."
            className="w-full px-4 md:px-6 py-3 md:py-4 bg-[#FFF5F5]/50 border border-[#FEE2E2] rounded-xl md:rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#4A3B3B]/10"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest ml-2 md:ml-4">WhatsApp Business Account ID</label>
          <input 
            type="text" 
            value={wabaId}
            onChange={e => setWabaId(e.target.value)}
            placeholder="e.g. 938475629384756"
            className="w-full px-4 md:px-6 py-3 md:py-4 bg-[#FFF5F5]/50 border border-[#FEE2E2] rounded-xl md:rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#4A3B3B]/10"
          />
        </div>

        <div className="pt-2 md:pt-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "w-full py-3 md:py-4 text-white rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50",
              saveSuccess ? "bg-green-600" : "bg-[#4A3B3B] hover:bg-[#2D2424]"
            )}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
            {saveSuccess ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      </div>

      <div className="bg-[#FFF5F5] border border-[#FEE2E2] rounded-2xl md:rounded-[2rem] p-4 md:p-8">
        <h4 className="text-[10px] md:text-xs font-black text-[#4A3B3B] uppercase tracking-widest mb-3 md:mb-4">Webhook Information</h4>
        <div className="space-y-3 md:space-y-4">
          <div>
            <p className="text-[8px] md:text-[10px] font-bold text-[#B9AFAF] uppercase mb-1">Callback URL</p>
            <code className="block p-2 md:p-3 bg-white border border-[#FEE2E2] rounded-lg md:rounded-xl text-[8px] md:text-[10px] break-all">
              https://whatsappwebhook-f7svd6bv2q-uc.a.run.app
            </code>
          </div>
          <div>
            <p className="text-[8px] md:text-[10px] font-bold text-[#B9AFAF] uppercase mb-1">Verify Token</p>
            <code className="block p-2 md:p-3 bg-white border border-[#FEE2E2] rounded-lg md:rounded-xl text-[8px] md:text-[10px]">
              abqarino_verify_token
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
