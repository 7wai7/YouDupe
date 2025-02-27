
document.addEventListener("DOMContentLoaded", async () => {

    /* try {
        const authoriseBtn = document.querySelector('.authorise-btn');
        const modal = document.getElementById("auth-modal");
        
        const form = document.getElementById('form');
        const submitBtn = document.getElementById('submit');
        const showSignupPanelBtn = document.getElementById("show-signup-panel-btn");
        const forgotPasswordBtn = document.querySelector('.forgot-password-btn');
        
        const login = document.getElementById("login");
        const email = document.getElementById("email");
        const passwordContainer = document.getElementById("password-container");
        const confirmPasswordContainer = document.getElementById("confirm-password-container");

        function updatePanel() {
            const type = form.dataset.type;

            if(type === 'login') {
                form.setAttribute('action', '/api/auth/login');
                login.setAttribute('hidden', '');
                showSignupPanelBtn.removeAttribute('hidden');
                confirmPasswordContainer.setAttribute('hidden', '');
                forgotPasswordBtn.removeAttribute('hidden');
                
                modal.querySelector('h2').innerHTML = "Login";
                document.getElementById('submit').innerHTML = "Login";
            } else {
                form.setAttribute('action', '/api/auth/signup');
                login.removeAttribute('hidden');
                showSignupPanelBtn.setAttribute('hidden', '');
                confirmPasswordContainer.removeAttribute('hidden');
                forgotPasswordBtn.setAttribute('hidden', '');
    
                modal.querySelector('h2').innerHTML = "Signup";
                document.getElementById('submit').innerHTML = "Signup";
            }

            login.value = '';
            email.value = '';
            passwordContainer.querySelector('input').value = '';
            confirmPasswordContainer.querySelector('input').value = '';
        }

        function showLoginPanel() {
            form.dataset.type = 'login';
            updatePanel();
        }

        function showSignupPanel() {
            form.dataset.type = 'signup';
            updatePanel();
        }

        authoriseBtn.addEventListener('click', (event) => {
            modal.removeAttribute('hidden');
            showLoginPanel();
        });

        modal.addEventListener('click', (event) => {
            if(event.target === modal) {
                modal.setAttribute('hidden', '');
            }
        });

        showSignupPanelBtn.addEventListener('click', (event) => {
            showSignupPanel();
        });

        submitBtn.addEventListener('click', (event) => {
            const action = form.getAttribute('action');

            fetch(action, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    login: login.value,
                    email: email.value,
                    password: passwordContainer.querySelector('input').value,
                    confirmedPassword: confirmPasswordContainer.querySelector('input').value,
                })
            })
            .then(response => {
                if(response.ok) {
                    window.location.reload();
                }
                return response.json()
            })
            .then(data => {
                if(data.message) console.log(data.message);
                
                if(data.error) {
                    switch (data.error) {
                        case 'invalid email':
                            const email = document.getElementById("email");


                            break;

                        case 'invalid password':
                            const passwordContainer = document.getElementById("password-container");
                            break;

                        case 'password confirmation':
                            const confirmPasswordContainer = document.getElementById("confirm-password-container");
                            break;
                    }
                }
            })
            .catch(console.error)
        })

    } catch (error) {
        console.error(error);
    } */

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
});
