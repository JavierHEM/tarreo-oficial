// src/app/find-players/page.tsx
'use client'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState, useCallback } from 'react'
import { Profile } from '@/types/supabase'
import Navbar from '@/components/Navbar'
import { Search, Users, Star, Clock, MessageCircle } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'

export default function FindPlayersPage() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const { showNotification } = useNotifications()
  const [players, setPlayers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [positionFilter, setPositionFilter] = useState('')
  const [isLookingForTeam, setIsLookingForTeam] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)
  const [contactingPlayer, setContactingPlayer] = useState<string | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Profile | null>(null)
  const [contactMessage, setContactMessage] = useState('')

  const games = ['Valorant', 'League of Legends', 'Fortnite', 'Overwatch 2', 'Age of Empires 2', 'Rocket League', 'Mortal Kombat 11', 'EA SPORTS FC', 'Mario Kart', 'UNO', 'Mitos y Leyendas']

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    
    // Obtener estado actual del usuario
    if (session?.user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('is_looking_for_team')
        .eq('id', session.user.id)
        .single()
      
      if (userProfile) {
        setIsLookingForTeam(userProfile.is_looking_for_team)
      }
    }
    
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_looking_for_team', true)
      .eq('role', 'gamer')
      .neq('id', session?.user?.id || '')
      .order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.or(`gamertag.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
    }

    const { data, error } = await query

    let filteredData = data || []

    if (gameFilter) {
      filteredData = filteredData.filter((player: any) => 
        player.preferred_games?.includes(gameFilter)
      )
    }

    if (positionFilter) {
      filteredData = filteredData.filter((player: any) => 
        player.preferred_position?.toLowerCase().includes(positionFilter.toLowerCase())
      )
    }

    setPlayers(filteredData)
    setLoading(false)
  }, [searchTerm, gameFilter, positionFilter, session?.user?.id, session?.user, supabase])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  const toggleLookingForTeam = async () => {
    setButtonLoading(true)
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_looking_for_team: !isLookingForTeam })
      .eq('id', session?.user?.id)

    if (!error) {
      setIsLookingForTeam(!isLookingForTeam)
      fetchPlayers() // Refresh the list
    }
    
    setButtonLoading(false)
  }

  const handleContactPlayer = (player: Profile) => {
    setSelectedPlayer(player)
    setContactMessage('')
    setShowContactModal(true)
  }

  const sendContactMessage = async () => {
    if (!selectedPlayer || !contactMessage.trim()) {
      showNotification({ 
        type: 'error', 
        title: 'Error', 
        message: 'Debes escribir un mensaje' 
      })
      return
    }

    setContactingPlayer(selectedPlayer.id)

    const { error } = await supabase
      .from('player_contacts')
      .insert({
        sender_id: session?.user?.id,
        receiver_id: selectedPlayer.id,
        message: contactMessage.trim()
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
        title: 'Mensaje enviado', 
        message: `Tu mensaje fue enviado a ${selectedPlayer.gamertag}` 
      })
      setShowContactModal(false)
      setContactMessage('')
      setSelectedPlayer(null)
    }

    setContactingPlayer(null)
  }

  if (!session) return null

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Buscar Jugadores</h1>
            <p className="text-gray-300">Encuentra compañeros de equipo para los torneos</p>
            {isLookingForTeam && (
              <div className="mt-2 flex items-center text-green-300 text-sm">
                <Users className="h-4 w-4 mr-1" />
                Estás visible en la búsqueda de equipos
              </div>
            )}
          </div>
          <button
            onClick={toggleLookingForTeam}
            disabled={buttonLoading}
            className={`mt-4 sm:mt-0 inline-flex items-center ${
              isLookingForTeam 
                ? 'btn-secondary text-green-300 hover:bg-green-500/20' 
                : 'btn-primary'
            }`}
          >
            {buttonLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            {isLookingForTeam ? 'Salir de la búsqueda' : 'Unirme a la búsqueda'}
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por gamertag o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos los juegos</option>
              {games.map(game => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Posición..."
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Players Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
            <p className="mt-4 text-gray-400">Buscando jugadores...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-gray-400 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron jugadores</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || gameFilter || positionFilter 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay jugadores buscando equipo en este momento'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => (
              <div key={player.id} className="card p-6 hover:bg-white/15 transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{player.gamertag}</h3>
                    <p className="text-sm text-gray-400">{player.full_name}</p>
                  </div>
                  <div className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                    Disponible
                  </div>
                </div>

                {player.preferred_position && (
                  <div className="mb-3">
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                      {player.preferred_position}
                    </span>
                  </div>
                )}

                {player.preferred_games && player.preferred_games.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-2">Juegos preferidos:</p>
                    <div className="flex flex-wrap gap-1">
                      {player.preferred_games.slice(0, 3).map((game: string, index: number) => (
                        <span key={index} className="bg-white/10 px-2 py-1 rounded text-xs">
                          {game}
                        </span>
                      ))}
                      {player.preferred_games.length > 3 && (
                        <span className="bg-white/10 px-2 py-1 rounded text-xs">
                          +{player.preferred_games.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {player.available_schedule && (
                  <div className="mb-4 flex items-center text-sm text-gray-400">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-xs">{player.available_schedule}</span>
                  </div>
                )}

                {player.bio && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {player.bio}
                  </p>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleContactPlayer(player)}
                    disabled={contactingPlayer === player.id}
                    className="btn-secondary flex-1 text-sm disabled:opacity-50"
                  >
                    {contactingPlayer === player.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
                    ) : (
                      <MessageCircle className="h-4 w-4 mr-1" />
                    )}
                    Contactar
                  </button>
                  <button className="btn-primary text-sm px-3">
                    <Users className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Contacto */}
      {showContactModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              Contactar a {selectedPlayer.gamertag}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Mensaje
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                rows={4}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={sendContactMessage}
                disabled={contactingPlayer === selectedPlayer.id || !contactMessage.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {contactingPlayer === selectedPlayer.id ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}