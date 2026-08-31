import { createBrowserRouter } from 'react-router-dom';
import { DevConsoleLayout } from './layouts/DevConsoleLayout';
import { ConsoleHome } from './pages/ConsoleHome';
import { EndpointManagement } from './pages/EndpointManagement';
import { RequestLogs } from './pages/RequestLogs';
import { KeyManagement } from './pages/KeyManagement';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export const routes = createBrowserRouter([
  {
    path: '/',
    element: <DevConsoleLayout />,
    children: [
      { path: '', element: <ConsoleHome /> },
      { path: 'endpoints', element: <EndpointManagement /> },
      { path: 'logs', element: <RequestLogs /> },
      { path: 'keys', element: <KeyManagement /> },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
]);
