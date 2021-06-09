const submitBtn = document.getElementById("submit");
const posBtns = document.getElementsByName("pos");
const fontColor = document.getElementById("color");
const fontSize = document.getElementById("fontsize");

submitBtn.onclick = function () {
    for (i = 0; i < posBtns.length; i++) {
        if (posBtns[i].checked) {
            sessionStorage.setItem("pos", posBtns[i].value);
        }
    }
    sessionStorage.setItem("color", fontColor.value);
    sessionStorage.setItem("size", fontSize.value);
}
document.getElementById(sessionStorage.getItem("pos") == null ? "br" : sessionStorage.getItem("pos")).checked = true;
fontColor.value = sessionStorage.getItem("color") == null ? "orange" : sessionStorage.getItem("color");
fontSize.value = sessionStorage.getItem("size") == null ? "64" : sessionStorage.getItem("size");
