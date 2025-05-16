const { verifySignUp, authJwt } = require("../middleware");
const AuthController = require("../controllers/auth.controller");


module.exports = function(app) {
  // Настройка CORS
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  //Роуты аунтентификации
  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    AuthController.signup
  );

  app.post("/api/auth/signin", AuthController.signin);

};