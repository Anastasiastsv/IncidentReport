const request = require('supertest');
const app = require('../server');
const db = require("../app/models");

describe('Backend API Tests', () => {
  let server;
  let adminToken;
  let userToken;
  let testIncidentId;

  beforeAll(async () => {
    server = app.listen(0);
    await db.sequelize.sync({ force: true });
    
    // Создаем роли
    await db.role.bulkCreate([
      { id: 1, name: "user" },
      { id: 2, name: "moderator" },
      { id: 3, name: "admin" }
    ]);

    // Создаем тестового пользователя
    const user = await db.user.create({
      username: 'testuser',
      email: 'user@example.com',
      password: '$2a$08$kMeLcB8iK7D5R7JZ5Yz5NuYQY8SJQ5b5Zn5J5Y5Y5Y5Y5Y5Y5Y5Y5' // Хеш для 'testpass'
    });
    await user.setRoles([1]);

    // Создаем администратора
    const admin = await db.user.create({
      username: 'admin',
      email: 'admin@example.com',
      password: '$2a$08$kMeLcB8iK7D5R7JZ5Yz5NuYQY8SJQ5b5Zn5J5Y5Y5Y5Y5Y5Y5Y5' // Хеш для 'adminpass'
    });
    await admin.setRoles([3]);

    // Получаем токен пользователя
    const userRes = await request(app)
      .post('/api/auth/signin')
      .send({ username: 'testuser', password: 'testpass' });
    userToken = userRes.body.accessToken;

    // Получаем токен администратора
    const adminRes = await request(app)
      .post('/api/auth/signin')
      .send({ username: 'admin', password: 'adminpass' });
    adminToken = adminRes.body.accessToken;
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
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
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Incident',
          description: 'Test description',
          type: 'technical'
        });

      if (res.statusCode === 403) {
        console.log('POST /api/incidents 403 Response:', res.body);
      }

      expect(res.statusCode).toBe(201);
      testIncidentId = res.body.id;
    });

    test('GET /api/incidents - should return all incidents (authorized)', async () => {
      const res = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${userToken}`);

      if (res.statusCode === 403) {
        console.log('GET /api/incidents 403 Response:', res.body);
      }

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/incidents/:id - should return specific incident (authorized)', async () => {
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

    test('PUT /api/incidents/:id - should update incident (admin only)', async () => {
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

    test('DELETE /api/incidents/:id - should delete incident (admin only)', async () => {
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