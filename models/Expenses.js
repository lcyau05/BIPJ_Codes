const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
const Budget = require('./Budget');

const Expenses = db.define('expenses', {
    transactionType: {
        type: Sequelize.STRING,
        allowNull: false
    },
    category: {
        type: Sequelize.STRING,
        allowNull: false
    },
    amount: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    transactionDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true
    },
    budgetId: { // Add the foreign key field
        type: Sequelize.INTEGER,
        references: {
            model: Budget, // Reference the Budget model
            key: 'id'
        }
    },
    month: {
        type: Sequelize.STRING,
        allowNull: false
    },
    userId: { // Add userId field
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

module.exports = Expenses;