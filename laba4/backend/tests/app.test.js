const request = require('supertest');
const app = require('../server');
const db = require("../app/models");

describe('Backend API Tests', () => {
  let server;
  let authToken;
  let testIncidentId;
  let testUserId;

  beforeAll(async () => {
    server = app.listen(0);
    await db.sequelize.sync({ force: true });
    
    // Создаем роли
    await db.role.bulkCreate([
      { id: 1, name: "user" },
      { id: 2, name: "moderator" },
      { id: 3, name: "admin" }
    ]);

    // Создаем администратора
    const admin = await db.user.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'adminpass'
    });
    await admin.setRoles([3]);

    // Создаем обычного пользователя
    const user = await db.user.create({
      username: 'testuser',
      email: 'user@example.com',
      password: 'testpass'
    });
    testUserId = user.id;
    await user.setRoles([1]);

    // Получаем токен администратора
    const adminAuth = await request(app)
      .post('/api/auth/signin')
      .send({ username: 'admin', password: 'adminpass' });
    authToken = adminAuth.body.accessToken;
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
    test('POST /api/auth/signin - should authenticate user', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({ username: 'testuser', password: 'testpass' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });
  });

  describe('Incident Routes', () => {
    test('POST /api/incidents - should create new incident', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Incident',
          description: 'Test description',
          type: 'technical',
          userId: testUserId // Указываем пользователя
        });

      expect(res.statusCode).toBe(201);
      testIncidentId = res.body.id;
    });

    test('GET /api/incidents - should return all incidents', async () => {
      // Сначала создаем инцидент
      await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Incident 2',
          description: 'Test description 2',
          type: 'technical',
          userId: testUserId
        });

      const res = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /api/incidents/:id - should return specific incident', async () => {
      const res = await request(app)
        .get(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(testIncidentId);
    });

    test('PUT /api/incidents/:id - should update incident', async () => {
      const res = await request(app)
        .put(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' });

      expect(res.statusCode).toBe(200);
    });

    test('DELETE /api/incidents/:id - should delete incident', async () => {
      const res = await request(app)
        .delete(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${authToken}`);

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
      expect([401, 403]).toContain(res.statusCode); // Принимаем оба варианта
    });
  });
});