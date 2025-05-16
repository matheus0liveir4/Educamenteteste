// js/utils.js

const utils = {
  // --- Sua função original ---
  formatDate: function(dateString) {
    if (!dateString) {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      // Verifica se a data é válida ANTES de usar getTime
      if (isNaN(date)) {
           console.warn("Data inválida recebida:", dateString);
           return 'Data Inválida';
      }
      const formatter = new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        timeZone: 'UTC' // Importante se as datas no banco são UTC
      });
      return formatter.format(date);
    } catch (e) {
      console.error("Erro ao formatar data:", dateString, e);
      return 'Erro Data';
    }
  },

  // --- Funções ADICIONADAS para o Dashboard ---
  formatTimeDisplay: function(timeString) {
       if (!timeString || typeof timeString !== 'string') return 'N/A';
       // Pega apenas HH:MM, ignorando segundos ou outras partes
       const match = timeString.match(/^(\d{2}:\d{2})/);
       return match ? match[1] : 'N/A';
   },

  getCurrentFormattedDate: function() {
    try {
        const now = new Date();
        // Usa um formato longo que geralmente inclui o ano
        const formatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
        let formatted = formatter.format(now);
        // Capitaliza a primeira letra (ex: 'segunda-feira' -> 'Segunda-feira')
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch(e) {
        console.error("Erro ao formatar data atual:", e);
        return new Date().toLocaleDateString('pt-BR'); // Fallback simples
    }
  },

  getWeekDays: function(referenceDate) {
    const weekDays = [];
    // Garante que temos uma data válida como referência
    const refDate = (referenceDate instanceof Date && !isNaN(referenceDate)) ? referenceDate : new Date();
    // Ajusta para iniciar a semana na Segunda-feira (índice 1)
    const currentDayIndex = refDate.getDay(); // 0 (Dom) a 6 (Sáb)
    const firstDayOfWeek = new Date(refDate);
    // Se hoje é Domingo (0), volta 6 dias. Se não, volta 'currentDayIndex - 1' dias.
    firstDayOfWeek.setDate(refDate.getDate() - (currentDayIndex === 0 ? 6 : currentDayIndex - 1));
    firstDayOfWeek.setHours(0, 0, 0, 0); // Zera a hora para consistência

    // Nomes abreviados em Português
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(firstDayOfWeek);
        dayDate.setDate(firstDayOfWeek.getDate() + i);
        weekDays.push({
            weekDayIndex: dayDate.getDay(), // Armazena o índice real do dia (0-6)
            shortName: dayNames[dayDate.getDay()], // Pega nome correto pelo índice
            date: dayDate
        });
    }
    return weekDays;
  },

  // --- FUNÇÃO getDisplayWeek CORRIGIDA PARA MOSTRAR O ANO ---
  getDisplayWeek: function(weekDays) {
    if (!Array.isArray(weekDays) || weekDays.length < 2) { // Precisa de pelo menos 2 dias
        console.warn("getDisplayWeek recebeu weekDays inválido:", weekDays);
        return 'Semana Inválida';
    }
    try {
        const startDate = weekDays[0].date;
        const endDate = weekDays[weekDays.length - 1].date; // Usa o último dia do array
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();

        // Formata dia e mês curto
        const startFormatted = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const endFormatted = endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

        // Constrói a string final com o(s) ano(s)
        if (startYear === endYear) {
            return `${startFormatted} - ${endFormatted}, ${startYear}`; // Ex: 15/jul - 21/jul, 2024
        } else {
            // Mostra o ano em ambas as datas se a semana cruzar a virada do ano
            const startFull = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric'});
            const endFull = endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric'});
            return `${startFull} - ${endFull}`; // Ex: 29/dez/2024 - 04/jan/2025 (Exemplo, formato pode variar)
        }
    } catch (e) {
        console.error("Erro em getDisplayWeek:", e);
        return "Erro Semana";
    }
  },
  // --- FIM DA CORREÇÃO ---

   getAppointmentForTimeSlot: function(appointments, timeSlot, selectedDay) {
       if (!Array.isArray(appointments) || !timeSlot || !selectedDay || !(selectedDay.date instanceof Date)) return null;
       try {
           const selectedDateStr = selectedDay.date.toISOString().split('T')[0];
           const targetTime = timeSlot.substring(0, 5); // Assume formato HH:MM
           return appointments.find(app => {
               if (!app.date || !app.time) return false;
               // Trata a data do agendamento como UTC para comparar com ISOString
               const appDate = new Date(app.date + 'T00:00:00Z'); // Adiciona Z para tratar como UTC
               if (isNaN(appDate.getTime())) return false;
               const appDateStr = appDate.toISOString().split('T')[0];
               const appTime = app.time.substring(0, 5);
               return appDateStr === selectedDateStr && appTime === targetTime;
           });
       } catch (e) {
           console.error("Erro em getAppointmentForTimeSlot:", e);
           return null;
       }
   }

}; // Fim do objeto utils

console.log("utils.js loaded successfully (with getDisplayWeek updated).");
