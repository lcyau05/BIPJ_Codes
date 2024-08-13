const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Expenses = require('../models/Expenses');
const Budget = require('../models/Budget');
const Goals = require('../models/Goals');
const Insurance = require('../models/Insurance');
const InsuranceBought = require('../models/InsuranceBought');
const InsuranceDetailsCars = require('../models/CarInsurance');
const Claim = require('../models/Claims');
const ClaimDocuments = require('../models/ClaimDocument');
const { CustomerInsurance, updateTotalCost } = require('../models/CustomerInsurance');
const axios = require('axios');
const { Sequelize } = require('sequelize'); // Import Sequelize
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');
const PA = require('../models/PA');
const Nutri = require('../models/Nutrition');
const Workshop = require('../models/Workshop');
const UserWorkshop = require('../models/userWorkshops');
const SessionLogin = require('../models/Login_session');
const { getDataForCharts } = require('../models/dataModels');
const Voucher = require('../models/Voucher');
const Video = require('../models/Video');
// const CryptoJS = require('crypto-js'); // Import CryptoJS for encryption/decryption
// const secretKey = process.env.SECRET_KEY;

router.get('/admindashboard', (req, res) => {
    getDataForCharts((err, data) => {
        if (err) {
            console.error('Error getting data for charts:', err); // Log the error
            return res.status(500).send('Internal Server Error');
        }
    })
    res.render('admin/details', { title: 'Admin Dashboard', getDataForCharts, layout: 'dashboard', first_name: res.locals.userName, role: res.locals.user_role });
})

//ACCOUNT MANAGEMENT:

router.get('/verify_otp', (req, res) => {
    const userId = req.user.id || req.session.userId;
    res.render('ACCOUNTS/verify_otp', {
        layout: 'main', userId, error: 'Invalid or expired OTP', first_name: res.locals.userName, role: res.locals.user_role
    });
})

router.get('/email_notifications', (req, res) => {
    res.render('ACCOUNTS/email_notifications', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role });
});

router.get('/create_workshop', (req, res) => {
    console.log("In router.get (create_workshop)")
    res.render('ACCOUNTS/create_workshop', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role });
});

router.get('/workshop_mainpage', (req, res) => {
    console.log("In router.get (workshop_mainpage)")
    res.render('ACCOUNTS/workshop_mainpage', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role });
});

// router.get('/workshop_mainpage/:category', async (req, res) => {
//     const category = req.params.category;
//     const user_role = req.user ? req.user.role : req.session.role || null; // Retrieve role from user or session
//     const userId = req.user ? req.user.id : req.session.id || null; // Retrieve role from user or session
//     try {
//         const workshops = await Workshop.findAll({
//             where: { workshop_category: category }
//         });
//         const plainWorkshops = workshops.map(workshop => workshop.get({ plain: true }));
//         console.log(plainWorkshops);
//         res.render('ACCOUNTS/workshop_category', { workshops: plainWorkshops, category , role: user_role});
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Server Error');
//     }
// });
router.get('/workshop_mainpage/:category', async (req, res) => {
    const category = req.params.category;
    const userId = req.user ? req.user.id : req.session.id || null;

    try {
        const workshops = await Workshop.findAll({
            where: { workshop_category: category },
            raw: true // Ensure raw: true to get plain objects
        });

        // Fetch participant count for each workshop
        for (let i = 0; i < workshops.length; i++) {
            const participantCount = await UserWorkshop.count({
                where: { workshop_id: workshops[i].id }
            });
            workshops[i].participantCount = participantCount;
        }

        res.render('ACCOUNTS/workshop_category', {
            workshops,
            category, first_name: res.locals.userName, role: res.locals.user_role
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Render the register workshop page

router.get('/register_workshop/:id', async (req, res) => {
    const userId = req.user ? req.user.id : req.session.id || null; // Retrieve role from user or session
    try {
        const workshop_id = req.params.id;

        // Fetch the workshop details
        const workshop = await Workshop.findOne({
            where: { id: workshop_id },
            attributes: ['id', 'workshop_title', 'workshop_organizer', 'workshop_venue', 'workshop_date', 'workshop_start_time', 'workshop_end_time', 'workshop_description', 'workshop_participants_limit'],
            raw: true
        });

        if (!workshop) {
            req.flash('error', 'Workshop not found.');
            return res.redirect('/workshop_mainpage');
        }

        // Fetch the current number of participants for the workshop
        const participantCount = await UserWorkshop.count({
            where: { workshop_id }
        });

        // Pass workshop details and participant count to the template
        res.render('ACCOUNTS/register_workshop', {
            workshop,
            participantCount, first_name: res.locals.userName, role: res.locals.user_role
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


// Handle the registration form submission
router.post('/register_workshop/:id', async (req, res) => {

    try {
        const workshop_id = req.params.id;
        const user_id = req.user ? req.user.id : req.session.id || null; // Retrieve role from user or session
        console.log(`THE USER ID IS ${user_id}`);
        // Check if the user is already registered for the workshop
        const existingBooking = await UserWorkshop.findOne({
            where: { user_id, workshop_id }
        });

        if (existingBooking) {
            req.flash('error', 'You are already registered for this workshop.');
            return res.redirect(`/register_workshop/${workshop_id}`);
        }

        // Retrieve user and workshop details
        const user = await User.findOne({ where: { id: user_id } });
        const workshop = await Workshop.findOne({ where: { id: workshop_id } });

        // Create a new booking
        await UserWorkshop.create({
            user_id,
            workshop_id
        });
        const emailBody = `Dear ${user.first_name},

You have successfully registered for the workshop titled "${workshop.workshop_title}". Here are the details:

- Workshop Date: ${workshop.workshop_date}
- Start Time: ${workshop.workshop_start_time}
- End Time: ${workshop.workshop_end_time}

We look forward to seeing you at the workshop!

Best regards,
GenWise Team`;
        sendEmail({
            to: user.email,
            subject: 'Workshop Registration Confirmation',
            body: emailBody,
            isHtml: false // Ensure the email is sent as HTML
        });

        req.flash('success', 'You have successfully registered for the workshop!');
        res.redirect('/user_bookings'); // Redirect to the user's dashboard or another appropriate page
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

router.get('/user_bookings', async (req, res) => {
    const user_id = req.user ? req.user.id : req.session.id || null;
    console.log(`THE USER ID IS ${user_id}`);

    try {
        // Fetch user bookings
        const userBookings = await UserWorkshop.findAll({
            where: { user_id },
            raw: true // returns plain objects instead of Sequelize instances
        });

        console.log('USER BOOKINGS:', JSON.stringify(userBookings, null, 2));

        // Extract workshop_ids from userBookings
        const workshopIds = userBookings.map(booking => booking.workshop_id);

        // Fetch workshops that match the extracted workshop_ids
        const workshops = await Workshop.findAll({
            where: {
                id: workshopIds
            },
            order: [
                ['workshop_title', 'ASC']
            ],
            raw: true
        });

        console.log('WORKSHOPS:', JSON.stringify(workshops, null, 2));

        // Combine the bookings with their respective workshop details
        const combinedData = userBookings.map(booking => {
            const workshop = workshops.find(w => w.id === booking.workshop_id);
            return {
                ...booking,
                workshop
            };
        });

        // Pass the combined data to the Handlebars view
        res.render('ACCOUNTS/user_bookings', {
            bookings: combinedData,
            user_id, first_name: res.locals.userName, role: res.locals.user_role
        });

    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/cancel_booking/:id', async (req, res) => {
    const bookingId = req.params.id;

    try {
        // Find the booking and delete it
        await UserWorkshop.destroy({
            where: { user_workshop_id: bookingId }
        });

        res.redirect('/user_bookings'); // Redirect back to the bookings page
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/update_workshop/:id', (req, res) => {
    const workshop_id = req.params.id  // Get workshop_id from query parameters

    console.log(`In router.get (update_workshop) with workshop_id: ${workshop_id}`);

    Workshop.findOne({
        where: { id: workshop_id },
        raw: true,
        nest: true
    })
        .then((workshop) => {
            if (workshop) {
                res.render('ACCOUNTS/update_workshop', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role, workshop_id });
            } else {
                res.status(404).send('Workshop not found');
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Server error');
        });
});

// router.post('/update_workshop/:id', (req, res) => {
//     const workshop_id = req.params.id;
//     const {
//         title,
//         organizer,
//         venue,
//         date,
//         start_time,
//         end_time,
//         description
//     } = req.body;

//     console.log(`In router.post (update_workshop) with workshop_id: ${workshop_id}`);
//     console.log('Form data:', req.body);

//     // Find the workshop by ID and update it with the new data
//     Workshop.update(
//         {
//             workshop_title: title,
//             workshop_organizer: organizer,
//             workshop_venue: venue,
//             workshop_date: date,
//             workshop_start_time: start_time,
//             workshop_end_time: end_time,
//             workshop_description: description
//         },
//         {
//             where: { id: workshop_id }
//         }
//     )
//     .then((affectedRows) => {
//         if (affectedRows > 0) {
//             req.flash('success', 'Workshop updated successfully');
//             res.redirect(`/view_workshop`);
//         } else {
//             res.status(404).send('Workshop not found');
//         }
//     })
//     .catch(err => {
//         console.error(err);
//         res.status(500).send('Server error');
//     });
// });

router.post('/update_workshop/:id', async (req, res) => {
    const today = new Date();
    const workshop_id = req.params.id;
    const {
        workshop_venue,
        workshop_description,
        workshop_date,
        workshop_participants_limit,
        workshop_start_time,
        workshop_end_time

    } = req.body;

    console.log(`In router.post (update_workshop) with workshop_id: ${workshop_id}`);
    console.log('Form data:', req.body);

    // Initialize an array to hold errors
    let errorsList = [];

    // Validate fields
    if (!workshop_venue || !workshop_description || !workshop_date || !workshop_participants_limit || !workshop_start_time || !workshop_end_time) {
        errorsList.push({ text: 'All fields are required!' });
    }

    // Validate date format (simple example, adjust as needed)
    if (workshop_date <= today) {
        errorsList.push({ text: 'Workshop date cannot be in the past!' });
    }
    if (!workshop_participants_limit || isNaN(workshop_participants_limit) || workshop_participants_limit <= 0) {
        errorsList.push({ text: 'Please enter a valid workshop participants limit!' });
    }

    if (errorsList.length > 0) {
        // Render the form again with error messages
        res.render('ACCOUNTS/update_workshop', {
            layout: 'main',
            role: req.user ? req.user.role : req.session.role || null,
            workshop_id,
            workshop_venue,
            workshop_date,
            workshop_participants_limit,
            workshop_start_time,
            workshop_end_time,
            workshop_description,
            errors: errorsList
        });
    } else {
        try {
            // Update the workshop with the new data
            const [affectedRows] = await Workshop.update(
                {
                    workshop_venue: workshop_venue,
                    workshop_date: workshop_date,
                    workshop_participants_limit: workshop_participants_limit,
                    workshop_start_time: workshop_start_time,
                    workshop_end_time: workshop_end_time,
                    workshop_description: workshop_description
                },
                {
                    where: { id: workshop_id }
                }
            );

            if (affectedRows > 0) {
                req.flash('success', 'Workshop updated successfully');
                res.redirect('/view_workshop');
            } else {
                res.status(404).send('Workshop not found');
            }
        } catch (err) {
            console.error(err);
            res.status(500).send('Server error');
        }
    }
});

router.get('/view_workshop', (req, res) => {
    console.log("in user_routes.js /view_workshop");

    Workshop.findAll({
        order: [
            ['workshop_title', 'ASC']
        ],
        raw: true,
    })
        .then(workshops => {
            // Render the user_details.handlebars view, passing in user data
            res.render('ACCOUNTS/view_workshop', {
                layout: 'main',
                workshops: workshops, first_name: res.locals.userName, role: res.locals.user_role
            });
        })
        .catch(err => console.log(err));
});

// Define the route to delete a workshop based on title
router.get('/delete_workshop', (req, res) => {
    const workshopTitle = req.body.workshop_title;

    console.log(`Received request to delete workshop with title: ${workshopTitle}`);

    if (!workshopTitle) {
        console.log("Workshop title not provided!");
        return res.redirect('/view_workshop');
    }

    Workshop.findOne({
        where: { workshop_title: workshopTitle },
        raw: true
    }).then((workshop) => {
        if (!workshop) {
            console.log("Workshop not found!");
            return res.redirect('/view_workshop');
        }

        console.log(`Found workshop: ${workshop.workshop_title}`);

        // Assuming req.workshop is set correctly and has workshop_title property
        if (req.workshop && req.workshop.workshop_title === workshop.workshop_title) {
            Workshop.destroy({
                where: { workshop_title: workshopTitle }
            }).then(() => {
                console.log("Workshop deleted!");
                res.redirect('/view_workshop');
            }).catch(err => {
                console.log(`Error deleting workshop: ${err}`);
                res.redirect('/view_workshop');
            });
        } else {
            console.log("Invalid Workshop!");
            res.redirect('/view_workshop');
        }
    }).catch(err => {
        console.log(`Error finding workshop: ${err}`);
        res.redirect('/view_workshop');
    });
});

module.exports = router;

//ACCOUNT MANAGEMENT:
router.get('/sign_up', (req, res) => {
    console.log("In router.get (sign_up)")
    res.render('ACCOUNTS/sign_up', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role });
});

router.get('/login', (req, res) => {
    res.render('ACCOUNTS/login', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role });
});

router.get('/user_details', (req, res) => {
    console.log("in user_routes.js /user_details");
    const userId = req.user.id || req.session.userId;

    User.findOne({
        where: { id: userId },
        raw: true
    })
        .then(user => {
            if (user) {
                // Render the user_details.handlebars view, passing in user data
                res.render('ACCOUNTS/user_details', {
                    layout: 'dashboard',
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    gender: user.gender,
                    nric: user.nric,
                    phone_no: user.phone_no,
                    postal_code: user.postal_code,
                    address: user.address,
                    email: user.email,
                    DOB: user.DOB,
                });
            } else {
                // Handle case where user is not found
                res.status(404).send('User not found');
            }
        })
        .catch(err => {
            console.error('Error fetching user from database:', err);
            res.status(500).send('Internal Server Error');
        });
});

router.get('/logout', async function (req, res, next) {
    console.log("Logging Out");
    try {
        // Assuming req.user contains the user's ID
        const userId = req.user.id;

        // Update the logout_time for the user's session
        await SessionLogin.update(
            { logout_time: new Date() },
            {
                where: {
                    user_id: userId,
                    logout_time: null, // Update only the active session
                }
            }
        );
        req.logout(function (err) {
            if (err) {
                return next(err);
            }
            req.session.destroy(function (err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/');
            });
        });
    } catch (err) {
        next(err);
    }
});


router.get('/user_update', (req, res) => {
    // The user ID is available in req.user.id
    const userId = req.user ? req.user.id : null; // Ensure userId is available
    User.findOne({
        where: { id: userId },
        raw: true,
        nest: true
    })
        .then((user) => {
            if (user) {
                res.render('ACCOUNTS/user_update', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role });
            } else {
                res.status(404).send('User not found');
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Server error');
        });
});

//ACCOUNT MANAGEMENT END;



//kh start

router.get('/nutrition', async (req, res) => {
    Nutri.findAll({
        order: [
            ['foodCode', 'ASC']
        ],
        raw: true
    })
        .then((Nutris) => {
            //pass object to review.handlebar
            res.render('nutrition/menu_assess', {
                layout: 'main',
                Nutris, first_name: res.locals.userName, role: res.locals.user_role
            });
        })
        .catch(err => console.log(err));
});

router.get('/review', (req, res) => {
    PA.findAll({
        order: [
            ['ageGroup', 'ASC']
        ],
        raw: true
    })
        .then((PAs) => {
            //pass object to review.handlebar
            res.render('assessment_admin/review', {
                layout: 'main',
                PAs, first_name: res.locals.userName, role: res.locals.user_role
            });
        })
        .catch(err => console.log(err));

});

router.get('/answer', async (req, res) => {
    try {
        // Fetch data from PA table based on userId
        const paData = await PA.findOne({
            where: { userId: req.user.id },
            raw: true
        });

        if (!paData) {
            return res.status(404).send('No data found for the user');
        }

        // Extract mental health and physical health data
        const { mhcategory, pcategory, mhScore, pscore } = paData;

        console.log('Retrieved Data:', { mhcategory, pcategory, mhScore, pscore }); // Debug log

        // Calculate messages based on retrieved data
        let mhMessage = '';
        let pMessage = '';

        if (mhcategory === 'High Risk') {
            mhMessage = 'Please consult with a healthcare provider for more guidance on managing your mental health.';
        } else {
            mhMessage = 'Your mental health is in the safe category. Keep up the good work and continue maintaining a healthy lifestyle!';
        }

        if (pcategory === 'High Risk') {
            pMessage = 'Your physical health is in the high-risk category. It\'s recommended that you see a healthcare professional for further advice.';
        } else {
            pMessage = 'Your physical health is not in the high-risk category. Keep focusing on a balanced diet and regular exercise!';
        }

        // Render the 'results' view, passing the data
        res.render('assessment/results', {
            mhMessage,
            pMessage,
            mhScore,
            pscore,
            layout: 'main', first_name: res.locals.userName, role: res.locals.user_role // Specify the layout here within the data object
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Server error');
    }
});


router.get('/nutriDisplay', (req, res) => {
    Nutri.findAll({
        order: [
            ['foodCode', 'ASC']
        ],
        raw: true
    })
        .then((Nutris) => {
            //pass object to review.handlebar
            res.render('nutrition/menu_display', {
                layout: 'main',
                Nutris, first_name: res.locals.userName, role: res.locals.user_role
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Server Error');
        });
});

// New route to render the record detail page
router.get('/record', async (req, res) => {
    try {
        // Fetch the record details from your database
        const recordInstance = await PA.findByPk(req.params.id);

        if (!recordInstance) {
            return res.status(404).send('Record not found');
        }

        // Convert Sequelize instance to a plain object
        const record = recordInstance.get({ plain: true });

        // req.session.record = record;

        // Render the record detail page with the record details
        res.render('assessment_admin/recordDetail', {
            layout: 'main',
            record, first_name: res.locals.userName, role: res.locals.user_role
        });
    } catch (error) {
        console.error('Error fetching record:', error);
        res.status(500).send('Error fetching record');
    }
});

// Delete for PA
router.delete('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const pa = await PA.findOne({ where: { id } });

        if (!pa) {
            return res.status(404).send({ message: 'Record not found' });
        }

        await pa.destroy({ where: { id } });
        res.status(200).send({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).send({ message: 'Failed to delete the record' });
    }
});

// Delete for Menu
router.delete('/deleteMenu/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const nutri = await Nutri.findOne({ where: { id } });

        if (!nutri) {
            return res.status(404).send({ message: 'Record not found' });
        }

        await nutri.destroy({ where: { id } });
        res.status(200).send({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).send({ message: 'Failed to delete the record' });
    }
});

router.get('/mainpage', (req, res) => {
    res.render('assessment/mainpage', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

router.get('/nutritionform', (req, res) => {
    res.render('nutrition/menu_form', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

router.get('/dashboard', (req, res) => {
    res.render('nutrition/menu_dashboard', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

router.get('/physicalhealth', (req, res) => {
    res.render('assessment/physicalhealth', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

router.get('/mentalhealth', (req, res) => {
    res.render('assessment/mentalhealth', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

//kh end



//kristin start
router.get('/expensesdashboard', async (req, res) => {
    try {
        // GET MONTH AND YEAR OF CURRENT AND 4 MONTHS BEFORE THE CURRENT DATE 
        // endDate is the first day of the month
        // The startOf('month') modifies the moment object to represent the beginning of the current month
        // startDate is the first day of the month that is 4 months before the current month
        // E.g, endDate = July 1, 2024, startDate = March 1, 2024
        const currentDate = moment();
        const endDate = currentDate.startOf('month').toDate();
        const startDate = moment(endDate).subtract(4, 'months').startOf('month').toDate();

        // FETCH ALL EXPENSES ORDERED BY DATE ASCENDING 
        // Expenses.findAll is a sequelize method that retreives all records from Expenses model
        // Ordered by transaction date in ascending order (earliest transaction first)
        const expenses = await Expenses.findAll({
            where: { userId: req.user.id },
            order: [['transactionDate', 'ASC']],
            raw: true
        });

        // FETCH LATEST 5 EXPENSES FROM MOST RECENT TRANSACTIONS 
        // Ordered by transaction date in descending order (latest transaction first)
        // Limit is set to 5 because I only want to show latest 5 transactions 
        const latestExpenses = await Expenses.findAll({
            order: [['transactionDate', 'DESC']],
            limit: 5,
            raw: true
        });

        // DETERMINE THE SELECTED MONTH AND YEAR 
        // req.query.month gets the selected month from the query parameter 'month' 
        // If it is not provided, it defaults to the current month and year
        const selectedMonth = req.query.month || moment().format('MMMM YYYY');
        const [monthName, year] = selectedMonth.split(' ');
        // Creates a moment object for the first day of the selected month and convert it to a Javascipt date object
        const selectedStartDate = moment(`${monthName} 1, ${year}`, 'MMMM D, YYYY').startOf('month').toDate();
        // Creates a moment object for the last day of the selected month and converts it to a Javascript date object
        const selectedEndDate = moment(selectedStartDate).endOf('month').toDate();

        // FILTERS EXPENSES FOR SELECTED MONTH 
        // Filters the expenses array to include only the expenses where the transaction date falls within the selected month's date range
        const selectedMonthExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.transactionDate);
            return expenseDate >= selectedStartDate && expenseDate <= selectedEndDate;
        });

        // CALCULATE NET CASHFLOW, MONEY IN AND MONEY OUT
        // Computes the net cashflow for the selected month
        // Adds amounts for income transactions and subtracts amount for expense transactions
        const netCashflow = selectedMonthExpenses.reduce((sum, expense) => {
            return expense.transactionType === 'income' ? sum + expense.amount : sum - expense.amount;
        }, 0);

        // Sums up amount for transactions categorised as income for the selected month 
        const moneyIn = selectedMonthExpenses
            .filter(exp => exp.transactionType === 'income')
            .reduce((sum, exp) => sum + exp.amount, 0);

        // Sums up amount for transactions categorised as expense for the selected month 
        const moneyOut = selectedMonthExpenses
            .filter(exp => exp.transactionType === 'expense')
            .reduce((sum, exp) => sum + exp.amount, 0);

        const monthlyData = calculateMonthlyData(expenses);

        // fixedCategories defines a list of expenses category
        // categorisedExpenses creates an object where each key is a category from fixedCategories
        // For each category, it calculates the total amount of expenses in that category for the selected month
        const fixedCategories = ['transfer', 'dining', 'transportation', 'shopping', 'entertainment', 'others'];
        const categorizedExpenses = fixedCategories.reduce((acc, category) => {
            acc[category] = {
                category,
                amount: selectedMonthExpenses
                    .filter(expense => expense.category === category && expense.transactionType === 'expense')
                    .reduce((sum, expense) => sum + expense.amount, 0)
            };
            return acc;
        }, {});

        // Filter to only include "transfer" category for income in the selected month
        const categorizedIncome = fixedCategories.reduce((acc, category) => {
            if (category === 'transfer') {
                acc[category] = {
                    category,
                    amount: selectedMonthExpenses
                        .filter(expense => expense.category === category && expense.transactionType === 'income')
                        .reduce((sum, expense) => sum + expense.amount, 0)
                };
            }
            return acc;
        }, {});

        // Generate fixed 5 months range
        const months = getMonthsInRange(startDate, endDate);

        res.render('expenses/expensesdashboard', {
            layout: 'main',
            // JSON is a javascript method used to convert the monthlyData object into a JSON string
            // This is neccessary when you want to pass Javascript objects from the server-side to the client-side in a format that the client-side can easily parse and use
            monthlyData: JSON.stringify(monthlyData),
            moneyIn,
            moneyOut,
            netCashflow,
            categorizedExpenses: Object.values(categorizedExpenses),
            categorizedIncome: Object.values(categorizedIncome), // Add this line
            latestExpenses,
            selectedMonth,
            months, first_name: res.locals.userName, role: res.locals.user_role
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

function calculateMonthlyData(expenses) {
    const monthlyData = {};
    const currentDate = new Date();
    // Loop that cover the last 5 months including the current month 
    for (let i = 4; i >= 0; i--) {
        // currentDate.getFullYear() extracts the full year from currentDate object
        // E.g, if currentDate is July 25, 2024, it returns 2024
        // currentDate.getMonth() - i caluculates the the target month by subtracting i from the current month
        // currentDate.getMonth() returns month index (0 - January ... 6 - July)
        // E.g, currentDate is July 2024 (index 6)
        // When i = 3; 6 - 3 = 3 (April)
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        // Extracts the month name from the date object
        // E.g, 'January'
        const month = date.toLocaleString('default', { month: 'long' });
        // By default is 0 
        monthlyData[month] = { moneyIn: 0, moneyOut: 0 };
    }

    // Loop for each expenses in the Expenses array
    expenses.forEach(expense => {
        // expenseDate is created from the transactionDate of the Expenses
        const expenseDate = new Date(expense.transactionDate);
        // Extract the month from the expenseDate
        const month = expenseDate.toLocaleString('default', { month: 'long' });

        // This checks if the month extracted from expenseDate exists as a key in the monthlyData object
        if (monthlyData[month]) {
            // If transactons of the current expense is income, the code adds the expense.amount to the moneyIn value for that month in monthlyData
            if (expense.transactionType === 'income') {
                monthlyData[month].moneyIn += expense.amount;
                // If transactons of the current expense is NOT income, the code adds the expense.amount to the moneyOut value for that month in monthlyData
            } else if (expense.transactionType === 'expense') {
                monthlyData[month].moneyOut += expense.amount;
            }
        }
    });

    return monthlyData;
}

function getMonthsInRange(startDate, endDate) {
    const months = [];
    let currentDate = new Date(startDate);
    // This while loop continues to run as long as currentDate is less than or equal to endDate
    while (currentDate <= endDate) {
        // Fomats the currentDate as a month-year string using moment 
        // E.g, January 2024
        // push = Added to the months array
        months.push(moment(currentDate).format('MMMM YYYY'));
        // Increments the month of currentDate by 1 and sets the same day of the following month
        // E.g, currentDate is 15 January, once set it + 1 to becom 15 Febuaray 
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
}

// View All Transactions Route
router.get('/viewalltransactions', async (req, res) => {
    try {
        const expenses = await Expenses.findAll({
            where: { userId: req.user.id },
            order: [['transactionDate', 'ASC']],
            raw: true
        });

        const fixedCategories = ['transfer', 'dining', 'transportation', 'shopping', 'entertainment', 'others'];
        const categorizedExpenses = fixedCategories.reduce((acc, category) => {
            acc[category] = {
                category,
                amount: expenses
                    // Filter out income transactions and only view category for expenses only
                    .filter(expense => expense.category === category && expense.transactionType === 'expense')
                    .reduce((sum, expense) => sum + expense.amount, 0)
            };
            return acc;
        }, {});

        res.render('expenses/viewalltransactions', {
            layout: 'main',
            expenses,
            categorizedExpenses, first_name: res.locals.userName, role: res.locals.user_role
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


router.get('/expensesform', (req, res) => {
    res.render('expenses/expensesform', { layout: 'main', exDir: 'expensesform', first_name: res.locals.userName, role: res.locals.user_role });
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const expense = await Expenses.findOne({ where: { id } });

        if (!expense) {
            return res.status(404).send({ message: 'Expense not found' });
        }

        const budget = await Budget.findOne({ where: { id: expense.budgetId } });

        if (budget) {
            const newTotalSpent = parseFloat(budget.totalSpent) - parseFloat(expense.amount);
            await Budget.update({ totalSpent: newTotalSpent.toFixed(2) }, { where: { id: budget.id } });

            const useremail = await User.findOne({
                attributes: ['email'],
                where: { id: expense.userId }
            });

            const budgetAmount = parseFloat(budget.amount);
            const percentageSpent = (newTotalSpent / budgetAmount) * 100;
            const remainingAmount = (budgetAmount - newTotalSpent).toFixed(2);

            // Send email notifications if needed
            if (percentageSpent >= 50 && percentageSpent < 100) {
                const emailBody = `
                    <p>You have reached 50% of your budget for the category: <strong>${category}</strong> for the month of <strong>${transactionMonth}</strong>.</p>
                    <p><strong>Total Spent:</strong> $${newTotalSpent.toFixed(2)}</p>
                    <p><strong>Remaining Amount:</strong> $${remainingAmount}</p>
                `;
                await sendEmail({
                    to: useremail.email,
                    subject: 'GenWise - Budget Alert: 50% Reached',
                    body: emailBody,
                    isHtml: true
                });
            } else if (percentageSpent >= 100) {
                const overshotAmount = (newTotalSpent - budgetAmount).toFixed(2);
                const emailBody = `
                    <p>You have reached 100% of your budget for the category: <strong>${category}</strong> for the month of <strong>${transactionMonth}</strong>.</p>
                    <p><strong>Total Spent:</strong> $${newTotalSpent.toFixed(2)}</p>
                    <p><strong>Overshot Amount:</strong> $${overshotAmount}</p>
                    <p><strong>Remaining Amount:</strong> $${remainingAmount}</p>
                `;
                await sendEmail({
                    to: useremail.email,
                    subject: 'GenWise - Budget Alert: 100% Reached',
                    body: emailBody,
                    isHtml: true
                });
            }
        }

        await Expenses.destroy({ where: { id } });
        res.status(200).send({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).send({ message: 'Failed to delete the transaction' });
    }
});

router.get('/budgetform', (req, res) => {
    res.render('budget/budgetform', { layout: 'main', budDir: 'budgetform', first_name: res.locals.userName, role: res.locals.user_role });
});

router.get('/budgetdashboard', async (req, res) => {
    try {
        const budgets = await Budget.findAll({
            where: { userId: req.user.id }, // Assume userId is stored in session
            order: [['category', 'ASC']],
            raw: true
        });

        // Calculate total spent for each budget category
        const updatedBudgets = budgets.map(budget => {
            const totalSpent = parseFloat(budget.totalSpent) || 0; // Make sure totalSpent is a number
            const amount = parseFloat(budget.amount);
            const remainingAmount = amount - totalSpent;
            console.log('remainingAmount', remainingAmount);
            const progress = amount > 0 ? (totalSpent / amount) * 100 : 0;

            return {
                ...budget,
                totalSpent: totalSpent.toFixed(2),
                remainingAmount: remainingAmount.toFixed(2),
                progress: progress.toFixed(2)
            };
        });
        console.log('updatedBuidget: ', updatedBudgets)

        res.render('budget/budgetdashboard', {
            layout: 'main',
            budget: updatedBudgets, first_name: res.locals.userName, role: res.locals.user_role
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.get('/predictivebudget', async (req, res) => {
    try {
        const userId = req.user.id;;

        // Aggregate expenses by category and calculate the average
        const expenses = await Expenses.findAll({
            where: { userId, transactionType: 'expense' },
            // Calculate the average amount
            attributes: ['category', [Sequelize.fn('AVG', Sequelize.col('amount')), 'averageAmount']],
            // Group results by category
            group: ['category']
        });

        const categoryAverages = {};
        expenses.forEach(expense => {
            categoryAverages[expense.category] = expense.get('averageAmount');
        });

        res.json(categoryAverages);
    } catch (error) {
        console.error('Error fetching predictive budget:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Goals Dashboard Route
// API route to fetch goals data
router.get('/api/goals', (req, res) => {
    Goals.findAll({
        where: { userId: req.user.id },
        order: [['deadline', 'ASC']],
        raw: true
    })
        .then(goals => {
            res.json(goals); // Return data as JSON
        })
        .catch(err => {
            console.error(err);
            res.status(500).send({ message: 'Failed to fetch goals' });
        });
});

router.get('/goalsdashboard', (req, res) => {
    Goals.findAll({
        where: { userId: req.user.id },
        order: [['deadline', 'ASC']],
        raw: true
    })
        .then(goals => {
            res.render('goals/goalsdashboard', {
                layout: 'main',
                goals, first_name: res.locals.userName, role: res.locals.user_role
            });
        })
        .catch(err => console.error(err));
});

// Goals Form Route
router.get('/goalsform', (req, res) => {
    res.render('goals/goalsform', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role });
});

router.delete('/deleteGoal/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const goal = await Goals.findOne({ where: { id } });

        if (!goal) {
            return res.status(404).send({ message: 'Goal not found' });
        }

        await Goals.destroy({ where: { id } });
        res.status(200).send({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).send({ message: 'Failed to delete the goal' });
    }
});
//kristin end

//caleb start
router.get('/vidvouch', async (req, res) => {
    try {
        const videos = await Video.findAll();
        const vouchers = await Voucher.findAll();
        res.render('caleb/caleb_admin', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role, videos: videos, vouchers: vouchers })
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/uservidvouch', async (req, res) => {
    res.render('caleb/video_vouchers', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

router.get('/api/videos', async (req, res) => {
    const videos = await Video.findAll();
    res.json(videos);
});

router.get('/api/vouchers', async(req, res) => {
    const vouchers = await Voucher.findAll();
    res.json(vouchers);
});

// Get a video by ID (for AJAX)
router.get('/video/:id', async (req, res) => {
    try {
        const video = await Video.findByPk(req.params.id);
        if (!video) return res.status(404).send('Video not found');
        res.json(video);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST route for creating a new video
router.post('/createvideo', async (req, res) => {
    try {
        const { title, description, url } = req.body;
        if (!title || !description || !url) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newVideo = await Video.create({ title, description, url });
        res.status(201).json(newVideo); // Respond with the created video
    } catch (err) {
        console.error('Error creating video:', err); // Log the error
        res.status(500).json({ message: 'Internal Server Error' }); // Respond with a JSON error message
    }
});
// Update an existing video
router.put('/video/:id', async (req, res) => {
    try {
        const video = await Video.findByPk(req.params.id);
        console.log('updating...video');
        if (!video) return res.status(404).send('Video not found');
        await video.update(req.body);
        res.json({ success: true }); // Respond with JSON instead of redirect
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Delete a video
router.delete('/video/:id', async (req, res) => {
    try {
        const video = await Video.findByPk(req.params.id);
        if (!video) return res.status(404).send('Video not found');
        await video.destroy();
        res.redirect('/vidvouch');
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// Get a voucher by ID (for AJAX)
router.get('/voucher/:id', async (req, res) => {
    try {
        const voucher = await Voucher.findByPk(req.params.id);
        if (!voucher) return res.status(404).send('Voucher not found');
        res.json(voucher);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Create a new voucher
router.post('/createvoucher', async (req, res) => {
    try {
        await Voucher.create(req.body);
        res.json({ success: true }); // Respond with JSON instead of redirect
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Update an existing voucher
router.put('/voucher/:id', async (req, res) => {
    try {
        const voucher = await Voucher.findByPk(req.params.id);
        console.log('updating...voucher');
        if (!voucher) return res.status(404).send('Voucher not found');
        await voucher.update(req.body);
        console.log('updating...voucher', voucher);
        res.json({ success: true }); // Respond with JSON instead of redirect
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Delete a voucher
router.delete('/voucher/:id', async (req, res) => {
    try {
        const voucher = await Voucher.findByPk(req.params.id);
        if (!voucher) return res.status(404).send('Voucher not found');
        await voucher.destroy();
        res.redirect('/vidvouch');
    } catch (err) {
        res.status(500).send(err.message);
    }
});
//caleb end

//Icyau05 start

router.get('/create_insurance', (req, res) => {
    res.render('Icyau05/create_insurance', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

router.get('/life', (req, res) => {
    res.render('Icyau05/life', { layout: 'main_insurance', first_name: res.locals.userName, role: res.locals.user_role });
});

router.get('/medical', (req, res) => {
    res.render('Icyau05/medical', { layout: 'main_insurance', first_name: res.locals.userName, role: res.locals.user_role });
});

router.get('/travel', (req, res) => {
    res.render('Icyau05/travel', { layout: 'main_insurance', first_name: res.locals.userName, role: res.locals.user_role });
});

router.get('/insur_home', (req, res) => {
    res.render('Icyau05/insur_home', { layout: 'main_insurance', first_name: res.locals.userName, role: res.locals.user_role });
});

router.get('/payment', (req, res) => {
    res.render('Icyau05/payment', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

router.get('/paymentsuccess', async (req, res) => {
    const userId = req.user.id;
    try {
        await CustomerInsurance.destroy({
            where: { userId: userId }
        });
        console.log('CustomerInsurance data deleted for user:', userId);
    } catch (error) {
        console.log('Error deleting CustomerInsurance data:', error);
    }
    res.render('Icyau05/payment_success', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

router.get('/claimsuccess', (req, res) => {
    res.render('Icyau05/claimSuccess', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

router.get('/fileclaim', async (req, res) => {
    const invoiceid = req.session.invoiceid;
    const role = res.locals.user_role;
    const claimId = req.session.claimId;
    console.log('claim id is: ', claimId);
    let claim = null;
    let claimDocuments = [];

    const insurance = await InsuranceBought.findOne({
        where: {
            invoiceid: invoiceid
        },
        raw: true
    });

    const user = await User.findOne({
        where: {
            id: insurance.userId
        },
        raw: true
    });

    const details = await InsuranceDetailsCars.findOne({
        where: {
            userId: insurance.userId, insurancebought: invoiceid
        },
        raw: true
    });

    if (role === 'Admin' && claimId) {
        console.log('its happening!!!')
        claim = await Claim.findOne({
            where: {
                id: claimId
            },
            raw: true
        });

        // Retrieve claim documents
        claimDocuments = await ClaimDocuments.findAll({
            where: {
                claimId: claimId
            },
            raw: true
        });
    }

    res.render('Icyau05/fileclaim', { layout: 'main', insurance: insurance, user: user, details: details, role: role, claim: claim, claimDocuments: claimDocuments, first_name: res.locals.userName });
});

router.get('/insurdashboard', async (req, res) => {
    try {
        const userId = req.user.id;
        const role = res.locals.user_role;
        // Initialize query conditions based on role
        const insuranceQuery = role === 'Admin' ? {} : { userId };
        const claimQuery = role === 'Admin' ? {} : { userId };

        const distinctInvoices = await InsuranceBought.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('invoiceid')), 'invoiceid']],
            where: insuranceQuery,
            raw: true
        });

        const invoiceIds = distinctInvoices.map(inv => inv.invoiceid);
        console.log('invoice id: ' + invoiceIds);

        // Get the maximum id for each invoiceid
        const maxIds = await InsuranceBought.findAll({
            attributes: [
                [Sequelize.fn('MAX', Sequelize.col('id')), 'id']
            ],
            where: {
                invoiceid: invoiceIds
            },
            group: ['invoiceid'],
            raw: true
        });

        const maxIdsArray = maxIds.map(row => row.id);
        console.log('max ids: ' + maxIdsArray);

        // Retrieve full records for the maximum ids
        const insurance = await InsuranceBought.findAll({
            where: {
                id: maxIdsArray
            },
            raw: true
        });

        const details = await InsuranceDetailsCars.findAll({
            where: {
                insurancebought: invoiceIds, ...insuranceQuery
            },
            raw: true
        });

        // Retrieve claims based on invoiceid and userId
        const claims = await Claim.findAll({
            where: {
                invoiceid: invoiceIds,
                ...claimQuery
            },
            raw: true
        });

        const insurancePlans = await Insurance.findAll();

        // Merge details with insurance data
        const mergedData = insurance.map(ins => {
            const detail = details.find(d => d.insurancebought === ins.invoiceid);
            const claim = claims.find(c => c.invoiceid === ins.invoiceid);
            return {
                ...ins,
                vehNo: detail ? detail.vehNo : null, // Add vehNo to insurance data
                claim: claim ? claim : null // Add claim data if present
            };
        });

        const user = await User.findByPk(userId, { raw: true });
        console.log('Details: ', details);
        console.log('Insurance:', insurance); // Check insurance data
        console.log('User:', user); // Check user data
        console.log('role', role);

        const uniqueCategories = await Insurance.findAll({
            attributes: [
                [Sequelize.fn('DISTINCT', Sequelize.col('planCategory')), 'planCategory']
            ],
            raw: true // Returns plain data instead of Sequelize model instances
        });

        res.render('Icyau05/overallinsurance', {
            insurance: mergedData,
            user: user,
            insurancePlans: insurancePlans,
            uniqueCategories: uniqueCategories.map(cat => cat.planCategory), // Extract category values
            layout: 'dashboard', first_name: res.locals.userName, role: role
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Error fetching data');
    }
});

router.get('/upgrade', (req, res) => {
    console.log("user:", req.user)
    console.log(req.user.membership_status === 'Yearly')
    User.findOne({
        where: {
            id: req.user.id
        },
        raw: true
    })
        .then((user) => {
            //pass object to listVideos.handlebar
            res.render('Icyau05/membership_upgrade', { //pass object to listVideos.handlebar
                user: user, layout: 'main', first_name: res.locals.userName, role: res.locals.user_role
            });
        })
        .catch(err => console.log(err));
});

router.get('/insurancehome', async (req, res) => {
    try {
        // Check if cloning has already been done for this user
        if (req.session.cloningDone) {
            // Cloning already done, render the page directly
            return res.render('Icyau05/insurance_home', { layout: 'main_insurance', first_name: res.locals.userName, role: res.locals.user_role });
        }
        // Sync the new table to ensure it exists
        await CustomerInsurance.sync({ force: true });
        // Get user_id from session (assuming it's stored there)
        const userId = req.user.id; // Adjust as per your session setup
        // Copy data from the Insurance table to the CustomerChoice table
        const insuranceData = await Insurance.findAll();
        // Log the insuranceData to troubleshoot the issue
        console.log(insuranceData);
        // Check if insuranceData is an array before mapping
        if (Array.isArray(insuranceData)) {
            const customerChoiceData = insuranceData.map(record => {
                const jsonData = record.toJSON();
                return {
                    ...jsonData,
                    userId: userId // Add user_id from session to each record
                };
            });

            await CustomerInsurance.bulkCreate(customerChoiceData);
            // Set flag in session to indicate cloning has been done
            req.session.cloningDone = true;
            res.render('Icyau05/insurance_home', { layout: 'main_insurance', first_name: res.locals.userName, role: res.locals.user_role });
        } else {
            throw new Error('Insurance data is not an array');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Error cloning table');
    }
});

router.get('/Car', async (req, res) => {

    try {
        const baseUrl = "https://data.gov.sg/api/action/datastore_search";
        const url = baseUrl + "?resource_id=d_d3f4d708e1d0a37b4365414e2fad3a07";
        const response = await axios.get(url);
        const data = response.data;

        // Extract the 'make' column
        const makes = [...new Set(data.result.records.map(record => record.make))];
        // Render the template and pass the data
        res.render('Icyau05/car', { layout: 'main_insurance', makes, first_name: res.locals.userName, role: res.locals.user_role });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/Insurance', async (req, res) => {
    try {
        await updateTotalCost(); // Call the function to update totalCost
        const insuranceType = req.session.insuranceType;
        const insurancePlans = await CustomerInsurance.findAll({
            where: {
                planCategory: insuranceType
            },
            raw: true
        });
        // Group features by name
        const groupedFeatures = {};
        insurancePlans.forEach(plan => {
            if (!groupedFeatures[plan.featName]) {
                groupedFeatures[plan.featName] = {
                    featDescription: plan.featDescription,
                    plans: {}
                };
            }
            groupedFeatures[plan.featName].plans[plan.planName] = {
                featCost: plan.featCost,
                optional: plan.optionalfeat === 1
            };
        });

        // Get unique plan names
        const planNames = [...new Set(insurancePlans.map(plan => plan.planName))];
        const totalCosts = {};
        insurancePlans.forEach(plan => {
            totalCosts[plan.planName] = plan.totalCost;
        });

        // Create a matrix for features
        const featureMatrix = [];
        for (const featName in groupedFeatures) {
            const row = {
                featName,
                featDescription: groupedFeatures[featName].featDescription,
                optional: false,
                plans: {}
            };
            planNames.forEach(planName => {
                const feature = groupedFeatures[featName].plans[planName];
                row.plans[planName] = feature ? feature.featCost : null;
                if (feature && feature.optional) {
                    row.optional = true;
                }
            });
            featureMatrix.push(row);
        }
        console.log({ planNames, featureMatrix }); // Log to check the data structure
        // Convert featureMatrix to JSON string for debugging
        const featureMatrixJSON = JSON.stringify(featureMatrix, null, 2);

        // Render the template with the matrix and plan names
        res.render('Icyau05/carINSURANCE', {
            layout: 'main_insurance',
            planNames,
            featureMatrix,
            featureMatrixJSON,
            totalCosts,
            insuranceType, first_name: res.locals.userName, role: res.locals.user_role
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/success', async (req, res) => {
    try {
        // Assuming you have user information available in req.user after authentication
        const userId = req.user.id;
        const membershipStatus = req.session.user.membership_upgrade_status;
        console.log(membershipStatus);
        const session = await stripe.checkout.sessions.retrieve(req.session.user.session_id);
        console.log('customerID from session: ' + session.customer);
        // Update user's membership status in the database
        await User.update({
            membership_status: membershipStatus, membership_cust_id: session.customer, role: 'Member'
        }, {
            where: { id: userId }
        });

        console.log('Database column updated successfully');
        res.render('Icyau05/success', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role }); // Render success page or redirect to dashboard
    } catch (error) {
        console.error('Error updating database:', error);
        res.status(500).send('Failed to update membership status');
    }
});

// GET route to fetch insurance plan data and render the template
router.get('/viewInsurance', async (req, res) => {
    try {
        // Fetch the features of the plan
        const features = await Insurance.findAll({
            where: { optionalfeat: false }
        });

        // Fetch the optional features of the plan
        const optionalFeatures = await Insurance.findAll({
            where: { optionalfeat: true }
        });
        console.log('features: ' + features.featName);

        // Render the template with the fetched data
        res.render('Icyau05/viewInsurance', {
            layout: 'main',
            features,
            optionalFeatures, first_name: res.locals.userName, role: res.locals.user_role
        });
    } catch (error) {
        console.error('Error fetching insurance plan:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/invoice', async (req, res) => {
    try {
        const userId = req.user.id;
        const checkInvoice = req.session.checkinvoice;
        // Fetch all cart items for the user
        const insurancePlan = await InsuranceBought.findAll({
            where: { userId: userId, invoiceid: checkInvoice },
            raw: true
        });

        const insurancePlanCreation = await InsuranceBought.findOne({
            where: { userId: userId, invoiceid: checkInvoice },
            raw: true
        });

        const carDetails = await InsuranceDetailsCars.findOne({
            where: {
                userId: userId
            },
            raw: true
        });

        const userDetails = await User.findOne({
            where: {
                id: userId
            },
            raw: true
        });

        res.render('Icyau05/invoice', {
            insurancePlan: insurancePlan,
            carDetails: carDetails,
            userDetails: userDetails,
            insurancePlanCreation: insurancePlanCreation,
            layout: 'main', first_name: res.locals.userName, role: res.locals.user_role
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Error fetching data');
    }
});

router.get('/sales-data', async (req, res) => {
    try {
        const salesData = await InsuranceBought.findAll({
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
                [Sequelize.fn('SUM', Sequelize.col('totalCost')), 'totalSales']
            ],
            group: ['date'],
            order: [['date', 'ASC']],
            raw: true // Convert results to plain objects
        });

        const dates = salesData.map(data => data.date);
        const totals = salesData.map(data => data.totalSales);

        res.json({ dates, totals });
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ error: 'Error fetching sales data' });
    }
});

router.get('/sales-by-plan', async (req, res) => {
    try {
        const salesByPlan = await InsuranceBought.findAll({
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'month'],
                'planCategory',
                'planName',
                [Sequelize.fn('SUM', Sequelize.col('totalCost')), 'totalSales'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalPolicies']
            ],
            group: [
                Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'),
                'planCategory',
                'planName'
            ],
            order: [
                ['month', 'ASC'],
                'planCategory',
                'planName'
            ],
            raw: true
        });

        res.json(salesByPlan);
    } catch (error) {
        console.error('Error fetching sales by plan:', error);
        res.status(500).json({ error: 'Error fetching sales by plan' });
    }
});

//Icyau05 end

module.exports = router;