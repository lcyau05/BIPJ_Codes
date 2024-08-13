const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Claim = db.define('claim', {
    invoiceid: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    first_name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    last_name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    vehNo: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    claimDesc: {
        type: Sequelize.TEXT,
        allowNull: false,
    }, //text classify
    amountClaimed: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    dateOfIncident: {
        type: Sequelize.DATEONLY, // Stores date only
        allowNull: false,
    },
    rejDesc: {
        type: Sequelize.TEXT,
        allowNull: true,
    }, //text classify
    claimStatus: {
        type: Sequelize.ENUM('Processing', 'Approved', 'Denied'),
        allowNull: false,
        defaultValue: "Processing",
    },
    userId: {
        type: Sequelize.STRING,
        allowNull: false,
    }
},{
    timestamps: true, // If you want createdAt and updatedAt timestamps
});

module.exports = Claim;