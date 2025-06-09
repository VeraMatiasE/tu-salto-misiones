'use client'

import { ImagenesList } from '@/components/imagenes-list'
import { useEffect, useState } from 'react'

export default function ImagenesAdminPage() {
  const [imagenes_saltos, setSaltos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/imagenes')
      .then((res) => res.json())
      .then((data) => {
        setSaltos(data.data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error al cargar las imagenes de los saltos:', error)
        setLoading(false)
      })
  }, [])

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="font-title text-3xl font-bold tracking-tight">
          Administración de Imágenes
        </h1>
        <p className="font-text text-muted-foreground mt-1">
          Gestiona las imágenes de los saltos y cascadas
        </p>
      </div>

      {loading ? (
        <p className="font-text text-muted-foreground">Cargando imágenes...</p>
      ) : (
        <ImagenesList imagenes_saltos={imagenes_saltos} />
      )}
    </div>
  )
}
