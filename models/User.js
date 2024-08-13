const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

//Creates a user(s) table in MySQL Database. Note that Sequelize automatically pleuralizes the entity name as the table name

const User = db.define('user', {
    first_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    last_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    gender: {
        type: Sequelize.STRING,
        allowNull: false
    },
    DOB: {
        type: Sequelize.DATEONLY,
        
        allowNull: false
    },
    nric: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    phone_no: {
        type: Sequelize.STRING,
        allowNull: false
    },
    address: {
        type: Sequelize.STRING,
        allowNull: false
    },
    postal_code: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    role: {
        type: Sequelize.ENUM('Ordinary', 'Member', 'Admin'),
        allowNull: false,
        defaultValue: 'Ordinary'
    },
    membership_status: {
        type: Sequelize.ENUM('Basic', 'Yearly', 'Monthly'), allowNull: false, defaultValue: "Basic"
    },
    membership_cust_id: {
        type: Sequelize.STRING, allowNull: true
    },
    status: {
        type: Sequelize.ENUM('Active', 'Banned'),
        allowNull: false,
        defaultValue: 'Active'
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

module.exports = User;