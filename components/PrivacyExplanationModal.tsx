import React, { useEffect } from 'react';

export const PrivacyExplanationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true"></div>
            <div className="bg-[#1F2937] rounded-2xl shadow-xl w-full max-w-lg z-10 transform transition-all opacity-100 scale-100 border border-platinum/20">
                <div className="p-6 text-center border-b border-platinum/20">
                    <h3 className="text-2xl font-semibold text-platinum">Your Privacy, Our Priority</h3>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-left prose prose-slate max-w-none">
                    <h2>Why We Anonymize Faces</h2>
                    <p>At Vestria Style, we are committed to building a service you can trust. Protecting your privacy is a core part of that commitment. Here’s why we automatically blur faces on any image you upload:</p>
                    <ul>
                        <li><strong>Protecting Your Identity:</strong> Your face is sensitive personal information. By blurring it, we ensure that the images used for analysis cannot be tied back to you, significantly reducing risk in the event of a data breach.</li>
                        <li><strong>Privacy by Design:</strong> We believe in building privacy into our systems from the start. This feature is an example of that principle in action—we only process the data we absolutely need, which is your clothing.</li>
                        <li><strong>Secure, Client-Side Processing:</strong> The face detection and blurring process happens entirely within your browser on your device. The original, un-blurred photo is <strong>never</strong> sent to our servers or any third party.</li>
                    </ul>
                    <p>This privacy-first approach allows us to provide you with high-quality, personalized style advice without compromising your personal data. Your trust is important to us, and we are dedicated to safeguarding it.</p>
                </div>
                <div className="bg-dark-blue px-6 py-4 flex justify-center rounded-b-2xl border-t border-platinum/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-platinum text-dark-blue border border-transparent rounded-full shadow-sm text-sm font-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-blue focus:ring-platinum transition-transform"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};