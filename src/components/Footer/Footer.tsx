import { Typography, Box, Container } from '@mui/material'


export const Layout = () => {
    return (
            <Box
                component="footer"
                sx={{
                    py: 3,
                    px: 2,
                    mt: 'auto',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    color: 'text.secondary'
                }}
            >
                <Container maxWidth="lg">
                    <Typography variant="body2" color="text.secondary" align="left">
                        Spring 2026 - Team 06
                    </Typography>
                </Container>
            </Box>
    )
}

export default Layout