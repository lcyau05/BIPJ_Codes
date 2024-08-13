const db = require('../config/dbWrapper');

function getDataForCharts(callback) {
    const queries = {
        genderQuery: 'SELECT gender, COUNT(*) AS count FROM users GROUP BY gender',
        growthQuery: 'SELECT DATE_FORMAT(createdAt, "%Y-%m-%d") AS day, COUNT(*) AS count FROM users GROUP BY day',
        loginQuery: 'SELECT DATE_FORMAT(login_time, "%Y-%m-%d") AS day, COUNT(*) AS count FROM session_logins GROUP BY day',
        categoryQuery: 'SELECT workshop_category, COUNT(*) AS count FROM workshops GROUP BY workshop_category'

    };

    db.query(queries.genderQuery, (err, genderResults) => {
        if (err) {
            console.error('Error fetching gender data:', err); // Log the error
            return callback(err);
        }

        db.query(queries.growthQuery, (err, growthResults) => {
            if (err) {
                console.error('Error fetching growth data:', err); // Log the error
                return callback(err);
            }
            db.query(queries.loginQuery, (err, loginResults) => {
                if (err) {
                    console.error('Error fetching login data:', err);
                    return callback(err);
                }
                db.query(queries.categoryQuery, (err, categoryResults) => {
                    if (err) {
                        console.error('Error fetching category data:', err);
                        return callback(err);
                    }

                    callback(null, {
                        genderData: genderResults,
                        growthData: growthResults,
                        loginData: loginResults,
                        categoryData: categoryResults,
                    });
                });
            });
        });
    });
}

module.exports = { getDataForCharts };
