// 1. INICIALIZAÇÃO COM SEU USER ID (não use a API Key aqui!)
emailjs.init('Z4WSvr5f7dERB2XxT'); // 👈 Substitua pelo SEU User ID (começa com 'user_')

 // Validação do campo nome
document.getElementById('name').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
});

// Variável global para armazenar a força da senha atual
let currentPasswordStrength = 0; // Adicionamos esta variável

document.getElementById('cadastroForm').addEventListener('submit', function (e) {
    const senha = document.getElementById('password').value;
    const confirmar = document.getElementById('confirm-password').value;
    const nome = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    // Validação de campos obrigatórios (caso o 'required' do HTML falhe ou seja burlado)
    if (!nome || !email || !senha || !confirmar) {
        e.preventDefault(); // Impede o envio do formulário
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    if (senha !== confirmar) {
        e.preventDefault(); // Impede o envio do formulário
        alert('As senhas não coincidem!');
        return; // Interrompe a execução aqui se as senhas não baterem
    }

    // ---- NOVA VALIDAÇÃO DE FORÇA DA SENHA ----
    const minRequiredStrength = 2; // Defina a força mínima aqui (2 para 'Média')

    if (currentPasswordStrength < minRequiredStrength) {
        e.preventDefault(); // Impede o envio do formulário
        alert('A senha fornecida é muito fraca. Por favor, escolha uma senha mais forte seguindo os critérios indicados.');
        // Opcional: Focar no campo de senha para facilitar a correção
        document.getElementById('password').focus();
        return;
    }
});


// Função para mostrar/ocultar a senha
function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    // Ajuste no seletor para ser mais específico e evitar conflitos
    const toggleIcon = passwordInput.closest('.password-wrapper').querySelector('.toggle-password i');

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

// Função para ativar o ícone somente quando começar a digitar a senha
function togglePasswordVisibility(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    // Ajuste no seletor
    const toggleIconSpan = passwordInput.closest('.password-wrapper').querySelector('.toggle-password');

    if (passwordInput.value.length > 0) {
        toggleIconSpan.style.display = 'inline-block'; // Usar inline-block para spans geralmente
    } else {
         toggleIconSpan.style.display = 'none';
    }
}

// Função para verificar a força da senha
function checkPasswordStrength(password) {
    let strength = 0;
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    // Critérios de força:
    // 1. Comprimento
    if (password.length >= 8) strength += 1;
    if (password.length >= 10) strength += 1; // Ajuste: 10 para mais um ponto

    // 2. Letras maiúsculas e minúsculas
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;

    // 3. Números
    if (password.match(/[0-9]/)) strength += 1;

    // 4. Caracteres especiais
    if (password.match(/[^a-zA-Z0-9\s]/)) strength += 1; // Qualquer não alfanumérico e não espaço

    // Atualiza a variável global de força da senha
    currentPasswordStrength = strength; // ATUALIZA A FORÇA ATUAL

    // Atualiza a barra de força (máximo 5 pontos)
    const maxStrength = 5;
    const width = (Math.min(strength, maxStrength) / maxStrength) * 100; // Garante que não passe de 100%
    strengthBar.style.width = width + '%';

    // Atualiza a cor e o texto conforme a força
    if (password.length === 0) {
        strengthBar.style.width = '0%';
        strengthText.textContent = '';
        strengthBar.style.backgroundColor = '#ddd'; // Cor neutra para barra vazia
    } else if (strength <= 1) { // Fraca
        strengthBar.style.backgroundColor = '#ff4d4d'; // Vermelho
        strengthText.textContent = 'Senha fraca';
        strengthText.style.color = '#ff4d4d';
    } else if (strength >= 2 && strength <= 3) { // Média
        strengthBar.style.backgroundColor = '#ffcc00'; // Amarelo
        strengthText.textContent = 'Senha média';
        strengthText.style.color = '#ffcc00';
    } else { // Forte (strength >= 4)
        strengthBar.style.backgroundColor = '#4CAF50'; // Verde
        strengthText.textContent = 'Senha forte';
        strengthText.style.color = '#4CAF50';
    }
}

// Chama a função para ocultar os ícones de olho inicialmente,
// pois os campos de senha estarão vazios.
// É bom garantir que isso aconteça após o DOM estar carregado.
document.addEventListener('DOMContentLoaded', function() {
    togglePasswordVisibility('password');
    togglePasswordVisibility('confirm-password');

    // Adiciona o listener de input ao campo de senha principal
    // para chamar checkPasswordStrength
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
            // Também chama togglePasswordVisibility para garantir que o ícone apareça/desapareça corretamente
            togglePasswordVisibility('password');
        });
    }

    const confirmPasswordInput = document.getElementById('confirm-password');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            togglePasswordVisibility('confirm-password');
        });
    }
});