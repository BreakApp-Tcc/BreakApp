document.addEventListener("DOMContentLoaded", () => {
    carregarDashboard();
});

async function carregarRefeicoesDoDia() {
    const res = await fetch("/api/alimentos/totais-dia");
    if (!res.ok) return [];

    return await res.json();
}


function calcularMacros(alimentos) {
    let totalProteina = 0;
    let totalCarbo = 0;
    let totalGordura = 0;
    let totalKcal = 0;

    alimentos.forEach(a => {
        totalProteina += Number(a.proteina || 0);
        totalCarbo += Number(a.carboidrato || 0);
        totalGordura += Number(a.lipidio || 0);
        totalKcal += Number(a.calorias || 0);
    });

    return {
        totalProteina,
        totalCarbo,
        totalGordura,
        totalKcal
    };
}

function obterMeta() {
    return Number(localStorage.getItem("meta_calorias") || 2000);
}

function salvarMeta(meta) {
    localStorage.setItem("meta_calorias", meta);
}

function atualizarOfensiva(meta, kcalDia) {
    let ofensiva = Number(localStorage.getItem("ofensiva") || 0);

    if (kcalDia <= meta) {
        ofensiva += 1;
    } else {
        ofensiva = 0;
    }

    localStorage.setItem("ofensiva", ofensiva);
    return ofensiva;
}


function atualizarCirculoMeta(meta, kcalDia) {
    const porcent = Math.min(100, Math.round((kcalDia / meta) * 100));
    document.querySelector(".progressPercentage .value").textContent = porcent + "%";

    const circle = document.querySelector(".progressCircle");
    circle.style.background = `conic-gradient(#4CAF50 ${porcent}%, #ddd ${porcent}%)`;
}

let doughnutChart = null;

function atualizarDoughnut({ totalProteina, totalCarbo, totalGordura, totalKcal }) {
    const ctx = document.getElementById("doughnut").getContext("2d");

    if (doughnutChart) doughnutChart.destroy();

    doughnutChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Proteína", "Carboidrato", "Gordura"],
            datasets: [{
                data: [totalProteina, totalCarbo, totalGordura]
            }]
        },
        options: {
            cutout: "70%",
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true }
            }
        }
    });

    const centerText = document.createElement("div");
    centerText.classList.add("calorias-centro");
    centerText.textContent = `${totalKcal} kcal`;

    const chartContainer = document.querySelector(".chart-container");
    chartContainer.innerHTML = "";
    chartContainer.appendChild(centerText);
    chartContainer.appendChild(document.getElementById("doughnut"));
}

function atualizarOfensivaUI(valor) {
    const dias = document.querySelectorAll(".sequence #day");

    dias.forEach((d, i) => {
        d.style.background = i < valor ? "#4CAF50" : "#ccc";
    });
}

function atualizarMetaUI(meta) {
    document.querySelector(".goal p").textContent = `${meta} kcal`;
}

async function carregarDashboard() {
    const meta = obterMeta();

    const macros = await carregarRefeicoesDoDia();

    atualizarCirculoMeta(meta, macros.totalKcal);
    atualizarDoughnut(macros);

    const ofensiva = atualizarOfensiva(meta, macros.totalKcal);
    atualizarOfensivaUI(ofensiva);

    atualizarMetaUI(meta);
}
