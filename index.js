require('dotenv').config();
const express = require('express') //importing the express library for use
const app = express() //initialise the express class with a variable name app
const bodyParser = require('body-parser'); //import body-parser to use and named it as bodyParser
const exphbs = require('express-handlebars'); //importing the express handlebars
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const path = require('path');
const User = require('./models/User');
const Insurance = require('./models/Insurance');
const { CustomerInsurance, updateTotalCost } = require('./models/CustomerInsurance');
const { formatDate, customHandlebars } = require('./helpers/hbs');
const InsuranceBought = require('./models/InsuranceBought');
const { getDataForCharts } = require('./models/dataModels');
// Routes
const mainRoute = require('./routes/main');
const userRoute = require('./routes/user_routes');
const expensesRoute = require('./routes/expenses_routes');
const budgetRoute = require('./routes/budget_routes');
const goalsRoute = require('./routes/goals_routes');
const insuranceRoute = require('./routes/insurance_route');
const db = require('./config/db');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs'); //for password encryption
const passport = require('passport');
const multer = require('multer');
const genwiseDB = require('./config/DBConnection'); //bring in database connection
const methodOverride = require('method-override');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.ENDPOINT_SECRET;
//connects to MySQL database
genwiseDB.setUpDB(false); //To set up database with new tables set (true)
const { sendEmail } = require('./helpers/emailService'); // Import the email service
const { Sequelize } = require('sequelize');
const axios = require('axios');
const http = require('http');
const ngrok = require('@ngrok/ngrok');
const dialogflow = require('@google-cloud/dialogflow');
const { v4: uuidv4 } = require('uuid');
const PA = require('./models/PA');
const Nutri = require('./models/Nutrition');
const PaRoute = require('./routes/PAroutes');
const NutriRoute = require('./routes/Nutriroutes');
const Workshop = require('./models/Workshop');
const UserWorkshop = require('./models/userWorkshops');
const session_login = require('./models/Session_login');
//const userSessionMap = new Map(); // Temporary storage to map user ID to Stripe session ID
// const crypto = require('crypto');
// const secretKey = crypto.randomBytes(32).toString('hex'); // Generates a 256-bit key
// console.log('secret key: '+secretKey);

//passport config
const authenticate = require('./config/passport')
authenticate.localStrategy(passport);


//Icyau05 
app.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        let event;
        const signature = req.headers['stripe-signature'];
        console.log('signature: ' + signature);
        // Replace this endpoint secret with your endpoint's unique secret
        // If you are testing with the CLI, find the secret by running 'stripe listen'
        // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
        // at https://dashboard.stripe.com/webhooks
        // Only verify the event if you have an endpoint secret defined.
        // Otherwise use the basic event deserialized with JSON.parse
        // if (endpointSecret) {
        //     // Get the signature sent by Stripe
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                endpointSecret
            );
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`, err.message);
            console.log(res.sendStatus(400));

        }
        let subscription;
        let status;
        let customerId;
        // Handle the event
        switch (event.type) {
            case 'customer.subscription.trial_will_end':
                subscription = event.data.object;
                status = subscription.status;
                console.log(`Subscription status is ${status}.`);
                // Then define and call a method to handle the subscription trial ending.
                // handleSubscriptionTrialEnding(subscription);
                break;
            case 'customer.subscription.deleted':
                subscription = event.data.object;
                status = subscription.status;
                console.log(`Subscription status is ${status}.`);
                // Then define and call a method to handle the subscription deleted.
                handleSubscriptionDeleted(status);
                break;
            case 'customer.subscription.created':
                subscription = event.data.object;
                status = subscription.status;
                customerId = subscription.customer;;
                console.log('crying' + customerId);
                break;
            case 'customer.subscription.updated':
                subscription = event.data.object;
                status = subscription.status;
                console.log(`Subscription status is ${status}.`);
                // Then define and call a method to handle the subscription update.
                // handleSubscriptionUpdated(subscription);
                break;
            case 'entitlements.active_entitlement_summary.updated':
                subscription = event.data.object;
                console.log(`Active entitlement summary updated for ${subscription}.`);
                // Then define and call a method to handle active entitlement summary updated
                // handleEntitlementUpdated(subscription);
                break;
            //!!!figure out more webhook https://docs.stripe.com/customer-management/integrate-customer-portal
            default:
                // Unexpected event type
                console.log(`Unhandled event type ${event.type}.`);
        }
        // Return a 200 response to acknowledge receipt of the event
        res.send();
    }
);
// Function to handle subscription deletion
function handleSubscriptionDeleted(subscription) {
    // Example logic: Update your database and notify the user
    const userId = req.user.id;
    const userEmail = req.user.email;
    if (subscription.status == 'canceled') {
        User.update({
            membership_status: 'Basic'
        }, {
            where: { id: userId }
        });
    }

    // Update user's subscription status in your database
    User.update({ membership_cust_id: null }, { where: { id: userId } });

    sendEmail({
        to: userEmail,
        subject: 'Your subscription has been canceled',
        body: `Hi there, your subscription ${subscription.id} has been canceled. If this was a mistake, please contact our support team.`,
    });

    console.log(`Handled subscription deletion for subscription ${subscription.id}.`);
}
//Icyau05

app.use(bodyParser.json()); //use the body-parser to parse json data

app.post('/webhook2', async (req, res) => {
    console.log('Webhook endpoint hit');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    try {
        const sessionId = uuidv4();
        const projectId = 'genwise-xj9r'; // Replace with your Dialogflow project ID
        const sessionClient = new dialogflow.SessionsClient();
        const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

        const intentName = req.body.queryResult.intent.displayName;
        // Extract userId and invoiceId from Dialogflow parameters
        const parameters = req.body.queryResult.parameters;

        if (intentName === 'checkPurchaseEmail') {
            // Get cart data using Sequelize
            const email = parameters.email;
            const user = await User.findOne({
                where: { email: email },
                raw: true
            });
            console.log('user is', user)
            const invoices = await InsuranceBought.findAll({
                attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('invoiceid')), 'invoiceid']],
                where: { userId: user.id },
                raw: true
            });
            console.log('invoices is', invoices);

            if (invoices.length === 0) {
                return res.json({
                    fulfillmentText: 'No purchases found for the provided email'
                });
            }
            // Generate response text from cart data
            let responseText = `Which Invoice would you like to check?`;
            invoices.forEach((item, index) => {
                responseText += `\n\nInvoice${index+1}: ${item.invoiceid}`;
            });
            return res.json({
                fulfillmentText: responseText
            });
        } else if (intentName === 'checkPurchaseInvoice') {
            // Handle another intent
            // Extract parameters specific to this intent
            const invoiceId = parameters.InvoiceID;

            const purchases = await InsuranceBought.findAll({
                where: { invoiceid: invoiceId },
                raw: true
            });
            console.log('cart is', purchases);

            if (purchases.length === 0) {
                return res.json({
                    fulfillmentText: 'No purchases found for the provided User ID and Invoice ID.'
                });
            }

            // Generate response text from cart data
            let responseText = `You purchased ${purchases[0].planName} at a cost of ${purchases[0].totalCost}`;
            purchases.forEach((item, index) => {
                responseText += `\n\nfeature: ${item.featName}\nfeature description: ${item.featDescription}\nfeature cost: ${item.featCost}\n`;
            });
            return res.json({
                fulfillmentText: responseText
            });
        }
        else {
            return res.json({
                fulfillmentText: 'Unknown intent.'
            });
        }
    } catch (error) {
        console.error('Error handling webhook:', error);
        return res.json({
            fulfillmentText: 'There was an error processing your request.'
        });
    }
});

app.use(bodyParser.urlencoded({ extended: true })); //use the body-parser to parseencoded url data
app.use(express.json());
//enables session to be stored using browser's cookie ID
app.use(cookieParser());

//sets handlebars configurations
app.engine('handlebars', exphbs.engine({
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials/',
    handlebars: customHandlebars,
    helpers: {
        formatDate: formatDate,
        json: customHandlebars.helpers.json // Register the json helper
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
}));

//set our apps to use the handlebars engine
app.set('view engine', 'handlebars');

// Creates static folder for publicly accessible HTML, CSS and Javascript files
app.use(express.static(path.join(__dirname, 'public')));

// Session Store Configuration
const sessionStoreOptions = {
    host: db.host,
    port: db.port,
    user: db.username,
    password: db.password,
    database: db.database,
    clearExpired: true,
    //how frequently expired sessions will be cleared; milliseconds:
    checkExpirationalInterval: 900000,
    //the maximum age of a valid session; milliseconds:
    expiration: 900000
};
const sessionStore = new MySQLStore(sessionStoreOptions);

// Session Middleware
app.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

//initiate passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash Messages Middleware
app.use(flash());

//Method override middleware to use other HTTP methodsd such as PUT and DELETE
app.use(methodOverride('_method'));

// Middleware to set user object in response locals
app.use((req, res, next) => {
    // Check if the user exists
    console.log('User Object:', req.user); // Debugging line
    if (req.user) {
        res.locals.user = req.user;
        res.locals.user_role = req.user.role;
        res.locals.userName = req.user.username;
    } else {
        res.locals.user = null;
        res.locals.user_role = null;
        res.locals.userName = null;
    }
    next();
});

app.use('/', mainRoute); //mainRoute is declared to point to routes/main.js
app.use('/user', userRoute); //userRoute is declared to point to routes/user_routes.js
app.use('/insur', insuranceRoute);
app.use('/expenses', expensesRoute);
app.use('/budget', budgetRoute);
app.use('/goals', goalsRoute);
app.use('/PAroutes', PaRoute);
app.use('/Nutriroutes', NutriRoute);

//Icyau05
// Middleware to handle session destruction
app.use(async (req, res, next) => {
    const userId = req.user ? req.user.id : null;

    // Hook into session destruction
    const originalDestroy = req.session.destroy;
    req.session.destroy = async function (callback) {
        if (userId) {
            try {
                await CustomerInsurance.destroy({
                    where: { userId: userId }
                });
                console.log('CustomerInsurance data deleted for user:', userId);
            } catch (error) {
                console.log('Error deleting CustomerInsurance data:', error);
            }
        }
        originalDestroy.call(req.session, callback);
    };

    next();
});
//Icyau05
app.get('/', (req, res) => {
    //req.session.cloningDone = false;
    console.log('cloning: ' + req.session.cloningDone);
    res.render('index', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

app.get('/404', (req, res) => {
    res.render('404', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

app.get('/about', (req, res) => {
    const userEmail = req.user.email;
    console.log('email: ' + userEmail);
    sendEmail({
        to: userEmail,
        subject: 'Your subscription has been canceled',
        body: `Hi there, your subscription has been canceled. If this was a mistake, please contact our support team.`,
    });
    res.render('about', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

app.get('/blog', (req, res) => {
    res.render('blog', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

app.get('/contact', (req, res) => {
    res.render('contact', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

app.get('/FAQ', (req, res) => {
    res.render('FAQ', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

app.get('/features', (req, res) => {
    res.render('features', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

app.get('/service', (req, res) => {
    res.render('service', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

app.get('/team', (req, res) => {
    res.render('team', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

app.get('/testimonial', (req, res) => {
    res.render('testimonial', { layout: 'main', first_name: res.locals.userName, role: res.locals.user_role })
});

//ACCOUNT MANAGEMENT:

//rx start
const storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // First location
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload1 = multer({ storage: storage1 });
//rx end

app.post('/email_notifications', upload1.single('attachment'), async (req, res) => {
    let errorsList = [];

    let { email_title, email_content } = req.body;
    const attachment = req.file;

    // Validate input
    if (!email_title || email_title.length <= 0) {
        errorsList.push({ text: 'Please enter the Email Title!' });
    }

    if (!email_content || email_content.length <= 0) {
        errorsList.push({ text: 'Please enter the Email Content!' });
    }

    if (errorsList.length > 0) {
        return res.render('ACCOUNTS/email_notifications', {
            errors: errorsList,
            email_title,
            email_content
        });
    }

    try {
        // Create new email notification
        await Email_notification.create({
            email_title,
            email_content,
            attachment_filename: attachment ? attachment.filename : null,
            attachment_path: attachment ? attachment.path : null
        });

        // Fetch all users
        const users = await User.findAll({ raw: true });
        console.log('Users retrieved:', users.length);
        // Prepare attachments array if it exists
        const attachments = attachment ? [{
            filename: attachment.filename,
            path: attachment.path
        }] : [];

        // Send email to all users
        for (const user of users) {
            await sendEmail({
                to: user.email,
                subject: `GenWise - ${email_title}`,
                body: email_content,
                isHtml: false, // Set to true if email_content is HTML
                attachments: attachments
            });
            console.log(`Email sent to: ${user.email}`);
        }
        // Set success message
        req.flash('success_msg', 'Emails sent successfully!');
        // Redirect to email_notifications page after emails are sent
        res.redirect('/email_notifications');
    } catch (error) {
        console.log(error);
        req.flash('error_msg', 'An error occurred.');
        res.redirect('/email_notifications');
    }
});

// // Define the route for the admin dashboard
// app.get('/admin_dashboard', async (req, res) => {
//     const user_role = req.user ? req.user.role : req.session.role || null; // Retrieve role from user or session
//     const user_name = req.user ? req.user.first_name : req.session.first_name || null; // Retrieve role from user or session
//     try {
//         const users = await User.findAll();
//         const genderCounts = users.reduce((acc, user) => {
//             acc[user.gender] = (acc[user.gender] || 0) + 1;
//             return acc;
//         }, {});


//         res.render('ACCOUNTS/admin_dashboard', {
//             role: user_role, first_name: user_name,
//             genderCounts: JSON.stringify(genderCounts)
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// });

// Define the route for the admin dashboard
// app.get('/admin_dashboard', async (req, res) => {
//     getDataForCharts((err, data) => {
//         if (err) {
//             console.error('Error getting data for charts:', err); // Log the error
//             return res.status(500).send('Internal Server Error');
//         }
//         res.render('ACCOUNTS/admin_dashboard', { data, first_name: res.locals.userName, role: res.locals.user_role }); // Ensure the view name and data are correct
//     });
// });

//WORKSHOPS:
app.post('/create_workshop', (req, res) => {
    const today = new Date();
    let errorsList = [];

    let { workshop_title, workshop_organizer, workshop_participants_limit, workshop_date, workshop_start_time, workshop_end_time, workshop_category, workshop_venue, workshop_description } = req.body;

    // Check if workshop name is provided
    if (!workshop_title || workshop_title.length <= 0) {
        errorsList.push({ text: 'Please enter the workshop title!' });
    }

    // Check if workshop name is provided
    if (!workshop_organizer || workshop_organizer.length <= 0) {
        errorsList.push({ text: 'Please enter the workshop organizer!' });
    }

    // Check if workshop date is provided
    if (!workshop_date) {
        errorsList.push({ text: 'Please enter the workshop date!' });
    } else if (workshop_date <= today) {
        errorsList.push({ text: 'Workshop date cannot be in the past!' });
    }

    // Check if workshop time is provided
    if (!workshop_start_time) {
        errorsList.push({ text: 'Please enter the workshop start time!' });
    }

    // Check if workshop time is provided
    if (!workshop_end_time) {
        errorsList.push({ text: 'Please enter the workshop end time!' });
    }

    if (!workshop_category || (workshop_category !== 'Environmental_Awareness' && workshop_category !== 'Physical_Health' && workshop_category !== 'Mental_Wellness' && workshop_category !== 'Financial_Literacy')) {
        errorsList.push({ text: 'Please select the workshop category!' });
    }

    // Check if workshop venue is provided
    if (!workshop_venue || workshop_venue.length <= 0) {
        errorsList.push({ text: 'Please enter the workshop venue!' });
    }


    if (!workshop_participants_limit || isNaN(workshop_participants_limit) || workshop_participants_limit <= 0) {
        errorsList.push({ text: 'Please enter a valid workshop participants limit!' });
    }

    // Check if workshop description is provided
    if (!workshop_description || workshop_description.length <= 0) {
        errorsList.push({ text: 'Please enter the workshop description!' });
    }

    if (errorsList.length > 0) {
        res.render('/create_workshop', {
            layout: 'main',
            errors: errorsList,
            workshop_title: workshop_title,
            workshop_organizer: workshop_organizer,
            workshop_participants_limit: workshop_participants_limit,
            workshop_category: workshop_category,
            workshop_date: workshop_date,
            workshop_start_time: workshop_start_time,
            workshop_end_time: workshop_end_time,
            workshop_venue: workshop_venue,
            workshop_description: workshop_description
        });
    } else {
        Workshop.findOne({ where: { workshop_title: workshop_title } }).then(workshop => {

            let errorsList = [];
            if (workshop) {
                errorsList.push({ text: 'Workshop title is already registered!', layout: "main" });
                res.render('ACCOUNTS/create_workshop',
                    {
                        layout: 'main',
                        errors: errorsList,
                        workshop_title: workshop_title,
                        workshop_organizer: workshop_organizer,
                        workshop_participants_limit: workshop_participants_limit,
                        workshop_category: workshop_category,
                        workshop_date: workshop_date,
                        workshop_start_time: workshop_start_time,
                        workshop_end_time: workshop_end_time,
                        workshop_venue: workshop_venue,
                        workshop_description: workshop_description
                    }
                )
            } else {
                Workshop.create({
                    workshop_title, workshop_organizer, workshop_participants_limit, workshop_date, workshop_start_time, workshop_end_time, workshop_category, workshop_venue, workshop_description
                }).then(workshop => {
                    res.redirect('/view_workshop');

                }).catch(err => console.log(err));
            }
        })
    }
});

//ACCOUNT MANAGEMENT:

app.post('/sign_up', async (req, res) => {
    const today = new Date();
    const hundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

    let errorsList = [];
    let {
        first_name, last_name, email, password,
        nric, DOB, gender, phone_no, postal_code, address, confirm_password
    } = req.body;

    // Check if first name is provided
    if (!first_name || first_name.length <= 0) {
        errorsList.push({ text: 'Please enter your first name!' });
    }

    // Check if nric is provided
    if (!nric || nric.length <= 0) {
        errorsList.push({ text: 'Please enter your NRIC (Last 4 Digit)!' });
    } else if (!/[A-Za-z]$/.test(nric)) {
        errorsList.push({ text: 'NRIC must end with an alphabet!' });
    }

    // Check date_of_birth
    if (!DOB) {
        errorsList.push({ text: 'Please enter your Date Of Birth!' });
    } else if (new Date(DOB) >= today) {
        errorsList.push({ text: 'Date of Birth cannot be in the future!' });
    } else if (new Date(DOB) <= hundredYearsAgo) {
        errorsList.push({ text: 'Date of Birth cannot be more than 100 years ago!' });
    }

    // Check if last name is provided
    if (!last_name || last_name.length <= 0) {
        errorsList.push({ text: 'Please enter your last name!' });
    }

    // Check if password is provided and meets the guidelines
    if (!password || password.length <= 0) {
        errorsList.push({ text: 'Please enter a password!' });
    } else {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*]/.test(password);

        if (password.length < 8) {
            errorsList.push({ text: 'Password must be at least 8 characters long!' });
        }
        if (!hasUpperCase) {
            errorsList.push({ text: 'Password must contain at least one uppercase letter!' });
        }
        if (!hasLowerCase) {
            errorsList.push({ text: 'Password must contain at least one lowercase letter!' });
        }
        if (!hasSpecialChar) {
            errorsList.push({ text: 'Password must contain at least one special character (e.g., !@#$%^&*)!' });
        }
    }

    // Add check for gender's radio button
    if (!gender || (gender !== 'Male' && gender !== 'Female')) {
        errorsList.push({ text: 'Please select a gender!' });
    }

    // Check if Phone No is provided
    if (!phone_no || phone_no.length < 8) {
        errorsList.push({ text: 'Please enter a valid Phone No!' });
    }

    // Check if Postal Code is provided
    if (!postal_code || postal_code.length < 6) {
        errorsList.push({ text: 'Please enter a valid Postal Code!' });
    }

    // Check if email is provided and valid
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        errorsList.push({ text: 'Please enter a valid Email!' });
    }

    // Check if Address is provided
    if (!address || address.length <= 0) {
        errorsList.push({ text: 'Please enter Your Address!' });
    }

    // Check if confirm_password is provided and matches password
    if (!confirm_password || confirm_password.length <= 0) {
        errorsList.push({ text: 'Please enter Your Confirm Password!' });
    } else if (password !== confirm_password) {
        errorsList.push({ text: 'Your passwords do not match!' });
    }

    // If there are validation errors, render the sign-up page with errors
    if (errorsList.length > 0) {
        return res.render('ACCOUNTS/sign_up', {
            layout: 'main',
            errors: errorsList,
            first_name,
            last_name,
            email,
            password,
            nric,
            DOB,
            gender,
            phone_no,
            postal_code,
            address,
            confirm_password
        });
    }

    try {
        // Check for existing users
        const [userByEmail, userByNric] = await Promise.all([
            User.findOne({ where: { email: email } }),
            User.findOne({ where: { nric: nric } })
        ]);

        // Accumulate errors if any
        if (userByEmail) {
            errorsList.push({ text: 'Email is already registered!' });
        }
        if (userByNric) {
            errorsList.push({ text: 'NRIC is already registered!' });
        }

        // If there are errors after checking, render the page with errors
        if (errorsList.length > 0) {
            return res.render('ACCOUNTS/sign_up', {
                layout: 'main',
                errors: errorsList,
                first_name,
                last_name,
                email,
                password,
                nric,
                DOB,
                gender,
                phone_no,
                postal_code,
                address
            });
        }

        // Generate salt and hashed password
        bcrypt.genSalt(10, (err, salt) => {
            if (err) throw err;
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) throw err;
                password = hash;

                // Create new user
                User.create({
                    first_name, last_name, email, password, nric, DOB, gender, phone_no, postal_code, address
                }).then(() => {
                    const emailBody = `Dear ${first_name} ${last_name}, You have created an account with us!`
                    // Send the email
                    sendEmail({
                        to: email,
                        subject: 'Welcome to GenWise!',
                        body: emailBody,
                        isHtml: false // Ensure the email is sent as HTML
                    });
                    res.redirect('/login');
                }).catch(err => {
                    console.error('Error creating user:', err);
                    res.status(500).send('Internal Server Error');
                });
            });
        });
    } catch (err) {
        console.error('Error during user registration:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to serve the user audit page
app.get('/user_audits', (req, res) => {
    console.log("in user_routes.js /user_audits");

    session_login.findAll({
        order: [
            ['login_time', 'ASC'] // Order by login_time descending
        ],
        raw: true,
    })
        .then(sessionLogins => {
            // Render the user-audits.handlebars view, passing in session login data
            res.render('ACCOUNTS/user_audits', {
                layout: 'main', first_name: res.locals.userName, role: res.locals.user_role,
                sessionLogins: sessionLogins,
            });
        })
        .catch(err => console.log(err));
});

//ACCOUNT MANAGEMENT END


//Icyau05 start
app.post('/create-checkout-session', async (req, res) => {
    const prices = await stripe.prices.list({
        lookup_keys: [req.body.lookup_key],
        expand: ['data.product'],
    });
    const session = await stripe.checkout.sessions.create({
        billing_address_collection: 'auto',
        line_items: [
            {
                price: prices.data[0].id,
                // For metered billing, do not pass quantity
                quantity: 1,

            },
        ],
        mode: 'subscription',
        success_url: `http://localhost:3002/success`,
        cancel_url: `http://localhost:3002/upgrade`,
    });
    const membershipStatus = getMembershipFromLookupKey(req.body.lookup_key); // Function to determine membership
    req.session.user = {
        membership_upgrade_status: membershipStatus,
        session_id: session.id
    }
    console.log('sessionId is:' + session.id)
    res.redirect(303, session.url); // Redirect to Stripe checkout page
});

function getMembershipFromLookupKey(lookupKey) {
    if (lookupKey === 'Monthly_Plan-0e0fe5f') {
        return 'Monthly';
    } else if (lookupKey === 'Yearly_Plan-b55517c') {
        return 'Yearly';
    } else {
        console.error('Invalid lookup key received.');
        // Handle unexpected lookup key (optional: return error response)
        return null; // Or throw an error
    }
};

app.post('/create-portal-session', async (req, res) => {
    const user = await User.findOne({ where: { id: req.user.id } })
    console.log('hi' + user.membership_cust_id)

    const returnUrl = 'http://localhost:3002';

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.membership_cust_id,
        return_url: returnUrl,
    });

    res.redirect(303, portalSession.url);
});
//Icyau05 end

let port = 3002

//starting the server on the designated port
//no commands will run after this line as the server starts
// app.listen(port, () => {
//     console.log(`Server is running on port http://localhost:${port}`);
// });

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
    ngrok.connect({ addr: port, authtoken_from_env: true })
        .then(listener => console.log(`Ingress established at: ${listener.url()}`));
});