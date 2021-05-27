// Dependencies
const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

// Name the uploaded files and state their destination 
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        // Add the current date to the image's name to prevent conflicting files
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})

// State the max file size
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('imageField')

// Only allow image files
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    const minetype = filetypes.test(file.mimetype);

    if (minetype && extname) {
        return cb(null, true);
    }
    else {
        cb("Error: Images Only!");
    }
}

// Using express as the server
const app = express();

// Use ejs instead of HTML to display elements to the user
app.set('view engine', 'ejs');

// Serve everything in the /public folder
app.use(express.static(__dirname + '/public'));

// Show the /views/index.ejs file to the user
app.get('/', (req, res) => res.render('index'));

// Uploading a file to the server
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        // If there is an error
        if (err) {
            res.render('index', {
                msg: err
            });
        }
        else {
            // If the user didn't upload a file
            if (req.file == undefined) {
                res.render('index', {
                    msg: "Error: Upload a file first!"
                });
            }
            // If the file uploaded successfully
            else {
                // Delete the file after one hour
                setTimeout(function () {
                    fs.unlink(`public/uploads/${req.file.filename}`, (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                    });
                }, 1000 * 60 * 60);
                // Display the image on the website
                res.render('index', {
                    msg: 'File Uploaded!',
                    file: `uploads/${req.file.filename}`
                })
            }
        }
    })
})

// Listen on port 5000
app.listen(process.env.PORT || 5000);
