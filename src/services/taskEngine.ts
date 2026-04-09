import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDoc,
  query,
  where,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../firebase';

/**
 * AI Agency OS - Task Orchestration Engine
 * Core logic for creating, running, and routing AI agent tasks.
 */

// --- Types ---

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type TaskType = 
  | 'campaign_kickoff'
  | 'brand_research' 
  | 'content_plan' 
  | 'design_direction' 
  | 'video_plan' 
  | 'ads_copy' 
  | 'whatsapp_sales_flow'
  | 'whatsapp_reply'
  | 'lead_intake'
  | 'lead_qualification'
  | 'send_price'
  | 'handoff_to_sales'
  | 'publish_post'
  | 'review_content';

export interface Task {
  id?: string;
  type: TaskType;
  assignedTo: string;
  title?: string;
  description?: string;
  department?: string;
  priority?: 'low' | 'medium' | 'high';
  status: TaskStatus;
  refId?: string;
  brandId?: string;
  campaignId?: string;
  ownerId: string;
  claimedBy?: string;
  claimedAt?: any;
  createdAt: any;
  completedAt?: any;
  failedAt?: any;
  errorMessage?: string;
}

// --- Core Functions ---

/**
 * 1. Adds a new task to Firestore with default pending status and metadata
 */
export async function createTask(taskData: Partial<Task>) {
  try {
    const ownerId = auth.currentUser?.uid;
    if (!ownerId) throw new Error("User not authenticated");

    const taskRef = await addDoc(collection(db, 'agent_tasks'), {
      ...taskData,
      status: 'pending',
      priority: taskData.priority || 'medium',
      department: taskData.department || null,
      ownerId,
      createdAt: serverTimestamp(),
    });

    console.log(`[TaskEngine] ✅ Task created: ${taskRef.id} (${taskData.type})`);
    return taskRef.id;
  } catch (error) {
    console.error("[TaskEngine] ❌ Error creating task:", error);
    throw error;
  }
}

/**
 * 2. Orchestrates the execution of a task with internal claiming via transactions
 */
export async function runTask(taskId: string, agentId: string) {
  try {
    const taskRef = doc(db, 'agent_tasks', taskId);
    
    // 1. Try to claim the task via transaction
    const claimed = await claimTask(taskId, agentId);
    if (!claimed) {
      console.log(`[TaskEngine] ⏭️ Task skipped: ${taskId} already claimed or not pending for ${agentId}`);
      return null;
    }

    // Get fresh data after claim
    const taskSnap = await getDoc(taskRef);
    const task = { id: taskSnap.id, ...taskSnap.data() } as Task;

    // Workflow Guardrail: Check campaign status for production tasks
    const productionTasks: TaskType[] = ['brand_research', 'content_plan', 'design_direction', 'video_plan', 'ads_copy', 'whatsapp_sales_flow'];
    if (productionTasks.includes(task.type) && task.campaignId) {
      const briefSnap = await getDoc(doc(db, 'campaign_briefs', task.campaignId));
      if (briefSnap.exists()) {
        const brief = briefSnap.data();
        if (brief.status !== 'approved') {
          console.log(`[TaskEngine] 🛑 Task blocked: Campaign ${task.campaignId} is not approved.`);
          // Reset status to pending so it can be picked up later
          await updateDoc(taskRef, { status: 'pending', claimedBy: null, claimedAt: null });
          return null;
        }
      }
    }

    // Update Agent Status to Working
    await updateAgentStatus(task.assignedTo, 'Working', taskId);

    console.log(`[TaskEngine] ⚙️ Running task: ${taskId} (${task.type})`);

    // 4. Execute Logic
    const result = await executeTask(task);

    // Create Deliverable if applicable
    const deliverableTypesList = ['brand_research', 'content_plan', 'design_direction', 'video_plan', 'ads_copy', 'whatsapp_sales_flow'];
    if (deliverableTypesList.includes(task.type)) {
      await addDoc(collection(db, 'deliverables'), {
        brandId: task.brandId || null,
        campaignId: task.campaignId || null,
        ownerId: task.ownerId,
        department: task.department || 'General',
        type: task.type,
        title: `${task.type.replace('_', ' ').toUpperCase()} - ${new Date().toLocaleDateString()}`,
        status: 'in_review',
        version: 1,
        content: result,
        createdBy: task.assignedTo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Save Result to task_outputs collection
    await addDoc(collection(db, 'task_outputs'), {
      taskId,
      type: task.type,
      brandId: task.brandId || null,
      result,
      ownerId: task.ownerId,
      createdAt: serverTimestamp()
    });

    // Mark Task as Completed
    await updateDoc(taskRef, { 
      status: 'completed',
      completedAt: serverTimestamp()
    });

    // Update Agent Status to Idle
    await updateAgentStatus(task.assignedTo, 'Idle');

    console.log(`[TaskEngine] ✨ Task completed: ${taskId}`);

    // 3. Route Next Task automatically
    // Only route automatically for tasks that DON'T create deliverables (which need approval)
    const deliverableTypesForRouting = ['brand_research', 'content_plan', 'design_direction', 'video_plan', 'ads_copy', 'whatsapp_sales_flow'];
    if (!deliverableTypesForRouting.includes(task.type)) {
      await routeNextTask(task);
    }

    return result;
  } catch (error) {
    console.error(`[TaskEngine] 💥 Error running task ${taskId}:`, error);
    
    // Update task with failure details
    await updateDoc(doc(db, 'agent_tasks', taskId), { 
      status: 'failed',
      failedAt: serverTimestamp(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });

    // Reset agent status
    const taskSnap = await getDoc(doc(db, 'agent_tasks', taskId));
    if (taskSnap.exists()) {
      const task = taskSnap.data() as Task;
      await updateAgentStatus(task.assignedTo, 'Idle');
    }
    
    throw error;
  }
}

/**
 * Claims a task for an agent using a Firestore transaction.
 * Ensures only one agent can process a task.
 */
async function claimTask(taskId: string, agentId: string): Promise<boolean> {
  const taskRef = doc(db, 'agent_tasks', taskId);

  try {
    return await runTransaction(db, async (transaction) => {
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists()) return false;

      const data = taskDoc.data() as Task;
      
      // Only claim if pending and assigned to this agent
      if (data.status !== 'pending' || data.assignedTo !== agentId) {
        return false;
      }

      transaction.update(taskRef, {
        status: 'in_progress',
        claimedBy: agentId,
        claimedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return true;
    });
  } catch (error) {
    console.error(`[TaskEngine] ❌ Transaction failed for task ${taskId}:`, error);
    return false;
  }
}

/**
 * 4. Executes specific logic based on task type with real data integration
 */
export async function executeTask(task: Task) {
  console.log(`[TaskEngine] 🤖 Executing logic for: ${task.type}`);
  
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  switch (task.type) {
    case 'campaign_kickoff': {
      if (!task.campaignId) throw new Error('Missing campaignId');
      const briefSnap = await getDoc(doc(db, 'campaign_briefs', task.campaignId));
      if (!briefSnap.exists()) throw new Error('Campaign brief not found');
      const brief = briefSnap.data();
      
      return {
        message: `Campaign "${brief.objective}" kicked off by CEO.`,
        strategy: `Targeting ${brief.audience} with ${brief.offer}.`,
        status: 'success'
      };
    }

    case 'brand_research': {
      if (!task.brandId) throw new Error('Missing brandId');

      const brandSnap = await getDoc(doc(db, 'brands', task.brandId));
      if (!brandSnap.exists()) throw new Error('Brand not found');

      const brand = brandSnap.data();

      return {
        summary: `Research completed for ${brand.name}`,
        niche: brand.niche || '',
        market: brand.market || '',
        status: 'success'
      };
    }

    case 'content_plan':
      return {
        plan: "30-day content strategy generated.",
        pillars: ["Educational", "Behind the scenes", "Product focus"],
        status: "success"
      };

    case 'design_direction':
      return {
        palette: ["#FF9A9E", "#FAD0C4"],
        typography: "Inter, Space Grotesk",
        mood: "Premium & Minimal",
        status: "success"
      };

    case 'video_plan':
      return {
        scripts: ["Script 1: Morning Routine", "Script 2: Why our serum works"],
        shotList: ["Close up of product", "Application on skin"],
        status: "success"
      };

    case 'ads_copy':
      return {
        headline: "Unlock Your Natural Glow",
        body: "Our new serum is finally here. Shop now for 20% off.",
        cta: "Shop Now",
        status: "success"
      };

    case 'whatsapp_reply':
      return {
        reply: "Hello! Thank you for reaching out. Our team will assist you shortly.",
        status: "success"
      };

    case 'lead_intake':
      return {
        message: "New lead captured and logged.",
        status: "success"
      };

    case 'lead_qualification':
      return {
        score: 85,
        category: "High Intent",
        status: "success"
      };

    case 'send_price':
      return {
        message: "Price list sent to customer.",
        status: "success"
      };

    case 'handoff_to_sales':
      return {
        message: "Lead handed off to human sales agent.",
        status: "success"
      };

    default:
      return {
        message: "Task executed successfully",
        status: "success"
      };
  }
}

/**
 * 3. Routing system to automatically create the next task in the flow
 */
export async function routeNextTask(completedTask: Task) {
  const flow: Record<string, { next: TaskType | null, agent: string, dept?: string }> = {
    // Campaign Flow
    'campaign_kickoff': { next: 'brand_research', agent: 'brand_research_agent', dept: 'Research' },
    'brand_research': { next: 'content_plan', agent: 'content_agent', dept: 'Content' },
    'content_plan': { next: 'design_direction', agent: 'creative_agent', dept: 'Creative' },
    'design_direction': { next: 'video_plan', agent: 'video_agent', dept: 'Video' },
    'video_plan': { next: 'ads_copy', agent: 'media_buyer', dept: 'Media' },
    'ads_copy': { next: 'whatsapp_sales_flow', agent: 'whatsapp_agent', dept: 'Sales' },
    'whatsapp_sales_flow': { next: null, agent: '' },
    
    // WhatsApp Lead Pipeline
    'lead_intake': { next: 'lead_qualification', agent: 'whatsapp_agent', dept: 'Sales' },
    'lead_qualification': { next: 'whatsapp_reply', agent: 'whatsapp_agent', dept: 'Sales' },
    'whatsapp_reply': { next: null, agent: '' }, // Could route to send_price if logic allows
    'send_price': { next: 'handoff_to_sales', agent: 'whatsapp_agent', dept: 'Sales' },
    'handoff_to_sales': { next: null, agent: '' }
  };

  const nextStep = flow[completedTask.type];

  if (nextStep && nextStep.next) {
    console.log(`[TaskEngine] ➡️ Routing next task: ${nextStep.next}`);
    await createTask({
      type: nextStep.next,
      assignedTo: nextStep.agent,
      department: nextStep.dept,
      brandId: completedTask.brandId,
      refId: completedTask.id,
      priority: completedTask.priority || 'medium'
    });
  } else {
    console.log(`[TaskEngine] 🏁 Flow completed for: ${completedTask.type}`);
  }
}

/**
 * Real-time listener for agent tasks
 * Listens for 'pending' tasks assigned to a specific agent and owner.
 */
export function listenForAgentTasks(agentId: string, ownerId: string) {
  const q = query(
    collection(db, 'agent_tasks'),
    where('ownerId', '==', ownerId),
    where('assignedTo', '==', agentId),
    where('status', '==', 'pending')
  );

  console.log(`[AgentListener] 👂 Started listening for tasks assigned to: ${agentId} for owner: ${ownerId}`);

  return onSnapshot(q, async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'added' || change.type === 'modified') {
        const taskId = change.doc.id;
        const taskData = change.doc.data();

        if (taskData.status === 'pending') {
          console.log(`[AgentListener] 📥 Incoming task for ${agentId}: ${taskId} (${taskData.type})`);
          
          try {
            // runTask handles the claim via transaction
            await runTask(taskId, agentId);
          } catch (error) {
            console.error(`[AgentListener] ❌ Critical error in task ${taskId}:`, error);
          }
        }
      }
    }
  }, (error) => {
    console.error(`[AgentListener] 💥 Snapshot error for ${agentId}:`, error);
  });
}

/**
 * 5. Handles incoming WhatsApp messages and triggers the lead intake flow
 */
export async function handleIncomingWhatsAppMessage(messageData: {
  conversationId: string,
  text: string,
  customerPhone: string,
  ownerId: string,
  brandId?: string
}) {
  try {
    console.log(`[TaskEngine] 📱 New WhatsApp message from ${messageData.customerPhone}`);

    // 1. Create lead_intake task
    const taskId = await createTask({
      type: 'lead_intake',
      assignedTo: 'whatsapp_agent',
      department: 'Sales',
      brandId: messageData.brandId,
      refId: messageData.conversationId,
      priority: 'high',
      ownerId: messageData.ownerId
    });

    return taskId;
  } catch (error) {
    console.error("[TaskEngine] ❌ Error handling WhatsApp message:", error);
    throw error;
  }
}

// --- Helper Functions ---

/**
 * Updates agent status and active task in Firestore
 */
async function updateAgentStatus(agentId: string, status: 'Idle' | 'Working', activeTaskId?: string) {
  try {
    const agentRef = doc(db, 'ai_agents', agentId);
    await updateDoc(agentRef, {
      status,
      activeTask: activeTaskId || null,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.warn(`[TaskEngine] ⚠️ Could not update agent status for ${agentId}:`, error);
  }
}
