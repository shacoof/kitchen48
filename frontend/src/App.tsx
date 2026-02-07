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
import { RecipePage, RecipeStepPage, CreateRecipePage, MyRecipesPage } from './modules/recipes';
import { getSubdomain } from './utils/subdomain';

function App() {
  const subdomain = getSubdomain();

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
          {/* Recipe routes - must come before profile catch-all */}
          <Route path="/recipes" element={<MyRecipesPage />} />
          <Route path="/recipes/new" element={<CreateRecipePage />} />
          <Route path="/recipes/:id/edit" element={<CreateRecipePage />} />
          {/* Semantic URL routes - order matters: most specific first */}
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
