import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FrontofficeLayout from './components/FrontofficeLayout';
import BackofficeLayout from './components/BackofficeLayout';
import CodeGate from './auth/CodeGate';

import EmployeeList from './pages/frontoffice/EmployeeList';
import SalaryCreate from './pages/frontoffice/SalaryCreate';
import SalaryPerDayBatchCreate from './pages/frontoffice/SalaryPerDayBatchCreate';
import SalaryBatchCreate from './pages/frontoffice/SalaryBatchCreate';
import EmployeeDetailList from './pages/frontoffice/EmployeeDetailList';
import EmployeeDetail from './pages/frontoffice/EmployeeDetail';

import Dashboard from './pages/backoffice/Dashboard';
import Holidays from './pages/backoffice/Holidays';
import ImportData from './pages/backoffice/ImportData';
import ResetData from './pages/backoffice/ResetData';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Frontoffice Layout */}
        <Route element={<FrontofficeLayout />}>
          <Route index element={<Navigate to="/salaries" replace />} />
          <Route path="salaries" element={<EmployeeList />} />
          <Route path="salaires/nouveau" element={<SalaryCreate />} />
          <Route path="salaires/lot" element={<SalaryBatchCreate />} />
          <Route path="salaires/lot/day" element={<SalaryPerDayBatchCreate />} />
          <Route path="salaries/details" element={<EmployeeDetailList />} />
          <Route path="salaries/details/:id" element={<EmployeeDetail />} />
        </Route>

        {/* Backoffice Layout (protected by CodeGate) */}
        <Route path="admin" element={<CodeGate />}>
          <Route element={<BackofficeLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="holidays" element={<Holidays />} />
            <Route path="import" element={<ImportData />} />
            <Route path="reset" element={<ResetData />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
