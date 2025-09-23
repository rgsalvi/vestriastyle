import React, { useState, useEffect, useRef } from 'react';
import { Client, Conversation, Paginator, Message } from '@twilio/conversations';

const STYLISTS = [
    { id: 'tanvi_sankhe', name: 'Tanvi Sankhe' },
    { id: 'muskaan_datt', name: 'Muskaan Datt' },
    { id: 'riddhi_jogani', name: 'Riddhi Jogani' },
];

interface SessionContext {
    text: string | null;
    images: { url: string; label: string }[];
}

interface ProcessedMessage {
    sid: string;
    author: string | null;
    body: string | null;
    imageUrl?: string;
}

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

const ContextDisplay: React.FC<{ context: SessionContext }> = ({ context }) => (
    <div className="mb-4 p-3 rounded-2xl bg-dark-blue ring-1 ring-platinum/20 space-y-3">
        <h3 className="font-semibold text-platinum text-center text-sm border-b border-platinum/20 pb-2">Session Context</h3>
        {context.text && (
            <div className="text-xs text-platinum/80 space-y-1 whitespace-pre-wrap p-2 bg-black/20 rounded-lg">
                <p>{context.text}</p>
            </div>
        )}
        {context.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {context.images.map((image, index) => (
                    <div key={index} className="space-y-1">
                        <p className="text-xs text-center text-platinum/60">{image.label}</p>
                        <a href={image.url} target="_blank" rel="noopener noreferrer">
                            <img src={image.url} alt={image.label} className="rounded-lg w-full object-cover aspect-square" />
                        </a>
                    </div>
                ))}
            </div>
        )}
    </div>
);

// A more robust message attribute parser
const parseMessageAttributes = (message: Message): Record<string, any> => {
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
};

const processTwilioMessage = async (message: Message): Promise<ProcessedMessage> => {
    const processed: ProcessedMessage = {
        sid: message.sid,
        author: message.author,
        body: message.body,
    };
    if (message.type === 'media' && message.media) {
        processed.imageUrl = await message.media.getContentTemporaryUrl();
    }
    return processed;
};


export const StylistDashboard: React.FC = () => {
    const [identity, setIdentity] = useState<string | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ProcessedMessage[]>([]);
    const [sessionContext, setSessionContext] = useState<SessionContext>({ text: null, images: [] });
    const [input, setInput] = useState('');
    const messageEndRef = useRef<HTMLDivElement>(null);
    
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
            client.shutdown();
        }
    }, [client]);
    
    useEffect(() => {
        if (!activeConversation) return;
        
        const setupConversation = async () => {
            let context: SessionContext = { text: null, images: [] };
            const chatMessages: ProcessedMessage[] = [];
            
            const allTwilioMessages = (await activeConversation.getMessages()).items;

            for (const msg of allTwilioMessages) {
                const attrs = parseMessageAttributes(msg);
                
                if (attrs.type === 'context_text' && msg.author === 'system') {
                    context.text = msg.body;
                    continue;
                }
                
                if (attrs.type === 'context_image' && msg.type === 'media' && msg.media) {
                    try {
                        const url = await msg.media.getContentTemporaryUrl();
                        if (!context.images.some(img => img.url === url)) {
                            context.images.push({ url, label: attrs.label || 'Context Image' });
                        }
                    } catch(e) {
                        console.error("Could not get media URL for context image", e);
                    }
                    continue; 
                }

                try {
                    const processedMsg = await processTwilioMessage(msg);
                    chatMessages.push(processedMsg);
                } catch (e) {
                    console.error("Could not process a regular chat message", e);
                }
            }
            
            setSessionContext(context);
            setMessages(chatMessages);
            
            const onMessageAdded = async (message: Message) => {
                const attrs = parseMessageAttributes(message);
                
                if (attrs.type === 'context_image' && message.type === 'media' && message.media) {
                    try {
                        const url = await message.media.getContentTemporaryUrl();
                        setSessionContext(prev => {
                            if (prev.images.some(img => img.url === url)) return prev;
                            return { ...prev, images: [...prev.images, { url, label: attrs.label || 'Context Image' }]};
                        });
                    } catch (e) {
                         console.error("Could not get media URL for new context image", e);
                    }
                    return;
                }

                try {
                    const processedMsg = await processTwilioMessage(message);
                    setMessages(prev => [...prev, processedMsg]);
                } catch (e) {
                    console.error("Could not process new chat message", e);
                }
            };

            activeConversation.on('messageAdded', onMessageAdded);
            
            return () => {
                activeConversation.off('messageAdded', onMessageAdded);
            };
        };
        
        setupConversation();

    }, [activeConversation]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const selectConversation = (conversation: Conversation) => {
        setActiveConversation(conversation);
    };
    
    const sendMessage = () => {
        if (input.trim() && activeConversation) {
            activeConversation.sendMessage(input);
            setInput('');
        }
    };

    if (!identity || !client) {
        return <LoginPage onLogin={handleLogin} />;
    }

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
                                        <p>{conv.friendlyName || conv.sid}</p>
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
                                    {(sessionContext.text || sessionContext.images.length > 0) && <ContextDisplay context={sessionContext} />}
                                    {messages.map(msg => {
                                        const isStylist = msg.author === identity;
                                        return (
                                            <div key={msg.sid} className={`flex items-end ${isStylist ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-md lg:max-w-lg p-3 rounded-2xl ${
                                                      isStylist 
                                                      ? 'bg-platinum/90 text-dark-blue rounded-br-none' 
                                                      : 'bg-dark-blue text-platinum ring-1 ring-platinum/20 rounded-bl-none'
                                                  }`}>
                                                    {msg.imageUrl ? (
                                                        <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                            <img src={msg.imageUrl} alt="Shared media" className="rounded-lg max-w-xs" />
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messageEndRef}></div>
                                </div>
                            </div>
                            {/* Input Area */}
                            <div className="flex flex-row items-center h-16 rounded-xl bg-dark-blue w-full px-4 ring-1 ring-platinum/20">
                                <div className="flex-grow">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
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