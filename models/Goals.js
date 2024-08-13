const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Goals = db.define('goals', {
    category: {
        type: Sequelize.STRING,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true
    },
    targetAmount: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    currentAmount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    deadline: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    userId: { // Add userId field
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

module.exports = Goals;
