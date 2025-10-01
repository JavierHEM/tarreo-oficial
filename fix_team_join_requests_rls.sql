-- Script para verificar y corregir las políticas RLS de team_join_requests

-- 1. Verificar si la tabla existe y tiene RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'team_join_requests';

-- 2. Verificar políticas existentes
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'team_join_requests';

-- 3. Habilitar RLS si no está habilitado
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view team join requests" ON public.team_join_requests;
DROP POLICY IF EXISTS "Users can insert team join requests" ON public.team_join_requests;
DROP POLICY IF EXISTS "Captains can update team join requests" ON public.team_join_requests;

-- 5. Crear políticas correctas

-- Política para INSERT: Los usuarios pueden enviar solicitudes a equipos
CREATE POLICY "Users can insert team join requests" ON public.team_join_requests
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = player_id 
    AND player_id != (SELECT captain_id FROM public.teams WHERE id = team_id)
);

-- Política para SELECT: Los capitanes pueden ver solicitudes de su equipo, los jugadores pueden ver sus propias solicitudes
CREATE POLICY "Users can view team join requests" ON public.team_join_requests
FOR SELECT TO authenticated
USING (
    auth.uid() = player_id 
    OR auth.uid() = (SELECT captain_id FROM public.teams WHERE id = team_id)
);

-- Política para UPDATE: Solo los capitanes pueden actualizar el estado de las solicitudes
CREATE POLICY "Captains can update team join requests" ON public.team_join_requests
FOR UPDATE TO authenticated
USING (auth.uid() = (SELECT captain_id FROM public.teams WHERE id = team_id))
WITH CHECK (auth.uid() = (SELECT captain_id FROM public.teams WHERE id = team_id));

-- 6. Verificar las políticas creadas
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'team_join_requests'
ORDER BY cmd, policyname;

-- 7. Probar la consulta que usa el frontend
-- Esta consulta debería funcionar para el capitán del equipo
SELECT 
    tjr.*,
    p.full_name,
    p.gamertag,
    p.id as player_profile_id
FROM public.team_join_requests tjr
LEFT JOIN public.profiles p ON tjr.player_id = p.id
WHERE tjr.team_id = 1 
  AND tjr.status = 'pending'
ORDER BY tjr.created_at DESC;
