const toolHolder = document.getElementById('tool-holder');
const toolFrame = document.querySelector('#tool-holder > div > iframe');
const toolHolderDiv = document.querySelector('#tool-holder > div');

document.querySelectorAll("#tools > div").forEach(element => {
    element.onclick = () => {
        toolFrame.src = document.location + element.textContent + "/" + "index.html"
        toolHolder.style.visibility = 'visible';
        toolHolderDiv.classList.add('popin');
    }
});

document.querySelector(".titlebar > button").onclick = () => {
    toolFrame.src = "";
    toolHolder.style.visibility = 'collapse';
    toolHolderDiv.classList.remove('popin');
}