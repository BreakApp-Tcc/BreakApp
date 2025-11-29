
(() => {

  const canvas = document.getElementById('doughnut');
  const centerKcalEl = document.getElementById('center-kcal');
  const centerMacrosEl = document.getElementById('center-macros');
  const percentValueEl = document.getElementById('percent-value');
  const progressCircle = document.querySelector('.progressCircle');

  let totalCalorias = 0;
  let totalProteinas = 0;
  let totalCarboidratos = 0;
  let totalGorduras = 0;

 let metaCalorias = 2000;

  const ctx = canvas.getContext('2d');
  let doughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Proteína', 'Carboidrato', 'Gordura'],
      datasets: [{
        label: 'Você consumiu',
        data: [0, 0, 0],
        backgroundColor: ['#EF6C00', '#7E57C2', '#D81B60'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 14,
            padding: 12,
            font: { size: 14 }
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed} g`
          }
        }
      }
    }
  });

 function updateCenterInfo(kcal, proteina, carbo, gordura) {
    totalCalorias = Number(kcal) || 0;
    totalProteinas = Number(proteina) || 0;
    totalCarboidratos = Number(carbo) || 0;
    totalGorduras = Number(gordura) || 0;

    centerKcalEl.textContent = `${Math.round(totalCalorias)} kcal`;
    centerMacrosEl.textContent =
      `P: ${totalProteinas.toFixed(1)}g | C: ${totalCarboidratos.toFixed(1)}g | G: ${totalGorduras.toFixed(1)}g`;

     doughnutChart.data.datasets[0].data = [
      totalProteinas,
      totalCarboidratos,
      totalGorduras
    ];
    doughnutChart.update();

    atualizarProgressCircle();
  }

 function atualizarProgressCircle() {
    const perc =
      metaCalorias > 0
        ? Math.min((totalCalorias / metaCalorias) * 100, 100)
        : 0;

    const graus = perc * 3.6; 

    if (progressCircle) {
      progressCircle.style.background =
        `conic-gradient(#4caf50 ${graus}deg, #ddd ${graus}deg)`;
    }

    if (percentValueEl)
      percentValueEl.textContent = `${Math.round(perc)}%`;
  }

  async function carregarTotaisDoDia(usuarioId) {
    if (!usuarioId) {
      console.warn('usuarioId não fornecido a carregarTotaisDoDia');
      return;
    }

    try {
      const resp = await fetch(
        `/api/alimentos/totais-dia?usuarioId=${encodeURIComponent(usuarioId)}`
      );
      if (!resp.ok) throw new Error('Erro ao buscar totais-do-dia');
      const json = await resp.json();

      const kcal = json.totalKcal ?? json.totalKcalConsumed ?? 0;
      const prote = json.totalProteina ?? json.totalProtein ?? 0;
      const carbo = json.totalCarbo ?? json.totalCarbohydrate ?? 0;
      const gord = json.totalGordura ?? json.totalFat ?? 0;

      updateCenterInfo(kcal, prote, carbo, gord);
    } catch (err) {
      console.error('Erro ao carregarTotaisDoDia:', err);
    }
  }

 window.__BreakApp = {
    updateCenterInfo,
    carregarTotaisDoDia,
    setMetaCalorias: (m) => {
      metaCalorias = Number(m) || metaCalorias;
      atualizarProgressCircle();
    }
  };

   (function autoInit() {
    try {
      const usuarioId = localStorage.getItem('usuarioId');
      if (usuarioId) {
        carregarTotaisDoDia(usuarioId);
      } else {
        updateCenterInfo(0, 0, 0, 0);
      }
    } catch (e) {
      console.warn('autoInit error', e);
      updateCenterInfo(0, 0, 0, 0);
    }
  })();

})();
