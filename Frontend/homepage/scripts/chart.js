const ctx = document.getElementById('doughnut');

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Proteína', 'Fibra', 'Carboidrato'],
      datasets: [{
        label: 'Você consumiu',
        data: [10, 10, 10],
        backgroundColor: [
          '#EF6C00',
          '#D81B60',
          '#7E57C2'
        ],
        borderWidth: 0,
      }]
    },

    options:{
      responsive: true,
      cutout: '70%',
      maintainAspectRatio: false,
      layout:{
        padding:{
          left: 20,
        }
      },
        plugins:{
          legend:{
            position: 'right',
            labels:{
              boxWidth: 30,
              padding: 20,
              margin: 20,
              font:{
                size: 20,
              }
            }
        }
      }
    },
  });

function updateCenterInfo(kcal, proteina, carbo, gordura) {
    document.getElementById("center-kcal").textContent = `${kcal} kcal`;
    document.getElementById("center-macros").textContent =
        `P: ${proteina}g | C: ${carbo}g | G: ${gordura}g`;
}
