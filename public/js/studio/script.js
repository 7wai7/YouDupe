document.addEventListener("DOMContentLoaded", () => {

    try {
        const filtersContainer = document.querySelector('.filters');
        const buttons = filtersContainer.querySelectorAll('button');

        buttons.forEach((btn) => {
            btn.addEventListener('click', (event) => {
                if (btn.hasAttribute('active')) {
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
    } catch (error) {
        console.log(error);
    }



    try {
        const dropZone = document.getElementById("drop-zone");
        const uploadContent = document.getElementById("upload-information");
        const chooseFileBtn = document.getElementById("choose-file-btn");

        const videoFileInput = document.getElementById("video-file-input");
        const previewFileInput = document.getElementById("preview-file-input");

        const uploadedVideo = document.getElementById("uploaded-video");
        const videoPreview = document.getElementById("video-preview");

        document.getElementById("upload-preview-btn").addEventListener("click", () => previewFileInput.click());
        document.getElementById("create-preview-btn").addEventListener("click", createPreviewAutomatically);
        chooseFileBtn.addEventListener("click", () => videoFileInput.click());


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


        videoFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            handleFile(file);
        });

        previewFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            
            if (file && file.type.startsWith("image/")) {
                previewFileInput.value = ""; // Очищаємо input, щоб можна було вибрати той самий файл ще раз
                videoPreview.src = ""; // Очищаємо прев'ю перед оновленням

                const fileURL = URL.createObjectURL(file);
                videoPreview.src = fileURL;
                videoPreview.file = file; // Зберігаємо файл у змінну, щоб передати на сервер
            }
        });


        function handleFile(file) {
            if (file && file.type.startsWith("video/")) {
                const fileURL = URL.createObjectURL(file);
                uploadedVideo.src = fileURL;

                uploadedVideo.onloadeddata = () => {
                    createPreviewAutomatically();

                    videoFileInput.value = '';
                    dropZone.setAttribute("hidden", "");
                    uploadContent.removeAttribute("hidden");
                };
            }
        }

        function createPreviewAutomatically() {
            uploadedVideo.crossOrigin = "anonymous";
            uploadedVideo.currentTime = 1; // Перемотуємо на 1 секунду, щоб уникнути чорного екрану

            uploadedVideo.onseeked = null; // Очищаємо попередній обробник, якщо був

            uploadedVideo.addEventListener("seeked", function generatePreview() {
                const canvas = document.createElement("canvas");
                canvas.width = uploadedVideo.videoWidth;
                canvas.height = uploadedVideo.videoHeight;
                const ctx = canvas.getContext("2d");

                ctx.drawImage(uploadedVideo, 0, 0, canvas.width, canvas.height);
                videoPreview.src = canvas.toDataURL("image/png");

                canvas.toBlob(blob => {
                    videoPreview.file = new File([blob], "preview.png", { type: "image/png" });
                }, "image/png");

                uploadedVideo.removeEventListener("seeked", generatePreview); // Видаляємо обробник після виконання
            }, { once: true });
        }


        document.getElementById("upload-video-btn").addEventListener("click", () => {
            const formData = new FormData();

            // Перевірка наявності відео перед відправкою
            if (!uploadedVideo.src) {
                console.error("Файл відео не завантажений!");
                return;
            }
            
            // Додаємо текстові поля
            formData.append("duration", uploadedVideo.duration);
            formData.append("title", document.getElementById('video-title-textarea').value);
            formData.append("description", document.getElementById('video-description-textarea').value);

            try {
                fetch(uploadedVideo.src)
                    .then(res => res.blob())
                    .then(blob => {
                        const fileType = blob.type || "video/mp4"; // Якщо тип невідомий, встановлюємо MP4
                        const fileExt = fileType.split("/")[1] || "mp4"; // Отримуємо розширення
                        const videoFile = new File([blob], `video.${fileExt}`, { type: fileType });

                        formData.append("video", videoFile);

                        if (videoPreview.file) {
                            formData.append("preview", videoPreview.file);
                            sendUploadRequest(formData);
                        } else {
                            console.error("Прев’ю не створене!");
                        }
                    })
                    .catch(err => console.error("Помилка при створенні файлу:", err));
            } catch (error) {
                console.error("Помилка завантаження відео:", error);
            }
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
            if (event.target === modal) {
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
            if (event.target === modal) {
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