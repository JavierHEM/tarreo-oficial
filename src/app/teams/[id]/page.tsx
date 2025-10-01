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
    
    const confirmLeave = confirm('¿Estás seguro de que quieres abandonar este equipo?')
    if (!confirmLeave) return
    
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', id)
      .eq('player_id', session.user!.id)
    
    if (!error) {
      setMessage('Has abandonado el equipo exitosamente')
      showNotification({
        type: 'success',
        title: 'Equipo abandonado',
        message: 'Has salido del equipo correctamente'
      })
      setTimeout(() => router.push('/teams'), 1500)
    } else {
      setMessage(`Error: ${error.message}`)
    }
  }

  const handleKickMember = async (memberId: string, memberGamertag: string) => {
    if (!isCaptain) return
    
    const confirmKick = confirm(`¿Estás seguro de que quieres expulsar a ${memberGamertag} del equipo?`)
    if (!confirmKick) return
    
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', id)
      .eq('player_id', memberId)
    
    if (!error) {
      setMessage(`${memberGamertag} ha sido expulsado del equipo`)
      showNotification({
        type: 'success',
        title: 'Miembro expulsado',
        message: `${memberGamertag} ha sido removido del equipo`
      })
      fetchData() // Refrescar datos
    } else {
      setMessage(`Error: ${error.message}`)
    }
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

  const handleDeleteTeam = async () => {
    if (!isCaptain) return
    
    // Verificar que no hay miembros activos
    if (members.length > 1) { // Más de 1 porque el capitán cuenta como miembro
      showNotification({
        type: 'error',
        title: 'No se puede eliminar el equipo',
        message: 'Debes expulsar a todos los miembros antes de eliminar el equipo'
      })
      return
    }
    
    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar el equipo "${team?.name}"? Esta acción no se puede deshacer y eliminará todos los datos del equipo.`)
    if (!confirmDelete) return
    
    try {
      // 1. Eliminar todos los miembros del equipo (por si acaso)
      const { error: membersError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', id)
      
      if (membersError) {
        showNotification({
          type: 'error',
          title: 'Error al eliminar miembros',
          message: membersError.message
        })
        return
      }
      
      // 2. Eliminar solicitudes de ingreso
      const { error: requestsError } = await supabase
        .from('team_join_requests')
        .delete()
        .eq('team_id', id)
      
      if (requestsError) {
        console.error('Error eliminando solicitudes:', requestsError)
        // No bloquear por este error
      }
      
      // 3. Eliminar mensajes del chat del equipo
      const { error: messagesError } = await supabase
        .from('team_messages')
        .delete()
        .eq('team_id', id)
      
      if (messagesError) {
        console.error('Error eliminando mensajes:', messagesError)
        // No bloquear por este error
      }
      
      // 4. Eliminar registros de torneos
      const { error: registrationsError } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('team_id', id)
      
      if (registrationsError) {
        console.error('Error eliminando registros:', registrationsError)
        // No bloquear por este error
      }
      
      // 5. Finalmente, eliminar el equipo
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)
      
      if (teamError) {
        showNotification({
          type: 'error',
          title: 'Error al eliminar equipo',
          message: teamError.message
        })
        return
      }
      
      showNotification({
        type: 'success',
        title: 'Equipo eliminado',
        message: `El equipo "${team?.name}" ha sido eliminado exitosamente`
      })
      
      // Redirigir al dashboard
      router.push('/dashboard')
      
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error inesperado',
        message: error.message || 'Ocurrió un error al eliminar el equipo'
      })
    }
  }

  const handleTransferCaptaincy = async (newCaptainId: string, newCaptainGamertag: string) => {
    if (!isCaptain) return
    
    const confirmTransfer = confirm(`¿Estás seguro de que quieres transferir la capitanía a ${newCaptainGamertag}? Esta acción no se puede deshacer.`)
    if (!confirmTransfer) return
    
    // Actualizar el capitán del equipo
    const { error: teamError } = await supabase
      .from('teams')
      .update({ captain_id: newCaptainId })
      .eq('id', id)
    
    if (teamError) {
      setMessage(`Error: ${teamError.message}`)
      return
    }
    
    // Actualizar posiciones en team_members
    const { error: membersError } = await supabase
      .from('team_members')
      .update({ position: 'member' })
      .eq('team_id', id)
      .eq('position', 'captain')
    
    if (membersError) {
      setMessage(`Error: ${membersError.message}`)
      return
    }
    
    // Hacer al nuevo capitán
    const { error: newCaptainError } = await supabase
      .from('team_members')
      .update({ position: 'captain' })
      .eq('team_id', id)
      .eq('player_id', newCaptainId)
    
    if (newCaptainError) {
      setMessage(`Error: ${newCaptainError.message}`)
      return
    }
    
    setMessage(`Capitanía transferida a ${newCaptainGamertag}`)
    showNotification({
      type: 'success',
      title: 'Capitanía transferida',
      message: `${newCaptainGamertag} es ahora el nuevo capitán del equipo`
    })
    
    // Redirigir después de un momento
    setTimeout(() => {
      router.push('/teams')
    }, 2000)
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
                <div className="space-y-3">
                  {members.map((m) => {
                    const isCurrentUser = m.player_id === session?.user?.id
                    const isMember = m.position === 'member'
                    const isCaptainMember = m.position === 'captain'
                    
                    return (
                      <div key={m.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">
                                {m.player?.gamertag || m.player?.full_name}
                              </span>
                              {isCaptainMember && (
                                <Crown className="h-4 w-4 ml-2 text-yellow-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              {isCaptainMember ? 'Capitán' : 'Miembro'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {/* Botón para abandonar equipo (solo para miembros) */}
                          {isCurrentUser && isMember && (
                            <button
                              onClick={handleLeave}
                              className="btn-secondary text-sm text-red-300 hover:bg-red-500/20"
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Abandonar
                            </button>
                          )}
                          
                          {/* Botones para capitán */}
                          {isCaptain && !isCurrentUser && (
                            <>
                              <button
                                onClick={() => handleKickMember(m.player_id, m.player?.gamertag || m.player?.full_name)}
                                className="btn-secondary text-sm text-red-300 hover:bg-red-500/20"
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Expulsar
                              </button>
                              {isMember && (
                                <button
                                  onClick={() => handleTransferCaptaincy(m.player_id, m.player?.gamertag || m.player?.full_name)}
                                  className="btn-secondary text-sm text-yellow-300 hover:bg-yellow-500/20"
                                >
                                  <Crown className="h-4 w-4 mr-1" /> Hacer Capitán
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
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

            {/* Acciones del Capitán */}
            {isCaptain && (
              <div className="card p-6 border-red-500/30">
                <h3 className="text-lg font-semibold mb-4 text-red-400 flex items-center">
                  <Crown className="h-5 w-5 mr-2" />
                  Acciones del Capitán
                </h3>
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h4 className="font-medium text-red-300 mb-2">⚠️ Eliminar Equipo</h4>
                    <p className="text-sm text-gray-300 mb-3">
                      Esta acción eliminará permanentemente el equipo y todos sus datos. 
                      Asegúrate de haber expulsado a todos los miembros antes de proceder.
                    </p>
                    <button
                      onClick={handleDeleteTeam}
                      className="btn-primary bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Equipo
                    </button>
                  </div>
                </div>
              </div>
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


