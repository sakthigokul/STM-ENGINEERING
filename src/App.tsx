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
  User as UserIcon,
  BarChart,
  Download,
  UserMinus,
  UserCheck,
  History,
  Camera,
  Upload,
  CheckCircle,
  Clock3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { Employee, AttendanceRecord, SalaryPayment, ExpiryNotification, Invoice, User } from './types';

type Tab = 'dashboard' | 'employees' | 'attendance' | 'payroll' | 'tracker' | 'invoices';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [notifications, setNotifications] = useState<ExpiryNotification[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn && user) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(user));
      fetchData();
    } else {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
    }
  }, [isLoggedIn, user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [empRes, attRes, salRes, notRes, invRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance' + (user?.role === 'employee' ? `?employee_id=${user.id}` : '')),
        fetch('/api/salary'),
        fetch('/api/notifications'),
        fetch('/api/invoices' + (user?.role === 'employee' ? `?employee_id=${user.id}` : ''))
      ]);
      
      setEmployees(await empRes.json());
      setAttendance(await attRes.json());
      setSalaryPayments(await salRes.json());
      setNotifications(await notRes.json());
      setInvoices(await invRes.json());
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={(userData) => { 
      setUser(userData); 
      setIsLoggedIn(true); 
    }} />;
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
  };

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
          {user?.role === 'admin' && (
            <>
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
            </>
          )}
          <NavItem 
            icon={<FileText size={20} />} 
            label="Invoices" 
            active={activeTab === 'invoices'} 
            onClick={() => setActiveTab('invoices')} 
          />
        </nav>

        <div className="p-4 border-t border-[#141414]/10">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#141414] flex items-center justify-center text-white text-xs font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{user?.role === 'admin' ? user?.username : user?.name}</p>
                <p className="text-xs text-[#141414]/50 capitalize">{user?.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
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
            <button 
              onClick={fetchData}
              className="p-2 text-[#141414]/40 hover:text-[#141414] transition-colors"
              title="Refresh Data"
            >
              <History size={20} className={loading ? "animate-spin" : ""} />
            </button>
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
              {activeTab === 'dashboard' && (
                user?.role === 'admin' 
                  ? <Dashboard notifications={notifications} employees={employees} attendance={attendance} />
                  : <EmployeeDashboard user={user} attendance={attendance} invoices={invoices} onUpdate={fetchData} />
              )}
              {activeTab === 'employees' && user?.role === 'admin' && <EmployeeManagement employees={employees} onUpdate={fetchData} />}
              {activeTab === 'attendance' && user?.role === 'admin' && <AttendanceManagement employees={employees} attendance={attendance} onUpdate={fetchData} />}
              {activeTab === 'tracker' && user?.role === 'admin' && <HoursTracker />}
              {activeTab === 'payroll' && user?.role === 'admin' && <PayrollManagement employees={employees} payments={salaryPayments} onUpdate={fetchData} />}
              {activeTab === 'invoices' && <InvoiceManagement user={user} invoices={invoices} onUpdate={fetchData} />}
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

function EmployeeDashboard({ user, attendance, invoices, onUpdate }: { user: User, attendance: AttendanceRecord[], invoices: Invoice[], onUpdate: () => void }) {
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeRecord = attendance.find(a => a.employee_id === user.id && a.clock_in_time && !a.clock_out_time && a.status === 'approved');
  const pendingRecord = attendance.find(a => a.employee_id === user.id && a.status === 'pending');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthlyHours = attendance
    .filter(a => {
      const d = new Date(a.date);
      return (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear && a.status === 'approved';
    })
    .reduce((sum, a) => sum + (a.hours_worked || 0), 0);

  const pendingInvoices = invoices.filter(i => i.status === 'pending').length;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClockIn = async () => {
    if (!location || !role || !image) {
      alert("Please provide location, role and before-work image.");
      return;
    }
    setLoading(true);
    try {
      await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: user.id,
          date: new Date().toISOString().split('T')[0],
          location,
          role,
          clock_in_time: new Date().toLocaleTimeString(),
          before_image: image,
          work_description: description
        })
      });
      setIsClockingIn(false);
      setImage(null);
      setLocation('');
      setRole('');
      setDescription('');
      alert("Clock-in submitted for approval!");
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!image || !activeRecord) {
      alert("Please provide after-work image.");
      return;
    }
    setLoading(true);
    try {
      const clockOutTime = new Date().toLocaleTimeString();
      // Simple hours calculation
      const start = new Date(`2000-01-01 ${activeRecord.clock_in_time}`);
      const end = new Date(`2000-01-01 ${clockOutTime}`);
      const hours = Math.abs(end.getTime() - start.getTime()) / 36e5;

      await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeRecord.id,
          clock_out_time: clockOutTime,
          after_image: image,
          hours_worked: Number(hours.toFixed(2))
        })
      });
      setIsClockingOut(false);
      setImage(null);
      alert("Clock-out submitted for approval!");
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#141414]/10 shadow-sm">
          <p className="text-[10px] font-bold text-[#141414]/30 uppercase tracking-widest mb-1">Monthly Hours</p>
          <div className="flex items-end gap-2">
            <h4 className="text-3xl font-black">{monthlyHours.toFixed(1)}h</h4>
            <p className="text-xs text-emerald-600 font-bold mb-1">Approved</p>
          </div>
          <div className="mt-4 h-1.5 bg-[#F5F5F4] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((monthlyHours / 200) * 100, 100)}%` }}
              className="h-full bg-[#141414]"
            />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#141414]/10 shadow-sm">
          <p className="text-[10px] font-bold text-[#141414]/30 uppercase tracking-widest mb-1">Current Status</p>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${activeRecord ? 'bg-emerald-500 animate-pulse' : pendingRecord ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <h4 className="text-lg font-bold">
              {activeRecord ? 'Clocked In' : pendingRecord ? 'Pending Approval' : 'Off Duty'}
            </h4>
          </div>
          <p className="text-xs text-[#141414]/50 mt-1">
            {activeRecord ? `Since ${activeRecord.clock_in_time}` : 'Ready for next shift'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#141414]/10 shadow-sm">
          <p className="text-[10px] font-bold text-[#141414]/30 uppercase tracking-widest mb-1">Pending Invoices</p>
          <h4 className="text-3xl font-black">{pendingInvoices}</h4>
          <p className="text-xs text-[#141414]/50 mt-1">Waiting for approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#141414]/10 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock size={24} /> Attendance Status
          </h3>
          
          {pendingRecord ? (
            <div className="space-y-6">
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <p className="text-amber-800 font-bold flex items-center gap-2">
                  <Clock size={18} className="animate-pulse" /> 
                  {pendingRecord.clock_out_time ? 'Clock Out Pending Approval' : 'Clock In Pending Approval'}
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  Submitted at {pendingRecord.clock_out_time || pendingRecord.clock_in_time}. Please wait for admin approval.
                </p>
              </div>
              <div className="p-4 bg-[#F5F5F4] rounded-2xl border border-[#141414]/5">
                <p className="text-[10px] font-bold text-[#141414]/30 uppercase mb-2">Details Submitted</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[#141414]/50">Location</p>
                    <p className="font-bold">{pendingRecord.location}</p>
                  </div>
                  <div>
                    <p className="text-[#141414]/50">Role</p>
                    <p className="font-bold">{pendingRecord.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeRecord ? (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <p className="text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle size={18} /> Currently Clocked In
                </p>
                <p className="text-sm text-emerald-600 mt-1">Started at {activeRecord.clock_in_time} today</p>
              </div>
              
              {!isClockingOut ? (
                <button 
                  onClick={() => setIsClockingOut(true)}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Clock Out
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">After Work Image</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#141414]/10 border-dashed rounded-2xl cursor-pointer hover:bg-[#F5F5F4] transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {image ? (
                            <img src={image} className="h-24 w-24 object-cover rounded-lg" />
                          ) : (
                            <>
                              <Camera className="w-8 h-8 mb-2 text-[#141414]/30" />
                              <p className="text-xs text-[#141414]/50">Click to upload photo</p>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsClockingOut(false)}
                      className="flex-1 py-3 border border-[#141414]/10 rounded-xl font-bold text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleClockOut}
                      disabled={loading}
                      className="flex-1 py-3 bg-[#141414] text-white rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Confirm Clock Out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-[#F5F5F4] rounded-3xl border border-[#141414]/5">
                <p className="text-[#141414]/50 font-bold flex items-center gap-2">
                  <Clock3 size={18} /> Not Clocked In
                </p>
                <p className="text-sm text-[#141414]/40 mt-1">Ready to start your shift?</p>
              </div>

              {!isClockingIn ? (
                <button 
                  onClick={() => setIsClockingIn(true)}
                  className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold hover:bg-[#141414]/90 transition-all shadow-lg"
                >
                  Clock In
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#141414]/50 uppercase">Location</label>
                      <input 
                        className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                        placeholder="Site name"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#141414]/50 uppercase">Role</label>
                      <input 
                        className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                        placeholder="e.g. Electrical"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Work Description</label>
                    <textarea 
                      className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none h-20"
                      placeholder="What are you working on?"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#141414]/50 uppercase">Before Work Image</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#141414]/10 border-dashed rounded-2xl cursor-pointer hover:bg-[#F5F5F4] transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {image ? (
                            <img src={image} className="h-24 w-24 object-cover rounded-lg" />
                          ) : (
                            <>
                              <Camera className="w-8 h-8 mb-2 text-[#141414]/30" />
                              <p className="text-xs text-[#141414]/50">Click to upload photo</p>
                            </>
                          )}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsClockingIn(false)}
                      className="flex-1 py-3 border border-[#141414]/10 rounded-xl font-bold text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleClockIn}
                      disabled={loading}
                      className="flex-1 py-3 bg-[#141414] text-white rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Confirm Clock In'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-[#141414]/10 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <History size={24} /> Recent Attendance Logs
          </h3>
          <div className="space-y-4">
            {attendance.slice(0, 5).map((record, idx) => (
              <div key={idx} className="p-4 rounded-3xl bg-[#F5F5F4]/50 border border-[#141414]/5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{record.date}</p>
                    <p className="text-xs text-[#141414]/50">{record.location} • {record.role}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                    record.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {record.status}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  {record.before_image && <img src={record.before_image} className="w-12 h-12 object-cover rounded-lg border border-white shadow-sm" />}
                  {record.after_image && <img src={record.after_image} className="w-12 h-12 object-cover rounded-lg border border-white shadow-sm" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceManagement({ user, invoices, onUpdate }: { user: User, invoices: Invoice[], onUpdate: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    customer_name: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newInvoice, employee_id: user.id })
      });
      setIsModalOpen(false);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await fetch(`/api/invoices/${id}/approve`, { method: 'PUT' });
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const downloadInvoice = async () => {
    const element = document.getElementById('invoice-print-content');
    if (!element) {
      alert("Invoice content not found. Please try again.");
      return;
    }
    
    setIsDownloading(true);
    try {
      // Ensure images are loaded
      const images = element.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${selectedInvoice?.customer_name || 'Export'}_${selectedInvoice?.date || 'Date'}.pdf`);
    } catch (error) {
      console.error("Invoice generation failed", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-lg">Invoices</h3>
          <button 
            onClick={onUpdate}
            className="p-2 text-[#141414]/40 hover:text-[#141414] transition-colors"
            title="Refresh Invoices"
          >
            <History size={18} />
          </button>
        </div>
        {user.role === 'employee' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#141414] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#141414]/90 transition-all"
          >
            <Plus size={18} /> Create Invoice
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#141414]/10 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F5F5F4] border-b border-[#141414]/10">
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Date</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Customer</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Amount</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Status</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]/5">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-[#F5F5F4]/30 transition-colors">
                <td className="p-4 text-sm">{inv.date}</td>
                <td className="p-4 text-sm font-medium">{inv.customer_name}</td>
                <td className="p-4 text-sm font-bold">SGD {inv.amount.toLocaleString()}</td>
                <td className="p-4">
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                    inv.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {user.role === 'admin' && inv.status === 'pending' && (
                    <button 
                      onClick={() => handleApprove(inv.id)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Approve"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {inv.status === 'approved' && (
                    <button 
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Preview & Download"
                    >
                      <Download size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Invoice Modal */}
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
                <h3 className="text-xl font-bold">Create New Invoice</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F5F5F4] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141414]/50 uppercase">Customer Name</label>
                  <input 
                    required
                    className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                    value={newInvoice.customer_name}
                    onChange={e => setNewInvoice({...newInvoice, customer_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141414]/50 uppercase">Amount (SGD)</label>
                  <input 
                    type="number"
                    required
                    className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none"
                    value={newInvoice.amount}
                    onChange={e => setNewInvoice({...newInvoice, amount: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#141414]/50 uppercase">Description</label>
                  <textarea 
                    required
                    className="w-full p-3 bg-[#F5F5F4] rounded-xl focus:outline-none h-24"
                    value={newInvoice.description}
                    onChange={e => setNewInvoice({...newInvoice, description: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold hover:bg-[#141414]/90 transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Invoice'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Preview Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-8"
            >
              <div className="p-8 bg-[#F5F5F4] rounded-2xl border border-[#141414]/5">
                <div className="flex justify-between items-start border-b border-[#141414]/10 pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight">STM Engineering</h2>
                    <p className="text-xs text-[#141414]/50">Invoice Preview</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{selectedInvoice.customer_name}</p>
                    <p className="text-xs text-[#141414]/50">{selectedInvoice.date}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Amount</span>
                  <span className="text-xl font-black">SGD {selectedInvoice.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#141414]/5">
                <button 
                  onClick={downloadInvoice}
                  disabled={isDownloading}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  <Download size={18} /> {isDownloading ? 'Generating...' : 'Download PDF'}
                </button>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="bg-[#141414] text-white px-6 py-2 rounded-xl font-bold text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Invoice for PDF Generation */}
      {selectedInvoice && (
        <div className="absolute opacity-0 pointer-events-none" style={{ top: '-10000px', left: '0' }}>
          <div id="invoice-print-content" style={{ width: '210mm', minHeight: '297mm', backgroundColor: '#ffffff', color: '#000000', padding: '20mm', fontFamily: 'Arial, sans-serif' }}>
            <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter">STM Engineering</h1>
                <p className="text-sm text-gray-600">123 Engineering Way, Singapore 123456</p>
                <p className="text-sm text-gray-600">Tel: +65 6789 0123 | Email: info@stm-engg.com.sg</p>
              </div>
              <div className="text-right">
                <h2 className="text-5xl font-black uppercase text-gray-200">INVOICE</h2>
                <p className="text-lg font-bold mt-2">#{selectedInvoice.id.toString().padStart(6, '0')}</p>
                <p className="text-sm text-gray-500">Date: {selectedInvoice.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Bill To:</p>
                <p className="text-xl font-bold">{selectedInvoice.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Service By:</p>
                <p className="text-lg font-bold">{selectedInvoice.employee_name}</p>
              </div>
            </div>

            <div className="border border-black rounded-3xl overflow-hidden mb-12">
              <div className="bg-gray-100 p-6 flex justify-between font-bold text-sm uppercase tracking-wider border-b border-black">
                <span>Description</span>
                <span>Amount (SGD)</span>
              </div>
              <div className="p-8 min-h-[300px]">
                <div className="flex justify-between text-lg">
                  <span className="whitespace-pre-wrap">{selectedInvoice.description}</span>
                  <span className="font-bold">{selectedInvoice.amount.toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-black text-white p-8 flex justify-between items-center">
                <span className="text-xl font-bold uppercase tracking-widest">Total Amount</span>
                <span className="text-4xl font-black">SGD {selectedInvoice.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-auto pt-12 border-t border-gray-100">
              <p className="text-sm font-bold mb-2">Payment Terms:</p>
              <p className="text-xs text-gray-500">Please make payment within 30 days. Bank transfer to STM Engineering, OCBC Bank A/C: 123-456789-001.</p>
              <div className="mt-12 flex justify-between items-end">
                <div className="w-48 h-12 border-b border-black"></div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
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
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
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
  const activeEmployees = employees.filter(e => e.is_active === 1);
  const activeEmployeeIds = new Set(activeEmployees.map(e => e.id));
  const activeAttendance = attendance.filter(a => activeEmployeeIds.has(a.employee_id));
  const activeToday = activeAttendance.filter(a => a.date === today).length;
  const pendingAttendance = activeAttendance.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value={activeEmployees.length} icon={<Users className="text-blue-500" />} />
        <StatCard title="Active Today" value={activeToday} icon={<Calendar className="text-emerald-500" />} />
        <StatCard title="Pending Approval" value={pendingAttendance} icon={<Clock className="text-amber-500" />} color={pendingAttendance > 0 ? 'bg-amber-50' : ''} />
        <StatCard title="Expiry Alerts" value={notifications.length} icon={<AlertTriangle className="text-red-500" />} color={notifications.length > 0 ? 'bg-red-50' : ''} />
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
            {activeAttendance.slice(0, 5).map((record, idx) => (
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
                  <p className={`text-sm font-bold ${record.status === 'pending' ? 'text-amber-600' : ''}`}>
                    {record.hours_worked ? `${record.hours_worked} hrs` : (record.status === 'pending' ? 'Pending' : 'In Progress')}
                  </p>
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
            {activeEmployees.slice(-5).reverse().map((emp, idx) => (
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

    // Ensure username and password are set if they are missing
    const generatedUsername = editingEmployee?.username || (editingEmployee?.name ? editingEmployee.name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000) : 'user' + Math.floor(Math.random() * 1000));
    const generatedPassword = editingEmployee?.password || 'stm' + Math.floor(Math.random() * 10000);

    const payload = { 
      ...editingEmployee, 
      is_active: editingEmployee?.is_active ?? 1,
      username: generatedUsername,
      password: generatedPassword
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save employee');
      }

      setIsModalOpen(false);
      setEditingEmployee(null);
      onUpdate();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving employee. Please try again.');
    }
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
              <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#141414]/50">Credentials</th>
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
                  <td className="p-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 w-fit">
                        <UserIcon size={10} /> {emp.username || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 w-fit">
                        <Lock size={10} /> {emp.password || 'N/A'}
                      </div>
                    </div>
                  </td>
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

                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-4">
                  <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <Lock size={16} /> Login Credentials
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-indigo-600 uppercase">Username</label>
                      <input 
                        className="w-full p-3 bg-white border border-indigo-100 rounded-xl focus:outline-none"
                        value={editingEmployee?.username || ''}
                        onChange={e => setEditingEmployee({...editingEmployee, username: e.target.value})}
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-indigo-600 uppercase">Password</label>
                      <input 
                        className="w-full p-3 bg-white border border-indigo-100 rounded-xl focus:outline-none"
                        value={editingEmployee?.password || ''}
                        onChange={e => setEditingEmployee({...editingEmployee, password: e.target.value})}
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                  </div>
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

  const handleApprove = async (id: number) => {
    try {
      await fetch(`/api/attendance/${id}/approve`, { method: 'PUT' });
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const activeEmployees = employees.filter(e => e.is_active === 1);
  const activeEmployeeIds = new Set(activeEmployees.map(e => e.id));
  const activeAttendance = attendance.filter(a => activeEmployeeIds.has(a.employee_id));

  const groupedAttendance = activeAttendance.reduce((acc, record) => {
    if (!acc[record.date]) acc[record.date] = [];
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-lg">Daily Attendance Logs</h3>
          <button 
            onClick={onUpdate}
            className="p-2 text-[#141414]/40 hover:text-[#141414] transition-colors"
            title="Refresh Logs"
          >
            <History size={18} />
          </button>
        </div>
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
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-[#141414]/50">Times</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-[#141414]/50">Hours</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-[#141414]/50">Location</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-[#141414]/50">Images</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-[#141414]/50 text-right">Status</th>
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
                        <td className="p-4 text-[10px]">
                          <div className="flex flex-col">
                            <span className="text-[#141414]/40 uppercase font-bold">In: {record.clock_in_time}</span>
                            <span className="text-[#141414]/40 uppercase font-bold">Out: {record.clock_out_time || '--:--'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-bold">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-[#141414]/30" />
                            {record.hours_worked ? `${record.hours_worked} hrs` : (record.clock_out_time ? 'Pending Calc' : 'In Progress')}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-[#141414]/60">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-[#141414]/30" />
                            {record.location}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {record.before_image && (
                              <div className="group relative">
                                <img src={record.before_image} className="w-8 h-8 object-cover rounded-lg border border-white shadow-sm cursor-pointer" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                  <img src={record.before_image} className="w-48 h-48 object-cover rounded-2xl shadow-2xl border-4 border-white" />
                                </div>
                              </div>
                            )}
                            {record.after_image && (
                              <div className="group relative">
                                <img src={record.after_image} className="w-8 h-8 object-cover rounded-lg border border-white shadow-sm cursor-pointer" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                  <img src={record.after_image} className="w-48 h-48 object-cover rounded-2xl shadow-2xl border-4 border-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                              record.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600 animate-pulse'
                            }`}>
                              {record.status}
                            </span>
                            {record.status === 'pending' && (
                              <button 
                                onClick={() => handleApprove(record.id)}
                                className="p-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-all shadow-sm"
                                title="Approve Attendance"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                          </div>
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
    const element = document.getElementById('payslip-print-content');
    if (!element) return;
    
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${selectedPayment?.employee_name}_${selectedPayment?.month}_${selectedPayment?.year}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const activeEmployees = employees.filter(e => e.is_active === 1);
  const activeEmployeeIds = new Set(activeEmployees.map(e => e.id));
  const activePayments = payments.filter(p => activeEmployeeIds.has(p.employee_id));

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
            {activePayments.map((pay) => (
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
              <div className="p-8 bg-[#F5F5F4] rounded-2xl border border-[#141414]/5">
                <div className="flex justify-between items-start border-b border-[#141414]/10 pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight">STM Engineering</h2>
                    <p className="text-xs text-[#141414]/50">Payslip Preview</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{selectedPayment.employee_name}</p>
                    <p className="text-xs text-[#141414]/50">{selectedPayment.month}/{selectedPayment.year}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Net Salary</span>
                  <span className="text-xl font-black">SGD {selectedPayment.amount.toLocaleString()}</span>
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

      {/* Hidden Payslip for PDF Generation */}
      {selectedPayment && (
        <div className="fixed -left-[9999px] top-0">
          <div id="payslip-print-content" style={{ width: '210mm', minHeight: '297mm', backgroundColor: '#ffffff', color: '#000000', padding: '20mm' }}>
            <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter">STM Engineering</h1>
                <p className="text-sm text-gray-600">123 Engineering Way, Singapore 123456</p>
                <p className="text-sm text-gray-600">Tel: +65 6789 0123 | Email: info@stm-engg.com.sg</p>
              </div>
              <div className="text-right">
                <h2 className="text-5xl font-black uppercase text-gray-200">PAYSLIP</h2>
                <p className="text-lg font-bold mt-2">#{selectedPayment.id.toString().padStart(6, '0')}</p>
                <p className="text-sm text-gray-500">Date: {selectedPayment.payment_date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Employee Details:</p>
                <p className="text-xl font-bold">{selectedPayment.employee_name}</p>
                <p className="text-sm text-gray-600">Period: {selectedPayment.month}/{selectedPayment.year}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Payment Mode:</p>
                <p className="text-lg font-bold">Bank Transfer</p>
              </div>
            </div>

            <div className="border border-black rounded-3xl overflow-hidden mb-12">
              <div className="bg-gray-100 p-6 flex justify-between font-bold text-sm uppercase tracking-wider border-b border-black">
                <span>Description</span>
                <span>Amount (SGD)</span>
              </div>
              <div className="p-8 min-h-[300px] space-y-6">
                <div className="flex justify-between text-lg">
                  <span>Basic Salary</span>
                  <span className="font-bold">{selectedPayment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Allowances</span>
                  <span className="font-bold">0.00</span>
                </div>
                <div className="flex justify-between text-lg text-red-600">
                  <span>Deductions</span>
                  <span className="font-bold">(0.00)</span>
                </div>
              </div>
              <div className="bg-black text-white p-8 flex justify-between items-center">
                <span className="text-xl font-bold uppercase tracking-widest">Net Salary Payable</span>
                <span className="text-4xl font-black">SGD {selectedPayment.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-auto pt-12 border-t border-gray-100">
              <p className="text-xs text-gray-400 italic">This is a computer-generated document and does not require a physical signature.</p>
              <div className="mt-12 flex justify-between items-end">
                <div className="text-center">
                  <div className="w-48 h-12 border-b border-black mb-2"></div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Employee Signature</p>
                </div>
                <div className="text-center">
                  <div className="w-48 h-12 border-b border-black mb-2"></div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
