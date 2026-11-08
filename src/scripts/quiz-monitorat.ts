const quiz = document.querySelector<HTMLElement>(".quiz")!;
const form = document.querySelector<HTMLFormElement>("#quiz-form")!;
const questions = Array.from(form.querySelectorAll<HTMLFieldSetElement>(".q"));
const valider = form.querySelector<HTMLButtonElement>(".btn-valider")!;
const refaire = form.querySelector<HTMLButtonElement>(".btn-refaire")!;
const score = quiz.querySelector<HTMLOutputElement>(".score")!;
const stockage = quiz.querySelector<HTMLElement>(".stockage")!;
const total = questions.length;
const seuil = Math.ceil(total * 0.7);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (valider.hidden) return;

  let note = 0;
  let sansReponse = 0;
  for (const question of questions) {
    const options = question.querySelectorAll<HTMLInputElement>("input");
    if (!question.querySelector("input:checked")) sansReponse++;
    for (const option of options) {
      const juste = option.value === question.dataset.reponse;
      const label = option.closest("label")!;
      label.classList.toggle("juste", juste);
      label.classList.toggle("faux", option.checked && !juste);
      option.disabled = true;
      if (option.checked && juste) note++;
    }
    question.querySelector<HTMLElement>(".explication")!.hidden = false;
  }

  const bilan = note >= seuil
    ? `${note} / ${total} — Repère pédagogique atteint.`
    : `${note} / ${total} — Repère pédagogique : ${seuil} bonnes réponses.`;
  score.value = bilan + (sansReponse ? ` (${sansReponse} sans réponse)` : "");
  score.classList.toggle("reussi", note >= seuil);
  score.hidden = false;
  valider.hidden = true;
  refaire.hidden = false;

  try {
    const cle = "cdsbf77-formation";
    const suivi = JSON.parse(localStorage.getItem(cle) ?? "{}");
    suivi[quiz.dataset.lecon!] = { note, total, date: new Date().toISOString() };
    localStorage.setItem(cle, JSON.stringify(suivi));
    stockage.textContent = "Score enregistré dans ce navigateur.";
  } catch {
    stockage.textContent = "Le stockage local est indisponible. Le score reste affiché sur cette page.";
  }

  score.focus();
});

refaire.addEventListener("click", () => {
  form.reset();
  for (const question of questions) {
    question.querySelectorAll<HTMLInputElement>("input").forEach((option) => {
      option.disabled = false;
      option.closest("label")!.classList.remove("juste", "faux");
    });
    question.querySelector<HTMLElement>(".explication")!.hidden = true;
  }
  score.hidden = true;
  refaire.hidden = true;
  valider.hidden = false;
  form.querySelector<HTMLInputElement>("input")!.focus();
});
