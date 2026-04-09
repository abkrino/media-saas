import { listenForAgentTasks } from './taskEngine';

/**
 * AI Agency OS - Agent Orchestrator
 * Manages the lifecycle of real-time listeners for all production AI agents.
 */

// Production Agent IDs (Document IDs in 'ai_agents' collection)
const AGENT_IDS = [
  'research_agent',
  'content_agent',
  'creative_agent',
  'video_agent',
  'media_buyer',
  'whatsapp_agent'
];

/**
 * Initializes listeners for all agents in the system.
 * Returns a cleanup function to unsubscribe from all listeners.
 */
export function startAllAgentListeners(ownerId: string) {
  console.log("%c[Orchestrator] 🚀 Initializing Production AI Agent Listeners...", "color: #FF9A9E; font-weight: bold; font-size: 12px;");
  
  const unsubscribes = AGENT_IDS.map(agentId => {
    try {
      return listenForAgentTasks(agentId, ownerId);
    } catch (error) {
      console.error(`[Orchestrator] ❌ Failed to start listener for ${agentId}:`, error);
      return () => {}; // Return empty cleanup
    }
  });

  // Return a master cleanup function
  return () => {
    console.log("[Orchestrator] 🛑 Shutting down all AI Agent listeners...");
    unsubscribes.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
  };
}

/**
 * Usage Example (in React):
 * 
 * useEffect(() => {
 *   const stopListeners = startAllAgentListeners();
 *   return () => stopListeners();
 * }, []);
 */
