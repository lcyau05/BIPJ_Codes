const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const login_session = db.define('login_session', {
    session_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Reference the User model
            key: 'id' // Use the 'id' column from the User model
        }
    },
    login_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW // Sets the default value to the current date and time
}, 
logout_at: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW // Sets the default value to the current date and time
}
});

module.exports = login_session;