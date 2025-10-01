-- Script para corregir perfiles donde full_name y gamertag son iguales
-- Este script limpia los datos existentes que tienen el problema

-- 1. Identificar registros problemáticos
SELECT 
    id,
    email,
    full_name,
    gamertag,
    CASE 
        WHEN full_name = gamertag THEN 'DUPLICADO'
        WHEN full_name IS NULL OR full_name = '' THEN 'SIN_NOMBRE'
        ELSE 'OK'
    END as estado
FROM public.profiles
WHERE full_name = gamertag OR full_name IS NULL OR full_name = '';

-- 2. Limpiar full_name cuando es igual al gamertag
-- Esto dejará full_name como NULL para que el usuario pueda completarlo correctamente
UPDATE public.profiles 
SET 
    full_name = NULL,
    updated_at = NOW()
WHERE full_name = gamertag AND full_name IS NOT NULL;

-- 3. Verificar los cambios
SELECT 
    id,
    email,
    full_name,
    gamertag,
    CASE 
        WHEN full_name = gamertag THEN 'DUPLICADO'
        WHEN full_name IS NULL OR full_name = '' THEN 'SIN_NOMBRE'
        ELSE 'OK'
    END as estado
FROM public.profiles
ORDER BY updated_at DESC;

-- 4. Mostrar estadísticas finales
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) as con_nombre_completo,
    COUNT(CASE WHEN full_name IS NULL OR full_name = '' THEN 1 END) as sin_nombre_completo,
    COUNT(CASE WHEN gamertag IS NOT NULL AND gamertag != '' THEN 1 END) as con_gamertag
FROM public.profiles;
