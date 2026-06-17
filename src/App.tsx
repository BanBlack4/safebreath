/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import LiveMonitoringScreen from './components/LiveMonitoringScreen';
import CalmInterventionScreen from './components/CalmInterventionScreen';
import ConnectDevicesScreen from './components/ConnectDevicesScreen';
import OnboardingScreen from './components/OnboardingScreen';
import WelcomeTutorial from './components/WelcomeTutorial';
import InitialProfileSetupModal from './components/InitialProfileSetupModal';
import ErrorBoundary from './components/ErrorBoundary';
import VitalsScreen from './components/VitalsScreen';
import HealthProfileScreen from './components/HealthProfileScreen';
import AdminDashboardScreen from './components/AdminDashboardScreen';
import HistoryScreen from './components/HistoryScreen';
import EventDetailScreen from './components/EventDetailScreen';
import { AppScreen, UserProfile, ConnectedDevice, UserRole } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Activity, CheckCircle, Smartphone } from 'lucide-react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { syncProfileToFirestore, getProfileFromFirestore } from './services/firestore';
import { Toaster, toast } from 'react-hot-toast';

const LOCAL_STORAGE_PROFILE_KEY = 'safebreath_user_profile_data';

const DEFAULT_PROFILE: UserProfile = {
  edad: 28,
  genero: 'Hombre',
  peso: 70,
  altura: 175,
  asma: true,
  hipertension: false,
  ansiedad: true,
  epoc: false,
  alergias: false,
  bpmReposo: 68,
  emergencyContacts: [],
  preferenciaSos: 'both'
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [previousScreen, setPreviousScreen] = useState<AppScreen>('dashboard');

  useEffect(() => {
    if (currentScreen !== 'active-alert') {
      setPreviousScreen(currentScreen);
    }
  }, [currentScreen]);

  const [showFeedbackToast, setShowFeedbackToast] = useState(false);

  // Persistent active SOS incident state
  const [isIncidentActive, setIsIncidentActive] = useState<boolean>(() => {
    return localStorage.getItem('safebreath_incident_active') === 'true';
  });

  const [activeIncidentAlerts, setActiveIncidentAlerts] = useState<{ name: string; type: 'sms' | 'call'; timestamp: string }[]>(() => {
    try {
      const saved = localStorage.getItem('safebreath_incident_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeIncidentLogs, setActiveIncidentLogs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('safebreath_incident_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeIncidentLogIndex, setActiveIncidentLogIndex] = useState<number>(() => {
    const saved = localStorage.getItem('safebreath_incident_log_index');
    return saved ? parseInt(saved) : 0;
  });

  const handleClearIncident = () => {
    setIsIncidentActive(false);
    setActiveIncidentAlerts([]);
    setActiveIncidentLogs([]);
    setActiveIncidentLogIndex(0);
    localStorage.removeItem('safebreath_incident_active');
    localStorage.removeItem('safebreath_incident_alerts');
    localStorage.removeItem('safebreath_incident_logs');
    localStorage.removeItem('safebreath_incident_log_index');
  };

  useEffect(() => {
    localStorage.setItem('safebreath_incident_active', isIncidentActive ? 'true' : 'false');
  }, [isIncidentActive]);

  useEffect(() => {
    localStorage.setItem('safebreath_incident_alerts', JSON.stringify(activeIncidentAlerts));
  }, [activeIncidentAlerts]);

  useEffect(() => {
    localStorage.setItem('safebreath_incident_logs', JSON.stringify(activeIncidentLogs));
  }, [activeIncidentLogs]);

  useEffect(() => {
    localStorage.setItem('safebreath_incident_log_index', activeIncidentLogIndex.toString());
  }, [activeIncidentLogIndex]);

  // Real-time medical devices list stored inside local storage
  const [devices, setDevices] = useState<ConnectedDevice[]>(() => {
    try {
      const saved = localStorage.getItem('safebreath_connected_devices');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'device-1',
        name: 'Galaxy Watch 6 (GATT)',
        type: 'watch',
        status: 'disconnected',
        bpm: 72,
        battery: 88,
        lastSync: 'Hace 5 min',
        detailMessage: 'Monitoreo continuo de ritmo cardíaco para rescate SOS.'
      },
      {
        id: 'device-2',
        name: 'Oxímetro de Pulso OxSmart',
        type: 'oximeter',
        status: 'simulated',
        spo2: 98,
        battery: 92,
        lastSync: 'Sincronizado',
        detailMessage: 'Registra picos críticos de saturación de oxígeno (SpO2).'
      },
      {
        id: 'device-3',
        name: 'Inhalador de Rescate Salbutamol Smart',
        type: 'inhaler',
        status: 'connected',
        battery: 15,
        lastSync: 'Sincronizado',
        detailMessage: 'Registra el conteo automático de dosis inhaladas diarios.'
      },
      {
        id: 'device-4',
        name: 'Espirómetro BLE Pocket',
        type: 'spirometer',
        status: 'disconnected',
        battery: 75,
        lastSync: 'Hace 3 días',
        detailMessage: 'Mide capacidad de flujo pulmonar (PEF) voluntario.'
      }
    ];
  });

  const handleUpdateDevices = async (newDevices: ConnectedDevice[]) => {
    setDevices(newDevices);
    try {
      localStorage.setItem('safebreath_connected_devices', JSON.stringify(newDevices));
    } catch (e) {}
    
    if (auth.currentUser) {
      try {
        const batch = writeBatch(db);
        newDevices.forEach(device => {
          const deviceRef = doc(db, 'users', auth.currentUser!.uid, 'devices', device.id);
          batch.set(deviceRef, device, { merge: true });
        });
        await batch.commit();
      } catch (e) {
        console.warn("Failed to sync devices to Firestore:", e);
      }
    }
  };
  const [lastBpm, setLastBpm] = useState(72);
  const [lastTime, setLastTime] = useState("Hoy, 24 de Mayo • 11:05 AM");
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Manual theme override. 'system', 'light', 'dark'
  const [themeMode, setThemeMode] = useState<'system'|'light'|'dark'>(() => {
    return (localStorage.getItem('safebreath_theme') as 'system'|'light'|'dark') || 'system';
  });

  // Theme logic
  useEffect(() => {
    const applyTheme = () => {
      localStorage.setItem('safebreath_theme', themeMode);
      if (themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (themeMode === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const hours = new Date().getHours();
        const isNightTime = hours >= 19 || hours < 7;
        if (isSystemDark || isNightTime) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', applyTheme);
    const interval = setInterval(applyTheme, 60000);
    return () => {
      mediaQuery.removeEventListener('change', applyTheme);
      clearInterval(interval);
    };
  }, [themeMode]);

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Ignored
    }
    return DEFAULT_PROFILE;
  });

  const [userRole, setUserRole] = useState<UserRole>('user');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        // Sync User Doc
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, { email: currentUser.email, createdAt: new Date().toISOString(), role: 'user' });
            setShowTutorial(true);
            setUserRole('user');
          } else {
            const data = userDoc.data();
            setUserRole((data?.role as UserRole) || 'user');
            
            // Sync initial devices if available
            const devicesSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'devices'));
            if (!devicesSnapshot.empty) {
              const fetchedDevices = devicesSnapshot.docs.map(doc => doc.data() as ConnectedDevice);
              setDevices(fetchedDevices);
              try {
                localStorage.setItem('safebreath_connected_devices', JSON.stringify(fetchedDevices));
              } catch(e) {}
            } else if (data?.devices && Array.isArray(data.devices)) {
              // Fallback to legacy array if it exists
              setDevices(data.devices);
              try {
                localStorage.setItem('safebreath_connected_devices', JSON.stringify(data.devices));
              } catch(e) {}
              // Migrate legacy data to subcollection
              const batch = writeBatch(db);
              data.devices.forEach((dev: ConnectedDevice) => {
                const deviceRef = doc(db, 'users', currentUser.uid, 'devices', dev.id);
                batch.set(deviceRef, dev, { merge: true });
              });
              await batch.commit();
            }
          }
        } catch (error: any) {
          if (error.code !== 'unavailable') {
            console.warn("Failed to sync user doc:", error.message);
          }
        }
        
        // Log Firebase Token claims (Optional, for debugging)
        try {
          let idTokenResult = await currentUser.getIdTokenResult();
          console.log("🔥 [Firebase Auth] Token claims:", idTokenResult.claims);
        } catch(e) {
          console.error("No se pudo obtener token claims", e);
        }

        // Load external profile
        const remoteProfile = await getProfileFromFirestore();
        if (remoteProfile) {
          setProfile(remoteProfile);
          try { localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(remoteProfile)); } catch(e){}
        } else {
          syncProfileToFirestore(profile);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Calibrating status bar indicator overlay
  const [isCalibrating, setIsCalibrating] = useState(false);

  const handleSaveProfile = (updated: UserProfile) => {
    setProfile(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
    } catch (e) {
      // Ignored
    }
    syncProfileToFirestore(updated);
  };


  const handleStartCheckin = () => {
    // Show premium real-time sensor calibration overlay first
    setIsCalibrating(true);
    setTimeout(() => {
      setIsCalibrating(false);
      setCurrentScreen('vitals');
    }, 2000);
  };

  const handleEventDetailSelect = (timeStr: string, bpm: number) => {
    setLastBpm(bpm);
    setLastTime(`Oct ${timeStr.replace('Hoy,', '').trim()}`);
    setCurrentScreen('event-detail');
  };

  const handleThemeToggle = () => {
    setThemeMode((prev) => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  const triggerAlertScreenWithPermission = async () => {
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
      try {
        await (DeviceMotionEvent as any).requestPermission();
      } catch (e) {
        console.warn("DeviceMotion request error or denied:", e);
      }
    }
    if (currentScreen === 'active-alert') {
      setCurrentScreen(previousScreen || 'dashboard');
    } else {
      setPreviousScreen(currentScreen);
      setCurrentScreen('active-alert');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#f3faff] dark:bg-[#05141a] flex items-center justify-center max-w-md mx-auto relative shadow-2xl border-x border-[#cfe6f2] dark:border-[#0f3443]">
        <Activity className="w-8 h-8 text-[#00796b] dark:text-[#a4f0e9] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <OnboardingScreen onComplete={() => setCurrentScreen('dashboard')} />;
  }

  return (
    <div className="h-screen bg-[#f3faff] dark:bg-[#05141a] text-[#071e27] dark:text-[#cfe6f2] font-sans flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-[#cfe6f2] dark:border-[#0f3443] overflow-hidden">
      
      {/* Dynamic Header */}
      {currentScreen !== 'active-alert' && (
        <Header
          activeScreen={currentScreen}
          onProfileClick={() => setCurrentScreen('profile')}
          themeMode={themeMode}
          onThemeToggle={handleThemeToggle}
          devices={devices}
          onDevicesClick={() => setCurrentScreen('devices')}
        />
      )}

      {/* Persistent SOS Status Banner removed per user request */}

      {/* Main scrolling content frame with motion switches transitions */}
      <main className="flex-grow p-4 overflow-y-auto pb-28">
        <ErrorBoundary keyIdentifier={currentScreen as string} onReset={() => setCurrentScreen('dashboard')}>
          <AnimatePresence mode="wait">
            {isCalibrating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#e6f6ff]/95 dark:bg-[#05141a]/95 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#00796b]/20 rounded-full animate-ping" />
                <div className="w-20 h-20 rounded-full bg-[#00796b] text-white flex items-center justify-center">
                  <Activity className="w-10 h-10 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-[#005e53]">Conectando Sensores...</h3>
              <p className="text-sm text-gray-500 max-w-[260px] mx-auto mt-2">
                Calibrando tu smartwatch Wear OS y recopilando oxigenación del aire.
              </p>
            </motion.div>
          )}

          {currentScreen === 'dashboard' && (
            <motion.div
              key="dashboard-wrapper"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <LiveMonitoringScreen
                 onStartIntervention={() => setCurrentScreen('active-alert')}
              />
            </motion.div>
          )}

          {currentScreen === 'vitals' && (
            <motion.div
              key="vitals-wrapper"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <VitalsScreen
                profile={profile}
                onScreenChange={(scr) => {
                  if (scr === 'event-detail') setCurrentScreen('event-detail');
                  else setCurrentScreen(scr as AppScreen);
                }}
                triggerAlertScreen={triggerAlertScreenWithPermission}
              />
            </motion.div>
          )}

          {currentScreen === 'profile' && (
            <motion.div
              key="profile-wrapper"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <HealthProfileScreen
                profile={profile}
                onSaveProfile={handleSaveProfile}
                onSignOut={handleSignOut}
                onNavigateToAdmin={userRole === 'admin' ? () => setCurrentScreen('admin-dashboard') : undefined}
              />
            </motion.div>
          )}

          {currentScreen === 'admin-dashboard' && (
            <motion.div
              key="admin-dashboard-wrapper"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <AdminDashboardScreen onBack={() => setCurrentScreen('profile')} />
            </motion.div>
          )}

          {currentScreen === 'history' && (
            <motion.div
              key="history-wrapper"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryScreen
                profile={profile}
                onEventSelect={handleEventDetailSelect}
                onScreenChange={setCurrentScreen}
              />
            </motion.div>
          )}

          {currentScreen === 'event-detail' && (
            <motion.div
              key="event-detail-wrapper"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <EventDetailScreen
                onBack={() => setCurrentScreen('history')}
                eventTime={lastTime}
                peakBpm={lastBpm}
              />
            </motion.div>
          )}

          {currentScreen === 'active-alert' && (
            <motion.div
              key="active-alert-wrapper"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <CalmInterventionScreen
                profile={profile}
                onDismiss={() => {
                   setCurrentScreen('dashboard');
                   setTimeout(() => setShowFeedbackToast(true), 2000); // Show feedback gently after returning
                   setTimeout(() => setShowFeedbackToast(false), 20000); // Auto hide after a while
                }}
                onEscalate={() => {
                   setCurrentScreen('dashboard');
                }}
                isIncidentActive={isIncidentActive}
                onSetIncidentActive={setIsIncidentActive}
                activeIncidentAlerts={activeIncidentAlerts}
                onSetIncidentAlerts={setActiveIncidentAlerts}
                activeIncidentLogs={activeIncidentLogs}
                onSetIncidentLogs={setActiveIncidentLogs}
                activeIncidentLogIndex={activeIncidentLogIndex}
                onSetIncidentLogIndex={setActiveIncidentLogIndex}
                onClearIncident={handleClearIncident}
              />
            </motion.div>
          )}

          {currentScreen === 'devices' && (
            <motion.div
              key="devices-wrapper"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ConnectDevicesScreen 
                onBack={() => setCurrentScreen('vitals')} 
                devices={devices}
                onUpdateDevices={handleUpdateDevices}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* Persistent Bottom Tabs Navigation bar */}
      <BottomNav
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        triggerAlertScreen={triggerAlertScreenWithPermission}
      />

      {/* Welcome Tutorial Overlay */}
      {showTutorial && (
        <WelcomeTutorial 
          onComplete={() => {
            setShowTutorial(false);
            setShowProfileSetup(true);
          }} 
        />
      )}
      
      {/* Initial Profile Setup Overlay */}
      {showProfileSetup && user && (
        <InitialProfileSetupModal
          initialEmail={user.email || ''}
          currentProfile={profile}
          onSave={(updatedProfile) => {
            handleSaveProfile(updatedProfile);
            setShowProfileSetup(false);
          }}
        />
      )}

      {/* System Notifications */}
      <Toaster position="top-center" toastOptions={{ className: 'dark:bg-[#0a232f] dark:text-white', style: { borderRadius: '16px', fontWeight: 'calc(bold)' } }} />

      {/* Graceful Feedback UX */}
      <AnimatePresence>
        {showFeedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-40 bg-[#071e27] dark:bg-[#1e293b] text-white p-5 rounded-3xl shadow-xl flex flex-col gap-3"
          >
            <h3 className="font-semibold text-lg text-center">¿Te ayudó esta pausa?</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => { setShowFeedbackToast(false); toast.success("Gracias por dejarnos saber."); }}
                className="flex-1 py-3 bg-[#00796b] hover:bg-[#005e53] rounded-2xl font-medium transition-colors"
              >
                Sí, estoy mejor
              </button>
              <button 
                onClick={() => { setShowFeedbackToast(false); toast("Anotado. Seguiremos calibrando el sensor.", { icon: '📊' }) }}
                className="flex-1 py-3 bg-[#334155] hover:bg-[#475569] rounded-2xl font-medium transition-colors"
              >
                Falsa Alarma
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
