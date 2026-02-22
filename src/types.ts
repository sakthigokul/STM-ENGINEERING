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
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name?: string;
  date: string;
  hours_worked: number;
  location: string;
  role: string;
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
