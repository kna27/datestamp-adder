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

var dateTaken;
var fileName;
var rotateNeeded = false;


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

// Delete all files that have been uploaded
fs.readdir(uploadsPath, (err, files) => {
    if (err) throw err;

    for (const file of files) {
        fs.unlink(path.join(uploadsPath, file), err => {
            if (err) throw err;
        });
    }
});

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
                fileName = `public/uploads/${req.file.filename}`;
                // Delete the file after one hour
                setTimeout(function () {
                    fs.unlink(fileName, (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                    });
                }, fileLifeTime);

                // Display the image on the website

                let picture = fileName;

                // Read image metadata, narrow down to only the date/time
                try {
                    new ExifImage({ image: picture }, function (error, exifData) {
                        if (error) {
                            console.log(picture + ' | Error: ' + error.message);
                        } else {
                            console.log(exifData.image.ModifyDate);
                            dateTaken = exifData.image.ModifyDate;
                            if(exifData.image.Orientation == 6){
                                rotateNeeded = true;
                            }
                            
                            if (dateTaken == undefined) {
                                res.render('index', {
                                    msg: "Error: Cannot find metadata of the image."
                                });
                            }
                            else {
                                // format date better
                                var date = dateTaken.split(" ")[0];
                                var time = dateTaken.split(" ")[1];
                                date = date.split(":");
                                date = date[1] + "/" + date[2] + "/" + date[0];
                                dateTaken = date + " " + time;
                            }
                        }
                    });
                } catch (error) {
                    console.log('Error: ' + error.message);
                }
            }

            // Add datestamp onto image
            try {
                Jimp.read(fileName)
                    .then(function (image) {
                        loadedImage = image;
                        return Jimp.loadFont('fonts/Roboto-Regular_Orange64.fnt');
                    })
                    .then(function (font) {
                        loadedImage.print(font, loadedImage.bitmap.width - 700, loadedImage.bitmap.height * (15.5/16), dateTaken)  // print date on bottom right corner
                            .write(fileName); 

                        // make sure image is rotated correctly
                        if (rotateNeeded) {
                            loadedImage.rotate(90)
                                .write(fileName);
                            rotateNeeded = false;
                        }

                        res.render('index', {
                            msg: 'Datestamp Added!',
                            file: `uploads/${req.file.filename}`
                        })
                    })
                    .catch(function (err) {
                        console.error(err);
                    });
            }
            catch (error) {
                res.render('index', {
                    msg: 'No metadata found on your image!',
                })
                console.log(error);
            }
            
        }
    })
})

// Listen on port 5000
app.listen(process.env.PORT || 5000);
console.log("Listening at http://127.0.0.1:5000");