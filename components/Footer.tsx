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

const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`flex items-center ${className}`}>
        <svg width="24" height="24" viewBox="0 0 100 100" className="mr-3 text-platinum" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <g fill="currentColor" stroke="currentColor" strokeWidth="8" strokeLinecap="round">
                <circle cx="20" cy="20" r="8" stroke="none"/>
                <circle cx="50" cy="20" r="8" stroke="none"/>
                <circle cx="80" cy="20" r="8" stroke="none"/>
                <circle cx="20" cy="50" r="8" stroke="none"/>
                <circle cx="50" cy="50" r="8" stroke="none"/>
                <circle cx="80" cy="50" r="8" stroke="none"/>
                <circle cx="20" cy="80" r="8" stroke="none"/>
                <circle cx="50" cy="80" r="8" stroke="none"/>
                <circle cx="80" cy="80" r="8" stroke="none"/>
                <line x1="80" y1="20" x2="20" y2="80"/>
                <line x1="20" y1="20" x2="42" y2="42"/>
                <line x1="58" y1="58" x2="80" y2="80"/>
            </g>
        </svg>
        <div className="flex flex-col justify-center">
            <span className="text-xl font-semibold tracking-[0.2em] text-platinum leading-none">VESTRIA</span>
            <span className="block text-[10px] font-mono tracking-[0.3em] text-platinum/70 mt-1">STYLE</span>
        </div>
    </div>
);


interface FooterProps {
    onNavigateToPrivacy: () => void;
    onNavigateToTerms: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToPrivacy, onNavigateToTerms }) => {
    return (
        <footer className="bg-dark-blue text-platinum/70 backdrop-blur-lg border-t border-platinum/20">
            <div className="container mx-auto px-4 md:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {/* Company Info */}
                    <div className="col-span-2 lg:col-span-2">
                         <Logo />
                        <p className="mt-4 text-sm text-platinum/50 max-w-sm">
                            Your wardrobe, intelligently styled.
                        </p>
                    </div>

                    {/* Spacer */}
                    <div className="hidden lg:block"></div>

                    {/* Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-platinum tracking-wider uppercase">Legal</h3>
                        <ul className="mt-4 space-y-2">
                            <li><button onClick={onNavigateToPrivacy} className="text-sm text-left text-platinum/60 hover:text-white transition-colors">Privacy Policy</button></li>
                            <li><button onClick={onNavigateToTerms} className="text-sm text-left text-platinum/60 hover:text-white transition-colors">Terms of Service</button></li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="text-sm font-semibold text-platinum tracking-wider uppercase">Follow Us</h3>
                        <div className="mt-4 flex space-x-4">
                            <a href="#" className="text-platinum/60 hover:text-white transition-colors" aria-label="Instagram"><InstagramIcon /></a>
                            <a href="#" className="text-platinum/60 hover:text-white transition-colors" aria-label="TikTok"><TikTokIcon /></a>
                            <a href="#" className="text-platinum/60 hover:text-white transition-colors" aria-label="Pinterest"><PinterestIcon /></a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-platinum/20 text-center text-xs text-platinum/40">
                    <p className="font-medium text-platinum/60">&copy; {new Date().getFullYear()} Gilded Technologies Pvt Ltd. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};