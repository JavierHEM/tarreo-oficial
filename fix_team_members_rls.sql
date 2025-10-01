-- Script para verificar y corregir las políticas RLS de team_members

-- 1. Verificar si la tabla existe y tiene RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'team_members';

-- 2. Verificar políticas existentes
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'team_members';

-- 3. Habilitar RLS si no está habilitado
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can delete team members" ON public.team_members;

-- 5. Crear políticas correctas

-- Política para SELECT: Los usuarios pueden ver miembros de equipos
CREATE POLICY "Users can view team members" ON public.team_members
FOR SELECT TO authenticated
USING (true); -- Permitir ver todos los miembros de equipos

-- Política para INSERT: Los capitanes pueden agregar miembros a su equipo
CREATE POLICY "Captains can add team members" ON public.team_members
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = (SELECT captain_id FROM public.teams WHERE id = team_id)
);

-- Política para UPDATE: Los capitanes pueden actualizar el estado de miembros
CREATE POLICY "Captains can update team members" ON public.team_members
FOR UPDATE TO authenticated
USING (auth.uid() = (SELECT captain_id FROM public.teams WHERE id = team_id))
WITH CHECK (auth.uid() = (SELECT captain_id FROM public.teams WHERE id = team_id));

-- Política para DELETE: Los capitanes pueden remover miembros, o los miembros pueden abandonar
CREATE POLICY "Users can manage team membership" ON public.team_members
FOR DELETE TO authenticated
USING (
    auth.uid() = (SELECT captain_id FROM public.teams WHERE id = team_id)
    OR auth.uid() = player_id
);

-- 6. Verificar las políticas creadas
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'team_members'
ORDER BY cmd, policyname;

-- 7. Probar una inserción de miembro (simulación)
-- Esta consulta debería funcionar para el capitán del equipo
SELECT 
    t.id as team_id,
    t.captain_id,
    t.name as team_name,
    p.id as player_id,
    p.gamertag
FROM public.teams t
CROSS JOIN public.profiles p
WHERE t.id = 1 
  AND p.id = '6362d739-d729-4298-a3b0-e5c485ca3664'
LIMIT 1;
