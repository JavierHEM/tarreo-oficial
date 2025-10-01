-- Script para probar el chat de equipos y diagnosticar problemas

-- 1. Verificar políticas RLS de team_messages
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

-- 2. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'team_messages';

-- 3. Probar la función get_team_messages
SELECT * FROM get_team_messages(1, 10);

-- 4. Verificar miembros del equipo 1
SELECT 
    tm.team_id,
    tm.player_id,
    tm.status,
    p.gamertag,
    p.full_name
FROM public.team_members tm
LEFT JOIN public.profiles p ON tm.player_id = p.id
WHERE tm.team_id = 1;

-- 5. Verificar mensajes existentes en el equipo 1
SELECT 
    tm.id,
    tm.team_id,
    tm.sender_id,
    tm.message,
    tm.message_type,
    tm.created_at,
    p.gamertag as sender_gamertag
FROM public.team_messages tm
LEFT JOIN public.profiles p ON tm.sender_id = p.id
WHERE tm.team_id = 1
ORDER BY tm.created_at DESC
LIMIT 10;

-- 6. Probar inserción de mensaje (simulación)
-- NOTA: Esta consulta fallará si no eres miembro del equipo, pero nos dirá el error exacto
-- INSERT INTO public.team_messages (team_id, sender_id, message, message_type)
-- VALUES (1, 'tu-user-id-aqui', 'Mensaje de prueba', 'user_message');

-- 7. Verificar si hay algún trigger o función que pueda estar interfiriendo
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'team_messages';

-- 8. Verificar permisos de la tabla
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'team_messages' 
AND table_schema = 'public';
