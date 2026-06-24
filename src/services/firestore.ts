import { supabase } from '../lib/supabase';

// ==========================================
// Funciones de Perfil de Usuario
// ==========================================
export const syncProfileToFirestore = async (profileData: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    console.error("No hay sesión activa para guardar el perfil.");
    return;
  }

  // Traductor de variables: de camelCase (Frontend) a snake_case (Base de datos)
  const dataToSave = {
    user_id: session.user.id,
    
    // Mapeo seguro de las variables comunes:
    name: profileData.name || profileData.nombre,
    edad: profileData.edad,
    genero: profileData.genero,
    peso: profileData.peso,
    altura: profileData.altura,
    asma: profileData.asma,
    hipertension: profileData.hipertension,
    ansiedad: profileData.ansiedad,
    epoc: profileData.epoc,
    alergias: profileData.alergias,
    
    // Aquí está el culpable del error:
    bpm_reposo: profileData.bpmReposo || profileData.bpm_reposo,
    
    // Opcional, por si también usas esta:
    preferencia_sos: profileData.preferenciaSos || profileData.preferencia_sos
  };

  // Limpiamos los "undefined" para que Supabase no se queje
  Object.keys(dataToSave).forEach(key => dataToSave[key as keyof typeof dataToSave] === undefined && delete dataToSave[key as keyof typeof dataToSave]);

  const { error } = await supabase
    .from('user_profiles')
    .upsert(dataToSave); 

  if (error) {
    console.error("Error exacto de Supabase al guardar:", error);
    throw error;
  }
};

export const getProfileFromFirestore = async (userId: string) => {
  // Ahora lee los datos reales de tu tabla 'user_profiles'
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle(); // Evita errores si el perfil aún no existe

  if (error) {
    console.error("Error cargando perfil desde Supabase:", error);
    return null;
  }
  return data;
};

// ==========================================
// Funciones del Panel de Administración
// ==========================================
export const fetchAllTelemetryData = async () => {
  // Carga telemetría real para el admin
  const { data, error } = await supabase
    .from('user_telemetry')
    .select('*')
    .limit(100); // Límite por seguridad

  if (error) {
    console.error("Error cargando telemetría global:", error);
    return [];
  }
  return data || [];
};

export const populateMockTelemetryData = async (count: number) => {
  console.log("Creación masiva de prueba desactivada en producción.");
  return []; 
};