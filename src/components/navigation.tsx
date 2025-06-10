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

  const baseLinkClass = isMobile
    ? 'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors data-[active=true]:bg-white'
    : 'relative h-full flex items-center px-4 text-gray-700 hover:text-header-primary font-medium transition-all duration-300 group'

  const activeLinkClass = 'text-header-primary font-semibold'

  const MobileNavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon
    const active = item.page ? isActive(item.page) : false

    return (
      <Link
        data-active={active}
        href={item.href}
        className={baseLinkClass}
        onClick={onLinkClick}
      >
        <Button variant="sidebar">
          {Icon && <Icon size={18} />}
          {item.label}
        </Button>
      </Link>
    )
  }

  const DesktopNavLink = ({ item }: { item: NavItem }) => {
    const active = item.page ? isActive(item.page) : false

    return (
      <Link
        href={item.href}
        className={`${baseLinkClass} ${active ? activeLinkClass : ''}`}
      >
        {item.label}
        <span className="absolute bottom-0 left-1/2 w-0 h-[3px] bg-header-primary transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
      </Link>
    )
  }

  if (isMobile) {
    return (
      <div className="p-4 space-y-1">
        <div className="text-md font-semibold text-header-primary/60 uppercase tracking-wider mb-4 px-2">
          Navegación
        </div>
        {visibleItems.map((item, index) => (
          <MobileNavLink key={`${item.href}-${index}`} item={item} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full space-x-1 items-center">
      {visibleItems.map((item, index) => (
        <DesktopNavLink key={`${item.href}-${index}`} item={item} />
      ))}
    </div>
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
          className="text-primary flex items-center gap-3 px-4 py-3 rounded-md text-black hover:bg-header-primary/10 transition-colors font-medium"
          onClick={onLinkClick}
        >
          <Button variant={'sidebar'}>
            <LogIn size={18} />
            Iniciar Sesión
          </Button>
        </Link>
        <Link
          href="/sign-up"
          className="text-primary flex items-center gap-3 px-4 py-3 rounded-md text-black hover:bg-header-primary/10 transition-colors font-medium"
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
        <Button
          variant={variant === 'back' ? 'outline' : 'default'}
          className={
            variant === 'back'
              ? 'bg-teal-600 border-teal-600 text-white hover:bg-teal-700 hover:border-teal-700 transition-colors'
              : 'bg-header-primary'
          }
        >
          Iniciar Sesión
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button
          variant="outline"
          className={
            variant === 'back'
              ? 'border-white text-white hover:bg-white hover:text-teal-600 transition-colors'
              : 'bg-header text-header-primary border-header-primary'
          }
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
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

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
        aria-labelledby="menu-header"
      >
        <div className="flex flex-col h-full">
          {/* Header del menú */}
          <div className="flex justify-between items-center p-4 border-b border-header-primary">
            <h2 className="text-xl font-semibold text-header-primary">Menú</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
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
              onLinkClick={onClose}
              isMobile={true}
              rol={userProfile?.profile?.rol}
            />

            {!isAuthenticated && (
              <div className="p-4 space-y-1">
                <AuthButtons
                  isAuthenticated={isAuthenticated}
                  userProfile={userProfile}
                  onLinkClick={onClose}
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
                  onClick={onClose}
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
    </div>
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
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
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
