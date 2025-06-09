'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageIcon, Plus } from 'lucide-react'
import { ImagenesDestino } from '@/types/imagenes'
import { CldImage } from 'next-cloudinary'

type ImagenesListProps = Readonly<{
  imagenes_saltos: ImagenesDestino[]
}>

export function ImagenesList({ imagenes_saltos }: ImagenesListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {imagenes_saltos.map((imagenes_salto) => (
        <Card key={imagenes_salto.id_destino} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="font-title">
              {imagenes_salto.nombre}
            </CardTitle>
            <CardDescription className="font-text">
              {imagenes_salto.imagenes.length}{' '}
              {imagenes_salto.imagenes.length === 1 ? 'imagen' : 'imágenes'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
              {imagenes_salto.imagenes.length > 0 ? (
                <CldImage
                  src={imagenes_salto.imagenes[0].public_id}
                  alt={imagenes_salto.nombre}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon
                    aria-label="placeholder"
                    className="h-12 w-12 text-muted-foreground opacity-50"
                  />
                </div>
              )}
            </div>
            {imagenes_salto.imagenes.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {imagenes_salto.imagenes.slice(0, 4).map((imagen) => (
                  <div
                    key={imagen.id_imagen}
                    className="relative aspect-square rounded-md overflow-hidden bg-muted"
                  >
                    <CldImage
                      src={imagen.public_id}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link
              href={`/dashboard/imagenes/${imagenes_salto.id_destino}`}
              className="w-full"
            >
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Gestionar imágenes
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
