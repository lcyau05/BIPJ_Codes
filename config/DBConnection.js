const mySQLDB = require('./DBConfig');
const user = require('../models/User');
const insurance = require('../models/Insurance');
const customerinsurance = require('../models/CustomerInsurance');
const carInsurance = require('../models/CarInsurance');
const insurancebought = require('../models/InsuranceBought');
const claims = require('../models/Claims');
const claimdocument = require('../models/ClaimDocument');
const Budget = require('../models/Budget');
const Expenses = require('../models/Expenses');
const Goals = require('../models/Goals');
const Workshop = require('../models/Workshop');
const UserWorkshop = require('../models/userWorkshops');
const session_login = require('../models/Login_session');
const email_notification = require('../models/Email_notifications');
const voucher = require('../models/Voucher');
const video = require('../models/Video');


//if drop is true, all existing tables are dropped and recreated
const setUpDB = (drop) => {
    mySQLDB.authenticate()
        .then(() => {
            console.log('genwise database connected');
        })
        .then(() => {
            //defines the relationship where a user has many video. In this case the primary key from user will be a foreign key in video
            user.hasMany(insurancebought);
            claims.hasMany(claimdocument, {foreignKey: 'claimId'});
            Budget.hasMany(Expenses, { foreignKey: 'budgetId' });
            user.hasMany(Goals);
            user.hasMany(session_login, { foreignKey: 'user_id' });
            mySQLDB.sync({ //creates table if none exists
                force: drop
            }).then(() => {
                console.log('Create tables if none exists')
            }).catch(err => console.log(err))
        })
        .catch(err => console.log('Error: ' + err));
};
module.exports = { setUpDB };