export type Usuario = {
  id_usuario: number
  uid_usuario: string | null
  nombre: string
  email: string
  foto_perfil: string | null
  intereses: string | null
  rol: boolean
  fecha_registro: string
  fecha_actualizacion: string
  estatus: boolean
}

export type Destino = {
  id_destino: number
  nombre: string
  descripcion: string | null
  ubicacion: string | null
  url_mapa: string | null
  dificultad: string | null
  costo_entrada: number | null
  infraestructura: string | null
  biodiversidad: string | null
  fecha_registro: string
  fecha_actualizacion: string
  estatus: boolean
}

export type ImagenDestino = {
  id_imagen: number
  id_destino: number
  url_imagen: string
  fecha_registro: string
  fecha_actualizacion: string
  estatus: boolean
}

export type Resena = {
  id_resena: number
  id_usuario: number
  id_destino: number
  calificacion: number
  comentario: string | null
  fecha_registro: string
  fecha_actualizacion: string
  estatus: boolean
}

export type Favorito = {
  id_favorito: number
  id_usuario: number
  id_destino: number
  fecha_registro: string
  fecha_actualizacion: string
  estatus: boolean
}

// Tipos para las respuestas de la API
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
