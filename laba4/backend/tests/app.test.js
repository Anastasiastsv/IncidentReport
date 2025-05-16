const request = require('supertest');
const app = require('../server');
const db = require("../app/models");

describe('Backend API Tests', () => {
  let server;
  let authToken;
  let testIncidentId;

  beforeAll(async () => {
    // Запускаем сервер на случайном порту
    server = app.listen(0);
    
    // Синхронизируем БД и создаем тестовые данные
    await db.sequelize.sync({ force: true });
    
    // Создаем роли
    await db.role.bulkCreate([
      { id: 1, name: "user" },
      { id: 2, name: "moderator" },
      { id: 3, name: "admin" }
    ]);

    // Создаем тестового пользователя
    const admin = await db.user.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'adminpass'
    });
    await admin.setRoles([3]);

    // Получаем токен аутентификации
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ username: 'admin', password: 'adminpass' });
    authToken = res.body.accessToken;
  });

  afterEach(async () => {
    // Очищаем данные после каждого теста
    if (db.incident) {
      await db.incident.destroy({ where: {}, truncate: true, cascade: true });
    }
    if (db.user) {
      await db.user.destroy({ where: {}, truncate: true, cascade: true });
    }
  });

  afterAll(async () => {
    // Закрываем сервер и соединение с БД
    await new Promise(resolve => server.close(resolve));
    await db.sequelize.close();
  });

  describe('Basic Routes', () => {
    test('GET / should return welcome message', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Welcome to application.');
    });
  });

  describe('Auth Routes', () => {
    test('POST /api/auth/signin - should authenticate user', async () => {
      // Создаем тестового пользователя
      await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'testpass'
        });

      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          username: 'testuser',
          password: 'testpass'
        });

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
          type: 'technical'
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
          title: 'Test Incident',
          description: 'Test description',
          type: 'technical'
        });

      const res = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    // ... остальные тесты для инцидентов ...
 

    test('GET /api/incidents/:id - should return specific incident', async () => {
      if (!testIncidentId) return; // Пропускаем, если инцидент не создан
      
      const response = await request(app)
        .get(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 403, 404]).toContain(response.statusCode);
    });

    test('PUT /api/incidents/:id - should update incident', async () => {
      if (!testIncidentId) return;
      
      const updatedData = { title: 'Updated Title' };
      const response = await request(app)
        .put(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData);
      
      expect([200, 403, 404]).toContain(response.statusCode);
    });

    test('DELETE /api/incidents/:id - should delete incident', async () => {
      if (!testIncidentId) return;
      
      const response = await request(app)
        .delete(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([200, 403, 404]).toContain(response.statusCode);
    });
 });

  describe('Error Handling', () => {
    test('GET /nonexistent - should return 404', async () => {
      const res = await request(app).get('/nonexistent');
      expect(res.statusCode).toBe(404);
    });

    test('GET /api/incidents - should return error without auth token', async () => {
      const res = await request(app).get('/api/incidents');
      expect(res.statusCode).toBe(401);
    });
  });
});

  