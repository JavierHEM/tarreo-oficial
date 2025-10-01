'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Users, ArrowLeft, Crown, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'
import TeamChat from '@/components/TeamChat'

export default function TeamDetailPage() {
  const params = useParams()
  const id = Number(params?.id)
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()
  const { showNotification } = useNotifications()

  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: teamData } = await supabase
      .from('teams')
      .select('*, captain:profiles!teams_captain_id_fkey(full_name, gamertag, id)')
      .eq('id', id)
      .single()

    const { data: membersData } = await supabase
      .from('team_members')
      .select('*, player:profiles!team_members_player_id_fkey(full_name, gamertag, id)')
      .eq('team_id', id)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })

    const { data: requestsData, error: requestsError } = await supabase
      .from('team_join_requests')
      .select('*, player:profiles!team_join_requests_player_id_fkey(full_name, gamertag, id)')
      .eq('team_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    console.log('Team Join Requests Query:', {
      teamId: id,
      requestsData,
      requestsError,
      requestsCount: requestsData?.length || 0
    })

    if (teamData) setTeam(teamData)
    if (membersData) setMembers(membersData as any)
    if (requestsData) {
      console.log('Setting requests state:', requestsData)
      setRequests(requestsData as any)
    } else {
      console.log('No requests data received, setting empty array')
      setRequests([])
    }
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    if (id) fetchData()
  }, [id, fetchData])

  if (!session) return null

  const isCaptain = team?.captain_id === session.user?.id
  
  console.log('Render - Current state:', {
    teamId: id,
    requestsCount: requests.length,
    requests: requests,
    isCaptain,
    loading
  })

  const handleLeave = async () => {
    if (isCaptain) {
      alert('El capitán no puede abandonar su equipo. Transfiere la capitanía o elimina el equipo.')
      return
    }
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', id)
      .eq('player_id', session.user!.id)
    if (!error) router.push('/teams')
  }

  const handleAcceptRequest = async (requestId: number, playerId: string) => {
    console.log('Aceptando solicitud:', {
      requestId,
      playerId,
      teamId: id,
      currentUserId: session?.user?.id,
      isCaptain: team?.captain_id === session?.user?.id
    })

    // Agregar como miembro activo
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: id,
        player_id: playerId,
        status: 'active',
        position: 'member'
      })
      .select()

    console.log('Resultado de inserción en team_members:', { memberData, memberError })

    if (memberError) {
      setMessage(`Error: ${memberError.message}`)
      return
    }

    // Marcar solicitud como aceptada
    const { error: requestError } = await supabase
      .from('team_join_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (requestError) {
      setMessage(`Error: ${requestError.message}`)
      return
    }

    setMessage('Solicitud aceptada')
    showNotification({
      type: 'success',
      title: 'Solicitud aceptada',
      message: 'El jugador se ha unido al equipo'
    })
    fetchData() // Refrescar datos
  }

  const handleRejectRequest = async (requestId: number) => {
    const { error } = await supabase
      .from('team_join_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)

    if (error) {
      setMessage(`Error: ${error.message}`)
      return
    }

    setMessage('Solicitud rechazada')
    showNotification({
      type: 'info',
      title: 'Solicitud rechazada',
      message: 'La solicitud ha sido rechazada'
    })
    fetchData() // Refrescar datos
  }

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/teams" className="btn-secondary"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Link>
        </div>

        {loading || !team ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center">
                    {team.name}
                    {isCaptain && <Crown className="h-5 w-5 text-yellow-400 ml-2" />}
                  </h1>
                  <p className="text-sm text-gray-400">Capitán: {team.captain?.gamertag || team.captain?.full_name}</p>
                </div>
                {!isCaptain && (
                  <button onClick={handleLeave} className="btn-secondary text-sm"><Trash2 className="h-4 w-4 mr-1" /> Salir del equipo</button>
                )}
              </div>
              {team.description && <p className="mt-4 text-gray-300">{team.description}</p>}

              {isCaptain && (
                <div className="mt-4 flex gap-2">
                  <Link href={`/teams/${id}/recruit`} className="btn-secondary text-sm">Reclutar jugadores</Link>
                  <a href="#requests" className="btn-secondary text-sm inline-flex items-center">
                    Ver solicitudes
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded ${requests.length>0 ? 'bg-red-500/30 text-red-200' : 'bg-white/10 text-gray-200'}`}>
                      {requests.length}
                    </span>
                  </a>
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="font-semibold mb-4 flex items-center"><Users className="h-5 w-5 mr-2" /> Miembros</h2>
              {members.length === 0 ? (
                <p className="text-gray-400">No hay miembros.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <span key={m.id} className="bg-white/10 px-3 py-1 rounded text-sm">
                      {m.player?.gamertag || m.player?.full_name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isCaptain && (
              <div id="requests" className="card p-6">
                <h2 className="font-semibold mb-4">Solicitudes Pendientes</h2>
                {requests.length === 0 ? (
                  <p className="text-gray-400">No hay solicitudes por ahora.</p>
                ) : (
                  <div className="space-y-3">
                    {requests.map((request) => (
                      <div key={request.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{request.player?.gamertag || request.player?.full_name}</p>
                          <p className="text-sm text-gray-400">{request.player?.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id, request.player_id)}
                            className="btn-secondary text-sm text-green-300 hover:bg-green-500/20"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Aceptar
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="btn-secondary text-sm text-red-300 hover:bg-red-500/20"
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat del equipo */}
            {session && (
              <TeamChat 
                teamId={id} 
                teamName={team?.name || ''} 
                isCaptain={isCaptain} 
              />
            )}

            {message && (
              <div className="card p-4">
                <p className={`text-sm ${message.includes('Error') ? 'text-red-300' : 'text-green-300'}`}>
                  {message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}


