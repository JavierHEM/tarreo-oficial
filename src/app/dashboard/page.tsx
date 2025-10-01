// src/app/dashboard/page.tsx
'use client'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState, useCallback } from 'react'
import { Profile, Team, Tournament } from '@/types/supabase'
import Navbar from '@/components/Navbar'
import { Trophy, Users, Calendar, Target, Plus, Crown } from 'lucide-react'
import Link from 'next/link'
import TournamentNotifications from '@/components/TournamentNotifications'

export default function Dashboard() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([])
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalTournaments: 0,
    myRegistrations: 0
  })
  const [nextImportantDate, setNextImportantDate] = useState<string | null>(null)
  const [pendingCaptainRequests, setPendingCaptainRequests] = useState<number>(0)

  const fetchDashboardData = useCallback(async () => {
    // Fetch user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session?.user?.id)
      .single()
    
    if (profileData) setProfile(profileData)

    // Fetch user's teams
    const { data: teamsData } = await supabase
      .from('team_members')
      .select(`
        teams (
          id, name, captain_id, description, created_at,
          captain:profiles!teams_captain_id_fkey (full_name, gamertag)
        )
      `)
      .eq('player_id', session?.user?.id)
      .eq('status', 'active')

    if (teamsData) {
      setMyTeams(teamsData.map((item: any) => item.teams).filter(Boolean))
    }

    // Fetch active tournaments (with registrations count)
    const { data: tournamentsData } = await supabase
      .from('tournaments')
      .select(`
        id, name, status, max_teams, registration_start, registration_end, online_phase_start, presencial_date,
        game:games(name),
        registrations:tournament_registrations(count)
      `)
      .in('status', ['registration_open', 'online_phase'])
      .order('created_at', { ascending: false })
      .limit(5)

    if (tournamentsData) {
      setActiveTournaments(tournamentsData as any)
      // Compute next important date
      const now = new Date()
      const futureDates: Date[] = []
      for (const t of tournamentsData as any[]) {
        const candidates = [t.registration_end, t.online_phase_start, t.presencial_date]
          .filter(Boolean)
          .map((d: string) => new Date(d))
          .filter((d: Date) => d > now)
        futureDates.push(...candidates)
      }
      if (futureDates.length > 0) {
        const minDate = futureDates.sort((a, b) => a.getTime() - b.getTime())[0]
        setNextImportantDate(minDate.toISOString().slice(0, 10))
      } else {
        setNextImportantDate(null)
      }
    }

    // Fetch general stats
    const { count: totalTeamsCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact' })

    const { count: totalTournamentsCount } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact' })

    // Count my registrations by teams the user belongs to
    let myRegistrationsCount = 0
    try {
      const myTeamIds = (teamsData || [])
        .map((item: any) => item.teams?.id)
        .filter(Boolean)
      if (myTeamIds.length > 0) {
        const { data: regs } = await supabase
          .from('tournament_registrations')
          .select('id, team_id')
          .in('team_id', myTeamIds as number[])
        myRegistrationsCount = (regs || []).length
      }
    } catch {
      myRegistrationsCount = 0
    }

    setStats({
      totalTeams: totalTeamsCount || 0,
      totalTournaments: totalTournamentsCount || 0,
      myRegistrations: myRegistrationsCount || 0
    })

    // Pending join requests (as captain)
    const { count: pendingCount } = await supabase
      .from('team_join_requests')
      .select('id, teams!inner(captain_id)', { count: 'exact' })
      .eq('status', 'pending')
      .eq('teams.captain_id', session?.user?.id)

    setPendingCaptainRequests(pendingCount || 0)
  }, [session?.user?.id, supabase])

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData()
    }
  }, [session, fetchDashboardData])

  if (!session) return null

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            ¡Bienvenido, {profile?.gamertag || profile?.full_name}!
          </h1>
          <p className="text-gray-300">
            Tarreo Gamer Primavera 2025 - INACAP Osorno
          </p>
        </div>

        {/* Stats Cards - Optimizadas para jugador */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-red-500 mr-2" />
              <div>
                <p className="text-xl font-bold">{myTeams.length}</p>
                <p className="text-xs text-gray-400">Mis Equipos</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <Trophy className="h-6 w-6 text-red-500 mr-2" />
              <div>
                <p className="text-xl font-bold">{stats.myRegistrations}</p>
                <p className="text-xs text-gray-400">Mis Inscripciones</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-red-500 mr-2" />
              <div>
                <p className="text-xl font-bold">{nextImportantDate ? new Date(nextImportantDate).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }) : '—'}</p>
                <p className="text-xs text-gray-400">Próxima fecha</p>
              </div>
            </div>
          </div>

          {pendingCaptainRequests > 0 && (
            <div className="card p-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-yellow-400 mr-2" />
                <div>
                  <p className="text-xl font-bold">{pendingCaptainRequests}</p>
                  <p className="text-xs text-gray-400">Solicitudes</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notificaciones de Torneos */}
        <TournamentNotifications />

        {/* Mi Equipo - Compacto */}
        <div className="mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Mi Equipo
              </h2>
              <Link href="/teams/create" className="btn-secondary text-sm">
                <Plus className="h-4 w-4 mr-1" />
                Crear Equipo
              </Link>
            </div>

            {myTeams.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tienes equipos aún</p>
                <Link href="/teams/create" className="btn-primary mt-2 inline-block text-sm">
                  Crear tu primer equipo
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTeams.map((team) => (
                  <div key={team.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold flex items-center text-sm">
                          {team.name}
                          {team.captain_id === session?.user?.id && (
                            <Crown className="h-3 w-3 ml-1 text-yellow-400" />
                          )}
                        </h3>
                        <p className="text-xs text-gray-400">
                          Capitán: {team.captain?.gamertag || team.captain?.full_name}
                        </p>
                      </div>
                      <Link
                        href={`/teams/${team.id}`}
                        className="btn-secondary text-xs ml-2"
                      >
                        Ver
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Torneos Activos - Expandido */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Torneos Activos
            </h2>
            <Link href="/tournaments" className="btn-secondary text-sm">
              Ver Todos
            </Link>
          </div>

          {activeTournaments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay torneos activos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeTournaments.map((t: any) => {
                const statusInfo = (() => {
                  const now = new Date()
                  const regStart = t.registration_start ? new Date(t.registration_start) : null
                  const regEnd = t.registration_end ? new Date(t.registration_end) : null
                  const onlineStart = t.online_phase_start ? new Date(t.online_phase_start) : null
                  const presencialDate = t.presencial_date ? new Date(t.presencial_date) : null
                  if (t.status === 'finished') return { label: 'Finalizado', cls: 'bg-gray-500/20 text-gray-300' }
                  if (presencialDate && now >= presencialDate) return { label: 'Fase Presencial', cls: 'bg-purple-500/20 text-purple-300' }
                  if (onlineStart && now >= onlineStart) return { label: 'Fase Online', cls: 'bg-blue-500/20 text-blue-300' }
                  if (regEnd && now > regEnd) return { label: 'Registro Cerrado', cls: 'bg-orange-500/20 text-orange-300' }
                  if (regStart && now >= regStart) return { label: 'Registro Abierto', cls: 'bg-green-500/20 text-green-300' }
                  return { label: 'Próximamente', cls: 'bg-yellow-500/20 text-yellow-300' }
                })()

                const registrationsCount = t.registrations?.[0]?.count || 0
                const isFull = t.max_teams && registrationsCount >= t.max_teams

                return (
                  <div key={t.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                          <p className="text-xs text-gray-400 mb-2">
                            {t.game?.name}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {registrationsCount} / {t.max_teams || '∞'} equipos
                          {isFull && <span className="text-red-400 ml-1">(COMPLETO)</span>}
                        </p>
                        <Link
                          href={`/tournaments/${t.id}`}
                          className="btn-secondary text-xs"
                        >
                          Ver
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions - Compacto */}
        <div className="mt-6">
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-3">Acciones Rápidas</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/find-players" className="btn-secondary text-sm flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Buscar Jugadores
              </Link>
              <Link href="/tournaments" className="btn-secondary text-sm flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                Explorar Torneos
              </Link>
              <Link href="/profile" className="btn-secondary text-sm flex items-center">
                <Target className="h-4 w-4 mr-1" />
                Mi Perfil
              </Link>
              <Link href="/matches" className="btn-secondary text-sm flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                Ver Matches
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
