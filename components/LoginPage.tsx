import React, { useState } from 'react';
import { signUp, signIn, resetPassword, resendVerification } from '../services/firebase';
import { repositoryUpdateIdentity } from '../services/repository';

interface LoginPageProps {
    onBack: () => void;
    onNavigateToTerms: () => void;
    onNavigateToPrivacy: () => void;
    initialMode?: 'signin' | 'signup';
}

const BackArrowIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
);


export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onNavigateToTerms, onNavigateToPrivacy, initialMode }) => {
    const [mode, setMode] = useState<'signin' | 'signup'>(initialMode || 'signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState(''); // YYYY-MM-DD
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Update mode when parent changes initialMode
    React.useEffect(() => {
        if (initialMode && (initialMode === 'signin' || initialMode === 'signup')) {
            setMode(initialMode);
        }
    }, [initialMode]);

    // Map Firebase auth error codes to user-friendly messages.
    const friendlyAuthMessage = (code: string, mode: 'signin' | 'signup'): string | null => {
        switch (code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
                return 'mismatch'; // handled with custom luxury copy below
            case 'auth/user-not-found':
                return mode === 'signin'
                    ? 'No account found with that email. Create an account instead.'
                    : null;
            case 'auth/too-many-requests':
                return 'Too many attempts. Please wait a minute and try again.';
            case 'auth/network-request-failed':
                return 'Network issue. Check your connection and try again.';
            case 'auth/email-already-in-use':
                return 'That email is already in use. Try signing in instead.';
            case 'auth/invalid-email':
                return 'That doesn\'t look like a valid email address.';
            case 'auth/weak-password':
                return 'Please choose a stronger password (at least 6 characters).';
            default:
                return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setErrorCode(null);
        setMessage(null);
        setLoading(true);
        try {
            if (mode === 'signup') {
                // Basic validation
                const fn = firstName.trim();
                const ln = lastName.trim();
                const date = dob.trim();
                if (!fn || !ln) throw new Error('Please enter your first and last name.');
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Please enter your date of birth (YYYY-MM-DD).');
                const dt = new Date(date);
                const today = new Date();
                if (Number.isNaN(dt.getTime()) || dt > today) throw new Error('Please enter a valid date of birth in the past.');

                await signUp(email, password, `${fn} ${ln}`);
                try {
                    await repositoryUpdateIdentity({ firstName: fn, lastName: ln, dateOfBirth: date });
                    // Best-effort: write identity cache so post-auth name uses Supabase value immediately
                    try {
                        const raw = localStorage.getItem('ai-wardrobe-user');
                        const u = raw ? JSON.parse(raw) : null;
                        const uid = u?.id as string | undefined;
                        if (uid) {
                            localStorage.setItem(`identity-cache-${uid}`, JSON.stringify({ display_name: `${fn} ${ln}`, first_name: fn, last_name: ln, date_of_birth: date }));
                        }
                    } catch {}
                } catch (idErr: any) {
                    // Show a clear message but don’t block the account creation
                    console.warn('Failed to persist identity to Supabase', idErr);
                }
                setMessage('Account created. Please check your email (including the Spam folder) for a link to verify your address before trying to sign in.');
            } else {
                await signIn(email, password);
                setMessage('Signed in successfully.');
            }
        } catch (err: any) {
            // Prefer Firebase error code → friendly message; fall back to original message.
            const code: string | undefined = err?.code;
            const friendly = code ? friendlyAuthMessage(code, mode) : null;
            const raw = err instanceof Error ? err.message : 'Authentication failed.';
            if (code) setErrorCode(code);
            setError(friendly === 'mismatch' ? 'mismatch' : (friendly || raw));
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setError(null); setErrorCode(null); setMessage(null);
        try {
            await resetPassword(email);
            setMessage('Password reset email sent. Please check your inbox (and Spam) for a reset link.');
        } catch (err: any) {
            const code: string | undefined = err?.code;
            const friendly = code ? friendlyAuthMessage(code, mode) : null;
            if (code) setErrorCode(code);
            setError(friendly === 'mismatch' ? 'mismatch' : (friendly || (err instanceof Error ? err.message : 'Failed to send reset email.')));
        }
    };

    const handleResendVerification = async () => {
        setError(null); setErrorCode(null); setMessage(null);
        try { await resendVerification(); setMessage('Verification email sent again. Please check your inbox (and Spam) for the verification link.'); }
        catch (err: any) {
            const code: string | undefined = err?.code;
            const friendly = code ? friendlyAuthMessage(code, mode) : null;
            if (code) setErrorCode(code);
            setError(friendly === 'mismatch' ? 'mismatch' : (friendly || (err instanceof Error ? err.message : 'Failed to send verification email.')));
        }
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
                                    <div role="alert" className="mt-6 flex items-start gap-4 p-5 rounded-2xl border border-platinum/25 bg-gradient-to-br from-white/5 via-white/3 to-white/[0.02] text-platinum/90 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M10.29 3.86a2 2 0 013.42 0l8.2 14.2A2 2 0 0120.2 21H3.8a2 2 0 01-1.71-2.94l8.2-14.2zM13 16a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="text-sm leading-relaxed space-y-2">
                                            {error === 'mismatch' ? (
                                                <>
                                                    <p className="font-medium tracking-wide text-platinum">The email and password don't match.</p>
                                                    <p className="text-platinum/70">
                                                        <button type="button" onClick={() => handleSubmit(new Event('submit') as any)} className="underline underline-offset-4 decoration-platinum/30 hover:decoration-platinum hover:text-white transition">Retry</button>
                                                        <span className="mx-1">or</span>
                                                        <button type="button" onClick={handleReset} className="underline underline-offset-4 decoration-platinum/30 hover:decoration-platinum hover:text-white transition">reset your password</button>.
                                                        {mode === 'signin' && (
                                                            <>
                                                                <span className="mx-1">Or</span>
                                                                <button type="button" onClick={() => setMode('signup')} className="underline underline-offset-4 decoration-platinum/30 hover:decoration-platinum hover:text-white transition">create your account</button>.
                                                            </>
                                                        )}
                                                    </p>
                                                </>
                                            ) : (
                                                <p>{error}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {message && (
                                    <div role="status" className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-platinum/30 bg-platinum/5 text-platinum">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0 text-platinum/80" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <div className="text-sm leading-relaxed">{message}</div>
                                        </div>
                                )}

                                <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
                                        {mode === 'signup' && (
                                                <>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm text-platinum/70 mb-1">First name</label>
                                                            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} type="text" className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" placeholder="Jane" required />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-platinum/70 mb-1">Last name</label>
                                                            <input value={lastName} onChange={(e) => setLastName(e.target.value)} type="text" className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" placeholder="Doe" required />
                                                        </div>
                                                    </div>
                                                                                <div>
                                                                                    <label htmlFor="signup-dob" className="block text-sm text-platinum/70 mb-1">Date of birth</label>
                                                                                    <input id="signup-dob" value={dob} onChange={(e) => setDob(e.target.value)} type="date" className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" required aria-describedby="signup-dob-hint" />
                                                                                    <p id="signup-dob-hint" className="mt-1 text-xs text-platinum/60">We use this to tailor your experience.</p>
                                                                                </div>
                                                </>
                                        )}
                    <div>
                        <label className="block text-sm text-platinum/70 mb-1">Email</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" placeholder="you@example.com" required />
                    </div>
                    <div>
                        <label className="block text-sm text-platinum/70 mb-1">Password</label>
                        <div className="relative group">
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type={showPassword ? 'text' : 'password'}
                                className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 pr-24 text-platinum tracking-wide focus:outline-none focus:ring-2 focus:ring-platinum/30 transition"
                                placeholder={showPassword ? 'Enter your password' : '••••••••'}
                                required
                                minLength={6}
                                aria-label="Password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(s => !s)}
                                className="absolute inset-y-0 right-2 my-1 inline-flex items-center gap-1 px-3 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-platinum/70 hover:text-platinum border border-white/10 backdrop-blur-sm transition"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223C5.885 5.167 9.194 3 12.75 3c4.064 0 7.515 2.492 9.27 6.094a1.8 1.8 0 010 1.812 17.37 17.37 0 01-1.278 2.092M9.53 9.53a3 3 0 004.243 4.243M6.1 6.1l11.8 11.8M9.546 16.222A8.7 8.7 0 0112.75 16.5c3.556 0 6.865-2.167 8.77-5.223M3 3l18 18" />
                                        </svg>
                                        Hide
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.676 4.5 12.75 4.5c5.073 0 9.326 3.01 10.713 7.178.07.207.07.437 0 .644-1.387 4.168-5.64 7.178-10.713 7.178-5.074 0-9.327-3.01-10.714-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Show
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-platinum text-dark-blue font-bold py-3 rounded-full hover:opacity-90 disabled:opacity-50 transition">{loading ? 'Please wait…' : (mode === 'signup' ? 'Sign Up' : 'Sign In')}</button>
                </form>

                                <div className="mt-6 flex items-center justify-between text-sm">
                                        <div className="flex items-center">
                                                <span className="text-platinum/60">{mode === 'signup' ? 'Have an account?' : 'New here?'}</span>
                                                <button
                                                    onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                                                    className="ml-2 inline-flex items-center font-semibold text-platinum underline decoration-platinum/40 underline-offset-4 hover:text-white hover:decoration-white transition-colors"
                                                >
                                                    {mode === 'signup' ? 'Sign in' : 'Create an account'}
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="ml-1 h-4 w-4">
                                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                        </div>
                                        {mode === 'signin' && (
                                            <button onClick={handleReset} className="text-platinum/60 hover:text-white underline decoration-platinum/30 underline-offset-4">Forgot password?</button>
                                        )}
                                </div>

                {mode === 'signin' && (
                    <div className="mt-3 text-xs text-platinum/50">
                        Not verified? <button onClick={handleResendVerification} className="underline hover:text-white">Resend verification email</button>
                    </div>
                )}

                                <p className="mt-8 text-xs text-platinum/50">
                                    By signing in, you agree to our{' '}
                                    <button onClick={onNavigateToTerms} className="underline decoration-platinum/40 hover:decoration-white hover:text-white transition-colors">Terms of Service</button>
                                    {' '}and{' '}
                                    <button onClick={onNavigateToPrivacy} className="underline decoration-platinum/40 hover:decoration-white hover:text-white transition-colors">Privacy Policy</button>.
                                </p>
            </div>
        </div>
    );
};