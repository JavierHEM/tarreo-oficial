'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { useNotifications } from '@/components/NotificationProvider'
import { MessageCircle, CheckCircle, XCircle, Clock, User, Users, Plus } from 'lucide-react'

interface ContactMessage {
  id: number
  sender_id: string
  receiver_id: string
  message: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  sender_gamertag: string
  receiver_gamertag: string
}

interface Team {
  id: number
  name: string
  captain_id: string
}

export default function MessagesPage() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const { showNotification } = useNotifications()
  
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingMessage, setUpdatingMessage] = useState<number | null>(null)
  const [userTeams, setUserTeams] = useState<Team[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [creatingInvite, setCreatingInvite] = useState(false)

  const fetchMessages = useCallback(async () => {
    if (!session?.user?.id) return
    
    setLoading(true)
    const { data, error } = await supabase
      .rpc('get_user_contacts', { user_id: session.user.id })

    if (error) {
      console.error('Error fetching messages:', error)
      showNotification({ 
        type: 'error', 
        title: 'Error', 
        message: 'No se pudieron cargar los mensajes' 
      })
    } else {
      setMessages(data || [])
    }
    setLoading(false)
  }, [session?.user?.id, supabase, showNotification])

  const fetchUserTeams = useCallback(async () => {
    if (!session?.user?.id) return
    
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, captain_id')
      .eq('captain_id', session.user.id)

    if (error) {
      console.error('Error fetching teams:', error)
    } else {
      setUserTeams(data || [])
    }
  }, [session?.user?.id, supabase])

  const updateMessageStatus = async (messageId: number, status: 'accepted' | 'declined') => {
    setUpdatingMessage(messageId)
    
    const { error } = await supabase
      .from('player_contacts')
      .update({ status })
      .eq('id', messageId)

    if (error) {
      showNotification({ 
        type: 'error', 
        title: 'Error', 
        message: error.message 
      })
    } else {
      showNotification({ 
        type: 'success', 
        title: 'Mensaje actualizado', 
        message: `Mensaje ${status === 'accepted' ? 'aceptado' : 'rechazado'}` 
      })
      fetchMessages()
    }
    
    setUpdatingMessage(null)
  }

  const handleInviteToTeam = (message: ContactMessage) => {
    setSelectedMessage(message)
    setShowInviteModal(true)
  }

  const createTeamInvitation = async () => {
    if (!selectedMessage || !selectedTeam) return

    setCreatingInvite(true)

    const { data, error } = await supabase
      .rpc('create_team_invitation_from_contact', {
        contact_message_id: selectedMessage.id,
        team_id_param: selectedTeam,
        inviter_id_param: session?.user?.id
      })

    if (error) {
      showNotification({ 
        type: 'error', 
        title: 'Error', 
        message: error.message 
      })
    } else {
      showNotification({ 
        type: 'success', 
        title: 'Invitación enviada', 
        message: 'Se ha enviado una invitación formal al equipo' 
      })
      setShowInviteModal(false)
      setSelectedMessage(null)
      setSelectedTeam(null)
      fetchMessages()
    }

    setCreatingInvite(false)
  }

  useEffect(() => {
    fetchMessages()
    fetchUserTeams()
  }, [session?.user?.id, fetchMessages, fetchUserTeams])

  if (!session) return null

  const receivedMessages = messages.filter(msg => msg.receiver_id === session.user?.id)
  const sentMessages = messages.filter(msg => msg.sender_id === session.user?.id)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Aceptado'
      case 'declined':
        return 'Rechazado'
      default:
        return 'Pendiente'
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Mensajes</h1>
          <p className="text-gray-300">Gestiona tus contactos con otros jugadores</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
            <p className="mt-4 text-gray-400">Cargando mensajes...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Mensajes Recibidos */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-red-500" />
                Mensajes Recibidos ({receivedMessages.length})
              </h2>
              
              {receivedMessages.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No tienes mensajes recibidos</p>
              ) : (
                <div className="space-y-4">
                  {receivedMessages.map((message) => (
                    <div key={message.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-semibold">{message.sender_gamertag}</span>
                        </div>
                        <div className="flex items-center">
                          {getStatusIcon(message.status)}
                          <span className="ml-1 text-sm text-gray-400">
                            {getStatusText(message.status)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-4">{message.message}</p>
                      
                      {message.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateMessageStatus(message.id, 'accepted')}
                            disabled={updatingMessage === message.id}
                            className="btn-primary text-sm disabled:opacity-50"
                          >
                            {updatingMessage === message.id ? 'Procesando...' : 'Aceptar'}
                          </button>
                          <button
                            onClick={() => updateMessageStatus(message.id, 'declined')}
                            disabled={updatingMessage === message.id}
                            className="btn-secondary text-sm disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                      
                      {message.status === 'accepted' && userTeams.length > 0 && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleInviteToTeam(message)}
                            className="btn-primary text-sm"
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Invitar a mi equipo
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mensajes Enviados */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-red-500" />
                Mensajes Enviados ({sentMessages.length})
              </h2>
              
              {sentMessages.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No has enviado mensajes</p>
              ) : (
                <div className="space-y-4">
                  {sentMessages.map((message) => (
                    <div key={message.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-semibold">Para: {message.receiver_gamertag}</span>
                        </div>
                        <div className="flex items-center">
                          {getStatusIcon(message.status)}
                          <span className="ml-1 text-sm text-gray-400">
                            {getStatusText(message.status)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-300">{message.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para invitar a equipo */}
      {showInviteModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              Invitar a {selectedMessage.sender_gamertag} a tu equipo
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Selecciona el equipo
              </label>
              <select
                value={selectedTeam || ''}
                onChange={(e) => setSelectedTeam(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Selecciona un equipo</option>
                {userTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-300">
                Mensaje original: &quot;{selectedMessage.message}&quot;
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setSelectedMessage(null)
                  setSelectedTeam(null)
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={createTeamInvitation}
                disabled={!selectedTeam || creatingInvite}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {creatingInvite ? 'Enviando...' : 'Enviar invitación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
