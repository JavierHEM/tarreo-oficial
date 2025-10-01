-- Script completo para corregir permisos de administrador
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar políticas actuales
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 2. Eliminar políticas conflictivas si existen
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.profiles;

-- 3. Crear políticas específicas y claras

-- Política para que usuarios puedan actualizar su propio perfil (excepto rol)
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND
    -- No permitir que usuarios cambien su propio rol
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Política para que admins puedan cambiar roles de otros usuarios
CREATE POLICY "Admins can update user roles" ON public.profiles
FOR UPDATE
TO authenticated
USING (
    -- Solo admins pueden hacer esto
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
)
WITH CHECK (
    -- Solo admins pueden hacer esto
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 4. Verificar que las políticas se crearon correctamente
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 5. Verificar permisos de la tabla
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 6. Crear función helper para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id 
        AND role = 'admin'
    );
$$;

-- 7. Crear función para cambiar rol de usuario (solo admins)
CREATE OR REPLACE FUNCTION change_user_role(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar que el usuario actual es admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Solo administradores pueden cambiar roles de usuario';
    END IF;
    
    -- Verificar que el rol es válido
    IF new_role NOT IN ('admin', 'gamer') THEN
        RAISE EXCEPTION 'Rol inválido: %', new_role;
    END IF;
    
    -- Actualizar el rol
    UPDATE public.profiles 
    SET role = new_role, updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$;

-- 8. Probar la función (opcional - comentar si no quieres ejecutar)
-- SELECT change_user_role('user-id-aqui', 'admin');
