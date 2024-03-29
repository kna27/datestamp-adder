// Dependencies
const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const ExifImage = require('exif').ExifImage;
const Jimp = require('jimp');

// Constants
const fileSizeLimit = 10000000; // The limit on the file's size in bytes
const fileLifeTime = 1000 * 60 * 60; // The time until the file is deleted from the server in milliseconds
const uploadsPath = './public/uploads/';
const positions = {
    TOPLEFT: 0,
    TOPRIGHT: 1,
    BOTTOMLEFT: 2,
    BOTTOMRIGHT: 3
}
// Name the uploaded files and state their destination 
const storage = multer.diskStorage({
    destination: uploadsPath,
    filename: function (req, file, cb) {
        // Add the current date to the image's name to prevent conflicting files
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
// State the max file size
const upload = multer({
    storage: storage,
    limits: { fileSize: fileSizeLimit },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('img');

// Variables
var dateTaken;
var fileName;
var datestampedFileName;
var rotateNeeded = false;
var position = positions.BOTTOMRIGHT;
var font = 'fonts/Roboto-Regular_orange64.fnt';
var dateFormatType = "dateandtime12";
var uploadCount;

fs.readFile("./uploads", "utf8", (err, data) => {
    if (err) {
        console.error(err);
        uploadCount = 0;
        return;
    }
    uploadCount = data;
});

function updateUploadCount() {
    uploadCount++;
    console.log(`Uploads: ${uploadCount}`); // Do not delete this, it can be useful for recovery
    fs.writeFile("./uploads", uploadCount.toString(), err => {
        if (err) {
            console.error(err);
            return;
        }
    });
}

// Only allow image files
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const minetype = filetypes.test(file.mimetype);

    if (minetype && extname) {
        return cb(null, true);
    } else {
        if (path.extname(file.originalname) == ".png" || path.extname(file.originalname) == ".jfif") {
            cb("Error: only JPG and JPEG files are supported!");
        } else {
            cb("Error: Images Only!");
        }
    }
}

// Set the position based on user selected option
function setPosition(pos) {
    switch (pos) {
        case "tl":
            position = positions.TOPLEFT;
            break;
        case "tr":
            position = positions.TOPRIGHT;
            break;
        case "bl":
            position = positions.BOTTOMLEFT;
            break;
        case "br":
            position = positions.BOTTOMRIGHT;
            break;
    }
}

// Set the font based on user selected options
function setFont(color, size) {
    font = `fonts/Roboto-Regular_${color}${size}.fnt`;
}

// Format the date based on user selected option
function formatDate() {
    var date = dateTaken.split(" ")[0];
    var time = dateTaken.split(" ")[1];
    date = date.split(":");
    date = date[1] + "/" + date[2] + "/" + date[0];

    var ending = ' AM';
    var time12hr = time.split(":");
    if (time12hr[0] >= 12) {
        ending = ' PM';
    }
    time12hr[0] = time12hr[0] % 12;
    if (time12hr[0] == 0) {
        time12hr[0] == 12;
    }
    time12hr = time12hr.join(":") + ending;
    switch (dateFormatType) {
        case "dateandtime12":
            dateTaken = date + " " + time12hr;
            break;
        case "dateandtime24":
            dateTaken = date + " " + time;
            break;
        case "date":
            dateTaken = date;
            break;
        case "time12":
            dateTaken = time12hr;
            break;
        case "time24":
            dateTaken = time;
            break;
    }
}

// On startup, delete all files that have been uploaded
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

// Use cookie parser
app.use(cookieParser());

// Show the /views/index.ejs file to the user
app.get('/', (req, res) => res.render('index'));

// Uploading a file to the server
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        // Update position and font based on user selected options
        setPosition(req.body.pos);
        setFont(req.body.color, req.body.fontsize);
        dateFormatType = req.body.dateformat;

        // If there is an error, show the message
        if (err) {
            res.render('index', {
                msg: err
            });
        } else {
            // If the user didn't upload a file and hasn't uploaded one in the past
            if (req.cookies.fileName == undefined && req.file == undefined) {
                res.render('index', {
                    msg: "Error: Upload a file first!"
                });
            }
            // If the file uploaded successfully
            else {
                if (req.file != undefined) {
                    fileName = `public/uploads/${req.file.filename}`;
                    datestampedFileName = `public/uploads/stamped_${req.file.filename}`;
                    res.cookie("fileName", fileName);
                    res.cookie("datestampedFileName", datestampedFileName);

                    console.log(fileName + "   |   " + req.file != undefined ? `public/uploads/${req.file.filename}` : req.cookies.fileName);
                    // Delete the files after one hour
                    setTimeout(function () {
                        fs.unlink(fileName, (err) => {
                            if (err) {
                                console.error(err)
                                return;
                            }
                        });
                        fs.unlink(datestampedFileName, (err) => {
                            if (err) {
                                console.error(err)
                                return;
                            }
                        });
                    }, fileLifeTime);
                }

                updateUploadCount();

                dateTaken = null;
                // Read image metadata, narrow down to only the date/time
                try {
                    new ExifImage({ image: req.file != undefined ? `public/uploads/${req.file.filename}` : req.cookies.fileName }, function (error, exifData) {
                        if (error) {
                            console.log(req.file != undefined ? `public/uploads/${req.file.filename}` : req.cookies.fileName + ' | Error: ' + error.message);
                            dateTaken = " ";
                        } else {
                            dateTaken = exifData.image.ModifyDate != undefined ? exifData.image.ModifyDate : " ";
                            if (exifData.image.Orientation == 6) {
                                rotateNeeded = true;
                            }

                            // Format date better
                            if (dateTaken != " ") {
                                formatDate();
                            }
                        }
                    });
                } catch (error) {
                    console.log('Error: ' + error.message);
                    dateTaken = " ";
                    res.render('index', {
                        msg: "Error: Cannot find metadata of the image."
                    });
                }

                // Add datestamp onto image
                try {
                    Jimp.read(req.file != undefined ? `public/uploads/${req.file.filename}` : req.cookies.fileName)
                        .then(function (image) {
                            loadedImage = image;
                            return Jimp.loadFont(font);
                        })
                        .then(function (font) {
                            switch (position) {
                                case positions.TOPLEFT:
                                    loadedImage.print(font, 10, 10, dateTaken)
                                        .write(req.file != undefined ? `public/uploads/stamped_${req.file.filename}` : req.cookies.datestampedFileName);
                                    break;
                                case positions.TOPRIGHT:
                                    loadedImage.print(font, loadedImage.bitmap.width - Jimp.measureText(font, dateTaken), 10, dateTaken)
                                        .write(req.file != undefined ? `public/uploads/stamped_${req.file.filename}` : req.cookies.datestampedFileName);
                                    break;
                                case positions.BOTTOMLEFT:
                                    loadedImage.print(font, 10, loadedImage.bitmap.height - Jimp.measureTextHeight(font, dateTaken), dateTaken)
                                        .write(req.file != undefined ? `public/uploads/stamped_${req.file.filename}` : req.cookies.datestampedFileName);
                                    break;
                                case positions.BOTTOMRIGHT:
                                    loadedImage.print(font, loadedImage.bitmap.width - Jimp.measureText(font, dateTaken), loadedImage.bitmap.height - Jimp.measureTextHeight(font, dateTaken), dateTaken)
                                        .write(req.file != undefined ? `public/uploads/stamped_${req.file.filename}` : req.cookies.datestampedFileName);
                                    break;
                            }

                            // Make sure image is rotated correctly
                            if (rotateNeeded) {
                                loadedImage.rotate(90)
                                    .write(req.file != undefined ? `public/uploads/stamped_${req.file.filename}` : req.cookies.datestampedFileName);
                                rotateNeeded = false;
                            }

                            // Show image on the webpage
                            res.render('index', {
                                msg: dateTaken == " " ? "No metadata found on your image!" : "Datestamp added!",
                                file: dateTaken == " " ? undefined : req.file != undefined ? `uploads/${path.basename(`public/uploads/stamped_${req.file.filename}`)}` : `uploads/${path.basename(req.cookies.datestampedFileName)}`
                            });
                        })
                        .catch(function (err) {
                            console.error(err);
                        });
                }
                catch (error) {
                    res.render('index', {
                        msg: 'No metadata found on your image!',
                    });
                    console.log(error);
                }
            }
        }
    });
});

app.get("/about", (req, res) => {
    res.render('about', {
        uploadcount: uploadCount
    });
});

app.get("/home", (req, res) => {
    res.render('index');
});

// Listen on port 5000
app.listen(process.env.PORT || 5000);
console.log("Listening at http://127.0.0.1:5000");