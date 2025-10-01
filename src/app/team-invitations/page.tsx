'use client'

import { useEffect, useState } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { useNotifications } from '@/components/NotificationProvider'
import { Users, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react'
import Link from 'next/link'

interface TeamInvitation {
  id: number
  team_id: number
  team_name: string
  inviter_gamertag: string
  message: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  created_at: string
  expires_at: string
}

export default function TeamInvitationsPage() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const { showNotification } = useNotifications()
  
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingInvitation, setUpdatingInvitation] = useState<number | null>(null)

  const fetchInvitations = async () => {
    if (!session?.user?.id) return
    
    setLoading(true)
    const { data, error } = await supabase
      .rpc('get_user_team_invitations', { user_id: session.user.id })

    if (error) {
      console.error('Error fetching invitations:', error)
      showNotification({ 
        type: 'error', 
        title: 'Error', 
        message: 'No se pudieron cargar las invitaciones' 
      })
    } else {
      setInvitations(data || [])
    }
    setLoading(false)
  }

  const respondToInvitation = async (invitationId: number, response: 'accepted' | 'declined') => {
    setUpdatingInvitation(invitationId)

    if (response === 'accepted') {
      // Usar la función para aceptar invitación
      const { error } = await supabase
        .rpc('accept_team_invitation', { invitation_id_param: invitationId })

      if (error) {
        showNotification({ 
          type: 'error', 
          title: 'Error', 
          message: error.message 
        })
      } else {
        showNotification({ 
          type: 'success', 
          title: 'Invitación aceptada', 
          message: 'Te has unido al equipo exitosamente' 
        })
        fetchInvitations()
      }
    } else {
      // Rechazar invitación
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId)

      if (error) {
        showNotification({ 
          type: 'error', 
          title: 'Error', 
          message: error.message 
        })
      } else {
        showNotification({ 
          type: 'success', 
          title: 'Invitación rechazada', 
          message: 'Has rechazado la invitación al equipo' 
        })
        fetchInvitations()
      }
    }
    
    setUpdatingInvitation(null)
  }

  useEffect(() => {
    fetchInvitations()
  }, [session?.user?.id])

  if (!session) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-400" />
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Aceptada'
      case 'declined':
        return 'Rechazada'
      case 'expired':
        return 'Expirada'
      default:
        return 'Pendiente'
    }
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending' && !isExpired(inv.expires_at))
  const otherInvitations = invitations.filter(inv => inv.status !== 'pending' || isExpired(inv.expires_at))

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Invitaciones de Equipo</h1>
              <p className="text-gray-300">Gestiona las invitaciones que has recibido para unirte a equipos</p>
            </div>
            <Link 
              href="/team-invitations/sent" 
              className="btn-secondary text-sm"
            >
              Ver Invitaciones Enviadas
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
            <p className="mt-4 text-gray-400">Cargando invitaciones...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Invitaciones Pendientes */}
            {pendingInvitations.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-red-500" />
                  Invitaciones Pendientes ({pendingInvitations.length})
                </h2>
                
                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{invitation.team_name}</h3>
                          <p className="text-sm text-gray-400">
                            Invitado por: {invitation.inviter_gamertag}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {getStatusIcon(invitation.status)}
                          <span className="ml-1 text-sm text-gray-400">
                            {getStatusText(invitation.status)}
                          </span>
                        </div>
                      </div>
                      
                      {invitation.message && (
                        <p className="text-gray-300 mb-4">{invitation.message}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Expira: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => respondToInvitation(invitation.id, 'accepted')}
                            disabled={updatingInvitation === invitation.id}
                            className="btn-primary text-sm disabled:opacity-50"
                          >
                            {updatingInvitation === invitation.id ? 'Procesando...' : 'Aceptar'}
                          </button>
                          <button
                            onClick={() => respondToInvitation(invitation.id, 'declined')}
                            disabled={updatingInvitation === invitation.id}
                            className="btn-secondary text-sm disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Otras Invitaciones */}
            {otherInvitations.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-red-500" />
                  Historial de Invitaciones ({otherInvitations.length})
                </h2>
                
                <div className="space-y-4">
                  {otherInvitations.map((invitation) => (
                    <div key={invitation.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{invitation.team_name}</h3>
                          <p className="text-sm text-gray-400">
                            Invitado por: {invitation.inviter_gamertag}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {getStatusIcon(invitation.status)}
                          <span className="ml-1 text-sm text-gray-400">
                            {getStatusText(invitation.status)}
                          </span>
                        </div>
                      </div>
                      
                      {invitation.message && (
                        <p className="text-gray-300 mb-2">{invitation.message}</p>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Recibida: {new Date(invitation.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invitations.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-gray-400 mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No tienes invitaciones</h3>
                <p className="text-gray-400">
                  Cuando recibas invitaciones de equipos, aparecerán aquí.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
