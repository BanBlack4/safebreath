/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, AlertCircle, Sparkles, CheckCircle2, LogOut, Database, Phone, Plus, Trash2 } from 'lucide-react';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { UserProfile, EmergencyContact } from '../types';
import { auth } from '../firebase';

interface HealthProfileScreenProps {
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  onSignOut: () => void;
  onNavigateToAdmin?: () => void;
}

export default function HealthProfileScreen({ profile, onSaveProfile, onSignOut, onNavigateToAdmin }: HealthProfileScreenProps) {
  const [name, setName] = useState(profile.name || '');
  const [edad, setEdad] = useState<number | string>(profile.edad || '');
  const [genero, setGenero] = useState(profile.genero);
  const [peso, setPeso] = useState<number | string>(profile.peso || '');
  const [altura, setAltura] = useState<number | string>(profile.altura || '');

  // States for conditions
  const [asma, setAsma] = useState(profile.asma);
  const [hipertension, setHipertension] = useState(profile.hipertension);
  const [ansiedad, setAnsiedad] = useState(profile.ansiedad);
  const [epoc, setEpoc] = useState(profile.epoc);
  const [alergias, setAlergias] = useState(profile.alergias);

  const [bpmReposo, setBpmReposo] = useState(profile.bpmReposo);
  const [emergencyContacts, setEmergencyContacts] = useState(profile.emergencyContacts || []);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    validate();
  }, [edad, peso, altura, bpmReposo, emergencyContacts]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // Edad Validation
    const ageNum = Number(edad);
    if (!edad || isNaN(ageNum)) {
      errs.edad = "La edad es obligatoria";
    } else if (ageNum < 1 || ageNum > 120) {
      errs.edad = "Ingresa una edad válida (1 - 120 años)";
    } else if (!Number.isInteger(ageNum)) {
      errs.edad = "La edad debe ser un número entero";
    }

    // Peso Validation
    const pesoNum = Number(peso);
    if (!peso || isNaN(pesoNum)) {
      errs.peso = "El peso es obligatorio";
    } else if (pesoNum < 10 || pesoNum > 350) {
      errs.peso = "Ingresa un peso realista (10 - 350 kg)";
    }

    // Altura Validation
    const alturaNum = Number(altura);
    if (!altura || isNaN(alturaNum)) {
      errs.altura = "La altura es obligatoria";
    } else if (alturaNum < 40 || alturaNum > 260) {
      errs.altura = "Ingresa una altura realista (40 - 260 cm)";
    }

    // bpmReposo Validation
    const bpmNum = Number(bpmReposo);
    if (!bpmReposo || isNaN(bpmNum)) {
      errs.bpmReposo = "El pulso en reposo es obligatorio";
    } else if (bpmNum < 30 || bpmNum > 150) {
      errs.bpmReposo = "El pulso debe estar entre 30 y 150 BPM";
    }

    // Emergency Contacts Validation
    emergencyContacts.forEach((contact, index) => {
      if (!contact.name.trim()) {
        errs[`contact_${index}_name`] = "El nombre es obligatorio";
      }
      
      const fullPhone = `${contact.countryCode || '+56'}${contact.phone.replace(/[^0-9]/g, '')}`;
      
      if (!contact.phone.trim()) {
        errs[`contact_${index}_phone`] = "El teléfono es obligatorio";
      } else if (!isValidPhoneNumber(fullPhone)) {
        errs[`contact_${index}_phone`] = "Formato o número inválido.";
      }
    });

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      { id: Date.now().toString(), name: '', phone: '', relation: 'Familiar' }
    ]);
  };

  const updateEmergencyContact = (id: string, field: keyof EmergencyContact, value: string) => {
    setEmergencyContacts(emergencyContacts.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts(emergencyContacts.filter(c => c.id !== id));
  };

  const handleSave = () => {
    if (!validate()) {
      setToastMsg("Por favor, corrige los errores del formulario.");
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }

    onSaveProfile({
      ...profile,
      name,
      edad: Number(edad),
      genero,
      peso: Number(peso),
      altura: Number(altura),
      asma,
      hipertension,
      ansiedad,
      epoc,
      alergias,
      bpmReposo: Number(bpmReposo),
      emergencyContacts
    });

    setToastMsg("Cambios guardados con éxito.");
    setValidationErrors({});
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-24 space-y-6"
    >
      {/* Dynamic Saving Notification */}
      {toastMsg && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-16 left-4 right-4 z-50 bg-[#00796b] text-[#a1feec] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 font-semibold text-sm"
        >
          <CheckCircle2 className="w-5 h-5 text-teal-200" />
          <span>{toastMsg}</span>
        </motion.div>
      )}

      {/* Header Description Title */}
      <section className="space-y-1">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-[#071e27] dark:text-white">
              {profile.name ? `Perfil de ${profile.name}` : (auth.currentUser?.displayName ? `Perfil de ${auth.currentUser.displayName.split(' ')[0]}` : 'Perfil de Salud')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personaliza tu experiencia para una detección más precisa.
            </p>
          </div>
          <button onClick={onSignOut} className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-xs flex gap-1 items-center hover:bg-red-100 transition active:scale-95 shadow-sm border border-red-100 dark:border-red-900/50">
             <LogOut className="w-4 h-4" />
             Salir
          </button>
        </div>
      </section>

      {/* Name Input Card */}
      <section className="bg-white dark:bg-[#0a232f] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-[#133240] transition duration-150 space-y-1">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Nombre o Apodo</label>
        <div className="flex items-center border-b border-gray-150 dark:border-[#133240] focus-within:border-[#00796b] pb-1 transition duration-150">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent w-full text-lg font-bold text-gray-800 dark:text-white focus:outline-none border-none p-0 focus:ring-0"
            placeholder="Introduce tu nombre"
          />
        </div>
      </section>

      {/* Card Form container */}
      <section className="grid grid-cols-2 gap-4">
        {/* Edad Input Card */}
        <div className={`bg-white dark:bg-[#0a232f] rounded-2xl p-4 shadow-sm border transition duration-150 space-y-1 ${validationErrors.edad ? 'border-red-300 dark:border-red-900/50 ring-1 ring-red-300' : 'border-gray-100 dark:border-[#133240]'}`}>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Edad</label>
          <div className="flex items-center border-b border-gray-150 dark:border-[#133240] focus-within:border-[#00796b] pb-1 transition duration-150">
            <input
              type="number"
              value={edad}
              onChange={(e) => {
                const val = e.target.value;
                setEdad(val === '' ? '' : Number(val));
              }}
              className="bg-transparent w-full text-lg font-bold text-gray-800 dark:text-white focus:outline-none border-none p-0 focus:ring-0"
              placeholder="28"
            />
            <span className="text-xs font-bold text-gray-500 ml-1">Años</span>
          </div>
          {validationErrors.edad && (
            <p className="text-[10px] text-red-500 font-bold leading-tight mt-1">{validationErrors.edad}</p>
          )}
        </div>

        {/* Genero Selection Card */}
        <div className="bg-white dark:bg-[#0a232f] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-[#133240] space-y-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Género</label>
          <div className="flex items-center pb-1">
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className="bg-transparent w-full text-lg font-bold text-gray-800 dark:text-white border-none p-0 focus:ring-0 cursor-pointer focus:outline-none"
            >
              <option value="Hombre">Hombre</option>
              <option value="Mujer">Mujer</option>
              <option value="No binario">No binario</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        {/* Peso Input Card */}
        <div className={`bg-white dark:bg-[#0a232f] rounded-2xl p-4 shadow-sm border transition duration-150 space-y-1 ${validationErrors.peso ? 'border-red-300 dark:border-red-900/50 ring-1 ring-red-300' : 'border-gray-100 dark:border-[#133240]'}`}>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Peso</label>
          <div className="flex items-center border-b border-gray-150 dark:border-[#133240] focus-within:border-[#00796b] pb-1 transition duration-150">
            <input
              type="number"
              value={peso}
              onChange={(e) => {
                const val = e.target.value;
                setPeso(val === '' ? '' : Number(val));
              }}
              className="bg-transparent w-full text-lg font-bold text-gray-800 dark:text-white focus:outline-none border-none p-0 focus:ring-0"
              placeholder="70"
            />
            <span className="text-xs font-bold text-gray-500 ml-1">Kg</span>
          </div>
          {validationErrors.peso && (
            <p className="text-[10px] text-red-500 font-bold leading-tight mt-1">{validationErrors.peso}</p>
          )}
        </div>

        {/* Altura Input Card */}
        <div className={`bg-white dark:bg-[#0a232f] rounded-2xl p-4 shadow-sm border transition duration-150 space-y-1 ${validationErrors.altura ? 'border-red-300 dark:border-red-900/50 ring-1 ring-red-300' : 'border-gray-100 dark:border-[#133240]'}`}>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Altura</label>
          <div className="flex items-center border-b border-gray-150 dark:border-[#133240] focus-within:border-[#00796b] pb-1 transition duration-150">
            <input
              type="number"
              value={altura}
              onChange={(e) => {
                const val = e.target.value;
                setAltura(val === '' ? '' : Number(val));
              }}
              className="bg-transparent w-full text-lg font-bold text-gray-800 dark:text-white focus:outline-none border-none p-0 focus:ring-0"
              placeholder="175"
            />
            <span className="text-xs font-bold text-gray-500 ml-1">Cm</span>
          </div>
          {validationErrors.altura && (
            <p className="text-[10px] text-red-500 font-bold leading-tight mt-1">{validationErrors.altura}</p>
          )}
        </div>
      </section>

      {/* Medical conditions multi toggle check chips */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-[#071e27] dark:text-white">Condiciones Médicas</h3>
        <div className="flex flex-wrap gap-2.5">
          {[
            { label: 'Asma', state: asma, setter: setAsma },
            { label: 'Hipertensión', state: hipertension, setter: setHipertension },
            { label: 'Ansiedad', state: ansiedad, setter: setAnsiedad },
            { label: 'EPOC', state: epoc, setter: setEpoc },
            { label: 'Alergias', state: alergias, setter: setAlergias }
          ].map((item, idx) => {
            return (
              <button
                key={idx}
                onClick={() => item.setter(!item.state)}
                className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer ${
                  item.state
                    ? 'bg-[#a4f0e9] dark:bg-[#005e53] text-[#1d706a] dark:text-[#a4f0e9] border-[#00796b]'
                    : 'bg-[#e6f6ff] dark:bg-[#0c2a38] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#133240]'
                }`}
              >
                {item.state && <CheckCircle2 className="w-4 h-4 text-[#1d706a] dark:text-[#a4f0e9]" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Resting heart rate calibration range slider card */}
      <section className="bg-white dark:bg-[#0a232f] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#133240] space-y-5">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-teal-50 dark:bg-teal-900/40 rounded-xl text-teal-700 dark:text-teal-400">
            <Sparkles className="w-5 h-5 text-[#00796b] dark:text-[#a4f0e9]" />
          </span>
          <div>
            <h3 className="font-bold text-base text-[#071e27] dark:text-white">Frecuencia en Reposo</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Calibra el umbral de detección de anomalías.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-4xl font-extrabold text-[#00796b] tracking-tight">{bpmReposo}</span>
            <span className="text-sm font-bold text-gray-500">BPM</span>
          </div>

          <input
            type="range"
            min="40"
            max="120"
            value={bpmReposo}
            onChange={(e) => setBpmReposo(Number(e.target.value))}
            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#00796b]"
          />

          <div className="flex justify-between text-xs text-gray-400 font-bold">
            <span>40 BPM</span>
            <span>120 BPM</span>
          </div>
        </div>

        <div className="bg-[#a4f0e9]/20 p-4 rounded-2xl flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
          <p className="text-xs text-[#1d706a] leading-relaxed font-semibold">
            Este valor ayuda a <strong>SafeBreath</strong> a distinguir con precisión entre tu estado metabólico normal en reposo, actividad aeróbica general y ataques asmáticos reales o situaciones de estrés respiratorio.
          </p>
        </div>
      </section>

      {/* Emergency Contacts Section */}
      <section className="bg-white dark:bg-[#0a232f] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#133240] space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-rose-50 dark:bg-rose-900/40 rounded-xl text-rose-700 dark:text-rose-400">
              <Phone className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-[#071e27] dark:text-white">Contactos de Emergencia</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avisos SMS en alertas críticas</p>
            </div>
          </div>
          <button 
            onClick={addEmergencyContact}
            disabled={emergencyContacts.length >= 3}
            className={`p-2 rounded-full transition ${emergencyContacts.length >= 3 ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'bg-gray-100 dark:bg-[#133240] hover:bg-teal-50 dark:hover:bg-[#0f3443] hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer'}`}
          >
            <Plus className="w-5 h-5 transition-colors" />
          </button>
        </div>

        {emergencyContacts.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 dark:bg-[#0c2a38] rounded-2xl border border-dashed border-gray-200 dark:border-[#133240]">
            <p className="text-xs text-gray-500 font-medium">No hay contactos agendados (Max 3).</p>
          </div>
        ) : (
          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <div key={contact.id} className="relative bg-gray-50 dark:bg-[#0c2a38] rounded-2xl p-3 border border-gray-100 dark:border-[#133240] space-y-2">
                <button 
                  onClick={() => removeEmergencyContact(contact.id)}
                  className="absolute top-3 right-3 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={contact.name}
                    onChange={(e) => updateEmergencyContact(contact.id, 'name', e.target.value)}
                    className={`w-full bg-transparent text-sm font-bold text-gray-800 dark:text-white focus:outline-none placeholder-gray-400 border-b pb-1 pr-6 ${validationErrors[`contact_${index}_name`] ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                  />
                  {validationErrors[`contact_${index}_name`] && (
                    <p className="text-[10px] text-red-500 font-bold">{validationErrors[`contact_${index}_name`]}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                    <select
                      value={contact.countryCode || '+56'}
                      onChange={(e) => updateEmergencyContact(contact.id, 'countryCode', e.target.value)}
                      className="bg-transparent border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 pb-1 focus:outline-none cursor-pointer max-w-[100px] truncate"
                    >
                      <option value="+56">🇨🇱 +56</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+51">🇵🇪 +51</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+593">🇪🇨 +593</option>
                      <option value="+598">🇺🇾 +598</option>
                      <option value="+58">🇻🇪 +58</option>
                    </select>
                    
                    <input
                      type="tel"
                      placeholder="Teléfono (ej: 9...)"
                      value={contact.phone}
                      onChange={(e) => updateEmergencyContact(contact.id, 'phone', e.target.value)}
                      className={`flex-1 bg-transparent text-xs font-semibold focus:outline-none placeholder-gray-400 border-b pb-1 ${validationErrors[`contact_${index}_phone`] ? 'border-red-400 text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300 border-transparent focus:border-gray-300'}`}
                    />
                    
                    <select
                      value={contact.relation}
                      onChange={(e) => updateEmergencyContact(contact.id, 'relation', e.target.value)}
                      className="bg-gray-200 dark:bg-[#133240] text-xs font-bold text-gray-700 dark:text-gray-300 rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
                    >
                      <option value="Familiar">Familiar</option>
                      <option value="Amigo">Amigo</option>
                      <option value="Médico">Médico</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  {validationErrors[`contact_${index}_phone`] && (
                    <p className="text-[10px] text-red-500 font-bold">{validationErrors[`contact_${index}_phone`]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Panel Administrativo y de KPIs para Directivos */}
      {onNavigateToAdmin && (
        <section className="bg-gradient-to-r from-[#012f38] to-[#041a23] p-5 rounded-3xl border border-teal-800/40 text-white space-y-3.5 shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#a4f0e9]">Directorio & Negocios</h4>
              <h3 className="text-[13px] font-extrabold text-white mt-1">Panel de KPIs y Métricas</h3>
              <p className="text-[10px] text-teal-200 mt-0.5 leading-snug">Rendimiento preventivo, cohortes médicas y simulador de carga en segundo plano.</p>
            </div>
            <Database className="w-6 h-6 text-[#a4f0e9]" />
          </div>
          <button
            onClick={onNavigateToAdmin}
            className="w-full bg-[#00796b] hover:bg-[#005e53] text-white font-extrabold py-3 rounded-2xl text-xs active:scale-95 transition shadow-sm cursor-pointer border-t border-teal-500/20"
          >
            Abrir Consola Administrativa
          </button>
        </section>
      )}

      {/* Action Guardar Button section */}
      <section className="pt-2">
        <button
          onClick={handleSave}
          disabled={Object.keys(validationErrors).length > 0}
          className={`w-full font-bold py-4 rounded-2xl shadow-md transition flex justify-center items-center gap-2 ${
            Object.keys(validationErrors).length > 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-[#00796b] hover:bg-[#005e53] text-white active:scale-95 cursor-pointer'
          }`}
        >
          <Save className="w-5 h-5" />
          <span>Guardar Cambios</span>
        </button>
        <p className="text-center text-xs text-gray-400 font-bold mt-4">Última actualización: hace 2 semanas</p>
      </section>
    </motion.div>
  );
}
