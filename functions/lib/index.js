"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onOutboundMessageCreated = exports.whatsappWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
admin.initializeApp();
const db = admin.firestore();
exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
    var _a, _b;
    if (req.method === "GET") {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];
        if (mode === "subscribe" && token === "abqarino_verify_token") {
            functions.logger.info("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        }
        else {
            functions.logger.warn("VERIFICATION_FAILED", { mode, token });
            res.sendStatus(403);
        }
        return;
    }
    if (req.method === "POST") {
        const body = req.body;
        functions.logger.info("WHATSAPP_EVENT_RECEIVED", {
            body: JSON.stringify(body, null, 2),
        });
        try {
            if (body.object === "whatsapp_business_account" && body.entry) {
                for (const entry of body.entry) {
                    for (const change of entry.changes) {
                        const value = change.value;
                        const metadata = value.metadata;
                        if (!metadata || !metadata.phone_number_id)
                            continue;
                        const phoneNumberId = metadata.phone_number_id;
                        const channelSnap = await db.collection("whatsapp_channels")
                            .where("phoneNumberId", "==", phoneNumberId)
                            .limit(1)
                            .get();
                        if (channelSnap.empty) {
                            functions.logger.warn("CHANNEL_NOT_FOUND", { phoneNumberId });
                            continue;
                        }
                        const channelData = channelSnap.docs[0].data();
                        const ownerId = channelData.ownerId;
                        const brandId = channelData.brandId;
                        if (value.messages && value.messages.length > 0) {
                            const contact = value.contacts ? value.contacts[0] : null;
                            const message = value.messages[0];
                            const customerWaId = contact ? contact.wa_id : message.from;
                            const customerName = contact && contact.profile ? contact.profile.name : "Unknown";
                            const metaMessageId = message.id;
                            const messageType = message.type;
                            let content = "";
                            if (messageType === "text") {
                                content = message.text.body;
                            }
                            else if (messageType === "interactive") {
                                content = ((_a = message.interactive.button_reply) === null || _a === void 0 ? void 0 : _a.title) ||
                                    ((_b = message.interactive.list_reply) === null || _b === void 0 ? void 0 : _b.title) ||
                                    "Interactive Message";
                            }
                            else if (messageType === "button") {
                                content = message.button.text;
                            }
                            else {
                                content = `[${messageType}]`;
                            }
                            const conversationId = await findOrCreateConversation(customerWaId, customerName, content, ownerId, brandId);
                            await saveIncomingMessage(conversationId, customerWaId, messageType, content, metaMessageId, body, ownerId);
                            functions.logger.info("MESSAGE_PROCESSED", { conversationId, metaMessageId, ownerId });
                        }
                    }
                }
                res.status(200).send("EVENT_RECEIVED");
            }
            else {
                res.status(200).send("NOT_A_MESSAGE_EVENT");
            }
        }
        catch (error) {
            functions.logger.error("WEBHOOK_PROCESSING_ERROR", error);
            res.status(200).send("PROCESSED_WITH_ERROR");
        }
        return;
    }
    res.sendStatus(405);
});
exports.onOutboundMessageCreated = functions.firestore
    .document("whatsapp_messages/{messageId}")
    .onCreate(async (snap, context) => {
    var _a, _b, _c, _d;
    const message = snap.data();
    if (message.direction !== "outbound")
        return;
    const { conversationId, content, ownerId } = message;
    try {
        const convSnap = await db.collection("whatsapp_conversations").doc(conversationId).get();
        if (!convSnap.exists)
            throw new Error("Conversation not found");
        const convData = convSnap.data();
        const customerWaId = convData.customerWaId;
        const brandId = convData.brandId;
        const channelSnap = await db.collection("whatsapp_channels")
            .where("brandId", "==", brandId)
            .where("ownerId", "==", ownerId)
            .limit(1)
            .get();
        if (channelSnap.empty)
            throw new Error("WhatsApp channel not configured for this brand");
        const channelData = channelSnap.docs[0].data();
        const { accessToken, phoneNumberId } = channelData;
        if (!accessToken || !phoneNumberId)
            throw new Error("Missing WhatsApp API credentials");
        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
        const response = await axios_1.default.post(url, {
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
        await snap.ref.update({
            metaMessageId: response.data.messages[0].id,
            status: "sent",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        functions.logger.info("OUTBOUND_MESSAGE_SENT", { messageId: context.params.messageId, metaId: response.data.messages[0].id });
    }
    catch (error) {
        functions.logger.error("OUTBOUND_MESSAGE_FAILED", {
            messageId: context.params.messageId,
            error: ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message
        });
        await snap.ref.update({
            status: "failed",
            errorMessage: ((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
});
async function findOrCreateConversation(customerWaId, customerName, lastMessage, ownerId, brandId) {
    const conversationsRef = db.collection("whatsapp_conversations");
    const query = await conversationsRef
        .where("customerWaId", "==", customerWaId)
        .where("ownerId", "==", ownerId)
        .where("brandId", "==", brandId)
        .limit(1)
        .get();
    const now = admin.firestore.FieldValue.serverTimestamp();
    if (!query.empty) {
        const doc = query.docs[0];
        const data = doc.data();
        await doc.ref.update({
            lastMessage,
            lastMessageAt: now,
            updatedAt: now,
            customerName: customerName !== "Unknown" ? customerName : data.customerName,
            status: "open"
        });
        return doc.id;
    }
    else {
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
        return newDoc.id;
    }
}
async function saveIncomingMessage(conversationId, customerWaId, messageType, content, metaMessageId, rawPayload, ownerId) {
    const messagesRef = db.collection("whatsapp_messages");
    await messagesRef.add({
        conversationId,
        ownerId,
        customerWaId,
        direction: "inbound",
        messageType,
        content,
        metaMessageId,
        rawPayload,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
}
//# sourceMappingURL=index.js.map