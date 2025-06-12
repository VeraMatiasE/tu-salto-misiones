'use client'
import Link from 'next/link'
import { Star, ArrowRight, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { useEffect, useState } from 'react'
import { UserData } from '@/types/usuario'

interface SaltoFavorito {
  id_destino: string
  destinos: DestinoData
}

interface DestinoData {
  nombre: string
  ubicacion: string
}

interface Resena {
  id_resena: string
  calificacion: number
  destinos: DestinoData
  comentario: string
  id_salto: string
  fecha_actualizacion: string
}

export default function PerfilPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [saltosGuardados, setSaltosGuardados] = useState<SaltoFavorito[]>([])
  const [historialResenas, setHistorialResenas] = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const userResponse = await fetch('/api/auth/user')
        if (!userResponse.ok) {
          throw new Error('Error al cargar datos del usuario')
        }
        const user = await userResponse.json()
        setUserData(user)

        const favoritosResponse = await fetch(`/api/usuarios/favoritos`)

        if (favoritosResponse.ok) {
          const favoritos = await favoritosResponse.json()
          setSaltosGuardados(favoritos.data)
        }

        const resenasResponse = await fetch(`/api/usuarios/resenas`)
        if (resenasResponse.ok) {
          const resenas = await resenasResponse.json()
          setHistorialResenas(resenas.data)
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
        <Navigation variant="back" currentPage={'perfil'} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Cargando perfil...</div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
        <Navigation variant="back" currentPage={'perfil'} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600">
              {error ?? 'Error al cargar el perfil'}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation variant="back" currentPage={'perfil'} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Perfil del Usuario */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border border-black">
                <AvatarImage
                  src={userData.profile.foto_perfil}
                  alt={userData.profile.nombre ?? 'Usuario'}
                />
                <AvatarFallback className="text-2xl bg-teal-500 text-white">
                  {userData?.profile?.nombre
                    ? userData.profile.nombre
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                    : 'Usuario'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {userData.profile.nombre}
                    </h1>
                    <p className="text-gray-600">{userData.profile.email}</p>
                  </div>
                  <Link href="/profile/edit" className="mt-4 md:mt-0">
                    <Button variant={'default'}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </Link>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {userData.profile.intereses}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saltos Guardados */}
        <Card className="mb-8 mt-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Saltos guardados
            </h2>
            <div className="space-y-4">
              {saltosGuardados.length > 0 ? (
                saltosGuardados.map((salto) => (
                  <Link
                    key={salto.id_destino}
                    href={`/salto/${salto.id_destino}`}
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg hover:bg-header transition-colors cursor-pointer">
                      <span className="font-medium text-gray-900">
                        {salto.destinos.nombre}
                      </span>
                      <ArrowRight className="h-5 w-5 text-black" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No tienes saltos guardados aún
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Historial de Reseñas */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Historial de reseñas
            </h2>
            <div className="space-y-6">
              {historialResenas.length > 0 ? (
                historialResenas.map((resena) => (
                  <div
                    key={resena.id_resena}
                    className="border-b border-gray-200 pb-6 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= resena.calificacion
                                ? 'text-teal-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        • {resena.destinos.nombre}
                      </span>
                      <span className="text-sm text-gray-400">
                        •{' '}
                        {new Date(
                          resena.fecha_actualizacion,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {resena.comentario}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No has escrito reseñas aún
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
