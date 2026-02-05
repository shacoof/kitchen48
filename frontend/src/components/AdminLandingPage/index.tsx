import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header, { type AdminPage } from './Header';
import Footer from './Footer';
import LoginForm from './LoginForm';
import Dashboard from './Dashboard';
import AccessDenied from './AccessDenied';
import ParametersPage from './ParametersPage';
import UsersPage from './UsersPage';
import IngredientsPage from './IngredientsPage';
import StatisticsPage from './StatisticsPage';
import { ListTypeManagement } from '../../modules/list-types/components/ListTypeManagement';

export default function AdminLandingPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard');

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const renderContent = () => {
    if (!isAuthenticated) {
      return <LoginForm />;
    }
    if (!isAdmin) {
      return <AccessDenied />;
    }

    switch (currentPage) {
      case 'parameters':
        return <ParametersPage />;
      case 'users':
        return <UsersPage />;
      case 'ingredients':
        return <IngredientsPage />;
      case 'statistics':
        return <StatisticsPage />;
      case 'list-values':
        return <ListTypeManagement />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex flex-col">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}
