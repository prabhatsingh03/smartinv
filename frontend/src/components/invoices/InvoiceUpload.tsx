import { useCallback, useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Button, Stack, Paper, Snackbar, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAppDispatch } from '@hooks/index';
import { uploadInvoiceFileThunk, setUploadProgress } from '@store/invoiceSlice';
import { useDropzone } from 'react-dropzone';

export default function InvoiceUpload() {
  const dispatch = useAppDispatch();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'uploading' | 'extracting' | 'completed' | 'error'>('idle');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);

  function onFileSelected(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    const file = fileList[0];
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be under 20MB');
      return;
    }
    setError(null);
    setSelectedFile(file);
  }

  async function onUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    setExtractionStatus('uploading');
    
    // Start slow progress animation
    let slowProgress = 0;
    const interval = setInterval(() => {
      // Move progress slowly and gradually with more realistic increments
      const increment = Math.random() * 1.5 + 0.3; // Random increment between 0.3-1.8%
      slowProgress += increment;
      
      // Slow down as we approach 95%
      if (slowProgress > 80) {
        slowProgress += increment * 0.3; // Much slower progress after 80%
      }
      
      if (slowProgress > 95) {
        slowProgress = 95; // Cap at 95% until actual completion
      }
      
      setProgress(slowProgress);
      dispatch(setUploadProgress(slowProgress));
    }, 200); // Update every 200ms for smooth animation
    
    setProgressInterval(interval);
    
    try {
      const action = await dispatch(
        uploadInvoiceFileThunk({
          file: selectedFile,
          onProgress: (p) => {
            // Don't update progress from actual upload - let slow progress handle it
            // The slow progress will continue until we get the actual response
          }
        })
      );
      
      // Clear the slow progress interval
      clearInterval(interval);
      setProgressInterval(null);
      
      if (uploadInvoiceFileThunk.rejected.match(action)) {
        setError(action.payload as string);
        setExtractionStatus('error');
        setProgress(0); // Reset progress on error
      } else if (uploadInvoiceFileThunk.fulfilled.match(action)) {
        // Only show 100% when details are actually fetched
        setProgress(100);
        dispatch(setUploadProgress(100));
        setExtractionStatus('completed');
        setShowSuccessMessage(true);
      }
    } catch (error) {
      clearInterval(interval);
      setProgressInterval(null);
      setError('Upload failed');
      setExtractionStatus('error');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  const onDropAccepted = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles?.length) return;
    const file = acceptedFiles[0];
    setSelectedFile(file);
    onUpload();
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    maxSize: 20 * 1024 * 1024,
    onDropAccepted,
    onDropRejected: () => setError('Only one PDF up to 20MB is allowed')
  });

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2} alignItems="center">
        <CloudUploadIcon color="primary" sx={{ fontSize: 48 }} />
        <Typography variant="h6">Upload Invoice (PDF)</Typography>
        <Box
          {...getRootProps()}
          sx={{
            width: '100%',
            border: '2px dashed',
            borderColor: isDragReject ? 'error.main' : isDragActive ? 'primary.main' : 'divider',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            color: 'text.secondary',
            borderRadius: 1,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease-in-out'
          }}
        >
          <input {...getInputProps()} />
          <Typography variant="body2" sx={{ mb: 1 }}>
            {isDragActive ? 'Drop the PDF here…' : 'Drag and drop a PDF here, or click to select'}
          </Typography>
          <Typography variant="caption" color="text.secondary">Max 20MB, PDF only</Typography>
        </Box>
        <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
          Choose PDF
          <input hidden type="file" accept="application/pdf" onChange={(e) => onFileSelected(e.target.files)} />
        </Button>
        {selectedFile && (
          <Typography variant="body2">Selected: {selectedFile.name}</Typography>
        )}
        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
        {uploading && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }} 
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              {extractionStatus === 'uploading' && `Processing invoice... ${Math.round(progress)}%`}
              {extractionStatus === 'completed' && 'Invoice processed successfully!'}
              {extractionStatus === 'error' && 'Processing failed'}
            </Typography>
          </Box>
        )}
        <Button disabled={!selectedFile || uploading} variant="contained" onClick={onUpload}>
          Upload & Extract
        </Button>
      </Stack>
      
      {/* Success Message Snackbar */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={4000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Invoice extracted successfully! You can now review and edit the details.
        </Alert>
      </Snackbar>
    </Paper>
  );
}


