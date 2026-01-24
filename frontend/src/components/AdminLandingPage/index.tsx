import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Footer from './Footer';
import LoginForm from './LoginForm';
import Dashboard from './Dashboard';
import AccessDenied from './AccessDenied';

export default function AdminLandingPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark flex flex-col">
      <Header />
      <main className="flex-1">
        {!isAuthenticated ? (
          <LoginForm />
        ) : isAdmin ? (
          <Dashboard />
        ) : (
          <AccessDenied />
        )}
      </main>
      <Footer />
    </div>
  );
}
