'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bookmark, 
  User, 
  Menu, 
  X, 
  Sun, 
  Moon,
  Sparkles,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';
import { useAuth, useTheme, useSavedTrials } from '@/hooks';

export default function Header() {
  const { user, isAuthenticated, signOut } = useAuth();
  const { isDark, setTheme } = useTheme();
  const { savedTrials } = useSavedTrials();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Trial<span className="text-primary-600 dark:text-primary-400">Match</span>RX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/search" 
              className="btn-ghost text-sm"
            >
              <Search className="w-4 h-4" />
              Search Trials
            </Link>
            
            <Link 
              href="/saved" 
              className="btn-ghost text-sm relative"
            >
              <Bookmark className="w-4 h-4" />
              Saved
              {savedTrials.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary-500 text-white text-xs flex items-center justify-center">
                  {savedTrials.length}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="btn-ghost p-2"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="btn-ghost p-2"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 card p-2 shadow-xl"
                    >
                      <div className="px-3 py-2 border-b border-surface-200 dark:border-surface-700 mb-2">
                        <p className="font-medium text-sm truncate">{user?.displayName || 'User'}</p>
                        <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                      </div>
                      
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">My Profile</span>
                      </Link>
                      
                      <Link 
                        href="/alerts" 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Bell className="w-4 h-4" />
                        <span className="text-sm">Alerts</span>
                      </Link>
                      
                      <button
                        onClick={() => {
                          signOut();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="btn-primary text-sm">
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden btn-ghost p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-surface-200 dark:border-surface-800"
          >
            <div className="px-4 py-4 space-y-2">
              <Link 
                href="/search" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search className="w-5 h-5" />
                <span>Search Trials</span>
              </Link>
              
              <Link 
                href="/saved" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bookmark className="w-5 h-5" />
                <span>Saved Trials</span>
                {savedTrials.length > 0 && (
                  <span className="ml-auto badge-primary">{savedTrials.length}</span>
                )}
              </Link>

              {isAuthenticated ? (
                <>
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>My Profile</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="btn-primary w-full justify-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}

              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-800 mt-4">
                <span className="text-sm text-surface-500">Theme</span>
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="btn-ghost p-2"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
