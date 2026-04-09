import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Video, 
  Lightbulb, 
  Zap, 
  Copy, 
  Check, 
  Search, 
  Filter,
  Instagram,
  Facebook,
  Smartphone,
  Plus,
  Loader2,
  RefreshCw,
  Send,
  Clock,
  Hash,
  MessageSquare,
  HelpCircle,
  Target,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Layers,
  LayoutDashboard,
  Inbox,
  Palette,
  Clapperboard,
  BarChart3,
  UserCircle2,
  Rocket,
  ArrowRight,
  Building2,
  Calendar,
  Eye,
  Settings,
  Briefcase,
  LogOut,
  Upload,
  Globe,
  Youtube,
  Share2,
  ChevronRight,
  MoreVertical,
  Trash2,
  FileText,
  Image as ImageIcon,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ItemStatus,
  Brand,
  BrandResearch,
  Asset,
  ConnectedChannel,
  PublishingJob,
  AIAgent,
  AgentTask,
  WhatsAppConversation,
  WhatsAppMessage,
  Deliverable,
  CampaignBrief
} from './data';
import { AITeam } from './components/AITeam';
import { OperationsInbox } from './components/OperationsInbox';
import { WhatsAppManager } from './components/WhatsAppManager';
import { auth, db, storage } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import { Language, translations } from './locales';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't throw here to avoid crashing the app, but we log it as required
}

import { startAllAgentListeners } from './services/agentOrchestrator';

type ViewType = 'dashboard' | 'onboarding' | 'research' | 'assets' | 'channels' | 'publishing' | 'settings' | 'ai-team' | 'inbox' | 'whatsapp';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [research, setResearch] = useState<BrandResearch | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [channels, setChannels] = useState<ConnectedChannel[]>([]);
  const [jobs, setJobs] = useState<PublishingJob[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [activeBrief, setActiveBrief] = useState<CampaignBrief | null>(null);
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const t = translations[language];

  const bootstrapAgents = async (uid: string) => {
    const initialAgents: Partial<AIAgent>[] = [
      { name: 'CEO Agent', role: 'Strategic Oversight', status: 'Idle', tasksCompleted: 0, lastUpdate: new Date().toISOString() },
      { name: 'Brand Research Agent', role: 'Market Analysis', status: 'Idle', tasksCompleted: 0, lastUpdate: new Date().toISOString() },
      { name: 'Content Strategist', role: 'Creative Planning', status: 'Idle', tasksCompleted: 0, lastUpdate: new Date().toISOString() },
      { name: 'Creative Director', role: 'Visual Identity', status: 'Idle', tasksCompleted: 0, lastUpdate: new Date().toISOString() },
      { name: 'Video Producer', role: 'Motion Content', status: 'Idle', tasksCompleted: 0, lastUpdate: new Date().toISOString() },
      { name: 'Media Buyer', role: 'Ad Performance', status: 'Idle', tasksCompleted: 0, lastUpdate: new Date().toISOString() },
      { name: 'WhatsApp Sales Manager', role: 'Lead Conversion', status: 'Idle', tasksCompleted: 0, lastUpdate: new Date().toISOString() }
    ];

    for (const agent of initialAgents) {
      await addDoc(collection(db, 'ai_agents'), { ...agent, ownerId: uid });
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (!u) {
        setBrands([]);
        setActiveBrand(null);
      }
    });
    return unsubscribe;
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    const brandsQuery = query(collection(db, 'brands'), where('ownerId', '==', user.uid));
    const unsubBrands = onSnapshot(brandsQuery, (snap) => {
      const bList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Brand));
      setBrands(bList);
      if (bList.length > 0 && !activeBrand) {
        setActiveBrand(bList[0]);
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'brands'));

    const agentsQuery = query(collection(db, 'ai_agents'), where('ownerId', '==', user.uid));
    const unsubAgents = onSnapshot(agentsQuery, (snap) => {
      const aList = snap.docs.map(d => ({ id: d.id, ...d.data() } as AIAgent));
      if (aList.length === 0 && !loading) {
        bootstrapAgents(user.uid);
      }
      setAgents(aList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'ai_agents'));

    const tasksQuery = query(collection(db, 'agent_tasks'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as AgentTask)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'agent_tasks'));

    const convsQuery = query(collection(db, 'whatsapp_conversations'), where('ownerId', '==', user.uid), orderBy('lastTimestamp', 'desc'));
    const unsubConvs = onSnapshot(convsQuery, (snap) => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() } as WhatsAppConversation)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'whatsapp_conversations'));

    const deliverablesQuery = query(collection(db, 'deliverables'), where('ownerId', '==', user.uid), orderBy('updatedAt', 'desc'));
    const unsubDeliverables = onSnapshot(deliverablesQuery, (snap) => {
      setDeliverables(snap.docs.map(d => ({ id: d.id, ...d.data() } as Deliverable)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'deliverables'));

    const briefsQuery = query(
      collection(db, 'campaign_briefs'), 
      where('ownerId', '==', user.uid), 
      where('status', 'in', ['draft', 'approved']),
      orderBy('createdAt', 'desc')
    );
    const unsubBriefs = onSnapshot(briefsQuery, (snap) => {
      const bList = snap.docs.map(d => ({ id: d.id, ...d.data() } as CampaignBrief));
      setActiveBrief(bList[0] || null);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'campaign_briefs'));

    // Start AI Agent Listeners
    const stopAgentListeners = startAllAgentListeners(user.uid);

    return () => {
      unsubBrands();
      unsubAgents();
      unsubTasks();
      unsubConvs();
      unsubDeliverables();
      unsubBriefs();
      stopAgentListeners();
    };
  }, [user]);

  useEffect(() => {
    if (!activeBrand) return;

    const researchRef = doc(db, 'brand_research', activeBrand.id);
    const unsubResearch = onSnapshot(researchRef, (doc) => {
      if (doc.exists()) {
        setResearch(doc.data() as BrandResearch);
      } else {
        setResearch(null);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `brand_research/${activeBrand.id}`));

    const assetsQuery = query(
      collection(db, 'brand_assets'), 
      where('brandId', '==', activeBrand.id),
      where('ownerId', '==', user.uid)
    );
    const unsubAssets = onSnapshot(assetsQuery, (snap) => {
      setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'brand_assets'));

    const channelsQuery = query(
      collection(db, 'connected_channels'), 
      where('brandId', '==', activeBrand.id),
      where('ownerId', '==', user.uid)
    );
    const unsubChannels = onSnapshot(channelsQuery, (snap) => {
      setChannels(snap.docs.map(d => ({ id: d.id, ...d.data() } as ConnectedChannel)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'connected_channels'));

    const jobsQuery = query(
      collection(db, 'publishing_jobs'), 
      where('brandId', '==', activeBrand.id),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubJobs = onSnapshot(jobsQuery, (snap) => {
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as PublishingJob)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'publishing_jobs'));

    return () => {
      unsubResearch();
      unsubAssets();
      unsubChannels();
      unsubJobs();
    };
  }, [activeBrand]);

  const handleLogin = async () => {
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError(language === 'ar' ? 'تم حظر النافذة المنبثقة. يرجى السماح بالمنبثقات في إعدادات المتصفح.' : 'Popup blocked. Please allow popups in your browser settings.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setLoginError(language === 'ar' ? 'تم إغلاق نافذة تسجيل الدخول.' : 'Login window was closed.');
      } else {
        setLoginError(language === 'ar' ? 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.' : 'Login failed. Please try again.');
      }
    }
  };

  const handleLogout = () => signOut(auth);

  if (!isAuthReady) return <LoadingScreen />;

  if (!user) return <LoginScreen onLogin={handleLogin} error={loginError} language={language} />;

  if (brands.length === 0 && activeView !== 'onboarding') {
    return <EmptyState onStart={() => setActiveView('onboarding')} />;
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-[#FEE2E2] p-4 flex items-center justify-between sticky top-0 z-30" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#FF9A9E] to-[#FAD0C4] rounded-lg flex items-center justify-center shadow-md">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-[#2D2424] text-lg tracking-tight">Cosmetica</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="px-2 py-1 bg-[#FFF5F5] border border-[#FEE2E2] rounded-lg text-[10px] font-black text-[#4A3B3B] uppercase tracking-widest"
          >
            {language === 'en' ? 'AR' : 'EN'}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#4A3B3B] hover:bg-[#FDF2F2] rounded-xl transition-all"
          >
            {isMobileMenuOpen ? <Plus className="w-6 h-6 rotate-45" /> : <Layers className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-0 z-40 bg-white border-r border-[#FEE2E2] flex flex-col transition-transform duration-300 md:relative md:translate-x-0 md:w-72 md:h-screen md:sticky md:top-0",
        isMobileMenuOpen 
          ? "translate-x-0" 
          : (language === 'ar' ? "translate-x-full" : "-translate-x-full")
      )} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="p-8 border-b border-[#FEE2E2] hidden md:block">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF9A9E] to-[#FAD0C4] rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <span className="font-black text-[#2D2424] text-xl tracking-tight">Cosmetica</span>
            </div>
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="px-2 py-1 bg-[#FFF5F5] border border-[#FEE2E2] rounded-lg text-[10px] font-black text-[#4A3B3B] uppercase tracking-widest hover:bg-[#FEE2E2] transition-all"
            >
              {language === 'en' ? 'AR' : 'EN'}
            </button>
          </div>
          
          {activeBrand && (
            <div className="relative group">
              <button className="w-full flex items-center justify-between p-3 bg-[#FDF2F2] rounded-2xl hover:bg-[#FEE2E2] transition-all">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[#FFD1D1]">
                    <Building2 className="w-4 h-4 text-[#FF9A9E]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#2D2424] truncate w-32">{activeBrand.name}</p>
                    <p className="text-[10px] text-[#B9AFAF] font-bold uppercase">{activeBrand.niche}</p>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-[#B9AFAF]" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Sidebar Header */}
        <div className="md:hidden p-6 border-b border-[#FEE2E2] flex items-center justify-between">
          <h2 className="font-black text-[#2D2424]">{t.agencyOS}</h2>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
            <Plus className="w-6 h-6 rotate-45 text-[#8B7E7E]" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="px-4 text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest mb-4 hidden md:block">{t.agencyOS}</p>
          
          <NavItem active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setIsMobileMenuOpen(false); }} icon={LayoutDashboard} label={t.dashboard} />
          <NavItem active={activeView === 'inbox'} onClick={() => { setActiveView('inbox'); setIsMobileMenuOpen(false); }} icon={Inbox} label={t.inbox} />
          <NavItem active={activeView === 'ai-team'} onClick={() => { setActiveView('ai-team'); setIsMobileMenuOpen(false); }} icon={UserCircle2} label={t.aiTeam} />
          
          <p className="px-4 text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest mt-8 mb-4">{t.departments}</p>
          <NavItem active={activeView === 'whatsapp'} onClick={() => { setActiveView('whatsapp'); setIsMobileMenuOpen(false); }} icon={MessageSquare} label={t.whatsapp} />
          <NavItem active={activeView === 'research'} onClick={() => { setActiveView('research'); setIsMobileMenuOpen(false); }} icon={Search} label={t.research} />
          <NavItem active={activeView === 'assets'} onClick={() => { setActiveView('assets'); setIsMobileMenuOpen(false); }} icon={Layers} label={t.assets} />
          <NavItem active={activeView === 'channels'} onClick={() => { setActiveView('channels'); setIsMobileMenuOpen(false); }} icon={Globe} label={t.channels} />
          <NavItem active={activeView === 'publishing'} onClick={() => { setActiveView('publishing'); setIsMobileMenuOpen(false); }} icon={Send} label={t.publishing} />
          
          <div className="pt-8">
            <p className="px-4 text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest mb-4">{t.settings}</p>
            <NavItem active={activeView === 'settings'} onClick={() => { setActiveView('settings'); setIsMobileMenuOpen(false); }} icon={Settings} label={t.settings} />
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 text-[#8B7E7E] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all text-sm font-bold"
            >
              <LogOut className="w-4 h-4" />
              {t.logout}
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-[#FEE2E2]">
          <div className="flex items-center gap-3">
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border-2 border-[#FFD1D1]" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-[#2D2424] truncate">{user.displayName}</p>
              <p className="text-[10px] text-[#B9AFAF] font-bold truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("flex-1 overflow-y-auto min-h-screen", language === 'ar' ? "font-sans" : "")} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && <DashboardView key="dash" brand={activeBrand} research={research} assets={assets} jobs={jobs} agents={agents} tasks={tasks} conversations={conversations} language={language} />}
          {activeView === 'onboarding' && <OnboardingView key="onboard" user={user} onComplete={() => setActiveView('dashboard')} language={language} />}
          {activeView === 'ai-team' && (
            <AITeam 
              key="team" 
              agents={agents} 
              deliverables={deliverables}
              activeBrief={activeBrief}
              onAssignTask={(agent) => setActiveView('inbox')} 
              language={language} 
              userId={user.uid}
              brandId={activeBrand?.id || ''}
            />
          )}
          {activeView === 'inbox' && <OperationsInbox key="inbox" tasks={tasks} agents={agents} onAssign={async (tid, aid) => {
            await setDoc(doc(db, 'agent_tasks', tid), { assignedTo: aid, status: 'In Progress' }, { merge: true });
            await setDoc(doc(db, 'ai_agents', aid), { status: 'Working', activeTask: tasks.find(t => t.id === tid)?.title }, { merge: true });
          }} language={language} />}
          {activeView === 'whatsapp' && <WhatsAppManager key="wa" conversations={conversations} onSendMessage={async (cid, text) => {
            await addDoc(collection(db, 'whatsapp_messages'), {
              conversationId: cid,
              text,
              sender: 'Agent',
              timestamp: new Date().toISOString(),
              status: 'Sent',
              ownerId: user.uid
            });
            await setDoc(doc(db, 'whatsapp_conversations', cid), {
              lastMessage: text,
              lastTimestamp: new Date().toISOString(),
              unreadCount: 0
            }, { merge: true });
          }} language={language} />}
          {activeView === 'research' && <ResearchView key="research" brand={activeBrand} research={research} />}
          {activeView === 'assets' && <AssetManagerView key="assets" brand={activeBrand} assets={assets} />}
          {activeView === 'channels' && <ChannelsView key="channels" brand={activeBrand} channels={channels} />}
          {activeView === 'publishing' && <PublishingView key="pub" brand={activeBrand} assets={assets} channels={channels} jobs={jobs} />}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden bg-white border-t border-[#FEE2E2] px-6 py-3 flex items-center justify-between sticky bottom-0 z-30 shadow-lg">
        <button onClick={() => setActiveView('dashboard')} className={cn("p-2 rounded-xl transition-all", activeView === 'dashboard' ? "bg-[#2D2424] text-white" : "text-[#8B7E7E]")}>
          <LayoutDashboard className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveView('whatsapp')} className={cn("p-2 rounded-xl transition-all", activeView === 'whatsapp' ? "bg-[#2D2424] text-white" : "text-[#8B7E7E]")}>
          <MessageSquare className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveView('inbox')} className={cn("p-2 rounded-xl transition-all", activeView === 'inbox' ? "bg-[#2D2424] text-white" : "text-[#8B7E7E]")}>
          <Inbox className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveView('ai-team')} className={cn("p-2 rounded-xl transition-all", activeView === 'ai-team' ? "bg-[#2D2424] text-white" : "text-[#8B7E7E]")}>
          <UserCircle2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function NavItem({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-left group",
        active 
          ? "bg-[#2D2424] text-white shadow-lg shadow-[#2D2424]/10" 
          : "text-[#8B7E7E] hover:bg-[#FDF2F2] hover:text-[#4A3B3B]"
      )}
    >
      <Icon className={cn("w-4 h-4", active ? "text-white" : "text-[#FF9A9E]")} />
      <span className="text-sm font-bold">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 bg-[#FF9A9E] rounded-full" />}
    </button>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-[#FFD1D1] border-t-[#FF9A9E] rounded-full mb-4"
      />
      <p className="text-[#8B7E7E] font-bold animate-pulse">Initializing Agency OS...</p>
    </div>
  );
}

function LoginScreen({ onLogin, error, language }: { onLogin: () => void, error: string | null, language: Language }) {
  return (
    <div className="min-h-screen bg-[#FFF9F9] flex items-center justify-center p-4 md:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-[#FF9A9E]/10 border border-[#FEE2E2] text-center"
      >
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#FF9A9E] to-[#FAD0C4] rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-lg mx-auto mb-6 md:mb-8">
          <Sparkles className="text-white w-8 h-8 md:w-10 md:h-10" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[#2D2424] mb-3 md:mb-4">Cosmetica</h1>
        <p className="text-sm md:text-base text-[#8B7E7E] mb-8 md:mb-10 leading-relaxed">
          {language === 'ar' ? 'نظام التشغيل المتكامل لبراندات التجميل ووكالات التسويق.' : 'The ultimate operating system for cosmetics brands and marketing agencies.'}
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs md:text-sm font-bold">
            {error}
          </div>
        )}

        <button 
          onClick={onLogin}
          className="w-full py-4 md:py-5 bg-[#2D2424] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#4A3B3B] transition-all shadow-xl shadow-[#2D2424]/20"
        >
          <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
          {language === 'ar' ? 'تسجيل الدخول باستخدام جوجل' : 'Sign in with Google'}
        </button>

        <p className="mt-6 md:mt-8 text-[8px] md:text-[10px] text-[#B9AFAF] font-bold uppercase tracking-widest">
          {language === 'ar' ? 'نصيحة لمستخدمي آيفون: تأكد من السماح بالنوافذ المنبثقة في إعدادات سفاري.' : 'Tip for iPhone users: Ensure popups are allowed in Safari settings.'}
        </p>
      </motion.div>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-[#FFF9F9] flex items-center justify-center p-4 md:p-6">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-[#FF9A9E]/10 border border-[#FEE2E2] mx-auto mb-6 md:mb-8">
          <Building2 className="w-8 h-8 md:w-10 md:h-10 text-[#FF9A9E]" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-[#2D2424] mb-3 md:mb-4">No Brands Found</h2>
        <p className="text-sm md:text-base text-[#8B7E7E] mb-8 md:mb-10">It looks like you haven't onboarded any brands yet. Let's start by creating your first brand workspace.</p>
        <button 
          onClick={onStart}
          className="w-full sm:w-auto px-10 py-4 md:py-5 bg-[#2D2424] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#4A3B3B] transition-all mx-auto shadow-xl shadow-[#2D2424]/20"
        >
          <Plus className="w-6 h-6" />
          Onboard New Brand
        </button>
      </div>
    </div>
  );
}

// --- View Components ---

function DashboardView({ brand, research, assets, jobs, agents, tasks, conversations, language }: { key?: string, brand: any, research: any, assets: any, jobs: any, agents: AIAgent[], tasks: AgentTask[], conversations: WhatsAppConversation[], language: Language }) {
  const t = translations[language];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-10 space-y-6 md:space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#4A3B3B] tracking-tight">{t.commandCenter}</h2>
          <p className="text-[#B9AFAF] text-xs md:text-sm font-medium">{t.overview} <span className="text-[#4A3B3B] font-bold">{brand?.name}</span></p>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-white border border-[#FEE2E2] rounded-2xl shadow-sm">
            <p className="text-[8px] md:text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest mb-1">{t.activeAgents}</p>
            <p className="text-lg md:text-xl font-black text-[#4A3B3B]">{agents.filter(a => a.status === 'Working').length}/{agents.length}</p>
          </div>
          <div className="flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 bg-white border border-[#FEE2E2] rounded-2xl shadow-sm">
            <p className="text-[8px] md:text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest mb-1">{t.pendingTasks}</p>
            <p className="text-lg md:text-xl font-black text-[#4A3B3B]">{tasks.filter(t => t.status === 'Pending').length}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Team Status Board */}
        <div className="lg:col-span-3 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <section className="bg-white border border-[#FEE2E2] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h3 className="text-base md:text-lg font-black text-[#4A3B3B]">{t.teamStatus}</h3>
                <Zap className="w-5 h-5 text-[#4A3B3B]" />
              </div>
              <div className="space-y-3 md:space-y-4">
                {agents.slice(0, 4).map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 md:p-4 bg-[#FFF5F5] rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#FEE2E2] flex items-center justify-center">
                        <UserCircle2 className="w-4 h-4 text-[#4A3B3B]" />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs font-black text-[#4A3B3B]">
                          {t[agent.name.toLowerCase().replace(/\s+/g, '') as keyof typeof t] || agent.name}
                        </p>
                        <p className="text-[8px] md:text-[10px] font-bold text-[#B9AFAF] uppercase tracking-widest">{t[agent.status.toLowerCase().replace(' ', '') as keyof typeof t] || agent.status}</p>
                      </div>
                    </div>
                    {agent.status === 'Working' && (
                      <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-blue-500" 
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-[#FEE2E2] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h3 className="text-base md:text-lg font-black text-[#4A3B3B]">{t.whatsappLeads}</h3>
                <MessageSquare className="w-5 h-5 text-[#4A3B3B]" />
              </div>
              <div className="space-y-3 md:space-y-4">
                {conversations.slice(0, 4).map((conv) => (
                  <div key={conv.id} className="flex items-center justify-between p-3 md:p-4 bg-[#FFF5F5] rounded-2xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                        <UserCircle2 className="w-4 h-4 text-[#4A3B3B]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] md:text-xs font-black text-[#4A3B3B] truncate">{conv.customerName || conv.customerPhone}</p>
                        <p className="text-[8px] md:text-[10px] font-bold text-[#B9AFAF] uppercase tracking-widest truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                    <span className="text-[8px] md:text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full">{conv.leadScore}%</span>
                  </div>
                ))}
                {conversations.length === 0 && <p className="text-center text-[#B9AFAF] py-10 text-[10px] md:text-xs">No active leads</p>}
              </div>
            </section>
          </div>

          <section className="bg-white border border-[#FEE2E2] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h3 className="text-base md:text-lg font-black text-[#4A3B3B]">{t.taskQueue}</h3>
              <button className="text-[10px] md:text-xs font-black text-[#4A3B3B] uppercase tracking-widest hover:underline">View Inbox</button>
            </div>
            <div className="space-y-3 md:space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 md:p-4 border border-[#FEE2E2] rounded-2xl hover:bg-[#FFF5F5] transition-colors">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FFF5F5] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#4A3B3B]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-sm font-black text-[#4A3B3B] truncate">{task.title}</p>
                      <p className="text-[8px] md:text-[10px] font-bold text-[#B9AFAF] uppercase tracking-widest truncate">
                        {t[task.type.toLowerCase() as keyof typeof t] || task.type} • {t[task.priority.toLowerCase() as keyof typeof t] || task.priority}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest flex-shrink-0",
                    task.status === 'Completed' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {t[task.status.toLowerCase().replace(' ', '') as keyof typeof t] || task.status}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-center text-[#B9AFAF] py-10 text-[10px] md:text-xs">Queue is clear</p>}
            </div>
          </section>
        </div>

        {/* Activity Feed Sidebar */}
        <aside className="space-y-6 md:space-y-8">
          <div className="bg-[#2D2424] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white">
            <h3 className="text-base md:text-lg font-black mb-6 md:mb-8">{t.activity}</h3>
            <div className="space-y-6">
              {agents.filter(a => a.status === 'Working').map((agent) => (
                <div key={agent.id} className="relative pl-6 border-l border-white/10">
                  <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-[#FF9A9E]" />
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#FF9A9E] mb-1">
                    {t[agent.name.toLowerCase().replace(/\s+/g, '') as keyof typeof t] || agent.name}
                  </p>
                  <p className="text-[10px] md:text-xs text-white/70 leading-relaxed">{agent.activeTask}</p>
                  <p className="text-[8px] font-bold text-white/30 mt-2 uppercase tracking-widest">Just now</p>
                </div>
              ))}
              {agents.filter(a => a.status === 'Working').length === 0 && (
                <p className="text-[10px] md:text-xs text-white/40 italic">No active operations...</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#FEE2E2] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
            <h3 className="text-base md:text-lg font-black text-[#4A3B3B] mb-6 md:mb-8">{t.quickActions}</h3>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <button className="p-3 md:p-4 bg-[#FFF5F5] rounded-2xl text-center hover:bg-[#FEE2E2] transition-colors">
                <Plus className="w-4 h-4 md:w-5 md:h-5 text-[#4A3B3B] mx-auto mb-2" />
                <span className="text-[8px] md:text-[10px] font-black text-[#4A3B3B] uppercase tracking-widest">{t.newTask}</span>
              </button>
              <button className="p-3 md:p-4 bg-[#FFF5F5] rounded-2xl text-center hover:bg-[#FEE2E2] transition-colors">
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-[#4A3B3B] mx-auto mb-2" />
                <span className="text-[8px] md:text-[10px] font-black text-[#4A3B3B] uppercase tracking-widest">{t.broadcast}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

function OnboardingView({ user, onComplete, language }: { key?: string, user: User, onComplete: () => void, language: Language }) {
  const t = translations[language];
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    niche: 'Cosmetics',
    market: 'Egypt',
    website: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    competitors: '',
    brandVoice: {
      language: language === 'ar' ? 'ar-eg' : 'en' as 'en' | 'ar-eg',
      tone: 'friendly' as 'friendly' | 'premium' | 'expert',
      description: ''
    },
    targetAudience: '',
    mainProducts: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save Brand
      const brandRef = await addDoc(collection(db, 'brands'), {
        ...formData,
        competitors: formData.competitors.split(',').map(s => s.trim()),
        mainProducts: formData.mainProducts.split(',').map(s => s.trim()),
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
        assetUrls: []
      });

      // 2. Trigger AI Research
      const researchPrompt = `Act as a senior marketing strategist. Perform deep research for this brand:
      Brand: ${formData.name}
      Niche: ${formData.niche}
      Market: ${formData.market}
      Website: ${formData.website}
      Competitors: ${formData.competitors}
      Products: ${formData.mainProducts}
      Brand Voice Language: ${formData.brandVoice.language}
      Brand Voice Tone: ${formData.brandVoice.tone}
      
      Output a JSON object. All text fields in the JSON must be in ${formData.brandVoice.language === 'ar-eg' ? 'Egyptian Arabic dialect (Ammiya)' : 'English'}.
      If Egyptian Arabic, use a natural, friendly, and conversational tone. Avoid formal Arabic.
      
      {
        "summary": "...",
        "positioning": "...",
        "audienceInsights": "...",
        "toneOfVoice": "...",
        "visualDirection": "...",
        "competitorNotes": "...",
        "contentOpportunities": ["...", "..."],
        "campaignAngle": "...",
        "recommendedOffer": "..."
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: researchPrompt,
        config: { responseMimeType: "application/json" }
      });

      const researchData = JSON.parse(response.text || '{}');
      await setDoc(doc(db, 'brand_research', brandRef.id), {
        brandId: brandRef.id,
        ownerId: user.uid,
        ...researchData,
        updatedAt: new Date().toISOString()
      });

      onComplete();
    } catch (error) {
      console.error("Onboarding failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-10 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-2xl shadow-[#FF9A9E]/10 border border-[#FEE2E2]"
      >
        <div className="mb-8 md:mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl md:text-3xl font-black text-[#2D2424]">{t.onboardBrand}</h2>
            <span className="text-[10px] md:text-xs font-black text-[#FF9A9E] uppercase tracking-widest">{t.step} {step} {t.of} 3</span>
          </div>
          <div className="w-full h-1.5 bg-[#FDF2F2] rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(step/3)*100}%` }} className="h-full bg-[#FF9A9E]" />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Input label={t.brandName} value={formData.name} onChange={v => setFormData({...formData, name: v})} placeholder="e.g. Glow & Co" />
              <Input label={t.niche} value={formData.niche} onChange={v => setFormData({...formData, niche: v})} placeholder="e.g. Skincare" />
            </div>
            <Input label={t.market} value={formData.market} onChange={v => setFormData({...formData, market: v})} placeholder="e.g. Egypt" />
            <Input label={t.website} value={formData.website} onChange={v => setFormData({...formData, website: v})} placeholder="https://..." />
            <button onClick={() => setStep(2)} className="w-full py-4 md:py-5 bg-[#2D2424] text-white rounded-2xl font-bold mt-6 md:mt-8">{t.next}</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <Input label="Facebook" value={formData.facebook} onChange={v => setFormData({...formData, facebook: v})} placeholder="@username" />
              <Input label="Instagram" value={formData.instagram} onChange={v => setFormData({...formData, instagram: v})} placeholder="@username" />
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <Input label="TikTok" value={formData.tiktok} onChange={v => setFormData({...formData, tiktok: v})} placeholder="@username" />
              <Input label="YouTube" value={formData.youtube} onChange={v => setFormData({...formData, youtube: v})} placeholder="@username" />
            </div>
            <Input label={t.competitors} value={formData.competitors} onChange={v => setFormData({...formData, competitors: v})} placeholder="Brand A, Brand B" />
            <div className="flex gap-3 md:gap-4 mt-6 md:mt-8">
              <button onClick={() => setStep(1)} className="flex-1 py-4 md:py-5 bg-[#FDF2F2] text-[#2D2424] rounded-2xl font-bold">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-4 md:py-5 bg-[#2D2424] text-white rounded-2xl font-bold">{t.next}</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest ml-4">{t.language}</label>
                <select 
                  value={formData.brandVoice.language}
                  onChange={e => setFormData({...formData, brandVoice: {...formData.brandVoice, language: e.target.value as any}})}
                  className="w-full px-6 py-4 bg-[#FDF2F2] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FF9A9E] outline-none"
                >
                  <option value="en">English</option>
                  <option value="ar-eg">Egyptian Arabic</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest ml-4">{t.tone}</label>
                <select 
                  value={formData.brandVoice.tone}
                  onChange={e => setFormData({...formData, brandVoice: {...formData.brandVoice, tone: e.target.value as any}})}
                  className="w-full px-6 py-4 bg-[#FDF2F2] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FF9A9E] outline-none"
                >
                  <option value="friendly">{t.friendly}</option>
                  <option value="premium">{t.premium}</option>
                  <option value="expert">{t.expert}</option>
                </select>
              </div>
            </div>
            <Input label={t.mainProducts} value={formData.mainProducts} onChange={v => setFormData({...formData, mainProducts: v})} placeholder="Serum, Moisturizer, etc." />
            <Input label={t.targetAudience} value={formData.targetAudience} onChange={v => setFormData({...formData, targetAudience: v})} placeholder="Egyptian females 18-35" />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#B9AFAF] uppercase tracking-widest ml-4">{t.brandVoice}</label>
              <textarea 
                value={formData.brandVoice.description}
                onChange={e => setFormData({...formData, brandVoice: {...formData.brandVoice, description: e.target.value}})}
                placeholder="Describe how your brand speaks..."
                className="w-full px-6 py-4 bg-[#FDF2F2] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FF9A9E] outline-none min-h-[100px] md:min-h-[120px]"
              />
            </div>
            <div className="flex gap-3 md:gap-4 mt-6 md:mt-8">
              <button onClick={() => setStep(2)} className="flex-1 py-4 md:py-5 bg-[#FDF2F2] text-[#2D2424] rounded-2xl font-bold">Back</button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="flex-1 py-4 md:py-5 bg-[#2D2424] text-white rounded-2xl font-bold flex items-center justify-center gap-3"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Rocket className="w-6 h-6" />}
                {t.complete}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ResearchView({ brand, research }: { key?: string, brand: any, research: any }) {
  if (!research) return <div className="p-10 text-center">Research pending...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-10 space-y-6 md:space-y-10">
      <header>
        <h2 className="text-2xl md:text-3xl font-black text-[#2D2424]">Brand Research</h2>
        <p className="text-sm md:text-base text-[#8B7E7E]">AI-driven strategic analysis for <span className="text-[#FF9A9E] font-bold">{brand.name}</span></p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <section className="bg-white border border-[#FEE2E2] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 space-y-4 md:space-y-6">
          <div>
            <h3 className="text-base md:text-lg font-black text-[#2D2424] mb-2">Brand Summary</h3>
            <p className="text-xs md:text-sm text-[#4A3B3B] leading-relaxed">{research.summary}</p>
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-[#2D2424] mb-2">Positioning</h3>
            <p className="text-xs md:text-sm text-[#4A3B3B] leading-relaxed">{research.positioning}</p>
          </div>
        </section>

        <section className="bg-[#2D2424] text-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 space-y-4 md:space-y-6">
          <div>
            <h3 className="text-base md:text-lg font-black mb-2">Audience Insights</h3>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed">{research.audienceInsights}</p>
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black mb-2">Tone of Voice</h3>
            <p className="text-xs md:text-sm text-white/60 leading-relaxed">{research.toneOfVoice}</p>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white border border-[#FEE2E2] rounded-[1.5rem] md:rounded-[2rem] p-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] mb-4">Visual Direction</h4>
          <p className="text-xs text-[#4A3B3B] leading-relaxed">{research.visualDirection}</p>
        </div>
        <div className="bg-white border border-[#FEE2E2] rounded-[1.5rem] md:rounded-[2rem] p-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] mb-4">Campaign Angle</h4>
          <p className="text-xs text-[#4A3B3B] leading-relaxed">{research.campaignAngle}</p>
        </div>
        <div className="bg-white border border-[#FEE2E2] rounded-[1.5rem] md:rounded-[2rem] p-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] mb-4">Recommended Offer</h4>
          <p className="text-xs text-[#4A3B3B] leading-relaxed">{research.recommendedOffer}</p>
        </div>
      </div>
    </motion.div>
  );
}

function AssetManagerView({ brand, assets }: { key?: string, brand: any, assets: any }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !brand) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `brands/${brand.id}/assets/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'brand_assets'), {
        brandId: brand.id,
        fileUrl: url,
        fileName: file.name,
        fileType: file.type,
        assetCategory: 'Product',
        tags: [],
        orientation: 'Portrait',
        recommendedUsage: 'Social Post',
        ownerId: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-10 space-y-6 md:space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#2D2424]">Asset Library</h2>
          <p className="text-sm md:text-base text-[#8B7E7E]">Manage visual assets for <span className="text-[#FF9A9E] font-bold">{brand.name}</span></p>
        </div>
        <label className="w-full md:w-auto px-8 py-4 bg-[#2D2424] text-white rounded-2xl font-bold flex items-center justify-center gap-3 cursor-pointer hover:bg-[#4A3B3B] transition-all shadow-lg shadow-[#2D2424]/10">
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          Upload Asset
          <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
        </label>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {assets.map((asset: any) => (
          <div key={asset.id} className="group relative bg-white border border-[#FEE2E2] rounded-2xl md:rounded-3xl overflow-hidden hover:shadow-xl transition-all">
            <div className="aspect-[3/4] overflow-hidden">
              <img src={asset.fileUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" referrerPolicy="no-referrer" />
            </div>
            <div className="p-3 md:p-4">
              <p className="text-[8px] md:text-[10px] font-black text-[#FF9A9E] uppercase tracking-widest mb-1">{asset.assetCategory}</p>
              <p className="text-[10px] md:text-xs font-bold text-[#2D2424] truncate">{asset.fileName}</p>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
              <button className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-[#8B7E7E] hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {assets.length === 0 && (
          <div className="col-span-full py-10 md:py-20 text-center border-2 border-dashed border-[#FEE2E2] rounded-[2rem] md:rounded-[3rem]">
            <ImageIcon className="w-10 h-10 md:w-12 md:h-12 text-[#B9AFAF] mx-auto mb-4" />
            <p className="text-[#8B7E7E] text-sm md:text-base font-bold">No assets uploaded yet.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChannelsView({ brand, channels }: { key?: string, brand: any, channels: any }) {
  const platforms = [
    { name: 'Instagram', icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-50' },
    { name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'TikTok', icon: Smartphone, color: 'text-black', bg: 'bg-gray-50' },
    { name: 'YouTube', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-10 space-y-6 md:space-y-10">
      <header>
        <h2 className="text-2xl md:text-3xl font-black text-[#2D2424]">Connected Channels</h2>
        <p className="text-sm md:text-base text-[#8B7E7E]">Manage social media integrations for <span className="text-[#FF9A9E] font-bold">{brand.name}</span></p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {platforms.map(p => {
          const connected = channels.find((c: any) => c.platform === p.name);
          return (
            <div key={p.name} className="bg-white border border-[#FEE2E2] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4 md:gap-6">
                <div className={cn("w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0", p.bg)}>
                  <p.icon className={cn("w-6 h-6 md:w-8 md:h-8", p.color)} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-[#2D2424]">{p.name}</h3>
                  {connected ? (
                    <div className="space-y-1">
                      <p className="text-xs md:text-sm font-bold text-[#4A3B3B]">{connected.accountName}</p>
                      <p className="text-[8px] md:text-[10px] text-green-500 font-black uppercase tracking-widest">Connected</p>
                    </div>
                  ) : (
                    <p className="text-[10px] md:text-xs text-[#B9AFAF] font-bold">Not connected</p>
                  )}
                </div>
              </div>
              <button className={cn(
                "w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all",
                connected ? "bg-[#FDF2F2] text-[#8B7E7E]" : "bg-[#2D2424] text-white shadow-lg shadow-[#2D2424]/10"
              )}>
                {connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function PublishingView({ brand, assets, channels, jobs }: { key?: string, brand: any, assets: any, channels: any, jobs: any }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newJob, setNewJob] = useState({
    content: '',
    platforms: [] as string[],
    mediaUrls: [] as string[]
  });

  const handlePublish = async () => {
    if (!brand) return;
    try {
      await addDoc(collection(db, 'publishing_jobs'), {
        brandId: brand.id,
        ...newJob,
        status: 'Scheduled',
        ownerId: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      });
      setIsCreating(false);
    } catch (error) {
      console.error("Publishing failed:", error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-10 space-y-6 md:space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#2D2424]">Publishing Center</h2>
          <p className="text-sm md:text-base text-[#8B7E7E]">Schedule and track content for <span className="text-[#FF9A9E] font-bold">{brand.name}</span></p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="w-full md:w-auto px-8 py-4 bg-[#2D2424] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#4A3B3B] transition-all shadow-lg shadow-[#2D2424]/10"
        >
          <Plus className="w-5 h-5" />
          Create Post
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] px-2">Publishing History</h3>
          {jobs.map((job: any) => (
            <div key={job.id} className="bg-white border border-[#FEE2E2] rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#FDF2F2] rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#FF9A9E]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-bold text-[#2D2424] line-clamp-1 w-full sm:w-64">{job.content}</p>
                  <div className="flex items-center gap-2 mt-1 overflow-x-auto no-scrollbar">
                    {job.platforms.map((p: string) => (
                      <span key={p} className="text-[8px] md:text-[10px] font-black text-[#B9AFAF] uppercase whitespace-nowrap">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-wider",
                  job.status === 'Published' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                )}>
                  {job.status}
                </span>
                <p className="text-[8px] md:text-[10px] text-[#B9AFAF] font-bold">{new Date(job.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {jobs.length === 0 && <p className="text-center text-[#B9AFAF] py-10 md:py-20 text-sm">No posts scheduled yet.</p>}
        </div>

        <aside className="space-y-4 md:space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] px-2">Upcoming Schedule</h3>
          <div className="bg-[#2D2424] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white">
            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-[#FF9A9E] mb-4" />
            <p className="text-sm font-bold mb-2">No upcoming posts</p>
            <p className="text-xs text-white/40">Schedule your first post to see your calendar here.</p>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#2D2424]/40 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-xl md:text-2xl font-black text-[#2D2424] mb-6 md:mb-8">Create New Post</h3>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] mb-2 px-1">Caption</label>
                  <textarea 
                    value={newJob.content}
                    onChange={e => setNewJob({...newJob, content: e.target.value})}
                    className="w-full h-32 px-6 py-4 bg-[#FDF2F2] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FFD1D1] transition-all outline-none resize-none"
                    placeholder="Write your caption here..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] mb-2 px-1">Target Platforms</label>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {['Instagram', 'Facebook', 'TikTok'].map(p => (
                      <button 
                        key={p}
                        onClick={() => {
                          const next = newJob.platforms.includes(p) 
                            ? newJob.platforms.filter(x => x !== p)
                            : [...newJob.platforms, p];
                          setNewJob({...newJob, platforms: next});
                        }}
                        className={cn(
                          "px-4 md:px-6 py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-bold transition-all",
                          newJob.platforms.includes(p) ? "bg-[#2D2424] text-white" : "bg-[#FDF2F2] text-[#8B7E7E]"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-6">
                  <button onClick={() => setIsCreating(false)} className="w-full sm:flex-1 py-4 bg-[#FDF2F2] text-[#2D2424] rounded-xl font-bold">Cancel</button>
                  <button onClick={handlePublish} className="w-full sm:flex-1 py-4 bg-[#2D2424] text-white rounded-xl font-bold">Schedule Post</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-[#B9AFAF] mb-2 px-1">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-6 py-4 bg-[#FDF2F2] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#FFD1D1] transition-all outline-none"
      />
    </div>
  );
}
