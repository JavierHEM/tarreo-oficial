-- Script para configurar el chat del equipo 1

-- 1. Verificar el equipo 1
SELECT 'Equipo 1:' as info;
SELECT id, name, captain_id FROM public.teams WHERE id = 1;

-- 2. Verificar el capitán del equipo 1
SELECT 'Capitán del equipo 1:' as info;
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.captain_id,
    p.gamertag as captain_gamertag
FROM public.teams t
LEFT JOIN public.profiles p ON t.captain_id = p.id
WHERE t.id = 1;

-- 3. Agregar el capitán como miembro activo del equipo (si no está)
INSERT INTO public.team_members (team_id, player_id, status, position)
SELECT 1, captain_id, 'active', 'captain'
FROM public.teams 
WHERE id = 1 
AND NOT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = 1 AND player_id = (SELECT captain_id FROM public.teams WHERE id = 1)
);

-- 4. Verificar miembros después de la inserción
SELECT 'Miembros del equipo 1 después de agregar capitán:' as info;
SELECT 
    tm.team_id,
    tm.player_id,
    tm.status,
    tm.position,
    p.gamertag
FROM public.team_members tm
LEFT JOIN public.profiles p ON tm.player_id = p.id
WHERE tm.team_id = 1;

-- 5. Crear un mensaje de prueba del capitán
INSERT INTO public.team_messages (team_id, sender_id, message, message_type)
SELECT 1, captain_id, '¡Hola equipo! Este es el primer mensaje del chat.', 'user_message'
FROM public.teams 
WHERE id = 1;

-- 6. Verificar mensajes después de la inserción
SELECT 'Mensajes del equipo 1:' as info;
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
ORDER BY tm.created_at DESC;

-- 7. Probar la función get_team_messages
SELECT 'Resultado de get_team_messages después de configurar:' as info;
SELECT * FROM get_team_messages(1, 5);
