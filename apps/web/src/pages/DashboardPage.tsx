import { useState, useEffect } from 'react';
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
  ClipboardList,
  Bus,
  Building2,
  Bell,
  FileBarChart
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    // Mock API calls - in production, fetch from API
    setAttendanceStats({
      today: {
        totalStudents: 1234,
        present: 1180,
        absent: 54,
        attendancePercentage: '95.62',
      },
      weeklyTrend: [
        { date: '2024-11-04', attendancePercentage: '94.5' },
        { date: '2024-11-05', attendancePercentage: '96.2' },
        { date: '2024-11-06', attendancePercentage: '95.8' },
        { date: '2024-11-07', attendancePercentage: '97.1' },
        { date: '2024-11-08', attendancePercentage: '95.6' },
      ],
    });

    setRecentAnnouncements([
      {
        id: '1',
        title: 'Parent-Teacher Meeting',
        body: 'Annual parent-teacher meeting scheduled for next week.',
        publishAt: '2024-11-15T00:00:00Z',
      },
      {
        id: '2',
        title: 'Exam Schedule Released',
        body: 'Mid-term exam schedule has been released.',
        publishAt: '2024-11-12T00:00:00Z',
      },
    ]);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const modules = [
    { name: 'Dashboard', icon: Home, path: '/dashboard', active: true },
    { name: 'Students', icon: GraduationCap, path: '/students' },
    { name: 'Teachers', icon: Users, path: '/teachers' },
    { name: 'Attendance', icon: ClipboardList, path: '/attendance/mark' },
    { name: 'Announcements', icon: Bell, path: '/announcements' },
    { name: 'Classes', icon: BookOpen, path: '/classes' },
    { name: 'Library', icon: BookOpen, path: '/library' },
    { name: 'Transport', icon: Bus, path: '/transport' },
    { name: 'Hostel', icon: Building2, path: '/hostel' },
    { name: 'Exams', icon: FileText, path: '/exams' },
    { name: 'Fees', icon: DollarSign, path: '/fees' },
    { name: 'Reports', icon: FileBarChart, path: '/reports' },
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
              onClick={() => navigate(module.path)}
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

          {/* Attendance & Announcements Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Attendance Widget */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h3>
              {attendanceStats ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Students</span>
                    <span className="text-sm font-semibold">{attendanceStats.today.totalStudents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Present</span>
                    <span className="text-sm font-semibold text-green-600">{attendanceStats.today.present}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Absent</span>
                    <span className="text-sm font-semibold text-red-600">{attendanceStats.today.absent}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
                      <span className="text-xl font-bold text-blue-600">{attendanceStats.today.attendancePercentage}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Loading attendance data...</p>
              )}
            </div>

            {/* Announcements Widget */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Announcements</h3>
              <div className="space-y-4">
                {recentAnnouncements.length > 0 ? (
                  recentAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{announcement.body}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(announcement.publishAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent announcements</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity & Upcoming Events */}
          {/* Attendance Stats */}
          {attendanceStats && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
                <button
                  onClick={() => navigate('/attendance/reports')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View Reports
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{attendanceStats.today.totalStudents}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Present</p>
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.today.present}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{attendanceStats.today.absent}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Attendance %</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-blue-600">{attendanceStats.today.attendancePercentage}%</p>
                    {parseFloat(attendanceStats.today.attendancePercentage) >= 95 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Weekly Trend</h4>
                <div className="flex items-end space-x-2">
                  {attendanceStats.weeklyTrend.map((day: any, index: number) => (
                    <div key={index} className="flex-1">
                      <div className="bg-blue-500 rounded-t" style={{ height: `${parseFloat(day.attendancePercentage)}px` }}></div>
                      <p className="text-xs text-gray-600 mt-1 text-center">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => navigate('/attendance/mark')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mark Attendance
                </button>
              </div>
            </div>
          )}

          {/* Recent Activity and Announcements */}
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
                <button
                  onClick={() => navigate('/announcements')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{announcement.body}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(announcement.publishAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {recentAnnouncements.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No announcements</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
