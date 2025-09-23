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

// Single source of truth for stylist information, including their unique ID.
const availableStylists = [
    { id: 'tanvi_sankhe', name: 'Tanvi Sankhe', title: 'Lead Stylist', avatarUrl: 'https://picsum.photos/seed/tanvi/100/100' },
    { id: 'muskaan_datt', name: 'Muskaan Datt', title: 'Senior Stylist', avatarUrl: 'https://picsum.photos/seed/muskaan/100/100' },
    { id: 'riddhi_jogani', name: 'Riddhi Jogani', title: 'Stylist', avatarUrl: 'https://picsum.photos/seed/riddhi/100/100' },
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

        // Randomly assign one stylist for a 1-on-1 chat
        const assignedStylist = availableStylists[Math.floor(Math.random() * availableStylists.length)];
        
        const conversationService = client.conversations.v1.services(twilioConversationServiceSid);

        const conversation = await conversationService.conversations.create({
            friendlyName: `Style Session for ${user.name}`
        });

        // Add the user to the conversation
        await conversationService.conversations(conversation.sid).participants.create({
            identity: user.id
        });
        
        // Add ONLY the assigned stylist to the conversation
        await conversationService.conversations(conversation.sid).participants.create({
            identity: assignedStylist.id
        });
        
        // --- Send TEXT ONLY context to Stylist ---
        const textContext = `New style session for ${user.name}.\n\nVerdict: ${analysisContext.verdict}\n\nCompatibility: ${analysisContext.compatibility}\n\nAdvice: ${analysisContext.advice}`;
        
        await conversationService.conversations(conversation.sid).messages.create({
            author: 'system',
            body: textContext,
            attributes: JSON.stringify({ type: 'context_text' })
        });
        
        // --- End of Context Sending ---

        const chatGrant = new ChatGrant({
            serviceSid: twilioConversationServiceSid,
        });
        const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret, {
            identity: user.id,
            ttl: 3600 // 1 hour
        });
        token.addGrant(chatGrant);
        
        // Return the details of the assigned stylist to the user's UI
        return res.status(200).json({
            success: true,
            message: 'Chat session initiated successfully.',
            token: token.toJwt(),
            conversationSid: conversation.sid,
            stylist: {
                name: assignedStylist.name,
                title: assignedStylist.title,
                avatarUrl: assignedStylist.avatarUrl
            },
        });

    } catch (error) {
        console.error("Error initiating Twilio chat session:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return res.status(500).json({ success: false, message: 'Failed to initiate chat session.', error: errorMessage });
    }
}
