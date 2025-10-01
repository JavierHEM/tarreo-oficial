'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { 
  Users, 
  Trophy, 
  Gamepad2, 
  Download, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface DashboardStats {
  totalPlayers: number
  totalTeams: number
  completeTeams: number
  incompleteTeams: number
  totalTournaments: number
  activeTournaments: number
  completedTournaments: number
  totalMatches: number
  completedMatches: number
  pendingMatches: number
}

interface ChartData {
  name: string
  value: number
  color?: string
  [key: string]: any
}

export default function AdminDashboard() {
  const supabase = useSupabaseClient()
  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    totalTeams: 0,
    completeTeams: 0,
    incompleteTeams: 0,
    totalTournaments: 0,
    activeTournaments: 0,
    completedTournaments: 0,
    totalMatches: 0,
    completedMatches: 0,
    pendingMatches: 0
  })
  const [loading, setLoading] = useState(true)
  const [playersByGame, setPlayersByGame] = useState<ChartData[]>([])
  const [teamsByStatus, setTeamsByStatus] = useState<ChartData[]>([])
  const [tournamentsByStatus, setTournamentsByStatus] = useState<ChartData[]>([])
  const [monthlyRegistrations, setMonthlyRegistrations] = useState<ChartData[]>([])

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    
    try {
      // Obtener estadísticas básicas
      const [playersResult, teamsResult, tournamentsResult, matchesResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('teams').select('*', { count: 'exact' }),
        supabase.from('tournaments').select('*', { count: 'exact' }),
        supabase.from('matches').select('*', { count: 'exact' })
      ])

      // Obtener equipos completos vs incompletos
      const { data: teamsData } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          team_members(id, status)
        `)

      // Contar equipos completos e incompletos
      let completeTeams = 0
      let incompleteTeams = 0
      
      console.log('Teams data for dashboard:', teamsData)
      
      if (teamsData) {
        teamsData.forEach((team: any) => {
          // Contar solo miembros activos
          const activeMembers = team.team_members?.filter((member: any) => member.status === 'active') || []
          const memberCount = activeMembers.length
          const maxMembers = 5 // Valor por defecto para equipos de gaming
          
          console.log(`Team ${team.name}: ${memberCount} active members (max: ${maxMembers})`)
          
          if (memberCount >= maxMembers) {
            completeTeams++
          } else {
            incompleteTeams++
          }
        })
      }
      
      console.log(`Dashboard stats - Complete: ${completeTeams}, Incomplete: ${incompleteTeams}`)

      // Obtener torneos por estado
      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('status')

      let activeTournaments = 0
      let completedTournaments = 0
      
      if (tournamentsData) {
        tournamentsData.forEach((tournament: any) => {
          if (tournament.status === 'in_progress' || tournament.status === 'registration_open') {
            activeTournaments++
          } else if (tournament.status === 'completed') {
            completedTournaments++
          }
        })
      }

      // Obtener matches por estado
      const { data: matchesData } = await supabase
        .from('matches')
        .select('status')

      let completedMatches = 0
      let pendingMatches = 0
      
      if (matchesData) {
        matchesData.forEach((match: any) => {
          if (match.status === 'finished') {
            completedMatches++
          } else {
            pendingMatches++
          }
        })
      }

      // Obtener jugadores por juego preferido
      const { data: playersData } = await supabase
        .from('profiles')
        .select('preferred_games')

      const gameCounts: { [key: string]: number } = {}
      if (playersData) {
        playersData.forEach((player: any) => {
          if (player.preferred_games) {
            player.preferred_games.forEach((game: string) => {
              gameCounts[game] = (gameCounts[game] || 0) + 1
            })
          }
        })
      }

      const playersByGameData = Object.entries(gameCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

      // Obtener registros mensuales (últimos 6 meses)
      const { data: monthlyData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())

      const monthlyCounts: { [key: string]: number } = {}
      if (monthlyData) {
        monthlyData.forEach((profile: any) => {
          const month = new Date(profile.created_at).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
          monthlyCounts[month] = (monthlyCounts[month] || 0) + 1
        })
      }

      const monthlyRegistrationsData = Object.entries(monthlyCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())

      // Actualizar estado
      setStats({
        totalPlayers: playersResult.count || 0,
        totalTeams: teamsResult.count || 0,
        completeTeams,
        incompleteTeams,
        totalTournaments: tournamentsResult.count || 0,
        activeTournaments,
        completedTournaments,
        totalMatches: matchesResult.count || 0,
        completedMatches,
        pendingMatches
      })

      setPlayersByGame(playersByGameData)
      setTeamsByStatus([
        { name: 'Completos', value: completeTeams, color: '#10B981' },
        { name: 'Incompletos', value: incompleteTeams, color: '#F59E0B' }
      ])
      setTournamentsByStatus([
        { name: 'Activos', value: activeTournaments, color: '#3B82F6' },
        { name: 'Completados', value: completedTournaments, color: '#10B981' }
      ])
      setMonthlyRegistrations(monthlyRegistrationsData)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const exportToExcel = async () => {
    try {
      // Obtener datos detallados para exportar
      const [playersData, teamsData, tournamentsData, matchesData] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('tournaments').select('*'),
        supabase.from('matches').select('*')
      ])

      // Crear workbook
      const wb = XLSX.utils.book_new()

      // Agregar hojas
      if (playersData.data) {
        const playersWS = XLSX.utils.json_to_sheet(playersData.data)
        XLSX.utils.book_append_sheet(wb, playersWS, 'Jugadores')
      }

      if (teamsData.data) {
        const teamsWS = XLSX.utils.json_to_sheet(teamsData.data)
        XLSX.utils.book_append_sheet(wb, teamsWS, 'Equipos')
      }

      if (tournamentsData.data) {
        const tournamentsWS = XLSX.utils.json_to_sheet(tournamentsData.data)
        XLSX.utils.book_append_sheet(wb, tournamentsWS, 'Torneos')
      }

      if (matchesData.data) {
        const matchesWS = XLSX.utils.json_to_sheet(matchesData.data)
        XLSX.utils.book_append_sheet(wb, matchesWS, 'Matches')
      }

      // Agregar resumen
      const summaryData = [
        ['Métrica', 'Valor'],
        ['Total Jugadores', stats.totalPlayers],
        ['Total Equipos', stats.totalTeams],
        ['Equipos Completos', stats.completeTeams],
        ['Equipos Incompletos', stats.incompleteTeams],
        ['Total Torneos', stats.totalTournaments],
        ['Torneos Activos', stats.activeTournaments],
        ['Torneos Completados', stats.completedTournaments],
        ['Total Matches', stats.totalMatches],
        ['Matches Completados', stats.completedMatches],
        ['Matches Pendientes', stats.pendingMatches]
      ]
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Resumen')

      // Guardar archivo
      const fileName = `tarreo-gamer-report-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
    } catch (error) {
      console.error('Error exporting to Excel:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header con botón de exportar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <BarChart3 className="h-6 w-6 mr-2" />
            Dashboard Administrativo
          </h2>
          <p className="text-gray-400">Resumen completo del sistema Tarreo Gamer</p>
        </div>
        <button
          onClick={exportToExcel}
          className="btn-primary flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </button>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-400">{stats.totalPlayers}</p>
              <p className="text-sm text-gray-300">Jugadores Registrados</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-purple-400">{stats.totalTeams}</p>
              <p className="text-sm text-gray-300">Total Equipos</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-green-400">{stats.completeTeams} completos</span>
                <span className="text-xs text-yellow-400">{stats.incompleteTeams} incompletos</span>
              </div>
            </div>
            <Gamepad2 className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-yellow-400">{stats.totalTournaments}</p>
              <p className="text-sm text-gray-300">Torneos</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-blue-400">{stats.activeTournaments} activos</span>
                <span className="text-xs text-green-400">{stats.completedTournaments} completados</span>
              </div>
            </div>
            <Trophy className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-green-400">{stats.totalMatches}</p>
              <p className="text-sm text-gray-300">Matches</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-green-400">{stats.completedMatches} completados</span>
                <span className="text-xs text-yellow-400">{stats.pendingMatches} pendientes</span>
              </div>
            </div>
            <Activity className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de jugadores por juego */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Jugadores por Juego Preferido
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={playersByGame}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de equipos por estado */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Equipos por Estado
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={teamsByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {teamsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de registros mensuales */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Registros Mensuales
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de torneos por estado */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            Torneos por Estado
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={tournamentsByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {tournamentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Resumen de acciones rápidas */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <span className="font-medium">Sistema Saludable</span>
            </div>
            <p className="text-sm text-gray-400">
              {stats.totalPlayers > 0 ? 'Todos los módulos funcionando correctamente' : 'Sistema en configuración inicial'}
            </p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
              <span className="font-medium">Equipos Incompletos</span>
            </div>
            <p className="text-sm text-gray-400">
              {stats.incompleteTeams} equipos necesitan más miembros
            </p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-blue-400 mr-2" />
              <span className="font-medium">Actividad Reciente</span>
            </div>
            <p className="text-sm text-gray-400">
              {monthlyRegistrations.length > 0 ? 
                `${monthlyRegistrations[monthlyRegistrations.length - 1]?.value || 0} registros este mes` : 
                'Sin registros recientes'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
