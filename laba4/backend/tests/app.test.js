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
    
    await db.sequelize.sync({ force: true });
    
    await db.role.bulkCreate([
      { id: 1, name: "user" },
      { id: 2, name: "moderator" },
      { id: 3, name: "admin" }
    ]);

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

    await user.setRoles([1]);
    await admin.setRoles([3]);

    const secret = 'tsvelodubova-secret-key'; // Должен совпадать с config/auth.config.js
    adminToken = jwt.sign({ id: admin.id, roles: ['admin'] }, secret);
    userToken = jwt.sign({ id: user.id, roles: ['user'] }, secret);
  });

  afterAll(async () => {
    await server.close();
    await db.sequelize.close();
  });

  describe('Incident Routes', () => {
    test('POST /api/incidents - should create new incident (admin only)', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('x-access-token', adminToken) // Используем x-access-token вместо Authorization
        .send({
          title: 'Test Incident',
          description: 'Test description',
          type: 'technical'
        });

      console.log('POST Response:', {
        status: res.status,
        body: res.body,
        headers: res.headers
      });

      expect(res.statusCode).toBe(201);
      testIncidentId = res.body.id;
    });

    test('GET /api/incidents - should return all incidents', async () => {
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

      console.log('GET Response:', {
        status: res.status,
        body: res.body
      });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});