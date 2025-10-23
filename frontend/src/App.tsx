import { Suspense } from 'react';
import { SnackbarProvider } from 'notistack';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <SnackbarProvider maxSnack={3} autoHideDuration={4000} preventDuplicate>
      <Suspense fallback={null}>
        <AppRoutes />
      </Suspense>
    </SnackbarProvider>
  );
}

export default App;


