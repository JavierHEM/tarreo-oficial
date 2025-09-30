// src/app/teams/page.tsx
'use client'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState, useCallback } from 'react'
import { Team, Profile } from '@/types/supabase'
import Navbar from '@/components/Navbar'
import { Users, Plus, Crown, Search, Filter } from 'lucide-react'
import Link from 'next/link'

export default function TeamsPage() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLookingForPlayers, setFilterLookingForPlayers] = useState(false)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    
    let query = supabase
      .from('teams')
      .select(`
        *,
        captain:profiles!teams_captain_id_fkey (full_name, gamertag),
        members:team_members (
          id, position, status,
          player:profiles!team_members_player_id_fkey (full_name, gamertag)
        )
      `)
      .order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`)
    }

    if (filterLookingForPlayers) {
      query = query.eq('is_looking_for_players', true)
    }

    const { data, error } = await query

    if (data) {
      setTeams(data)
    }
    setLoading(false)
  }, [searchTerm, filterLookingForPlayers, supabase])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const getActiveMembers = (team: Team) => {
    return team.members?.filter((member: any) => member.status === 'active') || []
  }

  if (!session) return null

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Equipos</h1>
            <p className="text-gray-300">Explora todos los equipos del torneo</p>
          </div>
          <div className="flex-shrink-0">
            <Link href="/teams/create" className="btn-primary inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Crear Equipo
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar equipos por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterLookingForPlayers}
                  onChange={(e) => setFilterLookingForPlayers(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative inline-block w-10 h-6 rounded-full transition ${
                  filterLookingForPlayers ? 'bg-purple-600' : 'bg-white/20'
                }`}>
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition transform ${
                    filterLookingForPlayers ? 'translate-x-4' : ''
                  }`} />
                </div>
                <span className="ml-2 text-sm">Buscando jugadores</span>
              </label>
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
            <p className="mt-4 text-gray-400">Cargando equipos...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-gray-400 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron equipos</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterLookingForPlayers 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Sé el primero en crear un equipo'}
            </p>
            <Link href="/teams/create" className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Crear Equipo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const activeMembers = getActiveMembers(team)
              const isMyTeam = activeMembers.some((member: any) => member.player?.id === session?.user?.id)
              
              return (
                <div key={team.id} className="card p-6 hover:bg-white/15 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold flex items-center">
                        {team.name}
                        {team.captain_id === session?.user?.id && (
                          <Crown className="h-4 w-4 ml-2 text-yellow-400" />
                        )}
                        {isMyTeam && team.captain_id !== session?.user?.id && (
                          <div className="ml-2 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                            Mi Equipo
                          </div>
                        )}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Capitán: {team.captain?.gamertag || team.captain?.full_name}
                      </p>
                    </div>
                    
                    {team.is_looking_for_players && (
                      <div className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                        Reclutando
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-400 mb-2">
                      <Users className="h-4 w-4 mr-1" />
                      Miembros: {activeMembers.length}/5
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {activeMembers.map((member: any, index: number) => (
                        <span key={member.id} className="bg-white/10 px-2 py-1 rounded text-xs">
                          {member.player?.gamertag || member.player?.full_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {team.description && (
                    <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                      {team.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/teams/${team.id}`}
                      className="btn-secondary flex-1 text-center text-sm"
                    >
                      Ver Detalles
                    </Link>
                    
                    {team.is_looking_for_players && !isMyTeam && (
                      <Link
                        href={`/teams/${team.id}/join`}
                        className="btn-primary text-sm px-3"
                      >
                        Solicitar
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
