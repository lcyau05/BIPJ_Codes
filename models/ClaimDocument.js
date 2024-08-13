const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const ClaimDocument = db.define('claimdocument', {
    claimId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'claims', // Name of the `claims` table
            key: 'id',
        },
    },
    invoiceid: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    documentPath: {
        type: Sequelize.STRING,
        allowNull: false,
    }
}, {
    timestamps: false, // No need for createdAt and updatedAt
});

module.exports = ClaimDocument;
