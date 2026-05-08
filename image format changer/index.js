async function Main() {
    const fileInput = document.getElementById("fileInput");
    const icon = document.querySelector(".icon");
    const container = document.getElementById("container");
    const dropZone = document.getElementById("drop-zone");
    const detailsP = document.getElementById("details");
    const statusP = document.getElementById("status");
    const progressFill = document.getElementById("progressFill");
    const select = document.querySelector("select");

    const formats = {
        "0": { mime: "image/png", ext: "png" },
        "1": { mime: "image/png", ext: "png" },
        "2": { mime: "image/jpeg", ext: "jpg" },
        "3": { mime: "image/webp", ext: "webp" },
    };

    const allowedExtensions = [
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".svg",
        ".bmp",
        ".gif",
        ".avif",
        ".tiff",
        ".ico",
    ];

    function validExtension(file) {
        const name = file.name.toLowerCase();
        return allowedExtensions.some(ext => name.endsWith(ext));
    }

    function setLoading(isBusy) {
        icon.style.visibility = isBusy ? "hidden" : "visible";
        container.style.pointerEvents = isBusy ? "none" : "all";
        dropZone.className = isBusy ? "collapsed" : "";
        detailsP.style.visibility = isBusy ? "collapse" : "visible";
        statusP.className = isBusy ? "active" : "";
    }

    function setProgress(percent) {
        progressFill.style.width = `${percent}%`;
        statusP.textContent = `${Math.round(percent)}%`;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = filename;

        document.body.appendChild(a);

        a.click();

        a.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    async function loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };

            img.onerror = (e) => {
                URL.revokeObjectURL(url);
                reject(e);
            };

            img.src = url;
        });
    }

    async function createCanvasBlob(img, targetMime) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", {
            alpha: true,
            willReadFrequently: false,
        });

        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        if (targetMime === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0);

        let quality;

        switch (targetMime) {
            case "image/jpeg":
                quality = 0.86;
                break;

            case "image/webp":
                quality = 0.82;
                break;

            default:
                quality = undefined;
        }

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Canvas conversion failed."));
                        return;
                    }

                    resolve(blob);
                },
                targetMime,
                quality
            );
        });
    }

    async function optimizeBlob(blob, targetMime) {
        const options = {
            fileType: targetMime,
            useWebWorker: true,
            preserveExif: false,
            initialQuality: 0.82,
            alwaysKeepResolution: true,
            maxIteration: 10,
        };

        if (targetMime === "image/png") {
            options.initialQuality = 1;
            options.maxIteration = 2;
        }

        try {
            return await imageCompression(blob, options);
        } catch {
            return blob;
        }
    }

    async function convertSingleFile(file) {
        const selected = select.value;

        const {
            mime: targetMime,
            ext: targetExt,
        } = formats[selected];

        const img = await loadImage(file);

        let blob = await createCanvasBlob(img, targetMime);

        blob = await optimizeBlob(blob, targetMime);

        const baseName = file.name.replace(/\.[^/.]+$/, "");

        return {
            name: `${baseName}.${targetExt}`,
            blob,
        };
    }

    async function changeFormats(files) {
        setLoading(true);

        try {
            const total = files.length;

            if (total === 1) {
                statusP.textContent = "Converting...";

                const converted = await convertSingleFile(files[0]);

                setProgress(100);

                downloadBlob(converted.blob, converted.name);

                statusP.textContent = "Done";

                return;
            }

            const zip = new JSZip();

            for (let i = 0; i < total; i++) {
                const converted = await convertSingleFile(files[i]);

                zip.file(converted.name, converted.blob);

                const percent = ((i + 1) / total) * 100;

                setProgress(percent);

                statusP.textContent =
                    `${i + 1} / ${total} converted`;
            }

            statusP.textContent = "Creating ZIP...";

            const zipBlob = await zip.generateAsync(
                {
                    type: "blob",
                    compression: "DEFLATE",
                    compressionOptions: {
                        level: 9,
                    },
                },
                (metadata) => {
                    progressFill.style.width =
                        `${metadata.percent}%`;
                }
            );

            downloadBlob(zipBlob, "images.zip");

            statusP.textContent = "Done";

        } catch (e) {
            console.error(e);
            statusP.textContent = "Error";
        } finally {
            setTimeout(() => {
                progressFill.style.width = `0%`;
                statusP.textContent = `0%`;

                setLoading(false);
            }, 1000);
        }
    }

    fileInput.addEventListener("change", () => {
        setProgress(0);

        const files =
            [...fileInput.files].filter(validExtension);

        if (files.length) {
            changeFormats(files);
        }

        fileInput.value = "";
    });

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragging");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragging");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();

        dropZone.classList.remove("dragging");

        setProgress(0);

        const files =
            [...e.dataTransfer.files].filter(validExtension);

        if (files.length) {
            changeFormats(files);
        }
    });
}

Main();

// https://www.w3schools.com/howto/howto_custom_select.asp
(() => {
    const selects =
        document.getElementsByClassName("custom-select");

    for (let i = 0; i < selects.length; i++) {
        const wrapper = selects[i];

        const select =
            wrapper.getElementsByTagName("select")[0];

        const selected = document.createElement("DIV");

        selected.className = "select-selected";

        selected.innerHTML =
            select.options[select.selectedIndex].innerHTML;

        wrapper.appendChild(selected);

        const list = document.createElement("DIV");

        list.className =
            "select-items select-hide";

        for (let j = 1; j < select.length; j++) {
            const option = document.createElement("DIV");

            option.innerHTML =
                select.options[j].innerHTML;

            option.addEventListener("click", function () {
                const s =
                    this.parentNode.parentNode
                        .getElementsByTagName("select")[0];

                const h =
                    this.parentNode.previousSibling;

                for (let k = 0; k < s.length; k++) {
                    if (
                        s.options[k].innerHTML ===
                        this.innerHTML
                    ) {
                        s.selectedIndex = k;
                        h.innerHTML = this.innerHTML;

                        const active =
                            this.parentNode.getElementsByClassName(
                                "same-as-selected"
                            );

                        for (let m = 0; m < active.length; m++) {
                            active[m].removeAttribute("class");
                        }

                        this.className =
                            "same-as-selected";

                        break;
                    }
                }

                h.click();
            });

            list.appendChild(option);
        }

        wrapper.appendChild(list);

        selected.addEventListener("click", function (e) {
            e.stopPropagation();

            closeAllSelect(this);

            this.nextSibling.classList.toggle(
                "select-hide"
            );

            this.classList.toggle(
                "select-arrow-active"
            );
        });
    }

    function closeAllSelect(elmnt) {
        const items =
            document.getElementsByClassName("select-items");

        const selected =
            document.getElementsByClassName("select-selected");

        const arrNo = [];

        for (let i = 0; i < selected.length; i++) {
            if (elmnt === selected[i]) {
                arrNo.push(i);
            } else {
                selected[i].classList.remove(
                    "select-arrow-active"
                );
            }
        }

        for (let i = 0; i < items.length; i++) {
            if (arrNo.indexOf(i) === -1) {
                items[i].classList.add("select-hide");
            }
        }
    }

    document.addEventListener("click", closeAllSelect);
})();