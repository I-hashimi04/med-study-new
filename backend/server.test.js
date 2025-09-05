const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Mock database module
jest.mock('./db', () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn()
}));

const db = require('./db');

// Create a test version of the server
const createTestApp = () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.DATABASE_PATH = ':memory:';
  
  // Import the server after setting env vars
  const app = require('./server');
  return app;
};

describe('Medical Study Hub Backend API', () => {
  let app;
  
  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  describe('Health Check', () => {
    test('GET /api/health should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Authentication', () => {
    test('POST /api/auth/register should create new user', async () => {
      db.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1 }, null);
      });

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'User registered successfully',
        token: expect.any(String),
        user: expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user'
        })
      });
    });

    test('POST /api/auth/register should reject weak password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Password must be at least 6 characters long');
    });

    test('POST /api/auth/login should authenticate valid user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'secret'
        role: 'user',
        is_active: 1
      };

      db.get.mockImplementation((query, params, callback) => {
        callback(null, mockUser);
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'secret'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Login successful',
        token: expect.any(String),
        user: expect.objectContaining({
          id: 1,
          username: 'testuser'
        })
      });
    });

    test('POST /api/auth/login should reject invalid credentials', async () => {
      db.get.mockImplementation((query, params, callback) => {
        callback(null, null); // User not found
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('Cards API', () => {
    const mockToken = 'valid-jwt-token';
    
    beforeEach(() => {
      // Mock JWT verification for authenticated routes
      jest.doMock('jsonwebtoken', () => ({
        verify: jest.fn((token, secret, callback) => {
          if (token === mockToken) {
            callback(null, { id: 1, username: 'testuser', role: 'user' });
          } else {
            callback(new Error('Invalid token'));
          }
        }),
        sign: jest.fn(() => mockToken)
      }));
    });

    test('GET /api/cards should require authentication', async () => {
      const response = await request(app)
        .get('/api/cards')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    test('GET /api/cards should return user cards when authenticated', async () => {
      const mockCards = [
        {
          id: 1,
          user_id: 1,
          question: 'Test question',
          answer: 'Test answer',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      db.all.mockImplementation((query, params, callback) => {
        callback(null, mockCards);
      });

      const response = await request(app)
        .get('/api/cards')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body).toEqual(mockCards);
    });

    test('POST /api/cards should create new card', async () => {
      db.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 2 }, null);
      });

      const newCard = {
        question: 'New question',
        answer: 'New answer',
        difficulty: 'moderate',
        tags: ['cardiology', 'diagnosis']
      };

      const response = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(newCard)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 2,
        message: 'Card created successfully'
      });
    });

    test('POST /api/cards should require question and answer', async () => {
      const response = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          question: 'Only question'
          // Missing answer
        })
        .expect(400);

      expect(response.body.error).toBe('Question and answer are required');
    });
  });

  describe('Feedback API', () => {
    const mockToken = 'valid-jwt-token';

    test('POST /api/feedback should submit feedback', async () => {
      db.run.mockImplementation((query, params, callback) => {
        callback.call({ lastID: 1 }, null);
      });

      const feedback = {
        question_id: 1,
        rating: 5,
        feedback_text: 'Great question!',
        is_helpful: true
      };

      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(feedback)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        message: 'Feedback submitted successfully'
      });
    });

    test('POST /api/feedback should require question_id', async () => {
      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          rating: 5,
          feedback_text: 'Missing question ID'
        })
        .expect(400);

      expect(response.body.error).toBe('Question ID is required');
    });
  });

  describe('Admin API', () => {
    const adminToken = 'valid-admin-token';

    beforeEach(() => {
      jest.doMock('jsonwebtoken', () => ({
        verify: jest.fn((token, secret, callback) => {
          if (token === adminToken) {
            callback(null, { id: 1, username: 'admin', role: 'admin' });
          } else {
            callback(new Error('Invalid token'));
          }
        })
      }));
    });

    test('GET /api/admin/users should require admin role', async () => {
      const userToken = 'valid-user-token';
      
      jest.doMock('jsonwebtoken', () => ({
        verify: jest.fn((token, secret, callback) => {
          if (token === userToken) {
            callback(null, { id: 2, username: 'user', role: 'user' });
          } else {
            callback(new Error('Invalid token'));
          }
        })
      }));

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });

    test('GET /api/admin/analytics should return system analytics', async () => {
      const mockAnalytics = {
        total_users: 10,
        active_users: 8,
        total_cards: 50,
        total_questions: 25,
        total_feedback: 15
      };

      // Mock multiple database calls for analytics
      db.get
        .mockImplementationOnce((query, params, callback) => callback(null, { count: 10 }))
        .mockImplementationOnce((query, params, callback) => callback(null, { count: 8 }))
        .mockImplementationOnce((query, params, callback) => callback(null, { count: 50 }))
        .mockImplementationOnce((query, params, callback) => callback(null, { count: 25 }))
        .mockImplementationOnce((query, params, callback) => callback(null, { count: 15 }));

      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual(mockAnalytics);
    });
  });

  describe('Error Handling', () => {
    test('Should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Endpoint not found');
    });

    test('Should handle database errors gracefully', async () => {
      db.all.mockImplementation((query, params, callback) => {
        callback(new Error('Database connection failed'));
      });

      const response = await request(app)
        .get('/api/cards')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});

describe('Database Schema', () => {
  test('Schema file should exist and be valid SQL', () => {
    const schemaPath = path.join(__dirname, '../data/schema.sql');
    expect(fs.existsSync(schemaPath)).toBe(true);

    const schema = fs.readFileSync(schemaPath, 'utf8');
    expect(schema).toContain('CREATE TABLE');
    expect(schema).toContain('users');
    expect(schema).toContain('cards');
    expect(schema).toContain('generated_questions');
  });
});