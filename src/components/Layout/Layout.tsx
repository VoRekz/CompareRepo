import { type FC, type ReactNode } from 'react';
import { Box, Container, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink, useNavigate, Outlet } from 'react-router-dom';
import { Footer } from '../Footer';
import { useAuth } from '../../context/AuthContext';
import { Roles } from '../../utils/roles';

interface LayoutProps {
  children?: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (logout) logout();
    navigate('/');
  };

  const canAddVehicleAndParts = user?.role === Roles.ACQUISITION_SPECIALIST || user?.role === Roles.OWNER;
  const canViewReports = user?.role === Roles.OPERATING_MANAGER || user?.role === Roles.OWNER;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static" color="default" sx={{ mb: 3 }} elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'left', fontWeight: 'bold' }}>
            Midtown Motors
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {user && (
              <Typography variant="body2" sx={{ mr: 2, fontWeight: 'bold' }}>
                Welcome, {user.first_name || user.username} ({user.role})
              </Typography>
            )}
            
            <Button color="inherit" component={RouterLink} to="/">
              Search Vehicles
            </Button>
            
            {canAddVehicleAndParts && (
              <>
                <Button color="inherit" component={RouterLink} to="/add-vehicle">Add Vehicle</Button>
                <Button color="inherit" component={RouterLink} to="/add-parts-order">Add Parts</Button>
              </>
            )}
            
            {canViewReports && (
              <Button color="inherit" component={RouterLink} to="/view-reports">Reports</Button>
            )}
            
            {user && (
              <Button color="inherit" component={RouterLink} to="/admin-tools">Admin Tools</Button>
            )}
            
            {user ? (
              <Button color="inherit" variant="outlined" onClick={handleLogout} sx={{ ml: 1 }}>
                Logout
              </Button>
            ) : (
              <Button color="inherit" variant="outlined" component={RouterLink} to="/login" sx={{ ml: 1 }}>
                Employee Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      {/* Main Content */}
      <Container component="main" sx={{ py: 4, flexGrow: 1, overflow: 'auto' }}>
        {children || <Outlet />}
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;
