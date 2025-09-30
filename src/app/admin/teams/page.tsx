'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { Team, Profile } from '@/types/supabase'
import { Users, Edit, Plus, Trash2, ArrowLeft, Crown } from 'lucide-react'
import Link from 'next/link'

export default function AdminTeamsPage() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [teams, setTeams] = useState<Team[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [form, setForm] = useState({
    name: '',
    captain_id: '',
    description: '',
    is_looking_for_players: false,
  })

  const reset = () => {
    setForm({ name: '', captain_id: '', description: '', is_looking_for_players: false })
    setEditingId(null)
  }

  const fetchData = useCallback(async () => {
    const [{ data: teamsData }, { data: profilesData }] = await Promise.all([
      supabase.from('teams').select('*, captain:profiles!teams_captain_id_fkey(full_name, gamertag, id)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, gamertag').order('full_name', { ascending: true })
    ])
    if (teamsData) setTeams(teamsData as any)
    if (profilesData) setProfiles(profilesData as any)
  }, [supabase])

  useEffect(() => {
    if (session?.user) fetchData()
  }, [session, fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!form.name.trim() || !form.captain_id) {
      setMessage('Error: nombre y capitán son obligatorios')
      setLoading(false)
      return
    }

    const payload: any = {
      name: form.name.trim(),
      captain_id: form.captain_id,
      description: form.description || null,
      is_looking_for_players: !!form.is_looking_for_players,
    }

    let error
    if (editingId) {
      ;({ error } = await supabase.from('teams').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('teams').insert(payload))
    }
    if (error) setMessage(`Error: ${error.message}`)
    else {
      await fetchData()
      setMessage(editingId ? 'Equipo actualizado' : 'Equipo creado')
      reset()
    }
    setLoading(false)
  }

  const handleEdit = (t: Team) => {
    setEditingId(t.id)
    setForm({
      name: t.name,
      captain_id: t.captain_id,
      description: t.description || '',
      is_looking_for_players: t.is_looking_for_players,
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar equipo?')) return
    const { error } = await supabase.from('teams').delete().eq('id', id)
    if (error) setMessage(`Error: ${error.message}`)
    else {
      await fetchData()
      setMessage('Equipo eliminado')
    }
  }

  if (!session) return null

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Users className="h-6 w-6 mr-2 text-red-500" /> Mantenedor de Equipos
          </h1>
          <Link href="/admin" className="btn-secondary"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 order-2 lg:order-1">
            <h2 className="font-semibold mb-4">{editingId ? 'Editar Equipo' : 'Crear Equipo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500" value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Capitán</label>
                <select className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500" value={form.captain_id} onChange={(e)=>setForm(f=>({...f,captain_id:e.target.value}))}>
                  <option value="">Selecciona...</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.gamertag || p.full_name || p.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <textarea rows={3} className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500" value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_looking_for_players} onChange={(e)=>setForm(f=>({...f,is_looking_for_players:e.target.checked}))} />
                Buscando jugadores
              </label>
              <div className="flex gap-2">
                <button className="btn-primary" disabled={loading}><Plus className="h-4 w-4 mr-1" /> {editingId? 'Guardar Cambios' : 'Crear Equipo'}</button>
                {editingId && <button type="button" className="btn-secondary" onClick={reset}>Cancelar</button>}
              </div>
            </form>
            {message && <p className={`mt-4 text-sm ${message.startsWith('Error') ? 'text-red-300' : 'text-green-300'}`}>{message}</p>}
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Equipos ({teams.length})</h2>
                <button className="btn-secondary text-sm" onClick={fetchData}>Refrescar</button>
              </div>
              {teams.length === 0 ? (
                <p className="text-gray-400">No hay equipos.</p>
              ) : (
                <div className="space-y-2">
                  {teams.map(t => (
                    <div key={t.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium flex items-center">{t.name}{' '}{t.captain_id === session?.user?.id && <Crown className="h-4 w-4 text-yellow-400 ml-2" />}</p>
                        <p className="text-sm text-gray-400">Capitán: {t.captain?.gamertag || t.captain?.full_name || t.captain_id}</p>
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


