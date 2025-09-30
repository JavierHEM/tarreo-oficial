'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { ArrowLeft, Search, Filter, Users, Mail, Gamepad2, MapPin, Clock } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'

export default function TeamRecruitPage() {
  const params = useParams()
  const teamId = Number(params?.id)
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()
  const { showNotification } = useNotifications()

  const [players, setPlayers] = useState<any[]>([])
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGame, setSelectedGame] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [games, setGames] = useState<any[]>([])
  const [positions] = useState([
    'Top', 'Jungle', 'Mid', 'ADC', 'Support', // LoL
    'Duelist', 'Initiator', 'Controller', 'Sentinel', // Valorant
    'Builder', 'Scout', 'Assault', 'Medic' // Fortnite
  ])

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // Obtener información del equipo
    const { data: teamData } = await supabase
      .from('teams')
      .select('*, captain:profiles!teams_captain_id_fkey(full_name, gamertag, id)')
      .eq('id', teamId)
      .single()

    if (teamData) setTeam(teamData)

    // Obtener juegos disponibles
    const { data: gamesData } = await supabase
      .from('games')
      .select('*')
      .order('name')

    if (gamesData) setGames(gamesData)

    // Obtener jugadores disponibles
    const { data: playersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_looking_for_team', true)
      .neq('id', session?.user?.id) // Excluir al capitán
      .order('created_at', { ascending: false })

    if (playersData) setPlayers(playersData as any)
    setLoading(false)
  }, [teamId, supabase, session?.user?.id])

  useEffect(() => {
    if (teamId && session) fetchData()
  }, [teamId, session, fetchData])

  const filteredPlayers = players.filter((player: any) => {
    const matchesSearch = !searchTerm || 
      player.gamertag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGame = !selectedGame || 
      player.preferred_games?.includes(selectedGame)
    
    const matchesPosition = !selectedPosition || 
      player.preferred_position === selectedPosition

    return matchesSearch && matchesGame && matchesPosition
  })

  const sendInvite = async (playerId: string) => {
    const { error } = await supabase
      .from('team_join_requests')
      .insert({
        team_id: teamId,
        player_id: playerId,
        status: 'pending',
        is_invite: true // Marcar como invitación del capitán
      })

    if (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: `Error al enviar invitación: ${error.message}`
      })
    } else {
      showNotification({
        type: 'success',
        title: 'Invitación enviada',
        message: 'Se ha enviado una invitación al jugador'
      })
    }
  }

  if (!session) return null

  const isCaptain = team?.captain_id === session.user?.id

  if (!isCaptain) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Acceso denegado</h1>
            <p className="text-gray-400 mb-6">Solo el capitán puede reclutar jugadores</p>
            <Link href={`/teams/${teamId}`} className="btn-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al equipo
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/teams/${teamId}`} className="btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al equipo
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Reclutar Jugadores</h1>
          <p className="text-gray-300">Encuentra jugadores para tu equipo <span className="font-semibold text-red-400">{team?.name}</span></p>
        </div>

        {/* Filtros */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Buscar jugador</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Gamertag o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Juego</label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todos los juegos</option>
                {games.map((game) => (
                  <option key={game.id} value={game.name}>{game.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Posición</label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todas las posiciones</option>
                {positions.map((position) => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedGame('')
                  setSelectedPosition('')
                }}
                className="btn-secondary w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map((player: any) => (
              <div key={player.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{player.gamertag || player.full_name}</h3>
                    <p className="text-sm text-gray-400">{player.full_name}</p>
                  </div>
                  <button
                    onClick={() => sendInvite(player.id)}
                    className="btn-primary text-sm"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Invitar
                  </button>
                </div>

                {player.preferred_games && player.preferred_games.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center mb-2">
                      <Gamepad2 className="h-4 w-4 mr-2 text-red-400" />
                      <span className="text-sm font-medium">Juegos</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {player.preferred_games.slice(0, 3).map((game: string, index: number) => (
                        <span key={index} className="bg-red-500/20 text-red-200 px-2 py-1 rounded text-xs">
                          {game}
                        </span>
                      ))}
                      {player.preferred_games.length > 3 && (
                        <span className="text-xs text-gray-400">+{player.preferred_games.length - 3} más</span>
                      )}
                    </div>
                  </div>
                )}

                {player.preferred_position && (
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                      <span className="text-sm font-medium">Posición preferida</span>
                    </div>
                    <span className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded text-xs">
                      {player.preferred_position}
                    </span>
                  </div>
                )}

                {player.available_schedule && (
                  <div className="mb-3">
                    <div className="flex items-center mb-1">
                      <Clock className="h-4 w-4 mr-2 text-green-400" />
                      <span className="text-sm font-medium">Horario disponible</span>
                    </div>
                    <p className="text-sm text-gray-300">{player.available_schedule}</p>
                  </div>
                )}

                {player.bio && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-sm text-gray-300">{player.bio}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron jugadores</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || selectedGame || selectedPosition 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay jugadores buscando equipo en este momento'
              }
            </p>
            {(searchTerm || selectedGame || selectedPosition) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedGame('')
                  setSelectedPosition('')
                }}
                className="btn-secondary"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
