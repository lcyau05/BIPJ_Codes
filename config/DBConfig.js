//bring in sequelize
const Sequelize = require('sequelize');

//bring in db.js which contains database name, username and password
const db = require('./db');

//instantiates sequelize with database parameters
const sequelize = new Sequelize(db.name, db.username, db.password, {
    host: db.host, //Name or IP address of MySQL server
    dialect: 'mysql', //tells sequelize that MySQL is used
    port: db.port, //port where your MySQL listens to
    operatorsAliases: 0,

    define: {
        timestamps: false //dont create timestamp fields in database
    },

    pool: { //database system params, dont need to know
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
});

module.exports = sequelize;