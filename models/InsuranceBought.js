const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
const { v4: uuidv4 } = require('uuid');

const InsuranceBought = db.define('insurancebought', {
    invoiceid: {
        type: Sequelize.STRING,
        allowNull: false,
    },
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
        type: Sequelize.STRING, allowNull: false
    },
    totalCost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    cardName: {
        type: Sequelize.STRING, allowNull: false,
    },
    cardType: {
        type: Sequelize.STRING, allowNull: false,
    },
    cardNo: {
        type: Sequelize.STRING, allowNull: false,
    },
    cardExp: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    claimCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    claimNewCost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

module.exports = InsuranceBought;