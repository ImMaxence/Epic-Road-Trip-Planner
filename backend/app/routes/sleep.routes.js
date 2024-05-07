/**
 * @swagger
 * /api/sleep/get:
 *   get:
 *     summary: Obtention de données sur les hébergements
 *     description: Récupérer les informations sur les hôtels et autres types d'hébergements depuis le serveur.
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
    const sleep = require("../controllers/sleep.controller.js");
    var router = require("express").Router();
    const { authJwt } = require("../middleware/index.js");

    router.get("/get", sleep.sleepGet);

    app.use('/api/sleep', router);
};