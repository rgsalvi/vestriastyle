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
    <svg
        viewBox="0 0 400 280"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Vestria Style Logo"
    >
        <g fill="#C2BEBA">
            {/* Symbol */}
            <g transform="translate(150 0) scale(1)">
                <g stroke="#C2BEBA" strokeWidth="8" strokeLinecap="round">
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
            </g>
            {/* VESTRIA */}
            <text
                x="50%"
                y="185"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="#C2BEBA"
                fontSize="80"
                fontFamily="Inter, sans-serif"
                fontWeight="600"
                letterSpacing="0.1em"
                stroke="none"
            >
                VESTRIA
            </text>
            {/* STYLE */}
            <text
                x="50%"
                y="245"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="#C2BEBA"
                fontSize="36"
                fontFamily="Space Grotesk, monospace"
                letterSpacing="0.2em"
                stroke="none"
            >
                STYLE
            </text>
        </g>
    </svg>
);


interface FooterProps {
    onNavigateToPrivacy: () => void;
    onNavigateToTerms: () => void;
    onNavigateToRefund: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToPrivacy, onNavigateToTerms, onNavigateToRefund }) => {
    return (
        <footer className="bg-dark-blue text-platinum/70 backdrop-blur-lg border-t border-platinum/20">
            <div className="container mx-auto px-4 md:px-8 py-12">
                <div className="flex flex-col items-center text-center">
                    {/* Centered Logo and Tagline */}
                    <Logo className="h-12 w-auto" />
                    <p className="mt-4 text-sm text-platinum/50 max-w-lg">
                        Every wardrobe hides a magical world. Open yours with Vestria Style.
                    </p>

                    {/* Social Links */}
                    <div className="mt-8 flex justify-center space-x-6">
                        <a href="https://www.instagram.com/vestria.style" target="_blank" rel="noopener noreferrer" className="text-platinum/60 hover:text-white transition-colors" aria-label="Instagram"><InstagramIcon /></a>
                        <a href="#" className="text-platinum/60 hover:text-white transition-colors" aria-label="TikTok"><TikTokIcon /></a>
                        <a href="https://www.pinterest.com/vestriastyle" target="_blank" rel="noopener noreferrer" className="text-platinum/60 hover:text-white transition-colors" aria-label="Pinterest"><PinterestIcon /></a>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-platinum/20 text-center text-xs text-platinum/40">
                    <div className="flex justify-center flex-wrap items-center gap-x-2 sm:gap-x-4 text-sm mb-4">
                        <button onClick={onNavigateToPrivacy} className="text-platinum/60 hover:text-white transition-colors">Privacy Policy</button>
                        <span className="text-platinum/40 hidden sm:inline">|</span>
                        <button onClick={onNavigateToTerms} className="text-platinum/60 hover:text-white transition-colors">Terms of Service</button>
                        <span className="text-platinum/40 hidden sm:inline">|</span>
                        <button onClick={onNavigateToRefund} className="text-platinum/60 hover:text-white transition-colors">Refund Policy</button>
                    </div>
                    <p className="font-medium text-platinum/60">&copy; {new Date().getFullYear()} Gilded Technologies Pvt Ltd. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};