const express = require('express');
const PA = require('../models/PA');
const router = express.Router();
const bodyParser = require("body-parser");
const User = require('../models/User');
const cookieParser = require('cookie-parser');
router.use(cookieParser());
const { sendEmail } = require('../helpers/emailService'); // Import the email service

router.post('/storeID', (req, res) => {
    const { recordId } = req.body.recordId;
    req.session.recordId = recordId;
    console.log("recordIdat Store", recordId);
    res.redirect('/review');
});

router.post('/submission', async (req, res) => {
    // Retrieve data from the request body
    let { ageGroup, rsStatus, income, dependants, vehicle, height, weight, goals, sgoals, healthscreen, hsreport, aller, allergies, smoke, alchohol, bloodpressure, headaches, chronic, injuries, heartcond, premedic, 
        stress1, stress2, support, sleep, diagnose, isolated, coping, feelings, activities, useless, mhScore, mhcategory, pscore, pcategory } = req.body;
    
    const userId = req.user.id;
    // Ensure totalScore is a number
    mhScore = parseInt(mhScore, 10);
    pscore = parseInt(pscore, 10);
    // Merge the data from both forms
    let formData = {
        ageGroup,
        rsStatus,
        income,
        dependants,
        vehicle,
        height,
        weight,
        goals,
        sgoals,
        healthscreen, 
        hsreport, 
        aller, 
        allergies, 
        smoke,
        alchohol,
        bloodpressure,
        headaches,
        chronic,
        injuries,
        heartcond, 
        premedic,
        stress1,
        stress2,
        support,
        sleep,
        diagnose,
        isolated,
        coping,
        feelings,
        activities,
        useless,
        mhScore,
        mhcategory,
        pscore,
        pcategory,
        userId
    };

    try {
        // Store the combined data in the database
        await PA.create(formData);

        // Store mhcategory and pcategory in session
        req.session.mhcategory = mhcategory;
        req.session.pcategory = pcategory;
        req.session.mhscore = mhScore;
        req.session.pscore = pscore;

        // Get user email
        const useremail = await User.findOne({
            attributes: ['email'],
            where: { id: userId }
        });

        if (useremail) {
            // Prepare email content
            const emailSubject = 'New Submission Received';
            const emailBody = `
                We have received a new submission assessment with the following details:
                
                Age Group: ${ageGroup}
                Relationship Status: ${rsStatus}
                Income: ${income}
                Dependants: ${dependants}
                Vehicle: ${vehicle}
                Height: ${height}
                Weight: ${weight}
                Goals: ${goals}
                Short-term Goals: ${sgoals}
                Health Screen: ${healthscreen}
                Medical Condition: ${hsreport}
                Allergies: ${aller ? 'Yes' : 'No'}
                Specific Allergies: ${allergies}
                Smoker: ${smoke ? 'Yes' : 'No'}
                Alcohol Consumption: ${alchohol ? 'Yes' : 'No'}
                Blood Pressure: ${bloodpressure}
                Frequent Headaches: ${headaches}
                Chronic Conditions: ${chronic}
                Injuries: ${injuries}
                Heart Conditions: ${heartcond}
                Pre-existing Medications: ${premedic}
                Stress Level 1: ${stress1}
                Stress Level 2: ${stress2}
                Support System: ${support}
                Sleep Quality: ${sleep}
                Diagnosis: ${diagnose}
                Feeling Isolated: ${isolated}
                Coping Mechanisms: ${coping}
                Feelings: ${feelings}
                Activities: ${activities}
                Feeling Useless: ${useless}
                Mental Health Score: ${mhScore}
                Mental Health Category: ${mhcategory}
                Physical Score: ${pscore}
                Physical Category: ${pcategory}
                
                User ID: ${userId}
            `;
            // Send email
            await sendEmail({
                to: useremail.email, 
                subject: emailSubject, 
                body: emailBody
            });
        }

        // Redirect to results page
        res.redirect('/answer');
    } catch (err) {
        console.error('Error storing data:', err);
        res.status(500).json({ error: 'Error storing data', details: err.message });
    }
});


module.exports = router;