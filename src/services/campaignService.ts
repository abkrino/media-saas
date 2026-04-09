import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { CampaignBrief } from '../data';
import { createTask } from './taskEngine';

/**
 * AI Agency OS - Campaign Service
 * Handles campaign creation and kickoff.
 */

export async function kickoffCampaign(briefData: Partial<CampaignBrief>) {
  try {
    // 1. Create Campaign Brief
    const briefRef = await addDoc(collection(db, 'campaign_briefs'), {
      ...briefData,
      status: 'approved', // Auto-approve for now as per kickoff flow
      createdAt: serverTimestamp()
    });

    // 2. Create Kickoff Task for CEO Agent
    await createTask({
      type: 'campaign_kickoff',
      assignedTo: 'ceo_agent',
      department: 'Strategy',
      brandId: briefData.brandId,
      campaignId: briefRef.id,
      priority: 'high',
      description: `Kickoff campaign: ${briefData.objective}`
    });

    console.log(`[CampaignService] 🚀 Campaign kicked off: ${briefRef.id}`);
    return briefRef.id;
  } catch (error) {
    console.error("[CampaignService] ❌ Error kicking off campaign:", error);
    throw error;
  }
}
