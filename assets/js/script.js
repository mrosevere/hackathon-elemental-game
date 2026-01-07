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

// ACCORDION LOGIC
const tabs = Array.from(document.querySelectorAll(".accordion .tab"));
const sections = Array.from(document.querySelectorAll(".accordion .content-section"));

function showTab(tabIndex) {
	tabs.forEach((t) => t.classList.remove("active"));
	sections.forEach((s) => s.classList.remove("active"));

	const tab = tabs[tabIndex];
	if (!tab) return;
	tab.classList.add("active");
	const target = tab.dataset.content;
	const section = target ? document.getElementById(target) : null;
	if (section) section.classList.add("active");
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

const ELEMENT_RELATIONSHIPS = {
	lightning: { beats: ["water", "air"], losesTo: ["earth", "fire"] },
	fire: { beats: ["air", "earth"], losesTo: ["water", "lightning"] },
	air: { beats: ["earth", "water"], losesTo: ["fire", "lightning"] },
	earth: { beats: ["lightning", "water"], losesTo: ["air", "fire"] },
	water: { beats: ["fire", "lightning"], losesTo: ["air", "earth"] },
};

const ELEMENT_DISPLAY_NAMES = {
	lightning: "Lightning",
	fire: "Fire",
	air: "Air",
	earth: "Earth",
	water: "Water",
};

function normalizeElementChoice(choice) {
	if (typeof choice !== "string") return "";
	return choice.trim().toLowerCase();
}

// Random selector for the Computer's turn
function getComputerChoice() {
    const choices = ['Fire', 'Earth', 'Water', 'Air', 'Lightning'];
    
    // Generate a random index between 0 and 4
    const randomIndex = Math.floor(Math.random() * choices.length);

	// Get the randomly selected choice
    const selectedChoice = choices[randomIndex];
    
    // Normalize and return the choice
    return normalizeElementChoice(selectedChoice);
}

function determineWinner(playerChoice, opponentChoice) {
	const player = normalizeElementChoice(playerChoice);
	const opponent = normalizeElementChoice(opponentChoice);

	if (!(player in ELEMENT_RELATIONSHIPS)) {
		throw new TypeError(
			`Invalid playerChoice: ${String(playerChoice)}. Valid choices: ${Object.keys(ELEMENT_RELATIONSHIPS).join(", ")}`
		);
	}
	if (!(opponent in ELEMENT_RELATIONSHIPS)) {
		throw new TypeError(
			`Invalid opponentChoice: ${String(opponentChoice)}. Valid choices: ${Object.keys(ELEMENT_RELATIONSHIPS).join(", ")}`
		);
	}

	if (player === opponent) return "tie";
	if (ELEMENT_RELATIONSHIPS[player].beats.includes(opponent)) return "win";
	return "lose";
}

// Optional: make the function callable from HTML inline handlers / other scripts.
window.determineWinner = determineWinner;

(() => {
	const relationships = ELEMENT_RELATIONSHIPS;
	const displayNames = ELEMENT_DISPLAY_NAMES;

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

			if (selfIcon) {
				const rect = selfIcon.getBoundingClientRect();
				const top = rect.bottom + 8; // position just under the icon
				const left = rect.left + rect.width / 2;
				tooltipEl.style.left = `${left}px`;
				tooltipEl.style.top = `${top}px`;
			}

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

/* =========================================================
   SCORE TRACKING
========================================================= */
let playerScore = 0;
let computerScore = 0;

function updateScore(result) {
	if (result === "win") {
		playerScore += 1;
	} else if (result === "lose") {
		computerScore += 1;
	}
	// Ties don't change either score
	const scoreEl = document.getElementById("scoreValue");
	if (scoreEl) scoreEl.textContent = playerScore;
	const computerScoreEl = document.getElementById("computerScoreValue");
	if (computerScoreEl) computerScoreEl.textContent = computerScore;
}

/* =========================================================
   ARENA INITIALIZATION WITH LOCAL OVERLAY
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
	const arena = document.getElementById("game-arena");
	const overlay = document.getElementById("arenaOverlay");
	const playBtn = document.getElementById("playButton");
	const statusEl = document.getElementById("arenaStatus");

	if (!arena) return;

	const choices = Array.from(arena.querySelectorAll(".arena-choice"));

	function setArenaEnabled(enabled) {
		choices.forEach((btn) => (btn.disabled = !enabled));
		if (overlay) overlay.classList.toggle("hidden", !!enabled);
		arena.classList.toggle("is-active", !!enabled);
		if (statusEl) statusEl.textContent = enabled
			? "Arena ready. Choose your element."
			: "Press Play to start the battle.";
	}

	// Initially disabled until Play is clicked.
	setArenaEnabled(false);

	function focusFirstChoice() {
		const firstChoice = arena.querySelector(".arena-choice");
		if (firstChoice) firstChoice.focus();
	}

	if (playBtn) {
		playBtn.addEventListener("click", () => {
			setArenaEnabled(true);
			focusFirstChoice();
		});
		playBtn.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				setArenaEnabled(true);
				focusFirstChoice();
			}
		});
	}

	// Element choice interactions using existing game logic.
	choices.forEach((btn) => {
		btn.addEventListener("click", () => {
			const player = btn.dataset.choice;
			const opponent = getComputerChoice().toLowerCase();
			const outcome = determineWinner(player, opponent);
			const name = (k) => ELEMENT_DISPLAY_NAMES[k] || k;
			if (statusEl) statusEl.textContent = `You chose ${name(player)}. Computer chose ${name(opponent)}. Result: ${outcome.toUpperCase()}.`;
			updateScore(outcome);
		});
	});
});
