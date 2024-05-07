/**
 * @swagger
 * /api/travel/get:
 *   get:
 *     summary: Obtention des données sur les transports
 *     description: Récupérer les informations sur les transports et autres types de locomotion depuis le serveur.
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
    const travel = require("../controllers/travel.controller.js");
    var router = require("express").Router();
    const { authJwt } = require("../middleware/index.js");

    router.get("/get", travel.travelGet);

    app.use('/api/travel', router);
};