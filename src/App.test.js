import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import App from './App';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = mockLocalStorage;

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  useNavigate: () => jest.fn(),
}));

describe('Med Study App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  test('renders login page when not authenticated', () => {
    render(<App />);
    expect(screen.getByText('Login to Med Study Hub')).toBeInTheDocument();
  });

  test('login form submission works', async () => {
    const mockResponse = {
      data: {
        access_token: 'fake-token',
        token_type: 'bearer'
      }
    };
    
    mockedAxios.post.mockResolvedValueOnce(mockResponse);
    
    const mockUserResponse = {
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_admin: false
      }
    };
    
    mockedAxios.get.mockResolvedValueOnce(mockUserResponse);

    render(<App />);
    
    // Fill in login form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/login',
        {
          username: 'testuser',
          password: 'password123'
        }
      );
    });
  });

  test('registration form validation works', () => {
    render(<App />);
    
    // Navigate to register page
    fireEvent.click(screen.getByText('Register here'));
    
    // Fill form with mismatched passwords
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'newuser' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'new@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  test('tutor questions generation works', async () => {
    // Mock authenticated user
    mockLocalStorage.getItem.mockReturnValue('fake-token');
    
    const mockUserResponse = {
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_admin: false
      }
    };
    
    const mockQuestionsResponse = {
      data: {
        learning_objectives: ['Understand cardiovascular physiology'],
        tutor_questions: [
          {
            type: 'open',
            question: 'What is the function of the heart?',
            answer: 'To pump blood throughout the body',
            difficulty: 'easy',
            tags: ['cardiology', 'physiology'],
            reference: 'Slide 1'
          },
          {
            type: 'mcq',
            question: 'Which chamber pumps blood to the lungs?',
            options: ['Left atrium', 'Left ventricle', 'Right atrium', 'Right ventricle'],
            answer: 'Right ventricle',
            explanation: 'The right ventricle pumps deoxygenated blood to the lungs',
            difficulty: 'moderate',
            tags: ['cardiology', 'anatomy'],
            reference: 'Slide 2'
          }
        ]
      }
    };
    
    mockedAxios.get.mockResolvedValueOnce(mockUserResponse);
    mockedAxios.post.mockResolvedValueOnce(mockQuestionsResponse);

    render(<App />);
    
    // Wait for authentication
    await waitFor(() => {
      expect(screen.getByText('Welcome to Med Study Hub')).toBeInTheDocument();
    });
    
    // Navigate to tutor questions
    fireEvent.click(screen.getByText('Start Learning'));
    
    // Fill in content
    const textarea = screen.getByPlaceholderText('Paste your lecture content here...');
    fireEvent.change(textarea, {
      target: { value: 'Heart anatomy and physiology...' }
    });
    
    // Generate questions
    fireEvent.click(screen.getByRole('button', { name: /generate questions/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Learning Objectives:')).toBeInTheDocument();
      expect(screen.getByText('Generated Questions:')).toBeInTheDocument();
      expect(screen.getByText('What is the function of the heart?')).toBeInTheDocument();
      expect(screen.getByText('Which chamber pumps blood to the lungs?')).toBeInTheDocument();
    });
  });

  test('feedback submission works', async () => {
    // Mock authenticated user
    mockLocalStorage.getItem.mockReturnValue('fake-token');
    
    const mockUserResponse = {
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_admin: false
      }
    };
    
    const mockFeedbackResponse = {
      data: {
        id: 1,
        message: 'Feedback submitted successfully'
      }
    };
    
    const mockFeedbackListResponse = {
      data: []
    };
    
    mockedAxios.get
      .mockResolvedValueOnce(mockUserResponse)
      .mockResolvedValueOnce(mockFeedbackListResponse)
      .mockResolvedValueOnce(mockFeedbackListResponse);
    
    mockedAxios.post.mockResolvedValueOnce(mockFeedbackResponse);

    render(<App />);
    
    // Wait for authentication and navigate to feedback
    await waitFor(() => {
      expect(screen.getByText('Welcome to Med Study Hub')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Manage Feedback'));
    
    await waitFor(() => {
      expect(screen.getByText('Submit New Feedback')).toBeInTheDocument();
    });
    
    // Fill feedback form
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Test Subject' }
    });
    fireEvent.change(screen.getByLabelText(/content/i), {
      target: { value: 'Test feedback content' }
    });
    
    // Submit feedback
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/feedback',
        expect.objectContaining({
          subject: 'Test Subject',
          content: 'Test feedback content'
        }),
        expect.any(Object)
      );
    });
  });

  test('admin panel is only visible to admin users', async () => {
    // Mock admin user
    mockLocalStorage.getItem.mockReturnValue('fake-token');
    
    const mockAdminUserResponse = {
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        is_admin: true
      }
    };
    
    mockedAxios.get.mockResolvedValueOnce(mockAdminUserResponse);

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });
  });

  test('non-admin users cannot see admin panel', async () => {
    // Mock regular user
    mockLocalStorage.getItem.mockReturnValue('fake-token');
    
    const mockUserResponse = {
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_admin: false
      }
    };
    
    mockedAxios.get.mockResolvedValueOnce(mockUserResponse);

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to Med Study Hub')).toBeInTheDocument();
      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    });
  });

  test('logout functionality works', async () => {
    // Mock authenticated user
    mockLocalStorage.getItem.mockReturnValue('fake-token');
    
    const mockUserResponse = {
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_admin: false
      }
    };
    
    mockedAxios.get.mockResolvedValueOnce(mockUserResponse);

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
    });
    
    // Click logout
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    expect(screen.getByText('Login to Med Study Hub')).toBeInTheDocument();
  });
});