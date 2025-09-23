import React, { useState, useEffect, useRef } from 'react';
import { Client, Conversation, Paginator, Message } from '@twilio/conversations';

const STYLISTS = [
    { id: 'tanvi_sankhe', name: 'Tanvi Sankhe' },
    { id: 'muskaan_datt', name: 'Muskaan Datt' },
    { id: 'riddhi_jogani', name: 'Riddhi Jogani' },
];

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

export const StylistDashboard: React.FC = () => {
    const [identity, setIdentity] = useState<string | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const messageEndRef = useRef<HTMLDivElement>(null);
    
    const handleLogin = async (id: string) => {
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
            alert('Login failed. Please try again.');
        }
    };
    
    useEffect(() => {
        if (!client) return;

        client.on('connectionStateChanged', state => {
            if (state === 'connected') {
                client.getSubscribedConversations().then(paginator => {
                    setConversations(paginator.items);
                });
            }
        });

        client.on('conversationJoined', conversation => {
            setConversations(prev => [conversation, ...prev.filter(c => c.sid !== conversation.sid)]);
        });

        client.on('messageAdded', message => {
            if (message.conversation.sid === activeConversation?.sid) {
                setMessages(prev => [...prev, message]);
            }
        });

        return () => {
            client.shutdown();
        }
    }, [client, activeConversation]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const selectConversation = async (conversation: Conversation) => {
        setActiveConversation(conversation);
        const msgs = await conversation.getMessages();
        setMessages(msgs.items);
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
                                    className={`flex flex-row items-center hover:bg-platinum/10 rounded-xl p-2 ${activeConversation?.sid === conv.sid ? 'bg-platinum/20' : ''}`}
                                >
                                    <div className="ml-2 text-sm font-semibold text-left">
                                        <p>{conv.friendlyName || conv.sid}</p>
                                        <p className="text-xs text-platinum/60">Last updated: {conv.lastMessage?.dateCreated.toLocaleString()}</p>
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
                            <div className="flex flex-col h-full overflow-x-auto mb-4">
                                <div className="flex flex-col h-full">
                                    <div className="grid grid-cols-12 gap-y-2">
                                        {messages.map(msg => {
                                            const isStylist = msg.author === identity;
                                            return (
                                                <div key={msg.sid} className={`col-start-1 col-end-12 p-3 rounded-lg ${isStylist ? 'col-start-2 justify-end' : ''}`}>
                                                    <div className={`flex items-center ${isStylist ? 'justify-start flex-row-reverse' : 'flex-row'}`}>
                                                        <div className={`relative text-sm ${isStylist ? 'bg-platinum/90 text-dark-blue mr-3' : 'bg-dark-blue ring-1 ring-platinum/20 ml-3'} py-2 px-4 shadow rounded-xl`}>
                                                            <div className="whitespace-pre-wrap">{msg.body}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messageEndRef}></div>
                                    </div>
                                </div>
                            </div>
                            {/* Input Area */}
                            <div className="flex flex-row items-center h-16 rounded-xl bg-dark-blue w-full px-4">
                                <div className="flex-grow">
                                    <div className="relative w-full">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                            className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10 bg-dark-blue border-platinum/30"
                                        />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <button onClick={sendMessage} className="flex items-center justify-center bg-platinum hover:bg-platinum/80 rounded-xl text-dark-blue px-4 py-1 flex-shrink-0">
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