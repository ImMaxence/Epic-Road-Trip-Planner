/**
 * @swagger
 * /api/user/get:
 *   get:
 *     summary: Obtention de données sur les utilisateurs
 *     description: Récupération d'information tel que le token
 *     parameters:
 *       - in: query
 *         name: latitude
 *         description: latitude tel que '48.862725'
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: longitude
 *         description: longitude tel que '2.287592'
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: condition
 *         description: condition tel qu'un JSON avec les clef "distance_max", "date_min", "date_max" et les valeurs tel que "100", "08/04/2024", "18/04/2024"
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *       500:
 *         description: Internal server error
 */


module.exports = app => {
    const user = require("../controllers/user.controller.js");
    var router = require("express").Router();
    const { verifySignUp } = require("../middleware");
    const { authJwt } = require("../middleware");
  
    app.use(function (req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });
  
    router.post(
      "/register",
      [
        verifySignUp.checkDuplicateUsernameOrEmail
        //   verifySignUp.checkRolesExisted
      ],
      user.register
    );
  
    // router.get("/profile", user.profileGet);
    router.post("/login", user.login);
    // router.post("/logout", user.logout);
    router.post("/registerGoogle", user.registerGoogle);
    // router.get("/auth", user.oauth);
    router.put("/update/:id",[authJwt.verifyToken], user.update);
    router.get("/oneUser/:id",[authJwt.verifyToken], user.oneUser);
    router.put("/favorisGestion/:id",[authJwt.verifyToken], user.favorisGestion);
    router.put("/favorisDelete/:id",[authJwt.verifyToken], user.favorisDelete);
    router.delete("/:id", user.delete);
  
    app.use('/api/users', router);
  };

