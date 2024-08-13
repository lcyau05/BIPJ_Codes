const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Insurance = db.define('insurance', {
    planName: {
        type: Sequelize.STRING, allowNull: false
    },
    planCategory: {
        type: Sequelize.STRING, allowNull: false
    },
    featName: {
        type: Sequelize.STRING, allowNull: false
    },
    featCost: {
        type: Sequelize.DECIMAL(10,2), allowNull: false
    },
    featDescription: {
        type: Sequelize.STRING, allowNull: true
    },
    optionalfeat: {
        type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false
    }
});

module.exports = Insurance;