import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioApiKey = process.env.TWILIO_API_KEY_SID;
const twilioApiSecret = process.env.TWILIO_API_KEY_SECRET;

if (!twilioAccountSid || !twilioApiKey || !twilioApiSecret) {
  throw new Error("Twilio Video environment variables are not set.");
}

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { identity, roomName } = req.body;
        if (!identity || !roomName) {
            return res.status(400).json({ success: false, message: 'Identity and roomName are required.' });
        }
        
        // Non-null assertion is safe here because we throw above if any are missing
        const token = new AccessToken(twilioAccountSid!, twilioApiKey!, twilioApiSecret!, {
            identity: identity,
            ttl: 3600 // 1 hour
        });
        
        const videoGrant = new VideoGrant({
            room: roomName,
        });
        token.addGrant(videoGrant);

        return res.status(200).json({
            success: true,
            token: token.toJwt(),
        });

    } catch (error) {
        console.error("Error generating Twilio video token:", error);
        return res.status(500).json({ success: false, message: 'Failed to generate video token.' });
    }
}