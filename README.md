# Med Study Hub - AI-Powered Medical Learning Platform

A comprehensive full-stack application for medical students featuring AI-powered question generation, progress tracking, and collaborative learning tools.

## Features

### Backend (FastAPI)
- **SQLite Database**: Users, questions, feedback, progress tracking
- **JWT Authentication**: Secure user authentication with hashed passwords
- **Admin Panel**: User management and feedback review (admin-only access)
- **Ollama Integration**: Local LLM streaming for intelligent question generation
- **RESTful API**: Comprehensive endpoints for all functionality
- **Question Types**: Support for open-ended and MCQ questions
- **Progress Tracking**: User learning analytics and mastery levels
- **Feedback System**: User feedback submission and admin responses

### Frontend (React)
- **Authentication UI**: Login/register forms with validation
- **Responsive Design**: Mobile-friendly interface
- **Question Generator**: AI-powered tutor question creation
- **Progress Dashboard**: Visual learning progress tracking
- **Feedback Management**: Submit and track feedback
- **Admin Interface**: User and feedback management (admin-only)
- **JWT Integration**: Secure API communication
- **Error Handling**: Comprehensive error states and loading indicators

### Testing & Deployment
- **Backend Tests**: Pytest test suite with comprehensive coverage
- **Frontend Tests**: Jest/React Testing Library test suite
- **Docker Support**: Full containerization for easy deployment
- **CI/CD Ready**: GitHub Actions workflow support

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLite**: Lightweight database
- **Pydantic**: Data validation and serialization
- **JWT**: Token-based authentication
- **Uvicorn**: ASGI server
- **Pytest**: Testing framework

### Frontend
- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **CSS3**: Responsive styling
- **Jest**: Testing framework

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-service orchestration
- **Ollama**: Local LLM integration (optional)

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- Docker (optional)

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd med-study-new
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Application: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Option 2: Local Development

#### Backend Setup

1. **Navigate to Python worker directory**
   ```bash
   cd python_worker
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize database**
   ```bash
   python -c "from app import init_db; init_db()"
   ```

5. **Start backend server**
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

3. **Access application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/me` - Get current user profile

### Questions & Learning
- `POST /api/tutor-questions` - Generate AI questions
- `GET /api/tutor-questions` - Get existing questions
- `POST /api/questions/{id}/attempt` - Record question attempt
- `GET /api/progress` - Get user learning progress

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get user feedback

### Admin (Admin-only)
- `GET /api/admin/users` - List all users
- `GET /api/admin/feedback` - List all feedback
- `PUT /api/admin/feedback/{id}` - Respond to feedback
- `POST /api/admin/users/{id}/make-admin` - Make user admin

## Database Schema

### Users
- `id` (Primary Key)
- `username` (Unique)
- `email` (Unique)
- `password_hash`
- `is_admin` (Boolean)
- `created_at`

### Questions
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `question_type` (open/mcq)
- `stem` (Question text)
- `options` (JSON array for MCQ)
- `correct_answer`
- `explanation`
- `difficulty` (easy/moderate/difficult)
- `hint`
- `reference`
- `tags` (JSON array)
- `created_at`

### Feedback
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `question_id` (Optional Foreign Key)
- `subject`
- `content`
- `rating` (1-5)
- `status` (pending/reviewed/resolved)
- `admin_response`
- `created_at`
- `updated_at`

### User Progress
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `question_id` (Foreign Key)
- `attempts`
- `correct_attempts`
- `last_attempted`
- `mastery_level` (0.0-1.0)

## Testing

### Backend Tests
```bash
cd python_worker
source venv/bin/activate
pytest test_tutor_questions.py -v
```

### Frontend Tests
```bash
npm test
```

### Run All Tests
```bash
# Backend
cd python_worker && python -m pytest

# Frontend
npm test -- --coverage --watchAll=false
```

## Configuration

### Environment Variables
- `DATABASE_PATH`: SQLite database file path
- `SECRET_KEY`: JWT secret key (auto-generated if not set)
- `CORS_ORIGINS`: Allowed CORS origins
- `OLLAMA_URL`: Ollama API endpoint (default: http://localhost:11434)

### Ollama Integration

For local LLM integration:

1. **Install Ollama**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Pull a model**
   ```bash
   ollama pull llama2
   ```

3. **Start Ollama service**
   ```bash
   ollama serve
   ```

The application will automatically use Ollama if available, otherwise it uses mock responses for development.

## Admin Setup

To create an admin user:

1. **Register a normal user** via the frontend
2. **Connect to the database** and update the user:
   ```sql
   UPDATE users SET is_admin = TRUE WHERE username = 'your_username';
   ```

Alternatively, use the admin endpoint after creating at least one admin user manually.

## Development Guidelines

### Code Style
- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ESLint and Prettier
- **Commits**: Use conventional commit messages

### Adding Features
1. **Backend**: Add endpoints in `app.py`, update models as needed
2. **Frontend**: Create components in `src/components/`
3. **Tests**: Add corresponding tests for new features
4. **Documentation**: Update README and API docs

## Deployment

### Production Deployment

1. **Build and deploy with Docker**
   ```bash
   docker build -t med-study-hub .
   docker run -p 8000:8000 -v ./data:/app/data med-study-hub
   ```

2. **Environment Configuration**
   - Set production environment variables
   - Configure reverse proxy (nginx recommended)
   - Enable HTTPS with SSL certificates
   - Set up database backups

### Security Considerations
- Change default JWT secret in production
- Use environment variables for sensitive data
- Implement rate limiting for API endpoints
- Regular security updates for dependencies
- Database encryption for sensitive data

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/docs` endpoint
- Review the test files for usage examples

## Roadmap

- [ ] Advanced question types (drag-drop, image-based)
- [ ] Spaced repetition algorithm
- [ ] Collaborative study groups
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with external medical databases
- [ ] Multi-language support
- [ ] Voice-activated question practice