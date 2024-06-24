const mySQLDB = require('./DBConfig');
const user = require('../models/User');

//if drop is true, all existing tables are dropped and recreated
const setUpDB = (drop) => {
    mySQLDB.authenticate()
        .then(() => {
            console.log('genwise database connected');
        })
        .then(() => {
            //defines the relationship where a user has many video. In this case the primary key from user will be a foreign key in video
            //user.hasMany(video);
            mySQLDB.sync({ //creates table if none exists
                force: drop
            }).then(() => {
                console.log('Create tables if none exists')
            }).catch(err => console.log(err))
        })
        .catch(err => console.log('Error: ' + err));
};
module.exports = { setUpDB };