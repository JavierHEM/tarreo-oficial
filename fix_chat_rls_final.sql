-- Script final para corregir las políticas RLS del chat

-- 1. Habilitar RLS en team_messages
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Team members can view messages" ON public.team_messages;
DROP POLICY IF EXISTS "Team members can send messages" ON public.team_messages;
DROP POLICY IF EXISTS "Users can view team messages" ON public.team_messages;
DROP POLICY IF EXISTS "Users can insert team messages" ON public.team_messages;
DROP POLICY IF EXISTS "Enable read access for team members" ON public.team_messages;
DROP POLICY IF EXISTS "Enable insert for team members" ON public.team_messages;

-- 3. Crear políticas correctas y simples

-- Política para SELECT: Los miembros activos del equipo pueden ver mensajes
CREATE POLICY "Enable read access for team members" ON public.team_messages
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_id = team_messages.team_id 
        AND player_id = auth.uid() 
        AND status = 'active'
    )
);

-- Política para INSERT: Los miembros activos del equipo pueden enviar mensajes
CREATE POLICY "Enable insert for team members" ON public.team_messages
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_id = team_messages.team_id 
        AND player_id = auth.uid() 
        AND status = 'active'
    )
);

-- 4. Verificar las políticas creadas
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'team_messages'
ORDER BY cmd, policyname;

-- 5. Probar la función get_team_messages
SELECT 'Probando función get_team_messages:' as test;
SELECT * FROM get_team_messages(1, 5);

-- 6. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'team_messages';
