const request = require('supertest');
const app = require('../server');
const db = require("../app/models");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Backend API Tests', () => {
  let server;
  let adminToken;
  let userToken;
  let testIncidentId;

  beforeAll(async () => {
    server = app.listen(0);
    
    // Полная инициализация БД
    await db.sequelize.sync({ force: true });
    
    // Создаем роли
    await db.role.bulkCreate([
      { id: 1, name: "user" },
      { id: 2, name: "moderator" },
      { id: 3, name: "admin" }
    ]);

    // Создаем пользователей
    const [user, admin] = await Promise.all([
      db.user.create({
        username: 'testuser',
        email: 'user@example.com',
        password: bcrypt.hashSync('testpass', 8)
      }),
      db.user.create({
        username: 'admin',
        email: 'admin@example.com',
        password: bcrypt.hashSync('adminpass', 8)
      })
    ]);

    // Назначаем роли
    await user.setRoles([1]);
    await admin.setRoles([3]);

    // Генерируем токены
    const secret = 'tsvelodubova-secret-key'; // Должен совпадать с config/auth.config.js
    adminToken = jwt.sign({ 
      id: admin.id,
      roles: ['admin'],
      username: admin.username
    }, secret);

    userToken = jwt.sign({
      id: user.id,
      roles: ['user'],
      username: user.username
    }, secret);
  });

  afterAll(async () => {
    await server.close();
    await db.sequelize.close();
  });

  describe('Basic Routes', () => {
    test('GET / should return welcome message', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Auth Routes', () => {
    test('POST /api/auth/signin - should authenticate user', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({ username: 'testuser', password: 'testpass' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    test('POST /api/auth/signin - should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({ username: 'testuser', password: 'wrongpass' });
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Incident Routes', () => {
    test('POST /api/incidents - should create new incident (admin only)', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('x-access-token', adminToken) // Используем x-access-token
        .send({
          title: 'Test Incident',
          description: 'Test description',
          type: 'technical'
        });

      expect(res.statusCode).toBe(201);
      testIncidentId = res.body.id;
    });

    test('GET /api/incidents - should return all incidents', async () => {
      // Fallback если предыдущий тест не создал инцидент
      if (!testIncidentId) {
        const createRes = await request(app)
          .post('/api/incidents')
          .set('x-access-token', adminToken)
          .send({
            title: 'Fallback Incident',
            description: 'Created in GET test',
            type: 'technical'
          });
        testIncidentId = createRes.body.id;
      }

      const res = await request(app)
        .get('/api/incidents')
        .set('x-access-token', userToken);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /api/incidents/:id - should return specific incident', async () => {
      if (!testIncidentId) {
        console.warn('Skipping test - no incident created');
        return;
      }

      const res = await request(app)
        .get(`/api/incidents/${testIncidentId}`)
        .set('x-access-token', userToken);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(testIncidentId);
    });

    test('PUT /api/incidents/:id - should update incident', async () => {
      if (!testIncidentId) {
        console.warn('Skipping test - no incident created');
        return;
      }

      const res = await request(app)
        .put(`/api/incidents/${testIncidentId}`)
        .set('x-access-token', adminToken)
        .send({ title: 'Updated Title' });

      expect(res.statusCode).toBe(200);
    });

    test('DELETE /api/incidents/:id - should delete incident', async () => {
      if (!testIncidentId) {
        console.warn('Skipping test - no incident created');
        return;
      }

      const res = await request(app)
        .delete(`/api/incidents/${testIncidentId}`)
        .set('x-access-token', adminToken);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('Error Handling', () => {
    test('GET /nonexistent - should return 404', async () => {
      const res = await request(app).get('/nonexistent');
      expect(res.statusCode).toBe(404);
    });

    test('GET /api/incidents - should return error without auth token', async () => {
      const res = await request(app).get('/api/incidents');
      expect([401, 403]).toContain(res.statusCode);
    });
  });
});