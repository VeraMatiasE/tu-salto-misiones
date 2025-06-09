'use client'

import { UsuarioForm } from '@/components/usuario-form'
import { Usuario } from '@/types/usuario'
import { use, useEffect, useState } from 'react'

export default function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const [usuarioData, setUsuarioData] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function cargarSalto() {
      try {
        const response = await fetch(`/api/usuarios/${resolvedParams.id}`)

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setUsuarioData(data.data)
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
          Cargando datos del usuario...
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
            No se pudo cargar el usuario: {error}
          </p>
        </div>
      </div>
    )
  }

  if (!usuarioData) {
    return (
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="font-title text-3xl font-bold tracking-tight">
            Usuario no encontrado
          </h1>
          <p className="font-text text-muted-foreground mt-1">
            El usuario solicitado no existe.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Editar Usuario</h1>
        <p className="text-muted-foreground mt-1">
          Modifica la información de {usuarioData.nombre}
        </p>
      </div>

      <UsuarioForm initialData={usuarioData} />
    </div>
  )
}
