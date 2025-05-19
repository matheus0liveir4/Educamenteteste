// 1. INICIALIZAÇÃO COM SEU USER ID (não use a API Key aqui!)
        emailjs.init('Z4WSvr5f7dERB2XxT'); // 👈 Substitua pelo SEU User ID (começa com 'user_')

        // Validação do campo nome
        document.getElementById('name').addEventListener('input', function(e) {
            this.value = this.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
        });

        document.getElementById('cadastroForm').addEventListener('submit', function (e) {
    const senha = document.getElementById('password').value;
    const confirmar = document.getElementById('confirm-password').value;
    if (senha !== confirmar) {
        e.preventDefault();
        alert('As senhas não coincidem!');
    }
});

        // Função para mostrar/ocultar a senha
        function togglePassword(fieldId) {
            const passwordInput = document.getElementById(fieldId);
            const toggleIcon = document.querySelector(`#${fieldId} + .toggle-password i`);
            
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
            const toggleIcon = passwordInput.nextElementSibling;
            
            if (passwordInput.value.length > 0) {
                toggleIcon.style.display = 'block';  // Mostrar o ícone ao começar a digitar
            } else {
                toggleIcon.style.display = 'none';   // Ocultar o ícone se o campo estiver vazio
            }
        }

        // Função para verificar a força da senha
        function checkPasswordStrength(password) {
            let strength = 0;
            const strengthBar = document.querySelector('.strength-bar');
            const strengthText = document.querySelector('.strength-text');

            // Verifica o comprimento da senha
            if (password.length >= 8) strength += 1;
            if (password.length >= 12) strength += 1;

            // Verifica se contém letras maiúsculas e minúsculas
            if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength += 1;

            // Verifica se contém números
            if (password.match(/([0-9])/)) strength += 1;

            // Verifica se contém caracteres especiais
            if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) strength += 1;

            // Atualiza a barra de força
            const width = (strength / 5) * 100;
            strengthBar.style.width = width + '%';

            // Atualiza a cor e o texto conforme a força
            if (strength <= 2) {
                strengthBar.style.backgroundColor = '#ff4d4d'; // Vermelho
                strengthText.textContent = 'Senha fraca';
            } else if (strength === 3) {
                strengthBar.style.backgroundColor = '#ffcc00'; // Amarelo
                strengthText.textContent = 'Senha média';
            } else {
                strengthBar.style.backgroundColor = '#4CAF50'; // Verde
                strengthText.textContent = 'Senha forte';
            }

            // Se o campo estiver vazio, reseta o indicador
            if (password.length === 0) {
                strengthBar.style.width = '0%';
                strengthText.textContent = '';
            }
        }