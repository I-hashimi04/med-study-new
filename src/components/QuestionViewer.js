import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const QuestionViewer = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      // In a real implementation, this would fetch generated questions
      // For now, we'll fetch cards as a placeholder
      const response = await axios.get('/cards');
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.answer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'difficulty') return question.difficulty === filter && matchesSearch;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
          Loading questions...
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card-header">
        <h1 className="card-title">📚 My Study Questions</h1>
        <p>Review and manage your generated questions</p>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <select
              className="form-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Questions</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="difficult">Difficult</option>
            </select>
          </div>

          <Link to="/generate" className="btn btn-primary">
            ➕ Generate More
          </Link>
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length > 0 ? (
        <div>
          <div style={{ marginBottom: '1rem', color: '#7f8c8d' }}>
            Showing {filteredQuestions.length} of {questions.length} questions
          </div>
          
          {filteredQuestions.map((question, index) => (
            <div key={question.id || index} className="question-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="question-type">
                    QUESTION
                  </span>
                  {question.difficulty && (
                    <span className={`question-difficulty difficulty-${question.difficulty}`}>
                      {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link 
                    to={`/feedback/${question.id}`}
                    className="btn btn-outline"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    💬 Feedback
                  </Link>
                </div>
              </div>

              <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
                {question.question}
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <strong>Answer:</strong>
                <p style={{ 
                  marginTop: '0.5rem', 
                  padding: '1rem', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  border: '1px solid #e1e5e9'
                }}>
                  {question.answer}
                </p>
              </div>

              {question.hint && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>💡 Hint:</strong>
                  <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>{question.hint}</p>
                </div>
              )}

              {question.reference && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>📖 Reference:</strong>
                  <p style={{ marginTop: '0.5rem' }}>{question.reference}</p>
                </div>
              )}

              {question.tags && (
                <div className="question-tags">
                  {(typeof question.tags === 'string' ? JSON.parse(question.tags) : question.tags).map((tag, tagIndex) => (
                    <span key={tagIndex} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {question.created_at && (
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#7f8c8d' }}>
                  Created: {new Date(question.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '3rem', color: '#7f8c8d' }}>
            <h3>No questions found</h3>
            {searchTerm ? (
              <p>No questions match your search "{searchTerm}"</p>
            ) : (
              <p>You haven't generated any questions yet.</p>
            )}
            <Link to="/generate" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Generate Your First Questions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionViewer;