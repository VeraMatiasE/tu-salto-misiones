'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star, MapPin, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { useAuth } from '@/components/auth-wrapper'
import { Salto } from '@/types/salto'
import { UserProfile } from '@/types/usuario'
import { CldImage } from 'next-cloudinary'
import { Imagen } from '@/types/imagenes'
import { ImagenDestino } from '@/types/database'

function useUserProfile(isAuthenticated: boolean) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setUserProfile(null)
      return
    }

    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/user')
        if (response.ok) {
          const data = await response.json()
          setUserProfile(data.profile)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setUserProfile(null)
      }
    }

    fetchUser()
  }, [isAuthenticated])

  return userProfile
}

type FavoritesList = ImagenDestino & {
  destinos: Salto & { imagen?: Imagen; calificacion: number }
}

export default function FavoritosPage() {
  const { isAuthenticated } = useAuth()
  const userProfile = useUserProfile(isAuthenticated)
  const [favorites, setFavorites] = useState<FavoritesList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchImages = async () => {
      if (!userProfile) return
      setLoading(true)
      try {
        const response = await fetch('/api/usuarios/favoritos')

        if (!response.ok) {
          throw new Error('Error al cargar los saltos favoritos')
        }

        const data = await response.json()
        console.log(data.data)

        setFavorites(data.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [userProfile])

  const deleteFavorite = async (id: number) => {
    try {
      const response = await fetch(`/api/usuarios/favoritos`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_destino: id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Error al procesar favorito')
      }

      setFavorites(favorites.filter((salto) => salto.id_destino !== id))
    } catch (error) {
      console.error('Error al cambiar favorito:', error)
    }
  }

  const getDificultadColor = (dificultad: string) => {
    switch (dificultad) {
      case 'baja':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'extrema':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
        <Navigation variant="back" currentPage={'inicio'} />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <span className="ml-2 text-gray-600">
              Cargando los saltos favoritos...
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation variant="back" currentPage="favoritos" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900">
              Mis Saltos Favoritos
            </h1>
          </div>
          <p className="text-gray-600">
            Acá tenés todos los saltos que has marcado como favoritos. Puedes
            acceder rápidamente a su información o eliminarlos de tu lista.
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="text-teal-600 border-teal-600">
              {favorites.length} salto{favorites.length !== 1 ? 's' : ''}{' '}
              guardado{favorites.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Lista de Favoritos */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((salto) => (
              <Card
                key={salto.id_destino}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white"
              >
                <div className="relative">
                  <div className="relative h-48">
                    {salto.destinos?.imagen ? (
                      <CldImage
                        src={salto.destinos.imagen.public_id}
                        alt={salto.destinos.imagen.public_id}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src="/placeholder.svg"
                        alt={salto.destinos.nombre}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="link"
                    className="absolute top-3 right-3 border-0"
                    onClick={() => deleteFavorite(salto.id_destino)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
                      {salto.destinos.nombre}
                    </h3>
                    <Heart className="h-5 w-5 text-red-500 fill-current flex-shrink-0 ml-2" />
                  </div>

                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{salto.destinos.ubicacion}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center mr-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={`${salto.id_destino}-star-${i}`}
                              className={`h-4 w-4 ${
                                i < Math.floor(salto.destinos.calificacion)
                                  ? 'text-primary fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {salto.destinos.calificacion}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={getDificultadColor(
                          salto.destinos.dificultad,
                        )}
                      >
                        {salto.destinos.dificultad}
                      </Badge>
                    </div>

                    <Link href={`/salto/${salto.id_destino}`} className="block">
                      <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                        Ver Detalles
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes saltos favoritos aún
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Explora nuestra colección de saltos y marca como favoritos los que
              más te gusten para encontrarlos fácilmente aquí.
            </p>
            <Link href="/saltos">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white">
                Explorar Saltos
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
