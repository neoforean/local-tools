const { FFmpeg } = FFmpegWASM;

const ffmpeg = new FFmpeg({
    classWorkerURL: '../ffmpeg/814.ffmpeg.js'
});

const progressFill = document.getElementById('progressFill');

ffmpeg.on('progress', ({ progress }) => {
    // 0-1 to 0-100
    progress = progress * 100;
    progressFill.style.width = `${progress}%`;
    statusP.textContent =  `${Math.round(progress)}%`;
});

ffmpeg.on('log', ({ message }) => {
    console.log(message);
});

const fileInput = document.getElementById('fileInput');
const statusBar = document.getElementById('statusBar');
const icon = document.querySelector('.icon');
const container = document.getElementById("container");
const dropZone = document.getElementById("drop-zone");
const allowedExtensions = ['.mp4', '.mkv', '.webm', '.mov', '.avi'];
const detailsP = document.getElementById("details");
const statusP = document.getElementById("status");

const setLoading = (isBusy) => {
    statusBar.classList.toggle('active', isBusy);
    icon.style.visibility = isBusy ? 'hidden' : 'visible';
    container.style.pointerEvents = isBusy ? 'none' : 'all';
    dropZone.classList = isBusy ? "collapsed" : "";
    detailsP.style.visibility = isBusy ? "collapse" : "visible"; 
    statusP.classList = isBusy ? "active" : "";
};

function validExtension(file) {
    const name = file.name.toLowerCase();
    return allowedExtensions.some(ext => name.endsWith(ext));
}

fileInput.addEventListener('change', () => {
    progressFill.style.width = `0`;
    statusP.textContent = `0%`;

    const file = fileInput.files?.[0];

    if (file && validExtension(file)) {
        convert(file);
    }
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');

    progressFill.style.width = `0`;
    statusP.textContent = `0%`;

    const file = e.dataTransfer.files?.[0];

    if (file && validExtension(file)) {
        fileInput.files = e.dataTransfer.files;
        convert(file);
    }
});

const fileToArray = (file) =>
    new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsArrayBuffer(file);
    });

async function convert(file) {
    setLoading(true);

    try {
        if (!ffmpeg.loaded) await ffmpeg.load();

        const data = new Uint8Array(await fileToArray(file));

        const inputName = `input.${file.name.split('.').pop()}`;
        await ffmpeg.writeFile(inputName, data);

        await ffmpeg.exec([
            '-i', inputName,
            '-vn',
            '-acodec', 'libmp3lame',
            '-ar', '44100',
            '-ac', '2',
            'output.mp3'
        ]);

        const mp3 = await ffmpeg.readFile('output.mp3');
        const blob = new Blob([mp3.buffer], { type: 'audio/mp3' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audio.mp3';
        a.click();
        a.remove();

    } catch (e) {
        console.error(e);
    } finally {
        progressFill.style.width = `0`;
        statusP.textContent = `0%`;

        setLoading(false);
    }
}