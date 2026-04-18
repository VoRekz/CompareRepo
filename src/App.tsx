import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VehicleDetailPage from './pages/VehicleDetailPage';
import { Layout } from './components';
import SearchVehiclePage from './pages/SearchVehiclePage';
import AddVehiclePage from './pages/AddVehiclePage';
import SellVehiclePage from './pages/SellVehiclePage';
import AddPartsOrderPage from './pages/AddPartsOrder';
import ReportsPage from './pages/Reports';
import RequireRole from './components/guards/RequireRole';
import { Roles } from './utils/roles';
import LoginPage from './pages/LoginPage';
import AdminToolsPage from './pages/AdminToolsPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SearchVehiclePage />} />
          {/* Dynamically navigating to vehicle details based on vin; to view existing mock, navigate to http://localhost:5173/vehicles/ABCDEFG2134567890 */}
          <Route path="login" element={<LoginPage />} />
          <Route path="vehicles/:vin" element={<VehicleDetailPage />} />
          <Route element={<RequireRole allowed={[Roles.ACQUISITION_SPECIALIST, Roles.OWNER]} />}>
            <Route path="add-vehicle" element={<AddVehiclePage />} />
            <Route path="add-parts-order" element={<AddPartsOrderPage />} />
          </Route>
          <Route element={<RequireRole allowed={[Roles.ACQUISITION_SPECIALIST, Roles.SALES_AGENT, Roles.OPERATING_MANAGER, Roles.OWNER]} />}>
            <Route path="sell-vehicle/:vin" element={<SellVehiclePage />} />
          </Route>
          <Route element={<RequireRole allowed={[Roles.OPERATING_MANAGER, Roles.OWNER]} />}>
            <Route path="view-reports" element={<ReportsPage />} />
          </Route>
          <Route element={<RequireRole allowed={[Roles.ACQUISITION_SPECIALIST, Roles.SALES_AGENT, Roles.OPERATING_MANAGER, Roles.OWNER]} />}>
            <Route path="admin-tools" element={<AdminToolsPage />} />
          </Route>
          <Route path="*" element={<SearchVehiclePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
