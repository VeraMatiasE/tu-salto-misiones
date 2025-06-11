'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Star,
  Heart,
  X,
  TreePine,
  DollarSign,
  MapPin,
  Mountain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navigation from '@/components/navigation'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Salto } from '@/types/salto'
import { Comentario, ComentarioRequest } from '@/types/comentarios'
import { useAuth } from '@/components/auth-wrapper'
import Footer from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserProfile } from '@/types/usuario'
import CommentForm from '@/components/comment-form'
import CommentList from '@/components/comment-list'
import MapComponent from '@/components/map'
import { Imagen } from '@/types/imagenes'
import { CldImage } from 'next-cloudinary'

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

type SaltoWithImage = Salto & { image?: Imagen }

export default function SaltoDetailPage() {
  const params = useParams()
  const saltoId = Number(params?.id)
  const { isAuthenticated } = useAuth()
  const userProfile = useUserProfile(isAuthenticated)

  const [saltoData, setSaltoData] = useState<SaltoWithImage | null>(null)
  const [puntuacion, setPuntuacion] = useState<number>(0)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingComentarios, setIsLoadingComentarios] = useState(true)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const fetchSaltoData = async () => {
      if (!saltoId) return
      setLoading(true)
      try {
        const responseDestinoData = await fetch(`/api/destinos/${saltoId}`)

        if (!responseDestinoData.ok) {
          throw new Error('Error al cargar los saltos')
        }

        const jsonDestinoData = await responseDestinoData.json()

        const responseDestinoImage = await fetch(
          `/api/destinos/${saltoId}/portada`,
        )

        if (!responseDestinoImage.ok) {
          throw new Error('Error al cargar los saltos')
        }

        const jsonDestinoImage = await responseDestinoImage.json()

        const destinoData = {
          ...jsonDestinoData.data,
          image: jsonDestinoImage.data,
          infraestructura:
            JSON.parse(jsonDestinoData.data.infraestructura) ?? '',
        }

        setSaltoData(destinoData)

        const responseCalificacion = await fetch(
          `/api/destinos/${saltoId}/calificacion`,
        )

        if (!responseCalificacion.ok) {
          throw new Error('Error al cargar la calificación')
        }

        const dataCalificacion = await responseCalificacion.json()

        setPuntuacion(dataCalificacion.data.promedio)

        const resultIsFavorite = await fetch(
          `/api/usuarios/favoritos/${saltoId}`,
        )
        const dataFavorite = await resultIsFavorite.json()
        setIsFavorite(dataFavorite.isFavorite)
      } catch (error) {
        console.error(error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSaltoData()
  }, [saltoId])

  useEffect(() => {
    const fetchComentarios = async () => {
      if (!saltoId) return

      try {
        setIsLoadingComentarios(true)
        const response = await fetch(`/api/destinos/${saltoId}/comentarios`)

        if (!response.ok) {
          throw new Error('Error al cargar la calificación')
        }

        const data = await response.json()

        setComentarios(data.data.data)
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error desconocido al guardar'
        setError(errorMessage)
      } finally {
        setIsLoadingComentarios(false)
      }
    }

    fetchComentarios()
  }, [saltoId])

  const handleSubmitComentario = async (
    comentarioData: Omit<ComentarioRequest, 'saltoId'>,
  ) => {
    setIsSubmittingComment(true)

    const response = await fetch(`/api/destinos/${saltoId}/comentarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...comentarioData,
      }),
    })

    if (!response.ok) {
      throw new Error('Error al cargar la calificación')
    }

    const data = await response.json()

    setComentarios((prev) => [data.data!, ...prev])

    setIsSubmittingComment(false)
  }

  const handleToggleFavorite = async () => {
    try {
      const method = isFavorite ? 'DELETE' : 'POST'

      const response = await fetch(`/api/usuarios/favoritos`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_destino: saltoId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Error al procesar favorito')
      }

      const data = await response.json()

      setIsFavorite(data.estatus)
    } catch (error) {
      console.error('Error al cambiar favorito:', error)
    }
  }

  const actividadesPredefinidas = [
    { clave: 'baños', nombre: 'Baños' },
    { clave: 'estacionamiento', nombre: 'Estacionamiento' },
    { clave: 'camping', nombre: 'Áreas de camping' },
    { clave: 'guias', nombre: 'Guías turísticos' },
    { clave: 'senderos', nombre: 'Senderos señalizados' },
    { clave: 'miradores', nombre: 'Miradores' },
  ]

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
        <Navigation variant="back" currentPage={'saltos'} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Cargando salto...</div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !saltoData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
        <Navigation variant="back" currentPage={'saltos'} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error al cargar el salto
          </h1>
          <p className="text-gray-600 mb-8">
            {error
              ?? 'No se pudo encontrar la información del salto solicitado.'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-teal-500 hover:bg-teal-600"
          >
            Intentar nuevamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation variant="back" currentPage={'saltos'} />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Image */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <div className="relative h-72 sm:h-96 lg:h-[500px] rounded-xl overflow-hidden">
                {saltoData.image?.public_id ? (
                  <CldImage
                    src={saltoData.image.public_id}
                    alt={saltoData.nombre}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src="/placeholder.svg"
                    alt={saltoData.nombre}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              <div className="mt-4 md:mt-6">
                <Link href={`/salto/${saltoData.id_destino}/gallery`}>
                  <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 md:py-3 rounded-lg flex items-center justify-center space-x-2">
                    <Heart className="h-4 w-4 md:h-5 md:w-5" />
                    <span>Ir a Galería</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-teal-600 mb-2">
                  {saltoData.nombre}
                </h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-xl md:text-2xl font-bold mr-2">
                      {puntuacion}
                    </span>
                    <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-400 fill-current" />
                  </div>
                  <Heart
                    className={`h-5 w-5 md:h-6 md:w-6 cursor-pointer transition-colors ${
                      isFavorite
                        ? 'text-red-500 fill-current'
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                    onClick={handleToggleFavorite}
                  />
                </div>
              </div>
            </div>

            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-white border-gray-400">
                <div className="flex items-center gap-3">
                  <Mountain className="h-5 w-5 text-teal-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Dificultad de Acceso
                    </h3>
                    <Badge
                      variant="outline"
                      className={getDificultadColor(saltoData.dificultad)}
                    >
                      {saltoData.dificultad}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white border-gray-400">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Costo de Entrada
                    </h3>
                    <p className="text-lg font-bold text-green-600">
                      ${saltoData.costo_entrada.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-white border-gray-400">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Ubicación</h3>
                    <p className="text-sm text-gray-600">
                      {saltoData.ubicacion}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                Descripción
              </h2>
              <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                {saltoData.descripcion}
              </p>
            </div>

            {/* Biodiversidad */}
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <TreePine className="h-5 w-5 text-green-600" />
                Biodiversidad
              </h2>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 md:p-6">
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    {saltoData.biodiversidad}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
                Ubicación
              </h2>
              <MapComponent
                ubicacion={saltoData.ubicacion}
                urlMapa={saltoData.url_mapa}
              />
            </div>

            {/* Activities */}
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">
                Actividades
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {actividadesPredefinidas.map((actividad) => {
                  const disponible = saltoData?.infraestructura?.includes(
                    actividad.clave,
                  )
                  return (
                    <div
                      key={actividad.clave}
                      className="flex items-center justify-between p-2 md:p-3 border border-gray-400 rounded-lg bg-white"
                    >
                      <span className="text-sm md:text-base text-gray-700">
                        {actividad.nombre}
                      </span>
                      {disponible ? (
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      ) : (
                        <X className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-teal-600 mb-4 md:mb-6">
                Comentarios ({comentarios.length})
              </h2>

              {/* Add Comment Form */}
              {isAuthenticated && (
                <CommentForm
                  nombre={userProfile?.nombre ?? 'Usuario'}
                  onSubmit={handleSubmitComentario}
                  isLoading={isSubmittingComment}
                  canComment={
                    !comentarios.some(
                      (com) => com.id_usuario === userProfile?.id_usuario,
                    )
                  }
                />
              )}

              {/* Comments List */}
              {
                <CommentList
                  comentarios={comentarios}
                  isLoading={isLoadingComentarios}
                />
              }
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
