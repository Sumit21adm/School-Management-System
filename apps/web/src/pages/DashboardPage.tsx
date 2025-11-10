import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Bell
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    // Fetch real data from API
    const fetchDashboardData = async () => {
      try {
        // const token = localStorage.getItem('token');
        // TODO: Replace with actual API endpoints when available
        // const statsRes = await fetch('http://localhost:3001/api/v1/dashboard/stats', {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // const announcementsRes = await fetch('http://localhost:3001/api/v1/announcements?limit=5', {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        
        // For now, set empty states
        setAttendanceStats(null);
        setRecentAnnouncements([]);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };
    
    fetchDashboardData();
  }, []);

  const stats = [
    { label: 'Total Students', value: '0', change: '0%', color: 'bg-blue-500', trending: 'same' },
    { label: 'Total Teachers', value: '0', change: '0%', color: 'bg-green-500', trending: 'same' },
    { label: 'Classes', value: '0', change: '0%', color: 'bg-yellow-500', trending: 'same' },
    { label: 'Pending Fees', value: '₹0', change: '0%', color: 'bg-red-500', trending: 'same' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
              <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
              <div className={`flex items-center text-sm ${
                stat.trending === 'up' ? 'text-green-600' :
                stat.trending === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.trending === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
                {stat.trending === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
                <span className="font-medium">{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <button
          onClick={() => navigate('/students')}
          className="bg-white rounded-lg shadow hover:shadow-md transition p-6 text-left group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Students</h3>
              <p className="text-sm text-gray-600">View and manage student records</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/teachers')}
          className="bg-white rounded-lg shadow hover:shadow-md transition p-6 text-left group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Teachers</h3>
              <p className="text-sm text-gray-600">View and manage teacher profiles</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/classes')}
          className="bg-white rounded-lg shadow hover:shadow-md transition p-6 text-left group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition">
              <BookOpen className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Classes</h3>
              <p className="text-sm text-gray-600">View and manage class sections</p>
            </div>
          </div>
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Attendance Stats */}
        {attendanceStats && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
                <button
                  onClick={() => navigate('/attendance/reports')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Reports
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{attendanceStats.today.totalStudents}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{attendanceStats.today.present}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{attendanceStats.today.absent}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Absent</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{attendanceStats.today.attendancePercentage}%</p>
                  <p className="text-xs sm:text-sm text-gray-600">Rate</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/attendance/mark')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Mark Attendance
              </button>
            </div>
          </div>
        )}

        {/* Recent Announcements */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
              <button
                onClick={() => navigate('/announcements')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {recentAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {recentAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="flex space-x-3 p-3 hover:bg-gray-50 rounded-lg transition cursor-pointer"
                    onClick={() => navigate('/announcements')}
                  >
                    <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{announcement.body}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(announcement.publishAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No recent announcements</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {[
              { action: 'New student enrolled', time: '2 hours ago', type: 'success' },
              { action: 'Exam results published', time: '5 hours ago', type: 'info' },
              { action: 'Fee payment received', time: '1 day ago', type: 'success' },
              { action: 'Attendance marked', time: '2 days ago', type: 'info' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
