// src/app/auth/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { Trophy, Mail, User } from 'lucide-react'
import Image from 'next/image'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState<'login' | 'register' | 'confirm'>('login')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [message, setMessage] = useState('')
  const [isSetupProfile, setIsSetupProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: '',
    gamertag: '',
    preferred_games: [] as string[],
    preferred_position: '',
    available_schedule: '',
    bio: ''
  })

  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()
  

  const games = ['Valorant', 'League of Legends', 'Fortnite', 'Overwatch 2', 'Age of Empires 2', 'Rocket League', 'Mortal Kombat 11', 'EA SPORTS FC', 'Mario Kart', 'UNO', 'Mitos y Leyendas']

  const checkProfile = useCallback(async () => {
    if (!session?.user?.id) return

    // Consultamos directamente el perfil en la BD
    const { data: profile } = await supabase
      .from('profiles')
      .select('gamertag')
      .eq('id', session.user.id)
      .single()

    if (profile?.gamertag) {
      // Usuario tiene perfil completo, ir al dashboard
      router.push('/dashboard')
    } else {
      // Usuario necesita completar perfil
      setIsSetupProfile(true)
    }
  }, [session?.user?.id, supabase, router])

  useEffect(() => {
    const run = async () => {
      if (session?.user) {
        await checkProfile()
      }
      setChecking(false)
    }
    run()
  }, [session, checkProfile])

  // Eliminado: useEffect duplicado que causaba problemas

  // Eliminado: reset/magic link

  // Eliminado: magic link

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.endsWith('@inacapmail.cl')) {
      setMessage('Error: Debes usar tu correo institucional (@inacapmail.cl)')
      return
    }

    if (!password) {
      setMessage('Error: Ingresa tu contraseña')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(`Error: ${error.message}`)
      setLoading(false)
      return
    }

    // Si inicia sesión correctamente, verificamos/creamos perfil
    await checkProfile()
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.endsWith('@inacapmail.cl')) {
      setMessage('Error: Debes usar tu correo institucional (@inacapmail.cl)')
      return
    }
    if (!password || password.length < 6) {
      setMessage('Error: La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`
      }
    })
    
    if (error) {
      // Si el error es de confirmación de email, pero el usuario se creó
      if (error.message.includes('confirmation email') || error.message.includes('email')) {
        setMessage('Usuario creado exitosamente. La confirmación de email está deshabilitada, puedes iniciar sesión directamente.')
        setView('login')
      } else {
        setMessage(`Error: ${error.message}`)
      }
      setLoading(false)
      return
    }

    // El perfil se crea automáticamente mediante el trigger de la BD
    if (data.user) {
      // Verificar si el email ya está confirmado (confirmación deshabilitada)
      if (data.user.confirmed_at || data.session) {
        setMessage('Registro exitoso. Ya puedes iniciar sesión.')
        setView('login')
      } else {
        setMessage('Registro exitoso. Revisa tu correo para confirmar la cuenta.')
        setView('confirm')
      }
    }
    
    setLoading(false)
  }

  const handleResendConfirmation = async () => {
    if (!email.endsWith('@inacapmail.cl')) {
      setMessage('Error: Debes usar tu correo institucional (@inacapmail.cl)')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`
      }
    })
    
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Email de confirmación reenviado. Revisa tu correo.')
    }
    setLoading(false)
  }

  const handleSetupProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!profileData.gamertag || profileData.gamertag.trim().length < 3) {
      setMessage('Error: El gamertag debe tener al menos 3 caracteres')
      setLoading(false)
      return
    }

    console.log('Actualizando perfil con datos:', {
      id: session?.user?.id,
      gamertag: profileData.gamertag,
      preferred_games: profileData.preferred_games
    })

    const { data, error } = await supabase
      .from('profiles')
      .update({
        gamertag: profileData.gamertag,
        full_name: profileData.full_name || profileData.gamertag,
        preferred_games: profileData.preferred_games,
        preferred_position: profileData.preferred_position,
        available_schedule: profileData.available_schedule,
        bio: profileData.bio,
        updated_at: new Date().toISOString()
      })
      .eq('id', session?.user?.id)
      .select()

    console.log('Resultado de actualización:', { data, error })

    if (error) {
      setMessage(`Error: ${error.message}`)
      console.error('Error actualizando perfil:', error)
    } else {
      // Perfil guardado exitosamente, ir al dashboard
      setMessage('Perfil actualizado exitosamente!')
      setIsSetupProfile(false)
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleGameToggle = (game: string) => {
    setProfileData(prev => ({
      ...prev,
      preferred_games: prev.preferred_games.includes(game)
        ? prev.preferred_games.filter(g => g !== game)
        : [...prev.preferred_games, game]
    }))
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center">
          <p className="text-gray-300">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (!session && !isSetupProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Image 
                src="/images/logo-tarreo.jpeg" 
                alt="Tarreo Gamer Logo" 
                width={80} 
                height={80}
                className="rounded-xl ring-2 ring-red-500/30"
              />
            </div>
            <h2 className="text-3xl font-bold">Tarreo Gamer 2025</h2>
            <p className="text-gray-300 mt-2">INACAP Osorno - Primavera 2025</p>
          </div>

          {/* Tabs login / registro */}
          <div className="flex gap-2 text-sm">
            <button type="button" onClick={() => setView('login')} className={`px-3 py-1 rounded ${view==='login'?'bg-white/20':'bg-white/10 hover:bg-white/20'}`}>Iniciar sesión</button>
            <button type="button" onClick={() => setView('register')} className={`px-3 py-1 rounded ${view==='register'?'bg-white/20':'bg-white/10 hover:bg-white/20'}`}>Registrarse</button>
          </div>

          {view === 'login' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Correo Institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@inacapmail.cl"
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>
          )}

          {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Correo Institucional</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@inacapmail.cl"
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </form>
          )}

          {view === 'confirm' && (
          <div className="space-y-4 text-center">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <Mail className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-200 mb-2">Confirma tu correo</h3>
              <p className="text-sm text-gray-300 mb-4">
                Te hemos enviado un enlace de confirmación a <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Revisa tu bandeja de entrada y spam. Haz clic en el enlace para activar tu cuenta.
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={loading}
                  className="btn-secondary w-full disabled:opacity-50"
                >
                  {loading ? 'Reenviando...' : 'Reenviar email'}
                </button>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-sm text-gray-400 hover:text-white underline"
                >
                  Volver a iniciar sesión
                </button>
              </div>
            </div>
          </div>
          )}

          

          {message && (
            <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
              {message}
            </div>
          )}

          <div className="text-center text-sm text-gray-400">
            <p>Solo estudiantes de INACAP con correo institucional válido</p>
          </div>
        </div>
      </div>
    )
  }

  if (session && isSetupProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full p-8 space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Image 
                src="/images/logo-tarreo.jpeg" 
                alt="Tarreo Gamer Logo" 
                width={80} 
                height={80}
                className="rounded-xl ring-2 ring-red-500/30"
              />
            </div>
            <h2 className="text-3xl font-bold">Configura tu Perfil</h2>
            <p className="text-gray-300 mt-2">Completa tu información de jugador</p>
          </div>

          <form onSubmit={handleSetupProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Gamertag *</label>
                <input
                  type="text"
                  value={profileData.gamertag}
                  onChange={(e) => setProfileData(prev => ({ ...prev, gamertag: e.target.value }))}
                  placeholder="Tu nombre de jugador"
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Horarios Disponibles</label>
                <input
                  type="text"
                  value={profileData.available_schedule}
                  onChange={(e) => setProfileData(prev => ({ ...prev, available_schedule: e.target.value }))}
                  placeholder="Ej: Lunes a Viernes 19:00-22:00"
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Juegos Preferidos</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {games.map((game) => (
                  <label key={game} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.preferred_games.includes(game)}
                      onChange={() => handleGameToggle(game)}
                      className="rounded border-white/30"
                    />
                    <span className="text-sm">{game}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Biografía</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Cuéntanos sobre tu experiencia gaming..."
                rows={3}
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Completar Registro'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return null
}