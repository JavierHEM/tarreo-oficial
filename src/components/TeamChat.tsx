'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { Send, MessageCircle, Users, Crown } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'

interface Message {
  id: number
  sender_id: string
  sender_gamertag: string
  sender_name: string
  message: string
  message_type: string
  created_at: string
  is_own_message: boolean
}

interface TeamChatProps {
  teamId: number
  teamName: string
  isCaptain: boolean
}

export default function TeamChat({ teamId, teamName, isCaptain }: TeamChatProps) {
  const supabase = useSupabaseClient()
  const session = useSession()
  const { showNotification } = useNotifications()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!session?.user) return
    
    setLoading(true)
    const { data } = await supabase.rpc('get_team_messages', {
      team_id_param: teamId,
      limit_param: 50
    })
    
    if (data) {
      setMessages((data as Message[]).reverse()) // Mostrar más antiguos primero
    }
    setLoading(false)
  }, [teamId, supabase, session?.user])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Configurar Realtime para actualizaciones automáticas
  useEffect(() => {
    if (!session?.user) return

    const channel = supabase
      .channel(`team_messages_${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamId}`
        },
        async (payload) => {
          console.log('Nuevo mensaje recibido:', payload)
          
          // Obtener información del sender para el nuevo mensaje
          const { data: senderData } = await supabase
            .from('profiles')
            .select('gamertag, full_name')
            .eq('id', payload.new.sender_id)
            .single()
          
          if (senderData) {
            const newMessage: Message = {
              id: payload.new.id,
              sender_id: payload.new.sender_id,
              sender_gamertag: senderData.gamertag || '',
              sender_name: senderData.full_name || '',
              message: payload.new.message,
              message_type: payload.new.message_type || 'text',
              created_at: payload.new.created_at,
              is_own_message: payload.new.sender_id === session?.user?.id
            }
            
            setMessages(prev => {
              // Evitar duplicados
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [teamId, session?.user, supabase])

  // Scroll automático al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session?.user) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('team_messages')
        .insert({
          team_id: teamId,
          sender_id: session.user.id,
          message: newMessage.trim(),
          message_type: 'text'
        })

      if (error) throw error

      setNewMessage('')
      // No necesitamos fetchMessages() aquí porque Realtime lo hará automáticamente
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error al enviar mensaje',
        message: error.message
      })
    }
    setSending(false)
  }

  const sendSystemMessage = async (message: string) => {
    if (!isCaptain) return

    try {
      const { error } = await supabase.rpc('send_system_message', {
        team_id_param: teamId,
        message_param: message,
        message_type_param: 'system'
      })

      if (error) throw error

      fetchMessages() // Refrescar mensajes
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error al enviar mensaje de sistema',
        message: error.message
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-blue-500/20 text-blue-200 border-blue-500/30'
      case 'announcement': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30'
      default: return 'bg-white/5 text-white border-white/10'
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          Chat del Equipo
        </h2>
        <div className="flex items-center text-sm text-gray-400">
          <Users className="h-4 w-4 mr-1" />
          {teamName}
        </div>
      </div>

      {/* Mensajes */}
      <div className="h-96 overflow-y-auto border border-white/10 rounded-lg p-4 mb-4 bg-black/20">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-400 mx-auto"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay mensajes aún</p>
            <p className="text-sm">¡Sé el primero en escribir!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_own_message ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    message.is_own_message
                      ? 'bg-red-500/20 text-red-200'
                      : getMessageTypeColor(message.message_type)
                  }`}
                >
                  {!message.is_own_message && (
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-medium">
                        {message.sender_gamertag || message.sender_name}
                      </span>
                      {message.message_type === 'system' && (
                        <Crown className="h-3 w-3 ml-1 text-blue-300" />
                      )}
                    </div>
                  )}
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input de mensaje */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="btn-primary inline-flex items-center"
        >
          {sending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      {/* Acciones rápidas para capitanes */}
      {isCaptain && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-gray-400 mb-2">Acciones rápidas:</p>
          <div className="flex gap-2">
            <button
              onClick={() => sendSystemMessage('¡Buen trabajo en el último match!')}
              className="btn-secondary text-xs"
            >
              Felicitar equipo
            </button>
            <button
              onClick={() => sendSystemMessage('Recordatorio: Próximo match mañana')}
              className="btn-secondary text-xs"
            >
              Recordatorio
            </button>
            <button
              onClick={() => sendSystemMessage('Reunión de estrategia en 30 min')}
              className="btn-secondary text-xs"
            >
              Reunión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
