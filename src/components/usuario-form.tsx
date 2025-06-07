"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { BooleanRadioGroup } from "@/components/ui/boolean-radio-group"
import { signUp } from "@/actions/auth"

const formSchema = z.object({
  nombre: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres.",
  }),
  email: z.string().email({
    message: "Ingresa un correo electrónico válido.",
  }),
  password: z
    .string()
    .min(6, {
      message: "La contraseña debe tener al menos 6 caracteres.",
    })
    .optional(),
  repeatPassword: z
    .string()
    .min(6, {
      message: "La confirmación debe tener al menos 6 caracteres.",
    })
    .optional(),
  rol: z.boolean(),
}).refine((data) => {
  if (data.password && data.repeatPassword) {
    return data.password === data.repeatPassword;
  }
  return true;
}, {
  message: "Las contraseñas no coinciden",
  path: ["repeatPassword"],
});

type UsuarioFormProps = {
  initialData?: {
    id_usuario?: string
    nombre: string
    email: string
    rol: boolean
  }
}

export function UsuarioForm({ initialData }: UsuarioFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!initialData?.id_usuario

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          nombre: initialData.nombre,
          email: initialData.email,
          rol: initialData.rol,
        }
      : {
          nombre: "",
          email: "",
          password: "",
          repeatPassword: "",
          rol: false,
        },
  })

   async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setError(null)

    try {
      if (!isEditing) {
        const formData = new FormData()
        formData.append("nombre", values.nombre)
        formData.append("email", values.email)
        formData.append("password", values.password || "")
        formData.append("repeatPassword", values.repeatPassword || "")
        formData.append("rol", values.rol.toString())

        try {
          await signUp(formData)
        } catch (error) {
          if (error?.message !== 'NEXT_REDIRECT') {
            console.error("Error al crear usuario:", error)
            setError("Ocurrió un error al crear el usuario. Por favor, inténtalo de nuevo.")
            setIsSubmitting(false)
          }
          router.push("/dashboard/usuarios")
          router.refresh()
        }
      } else {
        if(!initialData.id_usuario)
          throw "No id";

        const response = await fetch(`/api/usuarios/${initialData.id_usuario}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
          },
            body: JSON.stringify(values),
          })

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        router.push("/dashboard/usuarios")
        router.refresh()
      }
    } catch (error) {
      console.error("Error al guardar:", error)
      setError("Ocurrió un error al procesar la solicitud. Por favor, inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-md">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del usuario" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="correo@ejemplo.com" {...field} disabled={isEditing}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Contraseña" {...field} />
                      </FormControl>
                      <FormDescription>Mínimo 6 caracteres</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repeatPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirmar contraseña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="rol"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Rol del usuario</FormLabel>
                  <FormControl>
                    <BooleanRadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      trueLabel="Administrador"
                      falseLabel="Usuario"
                      className="flex flex-col space-y-1"
                    />
                  </FormControl>
                  <FormDescription>
                    Los administradores tienen acceso completo a todas las funciones del sistema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/usuarios")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} variant="default">
            {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
