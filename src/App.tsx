import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  LayoutDashboard, 
  Bell, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  FileText,
  AlertTriangle,
  ChevronRight,
  X,
  Save,
  LogOut,
  Lock,
  User,
  BarChart,
  Download,
  UserMinus,
  UserCheck,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Employee, AttendanceRecord, SalaryPayment, ExpiryNotification } from './types';

type Tab = 'dashboard' | 'employees' | 'attendance' | 'payroll' | 'tracker';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [notifications, setNotifications] = useState<ExpiryNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes, salRes, notRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance'),
        fetch('/api/salary'),
        fetch('/api/notifications')
      ]);
      
      setEmployees(await empRes.json());
      setAttendance(await attRes.json());
      setSalaryPayments(await salRes.json());
      setNotifications(await notRes.json());
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={(userData) => { setUser(userData); setIsLoggedIn(true); }} />;
  }

  return (
    <div className="flex h-screen bg-[#F5F5F4] text-[#141414] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#141414]/10 flex flex-col">
        <div className="p-6 border-bottom border-[#141414]/10">
          <h1 className="text-xl font-bold tracking-tight text-[#141414]">STM Engineering</h1>
          <p className="text-xs text-[#141414]/50 uppercase tracking-widest mt-1">HR Portal</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Employees" 
            active={activeTab === 'employees'} 
            onClick={() => setActiveTab('employees')} 
          />
          <NavItem 
            icon={<Calendar size={20} />} 
            label="Attendance" 
            active={activeTab === 'attendance'} 
            onClick={() => setActiveTab('attendance')} 
          />
          <NavItem 
            icon={<BarChart size={20} />} 
            label="Hours Tracker" 
            active={activeTab === 'tracker'} 
            onClick={() => setActiveTab('tracker')} 
          />
          <NavItem 
            icon={<CreditCard size={20} />} 
            label="Payroll" 
            active={activeTab === 'payroll'} 
            onClick={() => setActiveTab('payroll')} 
          />
        </nav>

        <div className="p-4 border-t border-[#141414]/10">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#141414] flex items-center justify-center text-white text-xs font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-[#141414]/50">Administrator</p>
              </div>
            </div>
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="p-2 text-[#141414]/40 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
            <p className="text-[#141414]/50 text-sm">Manage your organization's human resources.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="text-[#141414]/60 cursor-pointer hover:text-[#141414]" size={24} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[#F5F5F4]">
                  {notifications.length}
                </span>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#141414]"></div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard notifications={notifications} employees={employees} attendance={attendance} />}
              {activeTab === 'employees' && <EmployeeManagement employees={employees} onUpdate={fetchData} />}
              {activeTab === 'attendance' && <AttendanceManagement employees={employees} attendance={attendance} onUpdate={fetchData} />}
              {activeTab === 'tracker' && <HoursTracker />}
              {activeTab === 'payroll' && <PayrollManagement employees={employees} payments={salaryPayments} onUpdate={fetchData} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active 
          ? 'bg-[#141414] text-white shadow-lg' 
          : 'text-[#141414]/60 hover:bg-[#141414]/5 hover:text-[#141414]'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

// --- Components ---

function LoginPage({ onLogin }: { onLogin: (user: { username: string }) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Singapore Theme Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2f/ad/1f/18/singapore-flyer.jpg" 
          alt="Singapore Skyline" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#141414]/70 via-[#141414]/30 to-transparent backdrop-blur-[0.5px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-white/95 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20"
      >
        <div className="text-center mb-8">
          {/* Company Logo */}
          <div className="inline-flex items-center justify-center w-80 h-20 bg-white rounded-3xl mb-6 shadow-2xl overflow-hidden border border-[#141414]/5 transition-transform hover:scale-105 duration-300">
            <img 
              src="https://raw.githubusercontent.com/sakthigokul/STM-ENGINEERING/7c02d0f529c7381d2e1ae1ca5dd2af8bc85709f6/stm_logo.jpg" 
              alt="STM Engineering Logo" 
              className="w-full h-full object-contain p-2"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback if the link doesn't resolve as a direct image
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="flex flex-col items-center justify-center h-full w-full bg-[#141414] text-white italic font-black text-2xl">STM Engg</div>';
              }}
            />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[#141414] uppercase">STM Engineering</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-8 h-[1px] bg-[#141414]/20"></span>
            <p className="text-[#141414]/50 text-[10px] font-bold uppercase tracking-widest">Singapore</p>
            <span className="w-8 h-[1px] bg-[#141414]/20"></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#141414]/50 uppercase px-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
              <input 
                type="text"
                required
                className="w-full pl-12 pr-4 py-4 bg-[#F5F5F4] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#141414]/50 uppercase px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
              <input 
                type="password"
                required
                className="w-full pl-12 pr-4 py-4 bg-[#F5F5F4] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10 transition-all"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm font-medium text-center"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#141414]/90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login to Portal'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#141414]/5 text-center">
          <p className="text-[10px] text-[#141414]/30 uppercase tracking-widest font-bold">
            Authorized Personnel Only
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Dashboard({ notifications, employees, attendance }: { notifications: ExpiryNotification[], employees: Employee[], attendance: AttendanceRecord[] }) {
  const today = new Date().toISOString().split('T')[0];
  const activeToday = attendance.filter(a => a.date === today).length;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Employees" value={employees.length} icon={<Users className="text-blue-500" />} />
        <StatCard title="Active Today" value={activeToday} icon={<Calendar className="text-emerald-500" />} />
        <StatCard title="Expiry Alerts" value={notifications.length} icon={<AlertTriangle className="text-amber-500" />} color={notifications.length > 0 ? 'bg-amber-50' : ''} />
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#141414]/10 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#141414]/10 bg-amber-50/50 flex items-center gap-2">
            <Bell size={18} className="text-amber-600" />
            <h3 className="font-bold text-amber-900">Urgent Expiry Notifications (Next 3 Days)</h3>
          </div>
          <div className="divide-y divide-[#141414]/5">
            {notifications.map((notif, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-amber-50/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${notif.type === 'Visa' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="font-medium">{notif.name}</p>
                    <p className="text-xs text-[#141414]/50">{notif.type} expires on <span className="font-bold text-red-500">{notif.expiry_date}</span></p>
                  </div>
                </div>
                <div className="text-xs font-bold px-2 py-1 bg-red-100 text-red-600 rounded uppercase">Expiring Soon</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity / Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-[#141414]/10 p-6 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Clock size={18} /> Recent Attendance
          </h3>
          <div className="space-y-4">
            {attendance.slice(0, 5).map((record, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F5F4]/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#141414]/10 flex items-center justify-center text-xs font-bold">
                    {record.employee_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{record.employee_name}</p>
                    <p className="text-xs text-[#141414]/50">{record.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{record.hours_worked} hrs</p>
                  <p className="text-[10px] text-[#141414]/50">{record.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#141414]/10 p-6 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Users size={18} /> Newest Employees
          </h3>
          <div className="space-y-4">
            {employees.slice(-5).reverse().map((emp, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F5F4]/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-[#141414]/50">{emp.visa_details}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#141414]/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color = 'bg-white' }: { title: string, value: string | number, icon: React.ReactNode, color?: string }) {
  return (
    <div className={`${color} p-6 rounded-2xl border border-[#141414]/10 shadow-sm`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-[#F5F5F4] rounded-lg">{icon}</div>
      </div>
      <p className="text-[#141414]/50 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function EmployeeManagement({ employees, onUpdate }: { employees: Employee[], onUpdate: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'active' | 'old'>('active');

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.passport_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = viewMode === 'active' ? e.is_active === 1 : e.is_active === 0;
    return matchesSearch && matchesStatus;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingEmployee?.id ? 'PUT' : 'POST';
    const url = editingEmployee?.id ? `/api/employees/${editingEmployee.id}` : '/api/employees';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editingEmployee, is_active: editingEmployee?.is_active ?? 1 })
    });

    setIsModalOpen(false);
    setEditingEmployee(null);
    onUpdate();
  };

  const toggleStatus = async (emp: Employee) => {
    const newStatus = emp.is_active === 1 ? 0 : 1;
    await fetch(`/api/employees/${emp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...emp, is_active: newStatus })
    });
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-white p-1 rounded-xl border border-[#141414]/10 shadow-sm">
          <button 
            onClick={() => setViewMode('active')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'active' ? 'bg-[#141414] text-white' : 'text-[#141414]/50 hover:bg-[#141414]/5'}`}
          >
            <Users size={16} /> Active Employees
          </button>
          <button 
            onClick={() => setViewMode('old')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'old' ? 'bg-[#141414] text-white' : 'text-[#141414]/50 hover:bg-[#141414]/5'}`}
          >
            <History size={16} /> Old Employee Data
          </button>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
            <input 
              type="text" 
              placeholder="Search employees..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {viewMode === 'active' && (
            <button 
              onClick={() => { setEditingEmployee({ is_active: 1 }); setIsModalOpen(true); }}
              className="bg-[#141414] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#141414]/90 transition-all whitespace-nowrap"
            >
              <Plus size={18} /> Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#141414]/10 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F5F5F4] border-b border-[#141414]/10">
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Name</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Passport</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Visa Details</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Visa Expiry</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Insurance Expiry</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]/5">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-[#141414]/30 italic">
                  No {viewMode} employees found.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#F5F5F4]/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${emp.is_active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                        {emp.name.charAt(0)}
                      </div>
                      <span className={`font-medium ${!emp.is_active && 'text-gray-400'}`}>{emp.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-mono">{emp.passport_number}</td>
                  <td className="p-4 text-sm">{emp.visa_details}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${new Date(emp.visa_expiry) < new Date() ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {emp.visa_expiry}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{emp.insurance_expiry}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditingEmployee(emp); setIsModalOpen(true); }}
                        className="text-[#141414]/40 hover:text-[#141414] transition-colors text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => toggleStatus(emp)}
                        className={`p-1.5 rounded-lg transition-all ${emp.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        title={emp.is_active ? "Move to Old Data" : "Reactivate Employee"}
                      >
                        {emp.is_active ? <UserMinus size={16} /> : <UserCheck size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#141414]/10 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingEmployee?.id ? 'Edit Employee' : 'Add New Employee'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F5F5F4] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Full Name</label>
                    <input 
                      required
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={editingEmployee?.name || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Passport Number</label>
                    <input 
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={editingEmployee?.passport_number || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, passport_number: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141414]/50 uppercase">Address</label>
                  <textarea 
                    className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none h-20"
                    value={editingEmployee?.address || ''}
                    onChange={e => setEditingEmployee({...editingEmployee, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Visa Details</label>
                    <input 
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={editingEmployee?.visa_details || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, visa_details: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Visa Expiry</label>
                    <input 
                      type="date"
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={editingEmployee?.visa_expiry || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, visa_expiry: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Insurance Details</label>
                    <input 
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={editingEmployee?.insurance_details || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, insurance_details: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Insurance Expiry</label>
                    <input 
                      type="date"
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={editingEmployee?.insurance_expiry || ''}
                      onChange={e => setEditingEmployee({...editingEmployee, insurance_expiry: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141414]/50 uppercase">Base Salary (SGD)</label>
                  <input 
                    type="number"
                    className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                    value={editingEmployee?.base_salary || 0}
                    onChange={e => setEditingEmployee({...editingEmployee, base_salary: Number(e.target.value)})}
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#141414]/90 transition-all">
                    <Save size={20} /> Save Employee Details
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AttendanceManagement({ employees, attendance, onUpdate }: { employees: Employee[], attendance: AttendanceRecord[], onUpdate: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<AttendanceRecord>>({
    date: new Date().toISOString().split('T')[0],
    hours_worked: 8,
    location: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });
    setIsModalOpen(false);
    onUpdate();
  };

  const groupedAttendance = attendance.reduce((acc, record) => {
    if (!acc[record.date]) acc[record.date] = [];
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Daily Attendance Logs</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#141414] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#141414]/90 transition-all shadow-sm"
        >
          <Plus size={18} /> Log New Attendance
        </button>
      </div>

      <div className="space-y-8">
        {Object.keys(groupedAttendance).length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-[#141414]/20 text-center text-[#141414]/30 italic">
            No attendance records found.
          </div>
        ) : (
          Object.entries(groupedAttendance).sort((a, b) => b[0].localeCompare(a[0])).map(([date, records]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-[#141414]/10"></div>
                <span className="text-xs font-black uppercase tracking-widest text-[#141414]/40 bg-[#F5F5F4] px-3 py-1 rounded-full border border-[#141414]/5">
                  {new Date(date).toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <div className="h-[1px] flex-1 bg-[#141414]/10"></div>
              </div>
              
              <div className="bg-white rounded-2xl border border-[#141414]/10 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F5F5F4]/50 border-b border-[#141414]/10">
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-[#141414]/50">Employee</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-[#141414]/50">Role</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-[#141414]/50">Hours</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-[#141414]/50">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141414]/5">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-[#F5F5F4]/30 transition-colors">
                        <td className="p-4 text-sm font-medium">{record.employee_name}</td>
                        <td className="p-4 text-sm">
                          <span className="px-2 py-1 bg-[#141414]/5 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                            {record.role || 'General'}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold flex items-center gap-2">
                          <Clock size={14} className="text-[#141414]/30" />
                          {record.hours_worked} hrs
                        </td>
                        <td className="p-4 text-sm text-[#141414]/60 flex items-center gap-2">
                          <MapPin size={14} className="text-[#141414]/30" />
                          {record.location}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#141414]/10 flex justify-between items-center">
                <h3 className="text-xl font-bold">Log New Attendance</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F5F5F4] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141414]/50 uppercase">Employee</label>
                  <select 
                    required
                    className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                    onChange={e => setNewRecord({...newRecord, employee_id: Number(e.target.value)})}
                  >
                    <option value="">Select Employee</option>
                    {employees.filter(e => e.is_active).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Date</label>
                    <input 
                      type="date"
                      required
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={newRecord.date}
                      onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Role of Work</label>
                    <select 
                      required
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={newRecord.role || ''}
                      onChange={e => setNewRecord({...newRecord, role: e.target.value})}
                    >
                      <option value="">Select Role</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="General">General</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Site Supervisor">Site Supervisor</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Hours Worked</label>
                    <input 
                      type="number"
                      step="0.5"
                      required
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={newRecord.hours_worked}
                      onChange={e => setNewRecord({...newRecord, hours_worked: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Work Location</label>
                    <input 
                      required
                      placeholder="e.g. Site A"
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={newRecord.location}
                      onChange={e => setNewRecord({...newRecord, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold hover:bg-[#141414]/90 transition-all">
                    Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HoursTracker() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<{ employee_name: string, total_hours: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [month, year]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const monthStr = month.toString().padStart(2, '0');
      const res = await fetch(`/api/monthly-hours?month=${monthStr}&year=${year}`);
      setStats(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Monthly Hours Tracker</h3>
        <div className="flex gap-4">
          <select 
            className="p-2 bg-white border border-[#141414]/10 rounded-xl focus:outline-none"
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <input 
            type="number"
            className="w-24 p-2 bg-white border border-[#141414]/10 rounded-xl focus:outline-none"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-[#141414]/50">Loading statistics...</div>
        ) : stats.length === 0 ? (
          <div className="col-span-full text-center py-12 text-[#141414]/50 bg-white rounded-2xl border border-dashed border-[#141414]/20">
            No attendance records found for this period.
          </div>
        ) : (
          stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl border border-[#141414]/10 shadow-sm"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-[#141414]/5 flex items-center justify-center text-sm font-bold">
                  {stat.employee_name.charAt(0)}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{stat.total_hours}h</p>
                  <p className="text-[10px] font-bold text-[#141414]/30 uppercase">Total Hours</p>
                </div>
              </div>
              <h4 className="font-bold text-[#141414]">{stat.employee_name}</h4>
              <div className="mt-4 h-2 bg-[#F5F5F4] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stat.total_hours / 200) * 100, 100)}%` }}
                  className="h-full bg-[#141414]"
                />
              </div>
              <p className="text-[10px] text-[#141414]/40 mt-2">Target: 200h / Month</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function PayrollManagement({ employees, payments, onUpdate }: { employees: Employee[], payments: SalaryPayment[], onUpdate: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SalaryPayment | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [newPayment, setNewPayment] = useState<Partial<SalaryPayment>>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 0
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPayment)
    });
    setIsModalOpen(false);
    onUpdate();
  };

  const generatePayslip = (payment: SalaryPayment) => {
    setSelectedPayment(payment);
  };

  const downloadPDF = async () => {
    const element = document.getElementById('payslip-content');
    if (!element) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${selectedPayment?.employee_name}_${selectedPayment?.month}_${selectedPayment?.year}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Payroll & Salary History</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#141414] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#141414]/90 transition-all"
        >
          <Plus size={18} /> Process Salary
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#141414]/10 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F5F5F4] border-b border-[#141414]/10">
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Date Paid</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Employee</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Period</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Amount</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50 text-right">Payslip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]/5">
            {payments.map((pay) => (
              <tr key={pay.id} className="hover:bg-[#F5F5F4]/30 transition-colors">
                <td className="p-4 text-sm">{pay.payment_date}</td>
                <td className="p-4 text-sm font-medium">{pay.employee_name}</td>
                <td className="p-4 text-sm">{pay.month}/{pay.year}</td>
                <td className="p-4 text-sm font-bold text-emerald-600">SGD {pay.amount.toLocaleString()}</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => generatePayslip(pay)}
                    className="p-2 text-[#141414]/40 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <FileText size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Process Salary Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#141414]/10 flex justify-between items-center">
                <h3 className="text-xl font-bold">Process Salary Payment</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F5F5F4] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141414]/50 uppercase">Employee</label>
                  <select 
                    required
                    className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                    onChange={e => {
                      const emp = employees.find(emp => emp.id === Number(e.target.value));
                      setNewPayment({...newPayment, employee_id: Number(e.target.value), amount: emp?.base_salary || 0});
                    }}
                  >
                    <option value="">Select Employee</option>
                    {employees.filter(e => e.is_active).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Month</label>
                    <input 
                      type="number" min="1" max="12"
                      required
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={newPayment.month}
                      onChange={e => setNewPayment({...newPayment, month: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Year</label>
                    <input 
                      type="number"
                      required
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                      value={newPayment.year}
                      onChange={e => setNewPayment({...newPayment, year: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141414]/50 uppercase">Amount (SGD)</label>
                  <input 
                    type="number"
                    required
                    className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                    value={newPayment.amount}
                    onChange={e => setNewPayment({...newPayment, amount: Number(e.target.value)})}
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold hover:bg-[#141414]/90 transition-all">
                    Confirm Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payslip Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-8"
            >
              <div id="payslip-content" className="bg-white p-4">
                <div className="flex justify-between items-start border-b-2 border-[#141414] pb-6 mb-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">STM Engineering</h2>
                    <p className="text-xs text-[#141414]/50">123 Engineering Way, Singapore 123456</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold uppercase">Payslip</h3>
                    <p className="text-sm font-mono text-[#141414]/50">#{selectedPayment.id.toString().padStart(6, '0')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-[10px] font-bold text-[#141414]/40 uppercase mb-1">Employee Details</p>
                    <p className="font-bold text-lg">{selectedPayment.employee_name}</p>
                    <p className="text-sm text-[#141414]/60">Period: {selectedPayment.month}/{selectedPayment.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#141414]/40 uppercase mb-1">Payment Date</p>
                    <p className="font-bold">{selectedPayment.payment_date}</p>
                  </div>
                </div>

                <div className="border border-[#141414]/10 rounded-2xl overflow-hidden mb-8">
                  <div className="bg-[#F5F5F4] p-4 flex justify-between font-bold text-xs uppercase tracking-wider">
                    <span>Description</span>
                    <span>Amount (SGD)</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Basic Salary</span>
                      <span>{selectedPayment.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Allowances</span>
                      <span>0.00</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Deductions</span>
                      <span>(0.00)</span>
                    </div>
                  </div>
                  <div className="bg-[#141414] text-white p-4 flex justify-between font-bold">
                    <span>NET PAYABLE</span>
                    <span>SGD {selectedPayment.amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-[10px] text-[#141414]/40 italic">
                  This is a computer-generated payslip and does not require a signature.
                </div>
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#141414]/5">
                <button 
                  onClick={downloadPDF}
                  disabled={isDownloading}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  <Download size={18} /> {isDownloading ? 'Generating...' : 'Download PDF'}
                </button>
                <button 
                  onClick={() => setSelectedPayment(null)}
                  className="bg-[#141414] text-white px-6 py-2 rounded-xl font-bold text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
