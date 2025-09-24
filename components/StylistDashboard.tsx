import React, { useState, useEffect, useRef } from 'react';
import { Client, Conversation, Message, Participant } from '@twilio/conversations';
import Video, { Room, LocalAudioTrack, RemoteParticipant, createLocalTracks } from 'twilio-video';

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
    const [isUserTyping, setIsUserTyping] = useState(false);
    const [videoRoom, setVideoRoom] = useState<Room | null>(null);
    const [isConnectingVideo, setIsConnectingVideo] = useState(false);
    const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<any>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [videoCallRequestSid, setVideoCallRequestSid] = useState<string | null>(null);
    
    const messageEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);

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
            setConversations(convs.items);

            client.on('conversationJoined', (conversation) => {
                setConversations(prev => [...prev.filter(c => c.sid !== conversation.sid), conversation]);
            });
        };

        setupClient();

        return () => {
            client.shutdown();
        };
    }, [client, identity]);

    const selectConversation = (conversation: Conversation) => {
        setActiveConversation(conversation);
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
            
            return () => {
                activeConversation.removeListener('messageAdded', onMessageAdded);
                activeConversation.removeListener('typingStarted', onTypingStarted);
                activeConversation.removeListener('typingEnded', onTypingEnded);
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (activeConversation) {
            activeConversation.typing();
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
            
            const tracks = await createLocalTracks({ audio: true, video: false });
            const audioTrack = tracks.find(t => t.kind === 'audio') as LocalAudioTrack;
            setLocalAudioTrack(audioTrack);

            const room = await Video.connect(data.token, { name: activeConversation.sid, tracks });
            setVideoRoom(room);

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
        setVideoRoom(null);
        setRemoteVideoTrack(null);
        setRemoteAudioTrack(null);
        setIsMuted(false);
        setVideoCallRequestSid(null);
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
                        {conversations.map(conv => (
                            <button key={conv.sid} onClick={() => selectConversation(conv)} className={`flex flex-row items-center hover:bg-black/20 rounded-xl p-2 ${activeConversation?.sid === conv.sid ? 'bg-black/40' : ''}`}>
                                <div className="ml-2 text-sm font-semibold text-left">{conv.friendlyName || 'Styling Session'}</div>
                            </button>
                        ))}
                    </div>
                 </div>
            </div>
            <div className="flex flex-col flex-auto h-full p-4">
                {activeConversation ? (
                    <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-black/20 h-full p-4">
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
                        <div className="flex flex-col h-full overflow-y-auto mb-4">
                             {messages.map(message => (
                                 <div key={message.sid} className="grid grid-cols-12 gap-y-2">
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
                                                 </div>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             ))}
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
                        <div className="flex flex-row items-center h-16 rounded-xl bg-dark-blue w-full px-4 ring-1 ring-platinum/20">
                            <button onClick={attachFile} aria-label="Attach file" className="flex items-center justify-center text-platinum/70 hover:text-white">
                                <AttachIcon />
                            </button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <div className="flex-grow ml-4">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={handleInputChange}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                                    }}
                                    className="flex w-full border rounded-full focus:outline-none focus:border-platinum/50 pl-4 h-10 bg-black/20 text-platinum border-transparent"
                                    placeholder="Type your message..."
                                    aria-label="Message input"
                                />
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
