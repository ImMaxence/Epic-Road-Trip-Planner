/**
 * @swagger
 * /api/enjoy/get:
 *   get:
 *     summary: Obtention de données sur les loisirs
 *     description: Récuperer les informations sur les activités et loisirs dans les environs
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
    const enjoy = require("../controllers/enjoy.controller.js");
    var router = require("express").Router();

    router.get("/get", enjoy.enjoyGet);

    app.use('/api/enjoy', router);
};