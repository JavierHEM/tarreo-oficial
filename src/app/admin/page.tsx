// src/app/admin/page.tsx
'use client'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState, useCallback } from 'react'
import { Profile, Game, Platform, Tournament } from '@/types/supabase'
import Navbar from '@/components/Navbar'
import { 
  Settings, 
  Users, 
  Trophy, 
  Gamepad2, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  AlertCircle,
  Swords,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import AdminDashboard from '@/components/AdminDashboard'

// Componentes temporales hasta que se implementen
const AdminOverview = () => (
  <div className="card p-6">
    <h3 className="text-xl font-bold mb-4">Resumen del Sistema</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white/5 rounded-lg p-4">
        <p className="text-sm text-gray-400">Accesos rápidos</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/admin/games" className="btn-secondary text-sm">Juegos</Link>
          <Link href="/admin/platforms" className="btn-secondary text-sm">Plataformas</Link>
          <Link href="/admin/tournaments" className="btn-secondary text-sm">Torneos</Link>
          <Link href="/admin/users" className="btn-secondary text-sm">Usuarios</Link>
        </div>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <p className="text-sm text-gray-400">Tips</p>
        <ul className="text-sm list-disc pl-5 text-gray-300">
          <li>Usa el botón Refrescar en cada sección tras cambios.</li>
          <li>Convierte un usuario en admin desde Usuarios.</li>
        </ul>
      </div>
    </div>
  </div>
)

const GamesManagement = ({ games, platforms, onRefresh }: { games: Game[], platforms: Platform[], onRefresh: () => void }) => (
  <div className="card p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-bold">Gestión de Juegos</h3>
      <button onClick={onRefresh} className="btn-secondary text-sm">Refrescar</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white/5 rounded-lg p-4">
        <p className="text-sm text-gray-400">Juegos</p>
        <p className="text-2xl font-bold">{games.length}</p>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <p className="text-sm text-gray-400">Plataformas</p>
        <p className="text-2xl font-bold">{platforms.length}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <Link href="/admin/games" className="btn-primary text-sm"><Gamepad2 className="h-4 w-4 mr-1" /> Abrir CRUD de Juegos</Link>
      <Link href="/admin/platforms" className="btn-secondary text-sm">Gestionar Plataformas</Link>
    </div>
  </div>
)

const TournamentsManagement = ({ tournaments, games, onRefresh }: { tournaments: Tournament[], games: Game[], onRefresh: () => void }) => (
  <div className="card p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-bold">Gestión de Torneos</h3>
      <button onClick={onRefresh} className="btn-secondary text-sm">Refrescar</button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white/5 rounded-lg p-4">
        <p className="text-sm text-gray-400">Torneos</p>
        <p className="text-2xl font-bold">{tournaments.length}</p>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <p className="text-sm text-gray-400">Juegos disponibles</p>
        <p className="text-2xl font-bold">{games.length}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <Link href="/admin/tournaments" className="btn-primary text-sm"><Trophy className="h-4 w-4 mr-1" /> Abrir CRUD de Torneos</Link>
    </div>
  </div>
)

const UsersManagement = () => (
  <div className="card p-6">
    <h3 className="text-xl font-bold mb-4">Gestión de Usuarios</h3>
    <p className="text-gray-300 mb-4">Próximamente: CRUD de perfiles, roles y estado.</p>
    <Link href="/admin/users" className="btn-secondary text-sm">Abrir gestión de usuarios</Link>
  </div>
)

export default function AdminPage() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Data states
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalTournaments: 0,
    activePlayers: 0
  })

  const checkAdminAccess = useCallback(async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session?.user?.id)
      .single()

    if (profileData?.role !== 'admin') {
      window.location.href = '/dashboard'
      return
    }

    setProfile(profileData)
    setLoading(false)
  }, [session?.user?.id, supabase])

  const fetchAdminData = useCallback(async () => {
    // Fetch platforms
    const { data: platformsData } = await supabase
      .from('platforms')
      .select('*')
      .order('name')
    
    if (platformsData) setPlatforms(platformsData)

    // Fetch games
    const { data: gamesData } = await supabase
      .from('games')
      .select('*, platforms(*)')
      .order('name')
    
    if (gamesData) setGames(gamesData)

    // Fetch tournaments
    const { data: tournamentsData } = await supabase
      .from('tournaments')
      .select('*, games(name, platforms(name))')
      .order('created_at', { ascending: false })
    
    if (tournamentsData) setTournaments(tournamentsData)

    // Fetch stats
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact' })

    const { count: totalTournaments } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact' })

    const { count: activePlayers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('is_looking_for_team', true)

    setStats({
      totalUsers: totalUsers || 0,
      totalTeams: totalTeams || 0,
      totalTournaments: totalTournaments || 0,
      activePlayers: activePlayers || 0
    })
  }, [supabase])

  useEffect(() => {
    if (session?.user?.id) {
      checkAdminAccess()
    }
  }, [session, checkAdminAccess])

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAdminData()
    }
  }, [profile?.role, fetchAdminData])

  if (!session || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
          <p className="text-gray-400">No tienes permisos de administrador</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Settings className="h-8 w-8 mr-3" />
            Panel de Administración
          </h1>
          <p className="text-gray-300">Gestiona el sistema del Tarreo Gamer</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-gray-400">Usuarios Totales</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTeams}</p>
                <p className="text-sm text-gray-400">Equipos</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTournaments}</p>
                <p className="text-sm text-gray-400">Torneos</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.activePlayers}</p>
                <p className="text-sm text-gray-400">Jugadores Activos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'overview', label: 'Resumen', icon: Eye },
              { id: 'games', label: 'Juegos', icon: Gamepad2 },
              { id: 'tournaments', label: 'Torneos', icon: Trophy },
              { id: 'users', label: 'Usuarios', icon: Users },
              { id: 'matches', label: 'Matches', icon: Swords },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <AdminDashboard />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <AdminOverview />
          </div>
        )}

        {activeTab === 'games' && (
          <div className="space-y-8">
            <GamesManagement 
              games={games} 
              platforms={platforms}
              onRefresh={fetchAdminData}
            />
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-8">
            <TournamentsManagement 
              tournaments={tournaments}
              games={games}
              onRefresh={fetchAdminData}
            />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            <UsersManagement />
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-8">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Gestión de Matches</h2>
                <Link href="/admin/matches" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Gestionar Matches
                </Link>
              </div>
              <p className="text-gray-400 mb-4">
                Crea partidas, registra resultados y gestiona brackets de torneos.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Funciones Disponibles</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Crear matches manualmente</li>
                    <li>• Generar brackets automáticamente</li>
                    <li>• Registrar resultados de partidas</li>
                    <li>• Gestionar estados de matches</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Acceso Rápido</h3>
                  <div className="space-y-2">
                    <Link href="/admin/matches" className="block text-red-400 hover:text-red-300 text-sm">
                      → Ir a Gestión de Matches
                    </Link>
                    <Link href="/matches" className="block text-red-400 hover:text-red-300 text-sm">
                      → Ver Matches Públicos
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
