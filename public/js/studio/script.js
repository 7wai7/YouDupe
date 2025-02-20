document.addEventListener("DOMContentLoaded", () => {

    try {
        const filtersContainer = document.querySelector('.filters');
        const buttons = filtersContainer.querySelectorAll('button');

        buttons.forEach((btn) => {
            btn.addEventListener('click', (event) => {
                if(btn.hasAttribute('active')) {
                    btn.getAttribute('sort') === 'down' ? btn.setAttribute('sort', 'up') : btn.setAttribute('sort', 'down');
                } else {
                    const lastBtn = filtersContainer.querySelector('[active]');
                    lastBtn.removeAttribute('active');
                    lastBtn.removeAttribute('sort');
                    
                    btn.setAttribute('active', '');
                    btn.setAttribute('sort', 'down');
                }

                const sort = btn.getAttribute('sort');

                fetch(`/img/arrow-${sort}.svg`)
                .then(response => response.text())
                .then(html => {
                    const icon = document.getElementById('filter-icon');
                    btn.appendChild(icon);
                    icon.innerHTML = html;
                })
                .catch(console.error);


                const urlFilter = `?filter=${btn.id}&sort=${sort}`;
                history.replaceState({}, '', '/studio' + urlFilter);
                
                fetch('/api/studio/upload' + urlFilter, { method: "GET" })
                .then(response => response.text())
                .then(html => {
                    document.getElementById('content').innerHTML = html;
                })
                .catch(console.error);
            })
        })
    } catch (error) {
        console.log(error);
    }



    try {
        const createVideoBtn = document.getElementById('create-video-btn');
        const cancelUploadVideoBtn = document.getElementById('cancel-upload-video-btn');
        const uploadVideoModal = document.getElementById('upload-video-modal');

        function hideModal() {
            uploadVideoModal.setAttribute('hidden', '');
        }

        cancelUploadVideoBtn.addEventListener('click', (event) => {
            hideModal();
        });

        createVideoBtn.addEventListener('click', (event) => {
            uploadVideoModal.removeAttribute('hidden');
        });

        uploadVideoModal.addEventListener('click', (event) => {
            if(event.target === uploadVideoModal) {
                hideModal();
            }
        })
    } catch (error) {
        console.log(error);
    }



    try {
        const dropZone = document.getElementById("drop-zone");
        const uploadContent = document.getElementById('upload-information');
        const chooseFileBtn = document.getElementById('choose-file-btn');
        const fileInput = document.getElementById("file-input");
        const videoPreview = document.getElementById("video-preview");

        chooseFileBtn.addEventListener("click", () => fileInput.click());

        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.classList.add("dragover");
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("dragover");
        });

        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.classList.remove("dragover");

            const file = e.dataTransfer.files[0];
            handleFile(file);
        });

        // Завантаження файлу через input
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            handleFile(file);
        });

        function handleFile(file) {
            if (file && file.type.startsWith("video/")) {
                const fileURL = URL.createObjectURL(file);
                /* videoPreview.src = fileURL; */
                captureFirstFrame(fileURL);

                dropZone.setAttribute('hidden', '');
                uploadContent.removeAttribute('hidden');
            } else {
                alert("Будь ласка, завантажте відеофайл!");
            }
        }

        function captureFirstFrame(videoSrc) {
            const video = document.createElement("video");
            video.src = videoSrc;
            video.crossOrigin = "anonymous";
            video.currentTime = 1; // Встановлюємо на 1 секунду, щоб уникнути чорного екрану
            video.muted = true;
            video.play();
        
            video.addEventListener("loadeddata", () => {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
        
                video.addEventListener("seeked", () => {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    videoPreview.src = canvas.toDataURL("image/png");
                    videoPreview.style.display = "block";
                });
        
                video.currentTime = 0; // Перемотуємо на перший кадр
            });
        }

    } catch (error) {
        console.error(error);
    }




    try {
        const modal = document.getElementById('confirm-delete-modal');
        
        modal.addEventListener('click', (event) => {
            if(event.target === modal) {
                modal.setAttribute('hidden', '');
            }
        });

        document.getElementById('cancel-deletion-btn').addEventListener('click', (event) => {
            modal.setAttribute('hidden', '');
        })

        const deleteVideoBtnList = document.querySelectorAll('.delete-video-btn');
        
        deleteVideoBtnList.forEach((btn) => {
            btn.addEventListener('click', (event) => {
                modal.removeAttribute('hidden');
            })
        })
    } catch (error) {
        console.log(error);
    }






    try {
        const modal = document.getElementById('change-description-modal');
        const dropdownList = document.querySelectorAll('.description-dropdown');
        const changeBtn = document.getElementById('change-description-btn');
        const cancelBtn = document.getElementById('cancel-change-description-btn');


        dropdownList.forEach((dropdown) => {
            dropdown.addEventListener('mouseenter', (event) => {
                fetch('/img/arrow-2-down.svg')
                .then(response => response.text())
                .then(html => {
                    dropdown.querySelector('.description-dropdown-icon').innerHTML = html;
                })
                .catch(console.error);
            })
            
            dropdown.addEventListener('mouseleave', (event) => {
                fetch('/img/arrow-2-right.svg')
                .then(response => response.text())
                .then(html => {
                    dropdown.querySelector('.description-dropdown-icon').innerHTML = html;
                })
                .catch(console.error);
            })
            
            dropdown.addEventListener('click', (event) => {
                modal.removeAttribute('hidden');
            })
        })

        modal.addEventListener('click', (event) => {
            if(event.target === modal) {
                modal.setAttribute('hidden', '');
            }
        })

        cancelBtn.addEventListener('click', (event) => {
            modal.setAttribute('hidden', '');
        })
    } catch (error) {
        console.log(error);
    }
});