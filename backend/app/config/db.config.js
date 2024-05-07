require("dotenv").config({ path: "../../../.env.back" });

const host = process.env.MYSQL_HOST;
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const db = process.env.MYSQL_DATABASE;

console.log('host',host)
console.log('user',user)
console.log('password',password)
console.log('db',db)
module.exports = {
  HOST: host,
  USER: user,
  PASSWORD: password,
  DB: db,
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
