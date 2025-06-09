'use client'

import type React from 'react'
import { useState, useTransition, useEffect, JSX } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, User, Lock, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { logIn } from '@/actions/auth'
import { CldImage } from 'next-cloudinary'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

interface LoginFormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

interface LoginResponse {
  success: boolean
  error?: string
  fieldErrors?: {
    email?: string[]
    password?: string[]
  }
}

export default function LoginPage(): JSX.Element {
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    const emailInput = document.getElementById('email') as HTMLInputElement
    const passwordInput = document.getElementById(
      'password',
    ) as HTMLInputElement

    const syncFormData = (): void => {
      const emailValue = emailInput?.value || ''
      const passwordValue = passwordInput?.value || ''

      if (
        emailValue !== formData.email
        || passwordValue !== formData.password
      ) {
        setFormData({
          email: emailValue,
          password: passwordValue,
        })
      }
    }

    syncFormData()

    // Verificar periódicamente por si el navegador completa después
    const interval = setInterval(syncFormData, 100)

    // Limpiar interval después de un tiempo razonable
    setTimeout(() => clearInterval(interval), 2000)

    return () => clearInterval(interval)
  }, [formData.email, formData.password])

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors
          if (field === 'email' || field === 'password') {
            newErrors[field] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleInputChange =
    (field: keyof LoginFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value
      setFormData((prev) => ({ ...prev, [field]: value }))

      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }

  const validateField = (field: keyof LoginFormData, value: string): void => {
    try {
      if (field === 'email') {
        loginSchema.shape.email.parse(value)
      } else if (field === 'password') {
        loginSchema.shape.password.parse(value)
      }
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: error.errors[0].message }))
      }
    }
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()

    if (!validateForm()) return

    startTransition(async () => {
      try {
        const formDataObj = new FormData()
        formDataObj.append('email', formData.email)
        formDataObj.append('password', formData.password)

        const result = (await logIn(formDataObj)) as LoginResponse

        if (result.success) {
          router.push('/profile')
        } else {
          if (result.fieldErrors) {
            const newErrors: FormErrors = {}
            if (result.fieldErrors.email) {
              newErrors.email = result.fieldErrors.email[0]
            }
            if (result.fieldErrors.password) {
              newErrors.password = result.fieldErrors.password[0]
            }
            setErrors(newErrors)
          } else {
            setErrors({ general: result.error || 'Error al iniciar sesión' })
          }
        }
      } catch (error) {
        console.error('Error en login:', error)
        setErrors({
          general: 'Ocurrió un error inesperado. Intenta nuevamente.',
        })
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <CldImage
          src="login"
          alt="Cascada de Misiones"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-l from-teal-500/30 to-blue-500/30"></div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="w-full max-w-md space-y-6 md:space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="w-40 h-40 md:w-64 md:h-64 mx-auto mb-4 md:mb-6 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo"
                height={256}
                width={256}
                priority
              />
            </div>

            <h1 className="font-title text-2xl md:text-3xl font-bold text-gray-900">
              Iniciar Sesión
            </h1>
          </div>

          {/* Error general */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Usuario</Label>
              <div className="mt-1 md:mt-2 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@example.com"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onBlur={(e) => validateField('email', e.target.value)}
                  className={`pl-10 py-2 md:py-3 text-sm md:text-base border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : ''
                  }`}
                  required
                  disabled={isPending}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="mt-1 md:mt-2 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  onBlur={(e) => validateField('password', e.target.value)}
                  className={`pl-10 pr-10 py-2 md:py-3 text-sm md:text-base border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : ''
                  }`}
                  required
                  disabled={isPending}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer disabled:cursor-not-allowed"
                  disabled={isPending}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white py-2 md:py-3 text-sm md:text-base font-medium rounded-lg transition-colors duration-200"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link
              href="/sign-up"
              className="font-text text-teal-600 hover:text-teal-700 text-sm md:text-base font-medium transition-colors duration-200"
            >
              Todavía no tengo una cuenta...
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
