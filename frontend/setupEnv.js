import dotenv from "dotenv";

const path = require("path");

// Spécifiez le chemin absolu vers votre fichier .env.back
const envPath = path.resolve(__dirname, "../", ".env.front");
dotenv.config({ path: envPath });
