import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import TutorQuestionsGenerator from './components/TutorQuestionsGenerator';
import QuestionViewer from './components/QuestionViewer';
import FeedbackForm from './components/FeedbackForm';
import AdminPanel from './components/AdminPanel';
import ModelComparison from './components/ModelComparison';

// Auth context
import { AuthProvider, useAuth } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/generate" element={<ProtectedRoute><TutorQuestionsGenerator /></ProtectedRoute>} />
              <Route path="/questions" element={<ProtectedRoute><QuestionViewer /></ProtectedRoute>} />
              <Route path="/feedback/:questionId" element={<ProtectedRoute><FeedbackForm /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><ModelComparison /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

// Admin route wrapper
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

export default App;