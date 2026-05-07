const toolHolder = document.getElementById('tool-holder');
const toolFrame = document.querySelector('#tool-holder > div > iframe');
const toolHolderDiv = document.querySelector('#tool-holder > div');
const titlebarLabel = document.querySelector('.titlebar > p');

document.querySelectorAll("#tools > div").forEach(element => {
    
    element.onclick = () => {
        toolFrame.src = (document.location.href.includes("index.html") ? document.location.href.substring(0, document.location.href.length - "index.html".length) : document.location) + element.textContent + "/" + "index.html";
        titlebarLabel.textContent = element.textContent;
        toolHolderDiv.classList.add('popin');
        toolHolder.style.visibility = 'visible';
    }
});

document.querySelector(".titlebar > button").onclick = () => {
    toolFrame.src = "";
    toolHolder.style.visibility = 'collapse';
    toolHolderDiv.classList.remove('popin');
}