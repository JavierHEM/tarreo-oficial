-- Script para corregir la tabla team_invitations
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estructura actual de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'team_invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Agregar columna inviter_id si no existe
ALTER TABLE public.team_invitations 
ADD COLUMN IF NOT EXISTS inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Agregar columna expires_at si no existe
ALTER TABLE public.team_invitations 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');

-- 4. Crear índices si no existen
CREATE INDEX IF NOT EXISTS team_invitations_inviter_idx ON public.team_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS team_invitations_invitee_idx ON public.team_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS team_invitations_status_idx ON public.team_invitations(status);

-- 5. Verificar estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'team_invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position;
