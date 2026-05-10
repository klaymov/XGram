import { useState, useEffect } from 'react';
import { Home, Search, Bell, User, Sun, Moon, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { downloadAvatar } from '../../services/feed';
import telegramService from '../../services/telegram';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (user) {
      downloadAvatar(user).then((url) => {
        if (!cancelled && url) setAvatarUrl(url);
      });
    }
    return () => { cancelled = true; };
  }, [user]);

  const userName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : 'User';
  const userHandle = user?.username ? `@${user.username}` : '';

  const navItems = [
    { icon: Home, label: 'Feed', active: true },
    // Placeholder for future nav items
    // { icon: Search, label: 'Explore', active: false },
    // { icon: Bell, label: 'Notifications', active: false },
  ];

  return (
    <aside className="flex flex-col h-screen sticky top-0 py-4 px-3">
      {/* Logo */}
      <div className="mb-6 px-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-500/20">
            <span className="text-base font-bold text-white">X</span>
          </div>
          <span className="text-xl font-bold text-surface-100 hidden xl:block">XGram</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            id={`nav-${item.label.toLowerCase()}`}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
              item.active
                ? 'text-surface-100 font-semibold bg-surface-800/60'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/40'
            }`}
          >
            <item.icon
              className={`w-5 h-5 ${item.active ? 'text-brand-400' : 'group-hover:text-surface-300'}`}
            />
            <span className="hidden xl:block text-[15px]">{item.label}</span>
          </button>
        ))}

        {/* Theme toggle */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-400 hover:text-surface-200 hover:bg-surface-800/40 transition-all duration-150 group"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
          ) : (
            <Moon className="w-5 h-5 group-hover:text-brand-400 transition-colors" />
          )}
          <span className="hidden xl:block text-[15px]">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </nav>

      {/* User profile / Logout */}
      <div className="mt-auto pt-4 border-t border-surface-800/60">
        <div className="flex items-center gap-3 px-2 py-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-surface-700/50"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden xl:block min-w-0 flex-1">
            <p className="text-sm font-semibold text-surface-100 truncate">{userName}</p>
            {userHandle && (
              <p className="text-xs text-surface-500 truncate">{userHandle}</p>
            )}
          </div>
          <button
            id="logout-btn"
            onClick={logout}
            className="hidden xl:flex p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
