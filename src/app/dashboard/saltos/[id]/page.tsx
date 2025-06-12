'use client'
import { use, useEffect, useState } from 'react'
import { SaltoForm } from '@/components/salto-form'
import { Salto } from '@/types/salto'

export default function EditarSaltoPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>
}>) {
  const resolvedParams = use(params)
  const [saltoData, setSaltoData] = useState<Salto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargarSalto() {
      try {
        const response = await fetch(`/api/destinos/${resolvedParams.id}`)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setSaltoData(data.data)
      } catch (error) {
        console.error('Error al cargar el salto:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    cargarSalto()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="container py-10">
        <p className="font-text text-muted-foreground">
          Cargando datos del salto...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="font-title text-3xl font-bold tracking-tight text-red-600">
            Error
          </h1>
          <p className="font-text text-muted-foreground mt-1">
            No se pudo cargar el salto: {error}
          </p>
        </div>
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
        <h1 className="font-title text-3xl font-bold tracking-tight">
          Editar Salto o Cascada
        </h1>
        <p className="font-text text-muted-foreground mt-1">
          Modifica la información de {saltoData.nombre || 'este salto'}
        </p>
      </div>
      <SaltoForm initialData={saltoData} />
    </div>
  )
}
