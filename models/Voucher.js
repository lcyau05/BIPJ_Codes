const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
const { v4: uuidv4 } = require('uuid');

const Voucher = db.define('voucher', {
    code: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: () => uuidv4().slice(0, 8), // Generates a unique 8-character string
    },
    voucName: {
        type: Sequelize.STRING, allowNull: false
    },
    voucDesc: {
        type: Sequelize.STRING, allowNull: false
    },
    discount: {
        type: Sequelize.INTEGER, allowNull: false
    },
    expiryDate: {
        type: Sequelize.DATEONLY, allowNull: false
    },
    isActive: {
        type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true
    }
});

module.exports = Voucher;