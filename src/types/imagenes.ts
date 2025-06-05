export type Imagen = {
    id_imagen: string
    url_imagen: string
    fecha_actualizacion: string
}

export type ImagenesDestino = {
    id_destino: string
    nombre: string
    imagenes: Imagen[]
}