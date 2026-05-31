import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Activity, ShieldAlert, Check } from 'lucide-react';

interface WelcomeTutorialProps {
  onComplete: () => void;
}

export default function WelcomeTutorial({ onComplete }: WelcomeTutorialProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Estamos aquí para acompañarte",
      description: "SafeBreath observa patrones en tu ritmo cardíaco para ayudarte a encontrar calma cuando más lo necesitas.",
      icon: <Heart className="w-12 h-12 text-[#00796b]" />,
      type: "modal"
    },
    {
      title: "Un apoyo, no un médico",
      description: "SafeBreath no es un médico. No diagnosticamos enfermedades ni reemplazamos el cuidado profesional.",
      icon: <Activity className="w-12 h-12 text-[#00796b]" />,
      type: "modal"
    },
    {
      title: "Tu pulso te pertenece",
      description: "Nunca compartimos tu ubicación ni tus datos de salud sin tu permiso explícito. Estás en control.",
      icon: <Check className="w-12 h-12 text-[#00796b]" />,
      type: "modal"
    },
    {
      title: "Alertas y botón de emergencia",
      description: "Si notamos agitación, te sugeriremos una pausa. Siempre puedes usar el botón de SOS para contactar a tu apoyo.",
      icon: <ShieldAlert className="w-8 h-8 text-red-600" />,
      type: "tooltip"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const isTooltip = steps[step].type === "tooltip";

  return (
    <div className={`fixed inset-0 z-[100] ${isTooltip ? 'bg-black/40' : 'bg-black/60'} flex justify-center backdrop-blur-sm max-w-md mx-auto transition-colors duration-500`}>
      <AnimatePresence mode="wait">
        {!isTooltip ? (
          <motion.div
            key={`modal-${step}`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="bg-white dark:bg-[#0a232f] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-[#133240] w-[90%] max-w-sm flex flex-col items-center gap-6 m-auto"
          >
            <div className="w-24 h-24 bg-[#e6f6ff] dark:bg-[#0f3443] rounded-full flex items-center justify-center relative">
              <motion.div 
                 initial={{ scale: 0.8 }}
                 animate={{ scale: 1 }}
                 transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                {steps[step].icon}
              </motion.div>
            </div>
            <div className="space-y-3 text-center">
              <h2 className="text-2xl font-bold text-[#071e27] dark:text-white leading-tight">{steps[step].title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                {steps[step].description}
              </p>
            </div>
            
            <div className="flex justify-center gap-2 mt-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#00796b]' : 'w-2 bg-gray-200 dark:bg-gray-700'}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-[#00796b] text-white px-6 py-3.5 rounded-2xl font-bold shadow-md hover:bg-[#005e53] transition-all active:scale-95"
            >
              <span>Siguiente</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`tooltip-${step}`}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-4 bg-white dark:bg-[#0a232f] p-5 rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/30 w-72 flex flex-col items-start gap-3"
          >
            {/* Tooltip arrow pointing down-right */}
            <div className="absolute -bottom-3 right-8 w-6 h-6 bg-white dark:bg-[#0a232f] border-b border-r border-red-100 dark:border-red-900/30 transform rotate-45" />
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                {steps[step].icon}
              </div>
              <h3 className="font-bold text-red-600 dark:text-red-400 leading-tight">{steps[step].title}</h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              {steps[step].description}
            </p>

            <button
              onClick={handleNext}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:bg-red-700 transition-all active:scale-95 z-10"
            >
              <Check className="w-5 h-5" />
              <span>Entendido, Comenzar</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
