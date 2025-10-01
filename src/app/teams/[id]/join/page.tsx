'use client'

import { useRouter, useParams } from 'next/navigation'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { useEffect, useState } from 'react'

export default function TeamJoinPage() {
  const params = useParams()
  const teamId = Number(params?.id)
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return
    
    const guard = async () => {
      // No permitir que el capitán o ya miembros/pedidos pendientes soliciten
      const { data: team } = await supabase
        .from('teams')
        .select('captain_id')
        .eq('id', teamId)
        .single()

      if (team?.captain_id === session.user?.id) {
        router.replace(`/teams/${teamId}`)
        return
      }

      const { data: isMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('player_id', session.user!.id)
        .eq('status', 'active')
        .maybeSingle()

      if (isMember) {
        router.replace(`/teams/${teamId}`)
        return
      }

      const { data: pending } = await supabase
        .from('team_join_requests')
        .select('id')
        .eq('team_id', teamId)
        .eq('player_id', session.user!.id)
        .eq('status', 'pending')
        .maybeSingle()

      if (pending) {
        router.replace(`/teams/${teamId}`)
      }
    }
    guard()
  }, [session, supabase, teamId, router])

  const handleRequest = async (e: React.FormEvent) => {
    if (!session?.user) return
    
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    console.log('Enviando solicitud de unirse al equipo:', {
      teamId,
      playerId: session.user.id,
      status: 'pending'
    })
    
    const { data, error } = await supabase.from('team_join_requests').insert({
      team_id: teamId,
      player_id: session.user.id,
      status: 'pending'
    }).select()
    
    console.log('Resultado de inserción:', { data, error })
    
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Solicitud enviada. Te avisaremos cuando el capitán responda.')
      setTimeout(()=> router.push(`/teams/${teamId}`), 1200)
    }
    setLoading(false)
  }

  if (!session) {
    return (
      <>
        <Navbar />
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card p-6 text-center">
            <p className="text-gray-300">Cargando...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-6">
          <h1 className="text-2xl font-bold mb-4">Solicitar unirse al equipo</h1>
          <p className="text-gray-300 mb-4">Confirmaremos tu interés con el capitán del equipo.</p>
          <form onSubmit={handleRequest}>
            <button className="btn-primary" disabled={loading}>{loading ? 'Enviando...' : 'Enviar solicitud'}</button>
          </form>
          {message && <p className="mt-4 text-sm">{message}</p>}
        </div>
      </div>
    </>
  )
}


