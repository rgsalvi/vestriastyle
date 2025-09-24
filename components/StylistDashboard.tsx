import React, { useState, useEffect, useRef } from 'react';
import { Client, Conversation, Message, Participant } from '@twilio/conversations';
import Video, { Room, LocalAudioTrack, LocalVideoTrack, RemoteParticipant, createLocalTracks } from 'twilio-video';

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
      <path fillRule="evenodd" d="M10 18a7 7 0 005.47-2.502a1 1 0 00-1.353-1.476A5.002 5.002 0 015 8a1 1 0 00-2 0 7 7 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07zM9.243 3.03a3 3 0 014.514 0a1 1 0 001.528-1.303A5 5 0 006.183 6.9a1 1 0 101.93.513A3.001 3.001 0 019.243 3.03zM5.383 6.383a1 1 0 00-1.414 1.414l9.192 9.192a1 1 0 001.414-1.414L5.383 6.383z" clipRule="evenodd" />
    </svg>
);
const EndCallIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 10.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414l-3-3z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" clipRule="evenodd" />
    </svg>
);


interface ProcessedMessage {
    sid: string;
    author: string | null;
    body: string | null;
    dateCreated: Date;
    attributes: any;
    index?: number;
    media?: {
        url: string;
        contentType: string;
    };
}
const LoginPage: React.FC<{ onLogin: (identity: string) => Promise<void> }> = ({ onLogin }) => {
    const [selectedStylist, setSelectedStylist] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStylist) return;
        setError(null);
        setLoading(true);
        try {
            await onLogin(selectedStylist);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
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
                        className="block w-full text-lg bg-dark-blue border-platinum/30 rounded-full focus:ring-platinum focus:border-platinum transition-colors text-platinum placeholder-platinum/50 px-6 py-3 disabled:opacity-60"
                        disabled={loading}
                    >
                        <option value="">Select your name</option>
                        {STYLISTS.map(stylist => (
                            <option key={stylist.id} value={stylist.id}>{stylist.name}</option>
                        ))}
                    </select>
                    {error && (
                        <div className="text-sm text-red-300 bg-red-900/30 border border-red-500/30 rounded-md px-3 py-2">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={!selectedStylist || loading}
                        className="w-full bg-platinum text-dark-blue font-bold py-3 px-4 rounded-full shadow-lg shadow-platinum/10 hover:scale-105 disabled:bg-platinum/50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum/50"
                    >
                        {loading ? 'Logging in…' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};
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
        author: message.author ?? null,
        body: message.body ?? null,
        dateCreated: message.dateCreated,
        attributes: (message as any).attributes || {},
        index: (message as any).index,
        media: media ? { url: media.url, contentType: media.contentType || 'application/octet-stream' } : undefined,
    };
};

const isDataUrl = (s: string | null): boolean => !!s && s.startsWith('data:image');

export const StylistDashboard: React.FC = () => {
    const [identity, setIdentity] = useState<string | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ProcessedMessage[]>([]);
    const [input, setInput] = useState('');
    const composerRef = useRef<HTMLTextAreaElement>(null);
    const [isUserTyping, setIsUserTyping] = useState(false);
    const [videoRoom, setVideoRoom] = useState<Room | null>(null);
    const [isConnectingVideo, setIsConnectingVideo] = useState(false);
    const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<any>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [videoCallRequestSid, setVideoCallRequestSid] = useState<string | null>(null);
    const [bannerMessage, setBannerMessage] = useState<string | null>(null);
    const [bannerType, setBannerType] = useState<'info' | 'error' | 'success'>('info');
    const convHandlersRef = useRef<Map<string, (m: Message) => void>>(new Map());
    const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
    const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
    const [selectedMicId, setSelectedMicId] = useState<string | undefined>(undefined);
    const [selectedCamId, setSelectedCamId] = useState<string | undefined>(undefined);
    
    const messageEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const handleLogin = async (stylistIdentity: string) => {
        try {
            const response = await fetch('/api/generate-stylist-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: stylistIdentity }),
            });
            const data = await response.json();
            if (data.success) {
                const twilioClient = await Client.create(data.token);
                setClient(twilioClient);
                setIdentity(stylistIdentity);
            } else {
                console.error("Failed to login:", data.message);
                throw new Error(data.message || 'Failed to login');
            }
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    useEffect(() => {
        if (!client || !identity) return;

        const setupClient = async () => {
            const convs = await client.getSubscribedConversations();
            const items = convs.items;
            // Sort by last message date (desc)
            const sorted = [...items].sort((a, b) => {
                const aTime = (a as any).lastMessage?.dateCreated ? new Date((a as any).lastMessage.dateCreated).getTime() : 0;
                const bTime = (b as any).lastMessage?.dateCreated ? new Date((b as any).lastMessage.dateCreated).getTime() : 0;
                return bTime - aTime;
            });
            setConversations(sorted);

            // attach message listeners to keep list fresh
            sorted.forEach(conv => {
                const handler = (/* message */) => {
                    setConversations(prev => {
                        const next = [...prev];
                        return next.sort((a, b) => {
                            const aTime = (a as any).lastMessage?.dateCreated ? new Date((a as any).lastMessage.dateCreated).getTime() : 0;
                            const bTime = (b as any).lastMessage?.dateCreated ? new Date((b as any).lastMessage.dateCreated).getTime() : 0;
                            return bTime - aTime;
                        });
                    });
                };
                conv.on('messageAdded', handler as any);
                convHandlersRef.current.set(conv.sid, handler as any);
            });

            client.on('conversationJoined', (conversation) => {
                setConversations(prev => {
                    const next = [...prev.filter(c => c.sid !== conversation.sid), conversation];
                    return next.sort((a, b) => {
                        const aTime = (a as any).lastMessage?.dateCreated ? new Date((a as any).lastMessage.dateCreated).getTime() : 0;
                        const bTime = (b as any).lastMessage?.dateCreated ? new Date((b as any).lastMessage.dateCreated).getTime() : 0;
                        return bTime - aTime;
                    });
                });
                const handler = () => {
                    setConversations(prev => {
                        const next = [...prev];
                        return next.sort((a, b) => {
                            const aTime = (a as any).lastMessage?.dateCreated ? new Date((a as any).lastMessage.dateCreated).getTime() : 0;
                            const bTime = (b as any).lastMessage?.dateCreated ? new Date((b as any).lastMessage.dateCreated).getTime() : 0;
                            return bTime - aTime;
                        });
                    });
                };
                conversation.on('messageAdded', handler as any);
                convHandlersRef.current.set(conversation.sid, handler as any);
            });
        };

        setupClient();

        return () => {
            // cleanup conv handlers
            convHandlersRef.current.forEach((handler, sid) => {
                const conv = conversations.find(c => c.sid === sid);
                if (conv) conv.removeListener('messageAdded', handler as any);
            });
            convHandlersRef.current.clear();
            client.shutdown();
        };
    }, [client, identity]);

    const selectConversation = (conversation: Conversation) => {
        setActiveConversation(conversation);
        // mark as read
        (conversation as any).setAllMessagesRead?.().catch(() => {});
    };

    useEffect(() => {
        if (!activeConversation || !identity) return;
        
        const setupConversation = async () => {
            setIsUserTyping(false);
            setVideoCallRequestSid(null);
            
            const twilioMessages = (await activeConversation.getMessages()).items;
            const processedMessages = await Promise.all(twilioMessages.map(processTwilioMessage));
            setMessages(processedMessages.sort((a, b) => a.dateCreated.getTime() - b.dateCreated.getTime()));

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
            
            const onTypingStarted = (participant: Participant) => {
                if (participant.identity !== identity) setIsUserTyping(true);
            };
            const onTypingEnded = (participant: Participant) => {
                if (participant.identity !== identity) setIsUserTyping(false);
            };

            activeConversation.on('messageAdded', onMessageAdded);
            activeConversation.on('typingStarted', onTypingStarted);
            activeConversation.on('typingEnded', onTypingEnded);

            // mark as read when opening and when new messages arrive
            (activeConversation as any).setAllMessagesRead?.().catch(() => {});
            const readHandler = () => {
                (activeConversation as any).setAllMessagesRead?.().catch(() => {});
            };
            activeConversation.on('messageAdded', readHandler as any);
            
            return () => {
                activeConversation.removeListener('messageAdded', onMessageAdded);
                activeConversation.removeListener('typingStarted', onTypingStarted);
                activeConversation.removeListener('typingEnded', onTypingEnded);
                activeConversation.removeListener('messageAdded', readHandler as any);
            };
        };
        setupConversation();
    }, [activeConversation, identity]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isUserTyping]);

    const sendMessage = () => {
        if (input.trim() && activeConversation) {
            activeConversation.sendMessage(input);
            setInput('');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        if (activeConversation) {
            activeConversation.typing();
        }
        // auto-resize
        if (composerRef.current) {
            composerRef.current.style.height = 'auto';
            composerRef.current.style.height = Math.min(composerRef.current.scrollHeight, 160) + 'px';
        }
    };
    
    const attachFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeConversation) {
            const formData = new FormData();
            formData.append('file', file);
            activeConversation.sendMessage(formData);
        }
        e.target.value = '';
    };

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
            
            const tracks = await createLocalTracks({
                audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
                video: false
            });
            const audioTrack = tracks.find(t => t.kind === 'audio') as LocalAudioTrack;
            setLocalAudioTrack(audioTrack);

            const room = await Video.connect(data.token, { name: activeConversation.sid, tracks });
            setVideoRoom(room);
            setBannerType('success');
            setBannerMessage('Connected to video call');

            room.participants.forEach(participant => {
                participant.tracks.forEach((publication: any) => {
                    if (publication.track) {
                        if (publication.track.kind === 'video') setRemoteVideoTrack(publication.track);
                        if (publication.track.kind === 'audio') setRemoteAudioTrack(publication.track);
                    }
                });
                participant.on('trackSubscribed', (track: any) => {
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
            setBannerType('error');
            setBannerMessage('Failed to join video call');
        } finally {
            setIsConnectingVideo(false);
        }
    };
    
    const endVideoCall = () => {
        if (videoRoom) videoRoom.disconnect();
        if (localAudioTrack) {
            localAudioTrack.stop();
            if (remoteAudioRef.current && (localAudioTrack as any).detach) {
                (localAudioTrack as any).detach(remoteAudioRef.current);
            }
            setLocalAudioTrack(null);
        }
        if (localVideoTrack) {
            try {
                (videoRoom as any)?.localParticipant?.unpublishTrack?.(localVideoTrack);
            } catch {}
            localVideoTrack.stop();
            if (localVideoRef.current && (localVideoTrack as any).detach) {
                (localVideoTrack as any).detach(localVideoRef.current);
            }
            setLocalVideoTrack(null);
        }
        setVideoRoom(null);
        setRemoteVideoTrack(null);
        setRemoteAudioTrack(null);
        setIsMuted(false);
        setVideoCallRequestSid(null);
        setBannerType('info');
        setBannerMessage('Call ended');
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

    // Local preview attach
    useEffect(() => {
        if (localVideoTrack && localVideoRef.current) {
            localVideoTrack.attach(localVideoRef.current);
            return () => { if ((localVideoTrack as any).detach) (localVideoTrack as any).detach(localVideoRef.current!); };
        }
    }, [localVideoTrack]);

    // Enumerate devices
    useEffect(() => {
        const loadDevices = async () => {
            try {
                if (!navigator.mediaDevices?.enumerateDevices) return;
                const devices = await navigator.mediaDevices.enumerateDevices();
                const micList = devices.filter(d => d.kind === 'audioinput');
                const camList = devices.filter(d => d.kind === 'videoinput');
                setMics(micList as MediaDeviceInfo[]);
                setCams(camList as MediaDeviceInfo[]);
                if (!selectedMicId && micList[0]) setSelectedMicId(micList[0].deviceId);
                if (!selectedCamId && camList[0]) setSelectedCamId(camList[0].deviceId);
            } catch {}
        };
        loadDevices();
        const handler = () => loadDevices();
        navigator.mediaDevices?.addEventListener?.('devicechange', handler);
        return () => navigator.mediaDevices?.removeEventListener?.('devicechange', handler);
    }, [selectedMicId, selectedCamId]);

    const switchMic = async (deviceId: string) => {
        setSelectedMicId(deviceId);
        if (!videoRoom) return;
        try {
            const [newAudio] = await createLocalTracks({ audio: { deviceId: { exact: deviceId } } });
            if (localAudioTrack) {
                try { (videoRoom as any).localParticipant.unpublishTrack(localAudioTrack); } catch {}
                localAudioTrack.stop();
            }
            await (videoRoom as any).localParticipant.publishTrack(newAudio);
            setLocalAudioTrack(newAudio as LocalAudioTrack);
        } catch (e) {
            console.error('Failed to switch microphone', e);
        }
    };

    const toggleCamera = async () => {
        if (!videoRoom) return;
        if (localVideoTrack) {
            try { (videoRoom as any).localParticipant.unpublishTrack(localVideoTrack); } catch {}
            localVideoTrack.stop();
            setLocalVideoTrack(null);
            return;
        }
        try {
            const tracks = await createLocalTracks({ video: selectedCamId ? { deviceId: { exact: selectedCamId } } : true });
            const videoTrack = tracks.find(t => t.kind === 'video') as LocalVideoTrack;
            if (videoTrack) {
                await (videoRoom as any).localParticipant.publishTrack(videoTrack);
                setLocalVideoTrack(videoTrack);
            }
        } catch (e) {
            console.error('Failed to start camera', e);
        }
    };

    // auto-dismiss non-persistent banners
    useEffect(() => {
        if (!bannerMessage) return;
        const t = setTimeout(() => setBannerMessage(null), 4000);
        return () => clearTimeout(t);
    }, [bannerMessage]);

    if (!identity) {
        return <LoginPage onLogin={handleLogin} />;
    }
    
    return (
        <div className="h-screen w-screen flex antialiased text-platinum bg-dark-blue">
                <div className="flex flex-col py-8 pl-6 pr-2 w-72 bg-dark-blue flex-shrink-0 border-r border-platinum/20">
                 <div className="flex flex-row items-center justify-center h-12 w-full">
                    <div className="font-bold text-2xl tracking-widest">VESTRIA</div>
                 </div>
                      {identity && (
                          <div className="mt-4 text-center text-sm text-platinum/70">Logged in as <span className="font-semibold">{identity}</span></div>
                      )}
                 <div className="flex flex-col mt-8">
                    <div className="flex flex-row items-center justify-between text-xs">
                        <span className="font-bold">Active Conversations</span>
                        <span className="flex items-center justify-center bg-platinum/20 h-4 w-4 rounded-full">{conversations.length}</span>
                    </div>
                    <div className="flex flex-col space-y-1 mt-4 -mx-2 h-full overflow-y-auto">
                        {conversations.map(conv => {
                            const unread = (conv as any).unreadMessagesCount ?? 0;
                            const last = (conv as any).lastMessage;
                            const snippet: string | undefined = last?.body || (last?.type === 'media' ? 'Media attachment' : undefined);
                            const timeStr = last?.dateCreated ? new Date(last.dateCreated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                            return (
                                <button key={conv.sid} onClick={() => selectConversation(conv)} className={`flex items-center justify-between hover:bg-black/20 rounded-xl p-2 ${activeConversation?.sid === conv.sid ? 'bg-black/40' : ''}`}>
                                    <div className="flex flex-col ml-2 text-left">
                                        <div className="text-sm font-semibold">{conv.friendlyName || 'Styling Session'}</div>
                                        {snippet && <div className="text-xs text-platinum/50 truncate max-w-[180px]">{snippet}</div>}
                                    </div>
                                    <div className="flex flex-col items-end mr-2">
                                        {timeStr && <span className="text-[10px] text-platinum/40">{timeStr}</span>}
                                        {unread > 0 && <span className="mt-1 inline-flex items-center justify-center bg-platinum text-dark-blue rounded-full text-[10px] font-bold h-4 min-w-4 px-1">{unread}</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                 </div>
            </div>
            <div className="flex flex-col flex-auto h-full p-4">
                {activeConversation ? (
                    <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-black/20 h-full p-4">
                        {(videoCallRequestSid === activeConversation.sid && !videoRoom) && (
                            <div className="sticky top-0 z-10 mb-3" role="status" aria-live="polite">
                                <div className="flex items-center justify-between bg-green-900/40 text-green-200 border border-green-600/30 rounded-lg px-3 py-2">
                                    <div className="text-sm font-medium">User requested a video call</div>
                                    <button onClick={joinVideoCall} disabled={isConnectingVideo} className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full" aria-label="Join video call from banner">
                                        {isConnectingVideo ? 'Joining…' : 'Join Now'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {bannerMessage && (
                            <div className={`sticky top-0 z-10 ${videoCallRequestSid === activeConversation.sid && !videoRoom ? '' : 'mb-3'}`}>
                                <div className={`px-3 py-2 rounded-lg text-sm border ${bannerType === 'error' ? 'bg-red-900/30 text-red-200 border-red-500/30' : bannerType === 'success' ? 'bg-emerald-900/30 text-emerald-200 border-emerald-500/30' : 'bg-black/30 text-platinum/70 border-platinum/20'}`}>{bannerMessage}</div>
                            </div>
                        )}
                        {videoRoom && (
                             <div className="relative flex-shrink-0 mb-4 bg-dark-blue rounded-xl p-2 border border-platinum/20">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <div className="aspect-video bg-black rounded-lg overflow-hidden md:col-span-2 relative">
                                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                        <audio ref={remoteAudioRef} autoPlay />
                                        {!remoteVideoTrack && (
                                            <div className="absolute inset-0 flex items-center justify-center text-platinum/40 text-sm">Waiting for remote video…</div>
                                        )}
                                    </div>
                                    <div className="aspect-video bg-black/60 rounded-lg overflow-hidden p-1">
                                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-platinum/60">Mic</label>
                                        <select value={selectedMicId} onChange={e => switchMic(e.target.value)} className="bg-black/40 border border-platinum/20 text-xs rounded px-2 py-1">
                                            {mics.map(d => (<option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</option>))}
                                        </select>
                                        <label className="text-xs text-platinum/60 ml-2">Camera</label>
                                        <select value={selectedCamId} onChange={e => setSelectedCamId(e.target.value)} className="bg-black/40 border border-platinum/20 text-xs rounded px-2 py-1">
                                            {cams.map(d => (<option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>))}
                                        </select>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm p-2 rounded-full">
                                        <button onClick={toggleCamera} className="px-3 py-1 text-xs rounded-full bg-platinum/20 text-platinum hover:bg-platinum/30">{localVideoTrack ? 'Turn Camera Off' : 'Turn Camera On'}</button>
                                        <button onClick={toggleMute} className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-platinum/20 text-platinum'}`}>
                                            {isMuted ? <MicOffIcon /> : <MicOnIcon />}
                                        </button>
                                        <button onClick={endVideoCall} className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors">
                                            <EndCallIcon />
                                        </button>
                                    </div>
                                </div>
                             </div>
                        )}
                        <div className="flex flex-col h-full overflow-y-auto mb-4">
                             {messages.map((message, idx) => {
                                 const prev = messages[idx - 1];
                                 const isNewDay = !prev || (prev && prev.dateCreated.toDateString() !== message.dateCreated.toDateString());
                                 const timeLabel = message.dateCreated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                 const isGroupTop = !prev || prev.author !== message.author;
                                 const participants = (activeConversation as any)?.participants || [];
                                 const lastReadIndex = Math.max(
                                     ...participants
                                         .filter((p: any) => p.identity !== identity && typeof p.lastReadMessageIndex === 'number')
                                         .map((p: any) => p.lastReadMessageIndex as number),
                                     -1
                                 );
                                 const statusLabel = (message.author === identity && (message as any).index !== undefined)
                                     ? ((message as any).index <= lastReadIndex ? 'Read' : 'Sent')
                                     : undefined;
                                 return (
                                 <div key={message.sid} className="grid grid-cols-12 gap-y-2">
                                     {isNewDay && (
                                         <div className="col-start-1 col-end-13 flex justify-center my-2">
                                             <span className="text-xs px-2 py-1 rounded-full bg-black/30 text-platinum/60">
                                                 {message.dateCreated.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                             </span>
                                         </div>
                                     )}
                                     {message.author === identity ? (
                                         <div className="col-start-6 col-end-13 p-3 rounded-lg">
                                             <div className="flex items-center justify-start flex-row-reverse">
                                                 <div className="relative ml-3 text-sm bg-platinum/10 py-2 px-4 shadow rounded-xl">
                                                     {message.media ? (
                                                        <a href={message.media.url} target="_blank" rel="noopener noreferrer"><img src={message.media.url} alt="Attachment" className="max-w-xs max-h-48 rounded-lg cursor-pointer" /></a>
                                                     ) : isDataUrl(message.body) ? (
                                                        <img src={message.body!} alt="Context Image" className="max-w-xs max-h-48 rounded-lg" />
                                                     ) : (
                                                        <div className="whitespace-pre-wrap">{message.body}</div>
                                                     )}
                                                     <div className="mt-1 text-[10px] text-platinum/40 text-right">
                                                         {timeLabel}
                                                         {statusLabel && <span className="ml-2 opacity-70">• {statusLabel}</span>}
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                     ) : (
                                          <div className="col-start-1 col-end-8 p-3 rounded-lg">
                                             <div className="flex flex-row items-start">
                                                 <div className="relative mr-3 text-sm bg-[#1F2937] py-2 px-4 shadow rounded-xl">
                                                      {message.media ? (
                                                        <a href={message.media.url} target="_blank" rel="noopener noreferrer"><img src={message.media.url} alt="Attachment" className="max-w-xs max-h-48 rounded-lg cursor-pointer" /></a>
                                                     ) : isDataUrl(message.body) ? (
                                                        <img src={message.body!} alt="Context Image" className="max-w-xs max-h-48 rounded-lg" />
                                                     ) : (
                                                        <div className="whitespace-pre-wrap">{message.body}</div>
                                                     )}
                                                     <div className="mt-1 text-[10px] text-platinum/40">{timeLabel}</div>
                                                 </div>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                                 );
                             })}
                             {isUserTyping && (
                                 <div className="col-start-1 col-end-8 p-3 rounded-lg">
                                     <div className="flex flex-row items-center">
                                         <div className="relative mr-3 text-sm bg-[#1F2937] py-2 px-4 shadow rounded-xl">
                                            <div className="flex items-center space-x-1">
                                                <span className="w-1.5 h-1.5 bg-platinum/50 rounded-full animate-pulse delay-75"></span>
                                                <span className="w-1.5 h-1.5 bg-platinum/50 rounded-full animate-pulse delay-150"></span>
                                                <span className="w-1.5 h-1.5 bg-platinum/50 rounded-full animate-pulse delay-300"></span>
                                            </div>
                                         </div>
                                     </div>
                                 </div>
                             )}
                            <div ref={messageEndRef} />
                        </div>
                        <div className="flex flex-row items-end min-h-16 rounded-xl bg-dark-blue w-full px-4 py-3 ring-1 ring-platinum/20">
                            <button onClick={attachFile} aria-label="Attach file" className="flex items-center justify-center text-platinum/70 hover:text-white">
                                <AttachIcon />
                            </button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <div className="flex-grow ml-4">
                                <textarea
                                    ref={composerRef}
                                    value={input}
                                    onChange={handleInputChange}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                                    }}
                                    rows={1}
                                    className="block w-full resize-none border rounded-2xl focus:outline-none focus:border-platinum/50 px-4 py-2 max-h-40 bg-black/20 text-platinum border-transparent"
                                    placeholder="Type your message..."
                                    aria-label="Message input"
                                />
                                <div className="mt-1 text-[10px] text-platinum/40 select-none">Press Enter to send • Shift+Enter for newline</div>
                            </div>
                            <div className="ml-4 flex items-center space-x-2">
                                     {videoCallRequestSid === activeConversation.sid && !videoRoom && (
                                        <button onClick={joinVideoCall} disabled={isConnectingVideo} className="text-xs font-semibold bg-green-600 text-white px-3 py-2 rounded-full animate-pulse" aria-label="Join video call">
                                            {isConnectingVideo ? "Joining..." : "Join Video Call"}
                                        </button>
                                    )}
                                    <button onClick={sendMessage} aria-label="Send message" className="flex items-center justify-center bg-platinum hover:bg-platinum/90 rounded-full text-dark-blue h-10 w-10 flex-shrink-0 transition-colors">
                                    <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                </button>
                            </div>
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
