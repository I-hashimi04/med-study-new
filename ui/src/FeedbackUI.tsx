import React, { useState } from 'react';

interface Question {
  id: string;
  question: string;
  answer: string;
  difficulty: string;
  tags: string[];
  reference?: string;
  hint?: string;
}

interface FeedbackFormProps {
  question: Question;
  onSubmit: (feedback: any) => void;
  onClose: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ question, onSubmit, onClose }) => {
  const [rating, setRating] = useState<number>(0);
  const [comments, setComments] = useState('');
  const [difficultyAccurate, setDifficultyAccurate] = useState<boolean | null>(null);
  const [tagsAccurate, setTagsAccurate] = useState<boolean | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      question_id: question.id,
      rating,
      comments: comments.trim() || null,
      difficulty_accurate: difficultyAccurate,
      tags_accurate: tagsAccurate
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Rate This Question</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating (1-5 stars)
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Accuracy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is the difficulty level accurate? (Current: {question.difficulty})
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="difficulty"
                  checked={difficultyAccurate === true}
                  onChange={() => setDifficultyAccurate(true)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="difficulty"
                  checked={difficultyAccurate === false}
                  onChange={() => setDifficultyAccurate(false)}
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>

          {/* Tags Accuracy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Are the tags accurate? ({question.tags.join(', ')})
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tags"
                  checked={tagsAccurate === true}
                  onChange={() => setTagsAccurate(true)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tags"
                  checked={tagsAccurate === false}
                  onChange={() => setTagsAccurate(false)}
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
              placeholder="Share your thoughts about this question..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface QuestionCardProps {
  question: Question;
  onFeedback: (question: Question) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onFeedback }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {question.question}
          </h3>
          <p className="text-gray-600 mb-3">{question.answer}</p>
          
          {question.hint && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
              <p className="text-sm text-blue-700">
                <strong>Hint:</strong> {question.hint}
              </p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              question.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {question.difficulty}
            </span>
            {question.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
          
          {question.reference && (
            <p className="text-sm text-gray-500">
              <strong>Reference:</strong> {question.reference}
            </p>
          )}
        </div>
        
        <button
          onClick={() => onFeedback(question)}
          className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Rate Question
        </button>
      </div>
    </div>
  );
};

const FeedbackUI: React.FC = () => {
  const [questions] = useState<Question[]>([
    {
      id: 'q1',
      question: 'Explain the pathophysiology of heart failure and its impact on patient quality of life.',
      answer: 'Heart failure involves reduced cardiac output due to impaired ventricular function, leading to fluid retention, shortness of breath, and decreased exercise tolerance, significantly impacting daily activities and overall quality of life.',
      difficulty: 'difficult',
      tags: ['cardiology', 'pathophysiology', 'quality of life'],
      reference: 'slide 15, cardiology module',
      hint: 'Consider both the mechanical and neurohormonal aspects of heart failure.'
    },
    {
      id: 'q2',
      question: 'What is the normal heart rate range for a healthy adult at rest?',
      answer: '60-100 beats per minute',
      difficulty: 'easy',
      tags: ['cardiology', 'vital signs', 'normal values'],
      reference: 'vital signs reference chart'
    }
  ]);

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string[]>([]);

  const handleFeedbackSubmit = async (feedback: any) => {
    try {
      // In a real app, this would call the API
      console.log('Submitting feedback:', feedback);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setFeedbackSubmitted([...feedbackSubmitted, feedback.question_id]);
      setSelectedQuestion(null);
      
      // Show success message
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Question Feedback</h1>
          <p className="text-gray-600 mt-2">
            Help us improve by rating the quality and accuracy of our generated questions.
          </p>
        </header>

        <div className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="relative">
              <QuestionCard 
                question={question} 
                onFeedback={setSelectedQuestion}
              />
              {feedbackSubmitted.includes(question.id) && (
                <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  ✓ Feedback submitted
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedQuestion && (
          <FeedbackForm
            question={selectedQuestion}
            onSubmit={handleFeedbackSubmit}
            onClose={() => setSelectedQuestion(null)}
          />
        )}
      </div>
    </div>
  );
};

export default FeedbackUI;