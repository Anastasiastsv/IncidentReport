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
    
    // Полная очистка и инициализация БД
    await db.sequelize.sync({ force: true });
    
    // Создаем роли
    await db.role.bulkCreate([
      { id: 1, name: "user" },
      { id: 2, name: "moderator" },
      { id: 3, name: "admin" }
    ]);

    // Хеши паролей
    const hashedUserPass = bcrypt.hashSync('testpass', 8);
    const hashedAdminPass = bcrypt.hashSync('adminpass', 8);

    // Создаем пользователей
    const [user, admin] = await Promise.all([
      db.user.create({
        username: 'testuser',
        email: 'user@example.com',
        password: hashedUserPass
      }),
      db.user.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedAdminPass
      })
    ]);

    // Назначаем роли
    await Promise.all([
      user.setRoles([1]),
      admin.setRoles([3])
    ]);

    // Генерируем токены с полными claims
    const secret = 'tsvelodubova-secret-key'; 
    adminToken = jwt.sign({
      id: admin.id,
      username: admin.username,
      roles: ['admin'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60)
    }, secret);

    userToken = jwt.sign({
      id: user.id,
      username: user.username,
      roles: ['user'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60)
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
    test('POST /api/auth/signin - should authenticate user with correct credentials', async () => {
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
      const testIncident = {
        title: 'Test Incident',
        description: 'Test description',
        type: 'technical'
      };

      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send(testIncident);

      if (res.status !== 201) {
        console.error('Failed to create incident:', {
          status: res.status,
          body: res.body,
          headers: res.headers
        });
      }

      expect(res.statusCode).toBe(201);
      testIncidentId = res.body.id;
    });

    test('GET /api/incidents - should return all incidents (authorized)', async () => {
      // Fallback создание инцидента если предыдущий тест упал
      if (!testIncidentId) {
        const createRes = await request(app)
          .post('/api/incidents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Fallback Incident',
            description: 'Automatically created incident',
            type: 'minor'
          });
        testIncidentId = createRes.body.id;
      }

      const res = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${userToken}`);

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
        .set('Authorization', `Bearer ${userToken}`);

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
        .set('Authorization', `Bearer ${adminToken}`)
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
        .set('Authorization', `Bearer ${adminToken}`);

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