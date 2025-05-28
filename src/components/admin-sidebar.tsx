"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Droplets, ImageIcon, Home, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function DashboardSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname?.startsWith(path)
  }

  const NavItems = () => (
    <div className="space-y-1">
      <NavItem
        href="/dashboard/saltos"
        icon={<Droplets className="h-4 w-4" />}
        label="Saltos y Cascadas"
        active={isActive("/dashboard/saltos")}
      />
      <NavItem
        href="/dashboard/usuarios"
        icon={<Users className="h-4 w-4" />}
        label="Usuarios"
        active={isActive("/dashboard/usuarios")}
      />
      <NavItem
        href="/dashboard/imagenes"
        icon={<ImageIcon className="h-4 w-4" />}
        label="Imágenes"
        active={isActive("/dashboard/imagenes")}
      />
    </div>
  )

  return (
    <>
      {/* Sidebar para desktop */}
      <div className="hidden md:flex h-screen w-64 flex-col fixed inset-y-0 z-50 border-r bg-background">
        <div className="flex h-14 items-center border-b px-4 bg-header">
          <Link href="/dashboard/saltos" className="flex items-center gap-2">
            <span className="font-title font-semibold text-lg">Tu Salto Misiones</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2 px-4">
          <NavItems />
        </div>
        <div className="border-t p-4">
          <div className="space-y-1">
            <NavItem href="/" icon={<Home className="h-4 w-4" />} label="Ir al sitio" />
            <NavItem href="/auth/logout" icon={<LogOut className="h-4 w-4" />} label="Cerrar sesión" />
          </div>
        </div>
      </div>

      {/* Sidebar para móvil (hamburger menu) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center border-b bg-header px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-14 items-center border-b px-4 bg-header">
              <Link href="/dashboard/saltos" className="flex items-center gap-2">
                <span className="font-title font-semibold text-lg">Tu Salto Misiones</span>
              </Link>
            </div>
            <div className="flex-1 overflow-auto py-2 px-4">
              <NavItems />
            </div>
            <div className="border-t p-4">
              <div className="space-y-1">
                <NavItem href="/" icon={<Home className="h-4 w-4" />} label="Ir al sitio" />
                <NavItem href="/auth/logout" icon={<LogOut className="h-4 w-4" />} label="Cerrar sesión" />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex-1 flex justify-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-title font-semibold">Tu Salto Misiones</span>
          </Link>
        </div>
        <div className="w-10"></div> 
      </div>

      <div className="md:hidden h-14"></div>

      <div className="hidden md:block w-64"></div>
    </>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-text font-medium hover:bg-accent hover:text-white",
        active && "bg-primary text-white",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
