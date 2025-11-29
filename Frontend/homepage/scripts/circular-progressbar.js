const value = document.querySelector(".value");
const circle = document.querySelector(".progressCircle");
const input = document.querySelector("input");

function changeCircleProgress() {
  let number = parseInt(input.value);

  if (isNaN(number) || number < 0) number = 0;
  if (number > 100) number = 100;

  value.textContent = number + "%";

  let angle = (360 * number) / 100;
  circle.style.background = `conic-gradient(#9bca9f ${angle}deg, #e5e7eb ${angle}deg)`;
}
let metaCalorias = 0; 
let consumoAtual = 0;

function atualizarMetaESituacao() {
    if (metaCalorias === 0) return;

    const porcentagem = Math.min(Math.round((consumoAtual / metaCalorias) * 100), 100);
    document.querySelector(".progressPercentage .value").textContent = `${porcentagem}%`;

    if (!document.querySelector(".goal-meta")) {
        const metaEl = document.createElement("div");
        metaEl.classList.add("goal-meta");
        document.querySelector(".progresscircle-container").appendChild(metaEl);
    }
    document.querySelector(".goal-meta").textContent = `Meta: ${metaCalorias} kcal`;
}
