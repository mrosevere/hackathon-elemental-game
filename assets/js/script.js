const modal = document.getElementById("rulesModal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");

const tabs = document.querySelectorAll(".tab");
const sections = document.querySelectorAll(".content-section");
const content = document.getElementById("content");

// OPEN MODAL
let lastFocusedElement = null;

function openModal() {
  lastFocusedElement = document.activeElement;
  modal.classList.add("active");
  // Focus first tab button
  setTimeout(() => {
    const firstTab = modal.querySelector(".tab");
    if (firstTab) firstTab.focus();
  }, 0);
}

function closeModal() {
  modal.classList.remove("active");
  if (lastFocusedElement) lastFocusedElement.focus();
}

openBtn.addEventListener("click", openModal);

closeBtn.addEventListener("click", closeModal);

// CLOSE ON OVERLAY CLICK
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// KEYBOARD NAVIGATION
document.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("active")) return;

  // ESC to close modal
  if (e.key === "Escape") {
    closeModal();
    e.preventDefault();
  }

  // Arrow keys to navigate tabs
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    const activeTab = modal.querySelector(".tab.active");
    const allTabs = Array.from(modal.querySelectorAll(".tab"));
    const currentIndex = allTabs.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % allTabs.length;
    allTabs[nextIndex].focus();
    e.preventDefault();
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
    elementButtons.forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-expanded", "false");
    });
    elementItems.forEach(item => item.classList.remove("active"));

    btn.classList.add("active");
    btn.setAttribute("aria-expanded", "true");
    const elementId = btn.dataset.element;
    document.getElementById(elementId).classList.add("active");
  });
});

(() => {
	const relationships = {
		lightning: { beats: ["water", "air"], losesTo: ["earth", "fire"] },
		fire: { beats: ["air", "earth"], losesTo: ["water", "lightning"] },
		air: { beats: ["earth", "water"], losesTo: ["fire", "lightning"] },
		earth: { beats: ["lightning", "water"], losesTo: ["air", "fire"] },
		water: { beats: ["fire", "lightning"], losesTo: ["air", "earth"] },
	};

	const displayNames = {
		lightning: "Lightning",
		fire: "Fire",
		air: "Air",
		earth: "Earth",
		water: "Water",
	};

	function formatList(keys) {
		return keys.map((k) => displayNames[k] ?? k).join(", ");
	}

	function clearRelations(navEl, icons, tooltipEl) {
		navEl.classList.remove("is-active");
		for (const icon of icons) {
			icon.classList.remove("relation-self", "relation-beats", "relation-loses");
			if (icon.dataset.originalTitle) {
				icon.setAttribute("title", icon.dataset.originalTitle);
				delete icon.dataset.originalTitle;
			}
		}
		tooltipEl.hidden = true;
		tooltipEl.textContent = "";
	}

	document.addEventListener("DOMContentLoaded", () => {
		const navEl = document.querySelector(".element-icons");
		const tooltipEl = document.getElementById("element-tooltip");
		const icons = Array.from(document.querySelectorAll(".element-icon"));

		if (!navEl || !tooltipEl || icons.length === 0) return;

		const iconByKey = new Map();
		for (const icon of icons) {
			const key = icon.dataset.element;
			if (key) iconByKey.set(key, icon);
		}

		function activate(key) {
			const rel = relationships[key];
			if (!rel) return;

			navEl.classList.add("is-active");
			for (const icon of icons) {
				icon.classList.remove("relation-self", "relation-beats", "relation-loses");
				// Avoid double-tooltips by temporarily clearing the native title.
				if (!icon.dataset.originalTitle) {
					icon.dataset.originalTitle = icon.getAttribute("title") ?? "";
				}
				icon.setAttribute("title", "");
			}

			const selfIcon = iconByKey.get(key);
			if (selfIcon) selfIcon.classList.add("relation-self");

			for (const beatKey of rel.beats) {
				const beatIcon = iconByKey.get(beatKey);
				if (beatIcon) beatIcon.classList.add("relation-beats");
			}

			for (const loseKey of rel.losesTo) {
				const loseIcon = iconByKey.get(loseKey);
				if (loseIcon) loseIcon.classList.add("relation-loses");
			}

			tooltipEl.textContent =
				`${displayNames[key] ?? key}\n` +
				`Beats: ${formatList(rel.beats)}\n` +
				`Loses to: ${formatList(rel.losesTo)}`;
			tooltipEl.hidden = false;
		}

		for (const icon of icons) {
			const key = icon.dataset.element;
			if (!key) continue;

			icon.addEventListener("mouseenter", () => activate(key));
			icon.addEventListener("focus", () => activate(key));
			icon.addEventListener("mouseleave", () => clearRelations(navEl, icons, tooltipEl));
			icon.addEventListener("blur", () => clearRelations(navEl, icons, tooltipEl));
		}

		// If the user moves the mouse off the diagram entirely, clear state.
		navEl.addEventListener("mouseleave", () => clearRelations(navEl, icons, tooltipEl));
	});
})();
