import { useState } from 'react';
import { Plus, Bell, Trash2, Edit, Send } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: any;
  publishAt: string;
  expiresAt?: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Parent-Teacher Meeting',
      body: 'Annual parent-teacher meeting scheduled for next week.',
      audience: { type: 'parent' },
      publishAt: '2024-11-15T00:00:00Z',
      expiresAt: '2024-11-20T00:00:00Z',
      createdAt: '2024-11-10T00:00:00Z',
    },
    {
      id: '2',
      title: 'Exam Schedule Released',
      body: 'Mid-term exam schedule has been released. Check the calendar.',
      audience: { type: 'student' },
      publishAt: '2024-11-12T00:00:00Z',
      createdAt: '2024-11-10T00:00:00Z',
    },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const handleDelete = (announcementId: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    }
  };

  const handleNotify = (announcementId: string) => {
    // In production, call API: POST /announcements/:id/notify
    console.log('Sending notifications for announcement:', announcementId);
    alert('Notifications sent successfully!');
  };

  const getAudienceLabel = (audience: any) => {
    if (audience.type === 'all') return 'All Users';
    if (audience.type === 'student') return 'Students';
    if (audience.type === 'parent') return 'Parents';
    if (audience.type === 'teacher') return 'Teachers';
    if (audience.type === 'staff') return 'Staff';
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
              <p className="text-sm text-gray-500">{announcements.length} total announcements</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>New Announcement</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {announcements.map(announcement => (
            <div key={announcement.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {getAudienceLabel(announcement.audience)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{announcement.body}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Published: {new Date(announcement.publishAt).toLocaleDateString()}</span>
                    {announcement.expiresAt && (
                      <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleNotify(announcement.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    title="Send Notifications"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
              <p className="text-gray-600 mb-6">Create your first announcement to get started.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                <span>Create Announcement</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && <CreateAnnouncementModal onClose={() => setShowCreateModal(false)} />}
      {selectedAnnouncement && (
        <EditAnnouncementModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </div>
  );
}

function CreateAnnouncementModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audienceType, setAudienceType] = useState('all');
  const [publishAt, setPublishAt] = useState(new Date().toISOString().split('T')[0]);
  const [expiresAt, setExpiresAt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const audience = JSON.stringify({ type: audienceType });
    
    // In production, call API: POST /announcements
    console.log('Creating announcement:', { title, body, audience, publishAt, expiresAt });
    
    alert('Announcement created successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Announcement</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audience
              </label>
              <select
                value={audienceType}
                onChange={(e) => setAudienceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="student">Students</option>
                <option value="parent">Parents</option>
                <option value="teacher">Teachers</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publish Date
                </label>
                <input
                  type="date"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditAnnouncementModal({ announcement, onClose }: { announcement: Announcement; onClose: () => void }) {
  console.log('Editing announcement:', announcement.id);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Announcement</h2>
        <p className="text-gray-600">Edit functionality would be implemented here.</p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
