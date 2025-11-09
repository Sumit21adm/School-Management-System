import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  Settings,
  LogOut,
  Home,
  GraduationCap,
  ClipboardList
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const modules = [
    { name: 'Dashboard', icon: Home, path: '/dashboard', active: true },
    { name: 'Students', icon: GraduationCap, path: '/students' },
    { name: 'Teachers', icon: Users, path: '/teachers' },
    { name: 'Attendance', icon: ClipboardList, path: '/attendance' },
    { name: 'Classes', icon: BookOpen, path: '/classes' },
    { name: 'Exams', icon: FileText, path: '/exams' },
    { name: 'Fees', icon: DollarSign, path: '/fees' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const stats = [
    { label: 'Total Students', value: '1,234', change: '+12%', color: 'bg-blue-500' },
    { label: 'Total Teachers', value: '89', change: '+5%', color: 'bg-green-500' },
    { label: 'Classes', value: '45', change: '0%', color: 'bg-yellow-500' },
    { label: 'Pending Fees', value: '$45,231', change: '-8%', color: 'bg-red-500' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-md transition-all duration-300`}>
        <div className="p-4 border-b">
          <h1 className={`font-bold text-xl text-blue-600 ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? 'SMS' : 'S'}
          </h1>
        </div>
        <nav className="p-4 space-y-2">
          {modules.map((module) => (
            <button
              key={module.name}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                module.active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <module.icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">{module.name}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, Admin</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm mt-2 ${
                      stat.change.startsWith('+') ? 'text-green-600' : 
                      stat.change.startsWith('-') ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-full opacity-20`}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
              <div className="space-y-4">
                {[
                  { action: 'New student enrolled', time: '2 hours ago', type: 'success' },
                  { action: 'Exam results published', time: '5 hours ago', type: 'info' },
                  { action: 'Fee payment received', time: '1 day ago', type: 'success' },
                  { action: 'Attendance marked', time: '2 days ago', type: 'info' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
              <div className="space-y-4">
                {[
                  { event: 'Parent-Teacher Meeting', date: 'Dec 15, 2024', color: 'bg-blue-500' },
                  { event: 'Annual Sports Day', date: 'Dec 20, 2024', color: 'bg-green-500' },
                  { event: 'Mid-Term Exams', date: 'Jan 10, 2025', color: 'bg-yellow-500' },
                  { event: 'Winter Break Starts', date: 'Dec 25, 2024', color: 'bg-purple-500' },
                ].map((event, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 ${event.color} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                      {event.date.split(' ')[1]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.event}</p>
                      <p className="text-xs text-gray-500">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
