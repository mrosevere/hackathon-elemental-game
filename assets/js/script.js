const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");
const modal = document.getElementById("rulesModal");

const tabs = document.querySelectorAll(".tab");
const sections = document.querySelectorAll(".content-section");
const content = document.getElementById("content");

// OPEN MODAL
openBtn.addEventListener("click", () => {
  modal.classList.add("active");
  content.classList.add("active");
});

// CLOSE MODAL
closeBtn.addEventListener("click", () => {
  modal.classList.remove("active");
});

// CLOSE ON OVERLAY CLICK
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
  }
});

// ACCORDION LOGIC
function showTab(tabIndex) {
  tabs.forEach(t => t.classList.remove("active"));
  sections.forEach(s => s.classList.remove("active"));

  tabs[tabIndex].classList.add("active");
  const target = tabs[tabIndex].dataset.content;
  document.getElementById(target).classList.add("active");
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    showTab(index);
  });
});

// ELEMENTS SUB-SELECTOR
const elementButtons = document.querySelectorAll(".sub-header");
const elementItems = document.querySelectorAll(".element-item");

elementButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    elementButtons.forEach(b => b.classList.remove("active"));
    elementItems.forEach(item => item.classList.remove("active"));

    btn.classList.add("active");
    const elementId = btn.dataset.element;
    document.getElementById(elementId).classList.add("active");
  });
});

