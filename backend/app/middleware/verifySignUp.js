const db = require("../models");
const ROLES = db.ROLES;
const User = db.user;

checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Username
    // Email
    User.findOne({
      where: {
        email: req.body.email
      }
    }).then(user => {
      if (user) {
        if(user.password == null){
          res.status(400).send({
            message: "Vous vous êtes connecté avec google pour la première fois. Veuillez vous recinnecter avec google ou créer un compte"
          });
          return;
        }else {
          res.status(400).send({
            message: "Failed! Email is already in use!"
          });
          return;
        }

      }

      next();
    });
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail: checkDuplicateUsernameOrEmail,
};

module.exports = verifySignUp;