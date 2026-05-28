import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { ChevronRight, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InitialProfileSetupModalProps {
  initialEmail: string;
  currentProfile: UserProfile;
  onSave: (p: UserProfile) => void;
}

export default function InitialProfileSetupModal({ initialEmail, currentProfile, onSave }: InitialProfileSetupModalProps) {
  // Extract default username from email
  const defaultUsername = initialEmail.split('@')[0] || '';

  const [form, setForm] = useState({
    name: currentProfile.name || defaultUsername,
    edad: currentProfile.edad || 30,
    genero: currentProfile.genero || 'Femenino',
    peso: currentProfile.peso || 65,
    altura: currentProfile.altura || 165,
    asma: currentProfile.asma || false,
    ansiedad: currentProfile.ansiedad || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time validation
  React.useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (form.edad < 1 || form.edad > 120) newErrors.edad = "Ingresa una edad válida (1 - 120 años)";
    if (form.peso < 10 || form.peso > 350) newErrors.peso = "Ingresa un peso realista (10 - 350 kg)";
    if (form.altura < 40 || form.altura > 260) newErrors.altura = "Ingresa una altura realista (40 - 260 cm)";
    setErrors(newErrors);
  }, [form.edad, form.peso, form.altura]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Por favor, ingresa tu nombre o apodo.');
      return;
    }
    if (Object.keys(errors).length > 0) {
      toast.error('Por favor, corrige los errores del formulario.');
      return;
    }
    onSave({
      ...currentProfile,
      name: form.name.trim(),
      edad: form.edad,
      genero: form.genero,
      peso: form.peso,
      altura: form.altura,
      asma: form.asma,
      ansiedad: form.ansiedad,
    });
    toast.success('¡Perfil configurado con éxito!', { duration: 3000 });
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 flex justify-center items-center backdrop-blur-sm max-w-md mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-[#0a232f] p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-[#133240] w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-[#e6f6ff] dark:bg-[#0f3443] text-[#00796b] dark:text-[#26a69a] rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#071e27] dark:text-white text-center leading-tight">Completa tu Perfil</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 font-medium">
            Ayúdanos a personalizar tu monitoreo y notificaciones.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre o Apodo</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 dark:bg-[#0f3443] dark:border-[#133240] dark:text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#00796b] transition-all"
              placeholder="¿Cómo quieres que te llamemos?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Edad</label>
              <input
                type="number"
                min="0"
                max="120"
                value={form.edad}
                onChange={(e) => setForm({ ...form, edad: Number(e.target.value) })}
                className={`w-full bg-gray-50 border ${errors.edad ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-[#133240] focus:ring-[#00796b]'} dark:bg-[#0f3443] dark:text-white rounded-xl p-3 focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.edad && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.edad}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Género</label>
              <select
                value={form.genero}
                onChange={(e) => setForm({ ...form, genero: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 dark:bg-[#0f3443] dark:border-[#133240] dark:text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#00796b] transition-all"
              >
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Peso (kg)</label>
              <input
                type="number"
                min="0"
                max="300"
                value={form.peso}
                onChange={(e) => setForm({ ...form, peso: Number(e.target.value) })}
                className={`w-full bg-gray-50 border ${errors.peso ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-[#133240] focus:ring-[#00796b]'} dark:bg-[#0f3443] dark:text-white rounded-xl p-3 focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.peso && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.peso}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Altura (cm)</label>
              <input
                type="number"
                min="0"
                max="250"
                value={form.altura}
                onChange={(e) => setForm({ ...form, altura: Number(e.target.value) })}
                className={`w-full bg-gray-50 border ${errors.altura ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-[#133240] focus:ring-[#00796b]'} dark:bg-[#0f3443] dark:text-white rounded-xl p-3 focus:outline-none focus:ring-2 transition-all`}
              />
              {errors.altura && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.altura}</p>}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Condiciones Previas</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={form.asma}
                  onChange={(e) => setForm({ ...form, asma: e.target.checked })}
                  className="peer appearance-none w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg checked:bg-[#00796b] checked:border-[#00796b] transition-colors cursor-pointer"
                />
                <svg className="absolute w-4 h-4 text-white left-1 top-1 opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-gray-700 dark:text-gray-200 font-medium">Asma Diagnosticada</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={form.ansiedad}
                  onChange={(e) => setForm({ ...form, ansiedad: e.target.checked })}
                  className="peer appearance-none w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg checked:bg-[#00796b] checked:border-[#00796b] transition-colors cursor-pointer"
                />
                <svg className="absolute w-4 h-4 text-white left-1 top-1 opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-gray-700 dark:text-gray-200 font-medium">Trastorno de Ansiedad / Pánico</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={Object.keys(errors).length > 0}
            className={`w-full flex items-center justify-center gap-2 mt-6 px-6 py-3.5 rounded-xl font-bold shadow-md transition-all ${
              Object.keys(errors).length > 0 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed cursor-default' 
                : 'bg-[#00796b] text-white hover:bg-[#005e53] active:scale-95'
            }`}
          >
            <span>Guardar y Continuar</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
