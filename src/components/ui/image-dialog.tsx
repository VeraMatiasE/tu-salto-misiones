'use client'
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X, Download, Share2 } from 'lucide-react'
import { CldImage } from 'next-cloudinary'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface ImageDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  src: string
  alt?: string
  width?: number
  height?: number
  maxWidth?: number
  maxHeight?: number
  downloadUrl?: string
  onDownload?: () => void
  onShare?: () => void
  downloadFileName?: string
}

const ImageDialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  ImageDialogContentProps
>(
  (
    {
      className,
      src,
      alt = 'Image',
      width = 800,
      height = 600,
      maxWidth = 90,
      maxHeight = 90,
      downloadUrl,
      onDownload,
      onShare,
      downloadFileName,
      ...props
    },
    ref,
  ) => {
    const handleDownload = async () => {
      if (onDownload) {
        onDownload()
        return
      }

      if (!downloadUrl) return

      try {
        const response = await fetch(downloadUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = downloadFileName || `image-${src}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error downloading image:', error)
      }
    }

    const handleShare = async () => {
      if (onShare) {
        onShare()
        return
      }

      try {
        if (navigator.share) {
          await navigator.share({
            title: alt,
            text: `Check out this image: ${alt}`,
            url: window.location.href,
          })
        } else {
          await navigator.clipboard.writeText(window.location.href)
          alert('URL copied to clipboard!')
        }
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
            className,
          )}
          style={{
            maxWidth: `${maxWidth}vw`,
            maxHeight: `${maxHeight}vh`,
          }}
          {...props}
        >
          {/* Título oculto para accesibilidad */}
          <DialogPrimitive.Title className="sr-only">
            {alt}
          </DialogPrimitive.Title>

          <div className="relative">
            <CldImage
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{
                maxWidth: `${maxWidth}vw`,
                maxHeight: `${maxHeight - 10}vh`, // Dejamos espacio para los botones
              }}
            />

            {/* Botón de cerrar */}
            <DialogPrimitive.Close className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>

            {/* Botones de acción */}
            <div className="absolute bottom-2 right-2 flex gap-2">
              <button
                onClick={handleShare}
                className="rounded-full bg-black/50 p-2 text-white opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </button>

              {downloadUrl && (
                <button
                  onClick={handleDownload}
                  className="rounded-full bg-black/50 p-2 text-white opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </button>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    )
  },
)
ImageDialogContent.displayName = 'ImageDialogContent'

interface ImageDialogProps {
  src: string
  alt?: string
  width?: number
  height?: number
  maxWidth?: number
  maxHeight?: number
  downloadUrl?: string
  trigger?: React.ReactNode
  onDownload?: () => void
  onShare?: () => void
  downloadFileName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const ImageDialog: React.FC<ImageDialogProps> = ({
  src,
  alt,
  width,
  height,
  maxWidth,
  maxHeight,
  downloadUrl,
  trigger,
  onDownload,
  onShare,
  downloadFileName,
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <ImageDialogContent
        src={src}
        alt={alt}
        width={width}
        height={height}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        downloadUrl={downloadUrl}
        onDownload={onDownload}
        onShare={onShare}
        downloadFileName={downloadFileName}
      />
    </Dialog>
  )
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  ImageDialogContent,
  ImageDialog,
}
