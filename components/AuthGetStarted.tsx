import React from 'react';
import { auth, signUp, signIn } from '../services/firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { repositoryUpdateIdentity } from '../services/repository';
import { getSupabaseClient } from '../services/supabaseClient';

interface Props {
  onBack: () => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
  onSignedIn: () => void;
  onSignedUp: () => void;
}

type Stage = 'email' | 'signin' | 'signup';

const BackArrowIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
  </svg>
);

export const AuthGetStarted: React.FC<Props> = ({ onBack, onNavigateToTerms, onNavigateToPrivacy, onSignedIn, onSignedUp }) => {
  const [stage, setStage] = React.useState<Stage>('email');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [dob, setDob] = React.useState('');
  const [greetName, setGreetName] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const emailInputRef = React.useRef<HTMLInputElement | null>(null);

  const validateEmail = (e: string) => /^(?:[A-Z0-9._%+-]+)@(?:[A-Z0-9.-]+)\.[A-Z]{2,}$/i.test(e.trim());

  const lookupGreeting = async (emailAddr: string) => {
    try {
      const sb = getSupabaseClient();
      const { data, error } = await sb.from('users').select('display_name,first_name').eq('email', emailAddr).single();
      if (!error && data) {
        const fn = (data.first_name as string | null) || (data.display_name as string | null);
        if (fn) {
          const short = fn.split(' ').filter(Boolean)[0];
          setGreetName(short || null);
          return;
        }
      }
    } catch {}
    const prefix = emailAddr.split('@')[0];
    setGreetName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setMessage(null);
    const eaddr = email.trim();
    if (!validateEmail(eaddr)) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, eaddr);
      if (Array.isArray(methods) && methods.length > 0) {
        setStage('signin');
        lookupGreeting(eaddr);
      } else {
        setStage('signup');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    try {
      await signIn(email.trim(), password);
      onSignedIn();
    } catch (err: any) {
      const code: string | undefined = err?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError("The email and password don't match.");
      } else {
        setError(err?.message || 'Sign in failed.');
      }
    } finally { setLoading(false); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    try {
      const fn = firstName.trim();
      const ln = lastName.trim();
      const date = dob.trim();
      if (!fn || !ln) throw new Error('Please enter your first and last name.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Please enter your date of birth (YYYY-MM-DD).');
      const dt = new Date(date);
      const today = new Date();
      if (Number.isNaN(dt.getTime()) || dt > today) throw new Error('Please enter a valid date of birth in the past.');

      await signUp(email.trim(), password, `${fn} ${ln}`);
      try { await repositoryUpdateIdentity({ firstName: fn, lastName: ln, dateOfBirth: date }); } catch {}
      setMessage('Account created. Check your email (including Spam) to verify your address.');
      onSignedUp();
    } catch (err: any) {
      const code: string | undefined = err?.code;
      if (code === 'auth/email-already-in-use') {
        setError('That email is already in use. Try signing in instead.');
        setStage('signin');
        lookupGreeting(email.trim());
      } else {
        setError(err?.message || 'Sign up failed.');
      }
    } finally { setLoading(false); }
  };

  // Allow switching back to email step (used by "Not you?" affordance)
  const handleChangeEmail = () => {
    setError(null);
    setMessage(null);
    setPassword('');
    setFirstName('');
    setLastName('');
    setDob('');
    setGreetName(null);
    setShowPassword(false);
    setStage('email');
  };

  React.useEffect(() => {
    if (stage === 'email' && emailInputRef.current) {
      const el = emailInputRef.current;
      el.focus();
      // Place cursor at end for quick edits; guard for input types that don't support selection
      const val = el.value ?? '';
      try {
        if (typeof el.setSelectionRange === 'function') {
          // Some browsers throw for types like 'email'; wrap in try/catch
          el.setSelectionRange(val.length, val.length);
        }
      } catch {
        // Ignore if selection is unsupported
      }
    }
  }, [stage]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-dark-blue px-4 pt-6 md:pt-10 pb-10 animate-fade-in">
      <div className={`w-full ${stage === 'signup' ? 'max-w-2xl' : 'max-w-xl'} text-center bg-dark-blue/80 backdrop-blur-lg p-8 md:p-12 rounded-2xl shadow-lg border border-platinum/20 relative`}>

        {stage === 'email' && (
          <>
            <h2 className="text-3xl font-bold text-platinum tracking-tight mt-8">Get Started</h2>
            <p className="mt-2 text-lg text-platinum/60">Enter your email to continue.</p>
            {error && (
              <div role="alert" className="mt-6 p-4 rounded-xl border border-platinum/25 bg-white/5 text-platinum/90">{error}</div>
            )}
            <form onSubmit={handleEmailSubmit} className="mt-8 space-y-4 text-left" autoComplete="on">
              <div>
                <input
                  ref={emailInputRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  name="email"
                  autoComplete="email"
                  className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-platinum text-dark-blue font-bold py-3 rounded-full hover:opacity-90 disabled:opacity-50 transition">{loading ? 'Please wait…' : 'Continue'}</button>
            </form>
          </>
        )}

        {stage === 'signin' && (
          <>
            <div className="mt-8 flex items-baseline justify-center gap-3">
              <h2 className="text-3xl font-bold text-platinum tracking-tight">Welcome back{greetName ? `, ${greetName}` : ''}</h2>
              <button
                type="button"
                onClick={handleChangeEmail}
                className="text-sm text-platinum/60 hover:text-white underline decoration-platinum/40 hover:decoration-white focus:outline-none focus-visible:ring-2 focus-visible:ring-platinum/40 rounded"
                aria-label="Change email"
              >
                Not you? Change email
              </button>
            </div>
            <p className="mt-2 text-lg text-platinum/60">Please enter your password to continue.</p>
            {error && (
              <div role="alert" className="mt-6 p-4 rounded-xl border border-platinum/25 bg-white/5 text-platinum/90">{error}</div>
            )}
            <form onSubmit={handleSignIn} className="mt-8 space-y-4 text-left">
              <div>
                <label className="block text-sm text-platinum/70 mb-1">Email</label>
                <input
                  aria-label="Email"
                  title="Email"
                  value={email}
                  readOnly
                  name="email"
                  autoComplete="email"
                  className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum/70"
                />
              </div>
              <div>
                <label className="block text-sm text-platinum/70 mb-1">Password</label>
                <div className="relative group">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    name="current-password"
                    autoComplete="current-password"
                    className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 pr-24 text-platinum tracking-wide focus:outline-none focus:ring-2 focus:ring-platinum/30 transition"
                    placeholder={showPassword ? 'Enter your password' : '••••••••'}
                    required
                    minLength={6}
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute inset-y-0 right-0 inline-flex items-center gap-1 px-4 text-xs font-medium text-platinum/70 hover:text-platinum focus:outline-none focus-visible:ring-2 focus-visible:ring-platinum/40"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-platinum text-dark-blue font-bold py-3 rounded-full hover:opacity-90 disabled:opacity-50 transition">{loading ? 'Signing in…' : 'Sign In'}</button>
            </form>
          </>
        )}

        {stage === 'signup' && (
          <>
            <div className="mt-8">
              <h2 className="text-3xl font-bold text-platinum tracking-tight">Hey! We’re glad you’re here.</h2>
            </div>
            <p className="mt-2 text-lg text-platinum/60">Let’s get your style journey started.</p>
            {message && (
              <div role="status" className="mt-6 p-4 rounded-xl border border-platinum/25 bg-platinum/5 text-platinum">{message}</div>
            )}
            {error && !message && (
              <div role="alert" className="mt-6 p-4 rounded-xl border border-platinum/25 bg-white/5 text-platinum/90">{error}</div>
            )}
            <form onSubmit={handleSignUp} className="mt-8 space-y-4 text-left">
              <div>
                <label className="block text-sm text-platinum/70 mb-1">Email</label>
                <input
                  aria-label="Email"
                  title="Email"
                  value={email}
                  readOnly
                  name="email"
                  autoComplete="email"
                  className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum/70"
                />
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="text-sm text-platinum/60 hover:text-white underline decoration-platinum/40 hover:decoration-white focus:outline-none focus-visible:ring-2 focus-visible:ring-platinum/40 rounded"
                    aria-label="Change email"
                  >
                    Not you? Change email
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-platinum/70 mb-1">First name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    type="text"
                    name="given-name"
                    autoComplete="given-name"
                    className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum"
                    placeholder="Jane"
                    required
                    autoCapitalize="words"
                  />
                </div>
                <div>
                  <label className="block text-sm text-platinum/70 mb-1">Last name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    type="text"
                    name="family-name"
                    autoComplete="family-name"
                    className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum"
                    placeholder="Doe"
                    required
                    autoCapitalize="words"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-platinum/70 mb-1">Date of birth</label>
                <input
                  aria-label="Date of birth"
                  title="Date of birth"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  type="date"
                  name="bday"
                  autoComplete="bday"
                  className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 text-platinum"
                  required
                />
                <p className="mt-1 text-xs text-platinum/60">We use this to tailor your experience.</p>
              </div>
              <div>
                <label className="block text-sm text-platinum/70 mb-1">Password</label>
                <div className="relative group">
                  <input
                    aria-label="Password"
                    title="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    name="new-password"
                    autoComplete="new-password"
                    className="w-full rounded-full bg-black/20 border border-platinum/30 px-4 py-2 pr-24 text-platinum"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute inset-y-0 right-0 inline-flex items-center gap-1 px-4 text-xs font-medium text-platinum/70 hover:text-platinum focus:outline-none focus-visible:ring-2 focus-visible:ring-platinum/40"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-platinum text-dark-blue font-bold py-3 rounded-full hover:opacity-90 disabled:opacity-50 transition">{loading ? 'Creating account…' : 'Create Account'}</button>
            </form>
          </>
        )}

        <p className="mt-8 text-xs text-platinum/50">
          By continuing, you agree to our{' '}
          <button onClick={onNavigateToTerms} className="underline decoration-platinum/40 hover:decoration-white hover:text-white transition-colors">Terms of Service</button>
          {' '}and{' '}
          <button onClick={onNavigateToPrivacy} className="underline decoration-platinum/40 hover:decoration-white hover:text-white transition-colors">Privacy Policy</button>.
        </p>
      </div>
    </div>
  );
};

export default AuthGetStarted;
