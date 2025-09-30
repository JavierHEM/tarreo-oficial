'use client'

import { useState } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import { Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateTeamPage() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLooking, setIsLooking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  if (!session) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!name.trim()) {
      setMessage('Error: El nombre es obligatorio')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        captain_id: session.user!.id,
        description: description || null,
        is_looking_for_players: isLooking,
      })
      .select('id')
      .single()

    if (error) {
      setMessage(`Error: ${error.message}`)
      setLoading(false)
      return
    }

    // Agregar al capitán como miembro activo
    if (data?.id) {
      await supabase.from('team_members').insert({
        team_id: data.id,
        player_id: session.user!.id,
        status: 'active',
        position: 'captain'
      })
    }

    router.push(`/teams/${data?.id}`)
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center"><Users className="h-6 w-6 mr-2 text-red-500" /> Crear Equipo</h1>
          <Link href="/teams" className="btn-secondary"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Link>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre del equipo</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Ej: INACAP Warriors" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Cuéntanos sobre tu equipo" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isLooking} onChange={(e)=>setIsLooking(e.target.checked)} />
              Buscando jugadores
            </label>
            <button className="btn-primary" disabled={loading}>Crear equipo</button>
            {message && <p className={`text-sm ${message.startsWith('Error')?'text-red-300':'text-green-300'}`}>{message}</p>}
          </form>
        </div>
      </div>
    </>
  )
}


