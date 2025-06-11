export interface Comentario {
  id_usuario: number
  id_resena: number
  usuarios: {
    foto_perfil: string
    nombre: string
  }
  calificacion: number
  comentario: string
  fecha_actualizacion: string
}

export interface ComentarioRequest {
  id_salto: number
  nombre: string
  puntuacion: number
  comentario: string
}
