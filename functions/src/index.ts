import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import axios from "axios";

const app = admin.initializeApp();

// CRITICAL: Use the named database ID from firebase-applet-config.json
// In firebase-admin 11.x, getFirestore(app, databaseId) is the correct way
const db = getFirestore(app, "ai-studio-728a75a1-6bf9-4a4d-8d35-5b0c9b21d9cd");

// Startup Log to verify connectivity
(async () => {
  try {
    functions.logger.info("STARTING_UP", { databaseId: "ai-studio-728a75a1-6bf9-4a4d-8d35-5b0c9b21d9cd" });
    await db.collection("webhook_logs").add({
      timestamp: FieldValue.serverTimestamp(),
      type: "system_startup",
      message: "Cloud Function initialized and connected to Firestore",
      ownerId: "SYSTEM"
    });
    functions.logger.info("SYSTEM_STARTUP_LOG_SUCCESS");
  } catch (e: any) {
    functions.logger.error("SYSTEM_STARTUP_LOG_FAILED", {error: e.message, stack: e.stack});
  }
})();

/**
 * WhatsApp Webhook Function
 * Handles Meta verification (GET) and incoming events (POST)
 */
export const whatsappWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Handle Meta Webhook Verification (GET)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Check if mode and token are correct
    if (mode === "subscribe" && token === "abqarino_verify_token") {
      functions.logger.info("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      functions.logger.warn("VERIFICATION_FAILED", {mode, token});
      res.sendStatus(403);
    }
    return;
  }

  // 2. Handle Incoming WhatsApp Events (POST)
  if (req.method === "POST") {
    let body = req.body;

    // Meta sometimes sends body as string, parse it if needed
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        functions.logger.error("BODY_PARSE_FAILED", { body });
      }
    }

    // Log the payload for debugging
    functions.logger.info("WHATSAPP_EVENT_RECEIVED", {
      body: JSON.stringify(body, null, 2),
    });

    try {
      // Check if this is a WhatsApp Business API payload
      if (body.object === "whatsapp_business_account" && body.entry) {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            const value = change.value;
            const metadata = value.metadata;
            
            if (!metadata || !metadata.phone_number_id) continue;
            
            const phoneNumberId = metadata.phone_number_id;

            try {
              // 1. WHATSAPP_EVENT_RECEIVED
              functions.logger.info("STEP_1_LOGGING_EVENT");
              await db.collection("webhook_logs").add({
                timestamp: FieldValue.serverTimestamp(),
                type: "WHATSAPP_EVENT_RECEIVED",
                phoneNumberId,
                metadata,
                raw_body: body,
                ownerId: "SYSTEM_WEBHOOK"
              });

              // DEBUG: Start Lookup
              functions.logger.info("STEP_2_START_LOOKUP");
              await db.collection("webhook_logs").add({
                timestamp: FieldValue.serverTimestamp(),
                type: "DEBUG_START_LOOKUP",
                phoneNumberId,
                ownerId: "SYSTEM_WEBHOOK"
              });

              // 2. Lookup ownerId and brandId
              functions.logger.info("STEP_2_START_LOOKUP", { phoneNumberId });
              const channelSnap = await db.collection("whatsapp_channels")
                .where("phoneNumberId", "==", phoneNumberId)
                .limit(1)
                .get();

              // DEBUG: Query Complete
              functions.logger.info("STEP_3_QUERY_COMPLETE", { empty: channelSnap.empty, size: channelSnap.size });
              await db.collection("webhook_logs").add({
                timestamp: FieldValue.serverTimestamp(),
                type: "DEBUG_QUERY_COMPLETE",
                empty: channelSnap.empty,
                size: channelSnap.size,
                phoneNumberId,
                ownerId: "SYSTEM_WEBHOOK"
              });

              if (channelSnap.empty) {
                const allChannelsSnap = await db.collection("whatsapp_channels").limit(10).get();
                const availableIds = allChannelsSnap.docs.map(d => d.data().phoneNumberId);
                
                await db.collection("webhook_logs").add({
                  timestamp: FieldValue.serverTimestamp(),
                  type: "WHATSAPP_BRAND_LOOKUP_FAILED",
                  message: `Channel not found for Phone ID: ${phoneNumberId}. Available in DB: ${availableIds.join(', ')}`,
                  phoneNumberId,
                  ownerId: "SYSTEM_WEBHOOK"
                });
                continue;
              }

              const channelData = channelSnap.docs[0].data();
              const ownerId = channelData.ownerId;
              const brandId = channelData.brandId;

              // 3. WHATSAPP_BRAND_LOOKUP_SUCCESS
              await db.collection("webhook_logs").add({
                timestamp: FieldValue.serverTimestamp(),
                type: "WHATSAPP_BRAND_LOOKUP_SUCCESS",
                phoneNumberId,
                ownerId,
                brandId
              });

              // Check if there are messages in this change
              if (value.messages && value.messages.length > 0) {
                const contact = value.contacts ? value.contacts[0] : null;
                const message = value.messages[0];

                // Extract data
                const customerWaId = contact ? contact.wa_id : message.from;
                const customerName = contact && contact.profile ? contact.profile.name : "Unknown";
                const metaMessageId = message.id;
                const messageType = message.type;

                let content = "";
                if (messageType === "text") {
                  content = message.text.body;
                } else if (messageType === "interactive") {
                  content = message.interactive.button_reply?.title || 
                            message.interactive.list_reply?.title || 
                            "Interactive Message";
                } else if (messageType === "button") {
                  content = message.button.text;
                } else {
                  content = `[${messageType}]`;
                }

                // 4. Find or Create Conversation
                functions.logger.info("STEP_4_CONVERSATION_LOGIC");
                const { conversationId, isNew } = await findOrCreateConversation(customerWaId, customerName, content, ownerId, brandId);
                
                // 5. WHATSAPP_CONVERSATION_CREATED / FOUND
                await db.collection("webhook_logs").add({
                  timestamp: FieldValue.serverTimestamp(),
                  type: isNew ? "WHATSAPP_CONVERSATION_CREATED" : "WHATSAPP_CONVERSATION_FOUND",
                  conversationId,
                  customerWaId,
                  ownerId
                });

                // 6. Save Message inside whatsapp_messages
                functions.logger.info("STEP_5_SAVE_MESSAGE");
                const messageId = await saveIncomingMessage(conversationId, customerWaId, messageType, content, metaMessageId, body, ownerId);
                
                // 7. WHATSAPP_MESSAGE_SAVED
                await db.collection("webhook_logs").add({
                  timestamp: FieldValue.serverTimestamp(),
                  type: "WHATSAPP_MESSAGE_SAVED",
                  messageId,
                  conversationId,
                  ownerId
                });

                // 8. WHATSAPP_CONVERSATION_UPDATED
                await db.collection("webhook_logs").add({
                  timestamp: FieldValue.serverTimestamp(),
                  type: "WHATSAPP_CONVERSATION_UPDATED",
                  conversationId,
                  lastMessage: content,
                  ownerId
                });
                
                functions.logger.info("MESSAGE_PROCESSED_SUCCESSFULLY", {conversationId, metaMessageId, ownerId});
              }
            } catch (innerError: any) {
              functions.logger.error("FIRESTORE_WRITE_ERROR", {
                message: innerError.message,
                code: innerError.code,
                stack: innerError.stack
              });
              // Try to log error one last time, but don't fail if this also fails
              try {
                await db.collection("webhook_logs").add({
                  timestamp: FieldValue.serverTimestamp(),
                  type: "WHATSAPP_PROCESSING_ERROR",
                  message: innerError.message,
                  phoneNumberId,
                  ownerId: "SYSTEM_WEBHOOK"
                });
              } catch (e) {}
            }
          }
        }
        res.status(200).send("EVENT_RECEIVED");
      } else {
        // Not a WhatsApp message event (could be a status update or other)
        res.status(200).send("NOT_A_MESSAGE_EVENT");
      }
    } catch (error) {
      functions.logger.error("WEBHOOK_PROCESSING_ERROR", error);
      res.status(200).send("PROCESSED_WITH_ERROR");
    }
    return;
  }

  // 3. Handle Unsupported Methods
  res.sendStatus(405);
});

/**
 * Outbound Message Trigger
 * Listens for new outbound messages in Firestore and sends them via WhatsApp API
 */
export const onOutboundMessageCreated = functions.firestore
  .database("ai-studio-728a75a1-6bf9-4a4d-8d35-5b0c9b21d9cd")
  .document("whatsapp_messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    
    // Only process outbound messages
    if (message.direction !== "outbound") return;

    const { conversationId, content, ownerId } = message;

    try {
      // 1. Get Conversation to get customerWaId
      const convSnap = await db.collection("whatsapp_conversations").doc(conversationId).get();
      if (!convSnap.exists) throw new Error("Conversation not found");
      const convData = convSnap.data()!;
      const customerWaId = convData.customerWaId;
      const brandId = convData.brandId;

      // 2. Get Channel Config to get Access Token and Phone Number ID
      const channelSnap = await db.collection("whatsapp_channels")
        .where("brandId", "==", brandId)
        .where("ownerId", "==", ownerId)
        .limit(1)
        .get();

      if (channelSnap.empty) throw new Error("WhatsApp channel not configured for this brand");
      const channelData = channelSnap.docs[0].data();
      const { accessToken, phoneNumberId } = channelData;

      if (!accessToken || !phoneNumberId) throw new Error("Missing WhatsApp API credentials");

      // 3. Call Meta Graph API
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      const response = await axios.post(url, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: customerWaId,
        type: "text",
        text: { body: content }
      }, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      // 4. Update message with Meta ID and status
      await snap.ref.update({
        metaMessageId: response.data.messages[0].id,
        status: "sent",
        updatedAt: FieldValue.serverTimestamp()
      });

      functions.logger.info("OUTBOUND_MESSAGE_SENT", {messageId: context.params.messageId, metaId: response.data.messages[0].id});

    } catch (error: any) {
      functions.logger.error("OUTBOUND_MESSAGE_FAILED", {
        messageId: context.params.messageId,
        error: error.response?.data || error.message
      });
      
      await snap.ref.update({
        status: "failed",
        errorMessage: error.response?.data?.error?.message || error.message,
        updatedAt: FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Helper: Find or Create a Conversation
 */
async function findOrCreateConversation(customerWaId: string, customerName: string, lastMessage: string, ownerId: string, brandId: string) {
  const conversationsRef = db.collection("whatsapp_conversations");

  // Query for existing conversation with this wa_id and owner
  const query = await conversationsRef
    .where("customerWaId", "==", customerWaId)
    .where("ownerId", "==", ownerId)
    .where("brandId", "==", brandId)
    .limit(1)
    .get();

  const now = FieldValue.serverTimestamp();

  if (!query.empty) {
    const doc = query.docs[0];
    const data = doc.data();
    
    await doc.ref.update({
      lastMessage,
      lastMessageAt: now,
      updatedAt: now,
      customerName: customerName !== "Unknown" ? customerName : data.customerName,
      status: "open" // Re-open if closed
    });
    return { conversationId: doc.id, isNew: false };
  } else {
    const newDoc = await conversationsRef.add({
      brandId,
      ownerId,
      customerWaId,
      customerName,
      lastMessage,
      lastMessageAt: now,
      status: "open",
      intent: "Unknown",
      leadScore: 0,
      unreadCount: 1,
      createdAt: now,
      updatedAt: now
    });
    return { conversationId: newDoc.id, isNew: true };
  }
}

/**
 * Helper: Save Incoming Message
 */
async function saveIncomingMessage(
  conversationId: string,
  customerWaId: string,
  messageType: string,
  content: string,
  metaMessageId: string,
  rawPayload: any,
  ownerId: string
) {
  const messagesRef = db.collection("whatsapp_messages");

  const doc = await messagesRef.add({
    conversationId,
    ownerId,
    customerWaId,
    direction: "inbound",
    messageType,
    content,
    metaMessageId,
    rawPayload,
    createdAt: FieldValue.serverTimestamp()
  });
  return doc.id;
}
