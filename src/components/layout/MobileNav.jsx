import { Home, Search, User, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function MobileNav() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass border-t border-surface-700/30">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        <NavButton icon={Home} label="Feed" active />
        <NavButton
          icon={theme === 'dark' ? Sun : Moon}
          label={theme === 'dark' ? 'Light' : 'Dark'}
          onClick={toggleTheme}
        />
        <NavButton icon={LogOut} label="Logout" onClick={logout} />
      </div>
    </nav>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
        active
          ? 'text-brand-400'
          : 'text-surface-500 active:text-surface-300'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
