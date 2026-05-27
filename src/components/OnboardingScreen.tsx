import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, User, LogIn, Mail, Lock } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'react-hot-toast';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Sesión iniciada con Google');
      onComplete();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al iniciar sesión.');
      toast.error('Error al iniciar sesión con Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa correo y contraseña.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Cuenta creada exitosamente');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Sesión iniciada correctamente');
      }
      onComplete();
    } catch (err: any) {
      console.error(err);
      let msg = 'Error en la autenticación.';
      if (err.code === 'auth/email-already-in-use') msg = 'El correo ya está en uso.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') msg = 'Credenciales inválidas.';
      if (err.code === 'auth/weak-password') msg = 'La contraseña es muy débil (mín. 6 caracteres).';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3faff] dark:bg-[#05141a] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto shadow-2xl border-x border-[#cfe6f2] dark:border-[#0f3443]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col items-center gap-6"
      >
        <div className="w-24 h-24 bg-[#00796b] rounded-3xl flex items-center justify-center shadow-lg transform rotate-3">
          <Heart className="w-12 h-12 text-white" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[#071e27] dark:text-white">SafeBreath</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tu asistente personal respiratorio y monitoreo cardíaco continuo.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0a232f] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-[#133240] w-full mt-6 space-y-4">
          <h2 className="text-base font-bold text-[#071e27] dark:text-white mb-2">
            {isRegistering ? 'Crear una cuenta' : 'Iniciar Sesión'}
          </h2>
          
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="email" 
                placeholder="Correo electrónico" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0f3443] border border-gray-200 dark:border-[#133240] text-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00796b]"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                placeholder="Contraseña" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0f3443] border border-gray-200 dark:border-[#133240] text-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00796b]"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#071e27] dark:bg-[#a4f0e9] text-white dark:text-[#071e27] font-bold py-3.5 rounded-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isRegistering ? 'Registrarse' : 'Ingresar'}</span>
              )}
            </button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-[#0a232f] px-2 text-xs text-gray-500">o también</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            type="button"
            className="w-full bg-[#00796b] hover:bg-[#005e53] text-white font-bold py-3.5 rounded-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <LogIn className="w-5 h-5" />
            <span>Continuar con Google</span>
          </button>
          
          <button 
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-xs text-[#00796b] dark:text-[#a4f0e9] font-bold hover:underline py-2 w-full text-center"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
          
          {error && <p className="text-xs text-red-500 font-semibold text-center">{error}</p>}

          <p className="text-[10px] text-gray-500 dark:text-gray-400 pt-2 font-semibold text-center">
            Al registrarte confirmas que has leído nuestros términos de privacidad sobre datos médicos.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
