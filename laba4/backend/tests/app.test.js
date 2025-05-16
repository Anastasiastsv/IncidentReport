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
    
    // Полная очистка БД
    await db.sequelize.sync({ force: true });
    
    // Создаем роли
    await db.role.bulkCreate([
      { id: 1, name: "user" },
      { id: 2, name: "moderator" },
      { id: 3, name: "admin" }
    ]);

    // Создаем пользователей с хешированными паролями
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

    // Генерируем токены с полными claims
    const secret = 'tsvelodubova-secret-key'; // ДОЛЖЕН СОВПАДАТЬ С ВАШИМ КОНФИГОМ!
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

  describe('Incident Routes', () => {
    test('POST /api/incidents - should create new incident (admin only)', async () => {
      const testIncident = {
        title: 'Critical Server Error',
        description: 'Server crashed during peak hours',
        type: 'critical'
      };

      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send(testIncident);

      console.log('Create Incident Response:', {
        status: res.status,
        body: res.body,
        headers: res.headers
      });

      expect(res.statusCode).toBe(201);
      testIncidentId = res.body.id;
    });

    test('GET /api/incidents - should return all incidents', async () => {
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

      console.log('Get Incidents Response:', {
        status: res.status,
        body: res.body
      });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
});