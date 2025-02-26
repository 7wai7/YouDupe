
document.addEventListener("DOMContentLoaded", () => {

    function loadVideos() {
        const urlParams = new URLSearchParams(window.location.search);
        const filter = urlParams.get('filter') || 'createdAt';
        const sort = urlParams.get('sort') || 'down';

        fetch(`/img/arrow-${sort}.svg`)
            .then(response => response.text())
            .then(html => {
                const icon = document.getElementById('filter-icon');
                icon.innerHTML = html;
                document.querySelector(`[data-btnfilter="${filter}"]`).appendChild(icon);
            })
            .catch(console.error);

        document.querySelector('#filters .active').classList.remove('active');
        document.querySelector(`[data-btnfilter="${filter}"]`).classList.add('active');


        const container = document.getElementById('video-content');
        const offset = container.querySelectorAll('.video').length;

        fetch(`/api/studio/videos?filter=${filter}&sort=${sort}&limit=20&offset=${offset}`, { method: "GET" })
            .then(response => response.text())
            .then(htmlText => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlText;

                while (tempDiv.firstChild) {
                    container.appendChild(tempDiv.firstChild);
                }

                tempDiv.remove();
            })
            .catch(console.error);
    }



    // ОБРОБКА КЛІКІВ НА ФІЛЬТРАХ

    try {
        const filtersContainer = document.getElementById('filters');

        filtersContainer.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', (event) => {
                const filter = filtersContainer.dataset.filter;
                const sort = filtersContainer.dataset.sort;

                if (btn.dataset.btnfilter === filter) {
                    filtersContainer.dataset.sort = sort === 'down' ? 'up' : 'down'
                } else {
                    filtersContainer.dataset.filter = btn.dataset.btnfilter;
                    filtersContainer.dataset.sort = 'down';
                }

                const newFilter = filtersContainer.dataset.filter;
                const newSort = filtersContainer.dataset.sort;

                history.replaceState({}, '', `/studio?filter=${newFilter}&sort=${newSort}`);
                document.getElementById('video-content').innerHTML = '';
                loadVideos();
            })
        })

        loadVideos();
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




        const chooseFileBtn = document.getElementById("choose-file-btn");

        const videoFileInput = document.getElementById("video-file-input");
        const previewFileInput = document.getElementById("preview-file-input");


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
            if (document.getElementById('upload-video-btn').hasAttribute('notAvailable')) return;

            document.getElementById('upload-video-btn').setAttribute('notAvailable', '');
            const spinner = document.querySelector('.upload-video-btn-wrapper .loading-spinner');
            spinner?.classList.toggle('spinner');
            spinner?.removeAttribute('hidden');


            const formData = new FormData();

            // Перевірка наявності відео перед відправкою
            if (!uploadedVideo.src) {
                console.error("Файл відео не завантажений!");
                return;
            }

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
                .then(response => {
                    if (response.ok) {
                        document.getElementById('upload-video-btn').removeAttribute('notAvailable');
                        spinner?.classList.toggle('spinner');
                        spinner?.setAttribute('hidden', '');
                        hideModal();
                    }
                    return response.json()
                })
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
        const changeBtn = document.getElementById('change-description-btn');
        const cancelBtn = document.getElementById('cancel-change-description-btn');
        const videoContent = document.getElementById('video-content');
    
        
        videoContent.addEventListener('mouseover', (event) => {
            const dropdown = event.target.closest('.description-dropdown');
            if (!dropdown) return;
    
            fetch('/img/arrow-2-right.svg')
                .then(response => response.text())
                .then(html => {
                    dropdown.querySelector('.description-dropdown-icon').innerHTML = html;
                })
                .catch(console.error);
        });
    
        videoContent.addEventListener('mouseout', (event) => {
            const dropdown = event.target.closest('.description-dropdown');
            if (!dropdown) return;
    
            fetch('/img/arrow-2-down.svg')
                .then(response => response.text())
                .then(html => {
                    dropdown.querySelector('.description-dropdown-icon').innerHTML = html;
                })
                .catch(console.error);
        });
    
        // Обробник кліку для відкриття модального вікна
        videoContent.addEventListener('click', (event) => {
            const dropdown = event.target.closest('.description-dropdown');
            if (!dropdown) return;
    
            modal.removeAttribute('hidden');
        });
    
        // Закриття модального вікна при кліку поза ним\
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.setAttribute('hidden', '');
            }
        });
    
        // Закриття модального вікна при натисканні кнопки "Скасувати"
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.setAttribute('hidden', '');
            });
        }
    } catch (error) {
        console.error(error);
    }
    
});