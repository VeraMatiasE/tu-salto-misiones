"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, X, Trash2, AlertCircle, Check, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Imagen } from "@/types/imagenes"
import { useImageSizes } from "@/hooks/useImageSizes"

type ImagenUploadProps = {
  saltoId: string
  initialImages: Imagen[]
}

export function ImagenUpload({ saltoId, initialImages }: ImagenUploadProps) {
  const router = useRouter()
  const [images, setImages] = useState<Imagen[]>(initialImages)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deletingImages, setDeletingImages] = useState(new Set());

  const [tabValue, setTabValue] = useState("galeria");

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

  const { sizes, setSizes, loading, errors, getImageSize } = useImageSizes();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setError(null)

    const validFiles: File[] = []
    const newPreviewUrls: string[] = []

    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`El archivo "${file.name}" no es una imagen válida. Solo se permiten JPG, PNG y WebP.`)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`El archivo "${file.name}" excede el tamaño máximo de 5MB.`)
        return
      }

      validFiles.push(file)
      newPreviewUrls.push(URL.createObjectURL(file))
    })

    setSelectedFiles(validFiles)
    setPreviewUrls(newPreviewUrls)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setError('');
    setUploadProgress({});

    try {

      await uploadImagesOneByOne();

    } catch (error) {
      console.error("Error al subir imágenes:", error)
      setError("Ocurrió un error al subir las imágenes. Inténtalo de nuevo.")
    } finally {
      setIsUploading(false)
    }
  }

  const uploadImagesOneByOne = async () => {
    const results = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      try {
        setUploadProgress(prev => ({
          ...prev,
          [i]: { status: 'uploading', progress: 0 }
        }));
        
        /*
        const result = await uploadSingleImage(file, i);
        results.push(result);
        */

        // Simular carga
        await new Promise((resolve) => setTimeout(resolve, 150000))
        
        setUploadProgress(prev => ({
          ...prev,
          [i]: { status: 'completed', progress: 100 }
        }));
        
      } catch (error) {
        setUploadProgress(prev => ({
          ...prev,
          [i]: { status: 'error', error: error.message }
        }));
        throw error;
      }
    }
    
    handleUploadSuccess({ images: results });
  };

  const uploadSingleImage = async (file, index) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('destinoId', saltoId);
    formData.append('orden', index);
    
    const response = await fetch('/api/images', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error al subir ${file.name}`);
    }
    
    return await response.json();
  };

  const handleUploadSuccess = (result) => {
    setSelectedFiles([]);
    setPreviewUrls(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
    });
    setUploadProgress({});
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (result.images) {
      setImages(prevImages => [...prevImages, ...result.images]);
    }
    
    setTabValue("subir")
  };

  const handleRemovePreview = (indexToRemove: number) => {
    URL.revokeObjectURL(previewUrls[indexToRemove]);
  
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviewUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  }

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      setDeletingImages(prev => new Set([...prev, imageId]));

      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la imagen');
      }

      setImages(prevImages => 
        prevImages.filter(image => image.id_imagen !== imageId)
      );
      
      setSizes(prevSizes => {
        const newSizes = { ...prevSizes };
        delete newSizes[imageUrl];
        return newSizes;
      });
      
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
    } finally {
      setDeletingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="galeria" value={tabValue} onValueChange={setTabValue}>
        <TabsList>
          <TabsTrigger value="galeria">Galería</TabsTrigger>
          <TabsTrigger value="subir" id="subir-tab">Subir imágenes</TabsTrigger>
        </TabsList>

        {/* Pestaña de galería */}
        <TabsContent value="galeria" className="space-y-4">
          
          {/* Estado Normal - Sin imágenes */}
          {images.length === 0 && (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-muted p-3">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium">No hay imágenes</h3>
              <p className="text-muted-foreground mt-1 mb-4">Este destino aún no tiene imágenes.</p>
              <Button variant="outline" onClick={() => setTabValue("subir")}>
                Subir imágenes
              </Button>
            </div>
          )}
          
          {/* Estado Normal - Con imágenes */}
          {images.length > 0 && (

            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <Card key={image.id_imagen} className="overflow-hidden">
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image
                        src={image.url_imagen}
                        alt={`Imagen ${index + 1}`}
                        fill
                        className="object-cover rounded"
                        onLoad={() => getImageSize(image.url_imagen)}
                        onError={() => {
                        console.error(`Error al cargar imagen: ${image.url_imagen}`);
                      }}
                      />

                      {/* Mostrar spinner individual mientras carga el tamaño */}
                      {loading[image.url_imagen] && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}

                      <div className="absolute top-2 right-2 flex gap-2">
                        <AlertDialog>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="destructive"
                                    size="icon"
                                    disabled={deletingImages.has(image.id_imagen)}
                                  >
                                    {deletingImages.has(image.id_imagen) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>{deletingImages.has(image.id_imagen) ? 'Eliminando...' : 'Eliminar imagen'}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar esta imagen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. La imagen será eliminada permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={deletingImages.has(image.id_imagen)}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDeleteImage(image.id_imagen, image.url_imagen)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="font-medium truncate">Imagen {index + 1}</p>
                      <p className="text-sm text-muted-foreground">
                        {sizes[image.url_imagen] ? (
                          `${sizes[image.url_imagen].kb} KB • ${image.fecha_actualizacion}`
                        ) : loading[image.url_imagen] ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Calculando tamaño...
                          </span>
                        ) : errors[image.url_imagen] ? (
                          <span className="text-red-500">
                            {errors[image.url_imagen]} • {image.fecha_actualizacion}
                          </span>
                        ) : (
                          `${errors[image.url_imagen]} ${image.fecha_actualizacion}`
                        )}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Nombre</TableHead>
                      <TableHead className="font-bold">Tamaño</TableHead>
                      <TableHead className="font-bold">Fecha</TableHead>
                      <TableHead className="text-right font-bold">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {images.map((image) => (
                      <TableRow key={image.id_imagen}>
                        <TableCell className="font-medium">{image.url_imagen}</TableCell>
                        <TableCell>
                          {sizes[image.url_imagen] ? (
                            <p className="text-green-600">
                              {sizes[image.url_imagen].kb} KB
                              {sizes[image.url_imagen].mb >= 1 && ` (${sizes[image.url_imagen].mb} MB)`}
                            </p>
                          ) : 
                          loading[image.url_imagen] ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span className="text-sm">Calculando...</span>
                            </div>
                          ) : errors[image.url_imagen] ? (
                            <p className="text-red-500 text-sm">{errors[image.url_imagen]}</p>
                          ) : (
                            <p className="text-muted-foreground text-sm">No disponible</p>
                          )}
                        </TableCell>
                        <TableCell>{image.fecha_actualizacion}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-500 border-red-500 hover:bg-red-100"
                                disabled={deletingImages.has(image.id_imagen)}
                              >
                                {deletingImages.has(image.id_imagen) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar esta imagen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. La imagen será eliminada permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={deletingImages.has(image.id_imagen)}>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                                  disabled={deletingImages.has(image.id_imagen)}
                                  onClick={() => handleDeleteImage(image.id_imagen, image.url_imagen)}
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        {/* Pestaña de subir imágenes */}
        <TabsContent value="subir" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="images">Seleccionar imágenes</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      ref={fileInputRef}
                      id="images"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="flex-1 cursor-pointer"
                    />
                    <Button
                      onClick={handleUpload}
                      disabled={selectedFiles.length === 0 || isUploading}
                      variant="default"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                           Subir {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Formatos permitidos: JPG, PNG, WebP. Tamaño máximo: 5MB por imagen.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {previewUrls.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                      Vista previa ({previewUrls.length} imagen{previewUrls.length !== 1 ? 's' : ''})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                          <Image
                            src={url || "/placeholder.svg"}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />

                           {/* Overlay de progreso durante subida */}
                            {isUploading && uploadProgress[index] && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                {uploadProgress[index].status === 'uploading' && (
                                  <div className="text-center">
                                    <Loader2 className="h-6 w-6 text-white animate-spin mx-auto mb-2" />
                                    <p className="text-white text-xs">Subiendo...</p>
                                  </div>
                                )}
                                {uploadProgress[index].status === 'completed' && (
                                  <div className="text-center">
                                    <Check className="h-6 w-6 text-green-400 mx-auto mb-2" />
                                    <p className="text-green-400 text-xs">Completado</p>
                                  </div>
                                )}
                                {uploadProgress[index].status === 'error' && (
                                  <div className="text-center">
                                    <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                                    <p className="text-red-400 text-xs">Error</p>
                                  </div>
                                )}
                              </div>
                            )}

                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => handleRemovePreview(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isUploading && (
                  <Alert>
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <AlertTitle>Subiendo imágenes...</AlertTitle>
                    </div>
                    <AlertDescription>Por favor, espera mientras se suben las imágenes.</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/30 rounded-lg p-4 border">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-green-500" />
              Recomendaciones para imágenes
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Usa imágenes de alta calidad, preferiblemente con resolución mínima de 1200x800 píxeles.</li>
              <li>Asegúrate de que las imágenes estén bien iluminadas y muestren claramente el destino.</li>
              <li>Incluye diferentes ángulos y perspectivas del salto o cascada.</li>
              <li>Evita imágenes con marcas de agua o texto superpuesto.</li>
              <li>Asegúrate de tener los derechos para usar las imágenes que subas.</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.push("/dashboard/imagenes")}>
          Volver a la galería
        </Button>
      </div>
    </div>
  )
}
