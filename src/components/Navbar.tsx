// src/components/Navbar.tsx
'use client'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Profile } from '@/types/supabase'
import { Menu, X, Trophy, Users, Calendar, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  const fetchProfile = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session?.user?.id)
      .single()
    
    if (data) setProfile(data)
  }, [session?.user?.id, supabase])

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile()
    }
  }, [session, fetchProfile])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (!session) return null

  return (
    <nav className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/images/logo-tarreo.jpeg" 
              alt="Tarreo Gamer Logo" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold">Tarreo Gamer 2025</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/dashboard" className="hover:bg-white/10 px-3 py-2 rounded-md">
                Dashboard
              </Link>
              <Link href="/teams" className="hover:bg-white/10 px-3 py-2 rounded-md">
                Equipos
              </Link>
              <Link href="/tournaments" className="hover:bg-white/10 px-3 py-2 rounded-md">
                Torneos
              </Link>
              <Link href="/matches" className="hover:bg-white/10 px-3 py-2 rounded-md">
                Enfrentamientos
              </Link>
              <Link href="/find-players" className="hover:bg-white/10 px-3 py-2 rounded-md">
                Buscar Jugadores
              </Link>
              
              {/* Menú desplegable para Mi perfil */}
              <div className="relative group">
                <button className="hover:bg-white/10 px-3 py-2 rounded-md flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Mi perfil
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-white/10 flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mi perfil
                    </Link>
                    <Link href="/messages" className="block px-4 py-2 text-sm hover:bg-white/10 flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Mensajes
                    </Link>
                    <Link href="/team-invitations" className="block px-4 py-2 text-sm hover:bg-white/10 flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828z" />
                      </svg>
                      Invitaciones
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-white/10 flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Panel Admin
                      </Link>
                    )}
                    <hr className="my-1 border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-red-600/20 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/40">
            <Link href="/dashboard" className="block hover:bg-white/10 px-3 py-2 rounded-md">
              Dashboard
            </Link>
            <Link href="/teams" className="block hover:bg-white/10 px-3 py-2 rounded-md">
              Equipos
            </Link>
            <Link href="/tournaments" className="block hover:bg-white/10 px-3 py-2 rounded-md">
              Torneos
            </Link>
            <Link href="/find-players" className="block hover:bg-white/10 px-3 py-2 rounded-md">
              Buscar Jugadores
            </Link>
            
            <div className="px-3 py-2 text-sm text-gray-400 font-medium">
              Mi perfil
            </div>
            <Link href="/profile" className="block hover:bg-white/10 px-6 py-2 rounded-md">
              Mi perfil
            </Link>
            <Link href="/messages" className="block hover:bg-white/10 px-6 py-2 rounded-md">
              Mensajes
            </Link>
            <Link href="/team-invitations" className="block hover:bg-white/10 px-6 py-2 rounded-md">
              Invitaciones
            </Link>
            {profile?.role === 'admin' && (
              <Link href="/admin" className="block hover:bg-white/10 px-6 py-2 rounded-md">
                Panel Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="block w-full text-left hover:bg-red-600/20 px-6 py-2 rounded-md"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}