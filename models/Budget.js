const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Budget = db.define('budget', {
    category: {
        type: Sequelize.STRING,
        allowNull: false
    },
    amount: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    month: {
        type: Sequelize.STRING,
        allowNull: false
    },
    totalSpent: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
    },
    userId: { // Add userId field
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

module.exports = Budget;