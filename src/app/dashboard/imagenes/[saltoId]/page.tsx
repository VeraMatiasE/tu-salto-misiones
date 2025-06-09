'use client'

import { ImagenUpload } from '@/components/imagen-upload'
import { use, useEffect, useState } from 'react'

export default function GestionImagenesPage({
  params,
}: {
  params: Promise<{ saltoId: string }>
}) {
  const resolvedParams = use(params)
  const [saltoData, setSaltoData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/destinos/${resolvedParams.saltoId}/imagenes`)
      .then((res) => res.json())
      .then((data) => {
        setSaltoData(data.data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error al cargar las imagenes de los saltos:', error)
        setLoading(false)
      })
  }, [resolvedParams.saltoId])

  if (loading) {
    return (
      <div className="container py-10">
        <p className="font-text text-muted-foreground">
          Cargando imagenes del salto...
        </p>
      </div>
    )
  }

  if (!saltoData) {
    return (
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="font-title text-3xl font-bold tracking-tight">
            Salto no encontrado
          </h1>
          <p className="font-text text-muted-foreground mt-1">
            El salto solicitado no existe.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Imágenes</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las imágenes de este destino
        </p>
      </div>

      <ImagenUpload
        saltoId={resolvedParams.saltoId}
        initialImages={saltoData}
      />
    </div>
  )
}
