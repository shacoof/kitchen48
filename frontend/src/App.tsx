import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import { RegisterPage } from './modules/auth/pages/RegisterPage';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { VerifyEmailPage } from './modules/auth/pages/VerifyEmailPage';
import { AuthCallbackPage } from './modules/auth/pages/AuthCallbackPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
