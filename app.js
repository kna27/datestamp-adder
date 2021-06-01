// Constants
const fileSizeLimit = 10000000; // The limit on the file's size in bytes
const fileLifeTime = 1000 * 60 * 60; // The time until the file is deleted from the server in milliseconds
const uploadsPath = './public/uploads/';

// Dependencies
const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
var ExifImage = require('exif').ExifImage;
const Jimp = require("jimp");

// Name the uploaded files and state their destination 
const storage = multer.diskStorage({
    destination: uploadsPath,
    filename: function (req, file, cb) {
        // Add the current date to the image's name to prevent conflicting files
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})

// State the max file size
const upload = multer({
    storage: storage,
    limits: { fileSize: fileSizeLimit },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('imageField')

// Only allow image files
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    const minetype = filetypes.test(file.mimetype);

    if (minetype && extname) {
        return cb(null, true);
    } else {
        if (path.extname(file.originalname) == ".png") {
            cb("Error: only JPG and JPEG files are supported!");
        } else {
            cb("Error: Images Only!");
        }
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
        } else {

            // If the user didn't upload a file
            if (req.file == undefined) {
                res.render('index', {
                    msg: "Error: Upload a file first!"
                });
            }

            // If the file uploaded successfully
            else {
                console.log(Date.now());
                // Delete the file after one hour
                setTimeout(function () {
                    fs.unlink(`public/uploads/${req.file.filename}`, (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                    });
                }, fileLifeTime);

                // Display the image on the website
                res.render('index', {
                    msg: 'File Uploaded!',
                    file: `uploads/${req.file.filename}`
                })

                let picture = `public/uploads/${req.file.filename}`;

                // Read image metadata, narrow down to only the date/time
                try {
                    new ExifImage({ image: picture }, function (error, exifData) {
                        if (error) {
                            console.log(picture + ' | Error: ' + error.message);
                        } else
                            console.log(exifData.image.ModifyDate);
                    });
                } catch (error) {
                    console.log('Error: ' + error.message);
                }
            }
        }
    })
})

// Listen on port 5000
app.listen(process.env.PORT || 5000);
console.log("Listening at http://127.0.0.1:5000");