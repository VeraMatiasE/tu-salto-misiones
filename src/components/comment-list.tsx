import React from 'react'
import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Comentario } from '@/types/comentarios'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface CommentListProps {
  comentarios: Comentario[]
  isLoading?: boolean
}

const CommentList: React.FC<CommentListProps> = ({
  comentarios,
  isLoading = false,
}) => {
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 md:space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (comentarios.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 md:p-6 text-center">
          <p className="text-gray-500">
            Aún no hay comentarios. ¡Sé el primero en compartir tu experiencia!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {comentarios.map((comentario) => (
        <Card key={comentario.id_resena} className="border-gray-400 bg-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start space-x-3 md:space-x-4">
              <Avatar className="w-8 h-8 md:w-10 md:h-10 border border-black">
                <AvatarImage
                  src={comentario.usuarios.foto_perfil}
                  alt={comentario.usuarios.nombre ?? 'Usuario'}
                />
                <AvatarFallback className="text-2xl bg-teal-500 text-white">
                  {comentario.usuarios.nombre
                    ? comentario.usuarios.nombre
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                    : 'Usuario'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm md:text-base">
                      {comentario.usuarios.nombre}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={`${comentario.id_resena}-star-${star}`}
                          className={`h-3 w-3 md:h-4 md:w-4 ${
                            star <= comentario.calificacion
                              ? 'text-primary fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(comentario.fecha_actualizacion)}
                  </span>
                </div>
                <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                  {comentario.comentario}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default CommentList
