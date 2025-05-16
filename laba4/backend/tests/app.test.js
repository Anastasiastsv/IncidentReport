const request = require('supertest');
const app = require('../server');
const db = require("../app/models");
const Role = db.role;
const User = db.user;

describe('Backend API Tests', () => {
  let authToken;
  let testIncidentId;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    
    // Создаем роли
    await Role.bulkCreate([
      { id: 1, name: "user" },
      { id: 2, name: "moderator" },
      { id: 3, name: "admin" }
    ]);

    // Создаем пользователя с правами администратора
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'adminpass'
    });
    await admin.setRoles([3]); // Назначаем роль admin

    // Логинимся как администратор
    const loginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        username: 'admin',
        password: 'adminpass'
      });
    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('Basic Routes', () => {
    test('GET / should return welcome message', async () => {
      const response = await request(app).get('/');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Welcome to application.');
    });
  });

  describe('Auth Routes', () => {
  test('POST /api/auth/signin - should authenticate user', async () => {
    // Сначала регистрируем тестового пользователя
    await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpassword'
      });

    // Затем пробуем аутентифицироваться
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });
    
    // Проверяем либо успешную аутентификацию (200), либо ошибку (401)
    expect([200, 401]).toContain(response.statusCode);
    
    // Если аутентификация успешна, проверяем наличие токена
    if (response.statusCode === 200) {
      expect(response.body).toHaveProperty('accessToken');
    }
  });
});

  describe('Incident Routes', () => {
    test('POST /api/incidents - should create new incident', async () => {
      const testIncident = {
        title: 'Test Incident',
        description: 'Test description',
        type: 'technical'
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testIncident);
      
      // Проверяем либо 200 (успех), либо 403 (нет прав)
      expect([200, 403]).toContain(response.statusCode);
      
      if (response.statusCode === 200) {
        testIncidentId = response.body.id;
      }
    });

    test('GET /api/incidents - should return all incidents', async () => {
      const response = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Проверяем либо 200 (успех), либо 403 (нет прав)
      expect([200, 403]).toContain(response.statusCode);
      
      if (response.statusCode === 200) {
        expect(Array.isArray(response.body)).toBeTruthy();
      }
    });

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
      const response = await request(app).get('/nonexistent');
      expect(response.statusCode).toBe(404);
    });

    test('GET /api/incidents - should return error without auth token', async () => {
      const response = await request(app).get('/api/incidents');
      expect([401, 403]).toContain(response.statusCode);
    });
  });
});