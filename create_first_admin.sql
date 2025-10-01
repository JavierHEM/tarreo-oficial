-- Script para crear el primer usuario administrador
-- Ejecutar en Supabase SQL Editor

-- IMPORTANTE: Reemplaza 'tu-user-id-aqui' con el UUID real del usuario que quieres hacer admin
-- Puedes obtener el UUID desde la tabla auth.users o desde el perfil del usuario

-- Opción 1: Hacer admin a un usuario existente por email
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'tu-email@inacapmail.cl';

-- Opción 2: Hacer admin a un usuario por ID (más seguro)
-- UPDATE public.profiles 
-- SET role = 'admin', updated_at = NOW()
-- WHERE id = 'tu-user-id-aqui';

-- Verificar que se actualizó correctamente
SELECT id, email, role, updated_at 
FROM public.profiles 
WHERE role = 'admin';

-- Si necesitas obtener el ID de un usuario por email:
-- SELECT id, email FROM public.profiles WHERE email = 'tu-email@inacapmail.cl';
