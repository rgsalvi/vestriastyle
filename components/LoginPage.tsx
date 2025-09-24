import React, { useState } from 'react';
import { signUp, signIn, resetPassword, resendVerification } from '../services/firebase';

interface LoginPageProps {
    onBack: () => void;
}

const BackArrowIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
);


export const LoginPage: React.FC<LoginPageProps> = ({ onBack }) => {
    const [mode, setMode] = useState<'signin' | 'signup'>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);
        try {
            if (mode === 'signup') {
                await signUp(email, password, name.trim() || undefined);
                setMessage('Account created. Please check your email to verify your address before signing in.');
            } else {
                await signIn(email, password);
                setMessage('Signed in successfully.');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Authentication failed.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setError(null); setMessage(null);
        try {
            await resetPassword(email);
            setMessage('Password reset email sent. Check your inbox.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email.');
        }
    };

    const handleResendVerification = async () => {
        setError(null); setMessage(null);
        try { await resendVerification(); setMessage('Verification email sent again.'); }
        catch (err) { setError(err instanceof Error ? err.message : 'Failed to send verification email.'); }
    };

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
                <h2 className="text-3xl font-bold text-platinum tracking-tight mt-8">{mode === 'signup' ? 'Create an Account' : 'Welcome back'}</h2>
                <p className="mt-2 text-lg text-platinum/60">Use your email and password. We’ll verify your email after signup.</p>

                {error && (
                    <div className="mt-6 text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-400/30">{error}</div>
                )}
                {message && (
                    <div className="mt-6 text-green-300 bg-emerald-900/20 p-3 rounded-lg border border-emerald-400/30">{message}</div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-sm text-platinum/70 mb-1">Full name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} type="text" className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" placeholder="Jane Doe" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm text-platinum/70 mb-1">Email</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" placeholder="you@example.com" required />
                    </div>
                    <div>
                        <label className="block text-sm text-platinum/70 mb-1">Password</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" placeholder="••••••••" required minLength={6} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-platinum text-dark-blue font-bold py-3 rounded-full hover:opacity-90 disabled:opacity-50 transition">{loading ? 'Please wait…' : (mode === 'signup' ? 'Sign Up' : 'Sign In')}</button>
                </form>

                <div className="mt-4 flex items-center justify-between text-sm">
                    <button onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')} className="text-platinum/80 hover:text-white">{mode === 'signup' ? 'Have an account? Sign in' : 'New here? Create an account'}</button>
                    {mode === 'signin' && <button onClick={handleReset} className="text-platinum/60 hover:text-white">Forgot password?</button>}
                </div>

                {mode === 'signin' && (
                    <div className="mt-3 text-xs text-platinum/50">
                        Not verified? <button onClick={handleResendVerification} className="underline hover:text-white">Resend verification email</button>
                    </div>
                )}

                <p className="mt-8 text-xs text-platinum/40">By signing in, you agree to our Terms of Service and Privacy Policy.</p>
            </div>
        </div>
    );
};