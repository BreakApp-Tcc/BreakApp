document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("overlay");
  const modal = document.querySelector(".modal");
  const openModalBtn = document.getElementById("openModal");
  const closeBtn = document.getElementById("closeBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const confirmBtn = document.getElementById("confirmBtn");

  function getFocusableElements() {
    if (!modal) {
      console.error("⚠️ Modal não encontrado no DOM.");
      return [];
    }
    return modal.querySelectorAll(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
  }

  function openModal() {
    if (!overlay || !modal) return console.error("Modal não encontrado.");
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");

    const focusable = getFocusableElements();
    if (focusable.length > 0) focusable[0].focus();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  if (openModalBtn) openModalBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      console.log("Usuário confirmou!");
      closeModal();
    });
  }
});
