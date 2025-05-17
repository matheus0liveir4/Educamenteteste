    // === Script inline DOMContentLoaded e funções relacionadas ===

    // ==================================================================
    // === NOVAS FUNÇÕES PARA CARREGAR CARDS DAS OUTRAS ABAS ===
    // ==================================================================
    function createAppointmentCard(item, tabType) {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.setAttribute('data-id', item.id);
        card.setAttribute('data-status', item.status); // Status da solicitação

        const formattedDateEnvio = (typeof utils !== 'undefined' && typeof utils.formatDate === 'function')
            ? utils.formatDate(item.criado_em) // Usado para 'Rejeitado' e 'Finalizado' como data de referência
            : new Date(item.criado_em).toLocaleDateString('pt-BR');

        let dataAgendamentoFormatada = 'N/A';
        if (item.data_ultimo_agendamento) {
            try {
                const [year, month, day] = item.data_ultimo_agendamento.split('-');
                dataAgendamentoFormatada = `${day}/${month}/${year}`;
            } catch (e) {
                dataAgendamentoFormatada = item.data_ultimo_agendamento;
            }
        }
        const horaAgendamentoFormatada = item.hora_ultimo_agendamento || 'N/A';
        

        let footerButtonsHTML = '';
        if (tabType === 'upcoming') { // Próximos Atendimentos (Status "Agendado")
            footerButtonsHTML = `
                <button class="custom-btn btn-card-action custom-btn-warning btn-sm" data-action="return" data-id="${item.id}" data-tooltip="Retornar para Pendente (cancela agendamento)" data-tooltip-type="warning"><i class="fas fa-undo-alt"></i> Desfazer</button>
                <button class="custom-btn btn-card-action custom-btn-primary btn-sm" data-action="finalize" data-id="${item.id}" data-tooltip="Finalizar este atendimento" data-tooltip-type="primary"><i class="fas fa-check-double"></i> Finalizar</button>
            `;
        } else if (tabType === 'rejected') { // Rejeitadas (Status "Rejeitado")
             footerButtonsHTML = `
                <button class="custom-btn btn-card-action custom-btn-warning btn-sm" data-action="revert-to-pending" data-id="${item.id}" data-tooltip="Reverter para Pendente" data-tooltip-type="warning"><i class="fas fa-history"></i> Reverter</button>
            `;
        } else if (tabType === 'completed') { // Finalizados (Status "Finalizado")
            footerButtonsHTML = `
                <button class="custom-btn btn-card-action custom-btn-warning btn-sm" data-action="undo-finalize" data-id="${item.id}" data-tooltip="Desfazer finalização (volta para Pendente)" data-tooltip-type="warning"><i class="fas fa-undo"></i> Desfazer</button>
            `;
        }
        
        const detailsLink = `detalhes?id=${item.id}`; // Sem acento

        card.innerHTML = `
            <div class="appointment-card-header">
                <h3>
                    <span>${item.nome || 'N/A'}</span>
                    <a href="${detailsLink}" class="view-details-icon" data-tooltip="Ver detalhes completos" data-tooltip-type="info">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </h3>
            </div>
            <div class="appointment-card-body">
                <p><i class="fas fa-book"></i> Curso: ${item.curso || 'N/A'}</p>
                <p><i class="fas fa-university"></i> Unidade: ${item.instituicao || 'N/A'}</p>
                ${tabType === 'upcoming' ? `<p><i class="fas fa-calendar-check"></i> Agendado para: ${dataAgendamentoFormatada} às ${horaAgendamentoFormatada}</p>` : ''}
                ${tabType === 'rejected' ? `<p><i class="fas fa-calendar-times"></i> Solicitação de ${formattedDateEnvio}</p>` : ''}
                ${tabType === 'completed' ? `<p><i class="fas fa-check-circle"></i> Atendimento finalizado (solic. de ${formattedDateEnvio})</p>` : ''}
                 <p><i class="fas fa-info-circle"></i> Status: <span class="badge badge-sm status-${item.status?.toLowerCase().replace(' ', '-')}">${item.status}</span></p>
            </div>
            <div class="appointment-card-footer">
                ${footerButtonsHTML}
            </div>
        `;

        const buttons = card.querySelectorAll('.custom-btn[data-action]');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.dataset.action;
                const itemId = parseInt(this.dataset.id);
                const solicitacaoItem = window.globalAllSolicitacoes && window.globalAllSolicitacoes.find(s => s.id === itemId);

                if (!solicitacaoItem) {
                    console.error(`[CARD ACTION] Solicitação com ID ${itemId} não encontrada em globalAllSolicitacoes.`);
                    if (typeof window.showToast === 'function') {
                        window.showToast('Erro: Dados da solicitação não encontrados. Recarregue a página.', 'error');
                    }
                    return;
                }
                
                if (typeof window.alterarStatusComConfirmacao !== 'function') {
                     console.error("[CARD ACTION] Função 'alterarStatusComConfirmacao' não está definida globalmente.");
                     alert("Erro crítico: Função de alteração de status não encontrada.");
                     return;
                }

                if (action === 'return' && tabType === 'upcoming') {
                    window.alterarStatusComConfirmacao(itemId, 'Pendente', solicitacaoItem);
                } else if (action === 'finalize' && tabType === 'upcoming') {
                    window.alterarStatusComConfirmacao(itemId, 'Finalizado', solicitacaoItem);
                } else if (action === 'revert-to-pending' && tabType === 'rejected') {
                    window.alterarStatusComConfirmacao(itemId, 'Pendente', solicitacaoItem);
                } else if (action === 'undo-finalize' && tabType === 'completed') {
                     window.alterarStatusComConfirmacao(itemId, 'Pendente', solicitacaoItem);
                }
            });
        });
        return card;
    }

    window.loadUpcomingAppointments = function() {
        const container = document.getElementById('upcoming-list');
        const noResultsDiv = document.getElementById('no-upcoming');
        if (!container || !noResultsDiv) {
            console.warn("[loadUpcoming] Container ou noResultsDiv não encontrado.");
            return;
        }

        container.innerHTML = '';
        const allItems = window.globalAllSolicitacoes || [];
        const upcomingItems = allItems.filter(item => item.status === 'Agendado');
        
        if (upcomingItems.length > 0) {
            // Ordenar por data e hora do agendamento (mais próximos primeiro)
            upcomingItems.sort((a,b) => {
                const dateA = a.data_agendamento ? new Date(a.data_agendamento + 'T' + (a.hora_agendamento || '00:00:00')) : new Date(0);
                const dateB = b.data_agendamento ? new Date(b.data_agendamento + 'T' + (b.hora_agendamento || '00:00:00')) : new Date(0);
                return dateA - dateB;
            });
            upcomingItems.forEach(item => container.appendChild(createAppointmentCard(item, 'upcoming')));
            noResultsDiv.style.display = 'none';
            container.style.display = 'grid';
        } else {
            noResultsDiv.style.display = 'block';
            container.style.display = 'none';
        }
         console.log("[HTML] Próximos Atendimentos carregados:", upcomingItems.length);
    }

    window.loadRejectedRequests = function() {
        const container = document.getElementById('rejected-list');
        const noResultsDiv = document.getElementById('no-rejected');
        if (!container || !noResultsDiv) {
            console.warn("[loadRejected] Container ou noResultsDiv não encontrado.");
            return;
        }
        container.innerHTML = '';
        const allItems = window.globalAllSolicitacoes || [];
        const rejectedItems = allItems.filter(item => item.status === 'Rejeitado');

        if (rejectedItems.length > 0) {
            rejectedItems.sort((a,b) => new Date(b.criado_em) - new Date(a.criado_em)); // Mais recentes primeiro (baseado na data de criação da solicitação)
            rejectedItems.forEach(item => container.appendChild(createAppointmentCard(item, 'rejected')));
            noResultsDiv.style.display = 'none';
            container.style.display = 'grid';
        } else {
            noResultsDiv.style.display = 'block';
            container.style.display = 'none';
        }
        console.log("[HTML] Rejeitadas carregadas:", rejectedItems.length);
    }

    window.loadCompletedRequests = function() {
        const container = document.getElementById('completed-list');
        const noResultsDiv = document.getElementById('no-completed');
        if (!container || !noResultsDiv) {
            console.warn("[loadCompleted] Container ou noResultsDiv não encontrado.");
            return;
        }
        container.innerHTML = '';
        const allItems = window.globalAllSolicitacoes || [];
        const completedItems = allItems.filter(item => item.status === 'Finalizado');

        if (completedItems.length > 0) {
            completedItems.sort((a,b) => new Date(b.criado_em) - new Date(a.criado_em)); // Mais recentes primeiro
            completedItems.forEach(item => container.appendChild(createAppointmentCard(item, 'completed')));
            noResultsDiv.style.display = 'none';
            container.style.display = 'grid';
        } else {
            noResultsDiv.style.display = 'block';
            container.style.display = 'none';
        }
         console.log("[HTML] Finalizadas carregadas:", completedItems.length);
    }
    // ==================================================================
    // === FIM DAS NOVAS FUNÇÕES PARA CARDS ===
    // ==================================================================


    document.addEventListener('DOMContentLoaded', function() {
        console.log("============= [HTML] DOMCONTENTLOADED - INÍCIO (VERSÃO COM CARDS) =============");
        try {
            if (typeof icons !== 'undefined' && icons.home && typeof icons.home === 'string') {
                const iconHomeEl = document.getElementById('icon-home');
                const iconHistoryEl = document.getElementById('icon-history');
                const iconRequestsEl = document.getElementById('icon-requests');
                if(iconHomeEl) iconHomeEl.innerHTML = icons.home;
                if(iconHistoryEl) iconHistoryEl.innerHTML = icons.history;
                if(iconRequestsEl) iconRequestsEl.innerHTML = icons.requests;
            } else { console.warn("[HTML] Objeto 'icons' não definido ou incompleto."); }
        } catch (e) { console.error("[HTML] Erro ao setar Navbar icons:", e); }

        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        const toggleDarkMode = document.getElementById('toggle-dark-mode');
        const iconSun = document.getElementById('icon-sun');
        const iconMoon = document.getElementById('icon-moon');
        const logoutButton = document.getElementById('logout-nav-link');

        if (toggleDarkMode && iconSun && iconMoon) {
            const applyDarkModePreference = (isDark) => {
                document.body.classList.add('no-transitions');
                document.body.classList.toggle('dark', isDark);
                iconSun.style.display = isDark ? 'none' : 'inline-block';
                iconMoon.style.display = isDark ? 'inline-block' : 'none';
                requestAnimationFrame(() => { requestAnimationFrame(() => { document.body.classList.remove('no-transitions'); }); });
            };
            const darkModeUserPreference = localStorage.getItem('darkMode') === 'enabled';
            toggleDarkMode.checked = darkModeUserPreference;
            applyDarkModePreference(darkModeUserPreference);

            toggleDarkMode.addEventListener('change', function() {
                const isDarkEnabled = this.checked;
                applyDarkModePreference(isDarkEnabled);
                localStorage.setItem('darkMode', isDarkEnabled ? 'enabled' : 'disabled');
            });
        } else { console.warn("[HTML] Elementos do Dark Mode não encontrados."); }

        if (logoutButton) {
            logoutButton.addEventListener('click', function(event) {
                event.preventDefault();
                const logoutUrl = this.getAttribute('href');

                if (typeof window.showConfirmationModal === 'function') {
                    window.showConfirmationModal('Confirmar Saída', 'Tem certeza que deseja sair da sua conta e retornar à tela inicial?',
                        () => { window.location.href = logoutUrl; }, null, 'Sim, Sair', 'custom-btn-danger'
                    );
                } else {
                    if (confirm('Tem certeza que deseja sair?')) { window.location.href = logoutUrl; }
                }
            });
        } else { console.warn("[HTML] Botão de logout não encontrado."); }

        if (tabs.length > 0 && tabContents.length > 0) {
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    tabs.forEach(t => t.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    this.classList.add('active');
                    const tabName = this.getAttribute('data-tab');
                    const activeContent = document.getElementById(`tab-${tabName}`);
                    if (activeContent) {
                        activeContent.classList.add('active');
                        sessionStorage.setItem('activeSolicitacoesTab', tabName); 
                        
                        // CHAMAR AS FUNÇÕES DE LOAD CORRESPONDENTES
                        if (tabName === 'upcoming' && typeof window.loadUpcomingAppointments === 'function') {
                            window.loadUpcomingAppointments();
                        } else if (tabName === 'rejected' && typeof window.loadRejectedRequests === 'function') {
                            window.loadRejectedRequests();
                        } else if (tabName === 'completed' && typeof window.loadCompletedRequests === 'function') {
                            window.loadCompletedRequests();
                        }
                        // A aba 'pending' é renderizada pelo renderTable() dentro de filterAndSearchRows()
                        // que é chamado por initializeSolicitacoes() ou interações de filtro/busca.
                        // Se for 'pending' e initializeSolicitacoes ainda não rodou, ele vai cuidar.
                        // Se já rodou, a tabela deve estar lá.
                    } else { console.error(`[HTML] Conteúdo da aba não encontrado: #tab-${tabName}`); }
                });
            });
        } else { console.warn("[HTML] Abas ou seus conteúdos não encontrados."); }

        function activateInitialTab() {
            let tabNameToActivate = sessionStorage.getItem('activeSolicitacoesTab');
            const tabToFocusAfterAction = sessionStorage.getItem('focusTabOnLoad');

            if (tabToFocusAfterAction) {
                tabNameToActivate = tabToFocusAfterAction;
                sessionStorage.removeItem('focusTabOnLoad');
            }

            if (tabNameToActivate) {
                const tabToActivateElement = document.querySelector(`.tab[data-tab="${tabNameToActivate}"]`);
                if (tabToActivateElement) {
                    if (!tabToActivateElement.classList.contains('active')) {
                        tabToActivateElement.click(); // Isso vai ativar o conteúdo E chamar a função de load
                    } else {
                        // Se já estiver ativa, força o recarregamento do conteúdo específico
                        // A aba 'pending' é atualizada por initializeSolicitacoes
                        if (tabNameToActivate === 'upcoming' && typeof window.loadUpcomingAppointments === 'function') window.loadUpcomingAppointments();
                        else if (tabNameToActivate === 'rejected' && typeof window.loadRejectedRequests === 'function') window.loadRejectedRequests();
                        else if (tabNameToActivate === 'completed' && typeof window.loadCompletedRequests === 'function') window.loadCompletedRequests();
                    }
                } else { // Se a aba guardada não existe, ativa a padrão
                    activateDefaultTab();
                }
            } else { // Se nenhuma aba guardada, ativa a padrão
                activateDefaultTab();
            }

            const toastMessage = sessionStorage.getItem('toastOnNextLoad_message');
            if (toastMessage && typeof window.showToast === 'function') {
                window.showToast(toastMessage, sessionStorage.getItem('toastOnNextLoad_type') || 'info');
                sessionStorage.removeItem('toastOnNextLoad_message');
                sessionStorage.removeItem('toastOnNextLoad_type');
            }
        }

        function activateDefaultTab() {
            // Prioriza a aba 'pending' como padrão se nenhuma outra estiver definida
            let defaultTabElement = document.querySelector('.tab[data-tab="pending"]');
            if (!defaultTabElement) { // Fallback para a primeira aba encontrada se 'pending' não existir
                defaultTabElement = document.querySelector('.tab');
            }

            if (defaultTabElement) {
                if (!defaultTabElement.classList.contains('active')) {
                    defaultTabElement.click(); // Clica para ativar e carregar
                } else {
                    // Se já estiver ativa (ex: 'pending' é a default do HTML e já está marcada)
                    // E é uma das abas com cards, chama sua função de load para garantir
                    const tabName = defaultTabElement.dataset.tab;
                    if (tabName === 'upcoming' && typeof window.loadUpcomingAppointments === 'function') window.loadUpcomingAppointments();
                    else if (tabName === 'rejected' && typeof window.loadRejectedRequests === 'function') window.loadRejectedRequests();
                    else if (tabName === 'completed' && typeof window.loadCompletedRequests === 'function') window.loadCompletedRequests();
                    // Para 'pending', initializeSolicitacoes (chamado abaixo) cuidará de carregar.
                }
            } else {
                console.error("[HTML] Nenhuma aba encontrada para ativar como padrão.");
            }
        }
        
        if (typeof window.initializeSolicitacoes === 'function') {
            window.initializeSolicitacoes()
                .then(() => {
                    console.log("[HTML DOMContentLoaded] Dados de solicitações inicializados. Ativando aba...");
                    activateInitialTab(); 
                })
                .catch(error => {
                    console.error("[HTML DOMContentLoaded] ERRO AO INICIALIZAR SOLICITAÇÕES:", error);
                    activateInitialTab(); // Tenta ativar a aba mesmo com erro
                });
        } else {
            console.error("[HTML DOMContentLoaded] ERRO CRÍTICO: window.initializeSolicitacoes NÃO ENCONTRADA.");
            activateInitialTab(); 
        }
        console.log("============= [HTML] DOMCONTENTLOADED - FIM (VERSÃO COM CARDS) =============");
    });
    
    (function() {
        'use strict';
        let modalElement, modalTitleElement, modalBodyElement, confirmBtn, cancelBtn, closeBtnModal, currentConfirmCallback, currentCancelCallback, toastContainerElement;

        function initializeModalDOM() {
            if (document.getElementById('confirmationModal_generated')) return;
            const modalHTML = `
                <div id="confirmationModal_generated" class="custom-modal" aria-modal="true" role="dialog">
                    <div class="custom-modal-content">
                        <div class="custom-modal-header">
                            <h5 class="custom-modal-title" id="modalTitle_generated">Confirmar Ação</h5>
                            <button type="button" class="custom-modal-close" id="modalCloseBtn_generated" aria-label="Fechar" data-tooltip="Fechar esta caixa de diálogo" data-tooltip-type="secondary">×</button>
                        </div>
                        <div class="custom-modal-body" id="modalBodyText_generated"><p>Você tem certeza?</p></div>
                        <div class="custom-modal-footer">
                            <button type="button" class="custom-btn custom-btn-secondary" id="modalCancelBtn_generated" data-tooltip="Cancelar ação e fechar">Cancelar</button>
                            <button type="button" class="custom-btn custom-btn-primary" id="modalConfirmBtn_generated" data-tooltip="Confirmar e executar ação">Confirmar</button>
                        </div>
                    </div>
                </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modalElement = document.getElementById('confirmationModal_generated');
            modalTitleElement = document.getElementById('modalTitle_generated');
            modalBodyElement = document.getElementById('modalBodyText_generated');
            confirmBtn = document.getElementById('modalConfirmBtn_generated');
            cancelBtn = document.getElementById('modalCancelBtn_generated');
            closeBtnModal = document.getElementById('modalCloseBtn_generated');

            confirmBtn.addEventListener('click', () => { if (currentConfirmCallback) currentConfirmCallback(); hideModal(); });
            const closeModalActions = () => { if (currentCancelCallback) currentCancelCallback(); hideModal(); };
            cancelBtn.addEventListener('click', closeModalActions);
            closeBtnModal.addEventListener('click', closeModalActions);
            modalElement.addEventListener('click', (event) => { if (event.target === modalElement) closeModalActions(); });
            document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modalElement && modalElement.classList.contains('show')) closeModalActions(); });
        }
        function hideModal() { if (!modalElement) return; modalElement.classList.remove('show'); currentConfirmCallback = null; currentCancelCallback = null; }

        window.showConfirmationModal = function(title, message, confirmCallback, cancelCallback, confirmButtonText = 'Confirmar', confirmButtonClass = 'custom-btn-primary') {
            if (!modalElement) initializeModalDOM();
            modalTitleElement.textContent = title;
            modalBodyElement.innerHTML = `<p>${message.replace(/\n/g, "<br>")}</p>`;
            confirmBtn.textContent = confirmButtonText;
            confirmBtn.className = `custom-btn ${confirmButtonClass}`;
            confirmBtn.setAttribute('data-tooltip', `${confirmButtonText} e executar ação`);

            currentConfirmCallback = confirmCallback;
            currentCancelCallback = cancelCallback;
            modalElement.classList.add('show');
            if(confirmBtn) confirmBtn.focus();
        }

        function initializeToastContainerDOM() {
            if (document.getElementById('toastContainer_generated')) return;
            const toastContainerHTML = `<div id="toastContainer_generated" class="custom-toast-container"></div>`;
            document.body.insertAdjacentHTML('beforeend', toastContainerHTML);
            toastContainerElement = document.getElementById('toastContainer_generated');
        }
        window.showToast = function(message, type = 'info', duration = 3500) {
            if (!toastContainerElement) initializeToastContainerDOM();
            const toast = document.createElement('div');
            toast.className = `custom-toast custom-toast-${type}`;
            let iconClass = '';
            switch (type) {
                case 'success': iconClass = 'fas fa-check-circle'; break;
                case 'error': iconClass = 'fas fa-times-circle'; break;
                case 'warning': iconClass = 'fas fa-exclamation-triangle'; break;
                case 'info': iconClass = 'fas fa-info-circle'; break;
            }
            toast.innerHTML = (iconClass ? `<i class="${iconClass} custom-toast-icon"></i>` : '') + `<span>${message}</span>`;
            toastContainerElement.prepend(toast);
            requestAnimationFrame(() => { requestAnimationFrame(() => { toast.classList.add('show'); }); });
            setTimeout(() => {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => {
                    if (toast.parentNode === toastContainerElement) { toastContainerElement.removeChild(toast); }
                }, { once: true });
            }, duration);
        }
    })();

    // SCRIPT PARA TOOLTIP PERSONALIZADO (EXISTENTE)
    document.addEventListener('DOMContentLoaded', () => {
        let tooltipElement;
        const tooltipOffset = 10;

        function createTooltipElement() {
            if (document.getElementById('global-custom-tooltip')) {
                tooltipElement = document.getElementById('global-custom-tooltip');
                return;
            }
            tooltipElement = document.createElement('div');
            tooltipElement.id = 'global-custom-tooltip';
            tooltipElement.className = 'custom-tooltip-popup';
            document.body.appendChild(tooltipElement);
        }

        createTooltipElement(); // Chamar para garantir que exista

        function showTooltip(event) {
            const target = event.currentTarget;
            const tooltipText = target.getAttribute('data-tooltip');

            if (!tooltipText || !tooltipElement) return;

            tooltipElement.textContent = tooltipText;

            let tooltipType = target.getAttribute('data-tooltip-type') || 'default';
            if (tooltipType === 'default') {
                const typeRegex = /(?:btn-|custom-btn-)(primary|danger|warning|secondary|success|info)/;
                let typeFound = false;
                target.classList.forEach(cls => {
                    const match = cls.match(typeRegex);
                    if (match && match[1]) {
                        tooltipType = match[1];
                        typeFound = true;
                    }
                });
                if (!typeFound) {
                    if (target.classList.contains('finalized') || target.classList.contains('status-finalized')) tooltipType = 'info';
                    else if (target.classList.contains('active') && target.classList.contains('navbar-link')) tooltipType = 'info';
                    else if (target.classList.contains('filter-button')) tooltipType = 'secondary';
                    else if (target.classList.contains('tab')) {
                        tooltipType = target.getAttribute('data-tooltip-type') || 'info'; // Prioriza o atributo do tab
                    }
                }
            }

            tooltipElement.className = 'custom-tooltip-popup visible'; // Reseta e adiciona visible
            tooltipElement.classList.add(`type-${tooltipType}`); // Adiciona classe de tipo
            tooltipElement.style.setProperty('--tooltip-arrow-color', getComputedStyle(tooltipElement).backgroundColor);


            const targetRect = target.getBoundingClientRect();
            
            // Força reflow para obter dimensões corretas ANTES de calcular posição
            tooltipElement.style.display = 'block'; 
            const tooltipRect = tooltipElement.getBoundingClientRect();
            tooltipElement.style.display = ''; // Volta ao controle do CSS (.visible)

            let top = targetRect.top - tooltipRect.height - tooltipOffset;
            let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
            tooltipElement.classList.remove('arrow-bottom'); // Garante que não tenha a seta errada

            if (top - window.scrollY < 5) { // Se não couber em cima
                top = targetRect.bottom + tooltipOffset;
                tooltipElement.classList.add('arrow-bottom');
            }

            // Ajustes para não sair da tela horizontalmente
            if (left < 5) {
                left = 5;
            } else if (left + tooltipRect.width > window.innerWidth - 5) {
                left = window.innerWidth - tooltipRect.width - 5;
            }

            tooltipElement.style.left = `${left}px`;
            tooltipElement.style.top = `${top + window.scrollY}px`; // Adiciona scrollY para posicionamento absoluto correto
        }

        function hideTooltip() {
            if (tooltipElement) {
                tooltipElement.className = 'custom-tooltip-popup'; // Reseta para o estado oculto
            }
        }

        document.body.addEventListener('mouseenter', event => {
            const target = event.target.closest('[data-tooltip]');
            if (target) {
                // Guarda o título original e remove para não ter dois tooltips
                 if (target.hasAttribute('title') && target.getAttribute('title') !== target.getAttribute('data-tooltip')) {
                     target.setAttribute('data-original-title', target.getAttribute('title'));
                     target.removeAttribute('title');
                }
                showTooltip({ currentTarget: target });
            }
        }, true); // Use capturing phase

        document.body.addEventListener('mouseleave', event => {
            const target = event.target.closest('[data-tooltip]');
            if (target) {
                // Restaura o título original
                if (target.hasAttribute('data-original-title')) {
                    target.setAttribute('title', target.getAttribute('data-original-title'));
                    target.removeAttribute('data-original-title');
                }
                hideTooltip();
            }
        }, true); // Use capturing phase
    });
    