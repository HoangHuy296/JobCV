import AppRouter from './routes/AppRouter';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserProvider } from './contexts/UserContext';
import { LocationProvider } from './contexts/LocationContext';
import { IndustryProvider } from './contexts/IndustryContext';
import { TableActionProvider } from './contexts/TableActionContext';
import TableActionDropdown from './components/core/TableActionDropdown';
import { ErrorBoundary } from './components';
import 'react-quill-new/dist/quill.snow.css';

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <LocationProvider>
          <IndustryProvider>
            <TableActionProvider>
              <AppRouter />
              <TableActionDropdown />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                newestOnTop
                closeOnClick
                pauseOnHover={false}
              />
            </TableActionProvider>
          </IndustryProvider>
        </LocationProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
