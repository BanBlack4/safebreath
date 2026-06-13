# Instrucciones para configurar Supabase

Aquí tienes el resumen de las configuraciones y ajustes que necesitas aplicar en el panel de **Supabase** para que las nuevas pantallas (`HistoryScreen`, `LiveMonitoringScreen`) y la integración que hicimos funcionen correctamente en producción, cubriendo el Advisor Center y la escritura de logs/check-ins.

> **⚠️ SOLUCIÓN AL ERROR DE UUID (Código 22P02)**  
> Si estás viendo en la consola un error que dice `"invalid input syntax for type uuid: \"...\""`, es porque Firebase usa UIDs de texto (ej. `wPnwn4...`), pero Supabase por defecto crea las columnas `user_id` como tipo `UUID`. Además, la función `auth.uid()` asume que el token tiene un UUID. Para arreglar esto, ejecuta este bloque en el SQL Editor de Supabase:

```sql
-- 1. Eliminar TODAS las políticas actuales de las tablas dinámicamente
-- (PostgreSQL impide cambiar el tipo de una columna si está en uso por una política)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('health_events', 'user_insights', 'user_telemetry')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. Eliminar las restricciones de llave foránea (Foreign Keys) y Checks restrictivos
-- Como estamos usando Firebase Auth, los IDs (string) no existirán en la tabla auth.users (uuid) de Supabase.
ALTER TABLE public.health_events DROP CONSTRAINT IF EXISTS health_events_user_id_fkey;
ALTER TABLE public.user_insights DROP CONSTRAINT IF EXISTS user_insights_user_id_fkey;
ALTER TABLE public.user_telemetry DROP CONSTRAINT IF EXISTS user_telemetry_user_id_fkey;

-- 2.5 Eliminar validación de tipos del enum si existe (Soluciona el Error 23514 o health_events_type_check)
-- Esto permite registrar nuestros eventos personalizados como 'calm_intervention' o 'sos_dispatch' en la app.
ALTER TABLE public.health_events DROP CONSTRAINT IF EXISTS health_events_type_check;

-- 3. Ahora sí, cambiar el tipo de dato de UUID a TEXT en las tablas
ALTER TABLE public.health_events ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_insights ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.user_telemetry ALTER COLUMN user_id TYPE TEXT;

-- 4. Recrear las políticas usando auth.jwt()->>'sub'
-- Esto compara directamente el string del ID de Firebase sin forzarlo a UUID

CREATE POLICY "Users can view their own health events" 
ON public.health_events FOR SELECT 
USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert manual check-ins" 
ON public.health_events FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can view their insights" 
ON public.user_insights FOR SELECT 
USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert their telemetry" 
ON public.user_telemetry FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
```

## 1. Solucionar Alertas de Seguridad (Advisor Center)

Debes ejecutar este bloque SQL para solucionar los problemas de `SECURITY DEFINER` y `search_path` que detectamos antes:

```sql
-- 1. Arreglar mutable search_path en las funciones de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at_utc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 2. Asegurarse que la vista del catálogo de productos sea segura (cambiar a SECURITY INVOKER o aplicar RLS equivalente)
DROP VIEW IF EXISTS public.products_catalog_for_user;
CREATE VIEW public.products_catalog_for_user 
WITH (security_invoker = true) -- Evita exponer datos de otros usuarios
AS
SELECT * FROM public.products_catalog WHERE is_active = true;
```

## 2. Políticas RLS para la App Frontend (Las "Nuevas Pantallas")

En el código hemos implementado tres interacciones directas con Supabase usando el rol anónimo autenticado:
* **`fetchHealthHistory` y `insertManualLog`** a `health_events`.
* **`fetchUserInsight`** a `user_insights`.
* **`syncTelemetryBatch`** a `user_telemetry`.

Para que nuestro cliente Supabase (usando `supabase.ts`) tenga permiso, debes asegurarte de tener (o actualizar) las siguientes políticas RLS (Asegúrate de haber ejecutado los scripts de arriba para convertir `user_id` a `TEXT` y usar las políticas actualizadas).

> **IMPORTANTE sobre Firebase Auth:** Dado que el frontend actualmente detecta el estado de sesión usando `firebase` (`auth.currentUser`), ten en cuenta que para insertar en Supabase usando el Row Level Security, necesitas **una de dos opciones**:
> 1. Migrar la lógica de login a **Supabase Auth** en el Frontend.
> 2. Configurar Firebase Auth como un [Custom JWT Provider](https://supabase.com/docs/guides/auth/auth-firebase) en Supabase para que reconozca los tokens de Firebase.

## 3. Variables de Entorno

Asegúrate de agregar estas variables en el archivo `.env` del código si no lo has hecho, o en el dashboard donde hostees la aplicación cliente:

```env
VITE_SUPABASE_URL=tu_project_url_aqui
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```
