'use client'

import { useEffect, useState, useRef } from 'react'
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
  Settings,
} from 'lucide-react'
import { useMobileMenu } from '@/hooks/use-mobile-menu'
import { CldImage } from 'next-cloudinary'
import { Usuario } from '@/types/database'
import { logOut } from '@/actions/auth'
import { useAuth } from '@/components/auth-wrapper'

interface UserData {
  id: string
  email: string
  nombre?: string
}

interface UserProfile {
  user: UserData
  profile?: Usuario
}

type NavegationPropsMobile = 'inicio' | 'saltos' | 'favoritos' | 'perfil'

type NavigationProps = Readonly<{
  variant?: 'default' | 'back'
  currentPage: NavegationPropsMobile
}>

function useUserProfile(isAuthenticated: boolean) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      setUserProfile(null)
      setLoading(false)
      return
    }

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
  }, [isAuthenticated])

  return {
    userProfile,
    loading,
  }
}

type UserAvatarProps = Readonly<{
  profile?: Usuario
  size?: 'sm' | 'md'
  className?: string
}>

function UserAvatar({ profile, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
  }

  const iconSizes = {
    sm: 16,
    md: 20,
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-header-primary rounded-full flex items-center justify-center text-white overflow-hidden ${className}`}
    >
      {profile?.foto_perfil ? (
        <CldImage
          src={profile.foto_perfil}
          alt="Foto de perfil"
          width={size === 'sm' ? 32 : 40}
          height={size === 'sm' ? 32 : 40}
          className="rounded-full object-cover"
        />
      ) : (
        <User
          className={`h-${iconSizes[size] / 4} w-${iconSizes[size] / 4} text-black`}
        />
      )}
    </div>
  )
}

type NavigationLinksProps = Readonly<{
  isAuthenticated: boolean
  currentPage: NavegationPropsMobile
  onLinkClick: () => void
  isMobile?: boolean
  rol?: boolean
}>

interface NavItem {
  href: string
  label: string
  icon?: React.ComponentType<{ size?: number }>
  requiresAuth?: boolean
  requiresRole?: boolean
  page?: NavegationPropsMobile
}

type NavLinkProps = Readonly<{
  item: NavItem
  isActive: boolean
  onClick?: () => void
  isMobile: boolean
}>

const MobileNavLink = ({ item, isActive, onClick }: NavLinkProps) => {
  const Icon = item.icon
  const baseLinkClass =
    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors data-[active=true]:bg-white'

  return (
    <Link
      data-active={isActive}
      href={item.href}
      className={baseLinkClass}
      onClick={onClick}
    >
      <Button variant="sidebar">
        {Icon && <Icon size={18} />}
        {item.label}
      </Button>
    </Link>
  )
}

const DesktopNavLink = ({ item, isActive }: NavLinkProps) => {
  const baseLinkClass =
    'relative h-full flex items-center px-4 text-gray-700 hover:text-header-primary font-medium transition-all duration-300 group'
  const activeLinkClass = 'text-header-primary font-semibold'

  return (
    <Link
      href={item.href}
      className={`${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
    >
      {item.label}
      <span className="absolute bottom-0 left-1/2 w-0 h-[3px] bg-header-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
    </Link>
  )
}

function NavigationLinks({
  isAuthenticated,
  currentPage,
  onLinkClick,
  isMobile = false,
  rol = false,
}: NavigationLinksProps) {
  const isActive = (page: NavegationPropsMobile): boolean =>
    currentPage === page

  const navItems: NavItem[] = [
    {
      href: '/',
      label: 'Inicio',
      icon: Home,
      page: 'inicio',
    },
    {
      href: '/saltos',
      label: 'Todos los Saltos',
      icon: Map,
      page: 'saltos',
    },
    {
      href: '/favoritos',
      label: 'Favoritos',
      icon: Star,
      requiresAuth: true,
      page: 'favoritos',
    },
    {
      href: '/dashboard/saltos',
      label: 'Dashboard Saltos',
      icon: Settings,
      requiresRole: true,
    },
  ]

  const getVisibleItems = (): NavItem[] => {
    return navItems.filter((item) => {
      if (item.requiresAuth && !isAuthenticated) return false
      if (item.requiresRole && !rol) return false

      // Para desktop: mostrar "Todos los Saltos" solo si no está autenticado
      if (!isMobile && item.page === 'saltos' && isAuthenticated) return false

      return true
    })
  }

  const visibleItems = getVisibleItems()

  return (
    <>
      {visibleItems.map((item) => {
        const active = item.page ? isActive(item.page) : false

        return isMobile ? (
          <MobileNavLink
            key={item.href}
            item={item}
            isActive={active}
            onClick={onLinkClick}
            isMobile={isMobile}
          />
        ) : (
          <DesktopNavLink
            key={item.href}
            item={item}
            isActive={active}
            isMobile={isMobile}
          />
        )
      })}
    </>
  )
}

type AuthButtonsProps = Readonly<{
  isAuthenticated: boolean
  userProfile: UserProfile | null
  onLinkClick?: () => void
  isMobile?: boolean
  variant?: 'default' | 'back'
}>

function AuthButtons({
  isAuthenticated,
  userProfile,
  onLinkClick,
  isMobile = false,
  variant = 'default',
}: AuthButtonsProps) {
  if (isAuthenticated && userProfile?.profile) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-white">
          <UserAvatar
            profile={userProfile.profile}
            size="sm"
            className="bg-white/20"
          />
          <span className="text-black hidden sm:inline">
            {userProfile.profile.nombre ?? 'Usuario'}
          </span>
        </div>
        <form>
          <Button
            variant={variant === 'back' ? 'ghost' : 'outline'}
            className="text-header-primary bg-transparent hover:text-header-primary/60 transition-colors"
            formAction={logOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </form>
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        <Link
          href="/log-in"
          className="text-primary flex items-center gap-3 px-4 py-3 rounded-md hover:bg-header-primary/10 transition-colors font-medium"
          onClick={onLinkClick}
        >
          <Button variant={'sidebar'}>
            <LogIn size={18} />
            Iniciar Sesión
          </Button>
        </Link>
        <Link
          href="/sign-up"
          className="text-primary flex items-center gap-3 px-4 py-3 rounded-md hover:bg-header-primary/10 transition-colors font-medium"
          onClick={onLinkClick}
        >
          <Button variant={'sidebar'}>
            <UserPlus size={18} />
            Registrarse
          </Button>
        </Link>
      </>
    )
  }

  return (
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
  )
}

type MobileMenuProps = Readonly<{
  isOpen: boolean
  onClose: () => void
  currentPage: NavegationPropsMobile
  isAuthenticated: boolean
  userProfile: UserProfile | null
}>

function MobileMenu({
  isOpen,
  onClose,
  currentPage,
  isAuthenticated,
  userProfile,
}: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  const handleClose = () => {
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current
    if (!dialog) return

    const rect = dialog.getBoundingClientRect()
    const isInDialog =
      e.clientX >= rect.left
      && e.clientX <= rect.right
      && e.clientY >= rect.top
      && e.clientY <= rect.bottom

    if (!isInDialog) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={handleBackdropClick}
      aria-label="Menú de navegación"
      className="p-0 m-0 w-screen h-screen max-w-none max-h-none bg-transparent backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          handleClose()
        }
      }}
    >
      <div
        className="fixed right-0 top-0 h-full w-4/5 max-w-sm bg-header shadow-2xl rounded-l-xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="flex flex-col h-full">
          {/* Header del menú */}
          <div className="flex justify-between items-center p-4 border-b border-header-primary">
            <h2 className="text-xl font-semibold text-header-primary">Menú</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="hover:bg-header-primary/10 text-header-primary"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto">
            <NavigationLinks
              isAuthenticated={isAuthenticated}
              currentPage={currentPage}
              onLinkClick={handleClose}
              isMobile={true}
              rol={userProfile?.profile?.rol}
            />

            {!isAuthenticated && (
              <div className="p-4 space-y-1">
                <AuthButtons
                  isAuthenticated={isAuthenticated}
                  userProfile={userProfile}
                  onLinkClick={handleClose}
                  isMobile={true}
                />
              </div>
            )}
          </div>

          {/* Usuario autenticado */}
          {userProfile?.profile && (
            <div className="border-t border-header-primary/30 p-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/profile"
                  onClick={handleClose}
                  className="block hover:bg-header-primary/5 rounded-lg p-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar profile={userProfile.profile} />
                    <div>
                      <p className="text-sm font-medium text-black">
                        {userProfile.profile.nombre ?? 'Usuario'}
                      </p>
                      {userProfile.profile.rol ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Administrador
                        </span>
                      ) : (
                        <p className="text-xs text-gray-600">Cuenta activa</p>
                      )}
                    </div>
                  </div>
                </Link>
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
    </dialog>
  )
}

// Main Navigation Component
export default function Navigation({
  variant = 'default',
  currentPage = 'inicio',
}: NavigationProps) {
  const { isMobile, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
    useMobileMenu()
  const { isAuthenticated } = useAuth()
  const { userProfile, loading } = useUserProfile(isAuthenticated)

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

  if (loading) {
    return (
      <nav className="bg-header px-4 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex space-x-2 justify-center">
          <div
            className="h-2 w-2 bg-gray-900 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="h-2 w-2 bg-gray-900 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="h-2 w-2 bg-gray-900 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </nav>
    )
  }

  const navigationContent = (
    <>
      <nav className="bg-header px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center h-16">
          {/* Sección izquierda - NavigationLinks */}
          {variant === 'back' ? (
            <div className="flex items-center mr-4">
              <Link
                href="/"
                className="text-black hover:text-header-primary transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="Volver al inicio"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
            </div>
          ) : (
            !isMobile && (
              <div className="flex-1 h-full flex items-center">
                <NavigationLinks
                  isAuthenticated={isAuthenticated}
                  currentPage={currentPage}
                  onLinkClick={() => {}}
                  rol={userProfile?.profile?.rol}
                />
              </div>
            )
          )}

          {/* Logo - centrado */}
          <div
            className={`flex-shrink-0 ${isMobile && variant !== 'back' ? 'mr-auto ml-2' : ''}`}
          >
            <Link
              href="/"
              className="text-2xl font-title font-bold text-black hover:text-header-primary transition-colors"
            >
              Tu Salto Misiones
            </Link>
          </div>

          {/* Sección derecha */}
          <div className="flex-1 flex justify-end h-full items-center">
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
              <AuthButtons
                isAuthenticated={isAuthenticated}
                userProfile={userProfile}
                variant={variant}
              />
            )}
          </div>
        </div>
      </nav>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        currentPage={currentPage}
        isAuthenticated={isAuthenticated}
        userProfile={userProfile}
      />
    </>
  )

  return navigationContent
}
