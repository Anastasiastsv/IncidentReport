const express = require("express");
const cors = require("cors");
const winston = require('winston');
const expressWinston = require('express-winston');

// Создание экземпляра приложения
const app = express();

// Настройка логгера
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ]
});

// Логирование необработанных промисов
process.on('unhandledRejection', (ex) => {
  throw ex;
});

// Настройки CORS
var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// Логирование запросов
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute: function (req, res) { return false; }
}));

// Парсинг запросов с content-type application/json
app.use(express.json());

// Парсинг запросов с content-type application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Подключение маршрутов
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);
require('./app/routes/incident.routes')(app);

const db = require("./app/models");
const Role = db.role;

// Логирование ошибок
app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

// Синхронизация базы данных
db.sequelize.sync().then(() => {
  logger.info('Database synchronized successfully.');
  initial();
}).catch(err => {
  logger.error('Database synchronization failed:', err);
});

// Простой маршрут
app.get("/", (req, res) => {
  logger.info('Welcome message sent');
  res.json({ message: "Welcome to application." });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});
module.exports = app; // Экспортируем app для тестов
// Установка порта и прослушивание запросов
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}.`);
});

// Инициализация ролей
function initial() {
  Role.findOrCreate({
    where: { id: 1 },
    defaults: { name: "user" }
  }).then(([role, created]) => {
    if (created) logger.info('Role "user" created');
  });

  Role.findOrCreate({
    where: { id: 2 },
    defaults: { name: "moderator" }
  }).then(([role, created]) => {
    if (created) logger.info('Role "moderator" created');
  });

  Role.findOrCreate({
    where: { id: 3 },
    defaults: { name: "admin" }
  }).then(([role, created]) => {
    if (created) logger.info('Role "admin" created');
  });
}