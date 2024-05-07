const dotenv = require("dotenv");
const path = require("path");

// Spécifiez le chemin absolu vers votre fichier .env.back
const envPath = path.resolve(__dirname, "../../", ".env.back");
dotenv.config({ path: envPath });
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const specs = require("./swaggerOptions.js");
// const swaggerFile = require('./swagger_output.json')

const { OAuth2Client } = require("google-auth-library");

// =========== CONFIG =========== \\
var corsOptions = {
  origin: "*",
};

// =========== USE =========== \\
const app = express();
app.use(cors(corsOptions));
app.use(express.json());
// app.use(express.urlencoded());
app.use(express.urlencoded({ extended: true }));

// =========== SWAGGER =========== \\
app.use("/api/doc", swaggerUi.serve, swaggerUi.setup(specs));

// =========== GOOGLE OAUTH =========== \\
const oAuth2Client = new OAuth2Client(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "postmessage"
);

app.post("/auth/google", async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.code); // exchange code for tokens

  res.json(tokens);
});

// =========== BDD =========== \\
const db = require("./models/");
const Utilisateur = db.user;
const Travel = db.travel;
// Synchronisation du modèle avec la base de données
// add user id foreign key to all projects
Travel.belongsTo(Utilisateur, { foreignKey: "idUser" });
Utilisateur.hasMany(Travel, { foreignKey: "idUser" });
db.sequelize.sync();

// =========== ROUTES =========== \\
require("./routes/user.routes.js")(app);
require("./routes/enjoy.routes.js")(app);
require("./routes/sleep.routes.js")(app);
require("./routes/travel.routes.js")(app);
require("./routes/eat.routes.js")(app);
require("./routes/drink.routes.js")(app);
require("./routes/history.travel.routes.js")(app);

// =========== LISTEN =========== \\
const port = 8080;
const server = app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur le port ${port}`);
});

module.exports = { app, server };
