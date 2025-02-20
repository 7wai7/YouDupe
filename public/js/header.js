
document.addEventListener("DOMContentLoaded", () => {



    try {
        const authoriseBtn = document.querySelector('.authorise-btn');
        const modal = document.getElementById("auth-modal");
        
        const form = modal.querySelector('form');
        const showSignupPanelBtn = document.getElementById("show-signup-panel-btn");
        const forgotPasswordBtn = document.querySelector('.forgot-password-btn');
        
        const login = document.getElementById("login");
        const email = document.getElementById("email");
        const passwordContainer = document.getElementById("password-container");
        const confirmPasswordContainer = document.getElementById("confirm-password-container");

        function showLoginPanel() {
            clearForm();

            form.setAttribute('action', '/api/auth/login');
            login.setAttribute('hidden', '');
            showSignupPanelBtn.removeAttribute('hidden');
            confirmPasswordContainer.setAttribute('hidden', '');
            forgotPasswordBtn.removeAttribute('hidden');
            
            modal.querySelector('h2').innerHTML = "Login";
            modal.querySelector('[type="submit"]').innerHTML = "Login";
        }

        function showSignupPanel() {
            clearForm();

            form.setAttribute('action', '/api/auth/signup');
            login.removeAttribute('hidden');
            showSignupPanelBtn.setAttribute('hidden', '');
            confirmPasswordContainer.removeAttribute('hidden');
            forgotPasswordBtn.setAttribute('hidden', '');

            modal.querySelector('h2').innerHTML = "Signup";
            modal.querySelector('[type="submit"]').innerHTML = "Signup";
        }

        function clearForm() {
            login.value = '';
            email.value = '';
            passwordContainer.querySelector('input').value = '';
            confirmPasswordContainer.querySelector('input').value = '';
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

    } catch (error) {
        console.error(error);
    }



    try {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const togglePassword = document.getElementById('toggle-password');
        const toggleConfirmPassword = document.getElementById('toggle-confirmPassword');

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
