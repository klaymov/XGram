import { useState, useRef } from 'react';
import {
  Phone,
  KeyRound,
  Shield,
  Loader2,
  ArrowRight,
  AlertCircle,
  Settings,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import telegramService from '../../services/telegram';
import { useAuth } from '../../hooks/useAuth';

const STEPS = {
  CREDENTIALS: 'credentials',
  PHONE: 'phone',
  CODE: 'code',
  PASSWORD: 'password',
};

export default function LoginPage() {
  const { setAuthenticated, needsCredentials } = useAuth();

  const [step, setStep] = useState(needsCredentials ? STEPS.CREDENTIALS : STEPS.PHONE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form data
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [password, setPassword] = useState('');

  // Store phone code hash from sendCode response
  const phoneCodeHashRef = useRef('');

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!apiId || !apiHash) {
      setError('Both API ID and API Hash are required');
      return;
    }

    telegramService.saveCredentials(apiId.trim(), apiHash.trim());
    telegramService.createClient(apiId.trim(), apiHash.trim());
    setStep(STEPS.PHONE);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const credentials = telegramService.getStoredCredentials();
      if (!telegramService.client) {
        telegramService.createClient(credentials.apiId, credentials.apiHash);
      }

      const result = await telegramService.sendCode(phoneNumber.trim());
      phoneCodeHashRef.current = result.phoneCodeHash;
      setStep(STEPS.CODE);
    } catch (err) {
      console.error('Send code error:', err);
      if (err.errorMessage === 'PHONE_NUMBER_INVALID') {
        setError('Invalid phone number. Use international format (+380...)');
      } else if (err.errorMessage === 'PHONE_NUMBER_FLOOD') {
        setError('Too many requests. Please wait before trying again.');
      } else {
        setError(err.message || 'Failed to send verification code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await telegramService.signIn(
        phoneNumber.trim(),
        phoneCode.trim(),
        phoneCodeHashRef.current
      );

      if (result.status === '2fa_required') {
        setStep(STEPS.PASSWORD);
      } else {
        const me = await telegramService.getMe();
        setAuthenticated(me);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      if (err.errorMessage === 'PHONE_CODE_INVALID') {
        setError('Invalid verification code. Please try again.');
      } else if (err.errorMessage === 'PHONE_CODE_EXPIRED') {
        setError('Code expired. Please request a new one.');
        setStep(STEPS.PHONE);
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await telegramService.signInWith2FA(password);
      const me = await telegramService.getMe();
      setAuthenticated(me);
    } catch (err) {
      console.error('2FA error:', err);
      if (err.errorMessage === 'PASSWORD_HASH_INVALID') {
        setError('Incorrect password. Please try again.');
      } else {
        setError(err.message || 'Failed to verify password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = needsCredentials
      ? [STEPS.CREDENTIALS, STEPS.PHONE, STEPS.CODE]
      : [STEPS.PHONE, STEPS.CODE];
    const currentIdx = steps.indexOf(step);

    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i <= currentIdx
                  ? 'bg-brand-500 scale-110 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                  : 'bg-surface-700'
              }`}
            />
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 transition-all duration-300 ${
                  i < currentIdx ? 'bg-brand-500' : 'bg-surface-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-brand-500/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-brand-600/8 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4 shadow-lg shadow-brand-500/25">
            <span className="text-2xl font-bold text-white">X</span>
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            XGram
          </h1>
          <p className="text-surface-400 mt-2 text-sm">
            Your Telegram channels, reimagined
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 shadow-2xl">
          {renderStepIndicator()}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 animate-scale-in">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Step: API Credentials */}
          {step === STEPS.CREDENTIALS && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 animate-slide-up">
              <div className="text-center mb-4">
                <Settings className="w-10 h-10 text-brand-400 mx-auto mb-2" />
                <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100">API Credentials</h2>
                <p className="text-surface-400 text-xs mt-1">
                  Get them from{' '}
                  <a
                    href="https://my.telegram.org/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
                  >
                    my.telegram.org/apps
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 ml-1">
                  API ID
                </label>
                <input
                  id="api-id-input"
                  type="text"
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  placeholder="12345678"
                  className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-700 text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 ml-1">
                  API Hash
                </label>
                <input
                  id="api-hash-input"
                  type="text"
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  placeholder="0123456789abcdef..."
                  className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-700 text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                />
              </div>

              <button
                id="credentials-submit-btn"
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-brand-400 hover:to-brand-500 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/20"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Step: Phone Number */}
          {step === STEPS.PHONE && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4 animate-slide-up">
              <div className="text-center mb-4">
                <Phone className="w-10 h-10 text-brand-400 mx-auto mb-2" />
                <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100">Your Phone Number</h2>
                <p className="text-surface-400 text-xs mt-1">
                  We&apos;ll send you a verification code via Telegram
                </p>
              </div>

              <div>
                <input
                  id="phone-input"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+380 XX XXX XXXX"
                  className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-700 text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-center text-lg tracking-wide"
                  autoFocus
                />
              </div>

              <button
                id="phone-submit-btn"
                type="submit"
                disabled={isLoading || !phoneNumber.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-brand-400 hover:to-brand-500 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step: Verification Code */}
          {step === STEPS.CODE && (
            <form onSubmit={handleCodeSubmit} className="space-y-4 animate-slide-up">
              <div className="text-center mb-4">
                <KeyRound className="w-10 h-10 text-brand-400 mx-auto mb-2" />
                <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100">Verification Code</h2>
                <p className="text-surface-400 text-xs mt-1">
                  Enter the code sent to your Telegram app
                </p>
              </div>

              <div>
                <input
                  id="code-input"
                  type="text"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="•  •  •  •  •"
                  maxLength={5}
                  className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-700 text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                />
              </div>

              <button
                id="code-submit-btn"
                type="submit"
                disabled={isLoading || phoneCode.length < 5}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-brand-400 hover:to-brand-500 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(STEPS.PHONE);
                  setPhoneCode('');
                  setError('');
                }}
                className="w-full py-2 text-sm text-surface-400 hover:text-surface-300 transition-colors"
              >
                Use different number
              </button>
            </form>
          )}

          {/* Step: 2FA Password */}
          {step === STEPS.PASSWORD && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-slide-up">
              <div className="text-center mb-4">
                <Shield className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100">Two-Factor Authentication</h2>
                <p className="text-surface-400 text-xs mt-1">
                  Enter your cloud password
                </p>
              </div>

              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Cloud password"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-surface-800/80 border border-surface-700 text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                id="password-submit-btn"
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-brand-400 hover:to-brand-500 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Unlock
                    <Shield className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-surface-600 text-xs mt-6">
          XGram uses Telegram MTProto protocol. Your data stays in your browser.
        </p>
      </div>
    </div>
  );
}
