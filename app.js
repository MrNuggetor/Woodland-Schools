document.documentElement.classList.add("js");
const qs = (sel, scope = document) => scope.querySelector(sel);
const qsa = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

function initNav() {
  const toggle = qs(".nav-toggle");
  const mobile = qs("#mobile-nav");
  if (!toggle || !mobile) return;
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    mobile.hidden = expanded;
  });
}

function initScrollAnimations() {
  const items = qsa(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  items.forEach((item) => observer.observe(item));
}

function initTimetable() {
  const form = qs("[data-timetable-form]");
  const output = qs("[data-timetable-output]");
  const reminders = qs("[data-reminder-output]");
  if (!form || !output || !reminders) return;

  const STORAGE_KEY = "whhs_timetable";
  const slotsPerDay = 5;

  const buildSlots = (subjects, activities) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const slots = [];
    let subjIndex = 0;

    for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
      const day = days[dayIndex];
      const activity = activities[dayIndex % activities.length] || "Revision";
      for (let period = 1; period <= slotsPerDay; period += 1) {
        const subject = subjects[subjIndex % subjects.length] || "Study";
        slots.push({ day, period, subject, activity });
        subjIndex += 1;
      }
    }
    return slots;
  };

  const render = (data) => {
    const { studentClass, subjects, activities } = data;
    const slots = buildSlots(subjects, activities);

    const byDay = slots.reduce((acc, slot) => {
      acc[slot.day] = acc[slot.day] || [];
      acc[slot.day].push(slot);
      return acc;
    }, {});

    output.innerHTML = `
      <p><strong>Class:</strong> ${studentClass}</p>
      <div class="timetable-grid">
        ${Object.entries(byDay).map(([day, items]) => `
          <div class="timetable-slot">
            <h4>${day}</h4>
            <p><strong>Activity:</strong> ${items[0]?.activity || "Revision"}</p>
            ${items.map(item => `
              <p><strong>Period ${item.period}:</strong> ${item.subject}</p>
            `).join("")}
          </div>
        `).join("")}
      </div>
    `;

    const reminderItems = subjects.slice(0, 5).map(subj => `
      <div class="reminder-item">Review ${subj} for 30 minutes after school.</div>
    `).join("") || "<div class=\"reminder-item\">Create a study plan for each subject.</div>";

    reminders.innerHTML = `<div class="reminder-list">${reminderItems}</div>`;
  };

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data && data.studentClass && data.subjects && data.activities) {
        form.studentClass.value = data.studentClass;
        form.subjects.value = data.subjects.join(", ");
        form.activities.value = data.activities.join(", ");
        render(data);
      }
    } catch (err) {
      // ignore
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const studentClass = data.get("studentClass");
    const subjects = String(data.get("subjects") || "").split(",").map(s => s.trim()).filter(Boolean);
    const activities = String(data.get("activities") || "").split(",").map(s => s.trim()).filter(Boolean);

    const payload = { studentClass, subjects, activities };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    render(payload);
  });
}


function initDashboard() {
  const weatherMain = document.querySelector('[data-weather-main]');
  const weatherSub = document.querySelector('[data-weather-sub]');
  const quoteText = document.querySelector('[data-daily-quote]');
  const quoteAuthor = document.querySelector('[data-quote-author]');

  if (quoteText && quoteAuthor) {
    const quotes = [
      { text: "Hard work is all.", author: "Woodland Hills Schools" },
      { text: "Success is the sum of small efforts, repeated daily.", author: "Anonymous" },
      { text: "Education is the passport to the future.", author: "Malcolm X" },
      { text: "Do the right thing even when no one is watching.", author: "Anonymous" }
    ];
    const pick = quotes[new Date().getDate() % quotes.length];
    quoteText.textContent = `"${pick.text}"`;
    quoteAuthor.textContent = pick.author;
  }

  if (weatherMain && weatherSub) {
    const lat = 6.62;
    const lon = 3.28;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Africa%2FLagos`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const temp = data.current?.temperature_2m;
        const wind = data.current?.wind_speed_10m;
        weatherMain.textContent = temp !== undefined ? `${temp}°C` : "Weather unavailable";
        weatherSub.textContent = wind !== undefined ? `Wind: ${wind} km/h` : "";
      })
      .catch(() => {
        weatherMain.textContent = "Weather unavailable";
        weatherSub.textContent = "Check your connection.";
      });
  }
}

// Extend init
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initScrollAnimations();
  initTimetable();
  initDashboard();
});
