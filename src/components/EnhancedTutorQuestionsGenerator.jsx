import React, { useState } from 'react';
import '../styles/enhanced-tutor-questions.css';

// Enhanced TutorQuestionsGenerator with full API integration
function EnhancedTutorQuestionsGenerator() {
  const [reviewedText, setReviewedText] = useState('');
  const [filename, setFilename] = useState('');
  const [filetype, setFiletype] = useState('');
  const [questions, setQuestions] = useState([]);
  const [learningObjectives, setLearningObjectives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Enhanced error handling for different error types
  function getErrorMessage(response, error) {
    if (!response) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    switch (response.status) {
      case 413:
        return 'Input text is too long. Please shorten the content and try again.';
      case 422:
        return 'The input text is empty or invalid. Please provide valid content.';
      case 204:
        return 'No questions could be generated from this content. Try providing more detailed material.';
      case 500:
        return 'Server error occurred during question generation. Please try again later.';
      default:
        if (response.status >= 400) {
          return `Server error (${response.status}). Please try again later.`;
        }
        return error?.message || 'An unexpected error occurred. Please try again.';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setQuestions([]);
    setLearningObjectives([]);

    // Client-side validation
    if (!reviewedText.trim()) {
      setError('Please enter the reviewed text content.');
      return;
    }

    if (reviewedText.length > 100000) {
      setError('Text is too long. Maximum 100,000 characters allowed.');
      return;
    }

    setLoading(true);

    try {
      // Use the production /tutor-questions endpoint
      const response = await fetch('/tutor-questions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          reviewed_text: reviewedText.trim(),
          filename: filename.trim() || undefined,
          filetype: filetype.trim() || undefined,
        }),
      });

      if (!response.ok) {
        setError(getErrorMessage(response, null));
        return;
      }

      const data = await response.json();
      
      if (!data.success) {
        setError(data.message || 'Failed to generate tutor questions.');
        return;
      }

      // Set the response data
      setQuestions(data.questions || []);
      setLearningObjectives(data.learning_objectives || []);
      setMessage(data.message || 'Questions generated successfully.');

    } catch (err) {
      console.error('Error generating questions:', err);
      setError(getErrorMessage(null, err));
    } finally {
      setLoading(false);
    }
  }

  // Enhanced question rendering with proper accessibility
  function renderQuestion(q, idx) {
    const isValidQuestion = q && typeof q === 'object';
    if (!isValidQuestion) return null;

    return (
      <article 
        key={idx}
        className="question-card"
        style={{ 
          padding: '1.5rem', 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          backgroundColor: '#fafafa'
        }}
        role="article"
        aria-labelledby={`question-${idx}-title`}
      >
        <header>
          <h4 id={`question-${idx}-title`} style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            Question {idx + 1} 
            {q.type === 'mcq' && <span style={{ marginLeft: '0.5rem', fontSize: '0.9em', color: '#666' }}>(Multiple Choice)</span>}
          </h4>
        </header>

        {/* Question Content */}
        <div className="question-content" style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '1.1em', lineHeight: '1.6', marginBottom: '1rem' }}>
            <strong>Question:</strong> {q.question || 'No question text available'}
          </p>

          {/* MCQ Options */}
          {q.type === 'mcq' && q.options && q.options.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Options:</strong>
              <ul style={{ listStyle: 'none', padding: '0.5rem 0' }}>
                {q.options.map((option, optIdx) => (
                  <li 
                    key={optIdx} 
                    style={{ 
                      padding: '0.25rem 0', 
                      backgroundColor: option === q.answer ? '#e8f5e8' : 'transparent',
                      paddingLeft: '0.5rem',
                      borderLeft: option === q.answer ? '3px solid #4caf50' : '3px solid transparent'
                    }}
                  >
                    {String.fromCharCode(65 + optIdx)}. {option}
                    {option === q.answer && <span style={{ marginLeft: '0.5rem', color: '#4caf50', fontWeight: 'bold' }}>✓</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Answer */}
        <div style={{ marginBottom: '1rem' }}>
          <strong>Answer:</strong> 
          <span style={{ marginLeft: '0.5rem' }}>{q.answer || 'No answer provided'}</span>
        </div>

        {/* MCQ Explanation */}
        {q.type === 'mcq' && q.explanation && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f0f8ff', borderLeft: '3px solid #2196f3' }}>
            <strong>Explanation:</strong> {q.explanation}
          </div>
        )}

        {/* Metadata Grid */}
        <div className="metadata-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px'
        }}>
          {/* Difficulty */}
          {q.difficulty && (
            <div>
              <strong>Difficulty:</strong>
              <span 
                style={{ 
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.85em',
                  backgroundColor: 
                    q.difficulty === 'easy' ? '#e8f5e8' :
                    q.difficulty === 'moderate' ? '#fff3e0' :
                    q.difficulty === 'difficult' ? '#ffebee' : '#f5f5f5',
                  color:
                    q.difficulty === 'easy' ? '#2e7d32' :
                    q.difficulty === 'moderate' ? '#f57c00' :
                    q.difficulty === 'difficult' ? '#c62828' : '#666'
                }}
              >
                {q.difficulty}
              </span>
            </div>
          )}

          {/* Tags */}
          {q.tags && q.tags.length > 0 && (
            <div>
              <strong>Tags:</strong>
              <div style={{ marginTop: '0.25rem' }}>
                {q.tags.map((tag, tagIdx) => (
                  <span 
                    key={tagIdx}
                    style={{ 
                      display: 'inline-block',
                      margin: '0.125rem 0.25rem 0.125rem 0',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#e3f2fd',
                      color: '#1565c0',
                      borderRadius: '12px',
                      fontSize: '0.8em'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reference */}
          {q.reference && (
            <div>
              <strong>Reference:</strong>
              <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>{q.reference}</span>
            </div>
          )}

          {/* Hint */}
          {q.hint && (
            <div>
              <strong>Hint:</strong>
              <span style={{ marginLeft: '0.5rem', color: '#666' }}>{q.hint}</span>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>Tutor Questions Generator</h1>
        <p style={{ color: '#666', fontSize: '1.1em' }}>
          Generate comprehensive tutor questions with learning objectives from your lecture content.
        </p>
      </header>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="reviewed-text" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Reviewed Text Content: <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            id="reviewed-text"
            value={reviewedText}
            onChange={e => setReviewedText(e.target.value)}
            disabled={loading}
            required
            aria-describedby="text-help"
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              fontFamily: 'inherit'
            }}
            placeholder="Enter the lecture content or material you want to generate questions from..."
          />
          <small id="text-help" style={{ color: '#666', fontSize: '0.9em' }}>
            Provide lecture notes, slides, or study material. Maximum 100,000 characters.
          </small>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label htmlFor="filename" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Filename (optional):
            </label>
            <input
              id="filename"
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="e.g., lecture_01.pdf"
            />
          </div>

          <div>
            <label htmlFor="filetype" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              File Type (optional):
            </label>
            <input
              id="filetype"
              type="text"
              value={filetype}
              onChange={e => setFiletype(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="e.g., pdf, docx, txt"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !reviewedText.trim()}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: loading ? '#ccc' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
          aria-describedby={loading ? "loading-status" : undefined}
        >
          {loading ? 'Generating Questions...' : 'Generate Questions'}
        </button>
        
        {loading && (
          <div id="loading-status" aria-live="polite" style={{ marginTop: '0.5rem', color: '#666' }}>
            Please wait while we generate your questions. This may take a few moments.
          </div>
        )}
      </form>

      {/* Error Message */}
      {error && (
        <div 
          role="alert" 
          style={{ 
            color: '#d32f2f', 
            backgroundColor: '#ffebee', 
            padding: '1rem', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            border: '1px solid #ffcdd2'
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div 
          role="status" 
          style={{ 
            color: '#2e7d32', 
            backgroundColor: '#e8f5e8', 
            padding: '1rem', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            border: '1px solid #c8e6c9'
          }}
        >
          {message}
        </div>
      )}

      {/* Learning Objectives */}
      {learningObjectives.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Learning Objectives</h2>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {learningObjectives.map((objective, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Generated Questions */}
      {questions.length > 0 && (
        <section>
          <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
            Generated Questions ({questions.length})
          </h2>
          <div role="feed" aria-label="Generated tutor questions">
            {questions.map((q, idx) => renderQuestion(q, idx))}
          </div>
        </section>
      )}

      {/* No Questions Message */}
      {!loading && questions.length === 0 && !error && reviewedText && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#666',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          No questions generated yet. Please submit your content above to generate tutor questions.
        </div>
      )}
    </div>
  );
}

export default EnhancedTutorQuestionsGenerator;