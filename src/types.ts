export interface Employee {
  id: number;
  name: string;
  passport_number: string;
  address: string;
  insurance_details: string;
  insurance_expiry: string;
  visa_details: string;
  visa_expiry: string;
  base_salary: number;
  is_active: number;
  username?: string;
  password?: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name?: string;
  date: string;
  hours_worked: number;
  location: string;
  role: string;
  clock_in_time?: string;
  clock_out_time?: string;
  before_image?: string;
  after_image?: string;
  status: 'pending' | 'approved';
  work_description?: string;
}

export interface SalaryPayment {
  id: number;
  employee_id: number;
  employee_name?: string;
  amount: number;
  payment_date: string;
  month: number;
  year: number;
}

export interface ExpiryNotification {
  id: number;
  name: string;
  expiry_date: string;
  type: 'Visa' | 'Insurance';
}

export interface Invoice {
  id: number;
  employee_id: number;
  employee_name?: string;
  customer_name: string;
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'approved';
}

export interface User {
  id?: number;
  name?: string;
  username: string;
  role: 'admin' | 'employee';
}
