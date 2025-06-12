'use client'

import { Heart, Users, Camera, Leaf, MapPin, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'

const valores = [
  {
    icono: Leaf,
    titulo: 'Conservación',
    descripcion:
      'Promovemos el turismo responsable y la preservación de los ecosistemas naturales.',
  },
  {
    icono: Users,
    titulo: 'Comunidad',
    descripcion:
      'Creamos una comunidad de amantes de la naturaleza que comparten experiencias.',
  },
  {
    icono: Camera,
    titulo: 'Documentación',
    descripcion:
      'Registramos y preservamos la belleza natural para las futuras generaciones.',
  },
  {
    icono: Award,
    titulo: 'Calidad',
    descripcion:
      'Ofrecemos información precisa y actualizada sobre cada destino natural.',
  },
]

export default function AcercaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation currentPage={'inicio'} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 py-16 px-4">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Sobre Tu Salto Misiones
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Conectamos a los amantes de la naturaleza con los tesoros ocultos de
            la provincia de Misiones, Argentina.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Nuestra Historia */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Nuestra Historia
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Tu Salto Misiones nació en 2025 de la pasión por los paisajes
                  naturales únicos que ofrece la provincia de Misiones. Como
                  amantes de la naturaleza y la aventura, nos dimos cuenta de
                  que muchos de estos tesoros naturales permanecían ocultos o
                  eran difíciles de encontrar para los visitantes.
                </p>
                <p>
                  Decidimos crear una plataforma que no solo documentara estos
                  increíbles saltos y cascadas, sino que también conectara a una
                  comunidad de exploradores que comparten la misma pasión por
                  descubrir y preservar estos lugares mágicos.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-24 w-24 text-teal-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-teal-800">Misiones</h3>
                  <p className="text-teal-600">Tierra de cascadas</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nuestros Valores */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nuestros Valores
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Los principios que guían nuestro trabajo y nuestra misión de
              promover el turismo responsable.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {valores.map((valor, index) => {
              const IconComponent = valor.icono
              return (
                <Card key={`${valor.titulo}-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-teal-100 rounded-lg">
                        <IconComponent className="h-6 w-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {valor.titulo}
                        </h3>
                        <p className="text-gray-600">{valor.descripcion}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Misión y Visión */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-teal-600" />
                  Nuestra Misión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Facilitar el descubrimiento y disfrute responsable de los
                  saltos y cascadas de Misiones, creando una comunidad que
                  valore y proteja estos tesoros naturales para las futuras
                  generaciones.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-blue-600" />
                  Nuestra Visión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Ser la plataforma de referencia para el turismo natural en
                  Argentina, promoviendo la conservación ambiental y conectando
                  a las personas con la belleza natural de nuestro país.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Compromiso Ambiental */}
        <section>
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-8 text-center">
              <Leaf className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Compromiso Ambiental
              </h3>
              <p className="text-gray-700 max-w-3xl mx-auto mb-6">
                Estamos comprometidos con la preservación del medio ambiente.
                Promovemos prácticas de turismo sostenible, educamos sobre la
                importancia de la conservación y colaboramos con organizaciones
                locales para proteger estos ecosistemas únicos.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  Turismo Responsable
                </Badge>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  Conservación
                </Badge>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  Educación Ambiental
                </Badge>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  Sostenibilidad
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Footer />
    </div>
  )
}
