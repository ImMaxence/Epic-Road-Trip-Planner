const db = require("../models");
const config = require("../config/auth.config");
const HistoryTravel = db.travel;
const Utilisateur = db.user;

const Op = db.Sequelize.Op;

exports.addTravel = (req, res) => {
    // Save User to Database
    HistoryTravel.create({
        idUser: req.body.idUser,
        travel: req.body.travel,
        titre: req.body.titre,
        photoProfil: req.body.photoProfil,
        dateCreation: req.body.dateCreation,
        villeDepart: req.body.villeDepart,
        villeFin: req.body.villeFin,
    })

        .then(travel => {

            res.status(200).send({
                id: travel.id,
                idUser: travel.idUser,
                travel: travel.travel,
                titre: travel.titre,
                photoProfil: travel.photoProfil,
                dateCreation: travel.dateCreation,
                villeDepart: travel.villeDepart,
                villeFin: travel.villeFin,
            });


        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "An error occurred while creating the user, maybe nickname or email is already in use"
            });
        });
};

exports.oneTravel = (req, res) => {
    const { id } = req.params;
    HistoryTravel.findOne({
        where: {
            id: id
        }
    })
        .then(travel => {
            if (!travel) {
                return res.status(404).send({ message: "Travel Not found." });
            }

            res.status(200).send({
                id: travel.id,
                idUser: travel.idUser,
                titre: travel.titre,
                travel: travel.travel,
                photoProfil: travel.photoProfil,
                dateCreation: travel.dateCreation,
                villeDepart: travel.villeDepart,
                villeFin: travel.villeFin,
            });
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
}

exports.travelAndUser = (req, res) => {
    const { id } = req.params;

    HistoryTravel.findAll({
        where: {
            id: id
        },
        include: [{
          model: Utilisateur,
          required: true, // Utilisez true si la jointure doit être effectuée seulement si la voiture a un propriétaire
          // Autres options de jointure si nécessaire
        }]
      })
        .then(travel => {
            if (!travel) {
                return res.status(404).send({ message: "Travel Not found." });
            }
            res.status(200).send(travel);

           
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
}

exports.allTravelAndUser = (req, res) => {

    HistoryTravel.findAll({

        include: [{
          model: Utilisateur,
          required: true, // Utilisez true si la jointure doit être effectuée seulement si la voiture a un propriétaire
          // Autres options de jointure si nécessaire
        }]
      })
        .then(travel => {
            if (!travel) {
                return res.status(404).send({ message: "Travel Not found." });
            }
            res.status(200).send(travel);

           
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
}

exports.travelAndUserLimit = (req, res) => {
    HistoryTravel.findAll({
        order: [
            ['id', 'DESC'] // Triez par ordre décroissant selon l'ID
        ],
        limit: 6, // Limiter le nombre de résultats à 6
        include: [{
          model: Utilisateur,
          required: true, // Utilisez true si la jointure doit être effectuée seulement si la voiture a un propriétaire
          // Autres options de jointure si nécessaire
        }]
      })
        .then(travel => {
            if (!travel) {
                return res.status(404).send({ message: "Travel Not found." });
            }
            res.status(200).send(travel);

           
        })
        .catch(err => {
            res.status(500).send({ message: err.message });
        });
}




exports.delete = (req, res) => {
    const { id } = req.params;
    HistoryTravel.findOne({
        where: {
            id: id
        }
    })
        .then(travel => {
            if (!travel) {
                return res.status(404).send({ message: "travel Not found." });
            }
            travel.destroy({
                where: { id: id }
            })
                .then(data => {
                    res.status(200).send({
                        message: "Successfully deleted travel !"
                    });
                })
                .catch(err => {
                    res.status(500).send({ message: err.message });
                })
        })
}

