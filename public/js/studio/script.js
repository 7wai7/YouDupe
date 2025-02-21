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

        const dropZone = document.getElementById("drop-zone");
        const uploadContent = document.getElementById("upload-information");
        const titleTextarea = document.getElementById('video-title-textarea');
        const descriptionTextarea = document.getElementById('video-description-textarea');

        const uploadedVideo = document.getElementById("uploaded-video");
        const videoPreview = document.getElementById("video-preview");
        const fileInput = document.getElementById("video-file-input");
        const fileInputPreview = document.getElementById("preview-file-input");

        function hideModal() {
            uploadVideoModal.setAttribute('hidden', '');

            dropZone.removeAttribute('hidden');
            uploadContent.setAttribute('hidden', '');
            titleTextarea.value = '';
            descriptionTextarea.value = '';
            uploadedVideo.src = '';
            videoPreview.src = '';
            fileInput.value = '';
            fileInputPreview.value = '';
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
        const uploadContent = document.getElementById("upload-information");
        const chooseFileBtn = document.getElementById("choose-file-btn");

        const fileInput = document.getElementById("video-file-input");
        const fileInputPreview = document.getElementById("preview-file-input");
        const uploadedVideo = document.getElementById("uploaded-video");
        const videoPreview = document.getElementById("video-preview");
    
        document.getElementById("upload-preview-btn").addEventListener("click", () => fileInputPreview.click());
        document.getElementById("create-preview-btn").addEventListener("click", createPreviewAutomatically);
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
    
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            
            if (file) {
                handleFile(file);
                /* e.target.value = ""; */ // Очищаємо значення інпуту, щоб можна було вибрати той самий файл
            }
        });
    
        fileInputPreview.addEventListener("change", (e) => {
            const file = e.target.files[0];
            uploadPreview(file);
        });
    
        function handleFile(file) {
            if (file && file.type.startsWith("video/")) {
                const fileURL = URL.createObjectURL(file);
                uploadedVideo.src = fileURL;
    
                uploadedVideo.onloadeddata = () => {
                    createPreviewAutomatically();
                };
    
                dropZone.setAttribute("hidden", "");
                uploadContent.removeAttribute("hidden");
            }
        }
    
        function createPreviewAutomatically() {
            uploadedVideo.crossOrigin = "anonymous";
            uploadedVideo.currentTime = 1; // Перемотуємо на 1 секунду, щоб уникнути чорного екрану
            uploadedVideo.muted = true;
            uploadedVideo.play();
    
            uploadedVideo.onseeked = null; // Очищаємо попередній обробник, якщо був
    
            uploadedVideo.addEventListener("seeked", function generatePreview() {
                const canvas = document.createElement("canvas");
                canvas.width = uploadedVideo.videoWidth;
                canvas.height = uploadedVideo.videoHeight;
                const ctx = canvas.getContext("2d");
    
                ctx.drawImage(uploadedVideo, 0, 0, canvas.width, canvas.height);
                videoPreview.src = canvas.toDataURL("image/png");
    
                uploadedVideo.removeEventListener("seeked", generatePreview); // Видаляємо обробник після виконання
            }, { once: true });
    
            uploadedVideo.currentTime = 0; // Перемотуємо на перший кадр
        }
    
        function uploadPreview(file) {
            if (file && file.type.startsWith("image/")) {
                const fileURL = URL.createObjectURL(file);
                videoPreview.src = fileURL;
            }
        }


        const previewFileInput = document.getElementById('preview-file-input');

        document.getElementById("upload-video-btn").addEventListener("click", () => {
            const formData = new FormData();

            // Додаємо текстові поля
            formData.append("title", document.getElementById('video-title-textarea').value);
            formData.append("description", document.getElementById('video-description-textarea').value);

            // Додаємо файли, якщо вони вибрані
            if (fileInput.files[0]) {
                formData.append("video", fileInput.files[0]);
            }
            if (previewFileInput.files[0]) {
                formData.append("preview", previewFileInput.files[0]);
            } else {
                // Створюємо Blob із dataURL прев’ю
                fetch(videoPreview.src)
                    .then(res => res.blob()) // Конвертуємо в Blob
                    .then(blob => {
                        const previewFile = new File([blob], "preview.png", { type: "image/png" });
                        formData.append("preview", previewFile);
        
                        // Відправляємо запит тільки після створення файлу
                        sendUploadRequest(formData);
                    });
                return; // Вийти, щоб не викликати `sendUploadRequest()` двічі
            }
        
            sendUploadRequest(formData);
        });

        function sendUploadRequest(formData) {
            fetch("api/studio/upload", {
                method: "POST",
                body: formData,
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
            .catch(console.error);
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