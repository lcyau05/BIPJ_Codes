const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
const Workshop = db.define('workshop', {  
    workshop_title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    workshop_organizer: {
        type: Sequelize.STRING,
        allowNull: false
    },
    workshop_venue: {
        type: Sequelize.STRING,
        allowNull: false
    },
    workshop_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    workshop_start_time: {
        type: Sequelize.TIME,
        allowNull: false
    },
    workshop_category: { 
        type: Sequelize.STRING,
        allowNull: false
    },
    workshop_end_time: {
        type: Sequelize.TIME,
        allowNull: false
    },
    workshop_participants_limit: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    workshop_description: {
        type: Sequelize.STRING,
        allowNull: false
    },
}, {
    timestamps: true
});

module.exports = Workshop;