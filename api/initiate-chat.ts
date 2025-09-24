
import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

// Securely access Twilio credentials from environment variables
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioApiKey = process.env.TWILIO_API_KEY_SID;
const twilioApiSecret = process.env.TWILIO_API_KEY_SECRET;
// Accept both singular and plural env var names for Conversations Service SID
const twilioConversationServiceSid = process.env.TWILIO_CONVERSATION_SERVICE_SID || process.env.TWILIO_CONVERSATIONS_SERVICE_SID;

// Validate that all required environment variables are set
if (!twilioAccountSid || !twilioApiKey || !twilioApiSecret || !twilioConversationServiceSid) {
  throw new Error("Twilio environment variables are not set. Please check your Vercel project settings.");
}

// Initialize Twilio client
// After the guard above, these are safe to assert as defined for TypeScript
const ACCOUNT_SID: string = twilioAccountSid!;
const API_KEY: string = twilioApiKey!;
const API_SECRET: string = twilioApiSecret!;
const CONV_SERVICE_SID: string = twilioConversationServiceSid!;

const client = twilio(API_KEY, API_SECRET, { accountSid: ACCOUNT_SID });
const AccessToken = twilio.jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;

// Single source of truth for stylist information, including their unique ID and bio.
const availableStylists = [
    { 
        id: 'tanvi_sankhe', 
        name: 'Tanvi Sankhe', 
        title: 'Lead Stylist', 
        avatarUrl: '/tanvi.jpg',
        bio: 'I am a BMS graduate and later pursued a diploma in Fashion Designing from INIFD. Throughout my career, I’ve had the opportunity to freelance for various ads, a web series, jewelry shoots, campaigns, and catalogs. Worked with celebrities. I’ve also styled streetwear brands, jewelry brands, ethnic wear brands and I have done editorial shoots too while also working with influencers to create unique content. Additionally, I’ve worked as an E-commerce catalogue and campaign stylist. My personal style is simple, clothes that feel super comfortable. Personally, I love having colours in my wardrobe, but I always lean towards timeless classics over trends.I believe that once you discover your own unique style, you’ll feel confident and good in anything you wear.',
        signatureAesthetic: 'Modern classics with clean lines, elevated basics, and subtle color play—effortless but impeccably finished.',
        highlights: [
            'Lead stylist for e‑commerce campaign series (multi-brand)',
            'Editorial direction for streetwear + jewelry collaborations',
            'Celebrity styling for ads and web series'
        ],
        socials: {
            Instagram: 'https://instagram.com/',
            Pinterest: 'https://pinterest.com/'
        }
    },
    { 
        id: 'muskaan_datt', 
        name: 'Muskaan Datt', 
        title: 'Senior Stylist', 
        avatarUrl: '/muskaan.jpg',
        bio: 'I studied Fashion Communication & Styling at ISDI School of Design & Innovation Parsons, building a strong foundation in fashion storytelling, styling, and creative direction. Over the past few years, I’ve styled everything from celebrity looks and brand campaigns to editorials, catalogues, and even short films—combining creative vision with practical execution. From trend forecasting and shoot coordination to content curation, I bring versatility and attention to detail. My experience spans across streetwear, jewellery, wedding styling, evening wear, and much more. My personal style is about making “less is more” feel powerful. I love pieces that are effortless yet polished. Blending laid-back ease with timeless classics, my style is all about creating looks that look great, confident, and easy to live in because great style should feel as good as it looks.',
        signatureAesthetic: 'Minimalist elegance—clean silhouettes, luxurious textures, and refined neutrals for high-impact simplicity.',
        highlights: [
            'Brand campaign styling across fashion and jewelry',
            'Editorials and lookbooks with narrative styling',
            'Short-film costume and on-set coordination'
        ],
        socials: {
            Instagram: 'https://instagram.com/',
            Pinterest: 'https://pinterest.com/'
        }
    },
    { 
        id: 'riddhi_jogani', 
        name: 'Riddhi Jogani', 
        title: 'Stylist', 
        avatarUrl: '/riddhi.jpg',
        bio: 'I hold a BA in Psychology and a Diploma in Fashion Designing from the International Institute of Fashion Design. As a Fashion Stylist, I planned and executed catalogue and campaign shoots, My experience also includes a year as a Fashion Styling Intern and Assistant Stylist, where I collaborated with artists for reality shows and live events. My personal style is versatile and relaxed, which is a key part of my professional approach—I believe in creating looks that are effortlessly chic and authentic to the individual.',
        signatureAesthetic: 'Relaxed sophistication—versatile pieces styled for ease, authenticity, and effortless chic.',
        highlights: [
            'Catalogue and campaign styling for apparel brands',
            'Reality-show and live-event artist collaborations',
            'Assistant stylist experience across diverse formats'
        ],
        socials: {
            Instagram: 'https://instagram.com/',
            Pinterest: 'https://pinterest.com/'
        }
    },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { analysisContext, newItemContext, user } = req.body;
        if (!analysisContext || !user) {
            return res.status(400).json({ success: false, message: 'Missing analysis context or user info.' });
        }

        // Randomly assign one stylist for a 1-on-1 chat
        const assignedStylist = availableStylists[Math.floor(Math.random() * availableStylists.length)];
        
    const conversationService = client.conversations.v1.services(CONV_SERVICE_SID);

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
        });

        // Now, create a token for the user to join the conversation
        const chatGrant = new ChatGrant({ serviceSid: CONV_SERVICE_SID });

        const token = new AccessToken(ACCOUNT_SID, API_KEY, API_SECRET, {
            identity: user.id,
            ttl: 3600 // Token valid for 1 hour
        });
        token.addGrant(chatGrant);

        // Prepare initial images to be sent by the client upon connection.
        // The client also falls back to its local props (newItemContext/analysisContext.generatedOutfitImages)
        // if either of these are missing, so both sides always get full visual context.
        let initialImages = null;
        if (newItemContext && analysisContext.generatedOutfitImages) {
            initialImages = {
                newItem: {
                    base64: newItemContext.base64,
                    mimeType: newItemContext.mimeType,
                },
                outfits: analysisContext.generatedOutfitImages,
            };
        }

        // Send the token and conversation details back to the client
        return res.status(200).json({
            success: true,
            message: 'Chat session initiated.',
            token: token.toJwt(),
            conversationSid: conversation.sid,
            stylist: assignedStylist,
            initialImages: initialImages,
        });
        
    } catch (error) {
        console.error("Error in initiate-chat API:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        // Bubble Twilio REST error codes where available to help diagnose env or identity issues
        const detailed = (error as any)?.moreInfo || (error as any)?.code || undefined;
        return res.status(500).json({ success: false, message: 'Failed to initiate chat session.', error: errorMessage, details: detailed });
    }
}