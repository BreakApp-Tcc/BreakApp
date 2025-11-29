const modal = document.getElementById("modal-config");
const openModal = document.getElementById("open-Modal-config");
const closeModal = document.getElementById("close-Modal-config");

if (openModal && modal) {
  openModal.addEventListener('click', () => {
    modal.style.display = "flex";
  });
}

if (closeModal && modal) {
  closeModal.addEventListener('click', () => {
    modal.style.display = "none";
  });
}

if (modal) {
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}