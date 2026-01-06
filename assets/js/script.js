const toggle = document.getElementById("themeToggle");

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
}

toggle.addEventListener("click", toggleTheme);

// Keyboard accessibility
toggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        toggleTheme();
    }
});
