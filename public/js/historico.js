async function fetchSolicitacoesFinalizadas() {
  const res = await fetch('/api/solicitacoes');
  const dados = await res.json();
  return dados.filter(s => s.status === 'Finalizado');
}

// ================================================
      // JAVASCRIPT ORIGINAL DO HISTORICO (Com adaptação para o novo toggle)
      // ================================================
      let allHistoryFilters = { searchTerm: '', unit: 'all', sortOrder: 'desc' };
      let studentHistoryFilters = { studentName: '', unit: 'all', sortOrder: 'desc' };

      // Função Renderizar Card (Original)
function renderAppointmentCard(s) {
return `
  <div class="appointment-card dark">
            <div class="appointment-card-header">
                <div class="appointment-card-student-info">
                    <h3 class="font-medium">${s.nome}</h3>
                </div>
                <div class="text-sm text-light flex items-center gap-1"><i class="fas fa-phone"></i>${s.telefone ?? 'Não informado'}</div>
            </div>
            <div class="card-body-condensed">
                <p class="text-sm text-light"><i class="fas fa-book"></i> ${s.curso}</p>
                <p class="text-sm text-light"><i class="fas fa-building"></i> ${s.instituicao}</p>
            </div>
            <div class="appointment-card-footer">
                <div class="footer-buttons">            
                    <a class="btn btn-sm btn-primary" data-tooltip="Ver Histórico do Aluno" data-tooltip-type="historico" href="/historico_aluno?id=${s.id}">
                      <i class="fas fa-history"></i>
                      <span style="margin-left: 4px;">Ver histórico</span>
                    </a>               
                    <a class="btn btn-sm btn-primary btn-accent" data-tooltip="Agendar Outro Atendimento com Aluno" data-tooltip-type="accent" href="/agendamento?id=${s.id}">
                        <i class="fas fa-calendar-plus"></i> 
                        <span style="margin-left: 4px;">Novo Agendamento</span>
                    </a>      
                    <span class="btn btn-sm btn-secondary disabled">${s.agendamentos.length} atendimento(s)</span>  
                </div>
            </div>
        </div>
`;
}

function renderHistoryCard(s) {
  return `
    <div class="appointment-card dark">
      <div class="appointment-card-header">
        <div class="appointment-card-student-info">
          <h3 class="font-medium">${s.nome || 'N/A'}</h3>
        </div>
        <div class="text-sm text-light flex items-center gap-1">
          <i class="fas fa-phone"></i>
          <span>${s.telefone || 'N/A'}</span>
        </div>
      </div>
  
      <div class="card-body-condensed">
        <p class="text-sm text-light">
          <i class="fa fa-book"></i>
          <span>${s.curso || 'N/A'}</span>
        </p>
        <p class="text-sm text-light">
          <i class="fa fa-building"></i>
          <span>${s.instituicao || 'N/A'}</span>
        </p>
      </div>
  
      <div class="appointment-card-footer">
        <div class="footer-buttons">
          <a class="btn btn-sm btn-primary" href="/historico_aluno?id=${s.id}">
            <i class="fas fa-history"></i>
            <span style="margin-left: 4px;">Ver histórico</span>
          </a>
        </div>
      </div>
    </div>
  `;
  }

      // Aplica classe dark aos cards dinâmicos (Original)
      function applyStylesForCurrentMode() {
           const isDark = document.body.classList.contains('dark');
           console.log(`DEBUG: applyStylesForCurrentMode - isDark: ${isDark}`);
           document.querySelectorAll('#history-list .appointment-card, #student-history-list .appointment-card').forEach(card => {
               if (card) card.classList.toggle('dark', isDark);
           });
      }

      // Funções loadAppointmentHistory e loadStudentHistory (Originais)
      async function loadAppointmentHistory() {
const list = document.getElementById('history-list');
const noResults = document.getElementById('no-history');
const loading = document.getElementById('history-loading');

loading.style.display = 'block';
list.innerHTML = '';
noResults.style.display = 'none';

try {
  const res = await fetch('/api/solicitacoes');
  const dados = await res.json();

  let finalizadas = dados.filter(s => s.status === 'Finalizado');

  // Filtro por unidade
  if (allHistoryFilters.unit !== 'all') {
    finalizadas = finalizadas.filter(s => s.instituicao === allHistoryFilters.unit);
  }

  // Filtro por termo de busca
  const term = allHistoryFilters.searchTerm.toLowerCase();
  if (term) {
    finalizadas = finalizadas.filter(s =>
      (s.nome?.toLowerCase().includes(term)) ||
      (s.curso?.toLowerCase().includes(term)) ||
      (s.tipo?.toLowerCase().includes(term))
    );
  }
  // Ordenação por data
  finalizadas.sort((a, b) => {
    const dateA = new Date(a.data_agendamento || a.criado_em);
    const dateB = new Date(b.data_agendamento || b.criado_em);
    return allHistoryFilters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  if (finalizadas.length === 0) {
    noResults.textContent = "Nenhum histórico encontrado.";
    noResults.style.display = 'block';
    list.style.display = 'none';
  } else {
    list.innerHTML = finalizadas.map(app => renderAppointmentCard(app)).join('');
    list.style.display = 'grid';
    applyStylesForCurrentMode();
  }
} catch (error) {
  console.error("Erro em loadAppointmentHistory:", error);
  noResults.textContent = "Erro ao carregar.";
  noResults.style.display = 'block';
  list.style.display = 'none';
} finally {
  loading.style.display = 'none';
}
}
  
async function loadStudentHistory() {
  const list = document.getElementById('student-history-list');
  const noResults = document.getElementById('no-student-history');
  const loading = document.getElementById('student-history-loading');
  const searchInput = document.getElementById('student-search-input');
  if (!list || !noResults || !loading || !searchInput) return;

  const searchTerm = searchInput.value.trim().toLowerCase();

  loading.style.display = 'block';
  list.innerHTML = '';
  noResults.style.display = 'none';

  try {
    const res = await fetch('/api/solicitacoes');
    const solicitacoes = await res.json();

    // Filtra apenas solicitações finalizadas e que tenham agendamentos
    const resultados = solicitacoes
      .filter(s => s.status === 'Finalizado' && s.agendamentos?.length > 0)
      .filter(s => s.nome.toLowerCase().includes(searchTerm));

    if (resultados.length === 0) {
      noResults.textContent = `Nenhum histórico para "${searchTerm}".`;
      noResults.style.display = 'block';
      return;
    }

    list.innerHTML = resultados.map(renderSolicitacaoCardComAgendamentos).join('');
    list.style.display = 'grid';
  } catch (err) {
    console.error('Erro ao buscar históricos:', err);
    noResults.textContent = "Erro ao carregar os dados.";
    noResults.style.display = 'block';
  } finally {
    loading.style.display = 'none';
  }
}

function renderSolicitacaoCardComAgendamentos(s) {
  const atendimentosHTML = s.agendamentos.map(a => {
    const data = new Date(a.data_agendamento);
    const hora = a.horario ? a.horario.slice(0, 5) : '--:--';
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const obs = s.observacoes?.[0]?.texto || '(Sem observações)';
  }).join('');

  return `
    <div class="appointment-card dark">
      <div class="appointment-card-header">
        <div class="appointment-card-student-info">
          <h3 class="font-medium">${s.nome}</h3>
        </div>
        <div class="text-sm text-light flex items-center gap-1">
          <i class="fas fa-phone"></i>
          <span>${s.telefone || 'Não informado'}</span>
        </div>
      </div>

      <div class="card-body-condensed">
        <p class="text-sm text-light"><i class="fa fa-book"></i> ${s.curso}</p>
        <p class="text-sm text-light"><i class="fa fa-building"></i> ${s.instituicao}</p>
      </div>

      <div class="appointment-card-footer">
        <div class="footer-buttons">
          <a class="btn btn-sm btn-primary" href="/historico_aluno?id=${s.id}">
            <i class="fas fa-history"></i> Ver histórico
          </a>
          <span class="btn btn-sm btn-secondary disabled">${s.agendamentos.length} atendimento(s)</span>
        </div>
      </div>
    </div>
  `;
}


function renderGroupedHistoryCard(aluno) {
  const atendimentosHTML = aluno.atendimentos.map(a => {
    const data = new Date(a.data);
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = a.hora ? a.hora.slice(0, 5) : '--:--';
    const obs = a.observacao?.trim() || '(Sem observações)';
    return `
      <div class="sub-atendimento">
        <p><i class="far fa-calendar-alt"></i> ${dataFormatada} <i class="far fa-clock"></i> ${horaFormatada}</p>
        <p><strong>Observações:</strong><br>${obs.replace(/\n/g, '<br>')}</p>
      </div>
    `;
  }).join('');

  return `
    <div class="appointment-card dark">
      <div class="appointment-card-header">
        <div class="appointment-card-student-info">
          <h3 class="font-medium">${aluno.nome}</h3>
        </div>
        <div class="text-sm text-light flex items-center gap-1">
          <i class="fas fa-phone"></i>
          <span>${aluno.telefone || 'Não informado'}</span>
        </div>
      </div>

      <div class="card-body-condensed">
        <p class="text-sm text-light"><i class="fa fa-book"></i> ${aluno.curso}</p>
        <p class="text-sm text-light"><i class="fa fa-building"></i> ${aluno.instituicao}</p>
      </div>

      <div class="appointment-card-footer">
        <div class="footer-buttons">
          <span class="btn btn-sm btn-secondary disabled">
            ${aluno.atendimentos.length} atendimento(s)
          </span>
          <a class="btn btn-sm btn-primary" href="/historico_aluno?id=${aluno.atendimentos[0].id}">
            <i class="fas fa-history"></i> Ver histórico completo
          </a>
        </div>
      </div>

      <div class="sub-atendimentos-container">
        ${atendimentosHTML}
      </div>
    </div>
  `;
}



      // DOMContentLoaded (Setup Principal - Adaptado para o novo toggle)
      document.addEventListener('DOMContentLoaded', function() {
          try {
              console.log("DEBUG: DOMContentLoaded - Iniciando setup...");
              // Verifica dependências
              if (typeof icons === 'undefined') console.error("Histórico ERRO: icons não definido."); if (typeof data === 'undefined') console.error("Histórico ERRO: data não definido."); if (typeof utils === 'undefined') console.error("Histórico ERRO: utils não definido.");

              // Setup Ícones Navbar
              try { document.getElementById('icon-home').innerHTML = icons?.home || '?'; document.getElementById('icon-history').innerHTML = icons?.history || '?'; document.getElementById('icon-requests').innerHTML = icons?.requests || '?'; } catch(e) { console.error("Erro ao setar ícones da Navbar:", e); }

              // Setup Abas
              const tabs = document.querySelectorAll('.tab'); const tabContents = document.querySelectorAll('.tab-content');
              if (tabs.length > 0 && tabContents.length > 0) { tabs.forEach(tab => { tab.addEventListener('click', function() { const currentActiveTab = document.querySelector('.tab.active'); const tabName = this.getAttribute('data-tab'); if (currentActiveTab === this) return; tabs.forEach(t => t.classList.remove('active')); this.classList.add('active'); tabContents.forEach(content => content.classList.remove('active')); const activeContent = document.getElementById(`tab-${tabName}`); if (activeContent) { activeContent.classList.add('active'); if (tabName === 'student-history') { const studentSearchInput = document.getElementById('student-search-input'); if(studentSearchInput) studentSearchInput.value = ''; studentHistoryFilters = { studentName: '', unit: 'all', sortOrder: 'desc' }; const unitBtn = document.getElementById('student-history-unidade-btn-text'); if(unitBtn) unitBtn.textContent = 'Unidade'; const dateBtn = document.getElementById('student-history-data-btn-text'); if(dateBtn) dateBtn.textContent = 'Data'; loadStudentHistory(); } else if (tabName === 'all-history') { loadAppointmentHistory(); } } }); }); } else { console.warn("Abas não encontradas."); }

              // --- Setup Dark Mode Toggle (Adaptado para wrapper e icons) ---
              const toggle = document.getElementById('toggle-dark-mode');
              if (toggle) {
                  const applyDarkModeUI = (isDark) => {
                       console.log("Aplicando Dark Mode UI:", isDark);
                       document.body.classList.add('no-transitions'); // Evita flash
                       document.body.classList.toggle('dark', isDark);

                       // Aplica aos cards dinâmicos através da função auxiliar
                       applyStylesForCurrentMode();

                       // Força reflow antes de reabilitar transições
                       requestAnimationFrame(() => {
                          requestAnimationFrame(() => { document.body.classList.remove('no-transitions'); });
                       });
                  };
                  // Estado inicial
                  const darkModePref = localStorage.getItem('darkMode') === 'enabled';
                  toggle.checked = darkModePref;
                  applyDarkModeUI(darkModePref); // Aplica na carga

                  // Listener de mudança
                  toggle.addEventListener('change', function() {
                      const isChecked = this.checked;
                      applyDarkModeUI(isChecked);
                      localStorage.setItem('darkMode', isChecked ? 'enabled' : 'disabled');
                  });
                  console.log("DEBUG: Dark mode configurado.");
              } else { console.warn("Toggle dark mode não encontrado.");}
              // --- Fim Adaptação Dark Mode ---

              // Setup Filtros (Original)
              function setupFilterListeners(tabId, filterStateObject, loadFunction) {
                   const tabContentElement = document.getElementById(tabId); if (!tabContentElement) { console.error(`Container #${tabId} não encontrado.`); return; } const searchInputId = (tabId === 'tab-student-history') ? 'student-search-input' : 'all-history-search-input'; const searchInput = document.getElementById(searchInputId); const filterButtonWrappers = tabContentElement.querySelectorAll(`.search-filter-section .filter-button-wrapper`); if (searchInput) { let searchTimeout; searchInput.addEventListener('input', function() { clearTimeout(searchTimeout); const value = this.value; if(tabId === 'tab-all-history') filterStateObject.searchTerm = value; else filterStateObject.studentName = value; searchTimeout = setTimeout(() => loadFunction(), 400); }); } else { console.warn(`Input #${searchInputId} não encontrado.`); } filterButtonWrappers.forEach(wrapper => { const button = wrapper.querySelector('.filter-button'); const dropdown = wrapper.querySelector('.filter-dropdown'); const options = dropdown?.querySelectorAll('.filter-option, .sort-option'); if (!button || !dropdown || !options) { console.warn(`Filtro incompleto em ${tabId}.`); return; } button.addEventListener('click', (event) => { event.stopPropagation(); tabContentElement.querySelectorAll('.filter-dropdown.active').forEach(dd => { if (dd !== dropdown) dd.classList.remove('active'); }); tabContentElement.querySelectorAll('.filter-button.active').forEach(btn => { if (btn !== button) btn.classList.remove('active'); }); dropdown.classList.toggle('active'); button.classList.toggle('active'); }); options.forEach(option => { option.addEventListener('click', (e) => { e.preventDefault(); const isSort = option.classList.contains('sort-option'); const filterType = option.dataset.filterType; const value = option.dataset.filterValue || option.dataset.sortOrder; const btnTextSpan = button.querySelector('span:not([class*="fa"])'); if (isSort) { filterStateObject.sortOrder = value; if(btnTextSpan) btnTextSpan.textContent = option.textContent; } else if (filterType === 'unit') { filterStateObject.unit = value; if(btnTextSpan) btnTextSpan.textContent = value === 'all' ? 'Unidade' : option.textContent; } dropdown.classList.remove('active'); button.classList.remove('active'); loadFunction(); }); }); });
                  }

              setupFilterListeners('tab-all-history', allHistoryFilters, loadAppointmentHistory);
              setupFilterListeners('tab-student-history', studentHistoryFilters, loadStudentHistory);

              // Fecha dropdowns (Original)
              document.addEventListener('click', (event) => { if (!event.target.closest('.filter-button-wrapper')) { document.querySelectorAll('.filter-dropdown.active').forEach(dd => dd.classList.remove('active')); document.querySelectorAll('.filter-button.active').forEach(btn => btn.classList.remove('active')); } });

              // Carga Inicial (Original)
              loadAppointmentHistory();
              console.log("Histórico - Configuração inicial concluída.");
          } catch(error) {
               console.error("ERRO FATAL no DOMContentLoaded:", error);
               document.body.innerHTML = `<p style="color:red; padding: 2rem; text-align:center; font-weight:bold;">Erro: ${error.message}. Console (F12).</p>`;
          }
      });