import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2,
  ChevronRight
} from 'lucide-react';
import classesService, { type Class, type Section, type Subject } from '../services/classes.service';

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesData, subjectsData] = await Promise.all([
        classesService.getAll(),
        classesService.getSubjects(),
      ]);
      setClasses(classesData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = async (classItem: Class) => {
    setSelectedClass(classItem);
    try {
      const sectionsData = await classesService.getSections(classItem.id);
      setSections(sectionsData);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Classes & Sections</h1>
              <p className="text-sm text-gray-500">Manage classes and sections</p>
            </div>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Plus className="w-4 h-4 mr-2" />
              <span>Add Class</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classes List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">All Classes</h2>
              </div>
              <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                {classes.map((classItem) => (
                  <button
                    key={classItem.id}
                    onClick={() => handleClassClick(classItem)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                      selectedClass?.id === classItem.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{classItem.name}</p>
                        <p className="text-xs text-gray-500">Grade {classItem.grade}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Class Details */}
          <div className="lg:col-span-2">
            {selectedClass ? (
              <div className="space-y-6">
                {/* Sections */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Sections - {selectedClass.name}
                    </h2>
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1">
                      <Plus className="w-3 h-3" />
                      <span>Add Section</span>
                    </button>
                  </div>
                  <div className="p-4">
                    {sections.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sections.map((section) => (
                          <div
                            key={section.id}
                            className="p-4 border rounded-lg hover:shadow-md transition"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-900">
                                Section {section.name}
                              </h3>
                              <div className="flex space-x-2">
                                <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>Capacity: {section.capacity || 'Not set'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No sections found for this class
                      </p>
                    )}
                  </div>
                </div>

                {/* Subjects */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {subjects.slice(0, 6).map((subject) => (
                        <div
                          key={subject.id}
                          className="p-4 border rounded-lg hover:shadow-md transition"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                              <p className="text-sm text-gray-500">Code: {subject.code}</p>
                            </div>
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a class to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* All Subjects Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Subjects</h2>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="p-4 border rounded-lg hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                    <div className="flex space-x-1">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-3 h-3" />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Code: {subject.code}</p>
                  {subject.description && (
                    <p className="text-xs text-gray-500 mt-1">{subject.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
