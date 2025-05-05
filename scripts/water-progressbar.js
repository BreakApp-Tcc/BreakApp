document.addEventListener("DOMContentLoaded", () => {
    const waterPercentage = document.querySelector(".waterProgressbar div");
    const input = document.querySelector(".progressbarInput input");

    window.changeWaterProgress = () => {
        waterPercentage.style.width = input.value + "%";
    };
});
