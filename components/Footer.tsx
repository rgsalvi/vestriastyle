import React from 'react';

const InstagramIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-6 h-6"} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
       <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
       <rect x="4" y="4" width="16" height="16" rx="4"></rect>
       <circle cx="12" cy="12" r="3"></circle>
       <line x1="16.5" y1="7.5" x2="16.5" y2="7.501"></line>
    </svg>
);

const TikTokIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-6 h-6"} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
       <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
       <path d="M9 12a4 4 0 1 0 4 4v-12a5 5 0 0 0 5 5"></path>
    </svg>
);

const PinterestIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-6 h-6"} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
       <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
       <line x1="8" y1="20" x2="12" y2="11"></line>
       <path d="M10.7 14c.437 1.263 1.43 2 2.55 2c2.071 0 3.75 -1.554 3.75 -4a5 5 0 1 0 -9.7 1.7"></path>
       <circle cx="12" cy="12" r="9"></circle>
    </svg>
);

interface FooterProps {
    onNavigateToPrivacy: () => void;
    onNavigateToTerms: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToPrivacy, onNavigateToTerms }) => {
    return (
        <footer className="bg-slate-900/95 text-slate-300 backdrop-blur-lg border-t border-slate-700/50">
            <div className="container mx-auto px-4 md:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {/* Company Info */}
                    <div className="col-span-2 lg:col-span-2">
                         <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-500 to-blue-400 text-transparent bg-clip-text">
                            AI Wardrobe Curator
                        </h2>
                        <p className="mt-2 text-sm text-slate-400 max-w-sm">
                            Your personal AI stylist. Making fashion sustainable and smart, powered by Gilded Technologies.
                        </p>
                    </div>

                    {/* Spacer */}
                    <div className="hidden lg:block"></div>

                    {/* Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-100 tracking-wider uppercase">Legal</h3>
                        <ul className="mt-4 space-y-2">
                            <li><button onClick={onNavigateToPrivacy} className="text-sm text-left text-slate-400 hover:text-white transition-colors">Privacy Policy</button></li>
                            <li><button onClick={onNavigateToTerms} className="text-sm text-left text-slate-400 hover:text-white transition-colors">Terms of Service</button></li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-100 tracking-wider uppercase">Follow Us</h3>
                        <div className="mt-4 flex space-x-4">
                            <a href="#" className="text-slate-400 hover:text-purple-400 transition-colors" aria-label="Instagram"><InstagramIcon /></a>
                            <a href="#" className="text-slate-400 hover:text-purple-400 transition-colors" aria-label="TikTok"><TikTokIcon /></a>
                            <a href="#" className="text-slate-400 hover:text-purple-400 transition-colors" aria-label="Pinterest"><PinterestIcon /></a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
                    <p className="font-medium text-slate-400">&copy; {new Date().getFullYear()} Gilded Technologies Pvt Ltd. All rights reserved.</p>
                    <div className="mt-2 space-x-1 sm:space-x-4 flex flex-col sm:flex-row justify-center items-center">
                        <span>CIN: U72900PN2021PTC206389</span>
                        <span className="hidden sm:inline">|</span>
                        <span>GSTIN: 27AAJCG4298C1ZF</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};