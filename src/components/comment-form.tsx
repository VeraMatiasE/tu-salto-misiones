import React, { useState } from 'react'
import { Star, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ComentarioRequest } from '@/types/comentarios'

interface CommentFormProps {
  nombre: string
  onSubmit: (comentario: Omit<ComentarioRequest, 'id_salto'>) => Promise<void>
  isLoading?: boolean
  canComment: boolean
}

const CommentForm: React.FC<CommentFormProps> = ({
  nombre,
  onSubmit,
  isLoading = false,
  canComment = false,
}) => {
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [puntuacion, setPuntuacion] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nuevoComentario.trim() || puntuacion === 0) {
      alert('Por favor completa el comentario y la calificación')
      return
    }

    try {
      await onSubmit({
        nombre,
        puntuacion,
        comentario: nuevoComentario.trim(),
      })

      setNuevoComentario('')
      setPuntuacion(0)
    } catch (error) {
      console.error('Error al enviar comentario:', error)
    }
  }

  function getStarColor(star: number) {
    return star <= puntuacion
      ? 'text-primary fill-current'
      : 'text-gray-300 hover:primary'
  }

  return (
    <Card className="mb-4 md:mb-6 border border-gray-400 bg-white">
      <CardContent className="p-4 md:p-6">
        <h3 className="font-semibold mb-3 md:mb-4">Comparte tu Experiencia</h3>

        <div className="flex items-center mb-3 md:mb-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
            {nombre.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-sm md:text-base">{nombre}</span>
        </div>

        <div className="flex items-center mb-3 md:mb-4">
          <span className="text-sm font-medium mr-2">Calificación:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 md:h-6 md:w-6 cursor-pointer aria-disabled:cursor-not-allowed transition-colors ${
                canComment ? getStarColor(star) : 'text-gray-200'
              }`}
              aria-disabled={!canComment}
              onClick={() => {
                if (canComment) setPuntuacion(star)
              }}
            />
          ))}
          {puntuacion > 0 && (
            <span className="ml-2 text-sm text-gray-600">({puntuacion}/5)</span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Textarea
            placeholder="Comenta tu experiencia..."
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            className="mb-3 md:mb-4 disabled:select-none"
            rows={3}
            disabled={isLoading || !canComment}
            maxLength={500}
          />

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {nuevoComentario.length}/500 caracteres
            </span>

            <Button
              type="submit"
              className="bg-teal-500 hover:bg-teal-600 text-white text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isLoading
                || !nuevoComentario.trim()
                || puntuacion === 0
                || !canComment
              }
            >
              <Send className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              {isLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default CommentForm
