const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Workshop = require('../models/Workshop');
const bodyParser = require('body-parser'); //import body-parser to use and named it as bodyParser
const bcrypt = require('bcryptjs'); //for password encryption
const passport = require('passport');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const authenticate = require('../config/passport');
const { sendEmail } = require('../helpers/emailService'); // Import the email service
const SessionLogin = require('../models/Login_session');


router.use(bodyParser.urlencoded({ extended: true })); //use the body-parser to parseencoded url data

router.use(cookieParser());
router.use(methodOverride('_method'));

router.use(passport.initialize());
router.use(passport.session());

authenticate.localStrategy(passport);

// Function to send email for cancelling workshops
function sendEmailNotification(workshopTitle, userEmail) {
    const emailBody = `The workshop titled "${workshopTitle}" has been cancelled.`;
    console.log('email body', emailBody);
    sendEmail({
        to: userEmail,
        subject: 'GenWise - Workshop Cancelled',
        body: emailBody, // Plain text body
        isHtml: false // Ensure the email is sent as plain text
    })
}

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
}

// Store OTPs temporarily (consider using a better storage for production)
let tempOTPs = {};
// WORKSHOPS
// Route to delete a workshop
router.get('/delete_workshop/:id', (req, res) => {
    const workshopId = req.params.id;

    if (!workshopId) {
        console.log("Workshop ID not provided!");
        return res.redirect('/view_workshop');
    }

    Workshop.findOne({
        where: { id: workshopId },
        raw: true
    }).then((workshop) => {
        if (!workshop) {
            console.log("Workshop not found!");
            return res.redirect('/view_workshop');
        }

        const workshopTitle = workshop.workshop_title; // Assuming workshop has a title property

        Workshop.destroy({
            where: { id: workshopId }
        }).then(() => {
            console.log("Workshop cancelled!");

            // Fetch all users
            User.findAll({ raw: true })
                .then(users => {
                    users.forEach(user => {
                        sendEmailNotification(workshopTitle, user.email);
                    });
                })
                .catch(err => {
                    console.log(`Error fetching users: ${err}`);
                });

            res.redirect('/view_workshop');
        }).catch(err => {
            console.log(`Error deleting workshop: ${err}`);
            res.redirect('/view_workshop');
        });
    }).catch(err => {
        console.log(`Error finding workshop: ${err}`);
        res.redirect('/view_workshop');
    });
});

// ACCOUNTS MANAGEMENT
// Route to handle login and OTP verification
router.post('/login', (req, res, next) => {
    if (req.body.otp) {
        // Handle OTP verification
        const { userId, otp } = req.body;
        const storedOTP = tempOTPs[userId];

        // Check if OTP is valid
        if (storedOTP && storedOTP.otp === otp && storedOTP.expiresAt > Date.now()) {
            // Insert user session after successful OTP verification
            SessionLogin.create({
                user_id: userId,
                login_time: new Date()
            }).then(() => {
                // Remove OTP after successful verification
                delete tempOTPs[userId];

                // Redirect after storing the session
                return res.redirect('/user_details');
            }).catch(err => next(err));
        } else {
            // Invalid or expired OTP
            return res.redirect('/verify_otp');
        }
    } else {
        // Handle initial login
        // Handle initial login
        const { email } = req.body;
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                // Authentication failed
                return res.redirect('ACCOUNTS/login');
            }

            // Log the user in
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }

                // Generate OTP and send it to the user's email
                const otp = generateOTP();
                const emailBody = `Your OTP is ${otp}`;
                console.log('email body', emailBody);
                sendEmail({
                    to: email,
                    subject: 'GenWise - Login OTP',
                    body: emailBody, // Plain text body
                    isHtml: false // Ensure the email is sent as plain text
                }).then(() => {
                    // Store OTP temporarily with an expiry (e.g., 5 minutes)
                    tempOTPs[user.id] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

                    // Render OTP input page
                    res.redirect('/verify_otp');
                }).catch(err => next(err));
            });
        })(req, res, next);
    }
});


router.post('/user_update', (req, res) => {
    const user_id = req.user.id || req.session.user_id;

    let { password, confirm_password, email, phone_no, postal_code, address } = req.body;
    let errorsList = [];
    if (!password && !email && !phone_no && !postal_code && !address) {
        errorsList.push({ text: 'At least one field must be filled to update the profile!' });
    }
    // Check if postal code is filled and must be 6 digits
    if (postal_code && postal_code.length < 6) {
        errorsList.push({ text: 'Please enter a valid Postal Code!' });
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    if (password && password.length < 8) {
        errorsList.push({ text: 'Password must be at least 8 characters long!' });
    }
    if (password && !hasUpperCase) {
        errorsList.push({ text: 'Password must contain at least one uppercase letter!' });
    }
    if (password && !hasLowerCase) {
        errorsList.push({ text: 'Password must contain at least one lowercase letter!' });
    }
    if (password && !hasSpecialChar) {
        errorsList.push({ text: 'Password must contain at least one special character (e.g., !@#$%^&*)!' });
    }

    // Check if password is provided
    if (password && !confirm_password) {
        errorsList.push({ text: 'Please enter Your Confirm Password!' });
    }

    if (password !== confirm_password) {
        errorsList.push({ text: 'Passwords do not match!' });
    }

    if (phone_no && phone_no.length < 8) {
        errorsList.push({ text: 'Please enter a valid Phone No!' });
    }

    if (errorsList.length > 0) {
        res.render('ACCOUNTS/user_update', {
            errors: errorsList,
            user_id,
            password,
            confirm_password,
            email,
            phone_no,
            postal_code,
            address
        });
    } else {
        User.findOne({ where: { id: user_id } }).then(user => {
            if (!user) {
                return res.status(404).send('User not found');
            }

            let updateFields = {};
            if (email) updateFields.email = email;
            if (phone_no) updateFields.phone_no = phone_no;
            if (postal_code) updateFields.postal_code = postal_code;
            if (address) updateFields.address = address;

            const updateUser = () => {
                User.update(updateFields, { where: { id: user_id } })
                    .then(() => {
                        res.redirect('/user_details');
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).send('Error updating user');
                    });
            };

            if (password) {
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) throw err;
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        updateFields.password = hash;
                        updateUser();
                    });
                });
            } else {
                updateUser();
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send('Server error');
        });
    }
});

module.exports = router;