const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
const User = require('./User'); // Assuming the User model is in the same directory
const Workshop = require('./Workshop'); // Assuming the Workshop model is in the same directory

const UserWorkshop = db.define('user_workshop', {
    user_workshop_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    workshop_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Workshop,
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
}, {
    timestamps: true
});

// Define the associations
User.belongsToMany(Workshop, { through: UserWorkshop, foreignKey: 'user_id' });
Workshop.belongsToMany(User, { through: UserWorkshop, foreignKey: 'workshop_id' });

module.exports = UserWorkshop;
