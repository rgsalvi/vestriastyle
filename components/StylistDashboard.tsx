import React, { useState, useEffect, useRef } from 'react';
import { Client, Conversation, Message, Participant } from '@twilio/conversations';
import Video, { Room, LocalTrack, RemoteParticipant, createLocalTracks } from 'twilio-video';

// ... (STYLISTS array and icons remain the same)
const STYLISTS = [
    { id: 'tanvi_sankhe', name: 'Tanvi Sankhe' },
    { id: 'muskaan_datt', name: 'Muskaan Datt' },
    { id: 'riddhi_jogani', name: 'Riddhi Jogani' },
];
const AttachIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.497a1.5 1.5 0 012.121-2.121l-1.414-1.414a.5.5 0 00-.707.707l1.414 1.414a2.5 2.5 0 01-3.536 3.536l-.496.496a4 4 0 01-5.657-5.657l7-7a4 4 0 015.657 5.657h-.001l-.496.497a2.5 2.5 0 01-3.536-3.536l1.414-1.414a.5.5 0 00.707-.707l-1.414-1.414a1.5 1.5 0 01-2.121 2.121l.497.497a3 3 0 004.242 0z" clipRule="evenodd" />
    </svg>
);
const MicOnIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
    </svg>
);
const MicOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a7 7 0 005.47-2.502a1 1 0 00-1.353-1.476A5.002 5.002 0 015 8a1 1 0 00-2 0 7 7 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07zM9.243 3.03a3 3 0 014.514 0 1 1 0 001.528-1.303A5 5 0 006.183 6.9a1 1 0 101.93.513A3.001 3.001 0 019.243 3.03zM5.383 6.383a1 1 0 00-1.414 1.414l9.192 9.192a1 1 0 001.414-1.414L5.383 6.383z" clipRule="evenodd" />
    </svg>
);
const EndCallIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 10.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414l-3-3z" />
      <path d="M10.707 10.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414l-3-3z" />
      <path fillRule="evenodd" d="M3.738 2.05A11.956 11.956 0 0110 0c4.35 0 8.23.23 11.262.65a1 1 0 01.688 1.348l-1 4a1 1 0 01-1.23.688C17.36 5.86 13.98 5 10 5s-7.36.86-9.72 1.688A1 1 0 01-1 6.05l-1-4a1 1 0 01.688-1.348A11.956 11.956 0 013.738 2.05z" clipRule="evenodd" />
    </svg>
);


// Fix: Define the ProcessedMessage interface to resolve type errors
interface ProcessedMessage {
    sid: string;
    author: string | null;
    body: string | null;
    dateCreated: Date;
    attributes: any;
    media?: {
        url: string;
        contentType: string;
    };
}
// Fix: Implement the LoginPage component to return JSX and resolve the return type error.
const LoginPage: React.FC<{ onLogin: (identity: string) => void }> = ({ onLogin }) => {
    const [selectedStylist, setSelectedStylist] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStylist) {
            onLogin(selectedStylist);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-dark-blue p-4">
            <div className="w-full max-w-md text-center bg-dark-blue/80 backdrop-blur-lg p-8 md:p-12 rounded-2xl shadow-lg border border-platinum/20">
                <h2 className="text-3xl font-bold text-platinum tracking-tight">Stylist Login</h2>
                <p className="mt-2 text-lg text-platinum/60">Select your profile to begin.</p>
                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <select
                        value={selectedStylist}
                        onChange={(e) => setSelectedStylist(e.target.value)}
                        className="block w-full text-lg bg-dark-blue border-platinum/30 rounded-full focus:ring-platinum focus:border-platinum transition-colors text-platinum placeholder-platinum/50 px-6 py-3"
                    >
                        <option value="">Select your name</option>
                        {STYLISTS.map(stylist => (
                            <option key={stylist.id} value={stylist.id}>{stylist.name}</option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        disabled={!selectedStylist}
                        className="w-full bg-platinum text-dark-blue font-bold py-3 px-4 rounded-full shadow-lg shadow-platinum/10 hover:scale-105 disabled:bg-platinum/50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum/50"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};
// Fix: Implement the processTwilioMessage helper function to properly format message data.
const processTwilioMessage = async (message: Message): Promise<ProcessedMessage> => {
    let media;
    if (message.type === 'media' && message.media) {
        try {
            const url = await message.media.getContentTemporaryUrl();
            media = { url, contentType: message.media.contentType };
        } catch (e) {
            console.error("Could not get media URL", e);
        }
    }

    return {
        sid: message.sid,
        author: message.author,
        body: message.body,
        dateCreated: message.dateCreated,
        attributes: message.attributes || {},
        media,
    };
};

export const StylistDashboard: React.FC = () => {
    // ... (Existing state)
    const [identity, setIdentity] = useState<string | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ProcessedMessage[]>([]);
    const [input, setInput] = useState('');
    const [isUserTyping, setIsUserTyping] = useState(false);

    // New video state
    const [videoRoom, setVideoRoom] = useState<Room | null>(null);
    const [isConnectingVideo, setIsConnectingVideo] = useState(false);
    const [localAudioTrack, setLocalAudioTrack] = useState<LocalTrack | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null); // RemoteVideoTrack
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<any>(null); // RemoteAudioTrack
    const [isMuted, setIsMuted] = useState(false);
    const [videoCallRequestSid, setVideoCallRequestSid] = useState<string | null>(null);
    
    // ... (Refs)
    const messageEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);

    // ... (handleLogin and client useEffect remain the same)
    
    // Updated conversation useEffect
    useEffect(() => {
        if (!activeConversation || !identity) return;
        
        const setupConversation = async () => {
            setIsUserTyping(false);
            setVideoCallRequestSid(null); // Reset on new conversation
            
            const twilioMessages = (await activeConversation.getMessages()).items;
            const processedMessages = await Promise.all(twilioMessages.map(processTwilioMessage));
            setMessages(processedMessages.sort((a, b) => a.dateCreated.getTime() - b.dateCreated.getTime()));

            // Check for existing video call requests
            const existingRequest = processedMessages.find(m => m.attributes.type === 'video_call_request');
            if (existingRequest) {
                setVideoCallRequestSid(activeConversation.sid);
            }
            
            const onMessageAdded = async (message: Message) => {
                if (message.attributes && typeof message.attributes === 'object' && (message.attributes as any).type === 'video_call_request') {
                    setVideoCallRequestSid(activeConversation.sid);
                } else {
                    const processedMsg = await processTwilioMessage(message);
                    setMessages(prev => [...prev, processedMsg]);
                }
            };
            // ... (Typing listeners)
            activeConversation.on('messageAdded', onMessageAdded);
            // ...
            return () => { /* cleanup */ };
        };
        setupConversation();
    }, [activeConversation, identity]);

    // ... (scroll useEffect)
    // ... (sendMessage, handleInputChange, attach, fileChange)

    // New Video functions
    const joinVideoCall = async () => {
        if (!activeConversation || !identity) return;
        setIsConnectingVideo(true);

        try {
            const response = await fetch('/api/generate-video-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity, roomName: activeConversation.sid }),
            });
            const data = await response.json();
            if (!data.success) throw new Error("Failed to get video token.");
            
            // CRITICAL: Request audio only for stylist
            const tracks = await createLocalTracks({ audio: true, video: false });
            const audioTrack = tracks.find(t => t.kind === 'audio') as LocalTrack;
            setLocalAudioTrack(audioTrack);

            const room = await Video.connect(data.token, { name: activeConversation.sid, tracks });
            setVideoRoom(room);

            room.participants.forEach(participant => {
                participant.tracks.forEach(publication => {
                    if (publication.track) {
                        if (publication.track.kind === 'video') setRemoteVideoTrack(publication.track);
                        if (publication.track.kind === 'audio') setRemoteAudioTrack(publication.track);
                    }
                });
                participant.on('trackSubscribed', track => {
                    if (track.kind === 'video') setRemoteVideoTrack(track);
                    if (track.kind === 'audio') setRemoteAudioTrack(track);
                });
            });
            
            room.on('participantConnected', (participant: RemoteParticipant) => {
                participant.on('trackSubscribed', track => {
                    if (track.kind === 'video') setRemoteVideoTrack(track);
                    if (track.kind === 'audio') setRemoteAudioTrack(track);
                });
            });

            room.on('disconnected', () => { endVideoCall(); });

        } catch (error) {
            console.error("Failed to join video call:", error);
        } finally {
            setIsConnectingVideo(false);
        }
    };
    
    const endVideoCall = () => {
        if (videoRoom) videoRoom.disconnect();
        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.detach();
            setLocalAudioTrack(null);
        }
        setVideoRoom(null);
        setRemoteVideoTrack(null);
        setRemoteAudioTrack(null);
        setIsMuted(false);
        setVideoCallRequestSid(null); // Allow re-joining if needed
    };

    const toggleMute = () => {
        if (localAudioTrack) {
            localAudioTrack.isEnabled ? localAudioTrack.disable() : localAudioTrack.enable();
            setIsMuted(!localAudioTrack.isEnabled);
        }
    };

    useEffect(() => {
        if (remoteVideoTrack && remoteVideoRef.current) {
            remoteVideoTrack.attach(remoteVideoRef.current);
            return () => { if (remoteVideoTrack.detach) remoteVideoTrack.detach(); };
        }
    }, [remoteVideoTrack]);

    useEffect(() => {
        if (remoteAudioTrack && remoteAudioRef.current) {
            remoteAudioTrack.attach(remoteAudioRef.current);
            return () => { if (remoteAudioTrack.detach) remoteAudioTrack.detach(); };
        }
    }, [remoteAudioTrack]);

    // ... (Login page return)
    // ...
    
    return (
        <div className="h-screen w-screen flex antialiased text-platinum bg-dark-blue">
            {/* ... (Sidebar) */}
            <div className="flex flex-col flex-auto h-full p-4">
                {activeConversation ? (
                    <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-black/20 h-full p-4">
                        {/* Video Area */}
                        {videoRoom && (
                             <div className="relative flex-shrink-0 mb-4 bg-dark-blue rounded-xl p-2 border border-platinum/20">
                                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                     <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                     <audio ref={remoteAudioRef} autoPlay />
                                </div>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-black/50 backdrop-blur-sm p-2 rounded-full">
                                    <button onClick={toggleMute} className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-platinum/20 text-platinum'}`}>
                                        {isMuted ? <MicOffIcon /> : <MicOnIcon />}
                                    </button>
                                    <button onClick={endVideoCall} className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors">
                                        <EndCallIcon />
                                    </button>
                                </div>
                             </div>
                        )}
                        {/* Message Area */}
                        <div className="flex flex-col h-full overflow-y-auto mb-4">
                            {/* ... (message rendering) */}
                        </div>
                        {/* Input Area */}
                        <div className="flex flex-row items-center h-16 rounded-xl bg-dark-blue w-full px-4 ring-1 ring-platinum/20">
                            {/* ... (attach button and input) */}
                             {videoCallRequestSid === activeConversation.sid && !videoRoom && (
                                <button onClick={joinVideoCall} disabled={isConnectingVideo} className="ml-2 text-xs font-semibold bg-green-600 text-white px-3 py-1 rounded-full animate-pulse">
                                    {isConnectingVideo ? "Joining..." : "Join Video Call"}
                                </button>
                            )}
                            {/* ... (send button) */}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center">
                        <p className="text-platinum/60">Select a conversation to begin chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
};