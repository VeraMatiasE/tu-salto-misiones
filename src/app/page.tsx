'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { SaltosDestacados } from '@/types/salto'
import { CldImage } from 'next-cloudinary'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState('')
  const [saltosDestacados, setSaltosDestacados] = useState<SaltosDestacados[]>(
    [],
  )

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/destinos/destacados')
      .then((res) => res.json())
      .then((data) => {
        setSaltosDestacados(data.data)
      })
      .catch((error) => {
        console.error('Error al cargar los saltos:', error)
      })
  }, [])

  const handleSearch = () => {
    const value = inputRef.current?.value.trim() ?? ''
    if (value) {
      router.push(`/saltos?search=${encodeURIComponent(value)}`)
    } else {
      router.push('/saltos')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation currentPage={'inicio'} />

      {/* Hero Section */}
      <section className="font-text relative bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 py-20 px-4">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-64 h-64 mx-auto rounded-full">
              <Image src="/logo.png" alt="Logo" height={256} width={256} />
            </div>
          </div>

          <h1 className="font-title text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            EXPLORA LOS SALTOS Y<br />
            CASCADAS DE MISIONES
          </h1>

          <div className="max-w-2xl mx-auto relative">
            <Input
              type="text"
              ref={inputRef}
              placeholder="Buscar salto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full py-4 px-6 text-lg rounded-full border-0 shadow-lg"
            />
            <Button
              size="icon"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 rounded-full bg-teal-500 hover:bg-teal-600"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Saltos Destacados */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-title text-3xl font-bold text-black mb-12">
            Saltos destacados
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {saltosDestacados.map((salto) => (
              <Link key={salto.id_destino} href={`/salto/${salto.id_destino}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                  <div className="relative h-48">
                    {salto.public_id ? (
                      <CldImage
                        src={salto.public_id}
                        alt={salto.nombre}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src="/placeholder.svg"
                        alt={salto.nombre}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-title text-xl font-semibold text-gray-800 mb-2">
                      {salto.nombre}
                    </h3>
                    <div className="font-text text-primary flex items-center text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{salto.ubicacion}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/saltos">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-full text-lg">
                Ver Todos los Saltos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
