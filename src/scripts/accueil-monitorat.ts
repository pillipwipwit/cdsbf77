const lessons = Array.from(document.querySelectorAll<HTMLElement>("[data-lesson]"));
const groups = document.querySelectorAll<HTMLElement>("[data-group]");
const buttons = document.querySelectorAll<HTMLButtonElement>("[data-uc]");
const search = document.querySelector<HTMLInputElement>("#search")!;
const review = document.querySelector<HTMLInputElement>("#review")!;
const empty = document.querySelector<HTMLElement>("#empty")!;
const results = document.querySelector<HTMLElement>("#results")!;
const passed = new Set<string>();
let active = "all";

type Scores = Record<string, { note: number; total: number }>;

function updateProgress() {
  let scores: Scores = {};
  try {
    scores = JSON.parse(localStorage.getItem("cdsbf77-formation") ?? "{}") ?? {};
  } catch {
    document.querySelector("#storage-note")!.textContent =
      "Impossible de lire les résultats enregistrés dans ce navigateur.";
  }

  passed.clear();
  for (const lesson of lessons) {
    const id = lesson.dataset.lesson!;
    const score = scores[id];
    const badge = lesson.querySelector<HTMLElement>("[data-score]")!;
    const valid = Number.isInteger(score?.note) && Number.isInteger(score?.total)
      && score.total > 0 && score.note >= 0 && score.note <= score.total;
    const success = valid && score.note >= Math.ceil(score.total * 0.7);
    if (success) passed.add(id);
    badge.hidden = !valid;
    badge.classList.toggle("passed", success);
    badge.textContent = valid ? `${score.note} / ${score.total}` : "";
  }

  const progress = document.querySelector<HTMLProgressElement>("#progress")!;
  progress.max = lessons.length;
  progress.value = passed.size;
  document.querySelector("#progress-value")!.textContent = `${passed.size} / ${lessons.length}`;
  document.querySelector("#progress-text")!.textContent = passed.size
    ? "Quiz avec au moins 70 % de bonnes réponses"
    : "Aucun quiz enregistré avec au moins 70 % de bonnes réponses.";
}

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

const searchableText = new Map(lessons.map((lesson) => [
  lesson,
  normalize(lesson.querySelector("a > span")!.textContent ?? ""),
]));

function filter() {
  const words = normalize(search.value).trim().split(/\s+/);
  let count = 0;

  for (const group of groups) {
    const matchesUnit = active === "all" || group.dataset.group === active
      || group.dataset.group === "revision";
    let visible = 0;
    for (const lesson of group.querySelectorAll<HTMLElement>("[data-lesson]")) {
      lesson.hidden = !matchesUnit || (review.checked && passed.has(lesson.dataset.lesson!))
        || !words.every((word) => searchableText.get(lesson)!.includes(word));
      if (!lesson.hidden) visible++;
    }
    group.hidden = visible === 0;
    count += visible;
  }

  for (const button of buttons) {
    button.setAttribute("aria-pressed", String(button.dataset.uc === active));
  }
  results.textContent = `${count} leçon${count === 1 ? "" : "s"} sur ${lessons.length}`;
  empty.hidden = count > 0;
}

for (const button of buttons) {
  button.addEventListener("click", () => {
    active = button.dataset.uc!;
    filter();
  });
}

document.querySelector("#reset")!.addEventListener("click", () => {
  active = "all";
  search.value = "";
  review.checked = false;
  filter();
  search.focus();
});

document.querySelectorAll<HTMLAnchorElement>(".overview a").forEach((link) => {
  link.addEventListener("click", () => {
    active = link.hash.slice(1);
    search.value = "";
    review.checked = false;
    filter();
  });
});

search.addEventListener("input", filter);
review.addEventListener("change", filter);
window.addEventListener("pageshow", () => {
  updateProgress();
  filter();
});

updateProgress();
filter();
document.querySelector<HTMLElement>(".toolbar")!.hidden = false;
