const modal = document.getElementById("modal-config");
const openModal = document.getElementById("open-config");
const closeModal = document.getElementById("close-Modal-config");

openModal.onclick = () => modal.style.display = "flex";
closeModal.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};