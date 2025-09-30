'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { Platform } from '@/types/supabase'
import { ArrowLeft, Cpu, Edit, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminPlatformsPage() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [formName, setFormName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const reset = () => {
    setFormName('')
    setEditingId(null)
  }

  const fetchPlatforms = useCallback(async () => {
    const { data } = await supabase.from('platforms').select('*').order('name', { ascending: true })
    if (data) setPlatforms(data as any)
  }, [supabase])

  useEffect(() => {
    if (session?.user) fetchPlatforms()
  }, [session, fetchPlatforms])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!formName.trim()) {
      setMessage('Error: El nombre es obligatorio')
      setLoading(false)
      return
    }

    const payload = { name: formName.trim() }
    let error
    if (editingId) {
      ;({ error } = await supabase.from('platforms').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('platforms').insert(payload))
    }
    if (error) setMessage(`Error: ${error.message}`)
    else {
      setMessage(editingId ? 'Plataforma actualizada' : 'Plataforma creada')
      await fetchPlatforms()
      reset()
    }
    setLoading(false)
  }

  const handleEdit = (p: Platform) => {
    setEditingId(p.id)
    setFormName(p.name)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar plataforma?')) return
    const { error } = await supabase.from('platforms').delete().eq('id', id)
    if (error) setMessage(`Error: ${error.message}`)
    else {
      setMessage('Plataforma eliminada')
      await fetchPlatforms()
    }
  }

  if (!session) return null

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Cpu className="h-6 w-6 mr-2 text-red-500" /> Mantenedor de Plataformas
          </h1>
          <Link href="/admin" className="btn-secondary"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-semibold mb-4">{editingId ? 'Editar Plataforma' : 'Crear Plataforma'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Ej: PC, PlayStation, Xbox"
                />
              </div>
              <div className="flex gap-2">
                <button className="btn-primary" disabled={loading}><Plus className="h-4 w-4 mr-1" /> {editingId ? 'Guardar Cambios' : 'Crear'}</button>
                {editingId && <button type="button" className="btn-secondary" onClick={reset}>Cancelar</button>}
              </div>
            </form>
            {message && <p className={`mt-4 text-sm ${message.startsWith('Error') ? 'text-red-300' : 'text-green-300'}`}>{message}</p>}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold mb-4">Plataformas ({platforms.length})</h2>
            {platforms.length === 0 ? (
              <p className="text-gray-400">No hay plataformas.</p>
            ) : (
              <div className="space-y-2">
                {platforms.map((p) => (
                  <div key={p.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                    <p className="font-medium">{p.name}</p>
                    <div className="flex gap-2">
                      <button className="btn-secondary text-sm" onClick={() => handleEdit(p)}><Edit className="h-4 w-4 mr-1" /> Editar</button>
                      <button className="btn-secondary text-sm" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 mr-1" /> Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}


