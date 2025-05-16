// === Estado da Aplicação ===
let _data = {};
let appState = { selectedDate: new Date(), selectedDay: null, currentWeekDays: [] };
let currentAppointmentIdInModal = null;

// === Fallbacks COM DADOS DE EXEMPLO CORRIGIDOS ===
const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today); dayAfterTomorrow.setDate(today.getDate() + 2);
const yesterday = new Date(today); yesterday.setDate(today.getDate() -1);

async function carregarDadosDoBackend() {
    const hoje = new Date().toISOString().split('T')[0];
    const semana = _utils.getWeekDays(new Date()); // Usa a data atual para a semana inicial
    const start = semana[0].date.toISOString().split('T')[0];
    const end = semana[6].date.toISOString().split('T')[0];
  
    try {
      const [solicitacoes, agendamentos, userDataResponse] = await Promise.all([
        fetch('/api/solicitacoes/pendentes').then(r => r.ok ? r.json() : Promise.reject(new Error(`Solicitações: ${r.status}`))),
        fetch(`/api/agendamentos/semana?start=${start}&end=${end}`).then(r => r.ok ? r.json() : Promise.reject(new Error(`Agendamentos: ${r.status}`))),
        fetch('/api/usuario-logado').then(r => r.ok ? r.json() : Promise.reject(new Error(`Usuário: ${r.status}`)))
      ]);
      
      if (!Array.isArray(agendamentos)) throw new Error("Dados de agendamentos inválidos");
      if (!Array.isArray(solicitacoes)) throw new Error("Dados de solicitações pendentes inválidos");


      _data.pendingRequests = solicitacoes;
      _data.todayAppointments = agendamentos.filter(a => a.date === hoje && !a.completed);
      _data.weeklyAppointments = agendamentos.filter(a => a.date !== hoje && !a.completed);
      _data.appointmentHistory = agendamentos.filter(a => a.completed);
      _data.currentUser = { name: userDataResponse.nome || 'Doutora' }; // Assumindo que 'nome' vem de /api/usuario-logado
    
      initApp(); // reinicia a interface com os dados reais
    } catch (error) {
        console.error("Erro crítico ao carregar dados do backend:", error);
        // Tratar erro de forma visível para o usuário, se necessário
        document.getElementById('calendar-days').innerHTML = '<p style="color:red; text-align:center;">Falha ao carregar dados.</p>';
        document.getElementById('urgent-requests-list').innerHTML = '<p style="color:red; text-align:center;">Falha ao carregar.</p>';
        document.getElementById('daily-summary-content').innerHTML = '<p style="color:red; text-align:center;">Falha ao carregar.</p>';

    }
}
  

// Funções Utilitárias (com correção em getDisplayWeek)
const _utils = typeof utils !== 'undefined' ? utils : {
    formatDate: (d) => {
        if (!d) return 'N/A';
        // Tenta converter datas YYYY-MM-DD para o formato local correto
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
            const [year, month, day] = d.split('-');
            return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        }
        return new Date(d).toLocaleDateString('pt-BR');
    },
    formatTimeDisplay: (t) => t ? t.substring(0,5) : 'N/A', // Garante HH:MM
    getCurrentFormattedDate: () => new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    getWeekDays: (refDate) => { const week = []; const startOfWeek = new Date(refDate); startOfWeek.setHours(0,0,0,0); startOfWeek.setDate(refDate.getDate() - refDate.getDay() + (refDate.getDay() === 0 ? -6 : 1)); for (let i = 0; i < 7; i++) { const day = new Date(startOfWeek); day.setDate(startOfWeek.getDate() + i); week.push({ date: day, shortName: day.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3).toUpperCase().replace('.', '') }); } return week; },
    getDisplayWeek: (weekDays) => {
        if (!weekDays || weekDays.length < 2) { console.warn("getDisplayWeek recebeu weekDays inválido:", weekDays); return 'Semana Inválida'; }
        try {
            const start = weekDays[0].date; const end = weekDays[weekDays.length - 1].date; const startYear = start.getFullYear(); const endYear = end.getFullYear();
            const startFormatted = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); const endFormatted = end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            if (startYear === endYear) { return `${startFormatted} - ${endFormatted}, ${startYear}`; }
            else { return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric'})} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric'})}`; }
        } catch (e) { console.error("Erro em getDisplayWeek:", e); return "Erro Semana"; }
    },
    getAppointmentForTimeSlot: () => null // Este parece ser um placeholder
};
const _icons = typeof icons !== 'undefined' ? icons : { user: '<i class="fas fa-user fa-fw"></i>', calendar: '<i class="fas fa-calendar-alt fa-fw"></i>', clock: '<i class="fas fa-clock fa-fw"></i>', info: '<i class="fas fa-info-circle fa-fw"></i>', file: '<i class="fas fa-file-alt fa-fw"></i>', chevronRight: '<i class="fas fa-chevron-right fa-xs"></i>', birthdayCake: '<i class="fas fa-birthday-cake fa-fw"></i>', graduationCap: '<i class="fas fa-graduation-cap fa-fw"></i>', checkCircle: '<i class="fas fa-check-circle fa-fw"></i>', hourglassHalf: '<i class="fas fa-hourglass-half fa-fw"></i>', inbox: '<i class="fas fa-inbox fa-fw"></i>', checkDouble: '<i class="fas fa-check-double fa-fw"></i>', building: '<i class="fas fa-building fa-fw"></i>', phone: '<i class="fas fa-phone fa-fw"></i>', home: '<i class="fas fa-home"></i>', history: '<i class="fas fa-history"></i>', requests: '<i class="fas fa-clipboard-list"></i>', chevronLeft: '<i class="fas fa-chevron-left"></i>', plus: '<i class="fas fa-plus"></i>' };


// === Lógica Principal ===
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Dashboard DEBUG: DOMContentLoaded");
    setupBasicUI();
    // Carregar dados do backend é crucial e deve ser feito antes de configurar listeners que dependem desses dados
    await carregarDadosDoBackend(); 
    setupGlobalEventListeners(); // Configura listeners DEPOIS que os dados e a UI básica estão prontos
});
  
/** Configura UI básica (ícones navbar, dark mode inicial) */
function setupBasicUI() {
     console.log("Dashboard DEBUG: setupBasicUI");
     try {
         const homeIconEl = document.getElementById('icon-home');
         const historyIconEl = document.getElementById('icon-history');
         const requestsIconEl = document.getElementById('icon-requests');
         const chevronLeftIconEl = document.getElementById('icon-chevron-left');
         const chevronRightIconEl = document.getElementById('icon-chevron-right');
         const plusIconEl = document.getElementById('icon-plus');

         if (homeIconEl) homeIconEl.innerHTML = _icons.home || '?';
         if (historyIconEl) historyIconEl.innerHTML = _icons.history || '?';
         if (requestsIconEl) requestsIconEl.innerHTML = _icons.requests || '?';
         if (chevronLeftIconEl) chevronLeftIconEl.innerHTML = _icons.chevronLeft || '<';
         if (chevronRightIconEl) chevronRightIconEl.innerHTML = _icons.chevronRight || '>';
         if (plusIconEl) plusIconEl.innerHTML = _icons.plus || '+';

     } catch (e) { console.error("Erro ao setar ícones básicos:", e); }

     const toggle = document.getElementById('toggle-dark-mode');
     if (toggle) {
         const applyDarkMode = (isDark, initialLoad = false) => {
             if (!initialLoad) document.body.classList.add('no-transitions');
             document.body.classList.toggle('dark', isDark);
             // Seletores mais genéricos para cards e itens de lista, caso você adicione mais
             document.querySelectorAll('.card, .modal-content, li[class*="appointment-item"], .calendar-controls button, .day-item, .summary-item, .request-item-dashboard, .detail-group, .detail-row, .modal-header, .modal-footer, .appointment-card, .clickable-student-item').forEach(el => el?.classList.toggle('dark', isDark));
             if (!initialLoad) {
                 requestAnimationFrame(() => {
                     requestAnimationFrame(() => { document.body.classList.remove('no-transitions'); });
                 });
             }
         };
         const darkModePref = localStorage.getItem('darkMode') === 'enabled';
         toggle.checked = darkModePref;
         applyDarkMode(darkModePref, true);
         toggle.addEventListener('change', function() {
             const isChecked = this.checked;
             applyDarkMode(isChecked);
             localStorage.setItem('darkMode', isChecked ? 'enabled' : 'disabled');
         });
     } else { console.warn("Dashboard WARNING: Toggle dark mode não encontrado."); }
}

/** Inicializa App */
function initApp() {
      console.log("Dashboard DEBUG: initApp");
      try {
          const welcomeDateEl = document.getElementById('welcome-date');
          const welcomeNameEl = document.getElementById('welcome-name');
          if (welcomeDateEl) welcomeDateEl.textContent = _utils.getCurrentFormattedDate();
          if (welcomeNameEl) welcomeNameEl.textContent = `Olá, ${_data.currentUser?.name?.split(' ')[0] || 'Usuário'}`;
          
          loadDashboardSummaries();
          initializeWeeklyCalendar();
      } catch (error) { console.error('Erro inicialização App:', error); }
}

/** Configura Listeners Globais */
function setupGlobalEventListeners() {
    console.log("Dashboard DEBUG: setupGlobalEventListeners");
    try {
        // ***** LINHA COMENTADA/REMOVIDA PARA EVITAR O ALERT *****
        // document.getElementById('new-appointment')?.addEventListener('click', () => addAppointment(null, appState.selectedDay?.date.toISOString()));
        // O script inline no painel.html agora cuida do redirecionamento deste botão.

        document.getElementById('prev-week')?.addEventListener('click', () => navigateWeek(-1));
        document.getElementById('next-week')?.addEventListener('click', () => navigateWeek(1));

        const modal = document.getElementById('appointment-modal');
        if (modal) {
            // Os botões de fechar o modal já têm listeners no script inline do painel.html
            // Se você quiser manter os listeners aqui também, certifique-se de que não haja conflitos.
            // Por ora, vou comentar para evitar duplicação, assumindo que o script inline funciona.
            // modal.querySelector('#close-modal')?.addEventListener('click', closeAppointmentModal);
            // modal.querySelector('#close-appointment')?.addEventListener('click', closeAppointmentModal);
            
            // Este listener abaixo pode causar um alert "Edição... (Implementar)"
            // Se não estiver usando a funcionalidade de edição, comente/remova.
            // modal.querySelector('#edit-appointment')?.addEventListener('click', handleEditAppointmentClick); 
            
            modal.addEventListener('click', (event) => { if (event.target === modal) closeAppointmentModal(); });
        } else { console.warn("Modal não encontrado para configurar listeners globais."); }

         const calendarDaysEl = document.getElementById('calendar-days');
         if (calendarDaysEl && !calendarDaysEl.dataset.listenerAttached) {
             calendarDaysEl.addEventListener('click', handleCalendarDayClick);
             calendarDaysEl.dataset.listenerAttached = 'true';
             console.log("Dashboard DEBUG: Listener de delegação ADICIONADO a #calendar-days");
         } else if (!calendarDaysEl) { console.warn("Elemento #calendar-days não encontrado.");}

    } catch (error) { console.error("Erro ao configurar listeners:", error); }
}

// Handler para clique na lista de agendamentos
function handleAppointmentListClick(event) {
    console.log("Dashboard DEBUG: Clique detectado em #compact-appointment-list.");
    const targetItem = event.target.closest('.compact-appointment-item');
    if (targetItem) {
        const appointmentIdString = targetItem.dataset.appointmentId;
        if (appointmentIdString) {
            const appointmentId = parseInt(appointmentIdString, 10);
            console.log("Dashboard DEBUG: Item encontrado, ID:", appointmentId);
            if (!isNaN(appointmentId)) { 
                viewAppointmentDetails(appointmentId); 
            } else { 
                console.warn("ID do agendamento inválido:", appointmentIdString); 
            }
        } else {
            console.warn("Atributo data-appointment-id não encontrado no item da lista.");
        }
    }
}

 // Handler para clique nos dias do calendário
 function handleCalendarDayClick(event) {
     const targetButton = event.target.closest('.day-item');
     if (targetButton) {
         const dateISO = targetButton.dataset.date;
         if (dateISO) {
            const newSelectedDay = appState.currentWeekDays.find(d => d.date.toISOString() === dateISO);
            if (newSelectedDay && newSelectedDay !== appState.selectedDay) {
                appState.selectedDay = newSelectedDay;
                renderCalendarUI(); 
            }
         } else {
            console.warn("Dia do calendário clicado não possui data-date.");
         }
     }
 }

// --- Funções de Carregamento e Renderização (COM ÍCONES) ---
function loadDashboardSummaries() { 
    // loadNextAppointment(); // Esta função não existe no código fornecido, se existir em outro lugar, mantenha.
    // loadUrgentRequests(); // Esta função também foi movida para o script inline do painel.html
    loadDailySummary(); 
}

// loadUrgentRequests foi movida para o script inline do painel.html
// Se você quiser mantê-la aqui, precisará adaptá-la para não conflitar com o script inline.
/* 
async function loadUrgentRequests() {
    // ... código original ...
}
*/
          
async function loadDailySummary() {
  const loadingEl = document.getElementById('daily-summary-loading');
  const contentEl = document.getElementById('daily-summary-content');

  if (!loadingEl || !contentEl) {
    console.warn("Elementos para Resumo do Dia não encontrados.");
    return;
  }

  loadingEl.style.display = 'block';
  contentEl.innerHTML = '';

  try {
    const res = await fetch('/api/dashboard/resumo-dia');
    if (!res.ok) throw new Error(`Erro HTTP ${res.status} ao buscar resumo do dia.`);
    const data = await res.json();

    contentEl.innerHTML = `
      <div class="summary-item">
        <span class="summary-icon"><i class="fas fa-calendar-day fa-fw"></i></span>
        <span class="summary-label">Atendimentos Hoje:</span>
        <span class="summary-value">${data.atendimentosHoje || 0}</span>
      </div>
      <div class="summary-item">
        <span class="summary-icon"><i class="fas fa-check-double fa-fw"></i></span>
        <span class="summary-label">Concluídos Hoje:</span>
        <span class="summary-value">${data.concluidosHoje || 0}</span>
      </div>
      <div class="summary-item">
        <span class="summary-icon"><i class="fas fa-inbox fa-fw"></i></span>
        <span class="summary-label">Novas Solicitações:</span>
        <span class="summary-value">${data.novasSolicitacoes || 0}</span>
      </div>
    `;
  } catch (error) {
    console.error('Erro ao carregar resumo do dia:', error);
    contentEl.innerHTML = '<p class="text-center text-gray-500">Erro ao carregar resumo.</p>';
  } finally {
    loadingEl.style.display = 'none';
  }
}

// --- Funções do Calendário ---
function initializeWeeklyCalendar() {
    const today = new Date(); 
    appState.selectedDate = today; 
    try { 
        appState.currentWeekDays = _utils.getWeekDays(appState.selectedDate); 
        if (!Array.isArray(appState.currentWeekDays) || appState.currentWeekDays.length !== 7) {
            throw new Error("getWeekDays retornou dados inválidos.");
        }
        
        const todayDateString = today.toDateString();
        const todayIndexInWeek = appState.currentWeekDays.findIndex(d => d.date.toDateString() === todayDateString);
        
        // Seleciona o dia atual se estiver na semana e não for fim de semana.
        // Senão, seleciona o primeiro dia útil da semana.
        // Senão, seleciona o primeiro dia da semana.
        if (todayIndexInWeek !== -1 && today.getDay() !== 0 && today.getDay() !== 6) {
            appState.selectedDay = appState.currentWeekDays[todayIndexInWeek];
        } else {
            appState.selectedDay = appState.currentWeekDays.find(d => d.date.getDay() !== 0 && d.date.getDay() !== 6) || appState.currentWeekDays[0];
        }

        if (!appState.selectedDay) { // Fallback final
            appState.selectedDay = appState.currentWeekDays[0];
            console.warn("SelectedDay não pôde ser determinado, usando o primeiro dia da semana.");
        }
        renderCalendarUI(); 
    } catch (error) { 
        console.error("Erro ao inicializar calendário:", error); 
        const calendarDaysEl = document.getElementById('calendar-days');
        if (calendarDaysEl) calendarDaysEl.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar calendário.</p>';
        const calendarLoadingEl = document.getElementById('calendar-loading');
        if(calendarLoadingEl) calendarLoadingEl.style.display = 'none'; 
    }
}
function renderCalendarUI() {
      if (!appState.selectedDay || !Array.isArray(appState.currentWeekDays)) {
        console.warn("Tentativa de renderizar UI do calendário sem selectedDay ou currentWeekDays.");
        return;
      }
      const weekRangeEl = document.getElementById('week-range'); 
      if (weekRangeEl) weekRangeEl.textContent = _utils.getDisplayWeek(appState.currentWeekDays); 
      renderCalendarDays(appState.currentWeekDays, appState.selectedDay); 
      renderCompactTimeSlots(appState.selectedDay);
}

function renderCalendarDays(weekDays, selectedDay) {
     const calendarDaysEl = document.getElementById('calendar-days');
     if (!calendarDaysEl) { console.error("Elemento #calendar-days não encontrado."); return; }
     try {
         const selectedDateStr = selectedDay.date.toISOString().split('T')[0];
         const todayDateStr = new Date().toISOString().split('T')[0];
         // Combina todos os agendamentos relevantes para checar 'hasAppointments'
         const allAppointments = [ ...(_data.todayAppointments || []), ...(_data.weeklyAppointments || []), ...(_data.appointmentHistory || []) ];
         
         calendarDaysEl.innerHTML = weekDays.map(day => {
             const dayDateStr = day.date.toISOString().split('T')[0];
             const isActive = dayDateStr === selectedDateStr;
             const isToday = dayDateStr === todayDateStr;
             const hasAppointments = allAppointments.some(app => app.date && app.date.startsWith(dayDateStr)); // Checa se app.date existe
             const fullDateTitle = day.date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
             return `
             <button
                 class="day-item ${isActive ? 'active' : ''} ${isToday ? 'today' : ''} ${hasAppointments ? 'has-appointments' : ''} ${document.body.classList.contains('dark') ? 'dark' : ''}"
                 data-date="${day.date.toISOString()}"
                 title="${fullDateTitle}"
             >
                 <div class="day-name">${day.shortName}</div>
                 <div class="day-number">${day.date.getDate()}</div>
             </button>`;
         }).join('');
     } catch (error) { console.error("Erro renderCalendarDays:", error); calendarDaysEl.innerHTML = '<p style="color:red; text-align:center;">Erro ao renderizar dias.</p>'; }
}

function renderCompactTimeSlots(selectedDay) {
    console.log("Dashboard DEBUG: renderCompactTimeSlots for", selectedDay.date.toISOString().split('T')[0]);
    const loadingEl = document.getElementById('calendar-loading');
    const listEl = document.getElementById('compact-appointment-list');
    const noEl = document.getElementById('no-appointments-for-day');
    const errorEl = document.getElementById('calendar-error');
    const wrapperEl = document.getElementById('time-slots'); // Parent container
    if (!loadingEl || !listEl || !noEl || !wrapperEl || !errorEl) {
        console.warn("Elementos da UI para slots de tempo não encontrados.");
        return;
    }

    loadingEl.style.display = 'block';
    listEl.style.display = 'none';
    noEl.style.display = 'none';
    errorEl.style.display = 'none';
    listEl.innerHTML = '';

    listEl.removeEventListener('click', handleAppointmentListClick);
    console.log("Dashboard DEBUG: Listener antigo removido de #compact-appointment-list");

    setTimeout(() => { // Simula delay de API, remover em produção se não necessário
        try {
            const allAppointments = [ ...(_data.todayAppointments || []), ...(_data.weeklyAppointments || []), ...(_data.appointmentHistory || []) ];
            const selectedDateStr = selectedDay.date.toISOString().split('T')[0];
            const dayAppointments = allAppointments
                .filter(app => app.date && app.date.startsWith(selectedDateStr)) // Garante que app.date existe
                .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

            if (dayAppointments.length === 0) {
                noEl.style.display = 'flex'; // Usa flex para centralizar o ícone e texto
            } else {
                listEl.style.display = 'block';
                listEl.innerHTML = dayAppointments.map(appointment => {
                    const formatTime = _utils.formatTimeDisplay(appointment.time);
                    const clockIcon = _icons.clock || '<i class="fas fa-clock fa-sm"></i>';
                    const infoIcon = _icons.info || '<i class="fas fa-info-circle fa-sm"></i>';
                    const chevRightIcon = _icons.chevronRight || '<i class="fas fa-chevron-right fa-xs"></i>';
                    return `
                       <li class="compact-appointment-item ${document.body.classList.contains('dark') ? 'dark' : ''}" data-appointment-id="${appointment.id}">
                           <span class="time">${clockIcon} ${formatTime}</span>
                           <div class="details">
                               <span class="name">${appointment.studentName || 'N/A'}</span>
                               <span class="type">${infoIcon} ${appointment.type || 'N/A'}</span>
                           </div>
                           <span class="chevron-icon">${chevRightIcon}</span>
                       </li>`;
                }).join('');
                listEl.addEventListener('click', handleAppointmentListClick);
                console.log("Dashboard DEBUG: Listener ADICIONADO a #compact-appointment-list (dentro de render)");
            }
        } catch (error) {
            console.error("Erro renderCompactTimeSlots:", error);
            errorEl.textContent = "Erro ao carregar horários do dia.";
            errorEl.style.display = 'block';
            noEl.style.display = 'none';
        } finally {
            loadingEl.style.display = 'none';
        }
    }, 50); // Delay pequeno para simular carregamento
}

async function navigateWeek(direction) {
    const newDate = new Date(appState.selectedDate);
    newDate.setDate(newDate.getDate() + (7 * direction));
    appState.selectedDate = newDate;
  
    try {
      appState.currentWeekDays = _utils.getWeekDays(appState.selectedDate);
      if (!Array.isArray(appState.currentWeekDays) || appState.currentWeekDays.length !== 7) {
        throw new Error("getWeekDays retornou dados inválidos para a nova semana.");
      }
  
      // Tenta selecionar o primeiro dia útil da nova semana, ou o primeiro dia se não houver dia útil
      const firstWeekday = appState.currentWeekDays.find(d => d.date.getDay() !== 0 && d.date.getDay() !== 6) || appState.currentWeekDays[0];
      appState.selectedDay = firstWeekday;
  
      const start = appState.currentWeekDays[0].date.toISOString().split('T')[0];
      const end = appState.currentWeekDays[6].date.toISOString().split('T')[0];
      const agendamentosResponse = await fetch(`/api/agendamentos/semana?start=${start}&end=${end}`);
      if(!agendamentosResponse.ok) throw new Error(`Erro HTTP ${agendamentosResponse.status} ao buscar agendamentos da semana.`);
      const agendamentos = await agendamentosResponse.json();
        
      if (!Array.isArray(agendamentos)) throw new Error("Dados de agendamentos da nova semana inválidos");

      const hoje = new Date().toISOString().split('T')[0];
      _data.todayAppointments = agendamentos.filter(a => a.date === hoje && !a.completed);
      _data.weeklyAppointments = agendamentos.filter(a => a.date !== hoje && !a.completed);
      _data.appointmentHistory = agendamentos.filter(a => a.completed);
  
      renderCalendarUI(); 
  
    } catch (error) {
      console.error("Erro ao navegar na semana (navigateWeek):", error);
      const errorEl = document.getElementById('calendar-error');
      if(errorEl) {
        errorEl.textContent = "Erro ao carregar dados da semana.";
        errorEl.style.display = 'block';
      }
    }
}
          
// --- Funções de Ação e Modal ---
async function viewAppointmentDetails(id) {
    const modal = document.getElementById('appointment-modal');
    const modalBody = document.getElementById('appointment-details'); // Onde o conteúdo vai
    const modalTitleEl = modal.querySelector('.modal-title'); // Para o título
    const loadingEl = document.getElementById('modal-loading');
  
    if (!modal || !modalBody || !loadingEl || !modalTitleEl) {
        console.warn("Elementos do modal para detalhes não encontrados.");
        return;
    }
  
    currentAppointmentIdInModal = id;
    modalTitleEl.textContent = "Carregando Detalhes..."; // Título enquanto carrega
    modalBody.innerHTML = ''; // Limpa corpo
    loadingEl.style.display = 'block'; // Mostra spinner
    // Abertura do modal agora é controlada pelo script inline do painel.html
    // modal.classList.add('visible'); // Se você tiver uma classe para mostrar/esconder
    // Ou diretamente:
    if (typeof openCustomModal === 'function') { // Verifica se a função do script inline existe
        openCustomModal("Carregando Detalhes...", ""); // Abre modal vazio com título de loading
    } else {
        modal.style.display = 'flex'; // Fallback
    }
  
    try {
      const res = await fetch(`/api/agendamentos/${id}`);
      if (!res.ok) throw new Error(`Erro HTTP ${res.status} ao buscar detalhes do agendamento.`);
      const data = await res.json();
  
      const formatDate = _utils.formatDate;
      const formatTime = _utils.formatTimeDisplay;
      const calculateAge = (birthDateISO) => {
        if (!birthDateISO) return '?';
        const birth = new Date(birthDateISO); // Assume que studentAge (data.studentAge) é YYYY-MM-DD
        if (isNaN(birth.getTime())) return '?';
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
      };
  
      modalTitleEl.textContent = data.studentName ? `Detalhes de ${data.studentName}` : "Detalhes do Atendimento";

      // Ícones para os detalhes
      const userIconHTML = _icons.user || '<i class="fas fa-user fa-fw"></i>';
      const ageIconHTML = _icons.birthdayCake || '<i class="fas fa-birthday-cake fa-fw"></i>';
      const gradeIconHTML = _icons.graduationCap || '<i class="fas fa-graduation-cap fa-fw"></i>';
      const calendarIconHTML = _icons.calendar || '<i class="fas fa-calendar-alt fa-fw"></i>';
      const clockIconHTML = _icons.clock || '<i class="fas fa-clock fa-fw"></i>';
      const typeIconHTML = _icons.info || '<i class="fas fa-info-circle fa-fw"></i>';
      const statusIconHTML = data.completed ? (_icons.checkCircle || '<i class="fas fa-check-circle fa-fw"></i>') : (_icons.hourglassHalf || '<i class="fas fa-hourglass-half fa-fw"></i>');
      const notesIconHTML = _icons.file || '<i class="fas fa-file-alt fa-fw"></i>';
  
      modalBody.innerHTML = `
        <div class="detail-group">
          <div class="detail-group-title">Aluno</div>
          <div class="detail-row">
            <span class="detail-icon">${userIconHTML}</span>
            <div class="detail-info">
              <span class="detail-label">Nome</span>
              <span class="detail-value">${data.studentName || 'N/A'}</span>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-icon">${ageIconHTML}</span>
            <div class="detail-info">
              <span class="detail-label">Idade</span>
              <span class="detail-value">${calculateAge(data.studentAge)} anos</span>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-icon">${gradeIconHTML}</span>
            <div class="detail-info">
              <span class="detail-label">Série/Curso</span>
              <span class="detail-value">${data.grade || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div class="detail-group">
          <div class="detail-group-title">Atendimento</div>
          <div class="detail-row">
            <span class="detail-icon">${calendarIconHTML}</span>
            <div class="detail-info">
              <span class="detail-label">Data</span>
              <span class="detail-value">${formatDate(data.date)}</span>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-icon">${clockIconHTML}</span>
            <div class="detail-info">
              <span class="detail-label">Horário</span>
              <span class="detail-value">${formatTime(data.time)}</span>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-icon">${typeIconHTML}</span>
            <div class="detail-info">
              <span class="detail-label">Tipo/Motivo</span>
              <span class="detail-value">${data.type || 'N/A'}</span>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-icon">${statusIconHTML}</span>
            <div class="detail-info">
              <span class="detail-label">Status</span>
              <span class="detail-value">${data.completed ? '<span class="badge badge-success">Concluído</span>' : '<span class="badge badge-primary">Agendado</span>'}</span>
            </div>
          </div>
          ${data.observations ? `
          <div class="detail-row">
            <span class="detail-icon">${notesIconHTML}</span>
            <div class="detail-info">
              <span class="detail-label">Observações</span>
              <span class="detail-value" style="white-space: pre-wrap;">${data.observations}</span>
            </div>
          </div>` : ''}
        </div>
      `;
  
    } catch (error) {
      console.error("Erro ao buscar detalhes do agendamento:", error);
      modalTitleEl.textContent = "Erro";
      modalBody.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar dados do atendimento.</p>`;
    } finally {
      loadingEl.style.display = 'none';
    }
}


function handleEditAppointmentClick() {
     if (currentAppointmentIdInModal !== null) { 
        // alert(`Edição do agendamento ID: ${currentAppointmentIdInModal} (Implementar)`); 
        console.warn(`Tentativa de editar agendamento ID: ${currentAppointmentIdInModal}. Funcionalidade de edição não implementada no painel.js.`);
        // Aqui você poderia, por exemplo, redirecionar para uma página de edição:
        // window.location.href = `/editar-agendamento?id=${currentAppointmentIdInModal}`;
     } else { 
        console.error("Nenhum ID de agendamento ativo na modal para editar."); 
     }
}
function closeAppointmentModal() {
     const modal = document.getElementById('appointment-modal'); 
     // if(modal) modal.classList.remove('visible'); // Se você usa classes para visibilidade
     if (typeof closeCustomModal === 'function') { // Verifica se a função do script inline existe
        closeCustomModal();
     } else if (modal) {
        modal.style.display = 'none'; // Fallback
     }
     currentAppointmentIdInModal = null;
}

// Função addAppointment - Comentada pois o botão #new-appointment agora redireciona.
// Se esta função for usada por outra parte do calendário, descomente e ajuste.
/*
function addAppointment(time, dateISO) { 
    const dateFormatted = _utils.formatDate(dateISO); 
    const timeFormatted = _utils.formatTimeDisplay(time); 
    // Este alert é o que estava aparecendo.
    // alert(`Adicionar atendimento às ${timeFormatted || '?'} em ${dateFormatted || '?'} (Implementar)`); 
    console.log(`Chamada para addAppointment: ${timeFormatted || '?'} em ${dateFormatted || '?'} (Implementar)`);
    // Aqui você implementaria a lógica para abrir um formulário/modal de novo agendamento.
    // Por exemplo, redirecionar para /agendamento ou abrir um modal de criação.
    // Se for redirecionar para /agendamento, talvez passe a data e hora como parâmetros.
    // window.location.href = `/agendamento?data=${dateISO.split('T')[0]}&hora=${time}`;
}
*/

function scrollToCalendar(event) { 
    event.preventDefault(); 
    const calendarElement = document.getElementById('calendar'); 
    if (calendarElement) { 
        calendarElement.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
    } 
}