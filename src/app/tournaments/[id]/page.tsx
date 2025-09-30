'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { Calendar, Gamepad2, Users, ArrowLeft, CheckCircle, Clock, Trophy, AlertCircle, UserCheck, Bell, BellOff, Zap } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'

export default function TournamentDetailPage() {
  const params = useParams()
  const id = Number(params?.id)
  const router = useRouter()
  const supabase = useSupabaseClient()
  const session = useSession()
  const { showNotification } = useNotifications()

  const [tournament, setTournament] = useState<any>(null)
  const [myTeams, setMyTeams] = useState<any[]>([])
  const [registeredTeams, setRegisteredTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: t } = await supabase
      .from('tournaments')
      .select('*, game:games(name, max_team_size)')
      .eq('id', id)
      .single()
    if (t) setTournament(t)

    const { data: registered } = await supabase
      .from('tournament_registrations')
      .select(`
        team_id,
        team:teams(name, captain:profiles!teams_captain_id_fkey(gamertag, full_name))
      `)
      .eq('tournament_id', id)
      .order('created_at', { ascending: false })

    if (registered) setRegisteredTeams(registered as any)
    const registeredTeamIds = new Set((registered || []).map((r: any) => r.team_id))

    const { data: my } = await supabase
      .from('teams')
      .select('id, name, captain_id, members:team_members!inner(status)')
      .eq('captain_id', session?.user?.id)

    const myEligible = (my || []).map((team: any) => {
      const activeMembers = team.members?.filter((m: any) => m.status === 'active') || []
      return {
        ...team,
        isComplete: activeMembers.length >= (t?.game?.max_team_size || 1),
        alreadyRegistered: registeredTeamIds.has(team.id)
      }
    })

    setMyTeams(myEligible)

    // Verificar suscripción a notificaciones
    if (session?.user) {
      const { data: subscription } = await supabase
        .from('tournament_subscriptions')
        .select('id')
        .eq('tournament_id', id)
        .eq('user_id', session.user.id)
        .single()
      
      setIsSubscribed(!!subscription)
    }

    setLoading(false)
  }, [id, supabase, session?.user?.id])

  useEffect(() => { if (id) fetchData() }, [id, fetchData])

  const canRegister = tournament && tournament.status === 'registration_open'
  const isFull = tournament && tournament.max_teams && registeredTeams.length >= tournament.max_teams

  const getStatusInfo = (tournament: any) => {
    const now = new Date()
    const regStart = new Date(tournament.registration_start)
    const regEnd = tournament.registration_end ? new Date(tournament.registration_end) : null
    const onlineStart = tournament.online_phase_start ? new Date(tournament.online_phase_start) : null
    const presencialDate = tournament.presencial_date ? new Date(tournament.presencial_date) : null

    if (tournament.status === 'finished') {
      return { status: 'Finalizado', color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
    }
    if (presencialDate && now >= presencialDate) {
      return { status: 'Fase Presencial', color: 'text-purple-300', bgColor: 'bg-purple-500/20' }
    }
    if (onlineStart && now >= onlineStart) {
      return { status: 'Fase Online', color: 'text-blue-300', bgColor: 'bg-blue-500/20' }
    }
    if (regEnd && now > regEnd) {
      return { status: 'Registro Cerrado', color: 'text-orange-300', bgColor: 'bg-orange-500/20' }
    }
    if (regStart && now >= regStart) {
      return { status: 'Registro Abierto', color: 'text-green-300', bgColor: 'bg-green-500/20' }
    }
    return { status: 'Próximamente', color: 'text-yellow-300', bgColor: 'bg-yellow-500/20' }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeamId) return

    const team = myTeams.find((t) => t.id === selectedTeamId)
    if (!team) return

    if (team.alreadyRegistered) {
      showNotification({ type: 'info', title: 'Ya inscrito', message: 'Ese equipo ya está inscrito en este torneo.' })
      return
    }
    if (!team.isComplete) {
      showNotification({ type: 'warning', title: 'Equipo incompleto', message: 'Completa tu equipo para inscribirte.' })
      return
    }

    const { error } = await supabase
      .from('tournament_registrations')
      .insert({ tournament_id: id, team_id: selectedTeamId })

    if (error) {
      showNotification({ type: 'error', title: 'Error', message: error.message })
    } else {
      showNotification({ type: 'success', title: 'Inscripción correcta', message: 'Tu equipo quedó inscrito.' })
      router.refresh()
      fetchData()
    }
  }

  const toggleSubscription = async () => {
    if (!session?.user) return
    
    setSubscriptionLoading(true)
    try {
      if (isSubscribed) {
        // Cancelar suscripción
        const { error } = await supabase
          .from('tournament_subscriptions')
          .delete()
          .eq('tournament_id', id)
          .eq('user_id', session.user.id)
        
        if (error) throw error
        
        setIsSubscribed(false)
        showNotification({
          type: 'info',
          title: 'Suscripción cancelada',
          message: 'Ya no recibirás notificaciones de este torneo'
        })
      } else {
        // Suscribirse
        const { error } = await supabase.rpc('subscribe_to_tournament', {
          tournament_id_param: id
        })
        
        if (error) throw error
        
        setIsSubscribed(true)
        showNotification({
          type: 'success',
          title: 'Suscripción activada',
          message: 'Recibirás notificaciones sobre este torneo'
        })
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      })
    }
    setSubscriptionLoading(false)
  }

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Link href="/tournaments" className="btn-secondary">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Link>
            <Link href={`/tournaments/${id}/brackets`} className="btn-secondary">
              <Zap className="h-4 w-4 mr-1" />
              Ver Brackets
            </Link>
          </div>
        </div>

        {loading || !tournament ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl font-bold">{tournament.name}</h1>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusInfo(tournament).bgColor} ${getStatusInfo(tournament).color}`}>
                  {getStatusInfo(tournament).status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-6">{tournament.description || 'Sin descripción'}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
                <div className="space-y-3">
                  <div className="flex items-center"><Gamepad2 className="h-4 w-4 mr-2 text-red-400" /> Juego: {tournament.game?.name}</div>
                  <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-400" /> Registro: {tournament.registration_start?.slice(0,10)} - {tournament.registration_end?.slice(0,10) || '—'}</div>
                  <div className="flex items-center"><Users className="h-4 w-4 mr-2 text-green-400" /> 
                    Equipos: {registeredTeams.length} / {tournament.max_teams || '∞'}
                    {isFull && <span className="ml-2 text-red-400 text-xs">(COMPLETO)</span>}
                  </div>
                </div>
                <div className="space-y-3">
                  {tournament.online_phase_start && (
                    <div className="flex items-center"><Clock className="h-4 w-4 mr-2 text-purple-400" /> Fase Online: {tournament.online_phase_start?.slice(0,10)}</div>
                  )}
                  {tournament.presencial_date && (
                    <div className="flex items-center"><Trophy className="h-4 w-4 mr-2 text-yellow-400" /> Fase Presencial: {tournament.presencial_date?.slice(0,10)}</div>
                  )}
                  <div className="flex items-center"><UserCheck className="h-4 w-4 mr-2 text-indigo-400" /> Tamaño de equipo: {tournament.game?.max_team_size || 'N/A'} jugadores</div>
                </div>
              </div>

              {isFull && (
                <div className="mt-4 flex items-center text-orange-300 text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Este torneo ha alcanzado su capacidad máxima de equipos
                </div>
              )}

              {/* Botón de suscripción a notificaciones */}
              {session && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={toggleSubscription}
                    disabled={subscriptionLoading}
                    className={`btn-secondary text-sm inline-flex items-center ${
                      isSubscribed ? 'text-green-300 hover:bg-green-500/20' : 'text-blue-300 hover:bg-blue-500/20'
                    }`}
                  >
                    {subscriptionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    ) : isSubscribed ? (
                      <BellOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Bell className="h-4 w-4 mr-2" />
                    )}
                    {isSubscribed ? 'Cancelar notificaciones' : 'Recibir notificaciones'}
                  </button>
                </div>
              )}
            </div>

            {session && canRegister && (
              <div className="card p-6">
                <h2 className="font-semibold mb-4">Inscribir equipo</h2>
                {myTeams.length === 0 ? (
                  <p className="text-gray-400">No eres capitán de ningún equipo.</p>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Selecciona tu equipo</label>
                      <select
                        value={selectedTeamId ?? ''}
                        onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="" disabled>— Selecciona —</option>
                        {myTeams.map((team) => (
                          <option key={team.id} value={team.id} disabled={team.alreadyRegistered || !team.isComplete}>
                            {team.name} {team.alreadyRegistered ? '(ya inscrito)' : (!team.isComplete ? '(incompleto)' : '')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="btn-primary inline-flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" /> Inscribir equipo
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Equipos inscritos */}
            <div className="card p-6">
              <h2 className="font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Equipos inscritos ({registeredTeams.length})
              </h2>
              {registeredTeams.length === 0 ? (
                <p className="text-gray-400">Aún no hay equipos inscritos en este torneo.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {registeredTeams.map((registration: any) => (
                    <div key={registration.team_id} className="bg-white/5 rounded-lg p-4">
                      <h3 className="font-medium">{registration.team?.name}</h3>
                      <p className="text-sm text-gray-400">
                        Capitán: {registration.team?.captain?.gamertag || registration.team?.captain?.full_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}


