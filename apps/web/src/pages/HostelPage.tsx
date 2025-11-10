import { useState, useEffect } from 'react';
import { Plus, Search, Download } from 'lucide-react';

interface Building {
  id: string;
  name: string;
  type: string;
  address?: string;
  warden?: string;
  phone?: string;
  rooms: any[];
}

interface Allocation {
  id: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  room: {
    building: {
      name: string;
    };
    roomNumber: string;
  };
  bedNumber?: string;
  checkIn: string;
  checkOut?: string;
  status: string;
}

export default function HostelPage() {
  const [view, setView] = useState<'buildings' | 'allocations'>('buildings');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:3001/api/v1';
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (view === 'buildings') {
      fetchBuildings();
    } else {
      fetchAllocations();
    }
  }, [view]);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/hostel/buildings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setBuildings(data);
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
    setLoading(false);
  };

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/hostel/allocations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAllocations(data);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
    setLoading(false);
  };

  const handleCheckout = async (allocationId: string) => {
    try {
      await fetch(`${API_BASE}/hostel/allocations/${allocationId}/checkout`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAllocations();
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  const handleExport = async () => {
    const endpoint = view;
    try {
      const response = await fetch(`${API_BASE}/hostel/export/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hostel-${endpoint}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hostel Management</h1>
              <p className="text-sm text-gray-500">Manage hostels, rooms, and student allocations</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setView('buildings')}
              className={`px-6 py-3 font-medium ${
                view === 'buildings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Buildings & Rooms
            </button>
            <button
              onClick={() => setView('allocations')}
              className={`px-6 py-3 font-medium ${
                view === 'allocations'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Student Allocations
            </button>
          </div>

          {/* Action Bar */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1 relative max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${view}...`}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => alert(`Add new ${view.slice(0, -1)} form would open here`)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add {view === 'buildings' ? 'Building' : 'Allocation'}</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : view === 'buildings' ? (
              <div className="space-y-6">
                {buildings.map((building) => (
                  <div key={building.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{building.name}</h3>
                          <p className="text-sm text-gray-600">
                            {building.type.charAt(0).toUpperCase() + building.type.slice(1)} Hostel
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Warden: {building.warden || '-'}</p>
                          <p className="text-sm text-gray-600">Phone: {building.phone || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {building.rooms.map((room: any) => (
                          <div
                            key={room.id}
                            className={`p-3 rounded-lg border ${
                              room.status === 'full' ? 'bg-red-50 border-red-200' :
                              room.status === 'maintenance' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-green-50 border-green-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">Room {room.roomNumber}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                room.status === 'full' ? 'bg-red-100 text-red-800' :
                                room.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {room.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Capacity: {room.allocations.length}/{room.capacity}
                            </p>
                            {room.floor && (
                              <p className="text-xs text-gray-500 mt-1">Floor {room.floor}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {building.rooms.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No rooms in this building</p>
                      )}
                    </div>
                  </div>
                ))}
                {buildings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No buildings found</div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-In</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allocations.map((allocation) => (
                      <tr key={allocation.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {allocation.student.user.firstName} {allocation.student.user.lastName}
                        </td>
                        <td className="px-4 py-3 text-sm">{allocation.student.user.email}</td>
                        <td className="px-4 py-3 text-sm">{allocation.room.building.name}</td>
                        <td className="px-4 py-3 text-sm">{allocation.room.roomNumber}</td>
                        <td className="px-4 py-3 text-sm">{allocation.bedNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm">{new Date(allocation.checkIn).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            allocation.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {allocation.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {allocation.status === 'active' && (
                            <button
                              onClick={() => handleCheckout(allocation.id)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Check Out
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allocations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No allocations found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
