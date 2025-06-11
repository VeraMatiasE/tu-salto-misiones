'use client'

import { useState } from 'react'
import {
  Heart,
  Copy,
  Check,
  Coffee,
  Server,
  Code,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'

const datosBancarios = {
  titular: 'Tu Salto Misiones',
  cvu: '0000003100010000000001',
  alias: 'saltos.misiones.mp',
  cuit: '20-12345678-9',
}

export default function DonacionesPage() {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const CopyButton = ({
    text,
    field,
    label,
  }: {
    text: string
    field: string
    label: string
  }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="font-mono text-lg font-semibold text-gray-900">{text}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(text, field)}
        className="ml-4 flex items-center gap-2"
      >
        {copiedField === field ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-green-600">Copiado</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span>Copiar</span>
          </>
        )}
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation currentPage={'inicio'} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 py-16 px-4">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <Heart className="w-16 h-16 text-white mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Apoya Nuestro Proyecto
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Tu donación voluntaria nos ayuda a mantener y mejorar la plataforma
            para que puedas seguir descubriendo los hermosos saltos de Misiones.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Datos Bancarios */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Heart className="h-6 w-6 text-teal-600" />
                  Datos para Donación
                </CardTitle>
                <p className="text-gray-600">
                  Puedes realizar tu donación mediante transferencia bancaria
                  usando los siguientes datos:
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <CopyButton
                  text={datosBancarios.titular}
                  field="titular"
                  label="Titular de la cuenta"
                />
                <CopyButton text={datosBancarios.cvu} field="cvu" label="CVU" />
                <CopyButton
                  text={datosBancarios.alias}
                  field="alias"
                  label="Alias"
                />
                <CopyButton
                  text={datosBancarios.cuit}
                  field="cuit"
                  label="CUIT"
                />

                <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <h4 className="font-semibold text-teal-800 mb-2">
                    💡 Instrucciones
                  </h4>
                  <ul className="text-sm text-teal-700 space-y-1">
                    <li>
                      • Puedes usar el CVU o el Alias para realizar la
                      transferencia
                    </li>
                    <li>• Cualquier monto es bienvenido y muy apreciado</li>
                    <li>• Las donaciones son completamente voluntarias</li>
                    <li>
                      • Haz clic en &quot;Copiar&quot; para copiar los datos
                      fácilmente
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información del Proyecto */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>¿En qué usamos tu donación?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Server className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Hosting y Servidores</h4>
                    <p className="text-sm text-gray-600">
                      Mantenimiento de la infraestructura web para que el sitio
                      esté siempre disponible
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Desarrollo y Mejoras</h4>
                    <p className="text-sm text-gray-600">
                      Nuevas funcionalidades y mejoras en la experiencia de
                      usuario
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Optimización Móvil</h4>
                    <p className="text-sm text-gray-600">
                      Mejoras continuas para dispositivos móviles y tablets
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Coffee className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Motivación del Equipo</h4>
                    <p className="text-sm text-gray-600">
                      Un cafecito para el equipo que mantiene el proyecto con
                      amor
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proyecto 100% Independiente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Tu Salto Misiones es un proyecto independiente creado con
                  pasión por los paisajes naturales de Argentina. No tenemos
                  publicidad ni patrocinadores, por lo que tu apoyo es
                  fundamental para mantener la plataforma funcionando.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="text-teal-600 border-teal-600"
                  >
                    Sin publicidad
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-teal-600 border-teal-600"
                  >
                    Código abierto
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-teal-600 border-teal-600"
                  >
                    Hecho en Argentina
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Otras formas de apoyar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    Si no puedes donar económicamente, también puedes ayudar:
                  </p>
                  <ul className="space-y-1">
                    <li>• Compartiendo el sitio con amigos y familiares</li>
                    <li>• Dejando reseñas de los saltos que visites</li>
                    <li>• Reportando errores o sugiriendo mejoras</li>
                    <li>• Siguiéndonos en redes sociales</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mensaje de Agradecimiento */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
            <CardContent className="p-8">
              <Heart className="w-12 h-12 text-teal-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Gracias por tu apoyo!
              </h3>
              <p className="text-gray-700 max-w-2xl mx-auto">
                Cada donación, sin importar el monto, nos ayuda a seguir
                compartiendo la belleza natural de Misiones con el mundo. Tu
                generosidad hace posible que este proyecto continúe creciendo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
