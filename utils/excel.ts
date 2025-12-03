import * as XLSX from 'xlsx';
import { Employee, Adjustment } from '../types';

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const importEmployeesFromExcel = (file: File): Promise<Employee[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];
        
        // Map excel columns to our interface (assuming flexible headers or specific ones)
        const employees: Employee[] = jsonData.map((row: any) => ({
          id: row['id'] || row['الرقم_التسلسلي'] || row['Serial'] || String(Math.random()),
          name: row['name'] || row['الاسم'] || row['Name'] || 'Unknown',
          salary: Number(row['salary'] || row['الراتب'] || row['Salary'] || 0),
          branch: row['branch'] || row['الفرع'] || row['Branch'] || 'Main',
          annualLeaveBalance: Number(row['annualLeaveBalance'] || row['رصيد_الاجازات'] || row['LeaveBalance'] || 30),
        }));
        
        resolve(employees);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};