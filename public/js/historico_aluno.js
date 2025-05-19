// Exemplo de fetch no historico_aluno.js
const urlParams = new URLSearchParams(window.location.search);
const studentName = urlParams.get('studentName')?.toLowerCase();

fetch('/api/solicitacoes')
  .then(res => res.json())
  .then(solicitacoes => {
    const registros = solicitacoes.filter(s => s.nome.toLowerCase() === studentName);

    if (registros.length === 0) {
      document.getElementById('registro-lista').innerHTML = '<p>Nenhum atendimento encontrado.</p>';
      return;
    }

    preencherCabecalho(registros[0]); // usa os dados do primeiro registro
    preencherRegistros(registros);
  })
  .catch(err => {
    console.error('Erro ao buscar dados:', err);
  });
