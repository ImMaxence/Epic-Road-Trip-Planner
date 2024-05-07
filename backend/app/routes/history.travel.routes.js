/**
 * @swagger
 * /api/user/get:
 *   get:
 *     summary: Obtention de données sur les utilisateurs
 *     description: Récupération d'information tel que le token
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         description: Jeton d'authentification Bearer
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         description: latitude et logitude tel que '48.862725,2.287592'
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: price
 *         description: Prix maximum
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: distance
 *         description: Distance maximum
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
    const travel = require("../controllers/history.travel.controller.js");
    var router = require("express").Router();
    const { authJwt } = require("../middleware/index.js");
  
    app.use(function (req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });
  
    router.post("/addTravel",[authJwt.verifyToken], travel.addTravel);
    router.get("/oneTravel/:id", travel.oneTravel);
    router.delete("/:id", travel.delete);
    router.get("/travelAndUser/:id",[authJwt.verifyToken], travel.travelAndUser);
    router.get("/travelAndUserLimit", travel.travelAndUserLimit);
    router.get("/allTravelAndUser", travel.allTravelAndUser);
  
    app.use('/api/travel', router);
  };