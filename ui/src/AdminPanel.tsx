import React, { useState, useEffect } from 'react';

interface Question {
  id: string;
  question: string;
  answer: string;
  difficulty: string;
  tags: string[];
  reference?: string;
}

interface QuestionStats {
  totalQuestions: number;
  averageRating: number;
  topTags: string[];
  difficultyDistribution: Record<string, number>;
}

const AdminPanel: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Mock data loading
  useEffect(() => {
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        question: 'Explain the pathophysiology of heart failure.',
        answer: 'Heart failure involves reduced cardiac output...',
        difficulty: 'difficult',
        tags: ['cardiology', 'pathophysiology'],
        reference: 'slide 15, cardiology module'
      },
      {
        id: 'q2', 
        question: 'What is the normal heart rate range?',
        answer: '60-100 beats per minute',
        difficulty: 'easy',
        tags: ['cardiology', 'vital signs'],
        reference: 'vital signs reference'
      }
    ];

    const mockStats: QuestionStats = {
      totalQuestions: 156,
      averageRating: 4.2,
      topTags: ['cardiology', 'pathophysiology', 'diagnosis'],
      difficultyDistribution: { easy: 45, moderate: 78, difficult: 33 }
    };

    setQuestions(mockQuestions);
    setStats(mockStats);
  }, []);

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setIsEditing(true);
  };

  const handleSaveQuestion = () => {
    // In real implementation, this would call an API
    console.log('Saving question:', selectedQuestion);
    setIsEditing(false);
    setSelectedQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medical Study Hub - Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage questions, view analytics, and moderate content</p>
        </header>

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-700">Total Questions</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalQuestions}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-700">Average Rating</h3>
              <p className="text-3xl font-bold text-green-600">{stats.averageRating}/5</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-700">Top Tags</h3>
              <div className="flex flex-wrap gap-1 mt-2">
                {stats.topTags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-700">Difficulty Distribution</h3>
              <div className="space-y-1 mt-2">
                {Object.entries(stats.difficultyDistribution).map(([difficulty, count]) => (
                  <div key={difficulty} className="flex justify-between text-sm">
                    <span className="capitalize">{difficulty}:</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-lg p-4 shadow mb-6">
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add New Question
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Import Questions
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              Export Data
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
              View Analytics
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Question Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{question.question}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {question.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                        {question.tags.length > 2 && (
                          <span className="text-gray-500 text-xs">+{question.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button 
                        onClick={() => handleEditQuestion(question)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && selectedQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Edit Question</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={3}
                    value={selectedQuestion.question}
                    onChange={(e) => setSelectedQuestion({
                      ...selectedQuestion,
                      question: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={3}
                    value={selectedQuestion.answer}
                    onChange={(e) => setSelectedQuestion({
                      ...selectedQuestion,
                      answer: e.target.value
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select 
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={selectedQuestion.difficulty}
                      onChange={(e) => setSelectedQuestion({
                        ...selectedQuestion,
                        difficulty: e.target.value
                      })}
                    >
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="difficult">Difficult</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input 
                      type="text"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={selectedQuestion.tags.join(', ')}
                      onChange={(e) => setSelectedQuestion({
                        ...selectedQuestion,
                        tags: e.target.value.split(',').map(tag => tag.trim())
                      })}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;