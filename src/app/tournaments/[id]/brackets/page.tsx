'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { ArrowLeft, Trophy, Users, Calendar, Play, CheckCircle } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'

interface Match {
  round_number: number
  match_id: number
  team1_id: number
  team1_name: string
  team2_id: number
  team2_name: string
  team1_score: number
  team2_score: number
  winner_team_id: number
  status: string
}

interface Tournament {
  id: number
  name: string
  status: string
  game: { name: string }
}

export default function TournamentBracketsPage() {
  const params = useParams()
  const id = Number(params?.id)
  const router = useRouter()
  const supabase = useSupabaseClient()
  const session = useSession()
  const { showNotification } = useNotifications()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingBrackets, setGeneratingBrackets] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // Obtener información del torneo
    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*, game:games(name)')
      .eq('id', id)
      .single()
    
    if (tournamentData) setTournament(tournamentData)

    // Obtener bracket del torneo
    const { data: bracketData } = await supabase.rpc('get_tournament_bracket', {
      tournament_id_param: id
    })
    
    if (bracketData) setMatches(bracketData as Match[])
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    if (id) fetchData()
  }, [id, fetchData])

  useEffect(() => {
    const checkAdmin = async () => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setIsAdmin(data?.role === 'admin')
      }
    }
    checkAdmin()
  }, [session, supabase])

  const generateBrackets = async () => {
    setGeneratingBrackets(true)
    try {
      const { error } = await supabase.rpc('generate_tournament_brackets', {
        tournament_id_param: id
      })
      
      if (error) throw error
      
      showNotification({
        type: 'success',
        title: 'Brackets generados',
        message: 'Los brackets del torneo han sido generados exitosamente'
      })
      
      fetchData() // Refrescar datos
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      })
    }
    setGeneratingBrackets(false)
  }

  const recordResult = async (matchId: number, team1Score: number, team2Score: number, winnerId: number) => {
    try {
      const { error } = await supabase.rpc('record_match_result', {
        match_id_param: matchId,
        team1_score_param: team1Score,
        team2_score_param: team2Score,
        winner_team_id_param: winnerId
      })
      
      if (error) throw error
      
      showNotification({
        type: 'success',
        title: 'Resultado registrado',
        message: 'El resultado del match ha sido registrado'
      })
      
      fetchData() // Refrescar datos
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      })
    }
  }

  const getRounds = () => {
    const rounds = new Map<number, Match[]>()
    matches.forEach(match => {
      if (!rounds.has(match.round_number)) {
        rounds.set(match.round_number, [])
      }
      rounds.get(match.round_number)!.push(match)
    })
    return Array.from(rounds.entries()).sort(([a], [b]) => a - b)
  }

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'finished': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'in_progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'scheduled': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/tournaments/${id}`} className="btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al torneo
          </Link>
        </div>

        {loading || !tournament ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{tournament.name} - Brackets</h1>
                  <p className="text-sm text-gray-400">{tournament.game?.name}</p>
                </div>
                {isAdmin && matches.length === 0 && (
                  <button
                    onClick={generateBrackets}
                    disabled={generatingBrackets}
                    className="btn-primary inline-flex items-center"
                  >
                    {generatingBrackets ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Trophy className="h-4 w-4 mr-2" />
                    )}
                    Generar Brackets
                  </button>
                )}
              </div>
            </div>

            {/* Brackets */}
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay brackets generados</h3>
                <p className="text-gray-400">
                  {isAdmin ? 'Genera los brackets para comenzar el torneo' : 'Los brackets se generarán cuando el torneo comience'}
                </p>
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-6">Brackets del Torneo</h2>
                
                <div className="overflow-x-auto">
                  <div className="flex gap-8 min-w-max">
                    {getRounds().map(([roundNumber, roundMatches]) => (
                      <div key={roundNumber} className="flex-shrink-0">
                        <h3 className="text-lg font-semibold mb-4 text-center">
                          Round {roundNumber}
                        </h3>
                        <div className="space-y-4">
                          {roundMatches.map((match) => (
                            <div
                              key={match.match_id}
                              className={`border rounded-lg p-4 min-w-[300px] ${getMatchStatusColor(match.status)}`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium ${match.winner_team_id === match.team1_id ? 'text-green-300' : ''}`}>
                                    {match.team1_name}
                                  </span>
                                  {match.status === 'finished' && (
                                    <span className="text-sm font-bold">{match.team1_score}</span>
                                  )}
                                </div>
                                
                                <div className="text-center text-xs text-gray-400">VS</div>
                                
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium ${match.winner_team_id === match.team2_id ? 'text-green-300' : ''}`}>
                                    {match.team2_name}
                                  </span>
                                  {match.status === 'finished' && (
                                    <span className="text-sm font-bold">{match.team2_score}</span>
                                  )}
                                </div>
                                
                                <div className="text-center text-xs text-gray-400 mt-2">
                                  {match.status === 'finished' ? (
                                    <span className="flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Finalizado
                                    </span>
                                  ) : match.status === 'in_progress' ? (
                                    <span className="flex items-center justify-center text-blue-300">
                                      <Play className="h-3 w-3 mr-1" />
                                      En progreso
                                    </span>
                                  ) : (
                                    <span className="flex items-center justify-center">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      Programado
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
