// Dashboard Layout with Sidebar
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
  Calendar,
  Tag,
  User
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
    { path: '/categories', label: 'Categorias', icon: Tag },
    { path: '/income-calendar', label: 'Calendário', icon: Calendar },
    { path: '/goals', label: 'Metas e Dívidas', icon: Target },
    { path: '/learn', label: 'Aprender', icon: GraduationCap },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getPersonaLabel = () => {
    if (!profile?.persona_type) return 'Usuário';
    return profile.persona_type.replace('_', ' ');
  };

  return (
    <div className="min-h-screen bg-page flex">
      {/* Sidebar - Desktop: sempre visível com hover, Mobile: toggle */}
      <aside
        className={`
          group
          fixed inset-y-0 left-0 z-40
          bg-white border-r border-neutral-200
          transition-all duration-300 ease-in-out
          w-20 md:w-20 md:hover:w-64
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-md border-b border-neutral-200">
            <Link to="/dashboard" className="flex items-center gap-xs min-w-0">
              <TrendingUp className="w-7 h-7 text-primary-500 flex-shrink-0" />
              <span className="text-body-large font-semibold text-neutral-900 whitespace-nowrap opacity-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                FamíliaFinanças
              </span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-sm text-neutral-700 hover:bg-neutral-50 rounded-base"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-md">
            <div className="px-xs md:px-sm space-y-xs">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center justify-center md:justify-center md:group-hover:justify-start 
                      gap-xs md:gap-0 md:group-hover:gap-xs 
                      px-sm md:px-md py-sm rounded-base text-body font-medium
                      transition-colors duration-fast
                      ${isActive 
                        ? 'text-primary-500 bg-primary-50' 
                        : 'text-neutral-700 hover:text-primary-500 hover:bg-neutral-50'
                      }
                    `}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="whitespace-nowrap opacity-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-20">
        {/* Header */}
        <header className="sticky top-0 bg-white border-b border-neutral-200 z-20">
          <div className="flex items-center justify-between h-16 px-lg gap-md">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-sm text-neutral-700 hover:bg-neutral-50 rounded-base"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* User Info and Actions */}
            <div className="flex items-center gap-md">
              {/* User Type */}
              <span className="text-small text-neutral-600 whitespace-nowrap hidden sm:inline">
                {getPersonaLabel()}
              </span>

              {/* Profile Link */}
              <Link
                to="/settings"
                className="flex items-center gap-xs px-md py-sm text-body text-neutral-700 hover:text-primary-500 hover:bg-primary-50 rounded-base transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="hidden lg:inline">Perfil</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-xs px-md py-sm text-body text-neutral-700 hover:text-error-500 hover:bg-error-50 rounded-base transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden lg:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-lg py-xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
