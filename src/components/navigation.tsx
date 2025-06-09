'use client'

import { useEffect, useCallback, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  User,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Home,
  UserPlus,
  LogIn,
  Star,
  Map,
} from 'lucide-react'
import { useMobileMenu } from '@/hooks/use-mobile-menu'
import { CldImage } from 'next-cloudinary'
import { Usuario } from '@/types/database'
import { logOut } from '@/actions/auth'

type NavigationProps = Readonly<{
  variant?: 'default' | 'back'
  currentPage: NavegationPropsMobile
}>

interface UserData {
  id: string
  email: string
  nombre?: string
}

interface UserProfile {
  user: UserData
  profile?: Usuario
}

type NavegationPropsMobile = 'inicio' | 'saltos' | 'favoritos'

export default function Navigation({
  variant = 'default',
  currentPage = 'inicio',
}: NavigationProps) {
  const { isMobile, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
    useMobileMenu()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const isAuthenticated = Boolean(userProfile?.profile)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/user')
        if (response.ok) {
          const data = await response.json()
          setUserProfile(data)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuOpen, closeMobileMenu])

  useEffect(() => {
    return () => {
      closeMobileMenu()
    }
  }, [closeMobileMenu])

  const handleLinkClick = useCallback(() => {
    closeMobileMenu()
  }, [closeMobileMenu])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeMobileMenu()
      }
    },
    [closeMobileMenu],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeMobileMenu()
    }
  }

  const renderMobileMenu = () => {
    if (!isMobileMenuOpen) return null

    const isActive = (page: NavegationPropsMobile): boolean =>
      currentPage === page

    return (
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        tabIndex={-1}
        onClick={handleBackdropClick}
        onKeyDown={(e) => {
          if (e.key === 'Escape') handleKeyDown(e)
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div
          className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-header shadow-2xl rounded-l-xl animate-in slide-in-from-right duration-300"
          role="document"
          aria-labelledby="menu-header"
          tabIndex={0}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleKeyDown(e)
          }}
        >
          <div className="flex flex-col h-full">
            {/* Header del menú */}
            <div className="flex justify-between items-center p-4 border-b border-header-primary">
              <h2 className="text-xl font-semibold text-header-primary">
                Menú
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobileMenu}
                className="hover:bg-header-primary/10 text-header-primary"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-1">
                <div className="text-md font-semibold text-header-primary/60 uppercase tracking-wider mb-4 px-2">
                  Navegación
                </div>

                <Link
                  data-active={isActive('inicio')}
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors data-[active=true]:bg-white"
                  onClick={handleLinkClick}
                >
                  <Button variant={'sidebar'}>
                    <Home size={18} />
                    Inicio
                  </Button>
                </Link>
                <Link
                  data-active={isActive('saltos')}
                  href="/saltos"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors data-[active=true]:bg-white"
                  onClick={handleLinkClick}
                >
                  <Button variant={'sidebar'}>
                    <Map size={18} />
                    Todos los Saltos
                  </Button>
                </Link>

                {isAuthenticated ? (
                  <Link
                    data-active={isActive('favoritos')}
                    href="/favoritos"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors data-[active=true]:bg-white"
                    onClick={handleLinkClick}
                  >
                    <Button variant={'sidebar'}>
                      <Star size={18} />
                      Favoritos
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/log-in"
                      className="text-primary flex items-center gap-3 px-4 py-3 rounded-md text-black hover:bg-header-primary/10 transition-colors font-medium"
                      onClick={handleLinkClick}
                    >
                      <Button variant={'sidebar'}>
                        <LogIn size={18} />
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link
                      href="/sign-up"
                      className="text-primary flex items-center gap-3 px-4 py-3 rounded-md text-black hover:bg-header-primary/10 transition-colors font-medium"
                      onClick={handleLinkClick}
                    >
                      <Button variant={'sidebar'}>
                        <UserPlus size={18} />
                        Registrarse
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Usuario autenticado */}
            {userProfile?.profile && (
              <div className="border-t border-header-primary/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-header-primary rounded-full flex items-center justify-center text-white">
                      {userProfile.profile.foto_perfil ? (
                        <CldImage
                          src={userProfile.profile.foto_perfil}
                          alt="Foto de perfil"
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">
                        {userProfile.profile.nombre ?? 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-600">Cuenta activa</p>
                    </div>
                  </div>
                  <form>
                    <Button
                      variant="ghost"
                      size="icon"
                      formAction={logOut}
                      className="hover:text-primary text-black"
                      aria-label="Cerrar sesión"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <nav className="bg-header px-4 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      </nav>
    )
  }

  if (variant === 'back') {
    return (
      <>
        <nav className="bg-header px-4 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-black hover:text-header-primary transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="Volver al inicio"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
            </div>

            <Link
              href="/"
              className="text-2xl font-title font-bold text-black hover:text-header-primary transition-colors"
            >
              Tu Salto Misiones
            </Link>

            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-black hover:bg-white/10"
                onClick={toggleMobileMenu}
                aria-label="Abrir menú"
              >
                <Menu className="h-6 w-6" />
              </Button>
            ) : (
              <div className="flex items-center space-x-3">
                {userProfile?.profile ? (
                  <>
                    <div className="flex items-center space-x-2 text-white">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        {userProfile?.profile.foto_perfil ? (
                          <CldImage
                            src={userProfile.profile.foto_perfil}
                            alt="Foto de perfil"
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-black hidden sm:inline">
                        {userProfile?.user.nombre || 'Usuario'}
                      </span>
                    </div>
                    <form>
                      <Button
                        variant="ghost"
                        className="text-header-primary bg-transparent hover:text-header-primary/60 transition-colors"
                        formAction={logOut}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Salir
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/log-in">
                      <Button
                        variant="outline"
                        className="bg-teal-600 border-teal-600 text-white hover:bg-teal-700 hover:border-teal-700 transition-colors"
                      >
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button
                        variant="outline"
                        className="border-white text-white hover:bg-white hover:text-teal-600 transition-colors"
                      >
                        Registrarse
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
        {renderMobileMenu()}
      </>
    )
  }

  // Variante default que se adapta automáticamente según el estado de autenticación
  if (isAuthenticated) {
    return (
      <>
        <nav className="bg-header px-4 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {!isMobile && (
              <div className="flex items-center space-x-8">
                <Link
                  href="/"
                  className="text-black hover:text-header-primary font-medium transition-colors"
                >
                  Inicio
                </Link>
                <Link
                  href="/favoritos"
                  className="text-black hover:text-header-primary font-medium transition-colors"
                >
                  Favoritos
                </Link>
              </div>
            )}

            <Link
              href="/"
              className="text-2xl font-title font-bold text-black hover:text-header-primary transition-colors"
            >
              Tu Salto Misiones
            </Link>

            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-black hover:bg-white/10"
                onClick={toggleMobileMenu}
                aria-label="Abrir menú"
              >
                <Menu className="h-6 w-6" />
              </Button>
            ) : (
              <div className="flex items-center space-x-3">
                {userProfile?.profile ? (
                  <>
                    <div className="flex items-center space-x-2 text-white">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                        {userProfile?.profile.foto_perfil ? (
                          <CldImage
                            src={userProfile.profile.foto_perfil}
                            alt="Foto de perfil"
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-black hidden sm:inline">
                        {userProfile?.profile.nombre || 'Usuario'}
                      </span>
                    </div>
                    <form>
                      <Button
                        variant="outline"
                        className="text-header-primary bg-transparent hover:text-header-primary/60 transition-colors"
                        formAction={logOut}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Salir
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/log-in">
                      <Button
                        variant="outline"
                        className="bg-teal-600 border-teal-600 text-white hover:bg-teal-700 hover:border-teal-700 transition-colors"
                      >
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button
                        variant="outline"
                        className="border-white text-white hover:bg-white hover:text-teal-600 transition-colors"
                      >
                        Registrarse
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
        {renderMobileMenu()}
      </>
    )
  }

  // Variante para usuarios no autenticados
  return (
    <>
      <nav className="bg-header px-4 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {!isMobile && (
            <Link
              href="/saltos"
              className="text-black hover:text-header-primary font-medium transition-colors"
            >
              Todos los Saltos
            </Link>
          )}

          <Link
            href="/"
            className={`text-2xl font-title font-bold text-black hover:text-header-primary transition-colors ${isMobile ? 'mr-auto ml-2' : ''}`}
          >
            Tu Salto Misiones
          </Link>

          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-black hover:bg-white/10"
              onClick={toggleMobileMenu}
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </Button>
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/log-in">
                <Button variant="default" className="bg-header-primary">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  variant="outline"
                  className="bg-header text-header-primary border-header-primary"
                >
                  Registrarse
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>
      {renderMobileMenu()}
    </>
  )
}
