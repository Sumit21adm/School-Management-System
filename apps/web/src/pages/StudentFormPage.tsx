import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { studentsService } from '../services/students.service';
import { ArrowLeft, Save } from 'lucide-react';
import { formStyles, getInputClass, getSelectClass, getTextareaClass } from '../styles/formStyles';

export default function StudentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    admissionNo: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    address: '',
    sectionId: '',
  });

  useEffect(() => {
    if (isEdit) {
      loadStudent();
    }
  }, [id]);

  const loadStudent = async () => {
    try {
      const student = await studentsService.getById(id!);
      setFormData({
        email: student.user.email,
        password: '', // Don't populate password
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        phone: student.user.phone || '',
        admissionNo: student.admissionNo,
        dob: student.dob ? student.dob.split('T')[0] : '',
        gender: student.gender || '',
        bloodGroup: student.bloodGroup || '',
        address: student.address || '',
        sectionId: student.sectionId || '',
      });
    } catch (error) {
      console.error('Failed to load student:', error);
      alert('Failed to load student');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await studentsService.update(id!, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          dob: formData.dob || undefined,
          gender: formData.gender || undefined,
          bloodGroup: formData.bloodGroup || undefined,
          address: formData.address || undefined,
          sectionId: formData.sectionId || undefined,
        });
        alert('Student updated successfully');
      } else {
        if (!formData.password) {
          alert('Password is required for new students');
          setLoading(false);
          return;
        }
        await studentsService.create({
          ...formData,
          phone: formData.phone || undefined,
          dob: formData.dob || undefined,
          gender: formData.gender || undefined,
          bloodGroup: formData.bloodGroup || undefined,
          address: formData.address || undefined,
          sectionId: formData.sectionId || undefined,
        });
        alert('Student created successfully');
      }
      navigate('/students');
    } catch (error: any) {
      console.error('Failed to save student:', error);
      alert(error.response?.data?.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link
            to="/students"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Student' : 'Add New Student'}
            </h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className={formStyles.section.container}>
            <h2 className={formStyles.section.title}>Basic Information</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={formStyles.label.base}>
                  First Name <span className={formStyles.label.required}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={getInputClass()}
                  placeholder="Sumit"
                />
              </div>

              <div>
                <label className={formStyles.label.base}>
                  Last Name <span className={formStyles.label.required}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={getInputClass()}
                  placeholder="Kumar"
                />
              </div>

              <div>
                <label className={formStyles.label.base}>
                  Email <span className={formStyles.label.required}>*</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={isEdit}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={getInputClass(isEdit)}
                />
              </div>

              {!isEdit && (
                <div>
                  <label className={formStyles.label.base}>
                    Password <span className={formStyles.label.required}>*</span>
                  </label>
                  <input
                    type="password"
                    required={!isEdit}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={getInputClass()}
                  />
                </div>
              )}

              <div>
                <label className={formStyles.label.base}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={getInputClass()}
                />
              </div>

              <div>
                <label className={formStyles.label.base}>
                  Admission No <span className={formStyles.label.required}>*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  value={formData.admissionNo}
                  onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                  className={getInputClass(isEdit)}
                />
              </div>

              <div>
                <label className={formStyles.label.base}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className={getInputClass()}
                />
              </div>

              <div>
                <label className={formStyles.label.base}>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className={getSelectClass()}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={formStyles.label.base}>
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className={getSelectClass()}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={formStyles.label.base}>Address</label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={getTextareaClass()}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
            <Link
              to="/students"
              className={formStyles.button.secondary}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={formStyles.button.primary}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
