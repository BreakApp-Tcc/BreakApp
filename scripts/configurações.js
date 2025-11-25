const modal = document.getElementById("modal");
const openModal = document.getElementById("open-Modal");
const closeModal = document.getElementById("close-Modal");

openModal.onclick = () => modal.style.display = "flex";
closeModal.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};