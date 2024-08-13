const multer = require('multer');
const path = require('path');
const fs = require('fs');

//set the storage engine
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const userDir = `./public/claimUploads/${req.user.id}`;

        // Check if the user directory exists, create if not
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        callback(null, userDir);
    },
    filename: (req, file, callback) => {
        // Set the file name to include a timestamp to avoid duplicates
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

//initialise upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        checkFileType(file, callback);
    }
}).array('docUpload'); //must be the name as the html file upload input

//check file type
function checkFileType(file, callback) {
    //allowed file extensions
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    //Test extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    //Test mime type
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return callback(null, true);
    } else {
        callback({ message: 'Images/Documents Only' });
    }
}
module.exports = upload;