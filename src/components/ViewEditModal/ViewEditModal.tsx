import { Modal, Box, Typography } from '@mui/material';
import { type ReactNode } from 'react';

interface ViewEditModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: ReactNode;
  actions?: ReactNode;
}

export const ViewEditModal = ({ open, onClose, title, content, actions }: ViewEditModalProps) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ p: 4, backgroundColor: 'white', margin: 'auto', mt: 10, width: 400 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box>{content}</Box>
        {actions && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }} mt={2}>
            {actions}
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default ViewEditModal;
