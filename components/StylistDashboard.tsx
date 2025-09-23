import React, { useState, useEffect, useRef } from 'react';
import { Client, Conversation, Message, Participant } from '@twilio/conversations';

const STYLISTS = [
    { id: 'tanvi_sankhe', name: 'Tanvi Sankhe' },
    { id: 'muskaan_datt', name: 'Muskaan Datt' },
    { id: 'riddhi_jogani', name: 'Riddhi Jogani' },
];

interface ProcessedMessage {
    sid: string;
    author: string | null;
    body: string | null;
    imageUrl?: string;
    videoUrl?: string;
    attributes: Record<string, any>;
    dateCreated: Date;
}

const AttachIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.497a1.5 1.5 0 012.121-2.121l-1.414-1.414a.5.5 0 00-.707.707l1.414 1.414a2.5 2.5 0 01-3.536 3.536l-.496.496a4 4 0 01-5.657-5.657l7-7a4 4 0 015.657 5.657h-.001l-.496.497a2.5 2.5 0 01-3.536-3.536l1.414-1.414a.5.5 0 00.707-.707l-1.414-1.414a1.5 1.5 0 01-2.121 2.121l.497.497a3 3 0 004.242 0z" clipRule="evenodd" />
    </svg>
);


const LoginPage: React.FC<{ onLogin: (identity: string) => void }> = ({ onLogin }) => {
    const [identity, setIdentity] = useState('');
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm text-center bg-dark-blue/80 p-8 rounded-2xl shadow-lg border border-platinum/20">
                <h1 className="text-2xl font-bold text-platinum">Stylist Login</h1>
                <p className="mt-2 text-platinum/60">Select your name to begin.</p>
                <select 
                    value={identity} 
                    onChange={e => setIdentity(e.target.value)}
                    className="mt-6 block w-full pl-3 pr-10 py-2 text-base bg-dark-blue border-platinum/30 focus:outline-none focus:ring-platinum focus:border-platinum sm:text-sm rounded-lg transition-colors"
                >
                    <option value="">Select Your Name...</option>
                    {STYLISTS.map(stylist => <option key={stylist.id} value={stylist.id}>{stylist.name}</option>)}
                </select>
                <button
                    onClick={() => onLogin(identity)}
                    disabled={!identity}
                    className="mt-4 w-full bg-platinum text-dark-blue font-bold py-3 px-4 rounded-full shadow-lg disabled:bg-platinum/50 transition-all"
                >
                    Login
                </button>
            </div>
        </div>
    );
};

// Centralized message processor
const processTwilioMessage = async (message: Message): Promise<ProcessedMessage> => {
    const attributes = (() => {
        try {
            if (typeof message.attributes === 'object' && message.attributes !== null) {
                return message.attributes as Record<string, any>;
            }
            if (typeof message.attributes === 'string') {
                return JSON.parse(message.attributes);
            }
            return {};
        } catch (e) {
            console.error("Failed to parse message attributes:", message.attributes, e);
            return {};
        }
    })();
    
    const processed: ProcessedMessage = {
        sid: message.sid,
        author: message.author,
        body: message.body,
        attributes: attributes,
        dateCreated: message.dateCreated,
    };
    if (message.type === 'media' && message.media) {
        try {
            const url = await message.media.getContentTemporaryUrl();
            if (message.media.contentType.startsWith('image/')) {
                processed.imageUrl = url;
            } else if (message.media.contentType.startsWith('video/')) {
                processed.videoUrl = url;
            }
        } catch (e) {
            console.error(`Failed to get media URL for message ${message.sid}`, e);
        }
    }
    return processed;
};

export const StylistDashboard: React.FC = () => {
    const [identity, setIdentity] = useState<string | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ProcessedMessage[]>([]);
    const [input, setInput] = useState('');
    const [isUserTyping, setIsUserTyping] = useState(false);
    const messageEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleLogin = async (id: string) => {
        try {
            const response = await fetch('/api/generate-stylist-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: id }),
            });
            const data = await response.json();
            if (data.success) {
                const twilioClient = new Client(data.token);
                setClient(twilioClient);
                setIdentity(id);
            } else {
                alert(`Login failed: ${data.message || 'Please try again.'}`);
            }
        } catch (error) {
            console.error("Login request failed:", error);
            alert("Login request failed. Check the console for details.");
        }
    };
    
    useEffect(() => {
        if (!client) return;

        const onConnected = () => {
            client.getSubscribedConversations().then(paginator => {
                setConversations(paginator.items);
            });
        };
        
        const onConversationJoined = (conversation: Conversation) => {
             setConversations(prev => {
                const filtered = prev.filter(c => c.sid !== conversation.sid);
                return [conversation, ...filtered];
            });
        };

        client.on('connectionStateChanged', state => {
            if (state === 'connected') onConnected();
        });
        
        client.on('conversationJoined', onConversationJoined);

        return () => {
            if (client.connectionState === 'connected') {
                client.shutdown();
            }
        }
    }, [client]);
    
    useEffect(() => {
        if (!activeConversation || !identity) return;
        
        const setupConversation = async () => {
            setIsUserTyping(false);
            
            const twilioMessages = (await activeConversation.getMessages()).items;
            const processedMessages = await Promise.all(twilioMessages.map(processTwilioMessage));
            setMessages(processedMessages.sort((a, b) => a.dateCreated.getTime() - b.dateCreated.getTime()));
            
            const onMessageAdded = async (message: Message) => {
                const processedMsg = await processTwilioMessage(message);
                setMessages(prev => [...prev, processedMsg]);
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
                activeConversation.off('messageAdded', onMessageAdded);
                activeConversation.off('typingStarted', onTypingStarted);
                activeConversation.off('typingEnded', onTypingEnded);
            };
        };
        
        setupConversation();

    }, [activeConversation, identity]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isUserTyping]);

    const selectConversation = (conversation: Conversation) => {
        setMessages([]); // Clear previous messages immediately
        setActiveConversation(conversation);
    };
    
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

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && activeConversation) {
            activeConversation.sendMessage({
                contentType: file.type,
                media: file,
            });
        }
        if (event.target) event.target.value = '';
    };

    if (!identity || !client) {
        return <LoginPage onLogin={handleLogin} />;
    }
    
    // Render-time filtering of messages
    const contextText = messages.find(m => m.attributes.type === 'context_text')?.body || null;
    const contextImages = messages.filter(m => m.attributes.type === 'context_image' && m.imageUrl);
    const chatMessages = messages.filter(m => !m.attributes.type?.startsWith('context_'));

    return (
        <div className="h-screen w-screen flex antialiased text-platinum bg-dark-blue">
            <div className="flex flex-row h-full w-full overflow-x-hidden">
                {/* Sidebar */}
                <div className="flex flex-col py-4 px-3 w-80 bg-black/20 flex-shrink-0 border-r border-platinum/20">
                    <div className="flex flex-row items-center h-12 w-full">
                        <div className="ml-2 font-bold text-2xl">Vestria Chats</div>
                    </div>
                    <div className="flex flex-col mt-4">
                        <div className="flex flex-row items-center justify-between text-xs">
                            <span className="font-bold">Active Conversations</span>
                            <span className="flex items-center justify-center bg-platinum/30 h-4 w-4 rounded-full">{conversations.length}</span>
                        </div>
                        <div className="flex flex-col space-y-1 mt-4 -mx-2 h-[calc(100vh-100px)] overflow-y-auto">
                            {conversations.map(conv => (
                                <button
                                    key={conv.sid}
                                    onClick={() => selectConversation(conv)}
                                    className={`flex flex-row items-center hover:bg-platinum/10 rounded-xl p-2 text-left ${activeConversation?.sid === conv.sid ? 'bg-platinum/20' : ''}`}
                                >
                                    <div className="ml-2 text-sm font-semibold">
                                        <p className="truncate">{conv.friendlyName || conv.sid}</p>
                                        <p className="text-xs text-platinum/60">Last updated: {conv.lastMessage?.dateCreated.toLocaleString() || conv.dateUpdated.toLocaleString()}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex flex-col flex-auto h-full p-4">
                    {activeConversation ? (
                        <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-black/20 h-full p-4">
                            {/* Message Area */}
                            <div className="flex flex-col h-full overflow-y-auto mb-4">
                                <div className="flex flex-col h-full space-y-2">
                                    {(contextText || contextImages.length > 0) && (
                                        <div className="mb-4 p-3 rounded-2xl bg-dark-blue ring-1 ring-platinum/20 space-y-3">
                                            <h3 className="font-semibold text-platinum text-center text-sm border-b border-platinum/20 pb-2">Session Context</h3>
                                            {contextText && <p className="text-xs text-platinum/80 space-y-1 whitespace-pre-wrap p-2 bg-black/20 rounded-lg">{contextText}</p>}
                                            {contextImages.length > 0 && (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {contextImages.map((image, index) => (
                                                        <div key={index} className="space-y-1">
                                                            <p className="text-xs text-center text-platinum/60">{image.attributes.label || 'Context Image'}</p>
                                                            <a href={image.imageUrl} target="_blank" rel="noopener noreferrer">
                                                                <img src={image.imageUrl} alt={image.attributes.label} className="rounded-lg w-full object-cover aspect-square" />
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {chatMessages.map(msg => {
                                        const isStylist = msg.author === identity;
                                        return (
                                            <div key={msg.sid} className={`flex items-end ${isStylist ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-md lg:max-w-lg p-3 rounded-2xl ${isStylist ? 'bg-platinum/90 text-dark-blue rounded-br-none' : 'bg-dark-blue text-platinum ring-1 ring-platinum/20 rounded-bl-none'}`}>
                                                    {msg.imageUrl && (
                                                        <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                            <img src={msg.imageUrl} alt="Shared media" className="rounded-lg max-w-xs" />
                                                        </a>
                                                    )}
                                                    {msg.videoUrl && (
                                                        <video src={msg.videoUrl} controls className="rounded-lg max-w-xs" />
                                                    )}
                                                    {msg.body && <p className="text-sm whitespace-pre-wrap">{msg.body}</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {isUserTyping && (
                                        <div className="flex items-end justify-start">
                                            <div className="max-w-md lg:max-w-lg p-3 rounded-2xl bg-dark-blue text-platinum ring-1 ring-platinum/20 rounded-bl-none flex items-center space-x-1.5">
                                                <span className="w-2 h-2 bg-platinum/50 rounded-full animate-bounce"></span>
                                                <span className="w-2 h-2 bg-platinum/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                                <span className="w-2 h-2 bg-platinum/50 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messageEndRef}></div>
                                </div>
                            </div>
                            {/* Input Area */}
                            <div className="flex flex-row items-center h-16 rounded-xl bg-dark-blue w-full px-4 ring-1 ring-platinum/20">
                                <button type="button" onClick={handleAttachClick} className="px-3 text-platinum/60 hover:text-white transition-colors" aria-label="Attach file">
                                    <AttachIcon />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                                <div className="flex-grow">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={handleInputChange}
                                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type your message..."
                                        className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-platinum"
                                    />
                                </div>
                                <div className="ml-4">
                                    <button onClick={sendMessage} disabled={!input.trim()} className="flex items-center justify-center bg-platinum hover:bg-platinum/80 rounded-xl text-dark-blue px-4 py-2 flex-shrink-0 disabled:opacity-50 transition-all">
                                        <span>Send</span>
                                        <span className="ml-2">
                                            <svg className="w-4 h-4 transform rotate-45 -mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                        </span>
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
        </div>
    );
};