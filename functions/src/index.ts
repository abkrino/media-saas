import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * WhatsApp Webhook Function
 * Handles Meta verification (GET) and incoming events (POST)
 */
export const whatsappWebhook = functions.https.onRequest((req, res) => {
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
    const body = req.body;

    // Log the payload for debugging
    functions.logger.info("WHATSAPP_EVENT_RECEIVED", {
      body: JSON.stringify(body, null, 2),
    });

    // Check if this is a WhatsApp Business API payload
    if (body.object) {
      // Return 200 to acknowledge receipt
      res.status(200).send("EVENT_RECEIVED");
    } else {
      // Not a WhatsApp API payload
      res.sendStatus(404);
    }
    return;
  }

  // 3. Handle Unsupported Methods
  res.sendStatus(405);
});
