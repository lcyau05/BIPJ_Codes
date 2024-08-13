const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
const sequelize = require('../config/DBConfig');
const MySQLStore = require('express-mysql-session');

const nutrition = db.define('nutrition', {
    foodCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    foodName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    calories: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true
    },
    imgpath: {
        type: Sequelize.STRING,
        allowNull: false
    }

});

module.exports = nutrition;