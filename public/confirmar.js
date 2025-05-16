// Botão de reenviar e-mail
document.querySelector('.btn-primary').addEventListener('click', function(event) {
    event.preventDefault(); // Impede a ação padrão
    const btn = event.target;
    let timeLeft = 120; // 2 minutos em segundos

    btn.disabled = true; // Desabilita o botão ao clicar

    const interval = setInterval(function() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        btn.innerText = `Tentar novamente em: ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`; // Atualiza o texto com a contagem

        if (timeLeft <= 0) {
            clearInterval(interval); // Para a contagem quando chegar a 0
            btn.disabled = false; // Habilita o botão novamente
            btn.innerText = 'Reenviar E-mail'; // Restaura o texto
        }

        timeLeft--;
    }, 1000); // Atualiza a cada segundo
});
