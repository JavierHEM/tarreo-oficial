'use client'

import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { 
  Trophy, 
  Calendar, 
  Users, 
  Gamepad2, 
  MapPin, 
  Clock, 
  Sparkles,
  ChevronRight,
  CheckCircle,
  Zap
} from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-900">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-black"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full mb-8 animate-pulse">
              <Sparkles className="h-4 w-4 text-red-400" />
              <span className="text-red-300 text-sm font-semibold">Inscripciones Abiertas</span>
      </div>

            <div className="flex justify-center mb-6">
        <Image
                src="/images/logo-tarreo.jpeg" 
                alt="Tarreo Gamer Logo" 
                width={200} 
                height={200}
                className="rounded-2xl shadow-2xl ring-4 ring-red-500/30"
          priority
        />
      </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent">
              Tarreo Gamer
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Primavera 2025
          </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Vive una experiencia gamer competitiva, divertida y cercana. 
              <br />
              <span className="text-red-400 font-semibold">Con gran final presencial en INACAP Osorno</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Inscríbete Ahora
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link href="/tournaments" className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Ver Torneos
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
              <div className="card p-6 text-center">
                <Users className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">100+</div>
                <div className="text-gray-400">Participantes esperados</div>
              </div>
              <div className="card p-6 text-center">
                <Trophy className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">11</div>
                <div className="text-gray-400">Juegos disponibles</div>
              </div>
              <div className="card p-6 text-center">
                <Calendar className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">17 Oct</div>
                <div className="text-gray-400">Final presencial</div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-20 bg-black/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-4 text-white">
              ¿Cómo funciona?
          </h2>
            <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
              El torneo se desarrolla en dos fases: eliminatorias online y finales presenciales
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Fase 1 */}
              <div className="card p-8 border-2 border-red-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-white">Fase Online</h3>
                  <Gamepad2 className="h-6 w-6 text-red-500 ml-auto" />
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Inscripciones</div>
                      <div className="text-gray-400 text-sm">29 sept - 5 octubre</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Eliminatorias</div>
                      <div className="text-gray-400 text-sm">6 - 15 octubre</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-gray-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Arma tu equipo y elige torneos</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Partidas remotas coordinadas por Discord</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Staff de moderadores supervisando</span>
                  </div>
                </div>
              </div>

              {/* Fase 2 */}
              <div className="card p-8 border-2 border-red-500/50 bg-gradient-to-br from-red-950/20 to-transparent">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-white">Final Presencial</h3>
                  <Trophy className="h-6 w-6 text-red-400 ml-auto" />
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Viernes 17 de Octubre</div>
                      <div className="text-gray-400 text-sm">Gran evento presencial</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Auditorio INACAP Osorno</div>
                      <div className="text-gray-400 text-sm">Sede central</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-gray-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Semifinales y finales en vivo</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Compite cara a cara</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Actividades sorpresa para todos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rules Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-4 text-white">
              Reglas importantes
          </h2>
            <p className="text-center text-gray-400 mb-12">
              Lee esto antes de inscribirte
            </p>

            <div className="grid gap-4">
              <div className="card p-6 border-l-4 border-red-500">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-500" />
                  Inscripción por equipos
                </h3>
                <p className="text-gray-300 text-sm">
                  La inscripción es por equipo completo. Cada equipo debe tener un capitán responsable de la coordinación.
                </p>
              </div>

              <div className="card p-6 border-l-4 border-red-500">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-red-500" />
                  Múltiples torneos
                </h3>
                <p className="text-gray-300 text-sm">
                  Puedes inscribirte en más de un juego, pero un jugador NO puede estar en dos equipos ni participar dos veces en el mismo torneo.
                </p>
              </div>

              <div className="card p-6 border-l-4 border-red-500">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-500" />
                  Cuadros y coordinación
                </h3>
                <p className="text-gray-300 text-sm">
                  Una vez cerradas las inscripciones, se crearán los cuadros de eliminación. Las partidas se coordinarán a través del Discord Oficial del Tarreo.
                </p>
              </div>

              <div className="card p-6 border-l-4 border-red-500">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-red-500" />
                  Clasificación a finales
                </h3>
                <p className="text-gray-300 text-sm">
                  Los mejores equipos de cada torneo online clasificarán a las semifinales y finales presenciales del 17 de octubre.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-red-950/30 via-black to-black">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Sparkles className="h-16 w-16 text-red-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Estás listo para competir?
          </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Arma tu equipo, elige tu juego y únete al Tarreo Gamer Primavera 2025.
              <br />
              <span className="text-red-400 font-semibold">¡Nos vemos en la arena! 🎮🔥</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Crear Cuenta
              </Link>
              <Link href="/teams/create" className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-2">
                <Users className="h-5 w-5" />
                Crear Equipo
              </Link>
            </div>

            <div className="mt-12 text-gray-400 text-sm">
              <p>Evento organizado por INACAP Osorno</p>
              <p className="mt-2">Solo para estudiantes con correo institucional (@inacapmail.cl)</p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}