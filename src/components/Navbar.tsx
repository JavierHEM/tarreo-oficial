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
    <nav className="bg-black/20 backdrop-blur-md border-b border-white/20">
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
              {profile?.role === 'admin' && (
                <Link href="/admin" className="hover:bg-white/10 px-3 py-2 rounded-md">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="hover:bg-red-600/20 px-3 py-2 rounded-md flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Salir
              </button>
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
            {profile?.role === 'admin' && (
              <Link href="/admin" className="block hover:bg-white/10 px-3 py-2 rounded-md">
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="block w-full text-left hover:bg-red-600/20 px-3 py-2 rounded-md"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}