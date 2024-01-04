import { useKeycloak } from '@bcgov/citz-imb-kc-react';
import { Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import React from 'react';
import '@/App.css';
import { Login } from '@/pages/Login';
import { ThemeProvider } from '@emotion/react';
import appTheme from './themes/appTheme';

const Router = () => {
  const { isAuthenticated } = useKeycloak();

  return isAuthenticated ? (
    <Routes>
      <Route index element={<Home />} />
    </Routes>
  ) : (
    <Login />
  );
};

const App = () => {
  return (
    <ThemeProvider theme={appTheme}>
      <Router />
    </ThemeProvider>
  );
};

export default App;
