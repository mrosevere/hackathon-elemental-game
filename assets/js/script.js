/* =========================================================
   THEME TOGGLE
========================================================= */
const toggle = document.getElementById("themeToggle");

function toggleTheme() {
    document.body.classList.toggle("light-mode");
}

toggle.addEventListener("click", toggleTheme);
toggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") toggleTheme();
});

/* =========================================================
   MODAL
========================================================= */
const modal = document.getElementById("rulesModal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");

let lastFocusedElement = null;

function openModal() {
    lastFocusedElement = document.activeElement;
    modal.classList.add("open");

    setTimeout(() => {
        const firstTab = modal.querySelector(".tab");
        if (firstTab) firstTab.focus();
    }, 0);
}

function closeModal() {
    modal.classList.remove("open");
    if (lastFocusedElement) lastFocusedElement.focus();
}

openBtn.addEventListener("click", openModal);
closeBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

/* =========================================================
   KEYBOARD NAVIGATION
========================================================= */
document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("open")) return;

    if (e.key === "Escape") {
        closeModal();
        e.preventDefault();
    }

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        const tabs = Array.from(modal.querySelectorAll(".tab"));
        const activeTab = modal.querySelector(".tab.active");
        const index = tabs.indexOf(activeTab);
        const next = (index + 1) % tabs.length;
        tabs[next].focus();
        e.preventDefault();
    }
});

/* =========================================================
   ACCORDION / TAB LOGIC
========================================================= */
const tabs = document.querySelectorAll(".tab");
const sections = document.querySelectorAll(".content-section");

function showTab(i) {
    tabs.forEach(t => t.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));

    tabs[i].classList.add("active");
    const target = tabs[i].dataset.content;
    document.getElementById(target).classList.add("active");
}

tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => showTab(i));
});

/* =========================================================
   ELEMENT SUB-SELECTOR
========================================================= */
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

        const id = btn.dataset.element;
        document.getElementById(id).classList.add("active");
    });
});

/* =========================================================
   ELEMENT RELATIONSHIPS DIAGRAM + TOOLTIP POSITIONING
========================================================= */
(() => {
    const relationships = {
        lightning: { beats: ["water", "air"], losesTo: ["earth", "fire"] },
        fire:      { beats: ["air", "earth"], losesTo: ["water", "lightning"] },
        air:       { beats: ["earth", "water"], losesTo: ["fire", "lightning"] },
        earth:     { beats: ["lightning", "water"], losesTo: ["air", "fire"] },
        water:     { beats: ["fire", "lightning"], losesTo: ["air", "earth"] },
    };

    const displayNames = {
        lightning: "Lightning",
        fire: "Fire",
        air: "Air",
        earth: "Earth",
        water: "Water",
    };

    function formatList(arr) {
        return arr.map(k => displayNames[k]).join(", ");
    }

    function clear(nav, icons, tooltip) {
        nav.classList.remove("is-active");
        icons.forEach(icon => {
            icon.classList.remove("relation-self", "relation-beats", "relation-loses");
            if (icon.dataset.originalTitle) {
                icon.title = icon.dataset.originalTitle;
                delete icon.dataset.originalTitle;
            }
        });
        tooltip.hidden = true;
        tooltip.textContent = "";
    }

    document.addEventListener("DOMContentLoaded", () => {
        const nav = document.querySelector(".element-icons");
        const tooltip = document.getElementById("element-tooltip");
        const icons = Array.from(document.querySelectorAll(".element-icon"));

        const map = new Map();
        icons.forEach(icon => map.set(icon.dataset.element, icon));

        function activate(key) {
            const rel = relationships[key];
            nav.classList.add("is-active");

            icons.forEach(icon => {
                icon.classList.remove("relation-self", "relation-beats", "relation-loses");
                if (!icon.dataset.originalTitle) {
                    icon.dataset.originalTitle = icon.title || "";
                }
                icon.title = "";
            });

            map.get(key).classList.add("relation-self");
            rel.beats.forEach(k => map.get(k).classList.add("relation-beats"));
            rel.losesTo.forEach(k => map.get(k).classList.add("relation-loses"));

            tooltip.textContent =
                `${displayNames[key]}\nBeats: ${formatList(rel.beats)}\nLoses to: ${formatList(rel.losesTo)}`;
            tooltip.hidden = false;

            // Position tooltip ABOVE the hovered icon
            const rect = map.get(key).getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 10}px`;
        }

        icons.forEach(icon => {
            const key = icon.dataset.element;
            icon.addEventListener("mouseenter", () => activate(key));
            icon.addEventListener("focus", () => activate(key));
            icon.addEventListener("mouseleave", () => clear(nav, icons, tooltip));
            icon.addEventListener("blur", () => clear(nav, icons, tooltip));
        });

        nav.addEventListener("mouseleave", () => clear(nav, icons, tooltip));
    });
})();
