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