'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { Bell, X, Calendar, Users, Trophy, Clock } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: number
  tournament_id: number
  tournament_name: string
  notification_type: string
  created_at: string
}

export default function TournamentNotifications() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return
    
    setLoading(true)
    const { data } = await supabase.rpc('get_user_tournament_notifications')
    if (data) setNotifications(data as Notification[])
    setLoading(false)
  }, [supabase, session?.user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (notificationId: number) => {
    await supabase.rpc('mark_notification_read', { notification_id_param: notificationId })
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const markAllAsRead = async () => {
    for (const notification of notifications) {
      await supabase.rpc('mark_notification_read', { notification_id_param: notification.id })
    }
    setNotifications([])
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'registration_open':
        return <Calendar className="h-4 w-4 text-green-400" />
      case 'tournament_starting':
        return <Trophy className="h-4 w-4 text-yellow-400" />
      case 'registration_closing':
        return <Clock className="h-4 w-4 text-orange-400" />
      default:
        return <Bell className="h-4 w-4 text-blue-400" />
    }
  }

  const getNotificationMessage = (type: string, tournamentName: string) => {
    switch (type) {
      case 'registration_open':
        return `¡Las inscripciones para ${tournamentName} están abiertas!`
      case 'tournament_starting':
        return `El torneo ${tournamentName} está por comenzar`
      case 'registration_closing':
        return `Las inscripciones para ${tournamentName} están por cerrar`
      default:
        return `Nueva notificación sobre ${tournamentName}`
    }
  }

  if (!session?.user || notifications.length === 0) {
    return null
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center">
          <Bell className="h-5 w-5 mr-2 text-red-400" />
          Notificaciones de Torneos
          {notifications.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-200 text-xs rounded">
              {notifications.length}
            </span>
          )}
        </h2>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-400 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white/5 rounded-lg p-4 flex items-start justify-between"
            >
              <div className="flex items-start space-x-3 flex-1">
                {getNotificationIcon(notification.notification_type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {getNotificationMessage(notification.notification_type, notification.tournament_name)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <Link
                  href={`/tournaments/${notification.tournament_id}`}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  Ver torneo
                </Link>
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
