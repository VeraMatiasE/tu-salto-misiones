'use client'

import type React from 'react'

import { useState } from 'react'
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Camera,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'

const tiposConsulta = [
  { value: 'general', label: 'Consulta general' },
  { value: 'sugerir-salto', label: 'Sugerir nuevo salto' },
  { value: 'error-informacion', label: 'Reportar error en información' },
  { value: 'problema-tecnico', label: 'Problema técnico' },
  { value: 'colaboracion', label: 'Propuesta de colaboración' },
  { value: 'otro', label: 'Otro' },
]

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    tipoConsulta: '',
    asunto: '',
    mensaje: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Enviando consulta:', formData)
    // Aquí iría la lógica para enviar el formulario
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation currentPage={'inicio'} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 py-16 px-4">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <MessageCircle className="w-16 h-16 text-white mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contáctanos
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            ¿Tienes alguna pregunta, sugerencia o quieres colaborar con
            nosotros? Nos encantaría escucharte.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Formulario de Contacto */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Envíanos un mensaje</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombre">Nombre completo</Label>
                      <Input
                        id="nombre"
                        type="text"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tipo-consulta">Tipo de consulta</Label>
                    <Select
                      value={formData.tipoConsulta}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tipoConsulta: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona el tipo de consulta" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposConsulta.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="asunto">Asunto</Label>
                    <Input
                      id="asunto"
                      type="text"
                      value={formData.asunto}
                      onChange={(e) =>
                        setFormData({ ...formData, asunto: e.target.value })
                      }
                      className="mt-1"
                      placeholder="Describe brevemente tu consulta"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="mensaje">Mensaje</Label>
                    <Textarea
                      id="mensaje"
                      value={formData.mensaje}
                      onChange={(e) =>
                        setFormData({ ...formData, mensaje: e.target.value })
                      }
                      className="mt-1"
                      rows={6}
                      placeholder="Cuéntanos más detalles sobre tu consulta..."
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar mensaje
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-teal-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Email</h4>
                    <p className="text-sm text-gray-600">
                      contacto@tusalto.misiones.ar
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-teal-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Teléfono</h4>
                    <p className="text-sm text-gray-600">+54 9 3757 123-456</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-teal-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Ubicación</h4>
                    <p className="text-sm text-gray-600">
                      Posadas, Misiones, Argentina
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-teal-600" />
                  Sugerir un salto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  ¿Conoces algún salto o cascada que no esté en nuestra
                  plataforma? ¡Nos encantaría incluirlo!
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Nombre y ubicación del salto</li>
                  <li>• Fotos del lugar</li>
                  <li>• Información sobre acceso</li>
                  <li>• Servicios disponibles</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Reportar problema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Si encontraste información incorrecta o experimentaste algún
                  problema técnico, por favor repórtalo para que podamos
                  solucionarlo rápidamente.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
              <CardContent className="p-6 text-center">
                <h4 className="font-semibold text-teal-800 mb-2">
                  Tiempo de respuesta
                </h4>
                <p className="text-sm text-teal-700">
                  Respondemos todas las consultas en un plazo máximo de 48 horas
                  hábiles.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
