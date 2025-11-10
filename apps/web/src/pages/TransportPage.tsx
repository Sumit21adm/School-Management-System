import { useState, useEffect } from 'react';
import { Bus, Plus, Search, Download, ArrowLeft } from 'lucide-react';

interface Route {
  id: string;
  name: string;
  description?: string;
  stops: any[];
  allocations: any[];
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
  type: string;
  capacity: number;
  driver?: string;
  phone?: string;
  status: string;
  allocations: any[];
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
  route: {
    name: string;
  };
  vehicle: {
    vehicleNumber: string;
  };
  stopName?: string;
  status: string;
}

export default function TransportPage() {
  const [view, setView] = useState<'routes' | 'vehicles' | 'allocations'>('routes');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:3001/api/v1';
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (view === 'routes') {
      fetchRoutes();
    } else if (view === 'vehicles') {
      fetchVehicles();
    } else {
      fetchAllocations();
    }
  }, [view]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/transport/routes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
    setLoading(false);
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/transport/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
    setLoading(false);
  };

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/transport/allocations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAllocations(data);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
    setLoading(false);
  };

  const handleExport = async () => {
    const endpoint = view;
    try {
      const response = await fetch(`${API_BASE}/transport/export/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transport-${endpoint}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Bus className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-800">Transport Management</h1>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setView('routes')}
              className={`px-6 py-3 font-medium ${
                view === 'routes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Routes
            </button>
            <button
              onClick={() => setView('vehicles')}
              className={`px-6 py-3 font-medium ${
                view === 'vehicles'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Vehicles
            </button>
            <button
              onClick={() => setView('allocations')}
              className={`px-6 py-3 font-medium ${
                view === 'allocations'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Allocations
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
                <span>Add {view.slice(0, -1).charAt(0).toUpperCase() + view.slice(1, -1)}</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : view === 'routes' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map((route) => (
                  <div key={route.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{route.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{route.description || 'No description'}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{route.stops.length} stops</span>
                      <span className="text-blue-600">{route.allocations.length} students</span>
                    </div>
                  </div>
                ))}
                {routes.length === 0 && (
                  <div className="col-span-3 text-center py-8 text-gray-500">No routes found</div>
                )}
              </div>
            ) : view === 'vehicles' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{vehicle.vehicleNumber}</td>
                        <td className="px-4 py-3 text-sm capitalize">{vehicle.type}</td>
                        <td className="px-4 py-3 text-sm">{vehicle.capacity}</td>
                        <td className="px-4 py-3 text-sm">{vehicle.driver || '-'}</td>
                        <td className="px-4 py-3 text-sm">{vehicle.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            vehicle.status === 'active' ? 'bg-green-100 text-green-800' :
                            vehicle.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {vehicle.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {vehicle.allocations.length}/{vehicle.capacity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {vehicles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No vehicles found</div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stop</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allocations.map((allocation) => (
                      <tr key={allocation.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {allocation.student.user.firstName} {allocation.student.user.lastName}
                        </td>
                        <td className="px-4 py-3 text-sm">{allocation.student.user.email}</td>
                        <td className="px-4 py-3 text-sm">{allocation.route.name}</td>
                        <td className="px-4 py-3 text-sm">{allocation.vehicle.vehicleNumber}</td>
                        <td className="px-4 py-3 text-sm">{allocation.stopName || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            allocation.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {allocation.status}
                          </span>
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
