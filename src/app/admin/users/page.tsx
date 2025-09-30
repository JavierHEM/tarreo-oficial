'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import Navbar from '@/components/Navbar'
import { Profile } from '@/types/supabase'
import { AlertCircle, CheckCircle2, Edit, Search, Shield, Trash2, User } from 'lucide-react'
import Link from 'next/link'

export default function AdminUsersPage() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [users, setUsers] = useState<Profile[]>([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'gamer'>('all')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setUsers(data as any)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (session?.user) fetchUsers()
  }, [session, fetchUsers])

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
    const newRole = user.role === 'admin' ? 'gamer' : 'admin'
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id)
    if (error) setMessage(`Error: ${error.message}`)
    else {
      setMessage(`Rol actualizado a ${newRole}`)
      await fetchUsers()
    }
  }

  const handleDelete = async (user: Profile) => {
    if (!confirm(`¿Eliminar perfil de ${user.email}?`)) return
    const { error } = await supabase.from('profiles').delete().eq('id', user.id)
    if (error) setMessage(`Error: ${error.message}`)
    else {
      setMessage('Perfil eliminado')
      await fetchUsers()
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
                <div key={u.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{u.gamertag || u.full_name || u.email}</p>
                    <p className="text-sm text-gray-400">{u.email}</p>
                    <div className="text-xs mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/10">{u.role}</span>
                      {u.gamertag ? (
                        <span className="flex items-center text-green-300"><CheckCircle2 className="h-3 w-3 mr-1" /> perfil completo</span>
                      ) : (
                        <span className="flex items-center text-yellow-300"><AlertCircle className="h-3 w-3 mr-1" /> sin gamertag</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-sm" onClick={()=>handleToggleRole(u)}>
                      <Shield className="h-4 w-4 mr-1" /> {u.role==='admin' ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                    <button className="btn-secondary text-sm" onClick={()=>handleDelete(u)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                    </button>
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


