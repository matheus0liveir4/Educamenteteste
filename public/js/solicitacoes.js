// Arquivo: js/solicitacoes.js
(function() {
    'use strict';

    window.globalAllSolicitacoes = window.globalAllSolicitacoes || []; // Garante que exista
    let currentSortOrder = 'desc';
    let tbody, searchInput, filterButtons, dropdowns, filterOptions, sortOptions, noResultsMessage, noPendingMessage;

    function checkForSessionStorageToast() {
        if (typeof window.showToast === 'function') {
            const toastMessage = sessionStorage.getItem('toastOnNextLoad_message');
            const toastType = sessionStorage.getItem('toastOnNextLoad_type');
            if (toastMessage && toastType) {
                window.showToast(toastMessage, toastType, 4500);
                sessionStorage.removeItem('toastOnNextLoad_message');
                sessionStorage.removeItem('toastOnNextLoad_type');
            }
        }
    }

    function createRow(s, index) {
        const statusOriginal = s.status || 'Pendente';
        const row = document.createElement('tr');
        row.setAttribute('data-id', s.id);
        row.setAttribute('data-status', statusOriginal);
        row.setAttribute('data-unidade', s.instituicao);
        row.setAttribute('data-date', new Date(s.criado_em).toISOString());

        let statusClass = 'pending'; // Classe CSS padrão para status
        let statusText = statusOriginal; // Texto do status

        switch (statusOriginal) {
            case 'Pendente':
                statusClass = 'pending';
                break;
            // O status 'Aprovado' não deveria mais aparecer na tabela de Pendentes
            // com o novo fluxo, mas mantemos a classe caso algum dado antigo exista.
            case 'Aprovado':
                statusClass = 'approved';
                break;
            case 'Rejeitado':
                statusClass = 'rejected';
                break;
            // 'Agendado' e 'Finalizado' são para os cards, não para esta tabela.
            case 'Agendado':
                statusClass = 'scheduled';
                statusText = 'Agendado';
                break;
            case 'Finalizado':
                statusClass = 'finalized';
                statusText = 'Finalizado';
                break;
        }

        const formattedDate = (typeof utils !== 'undefined' && typeof utils.formatDate === 'function')
            ? utils.formatDate(s.criado_em)
            : new Date(s.criado_em).toLocaleDateString('pt-BR');

        const isPendente = statusOriginal === 'Pendente';

        let acoesHTML = `<a class="btn-sm btn-view" href="detalhes?id=${s.id}"
                           data-tooltip="Visualizar detalhes completos da solicitação"
                           data-tooltip-type="info"><i class="fas fa-eye"></i></a>`;

        // Ações apenas para status 'Pendente' na tabela de Pendentes
        if (isPendente) {
            // Mantendo o ícone e tooltip originais, mas a funcionalidade é de ir para agendamento
            acoesHTML += ` <button class="btn-sm btn-approve" data-id="${s.id}"
                                 data-tooltip="Aprovar e ir para agendamento" 
                                 data-tooltip-type="success"><i class="fas fa-check"></i></button>`;
            acoesHTML += ` <button class="btn-sm btn-reject" data-id="${s.id}"
                                 data-tooltip="Rejeitar esta solicitação"
                                 data-tooltip-type="danger"><i class="fas fa-times"></i></button>`;
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="aluno-nome">${s.nome || 'N/A'}</td>
            <td class="curso-nome">${s.curso || 'N/A'}</td>
            <td>${s.instituicao || 'N/A'}</td>
            <td>${s.telefone || 'N/A'}</td>
            <td>${formattedDate}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    ${acoesHTML}
                </div>
            </td>
        `;
        return row;
    }

    function renderTable(solicitacoesToRender) {
        if (!tbody) {
            console.error("!!!!!!!! [JS] TBODY É NULO EM RENDER TABLE !!!!!!!");
            return;
        }
        tbody.innerHTML = '';

        // Filtra para a aba "Pendentes": apenas itens com status 'Pendente'.
        const solicitacoesParaAbaPendente = solicitacoesToRender.filter(s =>
            s.status && s.status === 'Pendente'
        );

        solicitacoesParaAbaPendente.sort((a, b) => {
            const aTime = new Date(a.criado_em).getTime();
            const bTime = new Date(b.criado_em).getTime();
            return currentSortOrder === 'asc' ? aTime - bTime : bTime - aTime;
        });

        if (solicitacoesParaAbaPendente.length === 0) {
            if (noResultsMessage && noPendingMessage && searchInput) {
                const activeUiFilters = getActiveFilters();
                if (searchInput.value || activeUiFilters.status !== 'all' || activeUiFilters.unidade !== 'all') {
                    noResultsMessage.style.display = 'block';
                    noPendingMessage.style.display = 'none';
                } else {
                    noResultsMessage.style.display = 'none';
                    noPendingMessage.style.display = 'block';
                }
            }
        } else {
            if (noResultsMessage) noResultsMessage.style.display = 'none';
            if (noPendingMessage) noPendingMessage.style.display = 'none';
            solicitacoesParaAbaPendente.forEach((s, index) => {
                try {
                    const row = createRow(s, index);
                    tbody.appendChild(row);
                } catch (e) {
                    console.error("[JS] Erro ao criar/anexar linha em renderTable:", e, "para solicitação:", s);
                }
            });
        }
    }

    function getActiveFilters() {
        const filters = { status: 'all', unidade: 'all' };
        if (filterButtons) {
            filterButtons.forEach(btn => {
                const controlId = btn.dataset.controls;
                const selectedValue = btn.dataset.selectedValue;
                if (controlId === 'status-dropdown' && selectedValue) filters.status = selectedValue;
                else if (controlId === 'unidade-dropdown' && selectedValue) filters.unidade = selectedValue;
            });
        }
        return filters;
    }

    function filterAndSearchRows() {
        const solicitacoesParaFiltrar = Array.isArray(window.globalAllSolicitacoes) ? window.globalAllSolicitacoes : [];
        const term = searchInput?.value.toLowerCase().trim() ?? '';
        const { status: uiFilterStatus, unidade } = getActiveFilters();

        const filteredForTable = solicitacoesParaFiltrar.filter(s => {
            const matchSearch = !term || (s.nome?.toLowerCase().includes(term) || s.curso?.toLowerCase().includes(term));
            
            // Filtro de status para a TABELA (aba Pendentes)
            // Se o filtro da UI for 'all' OU 'Pendente', consideramos apenas 'Pendente' para esta tabela.
            let matchStatusTable;
            if (uiFilterStatus === 'all' || uiFilterStatus === 'Pendente') {
                matchStatusTable = (s.status === 'Pendente');
            } else {
                // Se o filtro da UI for 'Aprovado' ou 'Rejeitado', não mostrar na tabela de Pendentes.
                matchStatusTable = false; 
            }

            const matchUnidade = unidade === 'all' ? true : s.instituicao === unidade;
            return matchSearch && matchStatusTable && matchUnidade;
        });
        renderTable(filteredForTable);
    }

    async function alterarStatusComConfirmacao(id, novoStatus, solicitacaoDetails) {
        if (typeof window.showConfirmationModal !== 'function' || typeof window.showToast !== 'function') {
            alert(`Erro: Funções de interface não encontradas.`); return;
        }
        const solicitacao = solicitacaoDetails || (window.globalAllSolicitacoes && window.globalAllSolicitacoes.find(s => s.id === id));

        if (!solicitacao) {
            console.error(`[alterarStatus] Solicitação com ID ${id} não encontrada.`);
            window.showToast(`Erro: Não foi possível encontrar os dados da solicitação ${id}.`, 'error');
            return;
        }

        const nomeAluno = solicitacao.nome ? `"${solicitacao.nome}"` : 'esta solicitação';
        let modalTitle = '', confirmMessage = '', confirmButtonText = '';
        let confirmButtonClass = 'custom-btn-primary'; let toastTypeOnSuccess = 'success';

        switch(novoStatus) {
            case 'Pendente':
                modalTitle = 'Reverter para Pendente?';
                if (solicitacao.status === 'Agendado') confirmMessage = `Retornar a solicitação de ${nomeAluno} para "Pendente"? O agendamento associado será cancelado.`;
                else if (solicitacao.status === 'Rejeitado') confirmMessage = `Reverter a solicitação de ${nomeAluno} de "Rejeitado" para "Pendente"?`;
                else if (solicitacao.status === 'Finalizado') confirmMessage = `Desfazer finalização de ${nomeAluno}? A solicitação voltará para "Pendente".`;
                // O caso 'Aprovado' -> 'Pendente' não é mais o fluxo principal do botão da tabela
                else if (solicitacao.status === 'Aprovado') confirmMessage = `Reverter o estado de 'Aprovado' para ${nomeAluno}? A solicitação voltará para "Pendente".`;
                else confirmMessage = `Mudar status de ${nomeAluno} para "Pendente"?`;
                confirmButtonText = 'Sim, Reverter'; confirmButtonClass = 'custom-btn-warning'; break;
            case 'Rejeitado':
                modalTitle = 'Rejeitar Solicitação?';
                confirmMessage = `Tem certeza que deseja rejeitar a solicitação de ${nomeAluno}?`;
                confirmButtonText = 'Sim, Rejeitar';
                confirmButtonClass = 'custom-btn-danger';
                toastTypeOnSuccess = 'warning';
                break;
            case 'Finalizado':
                modalTitle = 'Finalizar Atendimento?'; confirmMessage = `Marcar o atendimento de ${nomeAluno} como finalizado?`;
                confirmButtonText = 'Sim, Finalizar'; confirmButtonClass = 'custom-btn-primary'; break;
            // O caso 'Aprovado' que era chamado pelo botão 'Aprovar' da tabela não é mais usado aqui.
            // O botão 'Aprovar' agora tem um fluxo diferente (só redireciona).
            // Este case 'Aprovado' ainda poderia ser usado por outras partes do sistema, se necessário.
            case 'Aprovado': 
                 modalTitle = 'Marcar como Aprovado?';
                 confirmMessage = `Deseja marcar a solicitação de ${nomeAluno} como "Aprovado"? (Este passo é geralmente intermediário antes do agendamento).`;
                 confirmButtonText = 'Sim, Aprovar'; confirmButtonClass = 'custom-btn-success'; break;
            default:
                console.warn(`[alterarStatus] Tentativa de mudar para status desconhecido ou não mapeado: ${novoStatus} para ${nomeAluno}`);
                modalTitle = `Confirmar Mudança?`; confirmMessage = `Alterar status de ${nomeAluno} para "${novoStatus}"?`;
                confirmButtonText = 'Confirmar'; break;
        }

        window.showConfirmationModal(modalTitle, confirmMessage, async () => {
            try {
                const res = await fetch(`/api/solicitacoes/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: novoStatus }) // Envia o novoStatus para o backend
                });

                if (res.ok) {
                    let successMessage = `Status de ${nomeAluno} alterado para "${novoStatus}".`;
                    if(novoStatus === 'Rejeitado') successMessage = `Solicitação de ${nomeAluno} foi rejeitada.`;
                    else if (novoStatus === 'Finalizado') successMessage = `Atendimento de ${nomeAluno} finalizado com sucesso.`;
                    else if (novoStatus === 'Pendente') {
                        if (solicitacao.status === 'Agendado') successMessage = `Agendamento de ${nomeAluno} cancelado. Solicitação retornou para pendente.`;
                        else if (solicitacao.status === 'Rejeitado') successMessage = `Solicitação de ${nomeAluno} revertida para Pendente.`;
                        else if (solicitacao.status === 'Finalizado') successMessage = `Finalização de ${nomeAluno} desfeita. Solicitação retornou para Pendente.`;
                        else if (solicitacao.status === 'Aprovado') successMessage = `Status 'Aprovado' de ${nomeAluno} revertido para Pendente.`;
                    }
                    
                    window.showToast(successMessage, toastTypeOnSuccess);
                    await initializeSolicitacoes();

                    let tabToFocus = 'pending';
                    if (novoStatus === 'Rejeitado') tabToFocus = 'rejected';
                    else if (novoStatus === 'Finalizado') tabToFocus = 'completed';
                    else if (novoStatus === 'Agendado') tabToFocus = 'upcoming';
                    // Se for 'Aprovado' por outra via, ou volta pra 'Pendente', a aba de pendentes já é o default

                    const currentActiveTab = document.querySelector('.tab.active')?.dataset.tab;
                    if (currentActiveTab !== tabToFocus) {
                        sessionStorage.setItem('focusTabOnLoad', tabToFocus);
                        const targetTabElement = document.querySelector(`.tab[data-tab="${tabToFocus}"]`);
                        if (targetTabElement && typeof targetTabElement.click === 'function') {
                            targetTabElement.click();
                        } else {
                            window.location.reload(); 
                        }
                    }
                } else {
                    const errorData = await res.json().catch(() => ({ message: `Erro desconhecido ao alterar status (HTTP ${res.status}).` }));
                    window.showToast(`Erro ao alterar status para ${nomeAluno}: ${errorData.message || res.statusText}`, 'error');
                }
            } catch (err) {
                console.error('[JS] Erro de rede/fetch em alterarStatus:', err);
                window.showToast(`Erro de comunicação ao tentar alterar o status. Tente novamente.`, 'error');
            }
        }, () => {
            window.showToast(`Ação de mudança de status para ${nomeAluno} foi cancelada.`, 'info');
        }, confirmButtonText, confirmButtonClass);
    }
    window.alterarStatusComConfirmacao = alterarStatusComConfirmacao;

    async function fetchDataAndRender() {
        console.log("============= [JS] FETCH DATA AND RENDER - INÍCIO =============");
        try {
            const res = await fetch('/api/solicitacoes');
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Erro HTTP ${res.status} ao buscar solicitações. Detalhe: ${errorText.substring(0,100)}`);
            }
            const data = await res.json();
            window.globalAllSolicitacoes = Array.isArray(data) ? data : [];
            console.log("[JS fetchDataAndRender] globalAllSolicitacoes atualizado, total:", window.globalAllSolicitacoes.length);

            filterAndSearchRows(); // Renderiza a tabela de "Pendentes"

            const activeTabElement = document.querySelector('.tab.active');
            if (activeTabElement) {
                const currentTabName = activeTabElement.dataset.tab;
                if (currentTabName === 'completed' && typeof window.loadCompletedRequests === 'function') {
                    window.loadCompletedRequests();
                } else if (currentTabName === 'upcoming' && typeof window.loadUpcomingAppointments === 'function') {
                    window.loadUpcomingAppointments();
                } else if (currentTabName === 'rejected' && typeof window.loadRejectedRequests === 'function') {
                    window.loadRejectedRequests();
                }
            }
            return window.globalAllSolicitacoes;
        } catch (err) {
            console.error('[JS] ERRO CRÍTICO em fetchDataAndRender:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger, #F44336); padding: 1rem;">Falha ao carregar solicitações. Verifique sua conexão ou contate o suporte.</td></tr>`;
            window.globalAllSolicitacoes = [];
            throw err;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        tbody = document.getElementById('solicitacoes-tbody');
        searchInput = document.getElementById('search-input');
        filterButtons = document.querySelectorAll('.filter-button');
        dropdowns = document.querySelectorAll('.filter-dropdown');
        filterOptions = document.querySelectorAll('.filter-option');
        sortOptions = document.querySelectorAll('.sort-option');
        noResultsMessage = document.getElementById('no-results-message');
        noPendingMessage = document.getElementById('no-pending');

        if (!tbody) console.error("[JS DOMContentLoaded] ERRO GRAVE: tbody#solicitacoes-tbody NÃO encontrado no DOM!");

        checkForSessionStorageToast();

        if (tbody) {
            tbody.addEventListener('click', e => {
                const button = e.target.closest('button[data-id]');
                if (!button) return;

                const id = parseInt(button.dataset.id);
                const solicitacao = window.globalAllSolicitacoes && window.globalAllSolicitacoes.find(s => s.id === id);

                if (!solicitacao) {
                    console.error(`[TBODY CLICK] Solicitação com ID ${id} não encontrada em globalAllSolicitacoes.`);
                    if (typeof window.showToast === 'function') {
                        window.showToast('Erro: Dados da solicitação não encontrados. Tente recarregar.', 'error');
                    }
                    return;
                }

                if (button.classList.contains('btn-approve')) {
                    // FLUXO CORRIGIDO: Botão "Aprovar" (com ícone de check) agora apenas
                    // confirma a intenção e redireciona para a tela de agendamento.
                    // O status da solicitação NÃO é alterado para 'Aprovado' aqui.
                    // Isso acontecerá no backend QUANDO o agendamento for efetivamente salvo (irá para 'Agendado').
                    const nomeAluno = solicitacao.nome ? `"${solicitacao.nome}"` : 'esta solicitação';

                    // Modal para confirmar a intenção de ir para o agendamento
                    window.showConfirmationModal(
                        'Aprovar e Agendar?', // Mantendo o título do modal
                        `Prosseguir para a tela de agendamento para ${nomeAluno}?`, // Mensagem
                        () => { // onConfirm: O que fazer se o usuário clicar "Sim, Agendar"
                            console.log(`[BTN_APPROVE_FLOW] Usuário confirmou ir para agendamento para solicitação ${id}. Redirecionando...`);

                            const params = new URLSearchParams({
                                id: id.toString(),
                                aluno: solicitacao.nome || '',
                                curso: solicitacao.curso || '',
                                unidade: solicitacao.instituicao || '',
                                telefone: solicitacao.telefone || ''
                            });
                            sessionStorage.setItem('toastOnNextLoad_message', `Solicitação de ${solicitacao.nome || 'aluno'} encaminhada para agendamento. Preencha os dados.`);
                            sessionStorage.setItem('toastOnNextLoad_type', 'info');
                            window.location.href = `/agendamento?${params.toString()}`;
                        },
                        () => { // onCancel
                            if (typeof window.showToast === 'function') {
                                window.showToast(`Ação de agendar para ${nomeAluno} cancelada.`, 'info');
                            }
                        },
                        'Sim, Agendar',       // Texto do botão de confirmação
                        'custom-btn-success'  // Classe CSS do botão de confirmação
                    );

                } else if (button.classList.contains('btn-reject')) {
                    alterarStatusComConfirmacao(id, 'Rejeitado', solicitacao);
                }
            });
        }

        if (filterButtons) { 
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function(event) { 
                    event.stopPropagation(); 
                    const isActive = this.classList.contains('active');
                    dropdowns.forEach(d => { if (d !== this.nextElementSibling) d.classList.remove('active'); });
                    filterButtons.forEach(b => { if (b !== this) b.classList.remove('active'); });
                    const dropdownId = this.dataset.controls;
                    const dropdown = document.getElementById(dropdownId);
                    if (dropdown) { dropdown.classList.toggle('active', !isActive); }
                    this.classList.toggle('active', !isActive);
                });
            });
        }
        if (filterOptions) { 
            filterOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                     e.preventDefault(); 
                     const dropdown = option.closest('.filter-dropdown'); 
                     const btn = dropdown?.previousElementSibling;
                     if (btn && dropdown) {
                         const filterType = option.dataset.filterType;
                         const filterValue = option.dataset.filterValue;
                         
                         const btnTextSpan = btn.querySelector('span:not([class*="fa-"])'); 
                         if(btnTextSpan) btnTextSpan.textContent = option.textContent;

                         btn.dataset.selectedValue = filterValue; 
                         
                         if (filterType === 'status') { 
                             const statusBtnTextEl = document.getElementById('status-btn-text');
                             if(statusBtnTextEl) statusBtnTextEl.textContent = filterValue === 'all' ? 'Status' : option.textContent;
                         } else if (filterType === 'unidade') { 
                             const unidadeBtnTextEl = document.getElementById('unidade-btn-text');
                             if(unidadeBtnTextEl) unidadeBtnTextEl.textContent = filterValue === 'all' ? 'Unidade' : option.textContent;
                         }

                         dropdown.classList.remove('active'); 
                         btn.classList.remove('active');
                         filterAndSearchRows();
                     }
                });
            });
        }
        if (sortOptions) { 
            sortOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    const dropdown = option.closest('.filter-dropdown');
                    const btn = dropdown?.previousElementSibling;
                    currentSortOrder = option.dataset.sortOrder;
                    
                    const btnTextSpan = btn?.querySelector('span:not([class*="fa-"])'); 
                    if (btnTextSpan) btnTextSpan.textContent = option.textContent;
                    
                    if (dropdown) dropdown.classList.remove('active');
                    if (btn) btn.classList.remove('active');
                    filterAndSearchRows(); 
                });
            });
        }
        
        document.addEventListener('click', (e) => { 
            if (!e.target.closest('.filter-button-wrapper')) {
                dropdowns.forEach(d => d.classList.remove('active'));
                filterButtons.forEach(b => b.classList.remove('active'));
            }
        });

        if (searchInput) { 
            let searchDebounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    filterAndSearchRows(); 
                }, 300); 
            }); 
        }
    }); // Fim do DOMContentLoaded

    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            console.log("[JS pageshow] Página restaurada do cache. Recarregando dados e verificando toasts/aba ativa.");
            checkForSessionStorageToast();
            initializeSolicitacoes().then(() => {
                console.log("[JS pageshow] Dados reinicializados.");
                const focusTabName = sessionStorage.getItem('focusTabOnLoad') || sessionStorage.getItem('activeSolicitacoesTab') || 'pending';
                const tabToActivate = document.querySelector(`.tab[data-tab="${focusTabName}"]`);
                
                if (tabToActivate && typeof tabToActivate.click === 'function') {
                    if (!tabToActivate.classList.contains('active')) {
                        tabToActivate.click();
                    } else {
                        if (focusTabName === 'upcoming' && typeof window.loadUpcomingAppointments === 'function') window.loadUpcomingAppointments();
                        else if (focusTabName === 'rejected' && typeof window.loadRejectedRequests === 'function') window.loadRejectedRequests();
                        else if (focusTabName === 'completed' && typeof window.loadCompletedRequests === 'function') window.loadCompletedRequests();
                    }
                }
                if (sessionStorage.getItem('focusTabOnLoad')) {
                    sessionStorage.removeItem('focusTabOnLoad');
                }
            }).catch(err => console.error("[JS pageshow] Erro ao reinicializar dados após restauração do cache:", err));
        }
    });

    function initializeSolicitacoes() {
        console.log("============= [JS] INITIALIZE SOLICITACOES CHAMADO =============");
        return fetchDataAndRender().then(data => {
            console.log("============= [JS] INITIALIZE SOLICITACOES - DADOS CARREGADOS COM SUCESSO =============");
            return data;
        }).catch(err => {
            console.error("============= [JS] INITIALIZE SOLICITACOES - ERRO AO CARREGAR DADOS =============", err.message);
            throw err;
        });
    }
    window.initializeSolicitacoes = initializeSolicitacoes;

})();