# 🏥 Medical Study Hub

A comprehensive AI-powered study platform for medical students, featuring LLM-based question generation, model comparison, real-time streaming, feedback collection, and administrative tools.

[![CI/CD](https://github.com/I-hashimi04/med-study-new/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/I-hashimi04/med-study-new/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🤖 AI-Powered Question Generation
- **Multiple LLM Support**: GPT-3.5, GPT-4, Claude, PaLM
- **Real-time Streaming**: Live question generation with progress updates
- **Question Types**: Open-ended Socratic questions and multiple-choice questions
- **Smart Parsing**: Automatic extraction of difficulty, tags, references, and hints
- **British English**: All content generated in proper British medical terminology

### 🔄 Model Comparison
- **Side-by-side Analysis**: Compare outputs from different AI models
- **Performance Metrics**: Quality, speed, and relevance comparisons
- **Visual Comparisons**: Easy-to-read comparison tables and charts

### 💬 Feedback System
- **User Ratings**: 5-star rating system for generated questions
- **Detailed Feedback**: Qualitative feedback collection
- **Analytics Dashboard**: Track feedback trends and improvement areas

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: User and admin roles with appropriate permissions
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Security Headers**: Helmet.js for security best practices

### 📊 Admin Panel
- **User Management**: View and manage user accounts
- **System Analytics**: Monitor usage, performance, and health
- **Configuration**: Adjust system settings and model parameters
- **Activity Logs**: Comprehensive logging and monitoring

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first, works on all devices
- **Accessibility**: WCAG compliant with screen reader support
- **Real-time Updates**: Live streaming of generation progress
- **Intuitive Navigation**: Clean, medical-professional interface

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.11+
- SQLite 3
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/I-hashimi04/med-study-new.git
   cd med-study-new
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   npm install
   cd ..
   
   # Python worker dependencies
   cd python_worker
   pip install -r requirements.txt
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp python_worker/.env.example python_worker/.env
   
   # Edit environment variables as needed
   nano .env
   ```

4. **Database Initialization**
   ```bash
   # Initialize SQLite database
   cd data
   sqlite3 med-study.db < schema.sql
   cd ..
   ```

5. **Start the application**
   ```bash
   # Terminal 1: Start backend API
   cd backend
   npm run dev
   
   # Terminal 2: Start Python worker
   cd python_worker
   python -m uvicorn app:app --reload --port 8000
   
   # Terminal 3: Start frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Python API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Docker Deployment

```bash
# Build and run with Docker
docker build -t med-study-hub .
docker run -p 3000:3000 -p 5000:5000 -p 8000:8000 med-study-hub

# Or use Docker Compose (if you create docker-compose.yml)
docker-compose up -d
```

## 📁 Project Structure

```
med-study-new/
├── 📁 src/                     # React frontend source
│   ├── 📁 components/          # React components
│   ├── 📁 contexts/           # React contexts (Auth, etc.)
│   ├── App.js                 # Main app component
│   └── App.css               # Styling
├── 📁 backend/                # Express.js backend
│   ├── server.js              # Main server file
│   ├── db.js                  # Database connection
│   └── package.json           # Backend dependencies
├── 📁 python_worker/          # FastAPI Python service
│   ├── main.py               # FastAPI app and LLM integration
│   ├── app.py                # App entry point
│   ├── generate_tutor_questions.py  # Question generation
│   ├── review_material.py     # Content review
│   ├── upload_material.py     # File upload handling
│   └── requirements.txt       # Python dependencies
├── 📁 data/                   # Database and storage
│   └── schema.sql            # Database schema
├── 📁 public/                 # Static assets
├── 📁 .github/workflows/      # CI/CD pipelines
├── Dockerfile                 # Container configuration
├── package.json              # Frontend dependencies
└── README.md                 # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile

### Question Management
- `GET /api/cards` - Get user's study cards
- `POST /api/cards` - Create new study card
- `PUT /api/cards/:id` - Update study card
- `DELETE /api/cards/:id` - Delete study card

### Python Worker API
- `POST /api/generate-tutor-questions` - Generate questions
- `POST /api/generate-questions-stream` - Stream question generation
- `POST /api/compare-models` - Compare multiple models
- `POST /api/review-material` - Review and confirm content

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/analytics` - Get system analytics (admin only)

### Feedback
- `POST /api/feedback` - Submit question feedback

## 🧪 Testing

### Frontend Tests
```bash
npm test                    # Run React tests
npm run test:coverage      # Run with coverage
```

### Backend Tests
```bash
cd backend
npm test                   # Run Express.js tests
```

### Python Tests
```bash
cd python_worker
python -m pytest test_tutor_questions.py -v
```

### End-to-end Tests
```bash
npm run test:e2e          # Run Cypress tests (if configured)
```

## 🔒 Security Features

- **Authentication**: JWT-based secure authentication
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **HTTPS**: SSL/TLS encryption in production
- **Security Headers**: Helmet.js security middleware

## 📈 Monitoring & Logging

- **Winston Logging**: Comprehensive logging system
- **Error Tracking**: Detailed error reporting
- **Performance Monitoring**: API response time tracking
- **Health Checks**: Endpoint health monitoring
- **User Analytics**: Usage pattern analysis

## 🚀 Deployment

### Production Environment Variables

```bash
# Backend (.env)
NODE_ENV=production
JWT_SECRET=your-super-secret-production-key
DATABASE_PATH=/app/data/med-study.db
LOG_LEVEL=warn

# Python Worker (.env)
ENV=production
SECRET_KEY=your-python-secret-key
API_PORT=8000
LOG_LEVEL=WARNING

# Frontend (.env)
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_PYTHON_API_URL=https://your-domain.com/python-api
```

### Docker Production
```bash
# Build production image
docker build -t med-study-hub:latest .

# Run with production settings
docker run -d \
  --name med-study-hub \
  -p 80:3000 \
  -p 443:3000 \
  -v ./data:/app/data \
  -e NODE_ENV=production \
  med-study-hub:latest
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation
- Follow conventional commit messages
- Ensure all CI checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT models
- Anthropic for Claude
- Google for PaLM
- The medical education community
- Contributors and testers

## 📞 Support

- 📧 Email: support@medstudyhub.com
- 🐛 Issues: [GitHub Issues](https://github.com/I-hashimi04/med-study-new/issues)
- 📖 Documentation: [Wiki](https://github.com/I-hashimi04/med-study-new/wiki)
- 💬 Discussions: [GitHub Discussions](https://github.com/I-hashimi04/med-study-new/discussions)

---

**Medical Study Hub** - Empowering medical students with AI-powered learning tools 🏥✨