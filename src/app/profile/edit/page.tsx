'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Save, Lock, Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Navigation from '@/components/navigation'
import Link from 'next/link'
import { UserData, UserProfile } from '@/types/usuario'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      'El nombre solo puede contener letras y espacios',
    ),

  intereses: z
    .string()
    .max(500, 'Los intereses no pueden exceder 500 caracteres')
    .optional()
    .transform((val) => val?.trim() || ''),

  foto_perfil: z.string().optional().nullable(),
})

const imageFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'La imagen no puede ser mayor a 5MB',
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Solo se permiten archivos JPG, PNG o WebP',
    ),
})

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>

interface ValidationErrors {
  nombre?: string[]
  intereses?: string[]
  foto_perfil?: string[]
  general?: string[]
}

interface FormErrors {
  general?: string
  nombre?: string
  intereses?: string
  imagen?: string
}

const formatZodErrors = (error: z.ZodError): ValidationErrors => {
  const formattedErrors: ValidationErrors = {}

  error.errors.forEach((err) => {
    const field = err.path[0] as keyof ValidationErrors
    if (!formattedErrors[field]) {
      formattedErrors[field] = []
    }
    formattedErrors[field]?.push(err.message)
  })

  return formattedErrors
}

const convertToFormErrors = (
  validationErrors: ValidationErrors,
): FormErrors => {
  const formErrors: FormErrors = {}

  if (validationErrors.nombre?.length) {
    formErrors.nombre = validationErrors.nombre[0]
  }
  if (validationErrors.intereses?.length) {
    formErrors.intereses = validationErrors.intereses[0]
  }
  if (validationErrors.foto_perfil?.length) {
    formErrors.imagen = validationErrors.foto_perfil[0]
  }
  if (validationErrors.general?.length) {
    formErrors.general = validationErrors.general[0]
  }

  return formErrors
}

export default function EditarPerfilPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<UserProfile | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setErrors({})

        const userResponse = await fetch('/api/auth/user')
        if (!userResponse.ok) {
          const errorData = await userResponse.json().catch(() => ({}))
          throw new Error(
            errorData.message || 'Error al cargar datos del usuario',
          )
        }

        const user: UserData = await userResponse.json()
        setFormData(user.profile)
        setOriginalImageUrl(user.profile.foto_perfil ?? null)
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

    try {
      setSaving(true)
      setErrors({})

      const validationData: ProfileUpdateData = {
        nombre: formData.nombre || '',
        intereses: formData.intereses || '',
      }

      const validationResult = profileUpdateSchema.safeParse(validationData)

      if (!validationResult.success) {
        const zodErrors = formatZodErrors(validationResult.error)
        const formErrors = convertToFormErrors(zodErrors)
        setErrors(formErrors)
        return
      }

      const validatedData = validationResult.data
      let imageUrl = formData.foto_perfil

      if (selectedImageFile) {
        const formDataUpload = new FormData()
        formDataUpload.append('image', selectedImageFile)

        const imageResponse = await fetch('/api/usuarios/foto-perfil', {
          method: 'POST',
          body: formDataUpload,
        })

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json().catch(() => ({}))
          throw new Error(errorData.message || 'Error al subir la imagen')
        }

        const uploadResult = await imageResponse.json()
        imageUrl = uploadResult?.data?.public_id || ''
      }

      const response = await fetch('/api/auth/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: validatedData.nombre,
          intereses: validatedData.intereses,
          foto_perfil: imageUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 400 && errorData.errors) {
          const serverErrors: FormErrors = {}

          if (Array.isArray(errorData.errors)) {
            errorData.errors.forEach(
              (error: { field?: string; message: string }) => {
                if (error.field && error.field in serverErrors) {
                  const field = error.field as keyof FormErrors
                  serverErrors[field] = error.message
                } else {
                  serverErrors.general = error.message
                }
              },
            )
          } else {
            serverErrors.general =
              errorData.message || 'Error de validación del servidor'
          }

          setErrors(serverErrors)
          return
        }

        throw new Error(errorData.message || 'Error al guardar los cambios')
      }

      router.push('/profile')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido al guardar'
      setErrors({ general: errorMessage })
    } finally {
      setSaving(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !formData) return

    try {
      setErrors({ ...errors, imagen: undefined })

      const fileValidation = imageFileSchema.safeParse({ file })
      if (!fileValidation.success) {
        const zodErrors = formatZodErrors(fileValidation.error)
        const firstError =
          zodErrors.foto_perfil?.[0] || 'Error de validación del archivo'
        setErrors({ ...errors, imagen: firstError })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewImageUrl(event.target.result as string)
          setSelectedImageFile(file)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al procesar la imagen'
      setErrors({ ...errors, imagen: errorMessage })
    }
  }

  const handleCancelImageChange = () => {
    setSelectedImageFile(null)
    setPreviewImageUrl(null)
    // Limpiar el input file
    const fileInput = document.getElementById(
      'avatar-upload',
    ) as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (!formData) return

    setFormData({
      ...formData,
      [field]: value,
    })

    if (errors[field as keyof FormErrors]) {
      setErrors({
        ...errors,
        [field]: undefined,
      })
    }
  }

  const validateField = (field: keyof ProfileUpdateData, value: string) => {
    try {
      if (field === 'nombre') {
        profileUpdateSchema.shape.nombre.parse(value)
      } else if (field === 'intereses') {
        profileUpdateSchema.shape.intereses.parse(value)
      }

      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]?.message
        setErrors((prev) => ({
          ...prev,
          [field]: firstError,
        }))
      }
    }
  }

  const handleInputChangeWithValidation = (
    field: keyof UserProfile,
    value: string,
  ) => {
    handleInputChange(field, value)

    // Validación en tiempo real solo después de que el usuario ha intentado enviar
    if (Object.keys(errors).length > 0) {
      setTimeout(() => {
        validateField(field as keyof ProfileUpdateData, value)
      }, 300) // Debounce de 300ms
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
          <h1 className="text-2xl font-bold text-gray-900">Editar Perfil</h1>
        </div>

        {errors.general && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {errors.general}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Información Personal */}
          <Card className="bg-white border-gray-400">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-24 h-24">
                    {previewImageUrl ? (
                      // Mostrar preview temporal usando img normal
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : originalImageUrl ? (
                      // Mostrar imagen de Cloudinary o fallback
                      <AvatarImage
                        src={formData.foto_perfil}
                        alt={formData.nombre ?? 'Foto de perfil'}
                      />
                    ) : (
                      <AvatarFallback className="text-2xl bg-teal-500 text-white">
                        {formData.nombre
                          ? formData.nombre
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                          : 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="text-center space-y-2">
                    <div className="flex gap-2 justify-center">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={saving}
                      />
                      <Label htmlFor="avatar-upload">
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          disabled={saving}
                          asChild
                        >
                          <span>
                            {saving ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {saving ? 'Subiendo...' : 'Cambiar foto'}
                          </span>
                        </Button>
                      </Label>

                      {selectedImageFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancelImageChange}
                          disabled={saving}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                    {selectedImageFile && (
                      <p className="text-sm text-blue-600">
                        Nueva imagen seleccionada. Se guardará al confirmar los
                        cambios.
                      </p>
                    )}

                    {errors.imagen && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.imagen}
                      </p>
                    )}
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    type="text"
                    value={formData.nombre || ''}
                    onChange={(e) =>
                      handleInputChangeWithValidation('nombre', e.target.value)
                    }
                    className={`mt-1 ${errors.nombre ? 'border-red-500' : ''}`}
                    required
                    disabled={saving}
                    placeholder="Tu nombre completo"
                  />
                  {errors.nombre && (
                    <p className="text-sm text-red-600 mt-1">{errors.nombre}</p>
                  )}
                </div>

                {/* Intereses */}
                <div>
                  <Label htmlFor="intereses">
                    Intereses
                    <span className="text-sm text-gray-500 ml-1">
                      (opcional)
                    </span>
                  </Label>
                  <Textarea
                    id="intereses"
                    value={formData.intereses || ''}
                    onChange={(e) =>
                      handleInputChangeWithValidation(
                        'intereses',
                        e.target.value,
                      )
                    }
                    className={`mt-1 ${errors.intereses ? 'border-red-500' : ''}`}
                    rows={4}
                    placeholder="Cuéntanos un poco sobre ti..."
                    disabled={saving}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.intereses ? (
                      <p className="text-sm text-red-600">{errors.intereses}</p>
                    ) : (
                      <div />
                    )}
                    <p className="text-sm text-gray-500">
                      {(formData.intereses || '').length}/500
                    </p>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                    disabled={saving || uploadingImage}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-teal-500 hover:bg-teal-600"
                    disabled={saving || uploadingImage}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Configuración de Seguridad */}
          <Card className="bg-white border-gray-400">
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-center justify-between p-4 border border-gray-400 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-teal-600" />
                  <div>
                    <h4 className="font-medium">Correo electrónico</h4>
                    <p className="text-sm text-gray-600">{formData.email}</p>
                  </div>
                </div>
                <Link href="/perfil/cambiar-email">
                  <Button variant="outline" size="sm">
                    Cambiar
                  </Button>
                </Link>
              </div>

              {/* Contraseña */}
              <div className="flex items-center justify-between p-4 border border-gray-400 rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-teal-600" />
                  <div>
                    <h4 className="font-medium">Contraseña</h4>
                    <p className="text-sm text-gray-600">••••••••</p>
                  </div>
                </div>
                <Link href="/perfil/cambiar-password">
                  <Button variant="outline" size="sm">
                    Cambiar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
