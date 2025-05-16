const { authJwt } = require("../middleware");
const incidentController = require("../controllers/incident.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  //Роуты для работы с инцидентами
  app.post(
    "/api/incidents",
    [authJwt.verifyToken],
    incidentController.create
  );

  app.get(
    "/api/incidents",
    [authJwt.verifyToken],
    incidentController.findAll
  );

  app.get(
    "/api/incidents/:id",
    [authJwt.verifyToken],
    incidentController.findOne
  );

  app.put(
    "/api/incidents/:id",
    [authJwt.verifyToken],
    incidentController.update
  );

  app.delete(
    "/api/incidents/:id",
    [authJwt.verifyToken],
    incidentController.delete
  );

  //Для администраторов-получение всех инцидентов(даже неопубликованные)
  app.get(
    "/api/incidents/admin/all",
    [authJwt.verifyToken, authJwt.isAdmin],
    incidentController.findAllAdmin
  );

  //Публичные роуты
  app.get(
    "/api/incidents/public/published",
    incidentController.findAllPublished
  );

  app.get(
    "/api/incidents/public/stats",
    incidentController.getStats
  );
};