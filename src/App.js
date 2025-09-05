import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Axios interceptor for authentication
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username,
        password
      });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      await fetchUserProfile();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        username,
        email,
        password
      });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      await fetchUserProfile();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Login Component
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login to Med Study Hub</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

// Register Component
const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const result = await register(username, email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Register for Med Study Hub</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/dashboard">Med Study Hub</Link>
      </div>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/tutor">Tutor Questions</Link>
        <Link to="/feedback">Feedback</Link>
        <Link to="/progress">Progress</Link>
        {user?.is_admin && <Link to="/admin">Admin</Link>}
        <div className="user-menu">
          <span>Welcome, {user?.username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <h1>Welcome to Med Study Hub</h1>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Tutor Questions</h3>
          <p>Generate and practice with AI-powered medical questions</p>
          <Link to="/tutor" className="card-link">Start Learning</Link>
        </div>
        <div className="dashboard-card">
          <h3>Progress Tracking</h3>
          <p>Monitor your learning progress and mastery levels</p>
          <Link to="/progress" className="card-link">View Progress</Link>
        </div>
        <div className="dashboard-card">
          <h3>Feedback</h3>
          <p>Submit feedback and view responses from administrators</p>
          <Link to="/feedback" className="card-link">Manage Feedback</Link>
        </div>
        {user?.is_admin && (
          <div className="dashboard-card admin-card">
            <h3>Admin Panel</h3>
            <p>Manage users, feedback, and system settings</p>
            <Link to="/admin" className="card-link">Admin Panel</Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Tutor Questions Component (Enhanced version of existing component)
const TutorQuestionsGenerator = () => {
  const [text, setText] = useState('');
  const [filename, setFilename] = useState('');
  const [filetype, setFiletype] = useState('');
  const [questions, setQuestions] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/tutor-questions`, {
        content: text
      });

      if (response.status === 200) {
        const data = response.data;
        setObjectives(data.learning_objectives || []);
        setQuestions(data.tutor_questions || []);
        setMessage('Questions generated successfully!');
      }
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
      console.error('Error:', err);
    }
    setLoading(false);
  };

  const recordAttempt = async (questionId, userAnswer, isCorrect) => {
    try {
      await axios.post(`${API_BASE_URL}/questions/${questionId}/attempt`, {
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: isCorrect
      });
    } catch (error) {
      console.error('Failed to record attempt:', error);
    }
  };

  // Use recordAttempt function in the future for user interactions
  console.log('recordAttempt function available for question interactions', recordAttempt);

  return (
    <div className="tutor-questions">
      <h2>AI Tutor Question Generator</h2>
      
      <form onSubmit={handleSubmit} className="question-form">
        <div className="form-group">
          <label>
            Lecture Content:<br />
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={loading}
              placeholder="Paste your lecture content here..."
              rows={6}
              required
            />
          </label>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>
              Filename (optional):<br />
              <input
                type="text"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                disabled={loading}
                placeholder="e.g., cardiology_lecture_1"
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Filetype (optional):<br />
              <input
                type="text"
                value={filetype}
                onChange={e => setFiletype(e.target.value)}
                disabled={loading}
                placeholder="e.g., PDF, PowerPoint"
              />
            </label>
          </div>
        </div>
        
        <button type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Generating...' : 'Generate Questions'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {objectives.length > 0 && (
        <div className="learning-objectives">
          <h3>Learning Objectives:</h3>
          <ul>
            {objectives.map((obj, idx) => (
              <li key={idx}>{obj}</li>
            ))}
          </ul>
        </div>
      )}

      {questions.length > 0 && (
        <div className="questions-container">
          <h3>Generated Questions:</h3>
          {questions.map((q, idx) => (
            <div key={idx} className="question-card">
              <div className="question-header">
                <span className="question-number">Q{idx + 1}</span>
                <span className="question-type">{q.type?.toUpperCase()}</span>
                {q.difficulty && (
                  <span className={`difficulty ${q.difficulty}`}>
                    {q.difficulty}
                  </span>
                )}
              </div>
              
              <div className="question-content">
                {q.type === 'mcq' ? (
                  <div className="mcq-question">
                    <p className="question-stem">{q.stem || q.question}</p>
                    {q.options && (
                      <div className="mcq-options">
                        {q.options.map((option, optIdx) => (
                          <div key={optIdx} className="mcq-option">
                            {String.fromCharCode(65 + optIdx)}. {option}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mcq-answer">
                      <strong>Answer:</strong> {q.answer}
                    </div>
                    {q.explanation && (
                      <div className="mcq-explanation">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="open-question">
                    <p className="question-text">{q.question}</p>
                    <div className="question-answer">
                      <strong>Expected Answer:</strong> {q.answer}
                    </div>
                  </div>
                )}
                
                <div className="question-metadata">
                  {q.reference && (
                    <div className="reference">
                      <strong>Reference:</strong> {q.reference}
                    </div>
                  )}
                  {q.hint && (
                    <div className="hint">
                      <strong>Hint:</strong> {q.hint}
                    </div>
                  )}
                  {q.tags && q.tags.length > 0 && (
                    <div className="tags">
                      <strong>Tags:</strong>
                      {q.tags.map((tag, tagIdx) => (
                        <span key={tagIdx} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Feedback Component
const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState({
    subject: '',
    content: '',
    rating: 5
  });
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/feedback`);
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    }
    setLoading(false);
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    try {
      await axios.post(`${API_BASE_URL}/feedback`, newFeedback);
      setNewFeedback({ subject: '', content: '', rating: 5 });
      fetchFeedback(); // Refresh list
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
    setSubmitLoading(false);
  };

  return (
    <div className="feedback-page">
      <h2>Feedback</h2>
      
      <div className="feedback-form">
        <h3>Submit New Feedback</h3>
        <form onSubmit={submitFeedback}>
          <div className="form-group">
            <label>Subject:</label>
            <input
              type="text"
              value={newFeedback.subject}
              onChange={(e) => setNewFeedback({...newFeedback, subject: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Content:</label>
            <textarea
              value={newFeedback.content}
              onChange={(e) => setNewFeedback({...newFeedback, content: e.target.value})}
              rows={4}
              required
            />
          </div>
          <div className="form-group">
            <label>Rating:</label>
            <select
              value={newFeedback.rating}
              onChange={(e) => setNewFeedback({...newFeedback, rating: parseInt(e.target.value)})}
            >
              {[1,2,3,4,5].map(rating => (
                <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={submitLoading}>
            {submitLoading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      <div className="feedback-list">
        <h3>Your Feedback History</h3>
        {loading ? (
          <p>Loading...</p>
        ) : feedbacks.length === 0 ? (
          <p>No feedback submitted yet.</p>
        ) : (
          feedbacks.map(feedback => (
            <div key={feedback.id} className="feedback-item">
              <div className="feedback-header">
                <h4>{feedback.subject}</h4>
                <span className={`status ${feedback.status}`}>{feedback.status}</span>
              </div>
              <p>{feedback.content}</p>
              {feedback.rating && (
                <div className="rating">Rating: {feedback.rating}/5</div>
              )}
              {feedback.admin_response && (
                <div className="admin-response">
                  <strong>Admin Response:</strong> {feedback.admin_response}
                </div>
              )}
              <div className="feedback-date">
                {new Date(feedback.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Progress Component
const Progress = () => {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/progress`);
      setProgress(response.data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
    setLoading(false);
  };

  if (loading) return <div>Loading progress...</div>;

  return (
    <div className="progress-page">
      <h2>Learning Progress</h2>
      
      {progress.length === 0 ? (
        <p>No progress data available. Start answering questions to track your progress!</p>
      ) : (
        <div className="progress-list">
          {progress.map(item => (
            <div key={item.id} className="progress-item">
              <div className="progress-header">
                <h4>{item.stem}</h4>
                <span className={`difficulty ${item.difficulty}`}>{item.difficulty}</span>
              </div>
              <div className="progress-stats">
                <div className="stat">
                  <span className="label">Attempts:</span>
                  <span className="value">{item.attempts}</span>
                </div>
                <div className="stat">
                  <span className="label">Correct:</span>
                  <span className="value">{item.correct_attempts}</span>
                </div>
                <div className="stat">
                  <span className="label">Mastery:</span>
                  <span className="value">{Math.round(item.mastery_level * 100)}%</span>
                </div>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${item.mastery_level * 100}%`}}
                ></div>
              </div>
              {item.tags && (
                <div className="tags">
                  {JSON.parse(item.tags).map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Admin Panel Component
const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [usersResponse, feedbackResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/users`),
        axios.get(`${API_BASE_URL}/admin/feedback`)
      ]);
      setUsers(usersResponse.data);
      setFeedbacks(feedbackResponse.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
    setLoading(false);
  };

  const makeUserAdmin = async (userId) => {
    try {
      await axios.post(`${API_BASE_URL}/admin/users/${userId}/make-admin`);
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Failed to make user admin:', error);
    }
  };

  const respondToFeedback = async (feedbackId, response) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/feedback/${feedbackId}`, {
        admin_response: response
      });
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Failed to respond to feedback:', error);
    }
  };

  if (loading) return <div>Loading admin panel...</div>;

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      
      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button 
          className={activeTab === 'feedback' ? 'active' : ''}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback ({feedbacks.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="users-section">
          <h3>User Management</h3>
          <div className="users-list">
            {users.map(user => (
              <div key={user.id} className="user-item">
                <div className="user-info">
                  <h4>{user.username}</h4>
                  <p>{user.email}</p>
                  <span className={`user-role ${user.is_admin ? 'admin' : 'user'}`}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </div>
                <div className="user-actions">
                  {!user.is_admin && (
                    <button onClick={() => makeUserAdmin(user.id)}>
                      Make Admin
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="feedback-section">
          <h3>Feedback Management</h3>
          <div className="feedback-list">
            {feedbacks.map(feedback => (
              <FeedbackManagementItem 
                key={feedback.id} 
                feedback={feedback} 
                onRespond={respondToFeedback}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Feedback Management Item Component
const FeedbackManagementItem = ({ feedback, onRespond }) => {
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);

  const handleRespond = async () => {
    if (!response.trim()) return;
    
    setResponding(true);
    await onRespond(feedback.id, response);
    setResponse('');
    setResponding(false);
  };

  return (
    <div className="feedback-management-item">
      <div className="feedback-header">
        <h4>{feedback.subject}</h4>
        <div className="feedback-meta">
          <span>By: {feedback.username}</span>
          <span className={`status ${feedback.status}`}>{feedback.status}</span>
          {feedback.rating && <span>Rating: {feedback.rating}/5</span>}
        </div>
      </div>
      <p className="feedback-content">{feedback.content}</p>
      
      {feedback.admin_response ? (
        <div className="existing-response">
          <strong>Admin Response:</strong> {feedback.admin_response}
        </div>
      ) : (
        <div className="response-section">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Enter your response..."
            rows={3}
          />
          <button 
            onClick={handleRespond} 
            disabled={!response.trim() || responding}
          >
            {responding ? 'Responding...' : 'Send Response'}
          </button>
        </div>
      )}
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Navigation />
                <main className="main-content">
                  <Navigate to="/dashboard" replace />
                </main>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Navigation />
                <main className="main-content">
                  <Dashboard />
                </main>
              </ProtectedRoute>
            } />
            <Route path="/tutor" element={
              <ProtectedRoute>
                <Navigation />
                <main className="main-content">
                  <TutorQuestionsGenerator />
                </main>
              </ProtectedRoute>
            } />
            <Route path="/feedback" element={
              <ProtectedRoute>
                <Navigation />
                <main className="main-content">
                  <Feedback />
                </main>
              </ProtectedRoute>
            } />
            <Route path="/progress" element={
              <ProtectedRoute>
                <Navigation />
                <main className="main-content">
                  <Progress />
                </main>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <Navigation />
                <main className="main-content">
                  <AdminPanel />
                </main>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;