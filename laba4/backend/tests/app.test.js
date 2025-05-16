const request = require('supertest');
const app = require('../server');
const db = require("../app/models");
const bcrypt = require('bcryptjs');

describe('Backend API Tests', () => {
  let server;
  let adminToken;
  let userToken;
  let testIncidentId;

  beforeAll(async () => {
    // Запускаем сервер на случайном порту
    server = app.listen(0);
    
    // Полная пересоздание БД
    await db.sequelize.sync({ force: true });
    
    // Создаем роли
    await db.role.bulkCreate([
      { id: 1, name: "user" },
      { id: 2, name: "moderator" },
      { id: 3, name: "admin" }
    ]);

    // Хешируем пароли
    const userPassword = bcrypt.hashSync('testpass', 8);
    const adminPassword = bcrypt.hashSync('adminpass', 8);

    // Создаем тестового пользователя
    const user = await db.user.create({
      username: 'testuser',
      email: 'user@example.com',
      password: userPassword
    });
    await user.setRoles([1]);

    // Создаем администратора
    const admin = await db.user.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword
    });
    await admin.setRoles([3]);

    // Получаем токен пользователя
    const userRes = await request(app)
      .post('/api/auth/signin')
      .send({ username: 'testuser', password: 'testpass' });
    
    if (userRes.status !== 200) {
      console.error('User auth failed:', userRes.body);
    }
    userToken = userRes.body.accessToken;

    // Получаем токен администратора
    const adminRes = await request(app)
      .post('/api/auth/signin')
      .send({ username: 'admin', password: 'adminpass' });
    
    if (adminRes.status !== 200) {
      console.error('Admin auth failed:', adminRes.body);
    }
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
      // Сначала создаем инцидент, если еще не создан
      if (!testIncidentId) {
        const createRes = await request(app)
          .post('/api/incidents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Test Incident 2',
            description: 'Test description 2',
            type: 'technical'
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