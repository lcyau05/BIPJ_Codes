const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const PA = db.define('PA', {
    ageGroup: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    rsStatus: {
        type: Sequelize.STRING,
        allowNull: false
    },
    income: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    dependants: {
        type: Sequelize.STRING,
        allowNull: false
    },
    vehicle: {
        type: Sequelize.STRING,
        allowNull: false
    },
    height: {
        type: Sequelize.STRING,
        allowNull: false
    },
    weight: {
        type: Sequelize.STRING,
        allowNull: false
    },
    goals: {
        type: Sequelize.STRING,
        allowNull: false
    },
    sgoals: {
        type: Sequelize.STRING,
        allowNull: false
    },
    healthscreen: {
        type: Sequelize.STRING,
        allowNull: true
    },
    hsreport: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    aller: {
        type: Sequelize.STRING,
        allowNull: true
    },
    allergies: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    smoke: {
        type: Sequelize.STRING,
        allowNull: true
    },
    alchohol: {
        type: Sequelize.STRING,
        allowNull: true
    },
    premedic: {
        type: Sequelize.STRING,
        allowNull: true
    },
    bloodpressure: {
        type: Sequelize.STRING,
        allowNull: true
    },
    headaches: {
        type: Sequelize.STRING,
        allowNull: true
    },
    chronic: {
        type: Sequelize.STRING,
        allowNull: true
    },
    injuries: {
        type: Sequelize.STRING,
        allowNull: true
    },
    heartcond: {
        type: Sequelize.STRING,
        allowNull: true
    },
    stress1: {
        type: Sequelize.STRING,
        allowNull: false
    },
    stress2: {
        type: Sequelize.STRING,
        allowNull: false
    },
    support: {
        type: Sequelize.STRING,
        allowNull: false
    },
    sleep: {
        type: Sequelize.STRING,
        allowNull: false
    },
    diagnose: {
        type: Sequelize.STRING,
        allowNull: false
    },
    isolated: {
        type: Sequelize.STRING,
        allowNull: false
    },
    coping: {
        type: Sequelize.STRING,
        allowNull: false
    },
    feelings: {
        type: Sequelize.STRING,
        allowNull: false
    },
    activities: {
        type: Sequelize.STRING,
        allowNull: false
    },
    useless: {
        type: Sequelize.STRING,
        allowNull: false
    },
    mhScore: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    mhcategory: {
        type: Sequelize.STRING,
        allowNull: false
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    pscore: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    pcategory: {
        type: Sequelize.STRING,
        allowNull: false
    },
    userId: { // Add userId field
        type: Sequelize.INTEGER,
        allowNull: false
    }
})

module.exports = PA;