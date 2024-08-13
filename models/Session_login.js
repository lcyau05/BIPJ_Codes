const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const session_login = db.define('session_login', {
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Reference the User model
            key: 'id' // Use the 'id' column from the User model
        }
    },
    login_time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    logout_time: {
        type: Sequelize.DATE,
        allowNull: true
    }
}, {
    timestamps: false, // No createdAt and updatedAt fields
    hooks: {
        beforeCreate: (session) => {
            session.login_time = moment(session.login_time).format('DD-MM-YYYY HH:mm:ss');
            if (session.logout_time) {
                session.logout_time = moment(session.logout_time).format('DD-MM-YYYY HH:mm:ss');
            }
        },
        beforeUpdate: (session) => {
            session.login_time = moment(session.login_time).format('DD-MM-YYYY HH:mm:ss');
            if (session.logout_time) {
                session.logout_time = moment(session.logout_time).format('DD-MM-YYYY HH:mm:ss');
            }
        }
    }
});

module.exports = session_login;