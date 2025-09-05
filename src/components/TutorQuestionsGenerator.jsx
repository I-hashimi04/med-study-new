import React, { useState } from 'react';

function TutorQuestionsGenerator() {
  const [reviewedText, setReviewedText] = useState('');
  const [filename, setFilename] = useState('');
  const [filetype, setFiletype] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setQuestions([]);
    if (!reviewedText.trim()) {
      setError('Reviewed text is required.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/generate-tutor-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewed_text: reviewedText,
          filename: filename || undefined,
          filetype: filetype || undefined,
        }),
      });
      if (response.status === 413) {
        setError('Input too long. Please shorten the reviewed text.');
        setLoading(false);
        return;
      }
      if (response.status === 422) {
        setError('Reviewed text is empty or invalid.');
        setLoading(false);
        return;
      }
      if (response.status === 204) {
        setError('No tutor questions generated for this material.');
        setLoading(false);
        return;
      }
      if (!response.ok) {
        setError('Server error. Please try again later.');
        setLoading(false);
        return;
      }
      const data = await response.json();
      if (!data.success) {
        setError(data.message || 'Failed to generate tutor questions.');
      } else {
        setQuestions(data.questions || []);
        setMessage(data.message || '');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    }
    setLoading(false);
  }

  return (
    <div className="tutor-questions-generator" style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
      <h2>Generate Tutor Questions</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Reviewed Text:<br />
            <textarea
              rows={8}
              style={{ width: '100%' }}
              value={reviewedText}
              onChange={e => setReviewedText(e.target.value)}
              required
              disabled={loading}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Filename (optional):<br />
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              disabled={loading}
            />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            Filetype (optional):<br />
            <input
              type="text"
              value={filetype}
              onChange={e => setFiletype(e.target.value)}
              disabled={loading}
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Questions'}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {message && <div style={{ color: 'green', marginBottom: 16 }}>{message}</div>}
      <div>
        {questions.length > 0 ? (
          <div>
            <h3>Generated Tutor Questions:</h3>
            {questions.map((q, idx) => (
              <div key={idx} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8, marginBottom: 16 }}>
                <strong>Q{idx + 1}:</strong> {q.question}
                <br />
                <strong>Answer:</strong> {q.answer}
                {q.reference && (
                  <div><strong>Reference:</strong> {q.reference}</div>
                )}
                {q.difficulty && (
                  <div><strong>Difficulty:</strong> {q.difficulty}</div>
                )}
                {q.hint && (
                  <div><strong>Hint:</strong> {q.hint}</div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default TutorQuestionsGenerator;
