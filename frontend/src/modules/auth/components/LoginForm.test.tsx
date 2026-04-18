/**
 * LoginForm — Component Unit Test
 *
 * Tests the login form UI behavior in isolation.
 * Run: npm run test -w frontend -- src/modules/auth
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock useAuth — must match the import path used by LoginForm (../hooks/useAuth)
const mockLogin = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
    user: null,
    isAdmin: false,
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

// Import after mocks
const { default: LoginForm } = await import('./LoginForm');

function renderLoginForm() {
  const user = userEvent.setup();
  render(
    <BrowserRouter>
      <LoginForm />
    </BrowserRouter>
  );
  return { user };
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email and password fields', () => {
    renderLoginForm();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should render a submit button', () => {
    renderLoginForm();

    // Button text comes from t('login.sign_in_button') — mock returns the key
    const button = screen.getByRole('button', { name: /sign.?in|login/i });
    expect(button).toBeInTheDocument();
  });

  it('should call login with email and password on submit', async () => {
    mockLogin.mockResolvedValue({ success: true });
    const { user } = renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign.?in|login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should show error message on failed login', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Invalid email or password' });
    const { user } = renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign.?in|login/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/)).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const { user } = renderLoginForm();

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // The visibility toggle is a button with a material-symbols-outlined span
    const toggleButton = passwordInput.parentElement!.querySelector('button')!;
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should disable submit button while submitting', async () => {
    // Make login hang so we can check the disabled state
    mockLogin.mockImplementation(() => new Promise(() => {}));
    const { user } = renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /sign.?in|login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
