document.getElementById('cadastroForm').addEventListener('submit', function (e) {
    const senha = document.getElementById('password').value;
    const confirmar = document.getElementById('confirm-password').value;
    if (senha !== confirmar) {
        e.preventDefault();
        alert('As senhas não coincidem!');
    }
});

// Nome apenas com letras
document.getElementById('name').addEventListener('input', function () {
    this.value = this.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
});

// Alternar visibilidade da senha
function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const toggleIcon = passwordInput.nextElementSibling.querySelector('i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Mostrar ícone de olho só quando começa a digitar
function togglePasswordVisibility(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const toggleIcon = passwordInput.parentElement.querySelector('.toggle-password');

    if (toggleIcon) {
        toggleIcon.style.display = passwordInput.value.length > 0 ? 'block' : 'none';
    }
}


// Força da senha
function checkPasswordStrength(password) {
    let strength = 0;
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength += 1;
    if (password.match(/([0-9])/)) strength += 1;
    if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) strength += 1;

    const width = (strength / 5) * 100;
    strengthBar.style.width = width + '%';

    if (strength <= 2) {
        strengthBar.style.backgroundColor = '#ff4d4d';
        strengthText.textContent = 'Senha fraca';
    } else if (strength === 3) {
        strengthBar.style.backgroundColor = '#ffcc00';
        strengthText.textContent = 'Senha média';
    } else {
        strengthBar.style.backgroundColor = '#4CAF50';
        strengthText.textContent = 'Senha forte';
    }

    if (password.length === 0) {
        strengthBar.style.width = '0%';
        strengthText.textContent = '';
    }
}

function validateForm() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('error-message');

    if (email === '' || password === '') {
        errorMsg.style.display = 'block';
        return false;
    }

    errorMsg.style.display = 'none';
    return true;
}
