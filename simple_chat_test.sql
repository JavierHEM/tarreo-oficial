-- Prueba simple del chat

-- 1. Ver políticas actuales
SELECT 'Políticas actuales:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'team_messages';

-- 2. Ver miembros del equipo 1
SELECT 'Miembros del equipo 1:' as info;
SELECT 
    tm.player_id,
    tm.status,
    p.gamertag
FROM public.team_members tm
LEFT JOIN public.profiles p ON tm.player_id = p.id
WHERE tm.team_id = 1;

-- 3. Probar función
SELECT 'Resultado de get_team_messages:' as info;
SELECT * FROM get_team_messages(1, 3);

-- 4. Ver mensajes directos
SELECT 'Mensajes directos de la tabla:' as info;
SELECT 
    id,
    team_id,
    sender_id,
    message,
    created_at
FROM public.team_messages 
WHERE team_id = 1 
ORDER BY created_at DESC 
LIMIT 3;
