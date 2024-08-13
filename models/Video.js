const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Video = db.define('video', {
    title: {
        type: Sequelize.STRING, allowNull: false
    },
    description: {
        type: Sequelize.STRING, allowNull: false
    },
    url: {
        type: Sequelize.TEXT, allowNull: false
    }
});

module.exports = Video;