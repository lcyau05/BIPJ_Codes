const express = require('express');
const Goals = require('../models/Goals');
const router = express.Router();
const bodyParser = require("body-parser");
const moment = require('moment');
const User = require('../models/User');
const cookieParser = require('cookie-parser');
router.use(cookieParser());
const { sendEmail } = require('../helpers/emailService'); // Import the email service

router.post('/goalsform', async (req, res) => {
    let { category, name, description, targetAmount, currentAmount, deadline } = req.body;
    const userId = req.user.id; // Ensure userId is available from session

    // Validate input
    if (!category || !name || !description || targetAmount <= 0 || currentAmount < 0 || !deadline) {
        return res.status(400).send("Invalid input.");
    }

    if (!userId) {
        return res.status(401).send("Unauthorized: No user ID found in session.");
    }

    try {
        // Create the goal
        await Goals.create({
            category,
            name,
            description,
            targetAmount,
            currentAmount,
            deadline,
            userId // Include userId
        });
        res.redirect('/goalsdashboard');
    } catch (err) {
        console.error('Error creating goal:', err);
        res.status(500).send("An error occurred while creating the goal.");
    }
});

router.post('/updateGoals', async (req, res) => {
    try {
        const { id, category, name, description, targetAmount, currentAmount, deadline } = req.body;
        const [updatedRows] = await Goals.update(
            {
                category,
                name,
                description,
                targetAmount,
                currentAmount,
                deadline
            },
            { where: { id: id } }
        );

        if (updatedRows > 0) {
            res.redirect('/goalsdashboard');
        } else {
            res.status(404).send('Transaction not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router; 