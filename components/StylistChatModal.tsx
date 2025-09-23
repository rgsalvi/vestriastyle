import React, { useState, useEffect, useRef } from 'react';
import type { User, AiResponse, ChatMessage, AnalysisItem } from '../types';
import { initiateChatSession } from '../services/geminiService';
import { Client, Conversation, Message } from '@twilio/conversations';
import Video, { Room, LocalTrack, RemoteParticipant, createLocalTracks } from 'twilio-video';

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


interface StylistChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  analysisContext: AiResponse | null;
  newItemContext: AnalysisItem | null;
}

// ... (Helper functions remain the same)
const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}
const parseMessageAttributes = (message: Message) => {
    try {
        return message.attributes ? JSON.parse(message.attributes as string) : {};
    } catch (e) {
        return {};
    }
};
const processTwilioMessage = async (message: Message, currentUser: User): Promise<ChatMessage> => {
    const chatMessage: ChatMessage = {
        id: message.sid,
        sender: message.author === currentUser.id ? 'user' : (message.author === 'system' ? 'system' : 'stylist'),
        text: message.body ?? '',
        timestamp: message.dateCreated.toISOString(),
    };
    if (message.type === 'media' && message.media) {
        const url = await message.media.getContentTemporaryUrl();
        if (message.media.contentType.startsWith('image/')) {
            chatMessage.imageUrl = url;
        } else if (message.media.contentType.startsWith('video/')) {
            chatMessage.videoUrl = url;
        }
    }
    return chatMessage;
};

export const StylistChatModal: React.FC<StylistChatModalProps> = ({ isOpen, onClose, user, analysisContext, newItemContext }) => {
    // ... (Existing state variables)
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [connectionState, setConnectionState] = useState<'initializing' | 'connecting' | 'connected' | 'failed'>('initializing');
    const [error, setError] = useState<string | null>(null);
    const [stylist, setStylist] = useState<{ name: string; title: string; avatarUrl: string } | null>(null);
    const [input, setInput] = useState('');
    const [isStylistTyping, setIsStylistTyping] = useState(false);
    
    // New state for video
    const [videoRoom, setVideoRoom] = useState<Room | null>(null);
    const [isConnectingVideo, setIsConnectingVideo] = useState(false);
    const [localVideoTrack, setLocalVideoTrack] = useState<LocalTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<LocalTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<any>(null); // RemoteAudioTrack
    const [isMuted, setIsMuted] = useState(false);

    // ... (Refs)
    const messageEndRef = useRef<HTMLDivElement>(null);
    const conversationRef = useRef<Conversation | null>(null);
    const clientRef = useRef<Client | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);

    // ... (Existing useEffect for chat setup)
    useEffect(() => {
        const setupChat = async () => {
            if (isOpen && analysisContext && user) {
                // ... (reset state)
                setConnectionState('initializing');
                setError(null); setMessages([]); setStylist(null);
                
                try {
                    const sessionData = await initiateChatSession(analysisContext, user);
                    if (!sessionData.success || !sessionData.token) { throw new Error(sessionData.message || 'Failed to get chat token.'); }
                    setStylist(sessionData.stylist);
                    
                    const client = new Client(sessionData.token);
                    clientRef.current = client;

                    client.on('connectionStateChanged', async (state) => {
                        // ... (switch statement for connection state)
                        switch (state) {
                            case 'connecting': setConnectionState('connecting'); break;
                            case 'connected':
                                const conversation = await client.getConversationBySid(sessionData.conversationSid);
                                conversationRef.current = conversation;

                                // ... (Existing context upload and message listeners)
                                if (newItemContext) {
                                  const file = dataURLtoFile(newItemContext.dataUrl, 'new-item.jpg');
                                  if(file) {
                                    conversation.sendMessage({contentType: file.type, media: file}, { type: 'context_image', label: "User's New Item" });
                                  }
                                }
                                analysisContext.generatedOutfitImages?.forEach((base64, index) => {
                                    const file = dataURLtoFile(`data:image/png;base64,${base64}`, `outfit-${index + 1}.png`);
                                    if(file) {
                                      conversation.sendMessage({contentType: file.type, media: file}, { type: 'context_image', label: `AI Outfit Suggestion ${index + 1}` });
                                    }
                                });
                                
                                const twilioMessages = await conversation.getMessages();
                                const messagePromises = twilioMessages.items
                                    .filter(msg => parseMessageAttributes(msg)?.type !== 'context_image' && parseMessageAttributes(msg)?.type !== 'video_call_request')
                                    .map(msg => processTwilioMessage(msg, user));
                                
                                const formattedMessages = await Promise.all(messagePromises);
                                setMessages(formattedMessages);

                                conversation.on('messageAdded', async (message: Message) => {
                                    const attrs = parseMessageAttributes(message);
                                    if ((attrs.type === 'context_image' && message.author === user.id) || attrs.type === 'video_call_request') return;
                                    
                                    const processedMsg = await processTwilioMessage(message, user);
                                    setMessages(prev => [...prev, processedMsg]);
                                });
                                
                                conversation.on('typingStarted', (p) => { if (p.identity !== user.id) setIsStylistTyping(true); });
                                conversation.on('typingEnded', (p) => { if (p.identity !== user.id) setIsStylistTyping(false); });
                                
                                setConnectionState('connected');
                                break;
                            // ... (other states)
                        }
                    });
                    client.on('connectionError', (error) => { /* ... */ });
                } catch (err) { /* ... */ }
            }
        };
        setupChat();
        return () => { /* ... (cleanup) */ };
    }, [isOpen, analysisContext, user, newItemContext]);
    
    // ... (Existing useEffect for scrolling)
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStylistTyping]);
    
    // ... (Existing message and file handling functions)
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() === '' || !conversationRef.current) return;
        conversationRef.current.sendMessage(input);
        setInput('');
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
      conversationRef.current?.typing();
    }
    const handleAttachClick = () => { fileInputRef.current?.click(); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && conversationRef.current) {
            conversationRef.current.sendMessage({ contentType: file.type, media: file, });
        }
        if(e.target) e.target.value = '';
    };

    // New video functions
    const startVideoCall = async () => {
        if (!conversationRef.current) return;
        setIsConnectingVideo(true);
        try {
            // 1. Get video token
            const response = await fetch('/api/generate-video-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: user.id, roomName: conversationRef.current.sid }),
            });
            const data = await response.json();
            if (!data.success) throw new Error("Failed to get video token.");

            // 2. Create local tracks (video and audio)
            const tracks = await createLocalTracks({ audio: true, video: { width: 640 } });
            const videoTrack = tracks.find(t => t.kind === 'video') as LocalTrack;
            const audioTrack = tracks.find(t => t.kind === 'audio') as LocalTrack;
            setLocalVideoTrack(videoTrack);
            setLocalAudioTrack(audioTrack);

            if (localVideoRef.current && videoTrack) {
                videoTrack.attach(localVideoRef.current);
            }

            // 3. Connect to the room
            const room = await Video.connect(data.token, { name: conversationRef.current.sid, tracks });
            setVideoRoom(room);
            
            // 4. Send system message to stylist
            conversationRef.current.sendMessage('', { type: 'video_call_request' });

            // 5. Handle participant events
            room.on('participantConnected', (participant: RemoteParticipant) => {
                participant.on('trackSubscribed', track => {
                    if (track.kind === 'audio') {
                        setRemoteAudioTrack(track);
                    }
                });
            });

            room.on('disconnected', () => { endVideoCall(); });

        } catch (error) {
            console.error("Failed to start video call:", error);
            setError("Could not start video call. Check camera/mic permissions.");
        } finally {
            setIsConnectingVideo(false);
        }
    };
    
    const endVideoCall = () => {
        if (videoRoom) {
            videoRoom.disconnect();
        }
        if (localVideoTrack) {
            localVideoTrack.stop();
            localVideoTrack.detach();
            setLocalVideoTrack(null);
        }
        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.detach();
            setLocalAudioTrack(null);
        }
        setVideoRoom(null);
        setRemoteAudioTrack(null);
        setIsMuted(false);
    };

    const toggleMute = () => {
        if (localAudioTrack) {
            if (isMuted) {
                localAudioTrack.enable();
            } else {
                localAudioTrack.disable();
            }
            setIsMuted(!isMuted);
        }
    };
    
    useEffect(() => {
        if (remoteAudioTrack && remoteAudioRef.current) {
            remoteAudioTrack.attach(remoteAudioRef.current);
            return () => { remoteAudioTrack.detach(); };
        }
    }, [remoteAudioTrack]);
    
    const handleClose = () => {
        if (videoRoom) endVideoCall();
        onClose();
    };


    const isLoading = connectionState !== 'connected' && connectionState !== 'failed';
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="fixed inset-0" onClick={handleClose} aria-hidden="true"></div>
            <div className="bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col z-10 border border-platinum/20">
                <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-platinum/20">
                    {/* ... (header content) */}
                    <button onClick={handleClose} className="text-platinum/60 hover:text-white transition-colors" aria-label="Close chat">
                        <CloseIcon />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                    {/* ... (chat messages) */}
                    <div ref={messageEndRef} />
                    
                    {/* Video UI */}
                    {videoRoom && (
                        <div className="absolute top-2 right-2 w-48 rounded-lg overflow-hidden border-2 border-platinum/30 shadow-lg">
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        </div>
                    )}
                    <audio ref={remoteAudioRef} autoPlay />
                </main>
                
                <footer className="flex-shrink-0 p-4 border-t border-platinum/20 space-y-3">
                    {videoRoom && (
                        <div className="flex justify-center items-center space-x-4 p-2 bg-black/20 rounded-full">
                            <button onClick={toggleMute} className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-platinum/20 text-platinum'}`}>
                                {isMuted ? <MicOffIcon /> : <MicOnIcon />}
                            </button>
                            <button onClick={endVideoCall} className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors">
                                <EndCallIcon />
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*"/>
                        <button type="button" onClick={handleAttachClick} disabled={isLoading || error !== null} className="p-2 text-platinum/60 hover:text-white transition-colors disabled:text-platinum/30" aria-label="Attach file">
                            <AttachIcon />
                        </button>
                        {!videoRoom && (
                            <button type="button" onClick={startVideoCall} disabled={isLoading || error !== null || isConnectingVideo} className="p-2 text-platinum/60 hover:text-white transition-colors disabled:text-platinum/30" aria-label="Start video call">
                                {isConnectingVideo ? <div className="w-5 h-5 animate-spin rounded-full border-t-2 border-platinum"></div> : <VideoIcon />}
                            </button>
                        )}
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder={isStylistTyping ? 'Stylist is typing...' : 'Type your message...'}
                            disabled={isLoading || error !== null}
                            className="flex-1 block w-full shadow-sm sm:text-sm bg-dark-blue border-platinum/30 rounded-full focus:ring-platinum focus:border-platinum transition-colors text-platinum placeholder-platinum/50 px-5 py-3"
                        />
                        <button type="submit" disabled={!input.trim()} className="bg-platinum text-dark-blue p-3 rounded-full hover:scale-110 disabled:bg-platinum/50 disabled:cursor-not-allowed disabled:scale-100 transition-all">
                            <SendIcon />
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};