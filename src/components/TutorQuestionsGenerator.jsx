import React, { useState } from 'react';
import axios from 'axios';

const TutorQuestionsGenerator = () => {
  const [content, setContent] = useState('');
  const [questions, setQuestions] = useState([]);
  const [learningObjectives, setLearningObjectives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamMessages, setStreamMessages] = useState([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError('');
    setQuestions([]);
    setLearningObjectives([]);

    try {
      const response = await axios.post(`${process.env.REACT_APP_PYTHON_API_URL}/api/generate-tutor-questions`, {
        reviewed_text: content
      });

      if (response.data.success) {
        setQuestions(response.data.questions);
        setLearningObjectives(response.data.learning_objectives || []);
      } else {
        setError('Failed to generate questions');
      }
    } catch (err) {
      console.error('Error generating questions:', err);
      setError(err.response?.data?.detail || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleStreamingGeneration = () => {
    if (!content.trim()) return;

    setStreaming(true);
    setStreamMessages([]);
    setQuestions([]);
    setLearningObjectives([]);
    setError('');

    const eventSource = new EventSource(
      `${process.env.REACT_APP_PYTHON_API_URL}/api/generate-questions-stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      }
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.error);
          setStreaming(false);
          eventSource.close();
          return;
        }

        // Add status messages
        if (data.status) {
          setStreamMessages(prev => [...prev, {
            type: 'status',
            message: data.status.replace(/_/g, ' ').toUpperCase(),
            timestamp: new Date().toLocaleTimeString()
          }]);
        }

        // Handle learning objectives
        if (data.type === 'objectives') {
          setLearningObjectives(data.data);
          setStreamMessages(prev => [...prev, {
            type: 'success',
            message: `Generated ${data.data.length} learning objectives`,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }

        // Handle individual questions
        if (data.type === 'question') {
          setQuestions(prev => [...prev, data.data]);
          setStreamMessages(prev => [...prev, {
            type: 'success',
            message: `Generated question ${data.index + 1}: ${data.data.type.toUpperCase()}`,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }

        // Handle completion
        if (data.status === 'completed') {
          setStreamMessages(prev => [...prev, {
            type: 'success',
            message: `✅ Generation completed! Created ${data.total_questions} questions`,
            timestamp: new Date().toLocaleTimeString()
          }]);
          setStreaming(false);
          eventSource.close();
        }

      } catch (parseError) {
        console.error('Error parsing stream data:', parseError);
      }
    };

    eventSource.onerror = () => {
      setError('Streaming connection failed');
      setStreaming(false);
      eventSource.close();
    };

    // Fallback to close connection after 30 seconds
    setTimeout(() => {
      if (streaming) {
        eventSource.close();
        setStreaming(false);
      }
    }, 30000);
  };

  const renderQuestion = (question, index) => (
    <div key={index} className="question-item">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <span className={`question-type ${question.type}`}>
          {question.type.toUpperCase()}
        </span>
        <span className={`question-difficulty difficulty-${question.difficulty}`}>
          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
        </span>
      </div>

      <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
        {question.type === 'mcq' ? question.stem : question.question}
      </h3>

      {question.type === 'mcq' && question.options && (
        <ul className="mcq-options">
          {question.options.map((option, optIndex) => (
            <li 
              key={optIndex} 
              className={`mcq-option ${option === question.answer ? 'correct' : ''}`}
            >
              {String.fromCharCode(65 + optIndex)}. {option}
            </li>
          ))}
        </ul>
      )}

      {question.type === 'open' && (
        <div style={{ marginBottom: '1rem' }}>
          <strong>Expected Answer:</strong>
          <p style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            {question.answer}
          </p>
        </div>
      )}

      {question.explanation && (
        <div style={{ marginBottom: '1rem' }}>
          <strong>Explanation:</strong>
          <p style={{ marginTop: '0.5rem' }}>{question.explanation}</p>
        </div>
      )}

      {question.hint && (
        <div style={{ marginBottom: '1rem' }}>
          <strong>💡 Hint:</strong>
          <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>{question.hint}</p>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <strong>📖 Reference:</strong>
        <p style={{ marginTop: '0.5rem' }}>{question.reference}</p>
      </div>

      {question.tags && question.tags.length > 0 && (
        <div className="question-tags">
          {question.tags.map((tag, tagIndex) => (
            <span key={tagIndex} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">📝 Tutor Questions Generator</h1>
          <p>Generate AI-powered study questions from your lecture content</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Lecture Content
            </label>
            <textarea
              id="content"
              className="form-input form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your lecture content here (slides, notes, etc.)..."
              required
              disabled={loading || streaming}
              style={{ minHeight: '200px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || streaming || !content.trim()}
            >
              {loading ? 'Generating...' : '🚀 Generate Questions'}
            </button>
            
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleStreamingGeneration}
              disabled={loading || streaming || !content.trim()}
            >
              {streaming ? 'Streaming...' : '📡 Stream Generation'}
            </button>
          </div>
        </form>

        {/* Streaming Messages */}
        {(streaming || streamMessages.length > 0) && (
          <div className="stream-container">
            <div className="stream-header">
              <h3>🔄 Generation Progress</h3>
            </div>
            <div className="stream-content">
              {streamMessages.map((msg, index) => (
                <div key={index} className={`stream-message ${msg.type}`}>
                  <span style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
                    {msg.timestamp}
                  </span>
                  <div>{msg.message}</div>
                </div>
              ))}
              {streaming && (
                <div className="stream-message">
                  <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                  Generating...
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="stream-message error">
            ❌ Error: {error}
          </div>
        )}

        {/* Learning Objectives */}
        {learningObjectives.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🎯 Learning Objectives</h2>
            </div>
            <ul style={{ paddingLeft: '1.5rem' }}>
              {learningObjectives.map((objective, index) => (
                <li key={index} style={{ marginBottom: '0.5rem' }}>
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Generated Questions */}
        {questions.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                📚 Generated Questions ({questions.length})
              </h2>
            </div>
            {questions.map(renderQuestion)}
          </div>
        )}

        {(loading || streaming) && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            {loading ? 'Generating questions...' : 'Streaming questions...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorQuestionsGenerator;
