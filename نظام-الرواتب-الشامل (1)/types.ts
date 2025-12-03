
export interface Employee {
  id: string;
  name: string;
  salary: number;
  branch: string;
  annualLeaveBalance: number; // Default 30 or 21
}

export enum AdjustmentType {
  BONUS = 'M_BONUS',
  DEDUCTION = 'M_DEDUCTION',
  ABSENCE = 'M_ABSENCE',
  LOAN = 'M_LOAN',
}

export interface Adjustment {
  id: string;
  employeeId: string;
  type: AdjustmentType;
  amount: number;
  date: string;
  note?: string;
  linkedDebtId?: string; // Reference to a deferred debt
}

export interface DeferredDebt {
  id: string;
  employeeId: string;
  totalAmount: number;
  remainingAmount: number;
  startDate: string;
  description: string;
  isPaid: boolean;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  type: 'annual' | 'sick' | 'absence' | 'unpaid';
  startDate: string;
  endDate: string;
  days: number;
  note?: string;
}

export interface PayrollRecord {
  employee: Employee;
  basicSalary: number;
  totalAdditions: number;
  totalDeductions: number;
  netSalary: number;
  details: Adjustment[];
}

export type Language = 'ar' | 'en';

export interface UserPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canPrint: boolean;
  canViewPayroll: boolean;
}

export interface User {
  username: string;
  password: string; // In a real app, hash this.
  fullName?: string;
  role: 'admin' | 'user';
  permissions: UserPermissions;
}

export interface AppSettings {
  language: Language;
  currency: string;
  companyName: string;
  companyLogo?: string; // Base64 string
}
