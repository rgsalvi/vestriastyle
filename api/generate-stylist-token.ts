

import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

// Securely access Twilio credentials from environment variables
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioApiKey = process.env.TWILIO_API_KEY_SID;
const twilioApiSecret = process.env.TWILIO_API_KEY_SECRET;
const twilioConversationServiceSid = process.env.TWILIO_CONVERSATION_SERVICE_SID;

// Validate that all required environment variables are set
if (!twilioAccountSid || !twilioApiKey || !twilioApiSecret || !twilioConversationServiceSid) {
  throw new Error("Twilio environment variables are not set. Please check your Vercel project settings.");
}

const AccessToken = twilio.jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;

// In a real app, you would verify the stylist is authenticated.
// For the MVP, we'll allow any valid stylist ID.
const VALID_STYLISTS = ['tanvi_sankhe', 'muskaan_datt', 'riddhi_jogani'];

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { identity } = req.body;
        if (!identity || !VALID_STYLISTS.includes(identity)) {
            return res.status(400).json({ success: false, message: 'A valid stylist identity is required.' });
        }
        
        const chatGrant = new ChatGrant({
            serviceSid: twilioConversationServiceSid,
        });

        const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret, {
            identity: identity,
            ttl: 86400 // 24 hours
        });
        token.addGrant(chatGrant);

        return res.status(200).json({
            success: true,
            identity: identity,
            token: token.toJwt(),
        });

    } catch (error) {
        console.error("Error generating stylist token:", error);
        return res.status(500).json({ success: false, message: 'Failed to generate token.' });
    }
}