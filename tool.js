document.querySelectorAll("#tools > div").forEach(element => {
    element.onclick = () => {
        document.location = document.location + element.textContent + "/" + "index.html"
    }
});