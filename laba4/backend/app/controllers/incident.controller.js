const db = require("../models");
const Incident = db.incidents;

const Op = db.Sequelize.Op;

// Создание нового инцидента
exports.create = (req, res) => {
  // Валидация
  if (!req.body.title) {
    return res.status(400).send({
      message: "Title cannot be empty!"
    });
  }

  // Создаем объект инцидента
  const incident = {
    title: req.body.title,
    description: req.body.description,
    published: req.body.published || false,
    year: req.body.year,
    type: req.body.type,
    status: req.body.status || 'open',
    date: req.body.date || new Date()
  };

  Incident.create(incident)
    .then(data => {
      res.status(201).send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Incident."
      });
    });
};

// Получение всех инцидентов с фильтрацией
exports.findAll = (req, res) => {
  // Добавьте проверку, что модель существует
  if (!Incident) {
    return res.status(500).send({
      message: "Incident model is not defined"
    });
  }
  const { title, year, type, status, published } = req.query;
  let where = {};

  if (title) where.title = { [Op.like]: `%${title}%` };
  if (year) where.year = year;
  if (type) where.type = type;
  if (status) where.status = status;
  if (published) where.published = published === 'true';

  Incident.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving incidents."
      });
    });
};

// Получение одного инцидента по ID
exports.findOne = (req, res) => {
  const id = req.params.id;

  Incident.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Incident with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Error retrieving Incident with id=${id}`
      });
    });
};

// Обновление инцидента по ID
exports.update = (req, res) => {
  const id = req.params.id;

  Incident.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Incident was updated successfully."
        });
      } else {
        res.status(404).send({
          message: `Cannot update Incident with id=${id}. Maybe Incident was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Error updating Incident with id=${id}`
      });
    });
};

// Удаление инцидента по ID
exports.delete = (req, res) => {
  const id = req.params.id;

  Incident.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Incident was deleted successfully!"
        });
      } else {
        res.status(404).send({
          message: `Cannot delete Incident with id=${id}. Maybe Incident was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: `Could not delete Incident with id=${id}`
      });
    });
};

// Удаление всех инцидентов
exports.deleteAll = (req, res) => {
  Incident.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Incidents were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while removing all incidents."
      });
    });
};

// Поиск всех опубликованных инцидентов
exports.findAllPublished = (req, res) => {
  Incident.findAll({ where: { published: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving published incidents."
      });
    });
};
// Получение всех инцидентов для администратора (включая неопубликованные)
exports.findAllAdmin = (req, res) => {
  const { title, year, type, status } = req.query;
  let where = {};

  // Фильтрация (без учета published)
  if (title) where.title = { [Op.like]: `%${title}%` };
  if (year) where.year = year;
  if (type) where.type = type;
  if (status) where.status = status;

  Incident.findAll({ where })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving all incidents for admin."
      });
    });
};
// Получение статистики по инцидентам
exports.getStats = (req, res) => {
  const stats = {};

  Incident.count()
    .then(count => {
      stats.total = count;
      return Incident.count({ where: { published: true } });
    })
    .then(publishedCount => {
      stats.published = publishedCount;
      return Incident.count({ where: { published: false } });
    })
    .then(unpublishedCount => {
      stats.unpublished = unpublishedCount;
      return Incident.findAll({
        attributes: [
          'type',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('type')), 'count']
        ],
        group: ['type']
      });
    })
    .then(byType => {
      stats.byType = byType;
      return Incident.findAll({
        attributes: [
          'status',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('status')), 'count']
        ],
        group: ['status']
      });
    })
    .then(byStatus => {
      stats.byStatus = byStatus;
      return Incident.findAll({
        attributes: [
          'year',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('year')), 'count']
        ],
        group: ['year'],
        order: [['year', 'ASC']]
      });
    })
    .then(byYear => {
      stats.byYear = byYear;
      res.json(stats);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving incident statistics."
      });
    });
};