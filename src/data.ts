export type ItemStatus = 'Draft' | 'In Progress' | 'Ready' | 'Needs Revision';

export interface ContentItem {
  id: string;
  type: 'idea' | 'script' | 'hook';
  category: 'educational' | 'entertaining' | 'sales';
  title: string;
  content: string;
  hook?: string;
  value?: string;
  cta?: string;
  status?: ItemStatus;
}

export interface Objection {
  objection: string;
  response: string;
}

export interface DepartmentData {
  status: ItemStatus;
  lastUpdated: string;
}

export interface ContentDept extends DepartmentData {
  plan: string;
  ideas: ContentItem[];
  scripts: ContentItem[];
}

export interface CreativeDept extends DepartmentData {
  concepts: string[];
  palettes: string[];
  prompts: string[];
}

export interface VideoDept extends DepartmentData {
  plan: string;
  shotList: string[];
  movements: string;
  editingStyle: string;
}

export interface SalesDept extends DepartmentData {
  dmReplies: string[];
  questions: string[];
  scripts: string[];
  objections: Objection[];
  closing: string;
  urgency: string;
}

export interface MediaDept extends DepartmentData {
  adCopy: string[];
  campaignIdeas: string[];
  audience: string;
  budget: string;
}

export interface Brand {
  id: string;
  name: string;
  niche: string;
  market: string;
  website?: string;
  socials: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  competitors: string[];
  brandVoice: {
    language: 'en' | 'ar-eg';
    tone: 'friendly' | 'premium' | 'expert';
    description: string;
  };
  targetAudience: string;
  mainProducts: string[];
  logoUrl?: string;
  assetUrls: string[];
  createdAt: string;
}

export interface BrandResearch {
  brandId: string;
  summary: string;
  positioning: string;
  audienceInsights: string;
  toneOfVoice: string;
  visualDirection: string;
  competitorNotes: string;
  contentOpportunities: string[];
  campaignAngle: string;
  recommendedOffer: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  brandId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  assetCategory: 'Product' | 'Lifestyle' | 'UGC' | 'Graphic';
  productName?: string;
  tags: string[];
  orientation: 'Portrait' | 'Landscape' | 'Square';
  recommendedUsage: string;
  createdAt: string;
}

export interface ConnectedChannel {
  id: string;
  brandId: string;
  platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube';
  status: 'Connected' | 'Disconnected' | 'Expired';
  accountName: string;
  accountId: string;
  lastSync: string;
}

export interface PublishingJob {
  id: string;
  brandId: string;
  deliverableId: string;
  platforms: string[];
  content: string;
  mediaUrls: string[];
  scheduledFor?: string;
  publishedAt?: string;
  status: 'Draft' | 'Scheduled' | 'Published' | 'Failed';
}

export interface AIAgent {
  id: string;
  ownerId: string;
  name: string;
  role: string;
  status: 'Idle' | 'Working' | 'Waiting' | 'Needs Approval';
  activeTask?: string;
  tasksCompleted: number;
  lastUpdate: string;
  avatarUrl?: string;
}

export interface AgentTask {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'Needs Approval';
  assignedTo?: string; // Agent ID
  brandId?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  type: 'Onboarding' | 'Research' | 'Content' | 'Assets' | 'WhatsApp' | 'Approval' | 'Issue';
  createdAt: string;
  completedAt?: string;
}

export interface Deliverable {
  id: string;
  brandId: string;
  ownerId: string;
  department: string;
  type: string;
  title: string;
  status: 'draft' | 'in_review' | 'approved' | 'needs_revision' | 'final';
  version: number;
  content: any;
  createdBy: string; // Agent ID
  createdAt: string;
  updatedAt: string;
}

export interface DeliverableFeedback {
  id: string;
  deliverableId: string;
  authorType: 'user' | 'agent';
  authorId: string;
  message: string;
  actionType: 'comment' | 'approve' | 'request_revision';
  createdAt: string;
}

export interface DeliverableVersion {
  id: string;
  deliverableId: string;
  version: number;
  content: any;
  changeSummary?: string;
  createdBy: string;
  createdAt: string;
}

export interface CampaignBrief {
  id: string;
  brandId: string;
  ownerId: string;
  objective: string;
  offer: string;
  audience: string;
  heroProduct: string;
  secondaryProducts: string[];
  platforms: string[];
  deliverables: string[];
  tone: string;
  deadline: string;
  status: 'draft' | 'approved' | 'completed';
  createdAt: string;
}

export interface WhatsAppChannel {
  id: string;
  ownerId: string;
  brandId: string;
  phoneNumberId: string;
  wabaId: string;
  status: 'Connected' | 'Disconnected' | 'Pending';
  accountName: string;
  accessToken?: string;
}

export interface WhatsAppConversation {
  id: string;
  ownerId: string;
  brandId: string;
  customerName: string;
  customerWaId: string;
  lastMessage: string;
  lastMessageAt: any;
  intent: 'Pricing' | 'Product Inquiry' | 'Complaint' | 'Order' | 'Follow-up' | 'Unknown';
  leadScore: number;
  status: 'open' | 'resolved' | 'escalated' | 'pending_ai';
  unreadCount: number;
  updatedAt: any;
  createdAt: any;
}

export interface WhatsAppMessage {
  id: string;
  ownerId: string;
  conversationId: string;
  customerWaId: string;
  content: string;
  direction: 'inbound' | 'outbound';
  messageType: string;
  metaMessageId?: string;
  timestamp?: string;
  createdAt: any;
}

export const VIRAL_HOOKS: string[] = [
  "عارفة ليه الميك اب بتاعك بيقطع؟ هقولك السر",
  "الروتين ده هيخلي بشرتك زي الفلتر في أسبوع واحد",
  "لو بتستخدمي الصن بلوك غلط، يبقى بتضيعي فلوسك",
  "أحلى ٥ أرواج لكل يوم، والأسعار مفاجأة",
  "مش هتصدقي المنتج ده عمل إيه في الهالات السوداء",
  "ازاي تخلي ريحتك ثابتة طول اليوم بـ ٣ خطوات بس",
  "غلطة بنعملها كلنا بتبوظ الرموش.. خدي بالك",
  "بديل أرخص لبراندات غالية.. نفس النتيجة بالظبط",
  "البشرة الدهنية مش محتاجة مرطب؟ أكبر كذبة سمعتيها",
  "تجهيزات العروسة: أهم ٥ حاجات لازم تكون في شنطتك"
];

export const CONTENT_IDEAS: ContentItem[] = [
  {
    id: 'idea-1',
    type: 'idea',
    category: 'educational',
    title: 'ترتيب منتجات العناية بالبشرة',
    content: 'بوست بيشرح الترتيب الصح (غسول، تونر، سيروم، مرطب، صن بلوك) مع شرح بسيط لكل خطوة.',
    hook: 'بتتوهي في ترتيب الروتين بتاعك؟',
    value: 'الترتيب الصح بيخلي بشرتك تستفيد ١٠٠٪ من كل منتج.',
    cta: 'احفظي البوست ده عندك عشان مترجعيش تسألي تاني!'
  },
  {
    id: 'idea-2',
    type: 'idea',
    category: 'entertaining',
    title: 'توقعات مقابل واقع (الميك اب)',
    content: 'فيديو كوميدي بيقارن بين شكل الميك اب في الصور بالفلتر وشكله في الحقيقة.',
    hook: 'ميك اب الصور vs ميك اب الحقيقة',
    value: 'بشرتنا فيها مسام وخطوط وده طبيعي جداً، متخليش السوشيال ميديا تخدعك.',
    cta: 'منشني صاحبتك اللي مهووسة بالفلاتر!'
  },
  {
    id: 'idea-3',
    type: 'idea',
    category: 'sales',
    title: 'عرض الـ ٤٨ ساعة',
    content: 'بوست عن خصم كبير لفترة محدودة على أكتر المنتجات مبيعاً.',
    hook: 'أقوى سيل في السنة بدأ دلوقتي!',
    value: 'خصومات بتوصل لـ ٥٠٪ على كل السيرومات اللي بتحبوها.',
    cta: 'اطلبي دلوقتي من اللينك في البايو قبل ما الكمية تخلص.'
  },
  // ... Adding more ideas to reach 30
  { id: 'idea-4', type: 'idea', category: 'educational', title: 'أنواع البشرة وازاي تعرفيها', content: 'اختبار بسيط في البيت بالمناديل عشان كل بنت تعرف نوع بشرتها.', hook: 'انتي بشرتك دهنية ولا مختلطة؟', value: 'معرفة نوع بشرتك هو أول خطوة لروتين صح.', cta: 'قوليلنا في الكومنتات طلعتي نوع إيه؟' },
  { id: 'idea-5', type: 'idea', category: 'educational', title: 'أهمية الصن بلوك في الشتا', content: 'توضيح إن أشعة الشمس موجودة حتى لو الجو برد أو مغيم.', hook: 'بتحطي صن بلوك في الشتا ولا لأ؟', value: 'الشمس هي السبب الأول للتجاعيد حتى في الشتا.', cta: 'اعملي شير لصاحبتك اللي بتكسل تحطه.' },
  { id: 'idea-6', type: 'idea', category: 'entertaining', title: 'شنطة الميك اب بتاعتي فيها إيه؟', content: 'جولة سريعة في شنطة ميك اب يومية بسيطة.', hook: 'تعالوا نشوف إيه اللي مبيفارقش شنطتي', value: 'أساسيات بسيطة بتفرق في شكلك طول اليوم.', cta: 'إيه أكتر منتج مستحيل تخرجي من غيره؟' },
  { id: 'idea-7', type: 'idea', category: 'sales', title: 'رأي العملاء (Testimonials)', content: 'تجميعة لصور ريفيوهات البنات اللي جربوا المنتجات.', hook: 'البنات قالوا إيه عننا؟', value: 'ثقتكم هي اللي مخليانا مكملين وبنطور دايماً.', cta: 'شوفي الريفيوهات كاملة في الهايلايت.' },
  { id: 'idea-8', type: 'idea', category: 'educational', title: 'ازاي تنضفي فرش الميك اب', content: 'طريقة سهلة وسريعة لتنضيف الفرش عشان نحمي البشرة من الحبوب.', hook: 'آخر مرة غسلتي فيها فرشك كانت إمتى؟', value: 'الفرش المش نظيفة هي أكبر سبب لحبوب البشرة.', cta: 'قومي اغسليهم دلوقتي ومنشني صاحبتك تفكرك!' },
  { id: 'idea-9', type: 'idea', category: 'entertaining', title: 'ميك اب الـ ٥ دقائق', content: 'تحدي عمل لوك كامل في ٥ دقائق بس للمشاوير السريعة.', hook: 'مستعجلة؟ اللوك ده ليكي', value: 'خطوات بسيطة تطلعك قمر في أقل وقت.', cta: 'جربي اللوك ده ووريهولنا!' },
  { id: 'idea-10', type: 'idea', category: 'sales', title: 'بوكس الهدايا', content: 'تقديم فكرة بوكس هدايا متكامل للمناسبات (عيد ميلاد، جواز).', hook: 'أحلى هدية ممكن تهادي بيها نفسك أو صاحبتك', value: 'بوكس فيه كل اللي بتحتاجه أي بنت وبسعر توفير.', cta: 'ابعتيلنا مسج عشان نجهزلك البوكس.' },
  { id: 'idea-11', type: 'idea', category: 'educational', title: 'علاج الهالات السوداء', content: 'نصائح طبيعية ومنتجات فعالة للهالات.', hook: 'تعبتي من الهالات السوداء؟', value: 'النوم وشرب المية مع السيروم الصح هما الحل.', cta: 'اكتبي "هالات" وهبعتلك الروتين المناسب.' },
  { id: 'idea-12', type: 'idea', category: 'educational', title: 'الفرق بين المرطب والواقي', content: 'شرح الفرق بين وظيفة كل واحد فيهم.', hook: 'ينفع أستخدم المرطب بدل الصن بلوك؟', value: 'كل واحد ليه دور مختلف تماماً لحماية بشرتك.', cta: 'لو استفدتي من المعلومة اعملي لايك.' },
  { id: 'idea-13', type: 'idea', category: 'entertaining', title: 'تريندات ميك اب غريبة', content: 'تجربة تريند طالع جديد والتعليق عليه.', hook: 'جربت أغرب تريند ميك اب شوفته!', value: 'مش كل اللي بنشوفه ينفع نطبقه في الحقيقة.', cta: 'إيه أغرب تريند شوفتيه الفترة دي؟' },
  { id: 'idea-14', type: 'idea', category: 'sales', title: 'منتج الشهر', content: 'تسليط الضوء على منتج واحد مميز جداً.', hook: 'المنتج ده مكسر الدنيا عندنا!', value: 'بيحل مشكلة (كذا) ومن أول استخدام هتحسي بفرق.', cta: 'الحقي اطلبيه قبل ما يخلص.' },
  { id: 'idea-15', type: 'idea', category: 'educational', title: 'روتين قبل النوم', content: 'خطوات بسيطة لازم تعمليها قبل ما تنامي.', hook: 'بشرتك بتجدد نفسها وانتي نايمة', value: 'الروتين الليلي هو أهم وقت للعناية بالبشرة.', cta: 'انتي بتعملي كام خطوة من دول؟' },
  { id: 'idea-16', type: 'idea', category: 'educational', title: 'ازاي تختاري درجة الفاونديشن', content: 'نصيحة عن تجربة الدرجة على الرقبة مش الإيد.', hook: 'بتشتري فاونديشن ويطلع غلط؟', value: 'الإضاءة والمنطقة اللي بتجربي فيها بتفرق جداً.', cta: 'احفظي المعلومة دي للمرة الجاية.' },
  { id: 'idea-17', type: 'idea', category: 'entertaining', title: 'فلوج يوم في البراند', content: 'كواليس الشغل وتجهيز الأوردرات.', hook: 'تعالوا شوفوا يومنا بيمشي ازاي', value: 'بنهتم بكل تفصيلة عشان الأوردر يوصلكم بحب.', cta: 'بتحبوا تشوفوا كواليس أكتر؟' },
  { id: 'idea-18', type: 'idea', category: 'sales', title: 'اشتري واحد والتاني هدية', content: 'عرض قوي جداً لزيادة المبيعات.', hook: 'عرض الـ Buy 1 Get 1 رجع تاني!', value: 'فرصة تجددي روتينك كله بنص السعر.', cta: 'اطلبي دلوقتي من الويب سايت.' },
  { id: 'idea-19', type: 'idea', category: 'educational', title: 'فوائد فيتامين C', content: 'شرح ليه فيتامين C مهم للنضارة.', hook: 'عايزة بشرة بتنور؟', value: 'فيتامين C هو سر النضارة وتوحيد اللون.', cta: 'استخدمتيه قبل كدة ولا لسه؟' },
  { id: 'idea-20', type: 'idea', category: 'educational', title: 'أخطاء في غسل الوش', content: 'زي استخدام مية سخنة أوي أو تنشيف جامد.', hook: 'ممكن تكوني بتبوظي بشرتك وانتي بتغسليها!', value: 'التعامل برقة مع البشرة هو الأساس.', cta: 'بتنشفي وشك بفوطة ولا مناديل؟' },
  { id: 'idea-21', type: 'idea', category: 'entertaining', title: 'ميك اب الشخصيات', content: 'عمل لوك مستوحى من شخصية مشهورة.', hook: 'تحولت لشخصية (فلانة) بالميك اب!', value: 'الميك اب فن وتغيير مش بس تجميل.', cta: 'مين الشخصية اللي تحبوا أعملها المرة الجاية؟' },
  { id: 'idea-22', type: 'idea', category: 'sales', title: 'شحن مجاني', content: 'عرض شحن مجاني لفترة محدودة.', hook: 'الشحن علينا النهاردة وبس!', value: 'وفري مصاريف الشحن واطلبي كل اللي نفسك فيه.', cta: 'العرض هيخلص الساعة ١٢ بالليل.' },
  { id: 'idea-23', type: 'idea', category: 'educational', title: 'تقشير البشرة في البيت', content: 'الطريقة الصح للتقشير الكيميائي أو الفيزيائي.', hook: 'بشرتك باهتة؟ محتاجة تقشير', value: 'التقشير بيشيل الجلد الميت وبيخلي الوش ينور.', cta: 'لو عايزة تعرفي المقشر المناسب ليكي اكتبي نوع بشرتك.' },
  { id: 'idea-24', type: 'idea', category: 'educational', title: 'علاج حبوب الظهر', content: 'نصائح ومنتجات للجسم.', hook: 'حبوب الظهر مضايقاكي؟', value: 'خطوات بسيطة في الشاور هتخلصك منها.', cta: 'اعملي منشن لصاحبتك اللي عندها المشكلة دي.' },
  { id: 'idea-25', type: 'idea', category: 'entertaining', title: 'تحدي بدون مرآة', content: 'عمل ميك اب كامل من غير مراية.', hook: 'حطيت ميك اب من غير مراية والنتيجة صدمة!', value: 'فيديو للضحك والترفيه مع المتابعين.', cta: 'تفتكروا النتيجة طلعت كام من ١٠؟' },
  { id: 'idea-26', type: 'idea', category: 'sales', title: 'أول أوردر خصم', content: 'كود خصم خاص للمتابعين الجدد.', hook: 'هدية لكل المتابعين الجدد!', value: 'خصم ١٠٪ على أول أوردر ليكي معانا.', cta: 'استخدمي كود WELCOME10 واطلبي دلوقتي.' },
  { id: 'idea-27', type: 'idea', category: 'educational', title: 'تثبيت الروج طول اليوم', content: 'حيل بسيطة تخلي الروج مبيتمسحش.', hook: 'ازاي تخلي الروج ثابت حتى بعد الأكل؟', value: 'خطوات بسيطة بالبودرة والمناديل بتفرق جداً.', cta: 'جربيها وقوليلي رأيك.' },
  { id: 'idea-28', type: 'idea', category: 'educational', title: 'أهمية تنضيف الموبايل', content: 'علاقة شاشة الموبايل بحبوب الخدود.', hook: 'موبايلك هو سبب الحبوب اللي في خدك!', value: 'البكتيريا بتنتقل من الشاشة لوشك طول اليوم.', cta: 'روحي عقّمي موبايلك دلوقتي!' },
  { id: 'idea-29', type: 'idea', category: 'entertaining', title: 'ميك اب بمنتج واحد', content: 'عمل لوك كامل باستخدام روج بس مثلاً.', hook: 'عملت لوك كامل بمنتج واحد بس!', value: 'ازاي تستغلي منتجاتك بأكتر من طريقة.', cta: 'تحبوا أجرب بمنتج إيه المرة الجاية؟' },
  { id: 'idea-30', type: 'idea', category: 'sales', title: 'فلاش سيل (Flash Sale)', content: 'خصم كبير جداً لمدة ساعة واحدة بس.', hook: 'الحقي! خصم ٧٠٪ لمدة ساعة واحدة بس', value: 'أسرع واحدة هتلحق تطلب هي الكسبانة.', cta: 'اللينك في الستوري دلوقتي!' }
];

export const VIDEO_SCRIPTS: ContentItem[] = [
  {
    id: 'script-1',
    type: 'script',
    category: 'educational',
    title: 'روتين الصباح السريع',
    content: 'تصوير سريع لكل خطوة مع كتابة النص على الشاشة.',
    hook: 'روتين الصباح في دقيقتين بس',
    value: 'غسول -> سيروم C -> مرطب -> صن بلوك. كدة انتي جاهزة!',
    cta: 'قوليلي بتعملي كام خطوة الصبح؟'
  },
  {
    id: 'script-2',
    type: 'script',
    category: 'entertaining',
    title: 'لما تشتري ميك اب وانتي مفلسة',
    content: 'تمثيل مشهد كوميدي بين البنت ومحفظتها.',
    hook: 'أنا: مش هشتري ميك اب تاني الشهر ده. برضه أنا:',
    value: 'الجمال ملوش حل، والميك اب دايماً ليه ميزانية لوحده!',
    cta: 'مين صاحبتك اللي بتعمل كدة؟'
  },
  {
    id: 'script-3',
    type: 'script',
    category: 'sales',
    title: 'فتح أوردر (Unboxing)',
    content: 'تصوير جمالي لفتح البوكس وتجربة المنتجات على الإيد.',
    hook: 'أجمل أوردر وصلني النهاردة!',
    value: 'شوفي جمال التغليف وجودة المنتجات، بجد خيال.',
    cta: 'اطلبي البوكس بتاعك دلوقتي.'
  },
  // ... Adding more scripts to reach 30
  { id: 'script-4', type: 'script', category: 'educational', title: 'ازاي تخفي الحبوب', content: 'فيديو تعليمي لاستخدام الكوريكتور الأخضر والكونسيلر.', hook: 'عندك حباية ومضايقاكي؟ شوفي الحل', value: 'تغطية مثالية من غير ما تبان تقيلة.', cta: 'لو عجبك الفيديو اعملي سيف.' },
  { id: 'script-5', type: 'script', category: 'educational', title: 'رسم الحواجب طبيعي', content: 'خطوات رسم الحواجب شعرة شعرة.', hook: 'حواجب طبيعية في ثواني', value: 'ازاي ترسمي حواجبك من غير ما تبان مرسومة بزيادة.', cta: 'اكتبي "حواجب" وهبعتلك اسم القلم.' },
  { id: 'script-6', type: 'script', category: 'entertaining', title: 'ميك اب الجامعة vs الشغل', content: 'مقارنة سريعة بين اللوكين.', hook: 'تختاري ميك اب الجامعة ولا الشغل؟', value: 'كل مكان وليه اللوك اللي يناسبه.', cta: 'انتي بتحبي الميك اب التقيل ولا الخفيف؟' },
  { id: 'script-7', type: 'script', category: 'sales', title: 'تجهيز أوردر عميلة', content: 'فيديو ASMR لتغليف المنتجات.', hook: 'تعالوا نغلف أوردر سارة من الإسكندرية', value: 'كل قطعة بتتغلف بكل حب عشان توصلك سليمة.', cta: 'عايزة أوردرك يتصور المرة الجاية؟' },
  { id: 'script-8', type: 'script', category: 'educational', title: 'بديل الهايلايتر', content: 'استخدام الفازلين أو الزيت لنضارة طبيعية.', hook: 'هايلايتر طبيعي ببلاش!', value: 'حيلة بسيطة تخلي خدودك بتلمع من غير ميك اب.', cta: 'جربيها وقوليلي النتيجة.' },
  { id: 'script-9', type: 'script', category: 'educational', title: 'تثبيت الميك اب في الحر', content: 'استخدام البرايمر والسينتج سبراي.', hook: 'ازاي تخلي الميك اب ميسيحش في شمس مصر؟', value: 'خطوات أساسية للصيف والجو الحر.', cta: 'احفظي الفيديو ده للصيف.' },
  { id: 'script-10', type: 'script', category: 'entertaining', title: 'رياكشن على ميك اب قديم', content: 'البنت بتشوف صورها القديمة بالميك اب وتضحك.', hook: 'كنت فاكرة نفسي قمر بالميك اب ده!', value: 'كلنا بنتعلم وبنطور من نفسنا دايماً.', cta: 'مين عندها صورة قديمة بتضحك؟' },
  { id: 'script-11', type: 'script', category: 'sales', title: 'أكتر منتج مطلوب', content: 'عرض المنتج وهو بيخلص من الرفوف.', hook: 'المنتج ده بيخلص في ثواني!', value: 'أكتر من ١٠٠٠ بنت جربوه وحبوه جداً.', cta: 'الحقي درجتك قبل ما تخلص.' },
  { id: 'script-12', type: 'script', category: 'educational', title: 'تطويل الرموش', content: 'طريقة وضع الماسكرا لرموش أطول.', hook: 'رموشك هتوصل لحواجبك!', value: 'تكنيك بسيط في وضع الماسكرا بيغير الشكل تماماً.', cta: 'منشني صاحبتك اللي رموشها قصيرة.' },
  { id: 'script-13', type: 'script', category: 'educational', title: 'علاج تشقق الشفايف', content: 'سكراب طبيعي ومرطب قوي.', hook: 'وداعاً لتشقق الشفايف في الشتا', value: 'شفايف ناعمة ومترطبة طول الوقت.', cta: 'اكتبي "شفايف" وهبعتلك طريقة السكراب.' },
  { id: 'script-14', type: 'script', category: 'entertaining', title: 'تحدي الميك اب بالألوان', content: 'اختيار لون عشوائي وعمل لوك بيه.', hook: 'عملت ميك اب باللون الأزرق بس!', value: 'تحدي ممتع بيطلع مواهبنا في الميك اب.', cta: 'اختارولي لون للمرة الجاية.' },
  { id: 'script-15', type: 'script', category: 'sales', title: 'قبل وبعد استخدام المنتج', content: 'توضيح الفرق الواضح على البشرة.', hook: 'مش هتصدقي النتيجة قبل وبعد!', value: 'المنتج ده بجد سحر في حل مشكلة (كذا).', cta: 'اطلبيه دلوقتي واستمتعي بالنتيجة.' },
  { id: 'script-16', type: 'script', category: 'educational', title: 'ازاي تداري الهالات', content: 'استخدام كونسيلر أغمق درجة الأول.', hook: 'الهالات لسه بتبان رمادي تحت الميك اب؟', value: 'السر في تصحيح اللون قبل الكونسيلر.', cta: 'لو استفدتي اعملي فولو.' },
  { id: 'script-17', type: 'script', category: 'educational', title: 'تنضيف البشرة بعمق', content: 'استخدام الدبل كلينزينج (زيت ثم غسول).', hook: 'بتغسلي وشك مرة واحدة بس؟ غلط جداً', value: 'التنضيف المزدوج هو اللي بيشيل الميك اب والدهون صح.', cta: 'جربتي الطريقة دي قبل كدة؟' },
  { id: 'script-18', type: 'script', category: 'entertaining', title: 'لما صاحبتك تطلب ميك اب منك', content: 'مشهد كوميدي عن خوف البنات على الميك اب بتاعهم.', hook: 'لما صاحبتي تقولي "ممكن أجرب الروج بتاعك؟"', value: 'الميك اب خط أحمر يا جماعة!', cta: 'مين صاحبتك اللي بتستلف منك دايماً؟' },
  { id: 'script-19', type: 'script', category: 'sales', title: 'ريفيو سريع للمنتجات', content: 'تجربة سريعة لـ ٣ منتجات والتعليق عليهم.', hook: 'رأيي الصريح في منتجات (البراند)', value: 'بقولكم الخلاصة عشان تختاروا اللي يناسبكم.', cta: 'إيه أكتر منتج حابة تجربيه؟' },
  { id: 'script-20', type: 'script', category: 'educational', title: 'تثبيت الآيلاينر', content: 'حيلة باستخدام الآيشادو فوق الآيلاينر.', hook: 'الآيلاينر بيطبع فوق عينك؟ شوفي الحل', value: 'طريقة تخلي الآيلاينر ثابت ومبيتحركش طول اليوم.', cta: 'احفظي الفيديو هتحتاجيه.' },
  { id: 'script-21', type: 'script', category: 'educational', title: 'تصغير الأنف بالكونتور', content: 'خطوات بسيطة وسهلة للمبتدئين.', hook: 'كونتور الأنف في دقيقة', value: 'ازاي تخلي مناخيرك شكلها أصغر بطريقة طبيعية.', cta: 'عايزة كونتور لإيه تاني؟' },
  { id: 'script-22', type: 'script', category: 'entertaining', title: 'تجهيزات خروجة سريعة', content: 'فيديو Get Ready With Me سريع.', hook: 'تعالوا نجهز لخروجة سريعة مع صحابي', value: 'لوك بسيط وهادي يناسب الصبح.', cta: 'بتحبوا فيديوهات الـ GRWM؟' },
  { id: 'script-23', type: 'script', category: 'sales', title: 'عرض الـ Bundle', content: 'تجميعة منتجات بسعر مخفض.', hook: 'وفري أكتر من ٢٠٠ جنيه مع البوكس ده!', value: 'روتين كامل في بوكس واحد وبسعر خيالي.', cta: 'اطلبي الباندل دلوقتي.' },
  { id: 'script-24', type: 'script', category: 'educational', title: 'علاج قشرة الشعر', content: 'روتين بسيط للتخلص من القشرة.', hook: 'القشرة مبهدلة لبسك؟ الحل هنا', value: 'خطوات بسيطة هترجع شعرك صحي ومن غير قشرة.', cta: 'منشني حد محتاج الفيديو ده.' },
  { id: 'script-25', type: 'script', category: 'educational', title: 'ازاي تخلي ريحتك حلوة', content: 'استخدام اللوشن والبودي سبراي والبرفيوم.', hook: 'سر الريحة اللي بتثبت طول اليوم', value: 'توزيع الريحة في أماكن النبض بيفرق جداً.', cta: 'إيه البرفيوم المفضل ليكي؟' },
  { id: 'script-26', type: 'script', category: 'entertaining', title: 'تحدي الميك اب بالإيد الواحدة', content: 'فيديو مضحك لمحاولة وضع ميك اب بإيد واحدة.', hook: 'حطيت ميك اب بإيد واحدة بس! شوفوا اللي حصل', value: 'تحديات ممتعة لكسر الروتين.', cta: 'تفتكروا نجحت في التحدي؟' },
  { id: 'script-27', type: 'script', category: 'sales', title: 'منتجات خلصت وهشتريها تاني', content: 'توضيح المنتجات اللي بجد تستاهل.', hook: 'منتجات خلصت ومقدرش أستغنى عنها', value: 'دي بجد أكتر حاجات فرقت معايا وهكررها دايماً.', cta: 'انتي إيه المنتج اللي بتكرريه دايماً؟' },
  { id: 'script-28', type: 'script', category: 'educational', title: 'تكبير الشفايف بالميك اب', content: 'استخدام الليب لاينر بطريقة صح.', hook: 'شفايف ممتلئة من غير فيلر!', value: 'ازاي ترسمي شفايفك وتكبيرها بطريقة شيك.', cta: 'جربيها وقوليلي النتيجة.' },
  { id: 'script-29', type: 'script', category: 'educational', title: 'أهمية التونر', content: 'شرح ليه التونر مهم لقبض المسام.', hook: 'انتي لسه مابتستخدميش تونر؟', value: 'التونر بيوازن حموضة البشرة وبيصغر المسام.', cta: 'لو عايزة نوع تونر مناسب اكتبي نوع بشرتك.' },
  { id: 'script-30', type: 'script', category: 'sales', title: 'مسابقة الأسبوع', content: 'إعلان عن مسابقة للفوز بمنتجات.', hook: 'عايزة تكسبي بوكس ميك اب هدية؟', value: 'شروط بسيطة وممكن تكوني انتي الكسبانة.', cta: 'شوفي الشروط في الكومنتات.' }
];
