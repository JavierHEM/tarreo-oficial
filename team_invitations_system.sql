-- Sistema de invitaciones de equipo
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de invitaciones de equipo
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES public.teams(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS team_invitations_team_idx ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS team_invitations_inviter_idx ON public.team_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS team_invitations_invitee_idx ON public.team_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS team_invitations_status_idx ON public.team_invitations(status);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_team_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_team_invitations_updated_at();

-- 4. Políticas RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Política para crear invitaciones
CREATE POLICY "Team captains can send invitations" ON public.team_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Solo el capitán del equipo puede invitar
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_id 
    AND captain_id = auth.uid()
  ) AND
  -- No puede invitarse a sí mismo
  auth.uid() != invitee_id AND
  -- No puede invitar a alguien que ya está en el equipo
  NOT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_invitations.team_id 
    AND player_id = invitee_id 
    AND status = 'active'
  )
);

-- Política para ver invitaciones recibidas
CREATE POLICY "Users can view received invitations" ON public.team_invitations
FOR SELECT
TO authenticated
USING (auth.uid() = invitee_id);

-- Política para ver invitaciones enviadas
CREATE POLICY "Users can view sent invitations" ON public.team_invitations
FOR SELECT
TO authenticated
USING (auth.uid() = inviter_id);

-- Política para actualizar invitaciones recibidas
CREATE POLICY "Users can respond to invitations" ON public.team_invitations
FOR UPDATE
TO authenticated
USING (auth.uid() = invitee_id)
WITH CHECK (auth.uid() = invitee_id);

-- 5. Función para crear invitación desde mensaje de contacto
CREATE OR REPLACE FUNCTION create_team_invitation_from_contact(
  contact_message_id INTEGER,
  team_id_param INTEGER,
  inviter_id_param UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_id INTEGER;
  contact_record RECORD;
BEGIN
  -- Obtener el mensaje de contacto
  SELECT sender_id, receiver_id, message
  INTO contact_record
  FROM public.player_contacts
  WHERE id = contact_message_id;
  
  -- Verificar que el usuario actual es el receptor del mensaje
  IF contact_record.receiver_id != auth.uid() THEN
    RAISE EXCEPTION 'No tienes permisos para crear esta invitación';
  END IF;
  
  -- Crear la invitación
  INSERT INTO public.team_invitations (
    team_id,
    inviter_id,
    invitee_id,
    message
  ) VALUES (
    team_id_param,
    inviter_id_param,
    contact_record.sender_id,
    COALESCE(contact_record.message, 'Invitación de equipo')
  )
  RETURNING id INTO invitation_id;
  
  -- Marcar el mensaje de contacto como aceptado
  UPDATE public.player_contacts
  SET status = 'accepted'
  WHERE id = contact_message_id;
  
  RETURN invitation_id;
END;
$$;

-- 6. Función para aceptar invitación de equipo
CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_id_param INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Obtener la invitación
  SELECT team_id, invitee_id, status
  INTO invitation_record
  FROM public.team_invitations
  WHERE id = invitation_id_param;
  
  -- Verificar que el usuario actual es el invitado
  IF invitation_record.invitee_id != auth.uid() THEN
    RAISE EXCEPTION 'No tienes permisos para aceptar esta invitación';
  END IF;
  
  -- Verificar que la invitación está pendiente
  IF invitation_record.status != 'pending' THEN
    RAISE EXCEPTION 'Esta invitación ya no está disponible';
  END IF;
  
  -- Verificar que no está ya en el equipo
  IF EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = invitation_record.team_id 
    AND player_id = invitation_record.invitee_id 
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Ya eres miembro de este equipo';
  END IF;
  
  -- Agregar al equipo
  INSERT INTO public.team_members (
    team_id,
    player_id,
    status,
    joined_at
  ) VALUES (
    invitation_record.team_id,
    invitation_record.invitee_id,
    'active',
    NOW()
  );
  
  -- Marcar invitación como aceptada
  UPDATE public.team_invitations
  SET status = 'accepted', updated_at = NOW()
  WHERE id = invitation_id_param;
  
  RETURN TRUE;
END;
$$;

-- 7. Función para obtener invitaciones de un usuario
CREATE OR REPLACE FUNCTION get_user_team_invitations(user_id UUID)
RETURNS TABLE (
  id INTEGER,
  team_id INTEGER,
  team_name TEXT,
  inviter_gamertag TEXT,
  message TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ti.id,
    ti.team_id,
    t.name as team_name,
    inviter.gamertag as inviter_gamertag,
    ti.message,
    ti.status,
    ti.created_at,
    ti.expires_at
  FROM public.team_invitations ti
  LEFT JOIN public.teams t ON ti.team_id = t.id
  LEFT JOIN public.profiles inviter ON ti.inviter_id = inviter.id
  WHERE ti.invitee_id = user_id
  ORDER BY ti.created_at DESC;
$$;

-- 8. Verificar que se creó correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position;
