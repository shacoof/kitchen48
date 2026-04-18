/**
 * Custom render that wraps components with the app's providers.
 *
 * Usage:
 *   import { renderWithProviders } from '../../../testing/helpers/render';
 *   renderWithProviders(<MyComponent />, { authenticated: true, isAdmin: true });
 */
import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

interface AuthContextValue {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    nickname: string;
    profilePicture: string | null;
    emailVerified: boolean;
    userType: 'regular' | 'admin';
    videoLanguage: string;
    interfaceLanguage: string;
    measurementSystem: string;
    hasAlarmSound: boolean;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: () => Promise<{ success: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const defaultUser: AuthContextValue['user'] = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  nickname: 'tuser',
  profilePicture: null,
  emailVerified: true,
  userType: 'regular',
  videoLanguage: 'en',
  interfaceLanguage: 'en',
  measurementSystem: 'metric',
  hasAlarmSound: true,
};

const adminUser: AuthContextValue['user'] = {
  ...defaultUser,
  id: 'admin-user-id',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  nickname: 'admin',
  userType: 'admin',
};

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => ({ success: false }),
  logout: () => {},
  refreshUser: async () => {},
});

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  authenticated?: boolean;
  isAdmin?: boolean;
  user?: Partial<AuthContextValue['user']>;
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions = {}
) {
  const {
    authenticated = false,
    isAdmin = false,
    user: userOverrides,
    route = '/',
    ...renderOptions
  } = options;

  // Set initial route
  window.history.pushState({}, 'Test page', route);

  const baseUser = isAdmin ? adminUser : defaultUser;
  const user = authenticated
    ? { ...baseUser, ...userOverrides } as AuthContextValue['user']
    : null;

  const authValue: AuthContextValue = {
    user,
    isLoading: false,
    isAuthenticated: authenticated,
    isAdmin: authenticated && (user?.userType === 'admin'),
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn(),
    refreshUser: vi.fn().mockResolvedValue(undefined),
  };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={authValue}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthContext.Provider>
    );
  }

  return {
    user: userEvent.setup(),
    authValue,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

export { AuthContext };
