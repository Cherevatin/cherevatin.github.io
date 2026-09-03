const toggle = document.getElementById("themeToggle");

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const sunIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const moonIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  toggle.innerHTML = theme === "dark" ? sunIcon : moonIcon;
  
  const avatar = document.querySelector(".profile-photo");
  if (avatar) {
    avatar.src = theme === "dark" ? "./assets/avatar-dark.png" : "./assets/avatar-light.png";
  }
}

// Avatar preview functionality
document.addEventListener("DOMContentLoaded", () => {
  const avatar = document.querySelector(".profile-photo");
  if (!avatar) return;
  
  // Create preview container
  const preview = document.createElement("div");
  preview.className = "avatar-preview";
  preview.innerHTML = `<img src="${avatar.src}" alt="Profile Preview" /><div class="preview-close">×</div>`;
  document.body.appendChild(preview);
  
  // Show preview on click
  avatar.addEventListener("click", (e) => {
    e.preventDefault();
    preview.classList.add("show");
  });
  
  // Hide preview on close button click
  const closeBtn = preview.querySelector(".preview-close");
  closeBtn.addEventListener("click", () => {
    preview.classList.remove("show");
  });
  
  // Hide preview when clicking outside
  document.addEventListener("click", (e) => {
    if (!avatar.contains(e.target) && !preview.contains(e.target)) {
      preview.classList.remove("show");
    }
  });
  
  // Position preview centered on screen
  avatar.addEventListener("click", (e) => {
    if (preview.classList.contains("show")) {
      preview.style.left = "50%";
      preview.style.top = "50%";
      preview.style.transform = "translate(-50%, -50%) scale(1)";
    }
  });
});

const savedTheme = localStorage.getItem("theme");
applyTheme(savedTheme || getSystemTheme());

toggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
});

function monthIndex(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return year * 12 + month - 1;
}

function formatDuration(totalMonths) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];

  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0 || years === 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);

  return parts.join(", ");
}

const now = new Date();
const currentMonth = now.getFullYear() * 12 + now.getMonth();

document.querySelectorAll(".project-duration").forEach((duration) => {
  const startMonth = monthIndex(duration.dataset.projectStart);
  const endMonth = duration.dataset.projectEnd ? monthIndex(duration.dataset.projectEnd) : currentMonth;

  if (startMonth === null || endMonth === null || endMonth < startMonth) return;

  const ongoing = duration.dataset.projectOngoing === "true" ? " (ongoing)" : "";
  duration.textContent = `${formatDuration(endMonth - startMonth)}${ongoing}`;
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1 },
);

document.querySelectorAll("section").forEach((sec) => {
  sec.classList.add("fade");
  observer.observe(sec);
});

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.getAttribute("data-value");
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      
      // Visual feedback
      btn.classList.add("copied");
      const originalInner = btn.innerHTML;
      
      // Optional: change icon temporarily to a checkmark
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML = originalInner;
      }, 2000);

    } catch (err) {
      console.error("Failed to copy:", err);
    }
  });
});
