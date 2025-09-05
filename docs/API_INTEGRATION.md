# API Integration Documentation

## Tutor Questions API Integration

### Overview
The frontend now integrates with the production `/tutor-questions` API endpoint to generate comprehensive tutor questions with full metadata display.

### API Endpoints

#### `/tutor-questions` (Primary Production Endpoint)
- **Method:** POST
- **Content-Type:** application/json
- **Purpose:** Generate tutor questions from lecture content

#### Request Format
```json
{
  "reviewed_text": "string (required, max 100,000 chars)",
  "filename": "string (optional)",
  "filetype": "string (optional)"
}
```

#### Response Format
```json
{
  "success": boolean,
  "questions": [
    {
      "type": "open" | "mcq",
      "question": "string (question text or MCQ stem)",
      "answer": "string",
      "reference": "string (slide, section, image, table reference)",
      "difficulty": "easy" | "moderate" | "difficult",
      "hint": "string (optional)",
      "tags": ["string", ...] (required),
      "options": ["string", ...] (MCQ only),
      "explanation": "string (MCQ only)"
    }
  ],
  "learning_objectives": ["string", ...],
  "message": "string"
}
```

### Error Handling

The frontend handles various error conditions:

#### HTTP Status Codes
- **413**: Input text too long (>100,000 characters)
- **422**: Invalid or empty input text
- **204**: No questions could be generated from content
- **500**: Server error during question generation
- **Network errors**: Connection issues

#### Error Messages
All error messages are user-friendly and provide actionable guidance:
- Input validation errors suggest corrections
- Server errors suggest retrying
- Network errors indicate connection issues

### Frontend Features

#### Complete Metadata Display
- **Question Types**: Both open-ended and multiple-choice questions
- **MCQ Formatting**: Proper display of stem, options, correct answer, explanation
- **Metadata**: Tags, difficulty, reference, hints all clearly labeled
- **Learning Objectives**: Displayed prominently at the top

#### Accessibility Features
- **ARIA Labels**: All interactive elements properly labeled
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Semantic HTML structure
- **Focus Management**: Clear focus indicators
- **Live Regions**: Status updates announced to screen readers

#### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Grid layouts adapt to medium screens
- **Desktop**: Full-width layouts for large screens
- **Print Styles**: Clean printing layout

#### Loading States
- **Form Submission**: Button disabled with loading text
- **Progress Indicators**: Live status updates
- **Error Recovery**: Clear error states with retry options

### Usage Examples

#### Basic Usage
```javascript
// Generate questions from lecture content
const response = await fetch('/tutor-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reviewed_text: "Lecture content about pneumonia pathophysiology..."
  })
});

const data = await response.json();
if (data.success) {
  console.log('Learning Objectives:', data.learning_objectives);
  console.log('Questions:', data.questions);
}
```

#### With Metadata
```javascript
// Include optional metadata
const response = await fetch('/tutor-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reviewed_text: "Lecture content...",
    filename: "pneumonia_lecture.pdf",
    filetype: "pdf"
  })
});
```

### Integration Checklist

- [x] **API Endpoint**: Connected to `/tutor-questions` endpoint
- [x] **Error Handling**: Comprehensive error handling for all status codes
- [x] **Loading States**: Loading indicators and disabled states
- [x] **Metadata Display**: All question metadata visible and labeled
- [x] **Learning Objectives**: Displayed at top of results
- [x] **MCQ Formatting**: Proper multiple-choice question display
- [x] **Accessibility**: Screen reader and keyboard navigation support
- [x] **Responsive Design**: Mobile, tablet, and desktop layouts
- [x] **Input Validation**: Client-side validation with helpful messages

### Testing

#### Manual Testing Scenarios
1. **Valid Input**: Submit lecture content and verify all metadata displays
2. **Empty Input**: Verify client-side validation prevents submission
3. **Long Input**: Test input length validation (>100,000 chars)
4. **Network Error**: Test offline behavior and error messaging
5. **Mobile View**: Test responsive design on mobile devices
6. **Keyboard Navigation**: Navigate entire interface using only keyboard
7. **Screen Reader**: Test with screen reader software

#### Example Test Data
```json
{
  "reviewed_text": "Pneumonia is an inflammatory condition of the lung affecting primarily the small air sacs known as alveoli. Symptoms typically include fever, chills, cough with sputum production, chest pain, and difficulty breathing. Diagnosis is often based on symptoms and physical examination, chest X-rays, and sputum culture."
}
```

Expected response should include:
- Learning objectives about pneumonia
- Mix of open and MCQ questions
- All required metadata fields populated
- References to specific content areas