'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  Loader2,
  Mail,
  User,
  Lock,
  EyeOff,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { signUp } from '@/actions/auth'
import { z } from 'zod'
import { CldImage } from 'next-cloudinary'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

const baseSignUpSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario es muy corto'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
})

const signUpSchema = baseSignUpSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  },
)

interface SignUpFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  email?: string
  password?: string
  username?: string
  general?: string
}

interface SignUpResponse {
  success: boolean
  error?: string
  fieldErrors?: {
    email?: string[]
    password?: string[]
    repeatPassword?: string[]
  }
}

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<SignUpFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }

  const validateForm = (): boolean => {
    try {
      signUpSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors
          if (
            field === 'email'
            || field === 'password'
            || field === 'username'
          ) {
            newErrors[field] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const fieldSchemas = {
    username: baseSignUpSchema.shape.username,
    email: baseSignUpSchema.shape.email,
    password: baseSignUpSchema.shape.password,
    repeatPassword: baseSignUpSchema.shape.confirmPassword,
  }

  const validateField = (field: keyof SignUpFormData, value: string): void => {
    try {
      fieldSchemas[field].parse(value)

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
      const form = new FormData()
      form.append('username', formData.username)
      form.append('email', formData.email)
      form.append('password', formData.password)
      form.append('repeatPassword', formData.password)

      const result = (await signUp(form)) as SignUpResponse

      if (result.success) {
        router.push('/profile')
        return
      }

      if (result.fieldErrors) {
        const newErrors: FormErrors = {}
        if (result.fieldErrors.email) {
          newErrors.email = result.fieldErrors.email[0]
        }
        if (result.fieldErrors.password) {
          newErrors.password = result.fieldErrors.password[0]
        }
        if (result.fieldErrors.repeatPassword) {
          newErrors.password = result.fieldErrors.repeatPassword[0]
        }
        setErrors(newErrors)
      } else {
        setErrors({ general: result.error ?? 'Error al registrarse' })
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Registration form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="w-full max-w-md space-y-6 md:space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="w-40 h-40 md:w-64 md:h-64 mx-auto mb-4 md:mb-6 rounded-full p-2">
              <Image
                src="/logo.png"
                alt="Logo"
                height={256}
                width={256}
                priority
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Registrarse
            </h1>
          </div>

          {/* Error general */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="username">Nombre de Usuario</Label>
              <div className="mt-1 md:mt-2 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="username"
                  value={formData.username}
                  autoComplete="off"
                  onChange={handleChange('username')}
                  onBlur={(e) => validateField('username', e.target.value)}
                  className="pl-10 py-2 md:py-3 text-sm md:text-base border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm">{errors.username}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="mt-1 md:mt-2 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@example.com"
                  value={formData.email}
                  onChange={handleChange('email')}
                  onBlur={(e) => validateField('email', e.target.value)}
                  className="pl-10 py-2 md:py-3 text-sm md:text-base border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange('password')}
                  onBlur={(e) => validateField('password', e.target.value)}
                  className={`pl-10 py-2 md:py-3 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Repetir contraseña</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  onBlur={(e) =>
                    validateField('confirmPassword', e.target.value)
                  }
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />{' '}
                  Registrando...
                </>
              ) : (
                'Registrarse'
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link
              href="/log-in"
              className="text-teal-600 hover:text-teal-700 text-sm md:text-base font-medium"
            >
              Ya tengo una cuenta
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Waterfall background */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <CldImage
          src="register"
          alt="Cascada de Misiones"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-teal-500/30 to-blue-500/30"></div>
      </div>
    </div>
  )
}
