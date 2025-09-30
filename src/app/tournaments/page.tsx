'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Calendar, Gamepad2, Users, ArrowRight, Clock, Trophy, AlertCircle, Search, Filter, Bell } from 'lucide-react'

export default function TournamentsPage() {
  const supabase = useSupabaseClient()
  const [tournaments, setTournaments] = useState<any[]>([])
  const [filteredTournaments, setFilteredTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [games, setGames] = useState<any[]>([])

  const fetchTournaments = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tournaments')
      .select(`
        *,
        game:games(name, max_team_size),
        registrations:tournament_registrations(count)
      `)
      .order('created_at', { ascending: false })
    if (data) setTournaments(data as any)

    // Obtener juegos para filtros
    const { data: gamesData } = await supabase
      .from('games')
      .select('name')
      .order('name')
    if (gamesData) setGames(gamesData)
    
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchTournaments() }, [fetchTournaments])

  // Filtrar torneos
  useEffect(() => {
    let filtered = tournaments

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter((tournament: any) =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.game?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por estado
    if (statusFilter) {
      filtered = filtered.filter((tournament: any) => {
        const statusInfo = getStatusInfo(tournament)
        return statusInfo.status === statusFilter
      })
    }

    // Filtro por juego
    if (gameFilter) {
      filtered = filtered.filter((tournament: any) =>
        tournament.game?.name === gameFilter
      )
    }

    setFilteredTournaments(filtered)
  }, [tournaments, searchTerm, statusFilter, gameFilter])

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

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Torneos</h1>
          <p className="text-gray-300">Explora los torneos disponibles y regístrate con tu equipo</p>
        </div>

        {/* Filtros */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Buscar torneo</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre, descripción o juego..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todos los estados</option>
                <option value="Próximamente">Próximamente</option>
                <option value="Registro Abierto">Registro Abierto</option>
                <option value="Registro Cerrado">Registro Cerrado</option>
                <option value="Fase Online">Fase Online</option>
                <option value="Fase Presencial">Fase Presencial</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Juego</label>
              <select
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todos los juegos</option>
                {games.map((game) => (
                  <option key={game.name} value={game.name}>{game.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setGameFilter('')
                }}
                className="btn-secondary w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
          </div>
        ) : (
          <>
            {filteredTournaments.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No se encontraron torneos</h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm || statusFilter || gameFilter 
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay torneos disponibles en este momento'
                  }
                </p>
                {(searchTerm || statusFilter || gameFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('')
                      setGameFilter('')
                    }}
                    className="btn-secondary"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments.map((tournament: any) => {
              const statusInfo = getStatusInfo(tournament)
              const registrationsCount = tournament.registrations?.[0]?.count || 0
              const isFull = tournament.max_teams && registrationsCount >= tournament.max_teams
              
              return (
                <div key={tournament.id} className="card p-6 flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold">{tournament.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                        {statusInfo.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{tournament.description || 'Sin descripción'}</p>
                    
                    <div className="space-y-2 text-sm text-gray-300 mb-4">
                      <div className="flex items-center"><Gamepad2 className="h-4 w-4 mr-2 text-red-400" /> {tournament.game?.name}</div>
                      <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-blue-400" /> Inscripciones: {tournament.registration_start?.slice(0,10)} - {tournament.registration_end?.slice(0,10) || '—'}</div>
                      <div className="flex items-center"><Users className="h-4 w-4 mr-2 text-green-400" /> 
                        Equipos: {registrationsCount} / {tournament.max_teams || '∞'}
                        {isFull && <span className="ml-2 text-red-400 text-xs">(COMPLETO)</span>}
                      </div>
                      {tournament.online_phase_start && (
                        <div className="flex items-center"><Clock className="h-4 w-4 mr-2 text-purple-400" /> Online: {tournament.online_phase_start?.slice(0,10)}</div>
                      )}
                      {tournament.presencial_date && (
                        <div className="flex items-center"><Trophy className="h-4 w-4 mr-2 text-yellow-400" /> Presencial: {tournament.presencial_date?.slice(0,10)}</div>
                      )}
                    </div>

                    {isFull && (
                      <div className="flex items-center text-orange-300 text-sm mb-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Cupos completos
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <Link href={`/tournaments/${tournament.id}`} className="btn-primary inline-flex items-center">
                      Ver detalles <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </div>
              )
            })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}


