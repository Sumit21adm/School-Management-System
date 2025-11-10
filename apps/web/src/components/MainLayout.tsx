import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  IndianRupee, 
  FileText, 
  Settings,
  LogOut,
  Home,
  GraduationCap,
  ClipboardList,
  Bus,
  Building2,
  Bell,
  FileBarChart,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const modules = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Students', icon: GraduationCap, path: '/students' },
    { name: 'Teachers', icon: Users, path: '/teachers' },
    { name: 'Attendance', icon: ClipboardList, path: '/attendance/mark' },
    { name: 'Announcements', icon: Bell, path: '/announcements' },
    { name: 'Classes', icon: BookOpen, path: '/classes' },
    { name: 'Library', icon: BookOpen, path: '/library' },
    { name: 'Transport', icon: Bus, path: '/transport' },
    { name: 'Hostel', icon: Building2, path: '/hostel' },
    { name: 'Exams', icon: FileText, path: '/exams' },
    { name: 'Fees', icon: IndianRupee, path: '/fees' },
    { name: 'Reports', icon: FileBarChart, path: '/reports' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-blue-600">School MS</h1>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:block fixed left-0 top-16 bottom-0 bg-white shadow-lg transition-all duration-300 z-40 overflow-y-auto ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <nav className="p-4 space-y-2">
          {modules.map((module) => (
            <button
              key={module.name}
              onClick={() => navigate(module.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(module.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={!sidebarOpen ? module.name : undefined}
            >
              <module.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{module.name}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 top-16"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Sidebar */}
          <aside className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg z-50 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {modules.map((module) => (
                <button
                  key={module.name}
                  onClick={() => {
                    navigate(module.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(module.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <module.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{module.name}</span>
                </button>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main
        className={`transition-all duration-300 pt-16 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
