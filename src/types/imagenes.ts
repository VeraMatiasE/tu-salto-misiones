export type Imagen = {
  id_imagen: number
  url_imagen: string
  fecha_actualizacion: string
  public_id: string
}

export type ImagenesDestino = {
  id_destino: string
  nombre: string
  imagenes: Imagen[]
}
