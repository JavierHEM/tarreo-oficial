'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { Mail, Users, CheckCircle, XCircle, Clock, Crown } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'
import Link from 'next/link'

export default function TeamInvitationsPage() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const { showNotification } = useNotifications()
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInvitations = useCallback(async () => {
    if (!session?.user?.id) return
    
    setLoading(true)
    
    // Obtener invitaciones recibidas (donde el usuario es el player_id)
    const { data: receivedInvitations, error: receivedError } = await supabase
      .from('team_join_requests')
      .select(`
        *,
        team:teams!inner(
          id,
          name,
          captain:profiles!teams_captain_id_fkey(full_name, gamertag)
        )
      `)
      .eq('player_id', session.user.id)
      .eq('status', 'pending')
      .eq('is_invite', true) // Solo invitaciones del capitán
      .order('created_at', { ascending: false })

    if (receivedError) {
      console.error('Error fetching received invitations:', receivedError)
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar las invitaciones'
      })
    } else {
      setInvitations(receivedInvitations || [])
    }
    
    setLoading(false)
  }, [session?.user?.id, supabase, showNotification])

  useEffect(() => {
    if (session?.user?.id) {
      fetchInvitations()
    }
  }, [session, fetchInvitations])

  const respondToInvitation = async (invitationId: number, response: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('team_join_requests')
        .update({ 
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (error) {
        showNotification({
          type: 'error',
          title: 'Error',
          message: `Error al ${response === 'accepted' ? 'aceptar' : 'rechazar'} la invitación`
        })
        return
      }

      if (response === 'accepted') {
        // Si acepta, agregar al equipo
        const invitation = invitations.find(inv => inv.id === invitationId)
        if (invitation) {
          const { error: memberError } = await supabase
            .from('team_members')
            .insert({
              team_id: invitation.team_id,
              player_id: session?.user?.id,
              position: 'member',
              status: 'active',
              joined_at: new Date().toISOString()
            })

          if (memberError) {
            showNotification({
              type: 'error',
              title: 'Error',
              message: 'Error al unirse al equipo'
            })
            return
          }
        }
      }

      showNotification({
        type: 'success',
        title: response === 'accepted' ? 'Invitación aceptada' : 'Invitación rechazada',
        message: response === 'accepted' 
          ? 'Te has unido al equipo exitosamente' 
          : 'Has rechazado la invitación'
      })

      // Refrescar la lista
      fetchInvitations()
      
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error inesperado',
        message: error.message || 'Ocurrió un error al procesar la invitación'
      })
    }
  }

  if (!session) return null

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Mail className="h-8 w-8 mr-3 text-red-500" />
            Invitaciones de Equipo
          </h1>
          <p className="text-gray-300">Gestiona las invitaciones que has recibido para unirte a equipos</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
            <p className="text-gray-400 mt-4">Cargando invitaciones...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tienes invitaciones</h3>
            <p className="text-gray-400 mb-6">
              No has recibido invitaciones de equipos en este momento
            </p>
            <Link href="/find-players" className="btn-primary">
              <Users className="h-4 w-4 mr-2" />
              Buscar Equipos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold">{invitation.team?.name}</h3>
                      <div className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                        Invitación
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center">
                        <Crown className="h-4 w-4 mr-2 text-yellow-400" />
                        <span>Capitán: {invitation.team?.captain?.gamertag || invitation.team?.captain?.full_name}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          Recibida: {new Date(invitation.created_at).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => respondToInvitation(invitation.id, 'accepted')}
                      className="btn-primary bg-green-600 hover:bg-green-700 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aceptar
                    </button>
                    <button
                      onClick={() => respondToInvitation(invitation.id, 'rejected')}
                      className="btn-secondary text-red-300 hover:bg-red-500/20 text-sm"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}