'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Gamepad2, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Game, Platform } from '@/types/supabase'

export default function AdminGamesPage() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [games, setGames] = useState<Game[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isEditingId, setIsEditingId] = useState<number | null>(null)

  const [form, setForm] = useState({
    name: '',
    platform_id: 0,
    max_team_size: 5,
  })

  const resetForm = () => {
    setForm({ name: '', platform_id: 0, max_team_size: 5 })
    setIsEditingId(null)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: platformsData }, { data: gamesData }] = await Promise.all([
      supabase.from('platforms').select('*').order('name', { ascending: true }),
      supabase
        .from('games')
        .select('*, platforms:platforms(*)')
        .order('created_at', { ascending: false }),
    ])

    if (platformsData) setPlatforms(platformsData as any)
    if (gamesData) setGames((gamesData as any).map((g: any) => ({
      id: g.id,
      name: g.name,
      platform_id: g.platform_id,
      max_team_size: g.max_team_size,
      created_at: g.created_at,
      platform: g.platforms ? { id: g.platforms.id, name: g.platforms.name, created_at: g.platforms.created_at } : undefined,
    })))
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (session?.user) fetchData()
  }, [session, fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!form.name.trim()) {
      setMessage('Error: El nombre del juego es obligatorio')
      setLoading(false)
      return
    }
    if (!form.platform_id) {
      setMessage('Error: Debes seleccionar una plataforma')
      setLoading(false)
      return
    }

    const payload = {
      name: form.name.trim(),
      platform_id: Number(form.platform_id),
      max_team_size: Number(form.max_team_size) || 5,
    }

    let error
    if (isEditingId) {
      ;({ error } = await supabase.from('games').update(payload).eq('id', isEditingId))
    } else {
      ;({ error } = await supabase.from('games').insert(payload))
    }

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      await fetchData()
      resetForm()
      setMessage(isEditingId ? 'Juego actualizado' : 'Juego creado')
    }
    setLoading(false)
  }

  const handleEdit = (game: Game) => {
    setIsEditingId(game.id)
    setForm({
      name: game.name,
      platform_id: game.platform_id,
      max_team_size: game.max_team_size,
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este juego?')) return
    setLoading(true)
    const { error } = await supabase.from('games').delete().eq('id', id)
    if (error) setMessage(`Error: ${error.message}`)
    else {
      setMessage('Juego eliminado')
      await fetchData()
    }
    setLoading(false)
  }

  if (!session) return null

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Gamepad2 className="h-6 w-6 mr-2 text-red-500" />
            Mantenedor de Juegos
          </h1>
          <Link href="/admin" className="btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver al Admin
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="card p-6 order-2 lg:order-1">
            <h2 className="font-semibold mb-4">{isEditingId ? 'Editar Juego' : 'Crear Juego'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Ej: Valorant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Plataforma</label>
                <select
                  value={form.platform_id}
                  onChange={(e) => setForm((f) => ({ ...f, platform_id: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value={0}>Selecciona...</option>
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tamaño máximo de equipo</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.max_team_size}
                  onChange={(e) => setForm((f) => ({ ...f, max_team_size: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                  <Plus className="h-4 w-4 mr-1" /> {isEditingId ? 'Guardar Cambios' : 'Crear Juego'}
                </button>
                {isEditingId && (
                  <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
                )}
              </div>
            </form>
            {message && (
              <p className={`mt-4 text-sm ${message.startsWith('Error') ? 'text-red-300' : 'text-green-300'}`}>{message}</p>
            )}
          </div>

          {/* Listado */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Juegos ({games.length})</h2>
                <button onClick={fetchData} className="btn-secondary text-sm">Refrescar</button>
              </div>

              {games.length === 0 ? (
                <p className="text-gray-400">No hay juegos registrados.</p>
              ) : (
                <div className="space-y-2">
                  {games.map((game) => (
                    <div key={game.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{game.name}</p>
                        <p className="text-sm text-gray-400">{platforms.find((p) => p.id === game.platform_id)?.name} • {game.max_team_size} jugadores</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(game)} className="btn-secondary text-sm"><Edit className="h-4 w-4 mr-1" /> Editar</button>
                        <button onClick={() => handleDelete(game.id)} className="btn-secondary text-sm"><Trash2 className="h-4 w-4 mr-1" /> Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


