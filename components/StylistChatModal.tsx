import React, { useState, useEffect, useRef } from 'react';
import type { User, AiResponse, ChatMessage, AnalysisItem } from '../types';
import { initiateChatSession } from '../services/geminiService';
import { Client, Conversation, Message } from '@twilio/conversations';

interface StylistChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  analysisContext: AiResponse | null;
  newItemContext: AnalysisItem | null;
}

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

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-platinum"></div>
);

// Helper to convert data URL to a File object
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

// Centralized message processor
const processTwilioMessage = async (message: Message, currentUser: User): Promise<ChatMessage> => {
    const chatMessage: ChatMessage = {
        id: message.sid,
        sender: message.author === currentUser.id ? 'user' : (message.author === 'system' ? 'system' : 'stylist'),
        text: message.body ?? '',
        timestamp: message.dateCreated.toISOString(),
    };
    if (message.type === 'media' && message.media) {
        chatMessage.imageUrl = await message.media.getContentTemporaryUrl();
    }
    return chatMessage;
};

export const StylistChatModal: React.FC<StylistChatModalProps> = ({ isOpen, onClose, user, analysisContext, newItemContext }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [connectionState, setConnectionState] = useState<'initializing' | 'connecting' | 'connected' | 'failed'>('initializing');
    const [error, setError] = useState<string | null>(null);
    const [stylist, setStylist] = useState<{ name: string; title: string; avatarUrl: string } | null>(null);
    const [input, setInput] = useState('');
    const [isStylistTyping, setIsStylistTyping] = useState(false);
    
    const messageEndRef = useRef<HTMLDivElement>(null);
    const conversationRef = useRef<Conversation | null>(null);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const setupChat = async () => {
            if (isOpen && analysisContext && user) {
                setConnectionState('initializing');
                setError(null);
                setMessages([]);
                setStylist(null);

                try {
                    const sessionData = await initiateChatSession(analysisContext, user);
                    if (!sessionData.success || !sessionData.token) {
                        throw new Error(sessionData.message || 'Failed to get chat token.');
                    }
                    
                    setStylist(sessionData.stylist);
                    
                    const client = new Client(sessionData.token);
                    clientRef.current = client;

                    client.on('connectionStateChanged', async (state) => {
                        switch (state) {
                            case 'connecting':
                                setConnectionState('connecting');
                                break;
                            case 'connected':
                                const conversation = await client.getConversationBySid(sessionData.conversationSid);
                                conversationRef.current = conversation;

                                // UPLOAD VISUAL CONTEXT
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
                                    .filter(msg => parseMessageAttributes(msg)?.type !== 'context_image')
                                    .map(msg => processTwilioMessage(msg, user));
                                
                                const formattedMessages = await Promise.all(messagePromises);
                                setMessages(formattedMessages);

                                conversation.on('messageAdded', async (message: Message) => {
                                    const attrs = parseMessageAttributes(message);
                                    if (attrs.type === 'context_image' && message.author === user.id) return;
                                    
                                    const processedMsg = await processTwilioMessage(message, user);
                                    setMessages(prev => [...prev, processedMsg]);
                                });
                                
                                conversation.on('typingStarted', (participant) => {
                                    if (participant.identity !== user.id) setIsStylistTyping(true);
                                });
                                
                                conversation.on('typingEnded', (participant) => {
                                     if (participant.identity !== user.id) setIsStylistTyping(false);
                                });
                                
                                setConnectionState('connected');
                                break;
                            case 'disconnecting':
                            case 'disconnected':
                                break;
                            case 'denied':
                                setConnectionState('failed');
                                setError('Connection denied. The chat token might be invalid or expired.');
                                break;
                        }
                    });

                    client.on('connectionError', (error) => {
                        console.error('Twilio Connection Error:', error);
                        setConnectionState('failed');
                        setError(`Connection failed: ${error.message}`);
                    });

                } catch (err) {
                    console.error("Error setting up chat:", err);
                    setError(err instanceof Error ? err.message : 'Could not connect to the stylist service.');
                    setConnectionState('failed');
                }
            }
        };

        setupChat();

        return () => {
            if (clientRef.current) {
                clientRef.current.shutdown();
                clientRef.current = null;
            }
            conversationRef.current = null;
        };

    }, [isOpen, analysisContext, user, newItemContext]);
    
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStylistTyping]);

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
    
    const isLoading = connectionState !== 'connected' && connectionState !== 'failed';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true"></div>
            <div className="bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col z-10 border border-platinum/20">
                <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-platinum/20">
                    {stylist && !isLoading ? (
                        <div className="flex items-center space-x-3">
                            <img src={stylist.avatarUrl} alt={stylist.name} className="w-12 h-12 rounded-full border-2 border-platinum/40" />
                            <div>
                                <h3 className="font-semibold text-lg text-platinum">{stylist.name}</h3>
                                <p className="text-sm text-platinum/60">{stylist.title}</p>
                            </div>
                        </div>
                    ) : (
                        <h3 className="font-semibold text-lg text-platinum">Live Stylist Chat</h3>
                    )}
                    <button onClick={onClose} className="text-platinum/60 hover:text-white transition-colors" aria-label="Close chat">
                        <CloseIcon />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Spinner />
                            <p className="mt-4 text-platinum/80 capitalize">{connectionState}...</p>
                        </div>
                    ) : error ? (
                         <div className="flex flex-col items-center justify-center h-full text-center">
                            <p className="text-red-400 font-semibold">Connection Error</p>
                            <p className="text-red-400/80 mt-1 text-sm">{error}</p>
                         </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'stylist' && stylist && <img src={stylist.avatarUrl} alt="stylist" className="w-8 h-8 rounded-full self-start flex-shrink-0" />}
                                {msg.sender === 'system' ? (
                                    <p className="w-full text-center text-xs text-platinum/50 italic py-2 px-4">{msg.text}</p>
                                ) : (
                                    <div className={`max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-platinum/90 text-dark-blue rounded-br-none' : 'bg-dark-blue text-platinum ring-1 ring-platinum/20 rounded-bl-none'}`}>
                                        {msg.imageUrl ? (
                                            <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                <img src={msg.imageUrl} alt="Shared media" className="rounded-lg max-w-xs" />
                                            </a>
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {isStylistTyping && (
                         <div className="flex items-end gap-2 justify-start">
                            {stylist && <img src={stylist.avatarUrl} alt="stylist" className="w-8 h-8 rounded-full self-start flex-shrink-0" />}
                            <div className="max-w-xs p-3 rounded-2xl bg-dark-blue ring-1 ring-platinum/20 rounded-bl-none flex items-center space-x-1.5">
                                 <span className="w-2 h-2 bg-platinum/50 rounded-full animate-bounce"></span>
                                 <span className="w-2 h-2 bg-platinum/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                 <span className="w-2 h-2 bg-platinum/50 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                            </div>
                         </div>
                    )}
                    <div ref={messageEndRef} />
                </main>
                
                <footer className="flex-shrink-0 p-4 border-t border-platinum/20">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
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