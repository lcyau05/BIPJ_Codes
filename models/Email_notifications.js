const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Item model
const Email_notification = db.define('email_notification', {
    email_title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email_content: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: false
    },
    attachment_filename: {
        type: Sequelize.STRING,
        allowNull: true
    },
    attachment_path: {
        type: Sequelize.STRING,
        allowNull: true
    }
});

module.exports = Email_notification;