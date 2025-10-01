'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { Profile } from '@/types/supabase'
import { AlertCircle, CheckCircle2, Edit, Search, Shield, Trash2, User, Crown } from 'lucide-react'
import Link from 'next/link'

export default function AdminUsersPage() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [users, setUsers] = useState<Profile[]>([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'gamer'>('all')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setUsers(data as any)
    setLoading(false)
  }, [supabase])

  const fetchCurrentUserProfile = useCallback(async () => {
    if (!session?.user?.id) return
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    setCurrentUserProfile(data)
  }, [session?.user?.id, supabase])

  useEffect(() => {
    if (session?.user) {
      fetchUsers()
      fetchCurrentUserProfile()
    }
  }, [session, fetchUsers, fetchCurrentUserProfile])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const q = query.toLowerCase()
      const matchesQuery = !q ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.gamertag && u.gamertag.toLowerCase().includes(q)) ||
        (u.full_name && u.full_name.toLowerCase().includes(q))
      return matchesRole && matchesQuery
    })
  }, [users, query, roleFilter])

  const handleToggleRole = async (user: Profile) => {
    // Validación especial para javier@inacapmail.cl
    if (user.email === 'javier@inacapmail.cl' && user.role === 'admin') {
      setMessage('¡Que te habrás imaginado insecto! YO SOY DIOS AQUÍ 🦗')
      return
    }
    
    const newRole = user.role === 'admin' ? 'gamer' : 'admin'
    console.log('Intentando cambiar rol:', { userId: user.id, currentRole: user.role, newRole })
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id)
      .select()
    
    console.log('Resultado de la actualización:', { data, error })
    
    if (error) {
      console.error('Error detallado:', error)
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage(`Rol actualizado a ${newRole}`)
      await fetchUsers()
    }
  }

  const handleDelete = async (user: Profile) => {
    // Validación especial para javier@inacapmail.cl
    if (user.email === 'javier@inacapmail.cl') {
      setMessage('¡Que te habrás imaginado insecto! YO SOY DIOS AQUÍ 🦗')
      return
    }
    
    // Si el usuario es admin, primero quitar el rol de admin
    if (user.role === 'admin') {
      const confirmRemoveAdmin = confirm(`El usuario ${user.email} es administrador. ¿Quieres quitarle el rol de admin y luego eliminarlo?`)
      if (!confirmRemoveAdmin) return
      
      // Primero quitar el rol de admin
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'gamer' })
        .eq('id', user.id)
      
      if (roleError) {
        setMessage(`Error al quitar rol de admin: ${roleError.message}`)
        return
      }
    }
    
    const confirmDelete = confirm(`¿Eliminar perfil de ${user.email}? Esta acción no se puede deshacer.`)
    if (!confirmDelete) return
    
    try {
      // Eliminar registros relacionados primero
      
      // 1. Eliminar miembros de equipos
      const { error: teamMembersError } = await supabase
        .from('team_members')
        .delete()
        .eq('player_id', user.id)
      
      if (teamMembersError) {
        console.error('Error eliminando miembros de equipos:', teamMembersError)
      }
      
      // 2. Eliminar solicitudes de equipos
      const { error: teamRequestsError } = await supabase
        .from('team_join_requests')
        .delete()
        .eq('player_id', user.id)
      
      if (teamRequestsError) {
        console.error('Error eliminando solicitudes de equipos:', teamRequestsError)
      }
      
      // 3. Eliminar mensajes de chat
      const { error: messagesError } = await supabase
        .from('team_messages')
        .delete()
        .eq('sender_id', user.id)
      
      if (messagesError) {
        console.error('Error eliminando mensajes:', messagesError)
      }
      
      // 4. Eliminar mensajes de contacto
      const { error: contactsError } = await supabase
        .from('player_contacts')
        .delete()
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      
      if (contactsError) {
        console.error('Error eliminando contactos:', contactsError)
      }
      
      // 5. Finalmente, eliminar el perfil
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)
      
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Usuario eliminado exitosamente')
        await fetchUsers()
      }
    } catch (error: any) {
      setMessage(`Error inesperado: ${error.message}`)
    }
  }

  if (!session) return null

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <User className="h-6 w-6 mr-2 text-red-500" /> Gestión de Usuarios
          </h1>
          <Link href="/admin" className="btn-secondary">Volver</Link>
        </div>

        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="Buscar por email, gamertag o nombre"
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <select value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value as any)} className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg">
                <option value="all">Todos los roles</option>
                <option value="gamer">Gamers</option>
                <option value="admin">Administradores</option>
              </select>
            </div>
            <button className="btn-secondary" onClick={fetchUsers}>Refrescar</button>
          </div>
        </div>

        <div className="card p-6">
          {filtered.length === 0 ? (
            <p className="text-gray-400">No hay usuarios que coincidan con el filtro.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((u) => (
                <div key={u.id} className={`bg-white/5 rounded-lg p-4 flex items-center justify-between ${u.email === 'javier@inacapmail.cl' ? 'border-2 border-yellow-500/50 bg-yellow-500/10' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{u.gamertag || u.full_name || u.email}</p>
                      {u.email === 'javier@inacapmail.cl' && (
                        <div title="Super Admin - Protegido">
                          <Crown className="h-4 w-4 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{u.email}</p>
                    <div className="text-xs mt-1 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded ${u.email === 'javier@inacapmail.cl' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/10'}`}>
                        {u.role} {u.email === 'javier@inacapmail.cl' ? '(PROTEGIDO)' : ''}
                      </span>
                      {u.gamertag ? (
                        <span className="flex items-center text-green-300"><CheckCircle2 className="h-3 w-3 mr-1" /> perfil completo</span>
                      ) : (
                        <span className="flex items-center text-yellow-300"><AlertCircle className="h-3 w-3 mr-1" /> sin gamertag</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {currentUserProfile?.role === 'admin' && (
                      <>
                        <button className="btn-secondary text-sm" onClick={()=>handleToggleRole(u)}>
                          <Shield className="h-4 w-4 mr-1" /> {u.role==='admin' ? 'Quitar admin' : 'Hacer admin'}
                        </button>
                        <button className="btn-secondary text-sm" onClick={()=>handleDelete(u)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                        </button>
                      </>
                    )}
                    {currentUserProfile?.role !== 'admin' && (
                      <span className="text-sm text-gray-400">Solo administradores pueden gestionar usuarios</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}


