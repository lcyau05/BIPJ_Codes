const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const CarInsurance = db.define('carinsurance', {
    vehNo: {
        type: Sequelize.STRING,
        allowNull: false
    },
    makemodel: {
        type: Sequelize.STRING,
        allowNull: false
    },
    registeredyear: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    carscheme: {
        type: Sequelize.STRING,
        allowNull: false
    },
    ncd: {
        type: Sequelize.STRING,
        allowNull: false
    },
    drivingLicense: {
        type: Sequelize.STRING,
        allowNull: false
    },
    claims: {
        type: Sequelize.STRING,
        allowNull: false
    },
    insurancebought: {
        type: Sequelize.STRING,
        allowNull: true
    },
    userId: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = CarInsurance;