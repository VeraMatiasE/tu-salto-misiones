'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Save, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Navigation from '@/components/navigation'
import { UserData } from '@/types/usuario'
import z from 'zod'

const emailSchema = z
  .object({
    emailActual: z.string().email(),
    nuevoEmail: z.string().email({ message: 'El nuevo correo no es válido' }),
    confirmarEmail: z
      .string()
      .email({ message: 'La confirmación no es válida' }),
    password: z.string().min(1, 'La contraseña actual es requerida'),
  })
  .refine((data) => data.nuevoEmail !== data.emailActual, {
    message: 'El nuevo correo debe ser diferente al actual',
    path: ['nuevoEmail'],
  })
  .refine((data) => data.nuevoEmail === data.confirmarEmail, {
    message: 'Los correos electrónicos no coinciden',
    path: ['confirmarEmail'],
  })

type FormData = z.infer<typeof emailSchema>
type FormErrors = Partial<Record<keyof FormData | 'general', string>>

export default function CambiarEmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<FormData | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setErrors({})

        const userResponse = await fetch('/api/auth/user')
        if (!userResponse.ok) {
          const errorData = await userResponse.json().catch(() => ({}))
          throw new Error(
            errorData.message ?? 'Error al cargar datos del usuario',
          )
        }

        const user: UserData = await userResponse.json()
        setFormData({
          emailActual: user.profile.email,
          confirmarEmail: '',
          nuevoEmail: '',
          password: '',
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error desconocido al cargar los datos'
        setErrors({ general: errorMessage })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    const result = emailSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormErrors
        fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    try {
      setErrors({})
      const response = await fetch('/api/auth/user/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevoEmail: formData.nuevoEmail,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message ?? 'Error al actualizar el correo')
      }

      router.push('/profile')
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al actualizar el correo'
      setErrors({ general: errorMessage })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
        <Navigation variant="back" currentPage={'inicio'} />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <span className="ml-2 text-gray-600">
              Cargando datos del perfil...
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
        <Navigation variant="back" currentPage={'inicio'} />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Editar Perfil</h1>
          </div>

          {errors.general && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {errors.general}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center py-8">
            <Button onClick={() => window.location.reload()} variant="outline">
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation variant="back" currentPage={'inicio'} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Cambiar Correo Electrónico
          </h1>
        </div>

        <Card className="bg-white border-gray-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-600" /> Actualizar Correo
              Electrónico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email-actual">Correo electrónico actual</Label>
                <Input
                  id="email-actual"
                  type="email"
                  value={formData.emailActual}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="nuevo-email">Nuevo correo electrónico</Label>
                <Input
                  id="nuevo-email"
                  type="email"
                  value={formData.nuevoEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, nuevoEmail: e.target.value })
                  }
                  className="mt-1"
                  placeholder="nuevo@ejemplo.com"
                />
                {errors.nuevoEmail && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.nuevoEmail}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmar-email">
                  Confirmar nuevo correo electrónico
                </Label>
                <Input
                  id="confirmar-email"
                  type="email"
                  value={formData.confirmarEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmarEmail: e.target.value })
                  }
                  className="mt-1"
                  placeholder="nuevo@ejemplo.com"
                />
                {errors.confirmarEmail && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.confirmarEmail}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Contraseña actual</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="mt-1"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  <strong>Importante:</strong> Después de cambiar tu correo
                  electrónico, recibirás un email de confirmación en tu nueva
                  dirección. Deberás verificarla para completar el proceso.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-teal-500 hover:bg-teal-600"
                >
                  <Save className="h-4 w-4 mr-2" /> Cambiar Email
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
