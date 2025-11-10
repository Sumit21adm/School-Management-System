import { useState } from 'react';
import { 
  Building2,
  User,
  Bell,
  Shield,
  Palette,
  Save
} from 'lucide-react';
import { getInputClass, getTextareaClass } from '../styles/formStyles';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'notifications' | 'security' | 'appearance'>('general');
  const [settings, setSettings] = useState({
    schoolName: 'Demo School',
    schoolCode: 'DS001',
    email: 'admin@demoschool.com',
    phone: '+1234567890',
    address: '123 Education Street, City, Country',
    academicYearStart: '2025-04-01',
    academicYearEnd: '2026-03-31',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    theme: 'light',
  });

  const tabs = [
    { id: 'general', name: 'General', icon: Building2 },
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
  ];

  const handleSave = () => {
    // Save settings logic here
    alert('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500">Manage your account and preferences</p>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabs Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">General Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        School Name
                      </label>
                      <input
                        type="text"
                        value={settings.schoolName}
                        onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                        className={getInputClass()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        School Code
                      </label>
                      <input
                        type="text"
                        value={settings.schoolCode}
                        onChange={(e) => setSettings({ ...settings, schoolCode: e.target.value })}
                        className={getInputClass()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        className={getInputClass()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className={getInputClass()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Address
                      </label>
                      <textarea
                        value={settings.address}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        rows={3}
                        className={getTextareaClass()}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Academic Year Start
                        </label>
                        <input
                          type="date"
                          value={settings.academicYearStart}
                          onChange={(e) => setSettings({ ...settings, academicYearStart: e.target.value })}
                          className={getInputClass()}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Academic Year End
                        </label>
                        <input
                          type="date"
                          value={settings.academicYearEnd}
                          onChange={(e) => setSettings({ ...settings, academicYearEnd: e.target.value })}
                          className={getInputClass()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-6">
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Upload Photo
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Admin"
                          className={getInputClass()}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          defaultValue="User"
                          className={getInputClass()}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        defaultValue="Administrator"
                        disabled
                        className={getInputClass(true)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-600">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, email: e.target.checked },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                        <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.sms}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, sms: e.target.checked },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-600">Receive push notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.push}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, push: e.target.checked },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Update Password
                        </button>
                      </div>
                    </div>
                    <div className="pt-6 border-t">
                      <h3 className="font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Add an extra layer of security to your account
                      </p>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Appearance</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          className={`p-4 border-2 rounded-lg ${
                            settings.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                          onClick={() => setSettings({ ...settings, theme: 'light' })}
                        >
                          <div className="w-full h-20 bg-white border rounded mb-2"></div>
                          <p className="text-sm font-medium">Light</p>
                        </button>
                        <button
                          className={`p-4 border-2 rounded-lg ${
                            settings.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                          onClick={() => setSettings({ ...settings, theme: 'dark' })}
                        >
                          <div className="w-full h-20 bg-gray-800 border rounded mb-2"></div>
                          <p className="text-sm font-medium">Dark</p>
                        </button>
                        <button
                          className={`p-4 border-2 rounded-lg ${
                            settings.theme === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                          onClick={() => setSettings({ ...settings, theme: 'auto' })}
                        >
                          <div className="w-full h-20 bg-gradient-to-r from-white to-gray-800 border rounded mb-2"></div>
                          <p className="text-sm font-medium">Auto</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
