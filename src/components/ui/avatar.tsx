'use client'
import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { CldImage } from 'next-cloudinary'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className,
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof CldImage>, 'src'> & {
    src?: string
    className?: string
  }
>(
  (
    { className, src, alt = 'Avatar', width = 40, height = 40, ...props },
    ref,
  ) => (
    <div ref={ref} className={cn('aspect-square h-full w-full', className)}>
      {src ? (
        <CldImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-full w-full object-cover"
          {...props}
        />
      ) : (
        <User
          width={width}
          height={height}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  ),
)
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className,
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
