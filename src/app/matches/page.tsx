'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { 
  Trophy, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  XCircle,
  Filter,
  Search
} from 'lucide-react'
import Link from 'next/link'

interface Match {
  id: number
  tournament_id: number
  team1_id: number
  team2_id: number
  phase: string
  round_number: number
  match_date?: string
  team1_score?: number
  team2_score?: number
  winner_team_id?: number
  status: 'scheduled' | 'in_progress' | 'finished'
  notes?: string
  tournament_name?: string
  team1_name?: string
  team2_name?: string
}

interface Tournament {
  id: number
  name: string
}

export default function MatchesPage() {
  const supabase = useSupabaseClient()
  const { session } = useSession()

  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tournamentFilter, setTournamentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('')

  // Cargar datos
  const fetchData = useCallback(async () => {
    try {
      // Cargar matches con información relacionada
      const { data: matchesData, error: matchesError } = await supabase
        .from('match_details')
        .select('*')
        .order('created_at', { ascending: false })

      if (matchesError) throw matchesError
      setMatches(matchesData || [])

      // Cargar torneos para filtro
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, name')
        .order('name')

      if (tournamentsError) throw tournamentsError
      setTournaments(tournamentsData || [])

    } catch (error: any) {
      console.error('Error cargando matches:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtrar matches
  const filteredMatches = matches.filter((match) => {
    const matchesSearch = !searchTerm || 
      match.tournament_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team1_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.team2_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTournament = !tournamentFilter || 
      match.tournament_id.toString() === tournamentFilter

    const matchesStatus = !statusFilter || 
      match.status === statusFilter

    const matchesPhase = !phaseFilter || 
      match.phase === phaseFilter

    return matchesSearch && matchesTournament && matchesStatus && matchesPhase
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-400" />
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-400" />
      case 'finished':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programado'
      case 'in_progress':
        return 'En progreso'
      case 'finished':
        return 'Finalizado'
      default:
        return 'Desconocido'
    }
  }

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'online_eliminations':
        return 'Eliminatorias Online'
      case 'presencial_eliminations':
        return 'Eliminatorias Presenciales'
      case 'final':
        return 'Final'
      default:
        return phase.replace('_', ' ').toUpperCase()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-500/20 text-yellow-300'
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300'
      case 'finished':
        return 'bg-green-500/20 text-green-300'
      default:
        return 'bg-gray-500/20 text-gray-300'
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Enfrentamientos</h1>
            <p className="text-gray-300">Sigue todos los matches y resultados de los torneos</p>
          </div>

          {/* Filtros */}
          <div className="card p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">Filtros</h3>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Torneo, equipo..."
                    className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Torneo
                </label>
                <select
                  value={tournamentFilter}
                  onChange={(e) => setTournamentFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Todos los torneos</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  <option value="scheduled">Programado</option>
                  <option value="in_progress">En progreso</option>
                  <option value="finished">Finalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fase
                </label>
                <select
                  value={phaseFilter}
                  onChange={(e) => setPhaseFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Todas las fases</option>
                  <option value="online_eliminations">Eliminatorias Online</option>
                  <option value="presencial_eliminations">Eliminatorias Presenciales</option>
                  <option value="final">Final</option>
                </select>
              </div>
            </div>

            {(searchTerm || tournamentFilter || statusFilter || phaseFilter) && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setTournamentFilter('')
                    setStatusFilter('')
                    setPhaseFilter('')
                  }}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* Lista de matches */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
              <p className="text-gray-300 mt-4">Cargando enfrentamientos...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                {matches.length === 0 ? 'No hay enfrentamientos' : 'No se encontraron matches'}
              </h3>
              <p className="text-gray-400">
                {matches.length === 0 
                  ? 'Los enfrentamientos aparecerán aquí cuando se generen los brackets'
                  : 'Intenta ajustar los filtros de búsqueda'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Agrupar por torneo */}
              {Object.entries(
                filteredMatches.reduce((acc, match) => {
                  const tournamentName = match.tournament_name || 'Sin torneo'
                  if (!acc[tournamentName]) acc[tournamentName] = []
                  acc[tournamentName].push(match)
                  return acc
                }, {} as Record<string, Match[]>)
              ).map(([tournamentName, tournamentMatches]) => (
                <div key={tournamentName} className="space-y-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-red-400" />
                    {tournamentName}
                  </h2>
                  
                  <div className="grid gap-4">
                    {tournamentMatches.map((match) => (
                      <div key={match.id} className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(match.status)}
                            <h3 className="text-lg font-semibold text-white">
                              Round {match.round_number}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(match.status)}`}>
                              {getStatusText(match.status)}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-300">
                              {getPhaseText(match.phase)}
                            </span>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Equipos */}
                          <div>
                            <h4 className="font-medium text-gray-300 mb-3">Equipos</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Users className="h-4 w-4 text-blue-400" />
                                  <span className="text-white font-medium">
                                    {match.team1_name || 'TBD'}
                                  </span>
                                </div>
                                {match.team1_score !== null && (
                                  <span className="text-xl font-bold text-red-400">
                                    {match.team1_score}
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-center text-gray-400 text-sm">VS</div>
                              
                              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Users className="h-4 w-4 text-green-400" />
                                  <span className="text-white font-medium">
                                    {match.team2_name || 'TBD'}
                                  </span>
                                </div>
                                {match.team2_score !== null && (
                                  <span className="text-xl font-bold text-red-400">
                                    {match.team2_score}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Detalles */}
                          <div>
                            <h4 className="font-medium text-gray-300 mb-3">Detalles</h4>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-300">
                                  {match.match_date 
                                    ? new Date(match.match_date).toLocaleString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : 'Sin fecha programada'
                                  }
                                </span>
                              </div>
                              
                              {match.winner_team_id && (
                                <div className="flex items-center gap-3">
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                  <span className="text-green-300 font-medium">
                                    Ganador: {match.winner_team_id === match.team1_id ? match.team1_name : match.team2_name}
                                  </span>
                                </div>
                              )}

                              {match.notes && (
                                <div className="p-3 bg-gray-800/50 rounded-lg">
                                  <p className="text-sm text-gray-300">{match.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enlace al torneo */}
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <Link 
                            href={`/tournaments/${match.tournament_id}`}
                            className="text-red-400 hover:text-red-300 text-sm font-medium"
                          >
                            Ver detalles del torneo →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
