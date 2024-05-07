module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: Sequelize.STRING,
            // unique: true
        },
        email: {
            type: Sequelize.STRING,
            unique: true
        },
        password: {
            type: Sequelize.STRING,
            default: null
        },
        favoris: {
            type: Sequelize.JSON,
            default: []
        },
        dateCreationUser: {
            type: Sequelize.DATE,
            default: null
        },
    });

    return User;
};