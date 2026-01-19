import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { Activity, Lock, Mail, ArrowRight, CheckCircle2, Loader2, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// Login Page Component
// ============================================================================

export const Login: React.FC = () => {
  const { t } = useLanguage();
  const { signIn, signUp, signInWithGoogle, resetPassword, error: authError } = useAuth();

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (showForgotPassword) {
        // Reset password flow
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMessage(getErrorMessage(error.message));
        } else {
          setSuccessMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
          setShowForgotPassword(false);
        }
      } else if (isSignUp) {
        // Sign up flow
        if (password !== confirmPassword) {
          setErrorMessage('As senhas não coincidem');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('A senha deve ter pelo menos 6 caracteres');
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, name);
        if (error) {
          setErrorMessage(getErrorMessage(error.message));
        } else {
          setSuccessMessage('Conta criada! Verifique seu email para confirmar o cadastro.');
        }
      } else {
        // Sign in flow
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMessage(getErrorMessage(error.message));
        }
        // If successful, AuthContext will handle navigation
      }
    } catch (err) {
      setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(getErrorMessage(error.message));
    }
  };

  // Get user-friendly error message
  const getErrorMessage = (message: string): string => {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'Email not confirmed': 'Por favor, confirme seu email antes de fazer login',
      'User already registered': 'Este email já está cadastrado',
      'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
      'Unable to validate email address: invalid format': 'Formato de email inválido',
    };
    return errorMap[message] || message;
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-950 font-sans selection:bg-emerald-500/30">

      {/* Left Panel - Visuals */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 items-center justify-center p-12">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              {t.login.tagline}
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              {t.login.heroTitle} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{t.login.heroSubtitle}</span>
            </h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              {t.login.heroDesc}
            </p>

            <div className="space-y-4">
              {t.login.features.map((item, i) => (
                <div key={i} className="flex items-center text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-0 right-0 p-8">
          <div className="text-slate-500 text-sm">
            {isSignUp ? 'Já tem uma conta?' : t.login.needAccount}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setShowForgotPassword(false);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-emerald-400 font-medium cursor-pointer hover:underline"
            >
              {isSignUp ? 'Fazer login' : t.login.requestAccess}
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mr-3">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">FinGlow</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              {showForgotPassword
                ? 'Recuperar Senha'
                : isSignUp
                  ? 'Criar Conta'
                  : t.login.welcome}
            </h2>
            <p className="text-slate-400">
              {showForgotPassword
                ? 'Digite seu email para receber as instruções'
                : isSignUp
                  ? 'Preencha os dados para começar'
                  : t.login.enterDetails}
            </p>
          </div>

          {/* Error Message */}
          {(errorMessage || authError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{errorMessage || authError?.message}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-400 text-sm">{successMessage}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field (only for signup) */}
            {isSignUp && !showForgotPassword && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Nome</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">{t.login.emailLabel}</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder={t.login.emailPlaceholder}
                />
              </div>
            </div>

            {/* Password field (not for forgot password) */}
            {!showForgotPassword && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-medium text-slate-300">{t.login.passwordLabel}</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setErrorMessage(null);
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      {t.login.forgotPass}
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 pl-10 pr-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password field (only for signup) */}
            {isSignUp && !showForgotPassword && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Confirmar Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl h-12 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="mr-2">
                    {showForgotPassword
                      ? 'Enviar Email'
                      : isSignUp
                        ? 'Criar Conta'
                        : t.login.signInBtn}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {/* Back to login (from forgot password) */}
            {showForgotPassword && (
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setErrorMessage(null);
                }}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-300"
              >
                Voltar para o login
              </button>
            )}
          </form>

          {/* Social Login Divider */}
          {!showForgotPassword && (
            <>
              <div className="mt-8 flex items-center justify-between gap-4">
                <div className="h-[1px] bg-slate-800 flex-1"></div>
                <span className="text-xs uppercase text-slate-600 font-medium tracking-wider">{t.login.orContinue}</span>
                <div className="h-[1px] bg-slate-800 flex-1"></div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center h-11 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {t.login.google}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};