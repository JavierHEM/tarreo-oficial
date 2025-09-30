'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useNotifications } from '@/components/NotificationProvider'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Trophy, 
  Users, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft
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
  created_at: string
  updated_at: string
  tournament_name?: string
  team1_name?: string
  team2_name?: string
}

interface Tournament {
  id: number
  name: string
  status: string
}

interface Team {
  id: number
  name: string
}

export default function AdminMatchesPage() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()
  const { showNotification } = useNotifications()

  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Estados para formularios
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [formData, setFormData] = useState({
    tournament_id: '',
    team1_id: '',
    team2_id: '',
    phase: 'online_eliminations',
    round_number: 1,
    match_date: '',
    status: 'scheduled' as const,
    notes: ''
  })

  const [resultData, setResultData] = useState({
    team1_score: '',
    team2_score: '',
    winner_team_id: ''
  })

  // Verificar acceso de admin
  const checkAdminAccess = useCallback(async () => {
    if (!session?.user) {
      router.push('/auth')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
  }, [session, supabase, router])

  // Cargar datos
  const fetchData = useCallback(async () => {
    if (!isAdmin) return

    try {
      // Cargar matches con información relacionada
      const { data: matchesData, error: matchesError } = await supabase
        .from('match_details')
        .select('*')
        .order('created_at', { ascending: false })

      if (matchesError) throw matchesError
      setMatches(matchesData || [])

      // Cargar torneos
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, name, status')
        .order('name')

      if (tournamentsError) throw tournamentsError
      setTournaments(tournamentsData || [])

      // Cargar equipos
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .order('name')

      if (teamsError) throw teamsError
      setTeams(teamsData || [])

    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }, [isAdmin, supabase, showNotification])

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  useEffect(() => {
    if (isAdmin) {
      fetchData()
    }
  }, [isAdmin, fetchData])

  // Crear match
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('matches')
        .insert({
          tournament_id: parseInt(formData.tournament_id),
          team1_id: parseInt(formData.team1_id),
          team2_id: formData.team2_id ? parseInt(formData.team2_id) : null,
          phase: formData.phase,
          round_number: parseInt(formData.round_number.toString()),
          match_date: formData.match_date || null,
          status: formData.status,
          notes: formData.notes || null
        })

      if (error) throw error

      showNotification({
        type: 'success',
        title: 'Match creado',
        message: 'El match ha sido creado exitosamente'
      })

      setShowCreateForm(false)
      setFormData({
        tournament_id: '',
        team1_id: '',
        team2_id: '',
        phase: 'online_eliminations',
        round_number: 1,
        match_date: '',
        status: 'scheduled',
        notes: ''
      })
      fetchData()

    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Actualizar match
  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMatch) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          tournament_id: parseInt(formData.tournament_id),
          team1_id: parseInt(formData.team1_id),
          team2_id: formData.team2_id ? parseInt(formData.team2_id) : null,
          phase: formData.phase,
          round_number: parseInt(formData.round_number.toString()),
          match_date: formData.match_date || null,
          status: formData.status,
          notes: formData.notes || null
        })
        .eq('id', editingMatch.id)

      if (error) throw error

      showNotification({
        type: 'success',
        title: 'Match actualizado',
        message: 'El match ha sido actualizado exitosamente'
      })

      setEditingMatch(null)
      setFormData({
        tournament_id: '',
        team1_id: '',
        team2_id: '',
        phase: 'online_eliminations',
        round_number: 1,
        match_date: '',
        status: 'scheduled',
        notes: ''
      })
      fetchData()

    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Registrar resultado
  const handleRecordResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMatch) return

    setLoading(true)

    try {
      const { error } = await supabase.rpc('record_match_result', {
        match_id_param: editingMatch.id,
        team1_score_param: parseInt(resultData.team1_score),
        team2_score_param: parseInt(resultData.team2_score),
        winner_team_id_param: parseInt(resultData.winner_team_id)
      })

      if (error) throw error

      showNotification({
        type: 'success',
        title: 'Resultado registrado',
        message: 'El resultado ha sido registrado y el torneo avanzado'
      })

      setEditingMatch(null)
      setResultData({
        team1_score: '',
        team2_score: '',
        winner_team_id: ''
      })
      fetchData()

    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Eliminar match
  const handleDeleteMatch = async (matchId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este match?')) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)

      if (error) throw error

      showNotification({
        type: 'success',
        title: 'Match eliminado',
        message: 'El match ha sido eliminado exitosamente'
      })

      fetchData()

    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Generar brackets automáticamente
  const handleGenerateBrackets = async (tournamentId: number) => {
    setLoading(true)

    try {
      const { error } = await supabase.rpc('generate_tournament_brackets', {
        tournament_id_param: tournamentId
      })

      if (error) throw error

      showNotification({
        type: 'success',
        title: 'Brackets generados',
        message: 'Los brackets han sido generados automáticamente'
      })

      fetchData()

    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Iniciar edición
  const startEdit = (match: Match) => {
    setEditingMatch(match)
    setFormData({
      tournament_id: match.tournament_id.toString(),
      team1_id: match.team1_id.toString(),
      team2_id: match.team2_id?.toString() || '',
      phase: match.phase,
      round_number: match.round_number,
      match_date: match.match_date || '',
      status: match.status,
      notes: match.notes || ''
    })
  }

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="btn-secondary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Gestión de Matches</h1>
                <p className="text-gray-300">Administra partidas y resultados de torneos</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Match
            </button>
          </div>

          {/* Lista de matches */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
                <p className="text-gray-300 mt-4">Cargando matches...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No hay matches</h3>
                <p className="text-gray-400">Crea el primer match o genera brackets automáticamente</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {matches.map((match) => (
                  <div key={match.id} className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(match.status)}
                        <h3 className="text-lg font-semibold text-white">
                          {match.tournament_name} - Round {match.round_number}
                        </h3>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-300">
                          {getStatusText(match.status)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(match)}
                          className="btn-secondary text-sm"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteMatch(match.id)}
                          className="btn-secondary text-sm text-red-300 hover:text-red-200"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-300 mb-2">Equipos</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            <span className="text-white">{match.team1_name || 'TBD'}</span>
                            {match.team1_score !== null && (
                              <span className="text-lg font-bold text-red-400">
                                {match.team1_score}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-400" />
                            <span className="text-white">{match.team2_name || 'TBD'}</span>
                            {match.team2_score !== null && (
                              <span className="text-lg font-bold text-red-400">
                                {match.team2_score}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-300 mb-2">Detalles</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">
                              {match.match_date ? new Date(match.match_date).toLocaleDateString() : 'Sin fecha'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300 capitalize">
                              {match.phase.replace('_', ' ')}
                            </span>
                          </div>
                          {match.winner_team_id && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <span className="text-green-300">
                                Ganador: {match.winner_team_id === match.team1_id ? match.team1_name : match.team2_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {match.notes && (
                      <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                        <p className="text-sm text-gray-300">{match.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generar brackets para torneos */}
          {tournaments.length > 0 && (
            <div className="mt-8 card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Generar Brackets Automáticamente</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournaments.map((tournament) => (
                  <div key={tournament.id} className="p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="font-medium text-white mb-2">{tournament.name}</h4>
                    <p className="text-sm text-gray-400 mb-3 capitalize">
                      {tournament.status.replace('_', ' ')}
                    </p>
                    <button
                      onClick={() => handleGenerateBrackets(tournament.id)}
                      className="btn-secondary text-sm w-full"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Generar Brackets
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar Match */}
      {(showCreateForm || editingMatch) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingMatch ? 'Editar Match' : 'Crear Match'}
            </h2>

            <form onSubmit={editingMatch ? handleUpdateMatch : handleCreateMatch}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Torneo *
                  </label>
                  <select
                    value={formData.tournament_id}
                    onChange={(e) => setFormData({ ...formData, tournament_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar torneo</option>
                    {tournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Round
                  </label>
                  <input
                    type="number"
                    value={formData.round_number}
                    onChange={(e) => setFormData({ ...formData, round_number: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Equipo 1 *
                  </label>
                  <select
                    value={formData.team1_id}
                    onChange={(e) => setFormData({ ...formData, team1_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar equipo</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Equipo 2
                  </label>
                  <select
                    value={formData.team2_id}
                    onChange={(e) => setFormData({ ...formData, team2_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Sin oponente (Bye)</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fase
                  </label>
                  <select
                    value={formData.phase}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="online_eliminations">Eliminatorias Online</option>
                    <option value="presencial_eliminations">Eliminatorias Presenciales</option>
                    <option value="final">Final</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="scheduled">Programado</option>
                    <option value="in_progress">En progreso</option>
                    <option value="finished">Finalizado</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha del match
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.match_date}
                    onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : (editingMatch ? 'Actualizar' : 'Crear')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingMatch(null)
                    setFormData({
                      tournament_id: '',
                      team1_id: '',
                      team2_id: '',
                      phase: 'online_eliminations',
                      round_number: 1,
                      match_date: '',
                      status: 'scheduled',
                      notes: ''
                    })
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>

            {/* Formulario de resultado para matches finalizados */}
            {editingMatch && editingMatch.status === 'finished' && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Registrar Resultado</h3>
                <form onSubmit={handleRecordResult}>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Puntuación {editingMatch.team1_name}
                      </label>
                      <input
                        type="number"
                        value={resultData.team1_score}
                        onChange={(e) => setResultData({ ...resultData, team1_score: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Puntuación {editingMatch.team2_name}
                      </label>
                      <input
                        type="number"
                        value={resultData.team2_score}
                        onChange={(e) => setResultData({ ...resultData, team2_score: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ganador
                      </label>
                      <select
                        value={resultData.winner_team_id}
                        onChange={(e) => setResultData({ ...resultData, winner_team_id: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar ganador</option>
                        <option value={editingMatch.team1_id}>
                          {editingMatch.team1_name}
                        </option>
                        <option value={editingMatch.team2_id}>
                          {editingMatch.team2_name}
                        </option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Registrando...' : 'Registrar Resultado'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
