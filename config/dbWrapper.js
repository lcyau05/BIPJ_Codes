const mysql = require('mysql');
const db = require('./db');

const pool = mysql.createPool({
    connectionLimit: 100, // Adjust the limit as needed
    host: db.host,
    user: db.username,
    password: db.password,
    database: db.database,
    port: db.port
});

const query = (sql, values, callback) => {
    pool.query(sql, values, (err, results) => {
        if (err) {
            console.error('Database query error:', err); // Log the error to the console
            return callback(err);
        }
        callback(null, results);
    });
};
module.exports = { query };
