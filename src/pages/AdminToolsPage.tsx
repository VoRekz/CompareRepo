import React, { useState } from 'react';
import { Box, Typography, Paper, Alert, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const AdminToolsPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>('customers');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    setIsUploading(true);
    setMessage(null);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/admin/bulk-upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setFile(null); 
        // Reset file input element manually
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'A network error occurred during upload.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Admin Tools: Bulk Upload</Typography>
      
      <Paper sx={{ p: 4 }} elevation={2}>
        {message && <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>}

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Data Type</InputLabel>
          <Select value={fileType} label="Data Type" onChange={(e) => setFileType(e.target.value)}>
            <MenuItem value="staff">Staff / Users</MenuItem>
            <MenuItem value="vendors">Vendors</MenuItem>
            <MenuItem value="customers">Customers (Individual & Business)</MenuItem>
            <MenuItem value="vehicles">Vehicles & Transactions</MenuItem>
            <MenuItem value="parts">Parts & Orders</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mb: 3 }}>
          <input id="file-upload" type="file" accept=".csv, .tsv" onChange={handleFileChange} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>* Accepted formats: .tsv, .csv</Typography>
        </Box>

        <Button variant="contained" color="primary" fullWidth size="large" onClick={handleUpload} disabled={isUploading || !file}>
          {isUploading ? 'Uploading & Processing...' : 'Upload Data'}
        </Button>
      </Paper>
    </Box>
  );
};

export default AdminToolsPage;