'use client'

import { Code, Coffee, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'

const equipoDesarrollo = [
  {
    id: 1,
    nombre: 'Nuñez Santiago',
    rol: 'Scrum Master',
    descripcion:
      'Facilita el proceso ágil del equipo, eliminando obstáculos y promoviendo una colaboración eficiente entre los miembros.',
    tecnologias: ['Scrum', 'Jira', 'Comunicación', 'Gestión de Equipos'],
  },
  {
    id: 2,
    nombre: 'Sanchez Joaquín',
    rol: 'Product Owner',
    descripcion:
      'Define la visión del producto, prioriza el backlog y actúa como puente entre las necesidades del usuario y el equipo de desarrollo.',
    tecnologias: [
      'Gestión de Producto',
      'Figma',
      'Negociación',
      'Stakeholders',
    ],
  },
  {
    id: 3,
    nombre: 'Vera Matías',
    rol: 'Desarrollador Back-End',
    descripcion:
      'Desarrolla y mantiene la lógica del servidor, API y la integración con servicios externos para un rendimiento óptimo. Además, gestiona procesos DevOps como CI/CD, pruebas automatizadas y análisis de calidad del código.',
    tecnologias: [
      'Node.js',
      'PostgreSQL',
      'Docker',
      'API REST',
      'CI/CD',
      'SonarQube',
      'Jest',
    ],
  },
  {
    id: 4,
    nombre: 'Cáceres Fabricio',
    rol: 'Especialista en Base de Datos',
    descripcion:
      'Diseña, optimiza y mantiene las bases de datos, asegurando integridad, seguridad y eficiencia en el acceso a la información.',
    avatar: '/placeholder.svg?height=120&width=120',
    tecnologias: ['PostgreSQL', 'Modelado de Datos', 'SQL', 'Optimización'],
  },
  {
    id: 5,
    nombre: 'Geneyro Lautaro',
    rol: 'Desarrolladora Front-End',
    descripcion:
      'Se enfoca en construir interfaces intuitivas y accesibles, asegurando una experiencia de usuario fluida en distintos dispositivos.',
    tecnologias: ['React', 'Next.js', 'Tailwind CSS', 'Accesibilidad'],
  },
]

const tecnologias = [
  'React',
  'Next.js',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'Tailwind CSS',
  'Vercel',
  'Supabase',
  'Figma',
  'Git',
]

export default function EquipoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation currentPage={'inicio'} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 py-16 px-4">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <Code className="w-16 h-16 text-white mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Nuestro Equipo
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Conoce a las personas apasionadas que hacen posible Tu Salto
            Misiones, combinando tecnología y amor por la naturaleza.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Introducción del Equipo */}
        <section className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Un equipo multidisciplinario
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-8">
            Somos un grupo de profesionales argentinos unidos por la pasión por
            la tecnología y el amor por los paisajes naturales de nuestro país.
            Cada miembro del equipo aporta su experiencia única para crear la
            mejor plataforma de descubrimiento de saltos y cascadas.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {tecnologias.map((tech) => (
              <Badge
                key={tech}
                variant="outline"
                className="text-teal-600 border-teal-600"
              >
                {tech}
              </Badge>
            ))}
          </div>
        </section>

        {/* Miembros del Equipo */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {equipoDesarrollo.map((miembro) => (
              <Card
                key={miembro.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {miembro.nombre}
                    </h3>
                    <p className="text-teal-600 font-medium mb-4">
                      {miembro.rol}
                    </p>
                    <p className="text-gray-600 text-sm mb-6">
                      {miembro.descripcion}
                    </p>

                    <div className="flex flex-wrap justify-center gap-2">
                      {miembro.tecnologias.map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Nuestra Filosofía de Trabajo */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nuestra Filosofía de Trabajo
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Creemos en el desarrollo colaborativo, la innovación constante y
              el compromiso con la calidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <Code className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Código Abierto
                </h3>
                <p className="text-gray-600 text-sm">
                  Creemos en la transparencia y la colaboración. Nuestro código
                  está disponible para la comunidad.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Pasión por la Naturaleza
                </h3>
                <p className="text-gray-600 text-sm">
                  Cada línea de código está inspirada en nuestro amor por los
                  paisajes naturales de Argentina.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Coffee className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Trabajo Colaborativo
                </h3>
                <p className="text-gray-600 text-sm">
                  Trabajamos juntos, compartimos ideas y nos apoyamos mutuamente
                  para crear algo extraordinario.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Únete al Equipo */}
        <section>
          <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ¿Quieres unirte al equipo?
              </h3>
              <p className="text-gray-700 max-w-2xl mx-auto mb-6">
                Siempre estamos buscando personas talentosas y apasionadas que
                quieran contribuir a nuestro proyecto. Si compartes nuestra
                visión y tienes habilidades en desarrollo, diseño o marketing,
                ¡nos encantaría conocerte!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  className="border-teal-500 text-teal-600 hover:bg-teal-50"
                  asChild
                >
                  <a
                    href="https://github.com/VeraMatiasE/tu-salto-misiones"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver en GitHub
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Footer />
    </div>
  )
}
