import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import AdminLandingPage from './components/AdminLandingPage';
import { RegisterPage } from './modules/auth/pages/RegisterPage';
import { LoginPage } from './modules/auth/pages/LoginPage';
import { VerifyEmailPage } from './modules/auth/pages/VerifyEmailPage';
import { AuthCallbackPage } from './modules/auth/pages/AuthCallbackPage';
import { UserProfilePage } from './modules/users/pages/UserProfilePage';
import { EditProfilePage } from './modules/users/pages/EditProfilePage';
import { RecipePage, RecipeStepPage, RecipePlayPage, CreateRecipePage, RecipeCreateChoicePage, SmartUploadPage, MyRecipesPage, ExplorePage, FavoritesPage } from './modules/recipes';
import { getSubdomain } from './utils/subdomain';
import { WakeUpScreen } from './components/WakeUpScreen';

function App() {
  const subdomain = getSubdomain();
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          setBackendReady(true);
          return;
        }
      }
      setBackendReady(false);
    } catch {
      setBackendReady(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Show wake-up screen while backend is cold starting
  if (backendReady === false) {
    return <WakeUpScreen onReady={() => setBackendReady(true)} />;
  }

  // Initial check in progress — render nothing briefly
  if (backendReady === null) {
    return null;
  }

  // Admin portal - separate routing
  if (subdomain === 'admin') {
    return (
      <BrowserRouter>
        <AuthProvider>
          <AdminLandingPage />
        </AuthProvider>
      </BrowserRouter>
    );
  }

  // Public site - full routing
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          {/* Recipe routes - must come before profile catch-all */}
          <Route path="/recipes" element={<MyRecipesPage />} />
          <Route path="/recipes/new" element={<RecipeCreateChoicePage />} />
          <Route path="/recipes/new/manual" element={<CreateRecipePage />} />
          <Route path="/recipes/new/from-photos" element={<SmartUploadPage />} />
          <Route path="/recipes/:id/edit" element={<CreateRecipePage />} />
          {/* Semantic URL routes - order matters: most specific first */}
          <Route path="/:nickname/:recipeSlug/play" element={<RecipePlayPage />} />
          <Route path="/:nickname/:recipeSlug/:stepSlug" element={<RecipeStepPage />} />
          <Route path="/:nickname/:recipeSlug" element={<RecipePage />} />
          {/* User profile by nickname - must be last (catch-all) */}
          <Route path="/:nickname" element={<UserProfilePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
