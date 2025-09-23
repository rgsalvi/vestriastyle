
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

// Initialize Twilio client
const client = twilio(twilioApiKey, twilioApiSecret, { accountSid: twilioAccountSid });
const AccessToken = twilio.jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;

// For the MVP, we'll hardcode the stylist identities.
// In a real app, this would come from a database of online stylists.
const STYLIST_IDENTITIES = ['stylist_ava', 'stylist_leo', 'stylist_mia'];

const availableStylists = [
    { name: 'Ava Sinclair', title: 'Lead Stylist', avatarUrl: 'https://picsum.photos/seed/ava/100/100' },
    { name: 'Leo Rivera', title: 'Senior Stylist', avatarUrl: 'https://picsum.photos/seed/leo/100/100' },
    { name: 'Mia Chen', title: 'Stylist', avatarUrl: 'https://picsum.photos/seed/mia/100/100' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { analysisContext, user } = req.body;
        if (!analysisContext || !user) {
            return res.status(400).json({ success: false, message: 'Missing analysis context or user info.' });
        }

        const randomStylist = availableStylists[Math.floor(Math.random() * availableStylists.length)];

        // Create a new conversation
        const conversation = await client.conversations.v1.conversations.create({
            friendlyName: `Style Session for ${user.name}`
        });

        // Add the user to the conversation
        await client.conversations.v1.conversations(conversation.sid).participants.create({
            identity: user.id
        });
        
        // Add all available stylists so any can pick it up
        await Promise.all(STYLIST_IDENTITIES.map(stylistIdentity =>
            client.conversations.v1.conversations(conversation.sid).participants.create({
                identity: stylistIdentity
            })
        ));
        
        // Send initial context message for the stylist
        const contextMessage = `
          New session started for ${user.name} (${user.email}).
          Occasion: ${analysisContext.outfits[0].title || 'N/A'}
          AI Verdict: ${analysisContext.verdict}
          AI Advice: ${analysisContext.advice}
        `;
        
        await client.conversations.v1.conversations(conversation.sid).messages.create({
            author: 'system',
            body: contextMessage,
        });
        
        // Create an access token for the user
        const chatGrant = new ChatGrant({
            serviceSid: twilioConversationServiceSid,
        });
        const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret, {
            identity: user.id,
            ttl: 3600 // 1 hour
        });
        token.addGrant(chatGrant);
        
        return res.status(200).json({
            success: true,
            message: 'Chat session initiated successfully.',
            token: token.toJwt(),
            conversationSid: conversation.sid,
            stylist: randomStylist,
        });

    } catch (error) {
        console.error("Error initiating Twilio chat session:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return res.status(500).json({ success: false, message: 'Failed to initiate chat session.', error: errorMessage });
    }
}