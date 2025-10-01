-- Script para verificar y corregir las políticas RLS del chat de equipos

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

-- 7. Verificar que la función get_team_messages existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'get_team_messages' 
AND routine_schema = 'public';

-- 8. Eliminar función existente si existe y crear nueva
DROP FUNCTION IF EXISTS get_team_messages(INTEGER, INTEGER);

-- Crear la función con el tipo de retorno correcto
CREATE OR REPLACE FUNCTION get_team_messages(team_id_param INTEGER, limit_param INTEGER DEFAULT 50)
RETURNS TABLE (
    id INTEGER,
    sender_id UUID,
    sender_gamertag TEXT,
    sender_name TEXT,
    message TEXT,
    message_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_own_message BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        tm.id,
        tm.sender_id,
        p.gamertag as sender_gamertag,
        COALESCE(p.full_name, p.gamertag) as sender_name,
        tm.message,
        tm.message_type,
        tm.created_at,
        (tm.sender_id = auth.uid()) as is_own_message
    FROM public.team_messages tm
    LEFT JOIN public.profiles p ON tm.sender_id = p.id
    WHERE tm.team_id = team_id_param
    ORDER BY tm.created_at DESC
    LIMIT limit_param;
$$;

-- 9. Probar la función
SELECT * FROM get_team_messages(1, 10);
