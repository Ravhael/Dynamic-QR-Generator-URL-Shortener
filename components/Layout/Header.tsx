"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline"
import { useAuth } from "@/components/contexts/AuthContext"
import { authenticatedGet } from "@/lib/auth-fetch"
import { useNotifications } from "@/hooks/useNotifications"
import { useSystemSettings } from "@/hooks/useSystemSettings"

interface ApiUser {
  id: string
  full_name?: string
  email?: string
  role?: string
  avatar?: string
  created_at?: string
  lastLogin?: string
}

interface HeaderProps {
  isMobileMenuOpen: boolean
  // Accept native React setState dispatch or a custom setter function
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>> | ((isOpen: boolean) => void)
  isCollapsed?: boolean
  setIsCollapsed?: React.Dispatch<React.SetStateAction<boolean>> | ((isCollapsed: boolean) => void)
}

export const Header: React.FC<HeaderProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { settings: systemSettings } = useSystemSettings()
  
  // State for user data from API
  const [apiUser, setApiUser] = useState<ApiUser | null>(null)
  
  // Always fetch fresh user data; refresh on mount, focus, and interval
  // Defensive note: we only overwrite existing user state when response.ok to
  // avoid clobbering a valid session user with partial/errored fetch results.
  useEffect(() => {
    let isCancelled = false
    const fetchUserData = async () => {
      try {
        const response = await authenticatedGet('/api/users/me')
        if (isCancelled) return
        if (response.ok) {
          try {
            const userData = await response.json()
            if (userData && typeof userData === 'object' && userData.id) {
              setApiUser(userData)
            } else {
              console.warn('[Header] /api/users/me returned unexpected shape, preserving existing user state')
            }
          } catch (jsonErr) {
            console.error('[Header] Failed parsing /api/users/me JSON', jsonErr)
          }
        } else {
          console.warn('[Header] /api/users/me non-ok status', response.status)
        }
      } catch (err) {
        if (!isCancelled) console.error('[Header] Failed to fetch /api/users/me', err)
      }
    }
    fetchUserData()
    const onFocus = () => fetchUserData()
    window.addEventListener('focus', onFocus)
    const interval = setInterval(fetchUserData, 60000) // 60s
    return () => { isCancelled = true; window.removeEventListener('focus', onFocus); clearInterval(interval) }
  }, [])
  
  const currentUser = useMemo(() => {
    // Prefer apiUser (fresh) over session user
    const sourceUser = apiUser || user
    if (sourceUser) {
      const fullName = (sourceUser as ApiUser).full_name?.trim()
      const name = fullName || (sourceUser as any).name || (sourceUser.email ? sourceUser.email.split('@')[0] : '')
      return {
        id: sourceUser.id,
        name,
        full_name: fullName || name,
        email: sourceUser.email || '',
        role: (sourceUser.role || 'user').toLowerCase(),
        avatar: (sourceUser as ApiUser).avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face&auto=format&q=80",
        createdAt: (sourceUser as ApiUser).created_at || new Date().toISOString(),
        lastLogin: (sourceUser as ApiUser).lastLogin || new Date().toISOString(),
      }
    }
    return {
      id: '',
      name: '',
      full_name: '',
      email: '',
      role: 'user',
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face&auto=format&q=80",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }
  }, [user, apiUser])

  // (Removed ID copy UI per request)

  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  // Mobile search handling
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)
  // Notifications now sourced from central hook (initially mock-backed)
  const { notifications, unreadCount, loading: notifLoading, error: notifError, markAllRead } = useNotifications()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Global search shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        if (window.innerWidth < 768) { // mobile breakpoint
          setIsMobileSearchOpen(true)
          setTimeout(() => mobileSearchInputRef.current?.focus(), 25)
        } else {
          searchInputRef.current?.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  // Focus mobile search input when panel opens & handle Escape key
  useEffect(() => {
    if (isMobileSearchOpen) {
      const t = setTimeout(() => mobileSearchInputRef.current?.focus(), 30)
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMobileSearchOpen(false)
        }
      }
      document.addEventListener('keydown', handleKey)
      return () => { clearTimeout(t); document.removeEventListener('keydown', handleKey) }
    }
  }, [isMobileSearchOpen])

  const handleLogout = async () => {
    try {
      console.warn("🔴 LOGOUT BUTTON CLICKED - STARTING LOGOUT PROCESS")
      
      // Clear API user state immediately
      setApiUser(null)
      
      // Call logout API to clear server-side cookie
      try {
        console.warn("🔴 Calling logout API...")
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        })
        console.warn("🔴 Logout API called successfully")
      } catch (apiError) {
        console.error("🔴 Logout API _error:", apiError)
      }
      
      // Clear everything immediately
      if (typeof window !== 'undefined') {
        console.warn("🔴 CLEARING ALL STORAGE...")
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear scanly_auth cookie specifically
        document.cookie = "scanly_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost"
        document.cookie = "scanly_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"
        
        // Clear all other cookies
        document.cookie.split(";").forEach(function(c) { 
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
          // Clear for root path
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          // Clear for domain
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost";
        });
      }
      
      // Call AuthContext logout (but don't wait for it)
      try {
        logout()
      } catch (logoutError) {
        console.error("🔴 AuthContext logout _error:", logoutError)
      }
      
      // FORCE IMMEDIATE REDIRECT TO LOGIN
      console.warn("🔴 FORCING REDIRECT TO LOGIN PAGE")
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      
    } catch (_error) {
      console.error("🔴 Logout _error:", _error)
      // Force redirect anyway
      if (typeof window !== 'undefined') {
        console.warn("🔴 ERROR - FORCING REDIRECT ANYWAY")
        localStorage.clear()
        sessionStorage.clear()
        // Clear cookies even in error case
        document.cookie = "scanly_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"
        window.location.href = '/login'
      }
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      console.warn("Searching for:", searchValue)
      // Implement search logic here
    }
  }

  const unreadNotifications = unreadCount

  const headerElement = (
    <header className="fixed top-0 left-0 right-0 w-full z-[100] bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        
        {/* Left Section - Mobile Menu & Collapse Toggle */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Branding (Logo + Name) */}
          <div className="flex items-center space-x-2">
            {(() => {
              const logo = systemSettings?.branding?.logo?.value || systemSettings?.branding?.siteLogo?.value
              if (!logo) return null
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={(systemSettings?.branding?.site_name?.value || systemSettings?.branding?.siteName?.value || 'Logo') as string}
                  className="h-7 w-auto object-contain rounded"
                />
              )
            })()}
            <span className="hidden sm:inline text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-wide">
              {(systemSettings?.branding?.site_name?.value || systemSettings?.branding?.siteName?.value || 'Scanly') as string}
            </span>
          </div>

          {/* Desktop Sidebar Toggle */}
          {setIsCollapsed && (
            <button
              className="hidden lg:flex p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

  {/* Center Section - Search (hidden on small screens) */}
  <div className="flex-1 max-w-lg mx-4 hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search... (Ctrl+K)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-600 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-500">
                  ⌘K
                </kbd>
              </div>
            </div>
          </form>
        </div>

        {/* Right Section - Actions & User Menu */}
        <div className="flex items-center space-x-4">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => {
              setIsMobileSearchOpen(prev => !prev)
              // Focus will be handled in effect after panel mounts
            }}
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label={isMobileSearchOpen ? 'Close search' : 'Open search'}
            aria-expanded={isMobileSearchOpen}
            aria-pressed={isMobileSearchOpen}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <BellIcon className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading && (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</div>
                  )}
                  {notifError && !notifLoading && (
                    <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">Failed to load notifications</div>
                  )}
                  {!notifLoading && !notifError && notifications.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No notifications</div>
                  )}
                  {!notifLoading && notifications.length > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); markAllRead(); }} className="w-full text-left px-4 py-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">Mark all as read</button>
                  )}
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                        !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                {currentUser?.avatar ? (
                  <Image
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    width={32}
                    height={32}
                  />
                ) : (
                  <UserCircleIcon className="w-full h-full text-gray-400" />
                )}
              </div>
              <div className="hidden md:block text-left">
                {(currentUser?.full_name || currentUser?.name) && (
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {currentUser.full_name || currentUser.name}
                  </p>
                )}
                {currentUser?.role && (
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 capitalize">
                    {currentUser.role}
                  </p>
                )}
                {currentUser?.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{currentUser.email}</p>
                )}
              </div>
              <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                      {currentUser?.avatar ? (
                        <Image
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                          width={40}
                          height={40}
                        />
                      ) : (
                        <UserCircleIcon className="w-full h-full text-gray-400" />
                      )}
                    </div>
                    <div>
                      {(currentUser?.full_name || currentUser?.name) && (
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {currentUser.full_name || currentUser.name}
                        </p>
                      )}
                      {currentUser?.role && (
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                          {currentUser.role} Account
                        </p>
                      )}
                      {currentUser?.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {currentUser.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      router.push("/profile")
                      setIsUserMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      router.push("/settings")
                      setIsUserMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    <span>Account Settings</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsUserMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
  return (
    <>
      {headerElement}
      {/* Mobile Search Panel */}
      {isMobileSearchOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-[95] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 pt-3 pb-4 animate-in fade-in slide-in-from-top-2">
          <form
            onSubmit={(e) => { handleSearch(e); setIsMobileSearchOpen(false) }}
            className="relative"
          >
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={mobileSearchInputRef}
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </>
  )
}
