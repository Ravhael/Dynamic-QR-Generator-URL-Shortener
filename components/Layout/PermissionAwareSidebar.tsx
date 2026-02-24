"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMenuPermissions } from "../../hooks/useMenuPermissions";
import { accessDeniedMessage } from "@/lib/accessMessages";
import { useToast } from "@/hooks/use-toast";
import * as OutlineIcons from "@heroicons/react/24/outline";
import * as SolidIcons from "@heroicons/react/24/solid";
import {
  ChevronDownIcon, ChevronRightIcon,
  ChevronDoubleLeftIcon, ChevronDoubleRightIcon,
  LockClosedIcon, ExclamationTriangleIcon
} from "@heroicons/react/24/outline"; // specific ones we reference directly
import { clsx } from "clsx";
import getMenuIconClass from '@/lib/iconColors'

interface NavigationItem {
  id: string;
  name: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed?: (isCollapsed: boolean) => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (isOpen: boolean) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const PermissionAwareSidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  setIsCollapsed,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
  activeTab,
  onTabChange
}) => {
  // State
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["qr-management", "url-management", "administrator"]);
  const [isDesktop, setIsDesktop] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Hooks
  const { userRole, loading: permLoading, visibleMenus, isSyncing } = useMenuPermissions() as any;
  const { toast } = useToast();
  // We rely solely on visibleMenus from permissions hook now (navigation structure unified)
  const navigation = (visibleMenus as any[]) || [];
  const navError = null;
  const isLoading = permLoading;

  // Desktop detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleResize = (e: MediaQueryListEvent | MediaQueryList) => setIsDesktop(e.matches);
    
    handleResize(mediaQuery); // Initial check
    mediaQuery.addListener(handleResize);
    return () => mediaQuery.removeListener(handleResize);
  }, []);

  // Auto-collapse on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isDesktop || isCollapsed || !setIsCollapsed || !sidebarRef.current) return;
      
      const target = e.target as Node;
      const toggleButton = document.querySelector('[data-sidebar-toggle]');
      const header = document.querySelector('header');
      
      // Don't collapse if clicking header or toggle button
      if (toggleButton?.contains(target) || header?.contains(target)) return;
      
      // Only collapse if clicking outside sidebar
      if (!sidebarRef.current.contains(target)) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isDesktop, isCollapsed, setIsCollapsed]);

  // Event handlers with debounce and desktop check
  const [isHovering, setIsHovering] = useState(false);
  
  const handleMouseEnter = () => {
    if (!isDesktop || !isCollapsed || !setIsCollapsed) return;
    setIsHovering(true);
    const timeoutId = setTimeout(() => {
      if (isHovering) {
        setIsCollapsed(false);
      }
    }, 100);
    return () => {
      clearTimeout(timeoutId);
    };
  };

  const handleMouseLeave = () => {
    if (!isDesktop || isCollapsed || !setIsCollapsed) return;
    setIsHovering(false);
    const timeoutId = setTimeout(() => {
      if (!isHovering) {
        setIsCollapsed(true);
      }
    }, 300);
    return () => {
      clearTimeout(timeoutId);
    };
  };

  const handleMobileClose = () => {
    setIsMobileMenuOpen?.(false);
  };

  const toggleMenu = (menuId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMenus(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const SOLID_ICON_REGISTRY: Record<string, string> = {
    dashboard: 'Squares2X2Icon',
    home: 'Squares2X2Icon',
    profile: 'UserCircleIcon',
    reports: 'DocumentChartBarIcon',
    notifications: 'BellAlertIcon',
    'qr-management': 'QrCodeIcon',
    'qr-codes': 'QrCodeIcon',
    'generate-qr': 'PlusCircleIcon',
    'generate-qr-code': 'PlusCircleIcon',
    'generate-qr-codes': 'PlusCircleIcon',
    'generate': 'PlusCircleIcon',
    'qr-analytics': 'ChartBarSquareIcon',
    'qr-detailed-analytics': 'ChartBarSquareIcon',
    'qr-categories': 'SquaresPlusIcon',
    'qr-migration': 'ArrowPathIcon',
    'url-management': 'LinkIcon',
    'url-list': 'ListBulletIcon',
    'generate-url': 'LinkIcon',
    'url-analytics': 'ChartPieIcon',
    'url-detailed-analytics': 'ChartPieIcon',
    'url-categories': 'Squares2X2Icon',
    administrator: 'ShieldCheckIcon',
    'admin-panel': 'ShieldCheckIcon',
    users: 'UserGroupIcon',
    groups: 'UserGroupIcon',
    'scan-click-activity': 'CursorArrowRaysIcon',
    'user-activity': 'UserIcon',
    'menu-settings': 'Cog6ToothIcon',
    settings: 'Cog6ToothIcon',
    'system-settings': 'Cog8ToothIcon',
    'permissions-roles': 'ShieldExclamationIcon',
  };

  const SOLID_ICON_RULES: Array<{ test: (id: string) => boolean; icons: string[] }> = [
    { test: id => id.includes('generate') && id.includes('qr'), icons: ['PlusCircleIcon', 'PlusIcon'] },
    { test: id => id.includes('qr'), icons: ['QrCodeIcon'] },
    { test: id => id.includes('url') || id.includes('link'), icons: ['LinkIcon'] },
    { test: id => id.includes('notification'), icons: ['BellAlertIcon', 'BellIcon'] },
    { test: id => id.includes('setting') || id.includes('system') || id.includes('menu'), icons: ['Cog6ToothIcon', 'Cog8ToothIcon', 'CogIcon'] },
    { test: id => id.includes('admin') || id.includes('permission') || id.includes('role'), icons: ['ShieldCheckIcon', 'ShieldExclamationIcon'] },
    { test: id => id.includes('report') || id.includes('analytics'), icons: ['ChartBarSquareIcon', 'DocumentChartBarIcon'] },
    { test: id => id.includes('group') || id.includes('user'), icons: ['UserGroupIcon', 'UsersIcon'] },
  ];

  const getSolidIconForMenuId = (menuId?: string | null): React.ComponentType<{ className?: string }> | null => {
    if (!menuId) return null;
    const normalized = String(menuId).trim().toLowerCase();
    if (!normalized) return null;

    const direct = SOLID_ICON_REGISTRY[normalized];
    if (direct && (SolidIcons as any)[direct]) {
      return (SolidIcons as any)[direct];
    }

    for (const rule of SOLID_ICON_RULES) {
      if (rule.test(normalized)) {
        const iconName = rule.icons.find(name => (SolidIcons as any)[name]);
        if (iconName) {
          return (SolidIcons as any)[iconName];
        }
      }
    }

    return null;
  };

  const lookupHeroIcon = (name: string): React.ComponentType<{ className?: string }> | null => {
    if ((SolidIcons as any)[name]) return (SolidIcons as any)[name];
    if ((OutlineIcons as any)[name]) return (OutlineIcons as any)[name];
    return null;
  };

  // Map raw string or component to a HeroIcon component
  const resolveIconComponent = (raw: any): React.ComponentType<{ className?: string }> | null => {
    if (!raw) return null;
    if (typeof raw === 'function') return raw; // already a component
    if (typeof raw === 'string') {
      // Normalize: remove dashes, capitalize first letter, append Icon if missing
      const cleaned = raw
        .replace(/-([a-z])/g, (_, c) => c.toUpperCase()) // kebab to camel
        .replace(/^(.)/, c => c.toUpperCase());
      const candidateNames = [
        cleaned.endsWith('Icon') ? cleaned : cleaned + 'Icon',
        cleaned + 'Icon'
      ];
      for (const name of candidateNames) {
        const candidate = lookupHeroIcon(name);
        if (candidate) return candidate;
      }

      // Heuristic fallbacks for compound / descriptive icon names stored in DB
      // (e.g. 'menu-settings', 'generate-qr' or 'qr-code') — try to map them to a sensible icon
      const lower = cleaned.toLowerCase();
      if (lower.includes('settings') || lower.includes('cog') || lower.includes('admin')) {
        return lookupHeroIcon('Cog6ToothIcon') || lookupHeroIcon('CogIcon');
      }
      if (lower.includes('menu')) {
        return lookupHeroIcon('Bars3Icon') || lookupHeroIcon('Squares2X2Icon');
      }
      if (lower.includes('generate') || lower.includes('plus')) {
        return lookupHeroIcon('PlusCircleIcon') || lookupHeroIcon('PlusIcon');
      }
      if (lower.includes('qr') || lower.includes('qrcode')) {
        return lookupHeroIcon('QrCodeIcon');
      }
      if (lower.includes('url') || lower.includes('link')) {
        return lookupHeroIcon('LinkIcon');
      }

      // Final fallback — question mark icon
      return lookupHeroIcon('QuestionMarkCircleIcon');
    }
    return null;
  };

  const renderIcon = (iconRaw: any, active: boolean, menuId?: string) => {
    const menuIcon = getSolidIconForMenuId(menuId);
    const resolvedIcon = resolveIconComponent(iconRaw);
    const defaultIcon = lookupHeroIcon('QuestionMarkCircleIcon');
    const IconComponent = menuIcon || resolvedIcon || defaultIcon;
    if (!IconComponent) return null;
    return (
      <IconComponent
        className={clsx(
          "mr-3 flex-shrink-0 h-6 w-6 fill-current",
          getMenuIconClass(menuId)
        )}
      />
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={clsx(
        "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl border-r border-white/20 dark:border-slate-800/50 transition-all duration-300 ease-in-out overflow-hidden",
        "fixed top-0 left-0 h-full z-50 flex flex-col items-center justify-center",
        "w-72 md:w-80",
        isCollapsed ? "lg:w-16" : "lg:w-72 xl:w-80"
      )}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading navigation...</p>
      </div>
    );
  }

  // Error state
  // navError ignored (always null after refactor)

  const isItemAccessible = (item: any) => !!item.isAccessible;

  return (
    <div className="relative">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={handleMobileClose}
        />
      )}
      
      {/* Main sidebar */}
      <aside 
        ref={sidebarRef}
        className={clsx(
          "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl border-r border-white/20 dark:border-slate-800/50",
          "fixed top-0 left-0 h-full z-[60] flex flex-col group",
          "transition-all duration-300 ease-in-out overflow-hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "w-72 md:w-80",
          isCollapsed ? "lg:w-16 hover:lg:w-72 hover:xl:w-80" : "lg:w-72 xl:w-80"
        )}
        onMouseEnter={isDesktop ? handleMouseEnter : undefined}
        onMouseLeave={isDesktop ? handleMouseLeave : undefined}
        data-desktop={isDesktop}
        data-collapsed={isCollapsed}
      >
        {/* Logo Section */}
        <div className="flex-shrink-0 p-4">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/favicon.svg" alt="Logo" className="h-8 w-8" />
            {!isCollapsed && (
              <span className="text-xl font-bold text-slate-800 dark:text-white">
                Scanly
              </span>
            )}
          </Link>
        </div>

        {/* Sync indicator (mini) */}
        {isSyncing && (
          <div className="px-4 pb-2 -mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-block h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Syncing permissions...</span>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {navigation.map((item: any) => {
            const accessible = isItemAccessible(item);
            return (
            <div key={item.id} className="group">
              {item.path ? (
                <Link
                  href={accessible ? item.path : "#"}
                  onClick={(e) => {
                    if (!accessible) {
                      e.preventDefault();
                      toast(accessDeniedMessage(item.name));
                    }
                  }}
                  aria-disabled={accessible ? undefined : true}
                  aria-label={!accessible ? `Menu terkunci: ${item.name}` : item.name}
                  title={!accessible ? `Tidak ada akses ke ${item.name}` : item.name}
                  data-locked={!accessible || undefined}
                  className={clsx(
                    "relative group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    accessible === false && "opacity-60 cursor-not-allowed",
                    pathname === item.path
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
                  )}
                >
                    {renderIcon(item.icon, pathname === item.path, item.id)}
                  <span className={clsx(
                    "transition-opacity duration-300 flex items-center gap-1",
                    isCollapsed ? "opacity-0 lg:group-hover:opacity-100" : "opacity-100"
                  )}>
                    {item.name}
                    {accessible === false && <LockClosedIcon className="h-4 w-4 text-slate-400" />}
                  </span>
                </Link>
              ) : (
                <button
                  onClick={(e) => toggleMenu(item.id, e)}
                  className={clsx(
                    "w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md",
                    "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
                  )}
                >
                    <div className="flex items-center">
                    {renderIcon(item.icon, false, item.id)}
                    <span className={clsx(
                      "transition-opacity duration-300",
                      isCollapsed ? "opacity-0 lg:group-hover:opacity-100" : "opacity-100"
                    )}>{item.name}</span>
                  </div>
                  {item.children && (
                    <div className={clsx(
                      "transition-opacity duration-300",
                      isCollapsed ? "opacity-0 lg:group-hover:opacity-100" : "opacity-100"
                    )}>
                      {expandedMenus.includes(item.id) ? (
                        <ChevronDownIcon className="ml-auto h-5 w-5" />
                      ) : (
                        <ChevronRightIcon className="ml-auto h-5 w-5" />
                      )}
                    </div>
                  )}
                </button>
              )}

              {/* Submenu */}
              {item.children && expandedMenus.includes(item.id) && (
                <div className={clsx(
                  "space-y-1 pl-4 mt-1",
                  isCollapsed ? "hidden lg:group-hover:block" : "block"
                )}>
                  {item.children.map((child: any) => {
                    const childAccessible = isItemAccessible(child);
                    return (
                    <Link
                      key={child.id}
                      href={childAccessible ? (child.path || '#') : '#'}
                      onClick={(e) => {
                        if (!childAccessible) {
                          e.preventDefault();
                          toast(accessDeniedMessage(child.name));
                        }
                      }}
                      aria-disabled={childAccessible ? undefined : true}
                      aria-label={!childAccessible ? `Menu terkunci: ${child.name}` : child.name}
                      title={!childAccessible ? `Tidak ada akses ke ${child.name}` : child.name}
                      data-locked={!childAccessible || undefined}
                      className={clsx(
                        "relative group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                        childAccessible === false && "opacity-60 cursor-not-allowed",
                        pathname === child.path
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
                      )}
                    >
                      {renderIcon(child.icon, pathname === child.path, child.id)}
                      <span className="flex items-center gap-1">{child.name}{childAccessible === false && <LockClosedIcon className="h-4 w-4 text-slate-400" />}</span>
                    </Link>
                    );
                  })}
                </div>
              )}
            </div>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="flex-shrink-0 p-4 hidden lg:block">
          <button
            data-sidebar-toggle
            onClick={() => setIsCollapsed?.(!isCollapsed)}
            className={clsx(
              "w-full flex items-center justify-center py-2 rounded-md",
              "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
            )}
          >
            {isCollapsed ? (
              <ChevronDoubleRightIcon className="h-6 w-6" />
            ) : (
              <ChevronDoubleLeftIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default PermissionAwareSidebar;