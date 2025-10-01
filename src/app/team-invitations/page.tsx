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
  const [sentInvitations, setSentInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingInvitation, setUpdatingInvitation] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')

  const fetchInvitations = async () => {
    if (!session?.user?.id) return
    
    setLoading(true)
    
    // Obtener invitaciones recibidas
    const { data: receivedData, error: receivedError } = await supabase
      .rpc('get_user_team_invitations', { user_id: session.user.id })

    if (receivedError) {
      console.error('Error fetching received invitations:', receivedError)
      showNotification({ 
        type: 'error', 
        title: 'Error', 
        message: 'No se pudieron cargar las invitaciones recibidas' 
      })
    } else {
      setInvitations(receivedData || [])
    }

    // Obtener invitaciones enviadas
    const { data: sentData, error: sentError } = await supabase
      .from('team_invitations')
      .select(`
        id,
        team_id,
        invitee_id,
        message,
        status,
        created_at,
        expires_at,
        team:teams(name),
        invitee:profiles!team_invitations_invitee_id_fkey(gamertag, full_name)
      `)
      .eq('inviter_id', session.user.id)
      .order('created_at', { ascending: false })

    if (sentError) {
      console.error('Error fetching sent invitations:', sentError)
      showNotification({ 
        type: 'error', 
        title: 'Error', 
        message: 'No se pudieron cargar las invitaciones enviadas' 
      })
    } else {
      const formattedSentData = (sentData || []).map(inv => ({
        id: inv.id,
        team_id: inv.team_id,
        team_name: inv.team?.name || 'Equipo desconocido',
        invitee_id: inv.invitee_id,
        invitee_gamertag: inv.invitee?.gamertag || inv.invitee?.full_name || 'Usuario desconocido',
        message: inv.message,
        status: inv.status,
        created_at: inv.created_at,
        expires_at: inv.expires_at
      }))
      setSentInvitations(formattedSentData)
    }
    
    setLoading(false)
  }

  const respondToInvitation = async (invitationId: number, response: 'accepted' | 'declined') => {
    setUpdatingInvitation(invitationId)

    if (response === 'accepted') {
      const { error } = await supabase.rpc('accept_team_invitation', { invitation_id_param: invitationId })
      
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
        fetchInvitations() // Refrescar datos
      }
    } else {
      const { error } = await supabase.rpc('decline_team_invitation', { invitation_id_param: invitationId })
      
      if (error) {
        showNotification({ 
          type: 'error', 
          title: 'Error', 
          message: error.message 
        })
      } else {
        showNotification({ 
          type: 'info', 
          title: 'Invitación rechazada', 
          message: 'Has rechazado la invitación' 
        })
        fetchInvitations() // Refrescar datos
      }
    }
    
    setUpdatingInvitation(null)
  }

  useEffect(() => {
    fetchInvitations()
  }, [session?.user?.id])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'accepted':
        return 'Aceptada'
      case 'declined':
        return 'Rechazada'
      case 'expired':
        return 'Expirada'
      default:
        return 'Desconocido'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400'
      case 'accepted':
        return 'text-green-400'
      case 'declined':
        return 'text-red-400'
      case 'expired':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  if (!session) return null

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Invitaciones de Equipo</h1>
          <p className="text-gray-300 mb-6">Gestiona las invitaciones que has recibido y enviado</p>
          
          {/* Pestañas */}
          <div className="flex space-x-1 bg-white/10 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Recibidas ({invitations.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Enviadas ({sentInvitations.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
            <p className="mt-4 text-gray-400">Cargando invitaciones...</p>
          </div>
        ) : (
          <>
            {/* Pestaña de Invitaciones Recibidas */}
            {activeTab === 'received' && (
              <>
                {invitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No tienes invitaciones</h3>
                    <p className="text-gray-400">
                      Cuando recibas invitaciones de equipos, aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="card p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h3 className="text-lg font-semibold mr-3">
                                Invitación de {invitation.inviter_gamertag}
                              </h3>
                              <div className="flex items-center">
                                {getStatusIcon(invitation.status)}
                                <span className={`ml-1 text-sm font-medium ${getStatusColor(invitation.status)}`}>
                                  {getStatusText(invitation.status)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-400 mb-2">
                              <span className="font-medium">Equipo:</span> {invitation.team_name}
                            </div>
                            
                            {invitation.message && (
                              <div className="text-sm text-gray-300 mb-3">
                                <span className="font-medium">Mensaje:</span> {invitation.message}
                              </div>
                            )}
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              Recibida: {new Date(invitation.created_at).toLocaleDateString('es-CL')}
                              {invitation.status === 'pending' && (
                                <>
                                  <span className="mx-2">•</span>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Expira: {new Date(invitation.expires_at).toLocaleDateString('es-CL')}
                                </>
                              )}
                            </div>
                          </div>
                          
                          {invitation.status === 'pending' && (
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => respondToInvitation(invitation.id, 'accepted')}
                                disabled={updatingInvitation === invitation.id}
                                className="btn-primary text-sm disabled:opacity-50"
                              >
                                {updatingInvitation === invitation.id ? 'Aceptando...' : 'Aceptar'}
                              </button>
                              <button
                                onClick={() => respondToInvitation(invitation.id, 'declined')}
                                disabled={updatingInvitation === invitation.id}
                                className="btn-secondary text-sm disabled:opacity-50"
                              >
                                {updatingInvitation === invitation.id ? 'Rechazando...' : 'Rechazar'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Pestaña de Invitaciones Enviadas */}
            {activeTab === 'sent' && (
              <>
                {sentInvitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No has enviado invitaciones</h3>
                    <p className="text-gray-400">
                      Cuando envíes invitaciones a jugadores, aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentInvitations.map((invitation) => (
                      <div key={invitation.id} className="card p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h3 className="text-lg font-semibold mr-3">
                                Invitación a {invitation.invitee_gamertag}
                              </h3>
                              <div className="flex items-center">
                                {getStatusIcon(invitation.status)}
                                <span className={`ml-1 text-sm font-medium ${getStatusColor(invitation.status)}`}>
                                  {getStatusText(invitation.status)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-400 mb-2">
                              <span className="font-medium">Equipo:</span> {invitation.team_name}
                            </div>
                            
                            {invitation.message && (
                              <div className="text-sm text-gray-300 mb-3">
                                <span className="font-medium">Mensaje:</span> {invitation.message}
                              </div>
                            )}
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              Enviada: {new Date(invitation.created_at).toLocaleDateString('es-CL')}
                              {invitation.status === 'pending' && (
                                <>
                                  <span className="mx-2">•</span>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Expira: {new Date(invitation.expires_at).toLocaleDateString('es-CL')}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}