'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ImageDialog } from '@/components/ui/image-dialog'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { Imagen } from '@/types/imagenes'
import { CldImage } from 'next-cloudinary'
import { ArrowLeft } from 'lucide-react'

type ImageWithPublicId = Omit<Imagen, 'public_id'>
  & Required<Pick<Imagen, 'public_id'>>

export default function GaleriaPage() {
  const router = useRouter()
  const params = useParams()
  const saltoId = Number(params?.id)
  const [imagesData, setImagesData] = useState<ImageWithPublicId[] | null>(null)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchImages = async () => {
      if (!saltoId) return
      setLoading(true)
      try {
        const response = await fetch(`/api/destinos/${saltoId}/imagenes`)

        if (!response.ok) {
          throw new Error('Error al cargar las imágenes saltos')
        }

        const data = await response.json()
        const filterData = data.data.filter(
          (image: Imagen) => image.public_id != null,
        )

        setImagesData(filterData)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [saltoId])

  const openModal = (imageId: number) => {
    setSelectedImage(imageId)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  const selectedImageData = selectedImage
    ? imagesData?.find((img) => img.id_imagen === selectedImage)
    : null

  const displayImageCount = () => {
    if (imagesData)
      return `${imagesData.length} ${imagesData.length === 1 ? 'Imagen' : 'Imágenes'}`
    else return '0 imágenes'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
        <Navigation variant="back" currentPage={'saltos'} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">
              Cargando imágenes del salto...
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation variant="back" currentPage={'saltos'} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Galería</h1>
            <p className="text-gray-600">{displayImageCount()}</p>
          </div>
        </div>

        {/* Mosaico de imágenes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imagesData?.map((imagen) => (
            <button
              key={imagen.id_imagen}
              className="relative aspect-square group overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
              onClick={() => openModal(imagen.id_imagen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openModal(imagen.id_imagen)
                }
              }}
              aria-label={`View image ${imagen.public_id}`}
              tabIndex={0}
            >
              <CldImage
                src={imagen.public_id}
                alt={imagen.public_id}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/30 group-focus:bg-black/30 transition-colors duration-300"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>

        {/* Modal de imagen ampliada */}
        {selectedImageData && (
          <ImageDialog
            open={selectedImage !== null}
            src={selectedImageData.public_id}
            alt={selectedImageData.public_id}
            downloadUrl={selectedImageData.url_imagen}
            onOpenChange={closeModal}
          />
        )}
      </div>
    </div>
  )
}
