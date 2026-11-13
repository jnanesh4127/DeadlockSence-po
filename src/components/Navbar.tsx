import React, { useState } from 'react';
import {
  Cpu,
  Home,
  ShieldCheck,
  Network,
  Layers,
  BookOpen,
  History,
  ShieldAlert,
  Server,
  MessageSquarePlus,
  LogOut,
  LogIn,
  Globe,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { SupportedLocale } from '../i18n/translations.ts';

export type ActiveTab = 'overview' | 'bankers' | 'rag' | 'detection' | 'practice' | 'history' | 'admin';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
  onOpenFeedback: () => void;
  onOpenHealth: () => void;
  systemOnline: boolean;
}

export const SidebarNav: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenFeedback,
  onOpenHealth,
  systemOnline,
}) => {
  const { user, isAdmin } = useAuth();
  const { t } = useI18n();
  const { isDark, toggleTheme } = useTheme();

  const isExactAdminEmail = (user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const showAdminBadge = isAdmin || isExactAdminEmail;

  const itemClass = (isActive: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      {/* Brand Lockup */}
      <div className="flex h-16 items-center px-5 border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-lg"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <Cpu className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            DeadlockSense
          </span>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Main
          </div>
          <nav aria-label="Main Navigation" className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={itemClass(activeTab === 'overview')}
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>{t.nav.overview}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bankers')}
              className={itemClass(activeTab === 'bankers')}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>{t.nav.bankers}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rag')}
              className={itemClass(activeTab === 'rag')}
            >
              <Network className="h-4 w-4 shrink-0" />
              <span>{t.nav.rag}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('detection')}
              className={itemClass(activeTab === 'detection')}
            >
              <Layers className="h-4 w-4 shrink-0" />
              <span>{t.nav.detection}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className={itemClass(activeTab === 'practice')}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>{t.nav.practice}</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={itemClass(activeTab === 'history')}
              >
                <History className="h-4 w-4 shrink-0" />
                <span>{t.nav.history}</span>
              </button>
            )}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Other
          </div>
          <div className="space-y-1">
            <button
              type="button"
              onClick={toggleTheme}
              title={t.nav.themeToggleTooltip}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              <span className="flex items-center gap-3">
                {isDark ? (
                  <Sun className="h-4 w-4 shrink-0 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 shrink-0 text-slate-500" />
                )}
                <span>{isDark ? t.nav.themeLight : t.nav.themeDark}</span>
              </span>
              <span
                className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                  isDark ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <span className="h-4 w-4 rounded-full bg-white shadow-xs" />
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenHealth}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              <span className="flex items-center gap-3">
                <Server className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <span>{systemOnline ? t.nav.systemOnline : t.nav.checkStatus}</span>
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  systemOnline ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={onOpenFeedback}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              <MessageSquarePlus className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <span>{t.nav.feedback}</span>
            </button>

            {showAdminBadge && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
              >
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{t.nav.admin}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export const TopHeader: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenFeedback,
  onOpenHealth,
  systemOnline,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { locale, setLocale, t, locales } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isExactAdminEmail = (user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const showAdminBadge = isAdmin || isExactAdminEmail;

  const pageTitles: Record<ActiveTab, string> = {
    overview: t.nav.overview,
    bankers: t.nav.bankers,
    rag: t.nav.rag,
    detection: t.nav.detection,
    practice: t.nav.practice,
    history: t.nav.history,
    admin: t.nav.admin,
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
        {/* Left: Mobile Menu + Active Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="flex lg:hidden items-center gap-2 shrink-0"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Cpu className="h-3.5 w-3.5" />
            </span>
          </button>

          <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
            {pageTitles[activeTab]}
          </h2>
        </div>

        {/* Right: Theme Toggle, Language, Health Quick Check, Profile / Sign In */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            title={t.nav.themeToggleTooltip}
            aria-label={t.nav.themeToggleTooltip}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-slate-600" />
            )}
            <span className="hidden md:inline text-[11px]">
              {isDark ? t.nav.themeLight : t.nav.themeDark}
            </span>
          </button>

          <div
            title={t.nav.languageTooltip}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              aria-label={t.nav.languageTooltip}
              value={locale}
              onChange={(e) => setLocale(e.target.value as SupportedLocale)}
              className="bg-transparent font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {locales.map((loc) => (
                <option key={loc.code} value={loc.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {loc.nativeLabel}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenHealth}
            title={t.nav.healthTooltip}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Server className={`h-4 w-4 ${systemOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`} />
          </button>

          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 pl-1 pr-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline max-w-[130px] truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="hidden sm:inline h-3.5 w-3.5 text-slate-400" />
              </div>
              <button
                type="button"
                onClick={logout}
                title={t.nav.logoutTooltip}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-red-200 dark:hover:border-red-900/70 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors whitespace-nowrap"
            >
              <LogIn className="h-3.5 w-3.5" />
              {t.nav.signIn}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          {(
            [
              { id: 'overview', label: t.nav.overview },
              { id: 'bankers', label: t.nav.bankers },
              { id: 'rag', label: t.nav.rag },
              { id: 'detection', label: t.nav.detection },
              { id: 'practice', label: t.nav.practice },
              ...(user ? [{ id: 'history' as ActiveTab, label: t.nav.history }] : []),
              ...(showAdminBadge ? [{ id: 'admin' as ActiveTab, label: t.nav.admin }] : []),
            ] as Array<{ id: ActiveTab; label: string }>
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                activeTab === item.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenFeedback();
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t.nav.feedback}
          </button>
        </div>
      )}
    </header>
  );
};

export const Navbar = TopHeader;
