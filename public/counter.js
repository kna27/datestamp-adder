const uploadCountsElm = document.getElementById("uploadcounts");
const duration = 1500;
var startText = uploadCountsElm.innerHTML.split(":")[0] + ": ";
var uploadNum = parseInt(uploadCountsElm.innerHTML.split(":")[1].trim());
var end = uploadNum;
var current = 0;
var stepTime = Math.abs(Math.floor(duration / end));
step = Math.ceil(end/duration*4);
uploadCountsElm.innerHTML = startText + "0";
uploadCountsElm.style.visibility = "visible";
var timer = setInterval(function() {
    current += step;
    uploadCountsElm.innerHTML = startText + current;
    if (current >= end - step) {
        clearInterval(timer);
        uploadCountsElm.innerHTML = startText + end;
    }
}, stepTime);