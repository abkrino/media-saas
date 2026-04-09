import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  runTransaction,
  query,
  where,
  orderBy,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Deliverable, DeliverableFeedback, DeliverableVersion } from '../data';
import { createTask, routeNextTask } from './taskEngine';

/**
 * AI Agency OS - Deliverable Service
 * Handles approvals, revisions, and versioning of agent outputs.
 */

export async function approveDeliverable(deliverable: Deliverable, userId: string) {
  const deliverableRef = doc(db, 'deliverables', deliverable.id);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Update deliverable status
      transaction.update(deliverableRef, {
        status: 'approved',
        updatedAt: serverTimestamp()
      });

      // 2. Add feedback entry
      const feedbackRef = doc(collection(db, 'deliverable_feedback'));
      transaction.set(feedbackRef, {
        deliverableId: deliverable.id,
        authorType: 'user',
        authorId: userId,
        message: 'Approved by user.',
        actionType: 'approve',
        createdAt: serverTimestamp()
      });
    });

    console.log(`[DeliverableService] ✅ Deliverable approved: ${deliverable.id}`);
    
    // Workflow logic: Approval triggers next task in flow
    // We need to mock a "completed task" object to pass to routeNextTask
    await routeNextTask({
      type: deliverable.type as any,
      brandId: deliverable.brandId,
      ownerId: deliverable.ownerId,
      status: 'completed',
      assignedTo: deliverable.createdBy,
      createdAt: deliverable.createdAt
    });
    
  } catch (error) {
    console.error("[DeliverableService] ❌ Error approving deliverable:", error);
    throw error;
  }
}

export async function requestRevision(
  deliverable: Deliverable, 
  userId: string, 
  feedbackMessage: string,
  adjustments?: string[]
) {
  const deliverableRef = doc(db, 'deliverables', deliverable.id);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Update deliverable status
      transaction.update(deliverableRef, {
        status: 'needs_revision',
        updatedAt: serverTimestamp()
      });

      // 2. Add feedback entry
      const feedbackRef = doc(collection(db, 'deliverable_feedback'));
      transaction.set(feedbackRef, {
        deliverableId: deliverable.id,
        authorType: 'user',
        authorId: userId,
        message: feedbackMessage,
        actionType: 'request_revision',
        adjustments: adjustments || [],
        createdAt: serverTimestamp()
      });
    });

    // 3. Create a new task for the agent to handle the revision
    await createTask({
      type: deliverable.type as any,
      assignedTo: deliverable.createdBy,
      department: deliverable.department,
      brandId: deliverable.brandId,
      refId: deliverable.id,
      priority: 'high',
      description: `Revision requested: ${feedbackMessage}. Adjustments: ${adjustments?.join(', ')}`
    });

    console.log(`[DeliverableService] 🔄 Revision requested for: ${deliverable.id}`);
  } catch (error) {
    console.error("[DeliverableService] ❌ Error requesting revision:", error);
    throw error;
  }
}

export async function createNewVersion(deliverableId: string, content: any, changeSummary: string, agentId: string) {
  const deliverableRef = doc(db, 'deliverables', deliverableId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(deliverableRef);
      if (!snap.exists()) throw new Error("Deliverable not found");
      
      const data = snap.data() as Deliverable;
      const nextVersion = (data.version || 1) + 1;

      // 1. Create version record
      const versionRef = doc(collection(db, 'deliverable_versions'));
      transaction.set(versionRef, {
        deliverableId,
        version: nextVersion,
        content,
        changeSummary,
        createdBy: agentId,
        createdAt: serverTimestamp()
      });

      // 2. Update main deliverable
      transaction.update(deliverableRef, {
        version: nextVersion,
        content,
        status: 'in_review',
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error("[DeliverableService] ❌ Error creating new version:", error);
    throw error;
  }
}
