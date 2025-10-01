-- Script para configurar políticas RLS para gestión completa de miembros de equipo

-- 1. Verificar políticas actuales de team_members
SELECT 'Políticas actuales de team_members:' as info;
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

-- 2. Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Captains can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Captains can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can manage team membership" ON public.team_members;
DROP POLICY IF EXISTS "Enable read access for team members" ON public.team_members;
DROP POLICY IF EXISTS "Enable insert for captains" ON public.team_members;
DROP POLICY IF EXISTS "Enable update for captains" ON public.team_members;
DROP POLICY IF EXISTS "Enable delete for team management" ON public.team_members;

-- 3. Crear políticas completas para gestión de miembros

-- Política para SELECT: Todos pueden ver miembros de equipos
CREATE POLICY "Enable read access for team members" ON public.team_members
FOR SELECT TO authenticated
USING (true);

-- Política para INSERT: Los capitanes pueden agregar miembros
CREATE POLICY "Enable insert for captains" ON public.team_members
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = (SELECT captain_id FROM public.teams WHERE id = team_id)
);

-- Política para UPDATE: Los capitanes pueden actualizar posiciones y estados
CREATE POLICY "Enable update for captains" ON public.team_members
FOR UPDATE TO authenticated
USING (auth.uid() = (SELECT captain_id FROM public.teams WHERE id = team_id))
WITH CHECK (auth.uid() = (SELECT captain_id FROM public.teams WHERE id = team_id));

-- Política para DELETE: Los capitanes pueden expulsar miembros, los miembros pueden abandonar
CREATE POLICY "Enable delete for team management" ON public.team_members
FOR DELETE TO authenticated
USING (
    -- El capitán puede expulsar a cualquier miembro
    auth.uid() = (SELECT captain_id FROM public.teams WHERE id = team_id)
    OR 
    -- Los miembros pueden abandonar el equipo (excepto el capitán)
    (auth.uid() = player_id AND position != 'captain')
);

-- 4. Verificar políticas de teams para transferencia de capitanía
SELECT 'Políticas actuales de teams:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY cmd, policyname;

-- 5. Crear política para UPDATE de teams (transferencia de capitanía)
DROP POLICY IF EXISTS "Captains can update team" ON public.teams;
DROP POLICY IF EXISTS "Enable update for captains" ON public.teams;

CREATE POLICY "Enable update for captains" ON public.teams
FOR UPDATE TO authenticated
USING (auth.uid() = captain_id)
WITH CHECK (auth.uid() = captain_id);

-- 6. Verificar políticas de team_join_requests
SELECT 'Políticas actuales de team_join_requests:' as info;
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

-- 7. Verificar las políticas creadas
SELECT 'Políticas finales de team_members:' as info;
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

SELECT 'Políticas finales de teams:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY cmd, policyname;
