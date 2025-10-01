-- Script para verificar y corregir SOLO las políticas RLS de team_messages

-- 1. Verificar si la tabla team_messages existe y tiene RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'team_messages';

-- 2. Verificar políticas existentes
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'team_messages';

-- 3. Habilitar RLS si no está habilitado
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Team members can view messages" ON public.team_messages;
DROP POLICY IF EXISTS "Team members can send messages" ON public.team_messages;
DROP POLICY IF EXISTS "Users can view team messages" ON public.team_messages;
DROP POLICY IF EXISTS "Users can insert team messages" ON public.team_messages;

-- 5. Crear políticas correctas

-- Política para SELECT: Los miembros del equipo pueden ver mensajes
CREATE POLICY "Team members can view messages" ON public.team_messages
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_id = team_messages.team_id 
        AND player_id = auth.uid() 
        AND status = 'active'
    )
);

-- Política para INSERT: Los miembros del equipo pueden enviar mensajes
CREATE POLICY "Team members can send messages" ON public.team_messages
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

-- 6. Verificar las políticas creadas
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

-- 7. Probar la función get_team_messages
SELECT * FROM get_team_messages(1, 5);

-- 8. Verificar estructura de la tabla team_messages
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;
