const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bodyParser = require("body-parser");
const moment = require('moment');
const Nutri = require('../models/Nutrition');
const multer = require('multer');
const cookieParser = require('cookie-parser');

router.use(cookieParser());


router.post('/submission', (req, res) => 
    {
        let {foodCode, foodName, calories, description, imgpath} = req.body;
        Nutri.create({ foodCode, foodName, calories, description, imgpath })
        res.redirect('/nutriDisplay')
    });

// POST route to UPDATE an attraction
router.post('/updateNutri', async (req, res) => {
    try {
        const { id, foodCode, foodName, calories, description, imgpath } = req.body;
        
        const [updatedRows] = await Nutri.update(
            { foodCode, foodName, calories, description, imgpath },
            { where: { id: id } }
        );

        if (updatedRows > 0) {
            res.redirect('/nutriDisplay');
        } else {
            res.status(404).send('Attraction not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
