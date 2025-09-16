import React, { useEffect, useState } from 'react';

interface LoginPageProps {
    onGoogleSignIn: (res: any) => void;
    onBack: () => void;
}

const BackArrowIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
);


export const LoginPage: React.FC<LoginPageProps> = ({ onGoogleSignIn, onBack }) => {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID_WEB;
        if (!clientId) {
            console.error("Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID_WEB in your environment variables.");
            setError("Authentication is not configured correctly. Please contact support.");
            return;
        }

        const initGoogleSignIn = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: onGoogleSignIn,
                });
                window.google.accounts.id.renderButton(
                    document.getElementById('google-signin-button'),
                    { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with' }
                );
                // We remove the automatic prompt to give users control
                // window.google.accounts.id.prompt(); 
            }
        };

        if (document.readyState === 'complete') {
            initGoogleSignIn();
        } else {
            window.addEventListener('load', initGoogleSignIn);
            return () => window.removeEventListener('load', initGoogleSignIn);
        }
    }, [onGoogleSignIn]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-dark-blue p-4 animate-fade-in">
            <div className="w-full max-w-md text-center bg-dark-blue/80 backdrop-blur-lg p-8 md:p-12 rounded-2xl shadow-lg border border-platinum/20 relative">
                <button
                  onClick={onBack}
                  className="absolute top-4 left-4 inline-flex items-center text-sm font-semibold text-platinum/80 hover:text-white transition-colors"
                  aria-label="Back to main application"
                >
                  <BackArrowIcon />
                  Back
                </button>
                <h2 className="text-3xl font-bold text-platinum tracking-tight mt-8">Create an Account</h2>
                <p className="mt-2 text-lg text-platinum/60">Sign in to save your wardrobe and get hyper-personalized advice.</p>
                
                {error ? (
                    <div className="mt-8 text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-400/30">
                        {error}
                    </div>
                ) : (
                    <div id="google-signin-button" className="mt-8 flex justify-center"></div>
                )}

                <p className="mt-8 text-xs text-platinum/40">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
};