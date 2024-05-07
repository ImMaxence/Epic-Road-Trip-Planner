module.exports = (sequelize, Sequelize) => {
    const Travel = sequelize.define("travel", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        idUser: {
            type: Sequelize.INTEGER,
        },
        titre: {
            type: Sequelize.STRING,
        },
        travel: {
            type: Sequelize.TEXT,
        },
        photoProfil: {
            type: Sequelize.INTEGER,
        },
        dateCreation: {
            type: Sequelize.DATE,
        },
        villeDepart: {
            type: Sequelize.STRING,
        },
        villeFin: {
            type: Sequelize.STRING,
        },
    });

    return Travel;
};