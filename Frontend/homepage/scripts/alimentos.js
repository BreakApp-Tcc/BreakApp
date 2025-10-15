// Registro de alimentos
const selecionados = [];
let debounceTimeout;

// Sugestões
const searchInput = document.getElementById('searchbar');
const sugestoesLista = document.getElementById('sugestoes');

searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(sugerirAlimentos, 300);
});

async function sugerirAlimentos() {
    const busca = searchInput.value.trim();
    sugestoesLista.innerHTML = "";

    if (!busca) return;

    try {
        const response = await fetch(`/api/alimentos?q=${encodeURIComponent(busca)}`);
        const alimentos = await response.json();

        if (!Array.isArray(alimentos)) return;

        alimentos.forEach(alimento => {
            const li = document.createElement("li");
            li.textContent = alimento.descricao_do_alimento;
            li.onclick = () => {
                searchInput.value = alimento.descricao_do_alimento;
                sugestoesLista.innerHTML = "";
            };
            sugestoesLista.appendChild(li);
        });

        if (alimentos.length === 0) {
            sugestoesLista.innerHTML = "<li>Nenhum alimento encontrado.</li>";
        }
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener("click", function(event){
    if (!sugestoesLista.contains(event.target) && event.target !== searchInput) {
        sugestoesLista.innerHTML = "";
    }
});

// Adicionar alimento
document.getElementById('btn-adicionar-alimento').addEventListener('click', () => {
    const busca = searchInput.value.trim();
    const quantidade = parseFloat(document.getElementById('quantidade').value);
    if (!busca || isNaN(quantidade) || quantidade <= 0) return;

    fetch(`/api/alimentos?q=${encodeURIComponent(busca)}`)
        .then(res => res.json())
        .then(alimentos => {
            if (!alimentos.length) return;
            const alimento = alimentos[0];
            adicionarAlimento(alimento, quantidade);
            searchInput.value = '';
            document.getElementById('quantidade').value = '';
            sugestoesLista.innerHTML = '';
        });
});

function adicionarAlimento(alimento, quantidade) {
    const energiaTotal = (alimento.Energia_kcal * quantidade) / 100 || 0;
    const proteinasTotal = (alimento.Proteina_g * quantidade) / 100 || 0;
    const lipideosTotal = (alimento.Lipidios_totais_g * quantidade) / 100 || 0;
    const carboidratosTotal = (alimento.Carboi_drato_g * quantidade) / 100 || 0;

    selecionados.push({ energiaTotal, proteinasTotal, lipideosTotal, carboidratosTotal });
    atualizarChart();
}

// Doughnut Chart
// Doughnut Chart
const doughnutCtx = document.getElementById('doughnut');
let doughnutChart = null;

// Plugin para mostrar kcal no centro
const centerText = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea: { width, height } } = chart;
    ctx.save();
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let totalKcal = 0;
    selecionados.forEach(a => totalKcal += a.energiaTotal);

    ctx.fillText(`${Math.round(totalKcal)} kcal`, width / 2, height / 2);
    ctx.restore();
  }
};

function initDoughnut() {
  if (!doughnutCtx) return;

  const initialData = [0.01, 0.01, 0.01];

  doughnutChart = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Proteína', 'Lipídio', 'Carboidrato'],
      datasets: [{
        label: 'Você consumiu',
        data: initialData,
        backgroundColor: ['#EF6C00', '#D81B60', '#7E57C2'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      cutout: '70%',
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 30, padding: 20, font: { size: 20 } }
        }
      }
    },
    plugins: [centerText] 
  });
}

document.addEventListener('DOMContentLoaded', initDoughnut);

function atualizarChart() {
    let totalProt = 0, totalLip = 0, totalCarb = 0;
    selecionados.forEach(a => {
        totalProt += a.proteinasTotal;
        totalLip += a.lipideosTotal;
        totalCarb += a.carboidratosTotal;
    });

    doughnutChart.data.datasets[0].data = [totalProt, totalLip, totalCarb];
    doughnutChart.update();
}
