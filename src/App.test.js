import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import App from './App';
import { AuthProvider } from './contexts/AuthContext';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    defaults: { headers: { common: {} } }
  })),
  get: jest.fn(),
  post: jest.fn(),
  defaults: { headers: { common: {} }, baseURL: '' }
}));

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

const MockedApp = () => (
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

describe('Medical Study Hub App', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  test('renders without crashing', () => {
    render(<MockedApp />);
  });

  test('shows navigation bar', () => {
    render(<MockedApp />);
    expect(screen.getByText(/Medical Study Hub/i)).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    window.localStorage.getItem.mockReturnValue(null);
    render(<MockedApp />);
    
    // Should show login or register links in navbar
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
  });

  test('shows user navigation when authenticated', async () => {
    // Mock localStorage to return a token
    window.localStorage.getItem.mockReturnValue('mock-token');
    
    // Mock axios response for profile
    const axios = require('axios');
    axios.get.mockResolvedValue({
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      }
    });

    render(<MockedApp />);

    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });
});

describe('AuthContext', () => {
  test('login function works correctly', async () => {
    const axios = require('axios');
    axios.post.mockResolvedValue({
      data: {
        token: 'mock-token',
        user: { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' }
      }
    });

    const TestComponent = () => {
      const { login } = require('./contexts/AuthContext').useAuth();
      
      const handleLogin = async () => {
        const result = await login('testuser', 'password');
        if (result.success) {
          return <div>Login successful</div>;
        }
        return <div>Login failed</div>;
      };

      return (
        <div>
          <button onClick={handleLogin}>Login</button>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password'
      });
    });
  });
});