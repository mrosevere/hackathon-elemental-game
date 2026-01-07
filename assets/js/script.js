/* =========================================================
   THEME TOGGLE
========================================================= */
const toggle = document.getElementById("themeToggle");

function toggleTheme() {
	const isLight = document.body.classList.toggle("light-mode");
	if (toggle) toggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
}

if (toggle) {
	toggle.addEventListener("click", toggleTheme);
	toggle.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === " ") toggleTheme();
	});
}

/* =========================================================
   MODAL
========================================================= */
const modal = document.getElementById("rulesModal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");

const resultModal = document.getElementById("resultModal");
const closeResultBtn = document.getElementById("closeResultModal");
const resultMessage = document.getElementById("resultMessage");
const resultSubtext = document.getElementById("resultSubtext");

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

if (openBtn) openBtn.addEventListener("click", openModal);
if (closeBtn) closeBtn.addEventListener("click", closeModal);
if (modal) {
	modal.addEventListener("click", (e) => {
		if (e.target === modal) closeModal();
	});
}

function openResultModal(playerWon, modeName) {
    if (!resultModal || !resultMessage || !resultSubtext) return;
    
    const modalContent = resultModal.querySelector('.result-modal-content');
    if (modalContent) {
        modalContent.classList.remove('player-won', 'player-lost');
        modalContent.classList.add(playerWon ? 'player-won' : 'player-lost');
    }
    
    resultMessage.textContent = playerWon ? "You Won!" : "Try Again";
    resultSubtext.textContent = playerWon 
        ? `Congratulations! You won the ${modeName}!`
        : `The computer won the ${modeName}. Better luck next time!`;
    
    resultModal.classList.add("open");
    
    setTimeout(() => {
        if (closeResultBtn) closeResultBtn.focus();
    }, 100);
}

function closeResultModal() {
	if (resultModal) resultModal.classList.remove("open");

	// If an auto-reset was requested (series end or badge unlock), perform it now
	if (pendingAutoReset) {
		try {
			performAutoReset();
		} catch (e) {
			console.error('Auto-reset after modal close failed', e);
		}
		pendingAutoReset = false;
	}
}

if (closeResultBtn) {
    closeResultBtn.addEventListener("click", closeResultModal);
}

if (resultModal) {
    resultModal.addEventListener("click", (e) => {
        if (e.target === resultModal) closeResultModal();
    });
}

// Accordion close button inside rules modal
const accordionCloseBtn = document.getElementById('accordionClose');
if (accordionCloseBtn) {
	accordionCloseBtn.addEventListener('click', () => {
		closeModal();
	});
	accordionCloseBtn.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			closeModal();
		}
	});
}

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

/* =========================================================
   ACHIEVEMENT TRACKING
========================================================= */
const ACHIEVEMENTS = {
	'first-win': false,
	'bo3': false,
	'bo5': false,
	'bo9': false
};

// When true, closing the result modal will also trigger an automatic reset.
let pendingAutoReset = false;

// Perform a safe UI + game-state reset from anywhere.
function performAutoReset() {
	try {
		// Reset core scores/state
		resetScore();

		// Clear choice effects (best-effort without relying on inner-scope helpers)
		const choices = Array.from(document.querySelectorAll('.arena-choice'));
		for (const choiceBtn of choices) {
			choiceBtn.classList.remove(
				'is-player',
				'is-opponent',
				'result-win',
				'result-lose',
				'result-tie'
			);
			choiceBtn.disabled = true; // show overlay state until Play pressed
		}

		// Clear pick/symbol displays
		const playerPickEl = document.getElementById('playerPick');
		const cpuPickEl = document.getElementById('cpuPick');
		const playerPickIcon = document.getElementById('playerPickIcon');
		const cpuPickIcon = document.getElementById('cpuPickIcon');
		const playerPickText = document.getElementById('playerPickText');
		const cpuPickText = document.getElementById('cpuPickText');
		const playerSymbolIcon = document.getElementById('playerSymbolIcon');
		const cpuSymbolIcon = document.getElementById('cpuSymbolIcon');

		if (playerPickEl) {
			playerPickEl.removeAttribute('data-choice');
			playerPickEl.classList.remove('result-win', 'result-lose', 'result-tie');
		}
		if (cpuPickEl) {
			cpuPickEl.removeAttribute('data-choice');
			cpuPickEl.classList.remove('result-win', 'result-lose', 'result-tie');
		}
		if (playerPickText) playerPickText.textContent = '—';
		if (cpuPickText) cpuPickText.textContent = '—';
		if (playerPickIcon) { playerPickIcon.hidden = true; playerPickIcon.src = ''; playerPickIcon.alt = ''; }
		if (cpuPickIcon) { cpuPickIcon.hidden = true; cpuPickIcon.src = ''; cpuPickIcon.alt = ''; }
		if (playerSymbolIcon) { playerSymbolIcon.hidden = true; playerSymbolIcon.src = ''; playerSymbolIcon.alt = ''; }
		if (cpuSymbolIcon) { cpuSymbolIcon.hidden = true; cpuSymbolIcon.src = ''; cpuSymbolIcon.alt = ''; }

		// Re-enable overlay / show Play overlay
		const overlay = document.getElementById('arenaOverlay');
		const arena = document.getElementById('game-arena');
		if (overlay) overlay.classList.remove('hidden');
		if (arena) arena.classList.remove('is-active');

		// Update arena status to reflect current mode
		const statusEl = document.getElementById('arenaStatus');
		const config = MODE_CONFIG[gameMode] ?? MODE_CONFIG.continuous;
		if (statusEl) statusEl.textContent = config.targetWins
			? `${config.label}: first to ${config.targetWins} wins. Press Play to start.`
			: 'Continuous play: press Play to start.';

		// Clear any pending flag
		pendingAutoReset = false;
	} catch (e) {
		console.error('performAutoReset error', e);
	}
}

// Schedule an auto-reset: if a result modal is open, wait for it to be closed
// otherwise perform a reset after a short delay so the player sees the unlock briefly.
function scheduleAutoReset() {
	// If the result modal is already open, perform reset on close
	if (resultModal && resultModal.classList.contains('open')) {
		pendingAutoReset = true;
		return;
	}

	// If this achievement also finishes the active series, defer reset until modal close
	if (targetWins !== null && playerScore >= (targetWins || 1)) {
		pendingAutoReset = true;
		return;
	}

	// Otherwise give a short pause then reset so the player sees the unlock briefly
	setTimeout(() => {
		performAutoReset();
	}, 700);
}

function loadAchievements() {
	// Load achievements from sessionStorage so they persist for the tab
	// but are cleared when the browser/tab is closed.
	const saved = sessionStorage.getItem('stormbound-achievements');
	if (saved) {
		try {
			const parsed = JSON.parse(saved);
			Object.assign(ACHIEVEMENTS, parsed);
		} catch (e) {
			console.error('Failed to load achievements from sessionStorage:', e);
		}
	}
	updateAchievementBadges();
}

function saveAchievements() {
	// Persist achievements for the current browser tab/session only
	sessionStorage.setItem('stormbound-achievements', JSON.stringify(ACHIEVEMENTS));
}

function unlockAchievement(achievementKey) {
	if (ACHIEVEMENTS[achievementKey]) return; // Already unlocked
	ACHIEVEMENTS[achievementKey] = true;
	saveAchievements();
	updateAchievementBadges();

	// When a badge is met, schedule an automatic reset for single-win badges (not series badges)
	if (achievementKey === 'first-win') {
		scheduleAutoReset();
	}
}

function updateAchievementBadges() {
	const badges = document.querySelectorAll('.achievement-badge');
	badges.forEach(badge => {
		const achievement = badge.dataset.achievement;
		if (ACHIEVEMENTS[achievement]) {
			badge.classList.add('unlocked');
		} else {
			badge.classList.remove('unlocked');
		}
	});
}

// Load achievements on page load
document.addEventListener('DOMContentLoaded', loadAchievements);

// Badge progress utility (global scope so other functions can call it anytime)
function updateBadgeProgress(mode) {
	const progressContainer = document.getElementById('badgeProgress');
	const progressLabel = document.getElementById('progressLabel');
	const progressBar = document.getElementById('progressBar');
	const progressFill = document.getElementById('progressFill');
	if (!progressContainer || !progressBar || !progressFill || !progressLabel) return;
	const config = MODE_CONFIG[mode] ?? MODE_CONFIG.continuous;
	let key = null;
	let target = config.targetWins;
	let numMarkers = 0;
	let displayValue = 0;
	let labelText = '';

	if (mode === 'continuous') {
		key = 'continuous';
		// Continuous mode: progress reaches 100% after 10 player wins
		const targetGames = 10;
		numMarkers = 0; // no encouraging markers for continuous by default
		displayValue = Math.min(100, Math.round((playerScore / targetGames) * 100));
		labelText = `Continuous: ${playerScore}/${targetGames} games (${displayValue}%)`;
	} else {
		if (mode === 'bo3') key = 'bo3';
		else if (mode === 'bo5') key = 'bo5';
		else if (mode === 'bo9') key = 'bo9';
		else key = 'first-win';
		// For series modes, scale progress to target wins
		target = config.targetWins || 1;
		displayValue = Math.min(100, Math.round((playerScore / target) * 100));
		labelText = `Progress to ${MODE_CONFIG[mode]?.label || mode}: ${playerScore}/${target} (${displayValue}%)`;
		// number of markers equals target wins (e.g., bo3=2, bo5=3)
		numMarkers = target;
	}
	progressLabel.textContent = labelText;
	progressBar.setAttribute('aria-valuenow', String(displayValue));
	progressFill.style.width = displayValue + '%';
	progressContainer.style.display = 'block';
	progressContainer.setAttribute('aria-hidden', 'false');

	// Build dynamic markers based on the mode's target wins (bo3:2, bo5:3, bo9:5)
	try {
		const markersContainer = document.querySelector('.progress-markers');
		if (markersContainer) {
			// clear existing markers
			markersContainer.innerHTML = '';
			// Encouraging labels per mode
			let labels = ["Keep Going","Great Job","Half Way!","Almost There","Hurray"];
			if (mode === 'bo3') labels = ["Keep Going","Hurray"];
			else if (mode === 'bo5') labels = ["Keep Going","Almost There","Hurray"];
			else if (mode === 'bo9') labels = ["Keep Going","Great Job","Half Way!","Almost There","Hurray"];
			// Use computed numMarkers (0 for continuous)
			for (let i = 1; i <= numMarkers; i++) {
				const pos = Math.round((i / (numMarkers + 1)) * 100);
				const marker = document.createElement('div');
				marker.className = 'marker';
				marker.style.left = pos + '%';
				const span = document.createElement('span');
				span.textContent = labels[(i - 1) % labels.length] || '';
				marker.appendChild(span);
				markersContainer.appendChild(marker);
			}

			// Reveal/hide marker labels depending on progress
			const markers = markersContainer.querySelectorAll('.marker');
			markers.forEach((m) => {
				const left = (m.style.left || '').trim();
				if (!left || !left.endsWith('%')) return;
				const percent = parseFloat(left.replace('%', '')) || 0;
				if (displayValue >= percent - 1) m.classList.add('visible');
				else m.classList.remove('visible');
			});

			// Update caption below the progress bar to reflect latest revealed label
			try {
				const captionEl = document.getElementById('progressCaption');
				let captionText = '';
				if (key === 'first-win') {
					captionText = playerScore > 0 ? 'First Victory Unlocked!' : 'Win a match to earn your first badge.';
				} else {
					const visibleLabels = markersContainer.querySelectorAll('.marker.visible span');
					if (visibleLabels.length > 0) {
						captionText = visibleLabels[visibleLabels.length - 1].textContent || '';
					} else {
						captionText = labelText;
					}
				}
				if (captionEl) captionEl.textContent = captionText;
			} catch (e) {
				console.error('progress caption update error', e);
			}
		}
	} catch (e) {
		console.error('progress markers update error', e);
	}
}

function updateScore(result) {
	if (!seriesActive && targetWins !== null) return;

	// All match outcomes (win, lose, tie) increment the round counter
	totalRounds += 1;

	// Update player/computer scores based on match result
	if (result === "win") {
		playerScore += 1;
		// Unlock first win achievement
		unlockAchievement('first-win');
	} else if (result === "lose") {
		computerScore += 1;
	}
	// Note: tie results don't change scores, but round was already counted above
	const scoreEl = document.getElementById("scoreValue");
	if (scoreEl) scoreEl.textContent = playerScore;
	const computerScoreEl = document.getElementById("computerScoreValue");
	if (computerScoreEl) computerScoreEl.textContent = computerScore;
	// Update round counter display
	const roundEl = document.getElementById("roundValue");
	if (roundEl) roundEl.textContent = totalRounds;

	// Update progress bar to reflect current progress toward the active mode's badge
	updateBadgeProgress(gameMode);
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

	// Reset progress display when scores reset (guard in case function not yet defined)
	if (typeof updateBadgeProgress === 'function') {
		try { updateBadgeProgress(gameMode); } catch (e) { console.error('updateBadgeProgress error', e); }
	}
}

/* =========================================================
   ARENA INITIALIZATION WITH LOCAL OVERLAY
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
	console.debug('Arena initialization running');
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

	function setIconWithFallback(iconEl, preferredSrc, fallbackSrc, altText) {
		if (!iconEl) return;
		iconEl.hidden = false;
		iconEl.alt = altText;
		iconEl.onerror = null;
		iconEl.onerror = () => {
			iconEl.onerror = null;
			iconEl.src = fallbackSrc;
		};
		iconEl.src = preferredSrc;
	}

	function getElementIconSrc(choiceKey, { isWinVariant }) {
		return isWinVariant
			? `assets/images/${choiceKey}win.png`
			: `assets/images/${choiceKey}.png`;
	}

	function updatePickDisplay(side, choiceKey, { isWinner } = { isWinner: false }) {
		const pickEl = side === "player" ? playerPickEl : cpuPickEl;
		const iconEl = side === "player" ? playerPickIcon : cpuPickIcon;
		const textEl = side === "player" ? playerPickText : cpuPickText;

		if (pickEl) pickEl.dataset.choice = choiceKey;
		if (textEl) textEl.textContent = name(choiceKey);

		const fallbackSrc = getElementIconSrc(choiceKey, { isWinVariant: false });
		const preferredSrc = getElementIconSrc(choiceKey, { isWinVariant: !!isWinner });
		setIconWithFallback(iconEl, preferredSrc, fallbackSrc, name(choiceKey));
	}

	function updateSymbolDisplay(side, choiceKey, { isWinner } = { isWinner: false }) {
		const symbolEl = side === "player" ? playerSymbolEl : cpuSymbolEl;
		const iconEl = side === "player" ? playerSymbolIcon : cpuSymbolIcon;
		if (symbolEl) symbolEl.dataset.choice = choiceKey;
		const fallbackSrc = getElementIconSrc(choiceKey, { isWinVariant: false });
		const preferredSrc = getElementIconSrc(choiceKey, { isWinVariant: !!isWinner });
		setIconWithFallback(iconEl, preferredSrc, fallbackSrc, name(choiceKey));
	}

	function setArenaEnabled(enabled) {
		choices.forEach((btn) => (btn.disabled = !enabled));
		if (overlay) overlay.classList.toggle("hidden", !!enabled);
		arena.classList.toggle("is-active", !!enabled);
		if (statusEl) statusEl.textContent = enabled
			? "Arena ready. Choose your element."
			: "Select a game mode to begin.";
		if (!enabled) clearPickDisplay();
	}

	function setModeStatusMessage(config) {
		if (!statusEl) return;
		statusEl.textContent = config.targetWins
			? `${config.label}: first to ${config.targetWins} wins. Press Play to start.`
			: "Continuous play: press Play to start.";
	}

	function updateModeUI(activeMode) {
		console.debug('updateModeUI activeMode=', activeMode);
		modeButtons.forEach((btn) => {
			const isActive = btn.dataset.mode === activeMode;
			btn.classList.toggle("is-active", isActive);
			btn.setAttribute("aria-pressed", isActive ? "true" : "false");
		});
		const config = MODE_CONFIG[activeMode] ?? MODE_CONFIG.continuous;
		if (modeHintEl) modeHintEl.textContent = config.description;
	}

	function setMode(nextMode, options = {}) {
		console.debug('setMode called with', nextMode);
		const config = MODE_CONFIG[nextMode] ?? MODE_CONFIG.continuous;
		gameMode = nextMode;
		targetWins = config.targetWins;
		resetScore();
		seriesActive = true;
		try {
			updateModeUI(gameMode);
			setModeStatusMessage(config);

			// Update badge progress UI for the selected mode
			if (typeof updateBadgeProgress === 'function') {
				try { updateBadgeProgress(gameMode); } catch (e) { console.error('updateBadgeProgress error', e); }
			}
		} catch (e) {
			console.error('Error in setMode:', e);
		}
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
		
		// Unlock achievement if player won
		if (winner === "player") {
			if (gameMode === "bo3") unlockAchievement('bo3');
			else if (gameMode === "bo5") unlockAchievement('bo5');
			else if (gameMode === "bo9") unlockAchievement('bo9');
		}
		
		// Request auto-reset once the user dismisses the result modal
		pendingAutoReset = true;

		// Show result modal with a slight delay for better UX
		setTimeout(() => {
			openResultModal(winner === "player", label);
		}, 800);
	}

	// Initially disabled - show play overlay
	setArenaEnabled(false);
	updateModeUI(gameMode);
	setModeStatusMessage(MODE_CONFIG[gameMode]);

	function focusFirstChoice() {
		const firstChoice = arena.querySelector(".arena-choice");
		if (firstChoice) firstChoice.focus();
	}


	// Initialize progress display on load (function defined in global scope)
	updateBadgeProgress(gameMode);

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
			// and reset the series, arena stays active
			clearChoiceEffects();
			setMode(btn.dataset.mode);
		});

		// Support keyboard activation (Enter / Space)
		btn.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				clearChoiceEffects();
				setMode(btn.dataset.mode);
			}
		});
	});

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
			const playerWon = outcome === "win";
			const cpuWon = outcome === "lose";

			clearChoiceEffects();
			const opponentBtn = findChoiceButton(opponent);

			btn.classList.add("is-player");
			if (opponentBtn) opponentBtn.classList.add("is-opponent");
			updatePickDisplay("player", player, { isWinner: playerWon });
			updatePickDisplay("cpu", opponent, { isWinner: cpuWon });
			updateSymbolDisplay("player", player, { isWinner: playerWon });
			updateSymbolDisplay("cpu", opponent, { isWinner: cpuWon });

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
			
			// Show play overlay again
			setArenaEnabled(false);
			setModeStatusMessage(MODE_CONFIG[gameMode]);
		});
	}
});
