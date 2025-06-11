'use client'

import type React from 'react'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Save, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Navigation from '@/components/navigation'
import z from 'zod'

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .refine((val) => /[A-Z]/.test(val), {
        message: 'Debe contener al menos una letra mayúscula',
        path: ['password'],
      })
      .refine((val) => /[a-z]/.test(val), {
        message: 'Debe contener al menos una letra minúscula',
        path: ['password'],
      })
      .refine((val) => /\d/.test(val), {
        message: 'Debe contener al menos un número',
        path: ['password'],
      })
      .refine((val) => /[^a-zA-Z0-9]/.test(val), {
        message: 'Debe contener al menos un carácter especial',
        path: ['password'],
      }),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof passwordSchema>
type FormErrors = Partial<Record<keyof FormData | 'general', string[]>>

export default function CambiarPasswordPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    const result = passwordSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormErrors
        fieldErrors[key] ??= []
        fieldErrors[key].push(issue.message)
      }
      setErrors(fieldErrors)
      return
    }

    try {
      setErrors({})
      const response = await fetch('/api/auth/user/pass', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message ?? 'Error al actualizar la contraseña',
        )
      }

      router.push('/profile')
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al actualizar la contraseña'
      setErrors({ general: [errorMessage] })
    }
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <Navigation variant="back" currentPage={'perfil'} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Cambiar Contraseña
          </h1>
        </div>

        <Card className="bg-white border-gray-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-teal-600" />
              Actualizar Contraseña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nueva Contraseña */}
              <div>
                <Label htmlFor="nueva-password">Nueva contraseña</Label>
                <div className="mt-1 relative">
                  <Input
                    id="nueva-password"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 cursor-pointer" />
                    ) : (
                      <Eye className="h-4 w-4 cursor-pointer" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <ul className="text-sm text-red-600 mt-1 space-y-1">
                    {errors.password.map((err, idx) => (
                      <li key={`error-pass-${idx}`}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div>
                <Label htmlFor="confirmar-password">
                  Confirmar nueva contraseña
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="confirmar-password"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 cursor-pointer" />
                    ) : (
                      <Eye className="h-4 w-4 cursor-pointer" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <ul className="text-sm text-red-600 mt-1 space-y-1">
                    {errors.confirmPassword.map((err, idx) => (
                      <li key={`error-confirm-${idx}`}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Información de Seguridad */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  <strong>Consejo de seguridad:</strong> Usa una contraseña
                  única que no hayas usado en otros sitios. Considera usar un
                  administrador de contraseñas para generar y almacenar
                  contraseñas seguras.
                </AlertDescription>
              </Alert>

              {/* Botones */}
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
                  <Save className="h-4 w-4 mr-2" />
                  Cambiar Contraseña
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
