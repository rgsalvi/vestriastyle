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
const STYLIST_IDENTITIES = ['tanvi_sankhe', 'muskaan_datt', 'riddhi_jogani'];

const availableStylists = [
    { name: 'Tanvi Sankhe', title: 'Lead Stylist', avatarUrl: 'https://picsum.photos/seed/tanvi/100/100' },
    { name: 'Muskaan Datt', title: 'Senior Stylist', avatarUrl: 'https://picsum.photos/seed/muskaan/100/100' },
    { name: 'Riddhi Jogani', title: 'Stylist', avatarUrl: 'https://picsum.photos/seed/riddhi/100/100' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { analysisContext, user, newItem } = req.body;
        if (!analysisContext || !user || !newItem) {
            return res.status(400).json({ success: false, message: 'Missing analysis context, user info, or new item info.' });
        }

        const randomStylist = availableStylists[Math.floor(Math.random() * availableStylists.length)];
        
        // Scope all actions to our specific Conversation Service
        const conversationService = client.conversations.v1.services(twilioConversationServiceSid);

        // Create a new conversation within the service
        const conversation = await conversationService.conversations.create({
            friendlyName: `Style Session for ${user.name}`
        });

        // Add the user to the conversation
        await conversationService.conversations(conversation.sid).participants.create({
            identity: user.id
        });
        
        // Add all available stylists so any can pick it up
        await Promise.all(STYLIST_IDENTITIES.map(stylistIdentity =>
            conversationService.conversations(conversation.sid).participants.create({
                identity: stylistIdentity
            })
        ));
        
        // --- Send Full Context to Stylist ---

        // 1. Send initial text context message
        const contextMessage = `
New session started for: ${user.name}
AI Verdict: ${analysisContext.verdict}
AI Advice: ${analysisContext.advice}
Compatibility: ${analysisContext.compatibility}
        `.trim();
        
        await conversationService.conversations(conversation.sid).messages.create({
            author: 'system',
            body: contextMessage,
        });

        // 2. Send the user's new item image
        await conversationService.conversations(conversation.sid).messages.create({
            author: 'system',
            body: newItem.dataUrl,
            attributes: JSON.stringify({ type: 'context-image', label: "User's New Item" })
        });
        
        // 3. Send the AI-generated outfit images
        if (analysisContext.generatedOutfitImages && analysisContext.generatedOutfitImages.length > 0) {
            for (const [index, base64Image] of analysisContext.generatedOutfitImages.entries()) {
                await conversationService.conversations(conversation.sid).messages.create({
                    author: 'system',
                    body: `data:image/png;base64,${base64Image}`,
                    attributes: JSON.stringify({ type: 'context-image', label: `AI Outfit Suggestion ${index + 1}` })
                });
            }
        }
        
        // --- End of Context Sending ---

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