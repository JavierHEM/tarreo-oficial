'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { useNotifications } from '@/components/NotificationProvider'
import { Save, ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'

interface ProfileForm {
  email: string
  full_name: string
  gamertag: string
  preferred_games: string[]
  preferred_position: string
  available_schedule: string
  bio: string
  is_looking_for_team: boolean
}

const ALL_GAMES = [
  'Valorant',
  'League of Legends',
  'Fortnite',
  'Overwatch 2',
  'Age of Empires 2',
  'Rocket League',
  'Mortal Kombat 11',
  'EA SPORTS FC',
  'Mario Kart',
  'UNO',
  'Mitos y Leyendas'
]

export default function ProfilePage() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const { showNotification } = useNotifications()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileForm | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (data) {
      setProfile({
        email: data.email || session.user.email || '',
        full_name: data.full_name || '',
        gamertag: data.gamertag || '',
        preferred_games: data.preferred_games || [],
        preferred_position: data.preferred_position || '',
        available_schedule: data.available_schedule || '',
        bio: data.bio || '',
        is_looking_for_team: !!data.is_looking_for_team
      })
    }
    setLoading(false)
  }, [session?.user?.id, session?.user?.email, supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  if (!session) return null

  const handleToggleGame = (game: string) => {
    if (!profile) return
    const hasGame = profile.preferred_games.includes(game)
    const next = hasGame
      ? profile.preferred_games.filter((g) => g !== game)
      : [...profile.preferred_games, game]
    setProfile({ ...profile, preferred_games: next })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!profile.gamertag || profile.gamertag.trim().length < 3) {
      showNotification({ type: 'error', title: 'Validación', message: 'El gamertag debe tener al menos 3 caracteres.' })
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name || profile.gamertag,
        gamertag: profile.gamertag,
        preferred_games: profile.preferred_games,
        preferred_position: profile.preferred_position || null,
        available_schedule: profile.available_schedule || null,
        bio: profile.bio || null,
        is_looking_for_team: profile.is_looking_for_team,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)

    if (error) {
      showNotification({ type: 'error', title: 'Error al guardar', message: error.message })
    } else {
      showNotification({ type: 'success', title: 'Perfil actualizado', message: 'Tus cambios se guardaron correctamente.' })
      fetchProfile()
    }
    setSaving(false)
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="btn-secondary"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-gray-300">Gestiona tu información para que los equipos te encuentren</p>
        </div>

        {loading || !profile ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto"></div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="card p-6">
              <h2 className="font-semibold mb-4">Información básica</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Correo</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gamertag</label>
                  <input
                    type="text"
                    value={profile.gamertag}
                    onChange={(e) => setProfile({ ...profile, gamertag: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Disponibilidad</label>
                  <input
                    type="text"
                    placeholder="Ej: Lunes a Viernes, 19:00 - 22:00"
                    value={profile.available_schedule}
                    onChange={(e) => setProfile({ ...profile, available_schedule: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-semibold mb-4">Preferencias de juego</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Juegos preferidos</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_GAMES.map((game) => {
                      const active = profile.preferred_games.includes(game)
                      return (
                        <button
                          type="button"
                          key={game}
                          onClick={() => handleToggleGame(game)}
                          className={`px-3 py-1 rounded text-sm border ${active ? 'bg-red-500/20 border-red-500/30 text-red-200' : 'bg-white/5 border-white/20 text-white'}`}
                        >
                          {game}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Posición preferida</label>
                  <input
                    type="text"
                    placeholder="Ej: Mid, Duelist, Support"
                    value={profile.preferred_position}
                    onChange={(e) => setProfile({ ...profile, preferred_position: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-semibold mb-4">Visibilidad</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-300">
                  <Users className="h-4 w-4 mr-2" />
                  Aparecer en "Buscar jugadores"
                </div>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, is_looking_for_team: !profile.is_looking_for_team })}
                  className={`px-4 py-2 rounded text-sm font-medium ${profile.is_looking_for_team ? 'bg-green-500/20 text-green-200' : 'bg-white/10 text-white'}`}
                >
                  {profile.is_looking_for_team ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link href="/dashboard" className="btn-secondary">Cancelar</Link>
              <button type="submit" disabled={saving} className="btn-primary inline-flex items-center">
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar cambios
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}


