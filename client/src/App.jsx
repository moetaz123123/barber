import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './components/layout/PublicLayout';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import TrackPage from './pages/TrackPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import ServicesAdminPage from './pages/admin/ServicesAdminPage';
import HoursAdminPage from './pages/admin/HoursAdminPage';
import ClientsPage from './pages/admin/ClientsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="reservation" element={<BookingPage />} />
            <Route path="suivi" element={<TrackPage />} />
          </Route>

          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="rendez-vous" element={<AppointmentsPage />} />
            <Route path="services" element={<ServicesAdminPage />} />
            <Route path="horaires" element={<HoursAdminPage />} />
            <Route path="clients" element={<ClientsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
