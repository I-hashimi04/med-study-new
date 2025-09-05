import React, { useState } from 'react';

const ModelComparison = () => {
  const [content, setContent] = useState('');
  const [selectedModels, setSelectedModels] = useState(['gpt-3.5-turbo', 'gpt-4']);
  const [results, setResults] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [streamMessages, setStreamMessages] = useState([]);
  const [error, setError] = useState('');

  const availableModels = [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
    { id: 'gpt-4', name: 'GPT-4', description: 'More accurate and detailed' },
    { id: 'claude-2', name: 'Claude 2', description: 'Anthropic\'s latest model' },
    { id: 'palm-2', name: 'PaLM 2', description: 'Google\'s language model' }
  ];

  const handleModelToggle = (modelId) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else if (prev.length < 3) { // Limit to 3 models max
        return [...prev, modelId];
      }
      return prev;
    });
  };

  const handleCompareModels = () => {
    if (!content.trim() || selectedModels.length < 2) return;

    setStreaming(true);
    setStreamMessages([]);
    setResults(null);
    setError('');

    const eventSource = new EventSource(
      `${process.env.REACT_APP_PYTHON_API_URL}/api/compare-models`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content, 
          models: selectedModels 
        })
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

        if (data.status) {
          setStreamMessages(prev => [...prev, {
            type: data.status === 'error' ? 'error' : 'status',
            message: data.status.replace(/_/g, ' ').toUpperCase(),
            details: data.current_model ? `Processing ${data.current_model}` : '',
            progress: data.progress,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }

        if (data.status === 'completed_model') {
          setStreamMessages(prev => [...prev, {
            type: 'success',
            message: `✅ Completed ${data.model}`,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }

        if (data.status === 'finished') {
          setResults(data.results);
          setStreamMessages(prev => [...prev, {
            type: 'success',
            message: '🎉 Model comparison completed!',
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

    // Fallback to close connection after 60 seconds
    setTimeout(() => {
      if (streaming) {
        eventSource.close();
        setStreaming(false);
      }
    }, 60000);
  };

  const renderModelResult = (modelId, result) => {
    if (!result) return null;

    return (
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            {availableModels.find(m => m.id === modelId)?.name || modelId}
          </h3>
        </div>

        {/* Learning Objectives */}
        {result.learning_objectives && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4>🎯 Learning Objectives ({result.learning_objectives.length})</h4>
            <ul style={{ paddingLeft: '1.5rem' }}>
              {result.learning_objectives.map((obj, index) => (
                <li key={index} style={{ marginBottom: '0.25rem' }}>{obj}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Questions */}
        {result.tutor_questions && (
          <div>
            <h4>📚 Questions ({result.tutor_questions.length})</h4>
            {result.tutor_questions.slice(0, 3).map((question, index) => (
              <div key={index} className="question-item" style={{ margin: '0.5rem 0', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className={`question-type ${question.type}`}>
                    {question.type?.toUpperCase()}
                  </span>
                  {question.difficulty && (
                    <span className={`question-difficulty difficulty-${question.difficulty}`}>
                      {question.difficulty}
                    </span>
                  )}
                </div>
                <strong>{question.question || question.stem}</strong>
                {question.type === 'mcq' && question.options && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    {question.options.slice(0, 2).map((opt, optIndex) => (
                      <div key={optIndex}>• {opt}</div>
                    ))}
                    {question.options.length > 2 && <div>... and {question.options.length - 2} more</div>}
                  </div>
                )}
              </div>
            ))}
            {result.tutor_questions.length > 3 && (
              <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '0.875rem' }}>
                ... and {result.tutor_questions.length - 3} more questions
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="main-content">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">🔄 Model Comparison</h1>
          <p>Compare different AI models side-by-side for question generation</p>
        </div>

        {/* Content Input */}
        <div className="form-group">
          <label htmlFor="content" className="form-label">
            Lecture Content
          </label>
          <textarea
            id="content"
            className="form-input form-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your lecture content here to compare how different models generate questions..."
            required
            disabled={streaming}
            style={{ minHeight: '150px' }}
          />
        </div>

        {/* Model Selection */}
        <div className="form-group">
          <label className="form-label">
            Select Models to Compare (2-3 models)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {availableModels.map(model => (
              <label 
                key={model.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.5rem',
                  padding: '1rem',
                  border: selectedModels.includes(model.id) ? '2px solid #3498db' : '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedModels.includes(model.id) ? '#f8f9fa' : 'white'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model.id)}
                  onChange={() => handleModelToggle(model.id)}
                  disabled={streaming || (!selectedModels.includes(model.id) && selectedModels.length >= 3)}
                />
                <div>
                  <div style={{ fontWeight: '600' }}>{model.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>{model.description}</div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#7f8c8d', marginTop: '0.5rem' }}>
            Selected: {selectedModels.length}/3 models
          </div>
        </div>

        {/* Compare Button */}
        <button
          onClick={handleCompareModels}
          className="btn btn-primary"
          disabled={streaming || !content.trim() || selectedModels.length < 2}
          style={{ marginBottom: '2rem' }}
        >
          {streaming ? 'Comparing Models...' : '🚀 Compare Models'}
        </button>

        {/* Streaming Progress */}
        {(streaming || streamMessages.length > 0) && (
          <div className="stream-container">
            <div className="stream-header">
              <h3>⚡ Comparison Progress</h3>
            </div>
            <div className="stream-content">
              {streamMessages.map((msg, index) => (
                <div key={index} className={`stream-message ${msg.type}`}>
                  <span style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
                    {msg.timestamp}
                  </span>
                  <div>{msg.message}</div>
                  {msg.details && <div style={{ fontSize: '0.875rem' }}>{msg.details}</div>}
                  {msg.progress !== undefined && (
                    <div style={{ 
                      width: '100%', 
                      backgroundColor: '#e1e5e9', 
                      borderRadius: '4px', 
                      marginTop: '0.5rem',
                      height: '8px'
                    }}>
                      <div style={{
                        width: `${msg.progress * 100}%`,
                        backgroundColor: '#3498db',
                        height: '100%',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  )}
                </div>
              ))}
              {streaming && (
                <div className="stream-message">
                  <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                  Processing...
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
      </div>

      {/* Results */}
      {results && (
        <div>
          <div className="card-header">
            <h2 className="card-title">📊 Comparison Results</h2>
            <p>Compare the outputs from different models</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: selectedModels.length === 2 ? '1fr 1fr' : '1fr',
            gap: '1rem'
          }}>
            {selectedModels.map(modelId => (
              <div key={modelId}>
                {renderModelResult(modelId, results[modelId])}
              </div>
            ))}
          </div>

          {/* Comparison Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📈 Quick Comparison</h3>
            </div>
            <div className="data-table">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Learning Objectives</th>
                    <th>Total Questions</th>
                    <th>MCQ Questions</th>
                    <th>Open Questions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedModels.map(modelId => {
                    const result = results[modelId];
                    if (!result) return null;
                    
                    const mcqCount = result.tutor_questions?.filter(q => q.type === 'mcq').length || 0;
                    const openCount = result.tutor_questions?.filter(q => q.type === 'open').length || 0;
                    
                    return (
                      <tr key={modelId}>
                        <td>{availableModels.find(m => m.id === modelId)?.name || modelId}</td>
                        <td>{result.learning_objectives?.length || 0}</td>
                        <td>{result.tutor_questions?.length || 0}</td>
                        <td>{mcqCount}</td>
                        <td>{openCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelComparison;