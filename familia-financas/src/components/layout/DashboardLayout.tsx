// Dashboard Layout with Navigation
import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transações', icon: Receipt },
    { path: '/budget', label: 'Orçamento', icon: Wallet },
    { path: '/income-calendar', label: 'Calendário', icon: Calendar },
    { path: '/goals', label: 'Metas', icon: Target },
    { path: '/learn', label: 'Aprender', icon: GraduationCap },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-page">
      {/* Navigation Bar */}
      <nav className="sticky top-0 bg-white border-b border-neutral-200 shadow-sm z-50">
        <div className="container mx-auto px-lg">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-xs">
              <TrendingUp className="w-8 h-8 text-primary-500" />
              <span className="text-body-large font-semibold text-neutral-900 hidden sm:block">
                FamíliaFinanças
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-sm">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-xs px-md py-sm rounded-base text-body font-medium
                      transition-colors duration-fast
                      ${isActive 
                        ? 'text-primary-500 bg-primary-50' 
                        : 'text-neutral-700 hover:text-primary-500 hover:bg-neutral-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center gap-sm">
              <span className="text-small text-neutral-500">
                {profile?.persona_type ? profile.persona_type.replace('_', ' ') : 'Usuário'}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-xs px-md py-sm text-body text-neutral-700 hover:text-error-500 hover:bg-error-50 rounded-base transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-sm text-neutral-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <div className="container mx-auto px-lg py-md space-y-xs">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-xs px-md py-sm rounded-base text-body font-medium
                      ${isActive 
                        ? 'text-primary-500 bg-primary-50' 
                        : 'text-neutral-700 hover:bg-neutral-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-xs px-md py-sm text-body text-neutral-700 hover:text-error-500 hover:bg-error-50 rounded-base"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-lg py-xl">
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
