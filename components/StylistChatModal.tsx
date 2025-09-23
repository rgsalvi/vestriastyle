
import React, { useState, useEffect, useRef } from 'react';
import type { User, AiResponse, ChatMessage } from '../types';
import { initiateChatSession } from '../services/geminiService';

interface StylistChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  analysisContext: AiResponse | null;
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

// Simulated stylist persona and responses
const MOCK_STYLIST_RESPONSES = [
    "That makes sense. Let me take a look at the analysis and your wardrobe items...",
    "Okay, I see what the AI suggested. The verdict seems solid, but we can definitely refine the accessory choices. What are your thoughts on the proposed outfits?",
    "How about we swap the ankle boots in the 'Office Chic' outfit for a pair of classic pointed-toe pumps? That would elongate your leg line, which is great for your body type.",
    "Let me generate a quick visual for you with that change...",
    "Here you go! I think this small change makes the whole look feel more powerful and sophisticated. What do you think?",
];

export const StylistChatModal: React.FC<StylistChatModalProps> = ({ isOpen, onClose, user, analysisContext }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stylist, setStylist] = useState<{ name: string; title: string; avatarUrl: string } | null>(null);
    const [input, setInput] = useState('');
    const [isStylistTyping, setIsStylistTyping] = useState(false);
    const messageEndRef = useRef<HTMLDivElement>(null);
    const mockResponseIndex = useRef(0);

    useEffect(() => {
        if (isOpen && analysisContext) {
            const setupChat = async () => {
                setIsLoading(true);
                setMessages([]);
                mockResponseIndex.current = 0;
                try {
                    const sessionData = await initiateChatSession(analysisContext);
                    if (sessionData.success) {
                        setStylist(sessionData.stylist);
                        const welcomeMessage: ChatMessage = {
                            id: `sys-${Date.now()}`,
                            sender: 'system',
                            text: `You are now connected with ${sessionData.stylist.name}, a ${sessionData.stylist.title}.`,
                            timestamp: new Date().toISOString(),
                        };
                        const initialStylistMessage: ChatMessage = {
                            id: `stylist-${Date.now()}`,
                            sender: 'stylist',
                            text: `Hi ${user.name.split(' ')[0]}! I see you're looking for advice on a new item for a '${analysisContext.outfits[0].title}' look. How can I help you refine this?`,
                            timestamp: new Date().toISOString(),
                        };
                        setMessages([welcomeMessage, initialStylistMessage]);
                    } else {
                        throw new Error('Failed to initiate session');
                    }
                } catch (error) {
                    const errorMessage: ChatMessage = {
                        id: `sys-err-${Date.now()}`,
                        sender: 'system',
                        text: 'Sorry, we couldn\'t connect you with a stylist right now. Please try again later.',
                        timestamp: new Date().toISOString(),
                    };
                    setMessages([errorMessage]);
                } finally {
                    setIsLoading(false);
                }
            };
            setupChat();
        }
    }, [isOpen, analysisContext, user.name]);
    
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStylistTyping]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() === '' || isStylistTyping) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: input,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Simulate stylist response
        if (mockResponseIndex.current < MOCK_STYLIST_RESPONSES.length) {
            setIsStylistTyping(true);
            setTimeout(() => {
                const stylistResponse: ChatMessage = {
                    id: `stylist-${Date.now() + 1}`,
                    sender: 'stylist',
                    text: MOCK_STYLIST_RESPONSES[mockResponseIndex.current],
                    timestamp: new Date().toISOString(),
                };
                 if (mockResponseIndex.current === 4) { // The one with the image
                    stylistResponse.imageUrl = analysisContext?.generatedOutfitImages ? `data:image/png;base64,${analysisContext.generatedOutfitImages[0]}` : 'https://picsum.photos/seed/outfit-new/400/400';
                }
                setIsStylistTyping(false);
                setMessages(prev => [...prev, stylistResponse]);
                mockResponseIndex.current++;
            }, 2000 + Math.random() * 1500); // Simulate typing delay
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true"></div>
            <div className="bg-[#1F2937] rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col z-10 border border-platinum/20">
                <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-platinum/20">
                    {stylist ? (
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
                            <p className="mt-4 text-platinum/80">Connecting you to a stylist...</p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'stylist' && <img src={stylist?.avatarUrl} alt="stylist" className="w-8 h-8 rounded-full self-start flex-shrink-0" />}
                                {msg.sender === 'system' ? (
                                    <p className="w-full text-center text-xs text-platinum/50 italic py-2">{msg.text}</p>
                                ) : (
                                    <div className={`max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-platinum/90 text-dark-blue rounded-br-none' : 'bg-dark-blue text-platinum ring-1 ring-platinum/20 rounded-bl-none'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        {msg.imageUrl && <img src={msg.imageUrl} alt="outfit visualization" className="mt-2 rounded-lg" />}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {isStylistTyping && (
                         <div className="flex items-end gap-2 justify-start">
                            <img src={stylist?.avatarUrl} alt="stylist" className="w-8 h-8 rounded-full self-start flex-shrink-0" />
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
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isStylistTyping ? 'Stylist is typing...' : 'Type your message...'}
                            disabled={isLoading || isStylistTyping}
                            className="flex-1 block w-full shadow-sm sm:text-sm bg-dark-blue border-platinum/30 rounded-full focus:ring-platinum focus:border-platinum transition-colors text-platinum placeholder-platinum/50 px-5 py-3"
                        />
                        <button type="submit" disabled={!input.trim() || isStylistTyping} className="bg-platinum text-dark-blue p-3 rounded-full hover:scale-110 disabled:bg-platinum/50 disabled:cursor-not-allowed disabled:scale-100 transition-all">
                            <SendIcon />
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};
