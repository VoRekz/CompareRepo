import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'Owner';
  const isAcquisitionSpecialist = user?.role === 'Acquisition Specialist';
  const isOperatingManager = user?.role === 'Operating Manager';
  const isLoggedOut = !user;
  const navigate = useNavigate();
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: 'white',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            Midtown Motors
          </Typography>
          {/* Action Buttons Area */}

          <Box sx={{ display: 'flex', gap: 2 }}>
            {(isOwner || isAcquisitionSpecialist) && (
              <Button variant="contained" onClick={() => navigate('/add-vehicle')}>
                Add Vehicle
              </Button>
            )}

            {(isOwner || isOperatingManager) && (
              <Button variant="contained" onClick={() => navigate('/view-reports')}>
                Reports
              </Button>
            )}
            {isLoggedOut ? (
              <Button variant="contained">Login</Button>
            ) : (
              <Button variant="contained">Logout</Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
