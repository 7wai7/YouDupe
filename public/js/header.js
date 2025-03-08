
document.addEventListener("DOMContentLoaded", async () => {

    try {
        const modal = document.getElementById("auth-modal");
        const form = document.getElementById("auth-form");
        const submitBtn = document.getElementById("submit");
        const showSignupPanelBtn = document.getElementById("show-signup-panel-btn");
        const forgotPasswordBtn = document.querySelector('.forgot-password-btn');
        const login = document.getElementById("login");
        const confirmPasswordContainer = document.getElementById("confirm-password-container");
        const errorMessage = document.querySelector(".error-message");
    
        function updatePanel() {
            const isLogin = form.dataset.type === "login";
    
            form.action = isLogin ? "/api/auth/login" : "/api/auth/signup";
            modal.querySelector('h2').textContent = isLogin ? "Login" : "Signup";
            submitBtn.textContent = isLogin ? "Login" : "Signup";
    
            login.toggleAttribute("hidden", isLogin);
            confirmPasswordContainer.toggleAttribute("hidden", isLogin);
            forgotPasswordBtn.toggleAttribute("hidden", !isLogin);
            showSignupPanelBtn.toggleAttribute("hidden", !isLogin);

            
            document.getElementById("login").style.borderColor = 'black';
            document.getElementById("email").style.borderColor = 'black';
            document.getElementById("password").style.borderColor = 'black';
            document.getElementById("confirm-password").style.borderColor = 'black';
    
            form.reset(); // Очищення форми
            errorMessage.setAttribute("hidden", ""); // Приховати повідомлення про помилки
        }
    
        document.querySelector(".authorise-btn").addEventListener("click", () => {
            modal.removeAttribute("hidden");
            form.dataset.type = "login";
            updatePanel();
        });
    
        modal.addEventListener("click", (event) => {
            if (event.target === modal) modal.setAttribute("hidden", "");
        });
    
        showSignupPanelBtn.addEventListener("click", () => {
            form.dataset.type = "signup";
            updatePanel();
        });
    
        form.addEventListener("submit", async (event) => {
            event.preventDefault(); // Забороняє перезавантаження сторінки
    
            document.getElementById("login").style.borderColor = 'black';
            document.getElementById("email").style.borderColor = 'black';
            document.getElementById("password").style.borderColor = 'black';
            document.getElementById("confirm-password").style.borderColor = 'black';
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const action = form.getAttribute("action");
    
            try {
                console.log(data);
                
                const response = await fetch(action, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                
    
                if (response.ok) {
                    window.location.reload();
                } else {
                    const result = await response.json();

                    if(result.message) console.log(result.message);
                    showError(result.message || "An error occurred", result.error);
                }
            } catch (error) {
                console.error(error);
                showError("Server error, try again later.");
            }
        });
    
        function showError(message, error) {
            errorMessage.textContent = message;
            errorMessage.removeAttribute("hidden");

            switch (error) {
                case 'login':
                    const login = document.getElementById("login");
                    login.style.borderColor = 'red';
                    console.log(login);
                    break;

                case 'email':
                    const email = document.getElementById("email");
                    email.style.borderColor = 'red';
                    console.log(email);
                    break;

                case 'password':
                    const password = document.getElementById("password");
                    password.style.borderColor = 'red';
                    console.log(password);
                    break;

                case 'password confirmation':
                    const confirmPassword = document.getElementById("confirm-password");
                    confirmPassword.style.borderColor = 'red';
                    console.log(confirmPassword);
                    break;
            }
        }
    } catch (error) {
        console.error(error);
    }
        



    try {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const togglePassword = document.getElementById('toggle-password');
        const toggleConfirmPassword = document.getElementById('toggle-confirm-password');

        togglePassword.addEventListener('click', function () {
            // Перемикаємо тип поля
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Змінюємо іконку
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });

        toggleConfirmPassword.addEventListener('click', function () {
            // Перемикаємо тип поля
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);

            // Змінюємо іконку
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    } catch (error) {
        console.error(error);
    }


    try {
        const menuBtn = document.getElementById('menu');
        const guide = document.querySelector('.guide');
        const guideSpacer = document.querySelector('.guide-spacer');

        menuBtn.addEventListener('click', (event) => {
            guide.hasAttribute('hidden') ? guide.removeAttribute('hidden') : guide.setAttribute('hidden', '');
            if(guideSpacer) !guide.hasAttribute('hidden') ? guideSpacer.removeAttribute('hidden') : guideSpacer.setAttribute('hidden', '');
        })
    } catch (error) {
        console.error(error);
    }

    


    try {
        const notificationsBtn = document.getElementById('notifications-btn');
        const container = document.querySelector('#notifications-dropdown .content');

        notificationsBtn.addEventListener('click', async (event) => {
            if(container) {
                container.innerHTML =
                `<svg class="loading-spinner spinner" style="align-self: center; justify-self: center;" fill="#000" width="40px" height="40px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path d="M512 1024c-69.1 0-136.2-13.5-199.3-40.2C251.7 958 197 921 150 874c-47-47-84-101.7-109.8-162.7C13.5 648.2 0 581.1 0 512c0-19.9 16.1-36 36-36s36 16.1 36 36c0 59.4 11.6 117 34.6 171.3 22.2 52.4 53.9 99.5 94.3 139.9 40.4 40.4 87.5 72.2 139.9 94.3C395 940.4 452.6 952 512 952c59.4 0 117-11.6 171.3-34.6 52.4-22.2 99.5-53.9 139.9-94.3 40.4-40.4 72.2-87.5 94.3-139.9C940.4 629 952 571.4 952 512c0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 0 0-94.3-139.9 437.71 437.71 0 0 0-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.2C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3s-13.5 136.2-40.2 199.3C958 772.3 921 827 874 874c-47 47-101.8 83.9-162.7 109.7-63.1 26.8-130.2 40.3-199.3 40.3z"/>
                </svg>`

                const res = await fetch(`/api/notifications`, { method: 'GET' })
                const data = await res.text();
                if(res.ok) container.innerHTML = data;
            }
        })

    } catch (error) {
        console.error(error);
    }


});
