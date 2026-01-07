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

const MODE_CONFIG = {
	continuous: {
		label: "Continuous",
		targetWins: null,
		description: "Continuous play: keep earning points every round.",
	},
	bo3: {
		label: "Best of 3",
		targetWins: 2,
		description: "Best of 3: first to 2 wins takes the series.",
	},
	bo5: {
		label: "Best of 5",
		targetWins: 3,
		description: "Best of 5: first to 3 wins takes the series.",
	},
	bo9: {
		label: "Best of 9",
		targetWins: 5,
		description: "Best of 9: first to 5 wins takes the series.",
	},
};

let gameMode = "continuous";
let targetWins = null;
let seriesActive = true;

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
let totalRounds = 0;
function updateScore(result) {
	if (!seriesActive && targetWins !== null) return;
	if (result === "win") {
		playerScore += 1;
		totalRounds += 1;
	} else if (result === "lose") {
		computerScore += 1;
		totalRounds += 1;
	}
	// Ties don't change either score
	const scoreEl = document.getElementById("scoreValue");
	if (scoreEl) scoreEl.textContent = playerScore;
	const computerScoreEl = document.getElementById("computerScoreValue");
	if (computerScoreEl) computerScoreEl.textContent = computerScore;
	const roundEl = document.getElementById("roundValue");
	if (roundEl) roundEl.textContent = totalRounds;
}

function resetScore() {
	playerScore = 0;
	computerScore = 0;
	totalRounds = 0;
	seriesActive = true;
	const scoreEl = document.getElementById("scoreValue");
	if (scoreEl) scoreEl.textContent = playerScore;
	const computerScoreEl = document.getElementById("computerScoreValue");
	if (computerScoreEl) computerScoreEl.textContent = computerScore;
	const roundEl = document.getElementById("roundValue");
	if (roundEl) roundEl.textContent = totalRounds;
}

/* =========================================================
   ARENA INITIALIZATION WITH LOCAL OVERLAY
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
	const arena = document.getElementById("game-arena");
	const overlay = document.getElementById("arenaOverlay");
	const playBtn = document.getElementById("playButton");
	const statusEl = document.getElementById("arenaStatus");
	const playerPickEl = document.getElementById("playerPick");
	const cpuPickEl = document.getElementById("cpuPick");
	const playerPickIcon = document.getElementById("playerPickIcon");
	const cpuPickIcon = document.getElementById("cpuPickIcon");
	const playerPickText = document.getElementById("playerPickText");
	const cpuPickText = document.getElementById("cpuPickText");
	const playerSymbolEl = document.getElementById("playerSymbol");
	const cpuSymbolEl = document.getElementById("cpuSymbol");
	const playerSymbolIcon = document.getElementById("playerSymbolIcon");
	const cpuSymbolIcon = document.getElementById("cpuSymbolIcon");
	const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));
	const modeHintEl = document.getElementById("modeHint");

	if (!arena) return;

	const choices = Array.from(arena.querySelectorAll(".arena-choice"));
	const name = (k) => ELEMENT_DISPLAY_NAMES[k] || k;

	function clearPickDisplay() {
		if (playerPickEl) {
			playerPickEl.removeAttribute("data-choice");
			playerPickEl.classList.remove("result-win", "result-lose", "result-tie");
		}
		if (cpuPickEl) {
			cpuPickEl.removeAttribute("data-choice");
			cpuPickEl.classList.remove("result-win", "result-lose", "result-tie");
		}
		if (playerSymbolEl) {
			playerSymbolEl.removeAttribute("data-choice");
			playerSymbolEl.classList.remove("result-win", "result-lose", "result-tie");
		}
		if (cpuSymbolEl) {
			cpuSymbolEl.removeAttribute("data-choice");
			cpuSymbolEl.classList.remove("result-win", "result-lose", "result-tie");
		}
		if (playerPickText) playerPickText.textContent = "—";
		if (cpuPickText) cpuPickText.textContent = "—";
		if (playerPickIcon) {
			playerPickIcon.hidden = true;
			playerPickIcon.setAttribute("src", "");
			playerPickIcon.setAttribute("alt", "");
		}
		if (cpuPickIcon) {
			cpuPickIcon.hidden = true;
			cpuPickIcon.setAttribute("src", "");
			cpuPickIcon.setAttribute("alt", "");
		}
		if (playerSymbolIcon) {
			playerSymbolIcon.hidden = true;
			playerSymbolIcon.setAttribute("src", "");
			playerSymbolIcon.setAttribute("alt", "");
		}
		if (cpuSymbolIcon) {
			cpuSymbolIcon.hidden = true;
			cpuSymbolIcon.setAttribute("src", "");
			cpuSymbolIcon.setAttribute("alt", "");
		}
	}

	function updatePickDisplay(side, choiceKey) {
		const pickEl = side === "player" ? playerPickEl : cpuPickEl;
		const iconEl = side === "player" ? playerPickIcon : cpuPickIcon;
		const textEl = side === "player" ? playerPickText : cpuPickText;

		if (pickEl) pickEl.dataset.choice = choiceKey;
		if (textEl) textEl.textContent = name(choiceKey);

		if (iconEl) {
			iconEl.hidden = false;
			iconEl.src = `assets/images/${choiceKey}.png`;
			iconEl.alt = name(choiceKey);
		}
	}

	function updateSymbolDisplay(side, choiceKey) {
		const symbolEl = side === "player" ? playerSymbolEl : cpuSymbolEl;
		const iconEl = side === "player" ? playerSymbolIcon : cpuSymbolIcon;
		if (symbolEl) symbolEl.dataset.choice = choiceKey;
		if (iconEl) {
			iconEl.hidden = false;
			iconEl.src = `assets/images/${choiceKey}.png`;
			iconEl.alt = name(choiceKey);
		}
	}

	function setArenaEnabled(enabled) {
		choices.forEach((btn) => (btn.disabled = !enabled));
		if (overlay) overlay.classList.toggle("hidden", !!enabled);
		arena.classList.toggle("is-active", !!enabled);
		if (statusEl) statusEl.textContent = enabled
			? "Arena ready. Choose your element."
			: "Press Play to start the battle.";
		if (!enabled) clearPickDisplay();
	}

	function setModeStatusMessage(config) {
		if (!statusEl) return;
		statusEl.textContent = config.targetWins
			? `${config.label}: first to ${config.targetWins} wins. Press Play to start.`
			: "Continuous play: press Play to start.";
	}

	function updateModeUI(activeMode) {
		modeButtons.forEach((btn) => {
			const isActive = btn.dataset.mode === activeMode;
			btn.classList.toggle("is-active", isActive);
			btn.setAttribute("aria-pressed", isActive ? "true" : "false");
		});
		const config = MODE_CONFIG[activeMode] ?? MODE_CONFIG.continuous;
		if (modeHintEl) modeHintEl.textContent = config.description;
	}

	function setMode(nextMode, options = {}) {
		const preserveActive = options.preserveActive ?? true;
		const config = MODE_CONFIG[nextMode] ?? MODE_CONFIG.continuous;
		gameMode = nextMode;
		targetWins = config.targetWins;
		resetScore();
		seriesActive = true;
		updateModeUI(gameMode);
		const wasActive = arena.classList.contains("is-active");
		if (!preserveActive || !wasActive) {
			setArenaEnabled(false);
		} else {
			setArenaEnabled(true);
		}
		setModeStatusMessage(config);
	}

	function checkSeriesWinner() {
		if (targetWins === null) return null;
		if (playerScore >= targetWins) return "player";
		if (computerScore >= targetWins) return "computer";
		return null;
	}

	function concludeSeries(winner) {
		seriesActive = false;
		choices.forEach((btn) => (btn.disabled = true));
		const label = MODE_CONFIG[gameMode]?.label || "Series";
		if (statusEl) {
			statusEl.textContent = winner === "player"
				? `You win the ${label}! Press Reset or pick another mode to play again.`
				: `Computer wins the ${label}. Press Reset or pick another mode to play again.`;
		}
	}

	// Initially disabled until Play is clicked.
	setArenaEnabled(false);
	updateModeUI(gameMode);
	setModeStatusMessage(MODE_CONFIG[gameMode]);

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

	modeButtons.forEach((btn) => {
		btn.addEventListener("click", () => {
			// When switching modes, clear any existing choice/result visuals
			// and reset the series, requiring Play to be clicked again.
			clearChoiceEffects();
			setMode(btn.dataset.mode, { preserveActive: false });
		});
	});

	setMode(gameMode, { preserveActive: false });

	// Element choice interactions using existing game logic.
	function clearChoiceEffects() {
		for (const choiceBtn of choices) {
			choiceBtn.classList.remove(
				"is-player",
				"is-opponent",
				"result-win",
				"result-lose",
				"result-tie"
			);
		}
		if (playerPickEl) playerPickEl.classList.remove("result-win", "result-lose", "result-tie");
		if (cpuPickEl) cpuPickEl.classList.remove("result-win", "result-lose", "result-tie");
		if (playerSymbolEl) playerSymbolEl.classList.remove("result-win", "result-lose", "result-tie");
		if (cpuSymbolEl) cpuSymbolEl.classList.remove("result-win", "result-lose", "result-tie");
	}

	function restartResultAnimation(el, className) {
		if (!el) return;
		el.classList.remove("result-win", "result-lose", "result-tie");
		// Force reflow so the animation reliably re-triggers.
		void el.offsetWidth;
		el.classList.add(className);
	}

	function findChoiceButton(choiceKey) {
		return choices.find((b) => b.dataset.choice === choiceKey) ?? null;
	}

	choices.forEach((btn) => {
		btn.addEventListener("click", () => {
			if (!seriesActive && targetWins !== null) {
				if (statusEl) statusEl.textContent = "Series finished. Press Reset or pick another mode to play again.";
				return;
			}

			const player = btn.dataset.choice;
			const opponent = getComputerChoice();
			const outcome = determineWinner(player, opponent);

			clearChoiceEffects();
			const opponentBtn = findChoiceButton(opponent);

			btn.classList.add("is-player");
			if (opponentBtn) opponentBtn.classList.add("is-opponent");
			updatePickDisplay("player", player);
			updatePickDisplay("cpu", opponent);
			updateSymbolDisplay("player", player);
			updateSymbolDisplay("cpu", opponent);

			if (outcome === "tie") {
				restartResultAnimation(btn, "result-tie");
				restartResultAnimation(opponentBtn, "result-tie");
				restartResultAnimation(playerPickEl, "result-tie");
				restartResultAnimation(cpuPickEl, "result-tie");
				restartResultAnimation(playerSymbolEl, "result-tie");
				restartResultAnimation(cpuSymbolEl, "result-tie");
			} else if (outcome === "win") {
				restartResultAnimation(btn, "result-win");
				restartResultAnimation(opponentBtn, "result-lose");
				restartResultAnimation(playerPickEl, "result-win");
				restartResultAnimation(cpuPickEl, "result-lose");
				restartResultAnimation(playerSymbolEl, "result-win");
				restartResultAnimation(cpuSymbolEl, "result-lose");
			} else {
				restartResultAnimation(btn, "result-lose");
				restartResultAnimation(opponentBtn, "result-win");
				restartResultAnimation(playerPickEl, "result-lose");
				restartResultAnimation(cpuPickEl, "result-win");
				restartResultAnimation(playerSymbolEl, "result-lose");
				restartResultAnimation(cpuSymbolEl, "result-win");
			}

			updateScore(outcome);
			const summary = `You chose ${name(player)}. Computer chose ${name(opponent)}. Result: ${outcome.toUpperCase()}.`;
			const seriesWinner = checkSeriesWinner();
			if (seriesWinner) {
				if (statusEl) {
					const label = MODE_CONFIG[gameMode]?.label || "series";
					const winnerText = seriesWinner === "player" ? "You win" : "Computer wins";
					statusEl.textContent = `${summary} ${winnerText} the ${label}.`;
				}
				concludeSeries(seriesWinner);
				return;
			}

			if (statusEl) {
				const seriesNote = targetWins !== null ? ` Series score: ${playerScore}-${computerScore}.` : "";
				statusEl.textContent = `${summary}${seriesNote}`;
			}
		});
	});

	// Reset button functionality
	const resetBtn = document.getElementById("resetButton");
	if (resetBtn) {
		resetBtn.addEventListener("click", () => {
			// Reset scores
			resetScore();
			
			// Clear choice effects
			clearChoiceEffects();
			
			// Clear pick displays
			clearPickDisplay();
			
			// Reset arena state to require a new Play press
			setArenaEnabled(false);
			setModeStatusMessage(MODE_CONFIG[gameMode]);
		});
	}
});
