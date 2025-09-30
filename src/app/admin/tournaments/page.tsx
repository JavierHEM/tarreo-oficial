'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { Game, Tournament } from '@/types/supabase'
import { Calendar, Edit, Plus, Trash2, Trophy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminTournamentsPage() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [games, setGames] = useState<Game[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [form, setForm] = useState({
    name: '',
    game_id: 0,
    status: 'registration_open' as Tournament['status'],
    registration_start: '',
    registration_end: '',
    max_teams: 16,
    description: ''
  })

  const reset = () => {
    setForm({ name: '', game_id: 0, status: 'registration_open', registration_start: '', registration_end: '', max_teams: 16, description: '' })
    setEditingId(null)
  }

  const fetchData = useCallback(async () => {
    const [{ data: gamesData }, { data: tourneysData }] = await Promise.all([
      supabase.from('games').select('id, name').order('name', { ascending: true }),
      supabase.from('tournaments').select('*').order('created_at', { ascending: false })
    ])
    if (gamesData) setGames(gamesData as any)
    if (tourneysData) setTournaments(tourneysData as any)
  }, [supabase])

  useEffect(() => {
    if (session?.user) fetchData()
  }, [session, fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!form.name.trim()) {
      setMessage('Error: Nombre requerido')
      setLoading(false)
      return
    }
    if (!form.game_id) {
      setMessage('Error: Selecciona un juego')
      setLoading(false)
      return
    }

    const payload: any = {
      name: form.name.trim(),
      game_id: Number(form.game_id),
      status: form.status,
      registration_start: form.registration_start || null,
      registration_end: form.registration_end || null,
      max_teams: Number(form.max_teams) || null,
      description: form.description || null,
      created_by: session?.user?.id || ''
    }

    let error
    if (editingId) {
      ;({ error } = await supabase.from('tournaments').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('tournaments').insert(payload))
    }

    if (error) setMessage(`Error: ${error.message}`)
    else {
      await fetchData()
      setMessage(editingId ? 'Torneo actualizado' : 'Torneo creado')
      reset()
    }
    setLoading(false)
  }

  const handleEdit = (t: Tournament) => {
    setEditingId(t.id)
    setForm({
      name: t.name,
      game_id: t.game_id,
      status: t.status,
      registration_start: t.registration_start || '',
      registration_end: t.registration_end || '',
      max_teams: t.max_teams || 16,
      description: t.description || ''
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar torneo?')) return
    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (error) setMessage(`Error: ${error.message}`)
    else {
      await fetchData()
      setMessage('Torneo eliminado')
    }
  }

  if (!session) return null

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-red-500" /> Mantenedor de Torneos
          </h1>
          <Link href="/admin" className="btn-secondary"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 order-2 lg:order-1">
            <h2 className="font-semibold mb-4">{editingId ? 'Editar Torneo' : 'Crear Torneo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500" value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Juego</label>
                <select className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500" value={form.game_id} onChange={(e)=>setForm(f=>({...f,game_id:Number(e.target.value)}))}>
                  <option value={0}>Selecciona...</option>
                  {games.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <select className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500" value={form.status} onChange={(e)=>setForm(f=>({...f,status:e.target.value as Tournament['status']}))}>
                  <option value="registration_open">Inscripciones abiertas</option>
                  <option value="registration_closed">Inscripciones cerradas</option>
                  <option value="online_phase">Fase online</option>
                  <option value="presencial_phase">Fase presencial</option>
                  <option value="finished">Finalizado</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Inicio inscripciones</label>
                  <input type="datetime-local" className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500" value={form.registration_start} onChange={(e)=>setForm(f=>({...f,registration_start:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fin inscripciones</label>
                  <input type="datetime-local" className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500" value={form.registration_end} onChange={(e)=>setForm(f=>({...f,registration_end:e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Equipos máximos</label>
                <input type="number" min={2} className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500" value={form.max_teams} onChange={(e)=>setForm(f=>({...f,max_teams:Number(e.target.value)}))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <textarea rows={3} className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500" value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} />
              </div>

              <button className="btn-primary" disabled={loading}><Plus className="h-4 w-4 mr-1" /> {editingId? 'Guardar Cambios' : 'Crear Torneo'}</button>
            </form>
            {message && <p className={`mt-4 text-sm ${message.startsWith('Error') ? 'text-red-300' : 'text-green-300'}`}>{message}</p>}
          </div>

          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Torneos ({tournaments.length})</h2>
                <button onClick={fetchData} className="btn-secondary text-sm">Refrescar</button>
              </div>
              {tournaments.length === 0 ? (
                <p className="text-gray-400">No hay torneos aún.</p>
              ) : (
                <div className="space-y-2">
                  {tournaments.map(t => (
                    <div key={t.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-sm text-gray-400">Estado: {t.status} • Máx. {t.max_teams || '—'} equipos</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-secondary text-sm" onClick={()=>handleEdit(t)}><Edit className="h-4 w-4 mr-1" /> Editar</button>
                        <button className="btn-secondary text-sm" onClick={()=>handleDelete(t.id)}><Trash2 className="h-4 w-4 mr-1" /> Eliminar</button>
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


