for (const bouton of document.querySelectorAll<HTMLButtonElement>("#print, #imprimer, #print-page")) {
  bouton.addEventListener("click", () => window.print());
  bouton.hidden = false;
}

for (const bouton of document.querySelectorAll<HTMLButtonElement>("#toggle-fiches, #toggle-profiles")) {
  const liste = document.getElementById(bouton.getAttribute("aria-controls")!);
  const fiches = Array.from(liste?.querySelectorAll("details") ?? []);
  if (!fiches.length) continue;

  const synchroniser = () => {
    const ouvertes = fiches.every((fiche) => fiche.open);
    bouton.setAttribute("aria-expanded", String(ouvertes));
    bouton.textContent = ouvertes ? "Fermer toutes les fiches" : "Ouvrir toutes les fiches";
  };

  bouton.addEventListener("click", () => {
    const ouvrir = fiches.some((fiche) => !fiche.open);
    fiches.forEach((fiche) => { fiche.open = ouvrir; });
    synchroniser();
  });
  fiches.forEach((fiche) => fiche.addEventListener("toggle", synchroniser));
  synchroniser();
  bouton.hidden = false;
  if (bouton.parentElement?.classList.contains("tools")) bouton.parentElement.hidden = false;
}
