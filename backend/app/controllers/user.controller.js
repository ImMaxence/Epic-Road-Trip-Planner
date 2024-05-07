const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

function dateActuel() {
    // Obtention de la date actuelle
    var dateActuelle = new Date();

    // Récupération des composantes de la date
    var annee = dateActuelle.getFullYear(); // Année sur 4 chiffres
    var mois = ('0' + (dateActuelle.getMonth() + 1)).slice(-2); // Mois (ajout de 1 car les mois vont de 0 à 11)
    var jour = ('0' + dateActuelle.getDate()).slice(-2); // Jour

    // Formatage de la date
    var dateFormatee = annee + '-' + mois + '-' + jour;

    return dateFormatee; // Affichage de la date formatée AAAA-MM-JJ

}
exports.register = (req, res) => {
    // Save User to Database
    var date = dateActuel()
    User.create({
        username: req.body.username,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password),
        dateCreationUser: date
    })

        .then(user => {
            const token = jwt.sign({ id: user.id },
                config.secret,
                {
                    algorithm: 'HS256',
                    allowInsecureKeySizes: true,
                    expiresIn: 86400, // 24 hours
                });
            res.status(200).send({
                id: user.id,
                username: user.username,
                email: user.email,
                dateCreationUser: user.dateCreationUser,
                favoris: user.favoris,
                accessToken: token

            });


        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "An error occurred while creating the user, maybe nickname or email is already in use"
            });
        });
};


exports.registerGoogle = (req, res) => {
    // Save User to Database
    User.findOne({
        where: {
            email: req.body.email
        }
    }).then(user => {
        var date = dateActuel()
        if (!user) {
            User.create({
                username: req.body.username,
                email: req.body.email,
                dateCreationUser: date
            })
                .then(user => {
                    res.status(200).send({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        dateCreationUser: date,
                        favoris: user.favoris
                    });
                })
                .catch(err => {
                    res.status(500).send({
                        message: err.message || "An error occurred while creating the user, maybe nickname or email is already in use"
                    });
                });
        } else {
            res.status(200).send({
                id: user.id,
                username: user.username,
                email: user.email,
                dateCreationUser: user.dateCreationUser,
            });
        }
    })

};


exports.login = (req, res) => {
    User.findOne({
        where: {
            email: req.body.email
        }
    })
        .then(user => {
            if (!user) {
                return res.status(404).send({ message: "User Not found." });
            }

            var passwordIsValid = bcrypt.compareSync(
                req.body.password,
                user.password
            );

            if (!passwordIsValid) {
                return res.status(401).send({
                    accessToken: null,
                    message: "Invalid Password!"
                });
            }

            const token = jwt.sign({ id: user.id },
                config.secret,
                {
                    algorithm: 'HS256',
                    allowInsecureKeySizes: true,
                    expiresIn: 86400, // 24 hours
                });

            res.status(200).send({
                id: user.id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                role: user.role,
                favoris:user.favoris,
                dateCreationUser:user.dateCreationUser,

                accessToken: token
            });
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
};

exports.oneUser = (req, res) => {
    const { id } = req.params;
    User.findOne({
        where: {
            id: id
        }
    })
        .then(user => {
            if (!user) {
                return res.status(404).send({ message: "User Not found." });
            }

            res.status(200).send({
                id: user.id,
                username: user.username,
                email: user.email,
                password:user.password,
                dateCreationUser:user.dateCreationUser,
                favoris:user.favoris

            });
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
}



exports.delete = (req, res) => {
    const { id } = req.params;
    User.findOne({
        where: {
            id: id
        }
    })
        .then(user => {
            if (!user) {
                return res.status(404).send({ message: "User Not found." });
            }
            user.destroy({
                where: { id: id }
            })
                .then(data => {
                    res.status(200).send({
                        message: "Successfully deleted user !"
                    });
                })
                .catch(err => {
                    res.status(500).send({ message: err.message });
                })
        })
}


exports.oauth = (req, res) => {
    console.log("oauth")
};

exports.logout = (req, res) => {
    User.update({ connect: 0 }, { where: { id: req.body.id } })
        .then(() => {
            console.log('Deconnexion');
            res.redirect(`http://localhost:80/`);
        })
        .catch((error) => {
            console.error('Erreur lors de la mise à jour de la colonne Connect :', error);
            res.status(500).send('Erreur lors de la mise à jour de la colonne Connect');
        })
};

exports.profileGet = (req, res) => {
    console.log("profileGet")
};

exports.profilePut = (req, res) => {
    console.log("profilePut")
    const idUser = req.params.id;
    User.findOne({
        where: {
            id: idUser
        }
    })
};

exports.update = (req, res) => {
    const id = req.params.id;
    const { username, email, password, newPassword } = req.body;

    // check si le mdp de base est correct
    User.findOne({
        where: {
            id: id
        }
    }).then((user) => {
        var passwordIsValid = bcrypt.compareSync(
            password,
            user.password
        );

        if (!passwordIsValid) {
            return res.status(401).send({
                message: "Le mot de passe n'est pas correcte"
            });
        }
        var obj;
        if (newPassword) {
            var obj = {
                username: username,
                email: email,
                password: bcrypt.hashSync(newPassword),
            }
        } else {
            var obj = {
                username: username,
                email: email,
                password: bcrypt.hashSync(password),
            }
        }
        User.update(
            obj,
            {
                where: {
                    id: id,
                }
            }
        )
            .then(([rowsUpdated]) => {
                if (rowsUpdated === 0) {
                    res.status(404).json({ error: 'User not found' });
                } else {
                    res.status(201).json({ success: true });
                }
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: err.message || 'Internal Server Error' });
            });
    })
};

exports.favorisGestion = (req, res) => {
    const id = req.params.id;
    const idTravel = req.body.idTravel;

    // Récupération du tableau déjà existant
    User.findOne({
        where: {
            id: id
        }
    })
        .then(user => {
            if (!user) {
                return res.status(404).send({ message: "User Not found." });
            }

            var tabFavoris = user.favoris;

            if (!tabFavoris) {
                tabFavoris = []
            } else {
                tabFavoris = JSON.parse(tabFavoris)
            }

            tabFavoris.push(idTravel);

     
            User.update(
                {
                    favoris: tabFavoris,

                },
                {
                    where: {
                        id: id,
                    }
                }
            )
                .then(([rowsUpdated]) => {
                    if (rowsUpdated === 0) {
                        res.status(404).json({ error: 'User not found' });
                    } else {
                        res.status(201).json({ success: true });
                    }
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).json({ error: err.message || 'Internal Server Error' });
                });
        })

};

exports.favorisDelete = (req, res) => {
    const id = req.params.id;
    const idTravel = req.body.idTravel;

    // Récupération du tableau déjà existant
    User.findOne({
        where: {
            id: id
        }
    })
        .then(user => {
            if (!user) {
                return res.status(404).send({ message: "User Not found." });
            }
            var tabFavoris = user.favoris;
            if (!tabFavoris) {
                tabFavoris = []
            } else {
                tabFavoris = JSON.parse(tabFavoris)
            }
            const index = tabFavoris.indexOf(idTravel);
            if (index > -1) { // only splice array when item is found
                tabFavoris.splice(index, 1); // 2nd parameter means remove one item only
            }
            User.update(
                {
                    favoris: tabFavoris,

                },
                {
                    where: {
                        id: id,
                    }
                }
            )
                .then(([rowsUpdated]) => {
                    if (rowsUpdated === 0) {
                        res.status(404).json({ error: 'User not found' });
                    } else {
                        res.status(201).json({ success: true });
                    }
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).json({ error: err.message || 'Internal Server Error' });
                });
        })

};