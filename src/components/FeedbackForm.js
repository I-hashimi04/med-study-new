import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const FeedbackForm = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  
  const [feedback, setFeedback] = useState({
    rating: 5,
    feedback_text: '',
    is_helpful: true
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/feedback', {
        question_id: questionId,
        ...feedback
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/questions');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFeedback(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (success) {
    return (
      <div className="main-content">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: '#27ae60', marginBottom: '1rem' }}>
              Thank you for your feedback!
            </h2>
            <p>Your feedback helps us improve the question generation system.</p>
            <p style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
              Redirecting you back to questions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">💬 Question Feedback</h1>
          <p>Help us improve by providing feedback on this question</p>
        </div>

        {error && (
          <div className="stream-message error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Rating */}
          <div className="form-group">
            <label className="form-label">
              Overall Rating
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleChange('rating', rating)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: rating <= feedback.rating ? '#f39c12' : '#ddd'
                  }}
                  disabled={loading}
                >
                  ⭐
                </button>
              ))}
              <span style={{ marginLeft: '0.5rem', color: '#7f8c8d' }}>
                {feedback.rating} / 5
              </span>
            </div>
          </div>

          {/* Helpfulness */}
          <div className="form-group">
            <label className="form-label">
              Was this question helpful for studying?
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="helpful"
                  checked={feedback.is_helpful === true}
                  onChange={() => handleChange('is_helpful', true)}
                  disabled={loading}
                />
                👍 Yes, helpful
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="helpful"
                  checked={feedback.is_helpful === false}
                  onChange={() => handleChange('is_helpful', false)}
                  disabled={loading}
                />
                👎 Not helpful
              </label>
            </div>
          </div>

          {/* Written Feedback */}
          <div className="form-group">
            <label htmlFor="feedback_text" className="form-label">
              Additional Comments (Optional)
            </label>
            <textarea
              id="feedback_text"
              className="form-input form-textarea"
              value={feedback.feedback_text}
              onChange={(e) => handleChange('feedback_text', e.target.value)}
              placeholder="Share your thoughts on the question quality, difficulty, relevance, or suggestions for improvement..."
              disabled={loading}
              rows={5}
            />
          </div>

          {/* Feedback Categories */}
          <div className="form-group">
            <label className="form-label">
              What would you like to see improved? (Select all that apply)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
              {[
                'Question clarity',
                'Answer accuracy',
                'Difficulty level',
                'Reference quality',
                'Hint usefulness',
                'Topic relevance'
              ].map(category => (
                <label key={category} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    disabled={loading}
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/questions')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>

      {/* Feedback Impact */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🚀 How Your Feedback Helps</h2>
        </div>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>Improves AI model training and question generation quality</li>
          <li>Helps adjust difficulty levels for better learning outcomes</li>
          <li>Guides development of new question types and formats</li>
          <li>Ensures medical accuracy and clinical relevance</li>
          <li>Creates a better experience for all medical students</li>
        </ul>
      </div>
    </div>
  );
};

export default FeedbackForm;