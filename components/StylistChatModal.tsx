import React, { useState, useEffect, useRef } from 'react';
import TanviImg from '../tanvi.jpg';
import MuskaanImg from '../muskaan.jpg';
import RiddhiImg from '../riddhi.jpg';
import type { User, AiResponse, ChatMessage, AnalysisItem } from '../types';
import { initiateChatSession, ChatSessionData } from '../services/geminiService';
import { Client, Conversation, Message, Participant as TwilioParticipant } from '@twilio/conversations';
// Fix: Import specific LocalVideoTrack and LocalAudioTrack types to resolve method errors.
import Video, { Room, LocalVideoTrack, LocalAudioTrack, RemoteParticipant, createLocalTracks, LocalTrack, RemoteTrack, RemoteTrackPublication, RemoteAudioTrack } from 'twilio-video';

// ... (Icon components remain the same)
const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const SendIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);
const AttachIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.497a1.5 1.5 0 012.121-2.121l-1.414-1.414a.5.5 0 00-.707.707l1.414 1.414a2.5 2.5 0 01-3.536 3.536l-.496.496a4 4 0 01-5.657-5.657l7-7a4 4 0 015.657 5.657h-.001l-.496.497a2.5 2.5 0 01-3.536-3.536l1.414-1.414a.5.5 0 00.707-.707l-1.414-1.414a1.5 1.5 0 01-2.121 2.121l.497.497a3 3 0 004.242 0z" clipRule="evenodd" />
    </svg>
);
const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-platinum"></div>
);
const VideoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
    </svg>
);

const InfoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        <path d="M10.707 10.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" />
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" clipRule="evenodd" />
    </svg>
);


interface StylistChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    analysisContext: AiResponse | null;
    newItemContext: AnalysisItem | null;
}

const isDataUrl = (s: string | null): boolean => !!s && s.startsWith('data:image');

const processTwilioMessage = async (message: Message, currentUser: User): Promise<ChatMessage> => {
    let mediaUrl;
    if (message.type === 'media' && message.media) {
        try {
            mediaUrl = await message.media.getContentTemporaryUrl();
        } catch(e) { console.error("Could not get media URL", e); }
    }
    
    // Simple check for system messages
    const isSystemMessage = message.author?.startsWith('system');
    let sender: ChatMessage['sender'] = 'stylist';
    if (isSystemMessage) {
        sender = 'system';
    } else if (message.author === currentUser.id) {
        sender = 'user';
    }

    return {
        id: message.sid,
        sender: sender,
        text: message.body ?? '',
        timestamp: message.dateCreated.toISOString(),
        imageUrl: mediaUrl,
    };
}

export const StylistChatModal: React.FC<StylistChatModalProps> = ({ isOpen, onClose, user, analysisContext, newItemContext }) => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'idle'>('idle');
    const [client, setClient] = useState<Client | null>(null);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [stylist, setStylist] = useState<{ id: string; name: string; title: string; avatarUrl: string; bio?: string } | null>(null);
    const [isStylistTyping, setIsStylistTyping] = useState(false);
    const [sessionData, setSessionData] = useState<ChatSessionData | null>(null);
    
    // Video State
    const [videoRoom, setVideoRoom] = useState<Room | null>(null);
    const [isConnectingVideo, setIsConnectingVideo] = useState(false);
    // Fix: Use specific LocalVideoTrack and LocalAudioTrack types.
    const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<RemoteAudioTrack | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);

    const [isBioPopoverOpen, setIsBioPopoverOpen] = useState(false);

    // Resolve stylist avatar to a bundled image when possible
    const getStylistAvatar = (stylistObj: { id: string; avatarUrl: string } | null): string => {
        if (!stylistObj) return '';
        switch (stylistObj.id) {
            case 'tanvi_sankhe':
                return TanviImg;
            case 'muskaan_datt':
                return MuskaanImg;
            case 'riddhi_jogani':
                return RiddhiImg;
            default:
                return stylistObj.avatarUrl || '';
        }
    };

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // No inline video elements; audio plays via hidden element
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const canceledRef = useRef<boolean>(false);
    const sentInitialRef = useRef<boolean>(false);

    useEffect(() => {
        const initChat = async () => {
            if (isOpen && user && analysisContext && status === 'idle') {
                setStatus('connecting');
                try {
                    canceledRef.current = false;
                    const data = await initiateChatSession(analysisContext, newItemContext, user);
                    if (canceledRef.current) return;
                    setSessionData(data);
                    const twilioClient = await Client.create(data.token);
                    if (canceledRef.current) { try { twilioClient.shutdown(); } catch {} return; }
                    setClient(twilioClient);
                    
                    const conv = await twilioClient.getConversationBySid(data.conversationSid);
                    if (canceledRef.current) { try { twilioClient.shutdown(); } catch {} return; }
                    setConversation(conv);
                    
                    setStylist(data.stylist);
                    
                    const twilioMessages = (await conv.getMessages()).items;
                    const processedMessages = await Promise.all(twilioMessages.map((msg: Message) => processTwilioMessage(msg, user)));
                    setMessages(processedMessages.sort((a: ChatMessage, b: ChatMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));

                    setStatus('connected');
                } catch (error) {
                    console.error("Chat initialization failed:", error);
                    setStatus('error');
                }
            }
        };
        initChat();

        return () => {
            canceledRef.current = true;
            if (client) {
                client.shutdown();
                setClient(null);
                setConversation(null);
                setMessages([]);
                setStatus('idle');
                setSessionData(null);
                // Ensure we end any ongoing video call on teardown
                endVideoCall();
            }
        };
    }, [isOpen, user, analysisContext, newItemContext, status]);

    useEffect(() => {
        const maybeSendInitialImages = async () => {
            if (!conversation || sentInitialRef.current) return;
            const initial = sessionData?.initialImages;

            // Prefer server-provided initial images; fall back to props if missing
            const newItem = initial?.newItem ?? (newItemContext ? { base64: newItemContext.base64, mimeType: newItemContext.mimeType } : undefined);
            const outfits = initial?.outfits ?? analysisContext?.generatedOutfitImages ?? [];

            if (!newItem && (!outfits || outfits.length === 0)) return;

            try {
                if (newItem) {
                    await conversation.sendMessage('New Item for Analysis:');
                    const newItemDataUrl = `data:${newItem.mimeType};base64,${newItem.base64}`;
                    await conversation.sendMessage(newItemDataUrl);
                }
                if (outfits && outfits.length > 0) {
                    await conversation.sendMessage('AI-Generated Outfit Ideas:');
                    for (let i = 0; i < outfits.length; i++) {
                        const outfitBase64 = outfits[i];
                        const outfitDataUrl = `data:image/png;base64,${outfitBase64}`;
                        await conversation.sendMessage(outfitDataUrl);
                    }
                }
                sentInitialRef.current = true;
                setSessionData((prev: ChatSessionData | null) => prev ? { ...prev, initialImages: undefined } : null);
            } catch (e) {
                console.error('Failed to send initial images:', e);
            }
        };
        maybeSendInitialImages();
    }, [conversation, sessionData, analysisContext, newItemContext]);

    useEffect(() => {
        if (!conversation) return;

        const onMessageAdded = async (message: Message) => {
            const processedMsg = await processTwilioMessage(message, user);
            setMessages((prev: ChatMessage[]) => [...prev, processedMsg]);
        };
        
        const onTypingStarted = (participant: TwilioParticipant) => {
            if (participant.identity !== user.id) setIsStylistTyping(true);
        };

        const onTypingEnded = (participant: TwilioParticipant) => {
             if (participant.identity !== user.id) setIsStylistTyping(false);
        };

        conversation.on('messageAdded', onMessageAdded);
        conversation.on('typingStarted', onTypingStarted);
        conversation.on('typingEnded', onTypingEnded);

        return () => {
            conversation.removeListener('messageAdded', onMessageAdded);
            conversation.removeListener('typingStarted', onTypingStarted);
            conversation.removeListener('typingEnded', onTypingEnded);
        };
    }, [conversation, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStylistTyping]);
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsBioPopoverOpen(false);
            }
        }
        if (isBioPopoverOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isBioPopoverOpen]);

    // Close bio overlay with Escape key for better UX
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsBioPopoverOpen(false);
        };
        if (isBioPopoverOpen) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isBioPopoverOpen]);

    const sendMessage = () => {
        if (input.trim() && conversation) {
            conversation.sendMessage(input);
            setInput('');
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (conversation) {
            conversation.typing();
        }
    };
    
    const attachFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && conversation) {
            const formData = new FormData();
            formData.append('file', file);
            conversation.sendMessage(formData);
        }
        e.target.value = '';
    };
    
    // --- Video call functions ---
    const notifyStylistVideoRequest = async () => {
        try {
            if (conversation) {
                await conversation.sendMessage('User is requesting a live video call', { type: 'video_call_request' });
            }
        } catch (e) {
            console.error('Failed to notify stylist about video request:', e);
        }
    };

    const startVideoCall = async () => {
        if (!sessionData?.conversationSid) return;
        if (isConnectingVideo || videoRoom) return;
        setIsConnectingVideo(true);
        setVideoError(null);
        try {
            // Get Video token
            const res = await fetch('/api/generate-video-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: user.id, roomName: sessionData.conversationSid }),
            });
            const data = await res.json();
            if (!res.ok || !data.success || !data.token) throw new Error(data.message || 'Failed to get video token');

            // Create local tracks (audio + video). We do not render inline video in the UI.
            const tracks: LocalTrack[] = await createLocalTracks({ audio: true, video: true });
            const vTrack = tracks.find((t: LocalTrack) => t.kind === 'video') as LocalVideoTrack | undefined;
            const aTrack = tracks.find((t: LocalTrack) => t.kind === 'audio') as LocalAudioTrack | undefined;
            if (vTrack) setLocalVideoTrack(vTrack);
            if (aTrack) setLocalAudioTrack(aTrack);
            setIsMuted(false);
            setIsCameraOff(false);

            // Connect to the room using conversation SID as room name
            const room = await Video.connect(data.token, { name: sessionData.conversationSid, tracks });
            setVideoRoom(room);

            // Attach existing participants (audio only; no inline video rendering)
            room.participants.forEach((participant: RemoteParticipant) => {
                participant.tracks.forEach((publication: RemoteTrackPublication) => {
                    if (publication.track) {
                        if (publication.track.kind === 'audio') setRemoteAudioTrack(publication.track as RemoteAudioTrack);
                    }
                });
                participant.on('trackSubscribed', (track: RemoteTrack) => {
                    if (track.kind === 'audio') setRemoteAudioTrack(track as RemoteAudioTrack);
                });
            });

            room.on('participantConnected', (participant: RemoteParticipant) => {
                participant.on('trackSubscribed', (track: RemoteTrack) => {
                    if (track.kind === 'audio') setRemoteAudioTrack(track as RemoteAudioTrack);
                });
            });

            room.on('disconnected', () => { endVideoCall(); });

            // Let the stylist know to join
            await notifyStylistVideoRequest();
        } catch (error) {
            console.error('Failed to start video call:', error);
            setVideoError(error instanceof Error ? error.message : 'Could not start the video call.');
        } finally {
            setIsConnectingVideo(false);
        }
    };

    const endVideoCall = () => {
        try {
            if (videoRoom) videoRoom.disconnect();
        } catch {}
        try {
            if (localVideoTrack) {
                localVideoTrack.stop();
                // Detach from any elements if attached elsewhere
                localVideoTrack.detach();
            }
        } catch {}
        try {
            if (localAudioTrack) {
                localAudioTrack.stop();
                localAudioTrack.detach && localAudioTrack.detach();
            }
        } catch {}
        setLocalVideoTrack(null);
        setLocalAudioTrack(null);
        setRemoteAudioTrack(null);
        setVideoRoom(null);
        setIsMuted(false);
        setIsCameraOff(false);
    };

    const toggleMute = () => {
        if (!localAudioTrack) return;
        if (localAudioTrack.isEnabled) {
            localAudioTrack.disable();
            setIsMuted(true);
        } else {
            localAudioTrack.enable();
            setIsMuted(false);
        }
    };

    // No inline video elements to attach; only audio will be attached below

    useEffect(() => {
        if (remoteAudioTrack && remoteAudioRef.current) {
            try {
                remoteAudioTrack.attach(remoteAudioRef.current);
                return () => {
                    try { remoteAudioTrack.detach && remoteAudioTrack.detach(remoteAudioRef.current); } catch {}
                };
            } catch {}
        }
    }, [remoteAudioTrack]);

    const handleClose = () => {
        try { endVideoCall(); } catch {}
        try { client?.shutdown(); } catch {}
        setClient(null);
        setConversation(null);
        setMessages([]);
        setStatus('idle');
        setSessionData(null);
        canceledRef.current = true;
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
            <div className="flex flex-col flex-auto h-full max-h-[90vh] w-full max-w-2xl bg-dark-blue/90 rounded-2xl shadow-2xl border border-platinum/20">
                <div className="relative flex-shrink-0 flex sm:items-center justify-between py-3 border-b-2 border-platinum/20 px-4">
                    <div className="flex items-center space-x-4">
                        {stylist ? (
                            getStylistAvatar(stylist) ? (
                                <img src={getStylistAvatar(stylist)} alt={stylist.name} className="w-10 sm:w-12 h-10 sm:h-12 rounded-full" />
                            ) : (
                                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-platinum/20 flex items-center justify-center text-platinum/80 font-semibold">
                                    {stylist?.name?.charAt(0) || 'S'}
                                </div>
                            )
                        ) : (
                            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-platinum/20 animate-pulse" />
                        )}
                        <div className="flex flex-col leading-tight">
                            <div className="text-lg mt-1 flex items-center">
                                <span className="text-platinum mr-1 font-semibold">{stylist ? stylist.name : 'Connecting to stylist…'}</span>
                                {stylist && (
                                    <button onClick={() => setIsBioPopoverOpen((prev: boolean) => !prev)} className="text-platinum/60 hover:text-white p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-platinum" aria-label="Stylist bio">
                                        <InfoIcon />
                                    </button>
                                )}
                            </div>
                            <span className="text-sm text-platinum/60">{stylist ? stylist.title : 'Please wait'}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => (videoRoom ? endVideoCall() : startVideoCall())}
                            disabled={isConnectingVideo || !stylist || status !== 'connected'}
                            className={`inline-flex items-center justify-center rounded-full h-8 w-8 transition duration-200 ${videoRoom ? 'bg-red-600 text-white hover:bg-red-700' : 'text-platinum/80 bg-black/20 hover:bg-black/40'} disabled:opacity-50`}
                            aria-label={videoRoom ? 'End call' : 'Start video call'}
                        >
                            {isConnectingVideo ? <Spinner/> : <VideoIcon />}
                        </button>
                        <button onClick={handleClose} className="inline-flex items-center justify-center rounded-full h-8 w-8 transition duration-200 text-platinum/80 bg-black/20 hover:bg-black/40" aria-label="Close chat">
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                {/* Compact call controls (no inline video) */}
                {videoRoom && (
                    <div className="px-4 pt-3">
                        {videoError && (
                            <div className="mb-2 text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded-lg px-3 py-2">
                                {videoError}
                            </div>
                        )}
                        <div className="flex items-center justify-between bg-black/30 border border-platinum/20 rounded-lg px-3 py-2">
                            <div className="text-platinum/80 text-sm">Live call connected</div>
                            <div className="flex items-center gap-2">
                                <audio ref={remoteAudioRef} autoPlay />
                                <button onClick={toggleMute} className={`px-3 py-1.5 rounded-full text-sm ${isMuted ? 'bg-red-600 text-white' : 'bg-platinum/20 text-platinum'}`} aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}>
                                    {isMuted ? <MicOffIcon /> : <MicOnIcon />}
                                </button>
                                <button onClick={endVideoCall} className="px-3 py-1.5 rounded-full text-sm bg-red-600 text-white" aria-label="End call">
                                    <EndCallIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {isBioPopoverOpen && stylist && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBioPopoverOpen(false)} aria-hidden="true" />
                        {/* Dialog */}
                        <div
                            ref={popoverRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="stylist-bio-title"
                            className="relative w-full max-w-2xl mx-4"
                        >
                            <div className="rounded-3xl border border-platinum/30 shadow-2xl overflow-hidden bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl">
                                {/* Close */}
                                <button
                                    onClick={() => setIsBioPopoverOpen(false)}
                                    className="absolute top-4 right-4 inline-flex items-center justify-center h-10 w-10 rounded-full bg-black/30 text-platinum/80 hover:bg-black/50 hover:text-white transition"
                                    aria-label="Close stylist bio"
                                >
                                    <CloseIcon />
                                </button>
                                <div className="px-8 py-10 sm:px-12 sm:py-12 text-center">
                                    {/* Avatar */}
                                    <div className="mx-auto mb-6 w-36 h-36 sm:w-40 sm:h-40 rounded-full ring-2 ring-platinum/40 shadow-lg overflow-hidden">
                                        {getStylistAvatar(stylist) ? (
                                            <img src={getStylistAvatar(stylist)} alt={stylist.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-platinum/20 flex items-center justify-center text-3xl text-platinum/80 font-semibold">
                                                {stylist.name?.charAt(0) || 'S'}
                                            </div>
                                        )}
                                    </div>
                                    {/* Name & Title */}
                                    <h3 id="stylist-bio-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-platinum">{stylist.name}</h3>
                                    <div className="mt-1 text-sm sm:text-base tracking-wide uppercase text-platinum/60">{stylist.title}</div>
                                    {/* Divider */}
                                    <div className="mx-auto my-6 h-px w-24 bg-gradient-to-r from-transparent via-platinum/50 to-transparent" />
                                    {/* Bio */}
                                    <div className="mx-auto max-w-3xl text-left">
                                        <p className="leading-relaxed text-platinum/80 whitespace-pre-wrap">
                                            {stylist.bio}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col h-full overflow-x-hidden overflow-y-auto p-4 space-y-4">
                    {status === 'connecting' && <div className="m-auto flex flex-col items-center"><Spinner /><p className="mt-2 text-platinum/70">Connecting to stylist...</p></div>}
                    {status === 'error' && <div className="m-auto text-center"><p className="text-red-400 font-semibold">Connection Error</p><p className="text-platinum/70">Could not connect to the chat service. Please try again later.</p></div>}
                    {status === 'connected' && messages.map((message: ChatMessage) => (
                        <div key={message.id} className={`col-start-1 col-end-11 p-3 rounded-lg ${message.sender === 'system' ? 'col-span-12' : ''}`}>
                             {message.sender === 'system' ? (
                                <div className="text-center text-xs text-platinum/50 italic my-2">
                                    <p>{message.text}</p>
                                    {message.imageUrl && <img src={message.imageUrl} alt="Initial context" className="mt-2 rounded-lg max-w-xs mx-auto shadow-md" />}
                                </div>
                             ) : (
                                <div className={`flex flex-row items-start ${message.sender === 'user' ? 'justify-end flex-row-reverse' : ''}`}>
                                     {message.sender === 'stylist' && stylist && (
                                         getStylistAvatar(stylist) ? (
                                            <img src={getStylistAvatar(stylist)} alt={stylist.name} className="w-8 h-8 rounded-full mr-3 flex-shrink-0" />
                                         ) : (
                                            <div className="w-8 h-8 rounded-full bg-platinum/20 mr-3 flex-shrink-0 flex items-center justify-center text-[0.8rem] text-platinum/80 font-semibold">
                                                {stylist.name?.charAt(0) || 'S'}
                                            </div>
                                         )
                                     )}
                                     <div className={`relative text-sm py-2 px-4 shadow rounded-xl ${message.sender === 'user' ? 'bg-platinum/10 text-platinum' : 'bg-[#1F2937] text-platinum'}`}>
                                         {message.imageUrl ? (
                                             <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                                                 <img src={message.imageUrl} alt="Attachment" className="max-w-xs max-h-48 rounded-lg cursor-pointer" />
                                             </a>
                                         ) : isDataUrl(message.text) ? (
                                            <img src={message.text} alt="Context image" className="max-w-xs max-h-48 rounded-lg" />
                                         ) : (
                                             <p className="whitespace-pre-wrap">{message.text}</p>
                                         )}
                                    </div>
                                </div>
                             )}
                        </div>
                    ))}
                    {isStylistTyping && (
                         <div className="flex flex-row items-center">
                             {stylist && (
                                getStylistAvatar(stylist) ? (
                                    <img src={getStylistAvatar(stylist)} alt="Stylist typing" className="w-8 h-8 rounded-full mr-3" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-platinum/20 mr-3 flex items-center justify-center text-[0.8rem] text-platinum/80 font-semibold">
                                        {stylist.name?.charAt(0) || 'S'}
                                    </div>
                                )
                             )}
                             <div className="relative text-sm bg-[#1F2937] py-2 px-4 shadow rounded-xl">
                                <div className="flex items-center space-x-1">
                                    <span className="w-1.5 h-1.5 bg-platinum/50 rounded-full animate-pulse delay-75"></span>
                                    <span className="w-1.5 h-1.5 bg-platinum/50 rounded-full animate-pulse delay-150"></span>
                                    <span className="w-1.5 h-1.5 bg-platinum/50 rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                {status === 'connected' && (
                    <div className="flex-shrink-0 flex flex-row items-center h-16 rounded-b-xl bg-dark-blue w-full px-4 ring-1 ring-inset ring-platinum/20">
                        <button onClick={attachFile} className="flex items-center justify-center text-platinum/70 hover:text-white">
                            <AttachIcon />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <div className="flex-grow ml-4">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={handleInputChange}
                                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendMessage()}
                                    className="flex w-full border rounded-full focus:outline-none focus:border-platinum/50 pl-4 h-10 bg-black/20 text-platinum border-transparent"
                                    placeholder="Type your message..."
                                />
                            </div>
                        </div>
                        <div className="ml-4">
                            <button onClick={sendMessage} className="flex items-center justify-center bg-platinum hover:bg-platinum/90 rounded-full text-dark-blue h-10 w-10 flex-shrink-0 transition-colors">
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
