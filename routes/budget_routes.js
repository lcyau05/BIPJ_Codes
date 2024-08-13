const express = require('express');
const router = express.Router();
const moment = require('moment');
const Budget = require('../models/Budget');
const User = require('../models/User');
const cookieParser = require('cookie-parser');
const { sendEmail } = require('../helpers/emailService'); // Import the email service


router.use(cookieParser());
router.use(express.urlencoded({ extended: false }));

router.post('/budgetform', async (req, res) => {
    console.log("Request body:", req.body);

    let { category, amount } = req.body;
    let userId = req.user.id; // Assume userId is stored in session

    // Automatically set the month to the current month
    let month = new Date().toISOString().slice(0, 7);

    if (!category || amount <= 0) {
        return res.status(400).send("Invalid category or amount.");
    }

    if (!userId) {
        return res.status(401).send("Unauthorized: No user ID found in session.");
    }

    try {
        let budget = await Budget.findOne({ where: { userId, category, month } });

        if (budget) {
            budget.amount = amount;
            await budget.save();
        } else {
            await Budget.create({ category, amount, userId, month });
        }

        res.redirect('/budgetdashboard');
    } catch (err) {
        console.error("Error creating/updating budget:", err);
        res.status(500).send("Failed to create/update budget. Please try again.");
    }
});

// Route to update a budget
router.post('/updateBudget', async (req, res) => {
    try {
        const { id, amount } = req.body;
        const budget = await Budget.findOne({ where: { id } });

        if (!budget) {
            return res.status(404).send('Budget not found');
        }

        budget.amount = amount;
        await budget.save();

        // Check the updated totalSpent against the new budget amount
        const totalSpent = parseFloat(budget.totalSpent) || 0;
        const percentageSpent = (totalSpent / amount) * 100;
        const remainingAmount = (amount - totalSpent).toFixed(2);

        const useremail = await User.findOne({
            attributes: ['email'],
            where: { id: budget.userId }
        });

        // Send email notifications if needed
        if (percentageSpent >= 50 && percentageSpent < 100) {
            const emailBody = `
                <p>You have reached 50% of your updated budget for the category: <strong>${budget.category}</strong> for the month of <strong>${budget.month}</strong>.</p>
                <p><strong>Total Spent:</strong> $${totalSpent.toFixed(2)}</p>
                <p><strong>Remaining Amount:</strong> $${remainingAmount}</p>
            `;
            await sendEmail({
                to: useremail.email,
                subject: 'GenWise - Budget Alert: 50% Reached',
                body: emailBody,
                isHtml: true
            });
        } else if (percentageSpent >= 100) {
            const overshotAmount = (totalSpent - amount).toFixed(2);
            const emailBody = `
                <p>You have reached 100% of your updated budget for the category: <strong>${budget.category}</strong> for the month of <strong>${budget.month}</strong>.</p>
                <p><strong>Total Spent:</strong> $${totalSpent.toFixed(2)}</p>
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

        res.redirect('/budgetdashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});


module.exports = router;
