const express = require('express');
const router = express.Router();
const Insurance = require('../models/Insurance');
const { CustomerInsurance, updateTotalCost } = require('../models/CustomerInsurance');
const CarInsurance = require('../models/CarInsurance');
const InsuranceBought = require('../models/InsuranceBought');
const InsuranceDetailsCars = require('../models/CarInsurance');
const User = require('../models/User');
const Claims = require('../models/Claims');
const ClaimDocument = require('../models/ClaimDocument');
const bodyParser = require('body-parser'); //import body-parser to use and named it as bodyParser
router.use(bodyParser.urlencoded({ extended: true })); //use the body-parser to parseencoded url data
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const upload = require('../helpers/upload');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');
const { sendEmail } = require('../helpers/emailService'); // Import the email service

// Function to generate a unique UUID
// async function generateUniqueUUID() {
//     let unique = false;
//     let uuid = '';

//     while (!unique) {
//         uuid = uuidv4();
//         const count = await InsuranceBought.count({ where: { invoiceid: uuid } });
//         if (count === 0) {
//             unique = true;
//         }
//     }

//     return uuid;
// }
// Function to generate a unique short invoice ID
async function generateShortUniqueID() {
    let unique = false;
    let shortID = '';

    while (!unique) {
        shortID = generateShortID();
        const count = await InsuranceBought.count({ where: { invoiceid: shortID } });
        if (count === 0) {
            unique = true;
        }
    }

    return shortID;
}

// Function to generate a short unique ID
function generateShortID() {
    const timestamp = Date.now().toString(36); // Convert timestamp to base36 (shorter string)
    const randomPart = crypto.randomBytes(4).toString('hex'); // Generate a short random string
    return `${timestamp}-${randomPart}`;
}

// Function to read and compile the Handlebars template
const compileTemplate = (templateName, data) => {
    const filePath = path.join(__dirname, '..', 'views', 'admin', `${templateName}.handlebars`);
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    return template(data);
};

router.post('/createInsurance', async (req, res) => {
    const { typeOfInsurance, name, featureName, cost, description, optionalName, optionalCost, optionalDescription } = req.body;

    try {
        // Insert features
        for (let i = 0; i < featureName.length; i++) {
            await Insurance.create({
                planName: name,
                planCategory: typeOfInsurance,
                featName: featureName[i],
                featCost: cost[i],
                featDescription: description[i],
                optionalfeat: false
            });
        }

        // Insert optional features
        for (let i = 0; i < optionalName.length; i++) {
            await Insurance.create({
                planName: name,
                planCategory: typeOfInsurance,
                featName: optionalName[i],
                featCost: optionalCost[i],
                featDescription: optionalDescription[i],
                optionalfeat: true
            });
        }
        //res.json({ message: 'Insurance plan created successfully' });
        // let msg_success = 'Insurance plan created successfully'; must make consistent with create_insurance.handlebars js
        // res.render('Icyau05/create_insurance', { layout: 'main',  success_msg:msg_success});
        req.flash('success_msg', 'Insurance plan created successfully');
        res.redirect('/insurdashboard');
    } catch (error) {
        console.error('Error creating insurance plan:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/updateOptionalFeature', async (req, res) => {
    const { featName, planCategory } = req.body;
    console.log('planCategory', planCategory);

    try {
        // Update the database record
        const updatedFeature = await CustomerInsurance.update(
            { optionalfeat: false },
            { where: { featName: featName, planCategory: planCategory } }
        );
        res.redirect('/Insurance');
    } catch (error) {
        console.error('Error updating feature:', error);
        res.status(500).send('Error updating feature');
    }
});

router.post('/updateCompulsoryFeature', async (req, res) => {
    const { featName, planCategory } = req.body;

    try {
        // Update the database record
        const updatedFeature = await CustomerInsurance.update(
            { optionalfeat: true }, // Update optionalfeat to true
            { where: { featName: featName, planCategory: planCategory } }
        );
        res.redirect('/Insurance');
    } catch (error) {
        console.error('Error updating feature:', error);
        res.status(500).send('Error updating feature');
    }
});

router.post('/set-insurance-type', (req, res) => {
    const insuranceType = req.body.insuranceType;
    req.session.insuranceType = insuranceType; // Store the insurance type in the session
    console.log('session insurance type', req.session.insuranceType);
    res.sendStatus(200); // Send a success status back to the client
});


router.post('/submitCarInsurance', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            vehNo,
            makemodel,
            registeredyear,
            'carscheme-options': carscheme,
            'NCD-options': ncd,
            'DL-options': drivingLicense,
            'Claims-options': claims
        } = req.body;

        if (userId) {
            // Check if a record already exists for this userId
            const existingRecord = await CarInsurance.findOne({
                where: {
                    userId: userId,
                    insurancebought: null
                }
            });

            if (existingRecord) {
                // Update the existing record with new data
                await existingRecord.update({
                    vehNo,
                    makemodel,
                    registeredyear,
                    carscheme,
                    ncd,
                    drivingLicense,
                    claims,
                    userId: userId
                });

                console.log('Record updated successfully');
                res.redirect('/Insurance'); // Redirect to a success page or another route
            } else {
                // Create a new record since none exists
                const newRecord = await CarInsurance.create({
                    vehNo,
                    makemodel,
                    registeredyear,
                    carscheme,
                    ncd,
                    drivingLicense,
                    claims,
                    userId: userId
                });

                console.log('New record created successfully');
                res.redirect('/Insurance'); // Redirect to a success page or another route
            }
        } else {
            console.error('User not authenticated');
            res.status(401).send('User not authenticated');
        }
    } catch (error) {
        console.error('Error updating/creating record:', error);
        res.status(500).send('Error updating/creating record');
    }
});

router.post('/resetinsur', async (req, res) => {
    try {
        // Get user_id from session (assuming it's stored there)
        const userId = req.user.id; // Adjust as per your session setup

        // Delete existing records in CustomerInsurance where userId = req.user.id
        await CustomerInsurance.destroy({ where: { userId: userId } });

        // Get data from the Insurance table
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

            // Insert the data into CustomerInsurance
            await CustomerInsurance.bulkCreate(customerChoiceData);

            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, message: 'Failed to fetch insurance data' });
        }
    } catch (error) {
        console.error('Error resetting customer insurance:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

router.post('/storePlanName', (req, res) => {
    const { planName } = req.body;
    req.session.planName = planName;
    console.log(planName);
    res.redirect('/payment');
});

router.post('/filingclaim', (req, res) => {
    const { invoiceid } = req.body;
    req.session.invoiceid = invoiceid;
    console.log('invoice is smt: ', invoiceid);
    res.redirect('/fileclaim');
});

router.post('/viewInvoice', (req, res) => {
    const { invoiceid } = req.body;
    req.session.checkinvoice = invoiceid;
    console.log('invoice is smt: ', invoiceid);
    res.redirect('/invoice');
});

router.post('/viewClaim', (req, res) => {
    const { claimid, invoiceid } = req.body;
    req.session.claimId = claimid;
    req.session.invoiceid = invoiceid;
    console.log('invoice is smt: ', claimid);
    res.redirect('/fileclaim');
});

router.post('/rejectClaim', async (req, res) => {
    const { claimid, rejreasons } = req.body;
    console.log('reject is smt: ', claimid);
    const rejected = await Claims.update(
        { claimStatus: 'Denied', rejDesc: rejreasons }, // Update optionalfeat to true
        {
            where: {
                id: claimid
            }
        }
    );
    const updatedClaim = await Claims.findOne({
        where: { id: claimid }
    });

    const user = await User.findOne({
        where: { id: updatedClaim.userId }
    });

    const emailBody = `Dear ${user.first_name},

We regret to inform you that your recent claim with us has been rejected. We understand this may be disappointing, and we want to provide you with some information regarding the decision.

Claim Details:
- Claim Number: ${claimid}
- Claim Amount: ${updatedClaim.amountClaimed}

Reason for Rejection: ${updatedClaim.rejDesc}

If you have any additional information or if you believe there has been a mistake, please contact us at [Support Email/Phone Number] within [X] days for further review. We are here to assist you and address any concerns you may have.

Thank you for your understanding and for choosing GenWise.

Best regards,
GenWise`;

    // Send the email
    sendEmail({
        to: 'nathalielichengyau@gmail.com',
        subject: 'GenWise - Claim Unsuccessful',
        body: emailBody
    });
    res.redirect('/insurdashboard');
});

router.post('/approveClaim', async (req, res) => {
    const { claimid } = req.body;
    console.log('approve is smt: ', claimid);
    const approved = await Claims.update(
        { claimStatus: 'Approved' }, // Update optionalfeat to true
        {
            where: {
                id: claimid
            }
        }
    );
    // Retrieve the updated claim to get the invoiceid
    const updatedClaim = await Claims.findOne({
        where: { id: claimid }
    });

    const user = await User.findOne({
        where: { id: updatedClaim.userId }
    });

    // Update claim count and claim cost
    await InsuranceBought.increment(
        { claimcount: 1, claimNewCost: 300 },
        {
            where: {
                userId: updatedClaim.userId,
                invoiceid: updatedClaim.invoiceid
            }
        }
    );
    const emailBody = `Dear ${user.first_name},

We are pleased to inform you that your recent claim with us has been approved! 🎉

Claim Details:
- Claim Number: ${claimid}
- Claim Amount: ${updatedClaim.amountClaimed}
- Approved Amount: ${updatedClaim.amountClaimed}

Your approved amount will be processed and credited to your account shortly. We will notify you once the payment has been made.

Thank you for choosing GenWise. If you have any questions or need further assistance, please feel free to contact our support team at +65 6123 4567.

Best regards,
GenWise`;

    // Send the email
    sendEmail({
        to: 'nathalielichengyau@gmail.com',
        subject: 'GenWise - Claim Successful',
        body: emailBody
    });
    res.redirect('/insurdashboard');
});

// Route to fetch feature data by ID
router.get('/features/:id', async (req, res) => {
    try {
        const featureId = req.params.id;
        const feature = await Insurance.findByPk(featureId);

        if (feature) {
            res.json(feature);
        } else {
            res.status(404).json({ error: 'Feature not found' });
        }
    } catch (error) {
        console.error('Error fetching feature data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Route to update feature by ID
router.put('/features/:id', async (req, res) => {
    try {
        const featureId = req.params.id;
        const { featName, featCost, featDescription, optionalfeat } = req.body;

        const updatedFeature = await Insurance.update(
            {
                featName: featName,
                featCost: featCost,
                featDescription: featDescription,
                optionalfeat: optionalfeat
            },
            {
                where: { id: featureId }
            }
        );

        if (updatedFeature[0] > 0) {
            res.json({ success: true, message: 'Feature updated successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'Feature not found.' });
        }
    } catch (error) {
        console.error('Error updating feature:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// Route to delete feature by ID
router.delete('/features/:id', async (req, res) => {
    try {
        const featureId = req.params.id;
        const deleted = await Insurance.destroy({ where: { id: featureId } });

        if (deleted) {
            res.json({ success: true, message: 'Feature deleted successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'Feature not found.' });
        }
    } catch (error) {
        console.error('Error deleting feature:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

router.post('/submitPayment', async (req, res) => {
    try {
        const formData = req.body;
        const storedPlanName = req.session.planName;
        const userId = req.user.id;
        const userEmail = req.user.email;
        console.log('userEmail is: ', userEmail);
        const invoiceId = await generateShortUniqueID();

        // Retrieve insurance plans based on specific criteria
        const insurancePlans = await CustomerInsurance.findAll({
            where: {
                planCategory: 'Car',
                planName: storedPlanName, // Adjust as per your requirement
                optionalfeat: false
            },
            raw: true
        });

        const updateinvoice = await CarInsurance.update(
            { insurancebought: invoiceId }, // Update optionalfeat to true
            {
                where: {
                    userId: userId,
                    insurancebought: null
                }
            }
        );
        // Check if insurancePlans is an array before further processing
        if (Array.isArray(insurancePlans) && insurancePlans.length > 0) {
            // Process each insurance plan and create corresponding entries in db
            const results = [];

            for (const plan of insurancePlans) {
                const result = await InsuranceBought.create({
                    invoiceid: invoiceId,
                    planName: plan.planName,
                    planCategory: plan.planCategory,
                    featName: plan.featName,
                    featCost: plan.featCost,
                    featDescription: plan.featDescription,
                    totalCost: plan.totalCost,
                    cardName: formData.cardName,
                    cardType: formData.cardType,
                    cardNo: formData.cardNo,
                    cardExp: formData.expDate,
                    claimNewCost: plan.totalCost,
                    userId: userId // Assuming userId is added to link to the user
                });

                results.push(result); // Store each created entry result
            }
        }
        // Fetch all cart items for the user
        const insurancePlan = await InsuranceBought.findAll({
            where: { userId: userId, invoiceid: invoiceId },
            raw: true
        });

        const insurancePlanCreation = await InsuranceBought.findOne({
            where: { userId: userId, invoiceid: invoiceId },
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

        const emailBody = compileTemplate('invoiceEmail', {
            insurancePlan: insurancePlan,
            carDetails: carDetails,
            userDetails: userDetails,
            insurancePlanCreation: insurancePlanCreation
        });

        // Send the email
        sendEmail({
            to: 'nathalielichengyau@gmail.com',
            subject: 'GenWise - Payment Successful',
            body: emailBody,
            isHtml: true // Ensure the email is sent as HTML
        });

        //res.redirect('/insurancehome'); // Redirect to a success page or another route
        res.json({ success: true, redirectUrl: '/paymentsuccess' });

    } catch (error) {
        console.error('Error saving form data:', error);
        res.status(500).json({ message: 'Failed to process form data' });
    }
});

router.post('/submitClaim', async (req, res) => {
    // First handle the file uploads
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error while uploading files:', err);
            return res.status(400).send(err.message);
        }

        const { firstName, lastName, email, description, invoiceid, vehNo, DOI, amountClaimed } = req.body;
        const userId = req.user.id; // Assuming userId is stored in session

        console.log('firstname: ', firstName);
        console.log('invoiceid: ', invoiceid);
        console.log('vehNo: ', vehNo);

        try {
            // Create a new claim
            const newClaim = await Claims.create({
                invoiceid: invoiceid,
                first_name: firstName,
                last_name: lastName,
                email: email,
                vehNo: vehNo,
                claimDesc: description,
                amountClaimed: amountClaimed,
                dateOfIncident: DOI,
                userId: userId
            });

            // Process file uploads
            if (req.files && req.files.length > 0) {
                const fileUrls = req.files.map(file => `/claimUploads/${userId}/${file.filename}`);

                // Save file URLs to ClaimDocuments table
                for (const fileUrl of fileUrls) {
                    await ClaimDocument.create({
                        claimId: newClaim.id,
                        invoiceid: invoiceid,
                        documentPath: fileUrl
                    });
                }
            }
            // Redirect to success page
            res.redirect('/claimsuccess');
        } catch (err) {
            console.error('Error while submitting claim:', err);
            res.status(500).send('Server error');
        }
    });
});

module.exports = router;