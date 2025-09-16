import React, { useEffect } from 'react';

interface LoginPageProps {
    onGoogleSignIn: (res: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onGoogleSignIn }) => {
    useEffect(() => {
        const initGoogleSignIn = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: '79620949788-t60dqkvohch844h6rqe9iunvhdusduom.apps.googleusercontent.com',
                    callback: onGoogleSignIn,
                });
                window.google.accounts.id.renderButton(
                    document.getElementById('google-signin-button'),
                    { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with' }
                );
                window.google.accounts.id.prompt();
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
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-slate-100 p-4 animate-fade-in">
            <div className="w-full max-w-md text-center bg-white/60 backdrop-blur-lg p-8 md:p-12 rounded-2xl shadow-lg border border-white/50">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                <p className="mt-2 text-lg text-slate-500">Sign in to access your personal wardrobe and get style advice.</p>
                <div id="google-signin-button" className="mt-8 flex justify-center"></div>
                <p className="mt-8 text-xs text-slate-400">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
};