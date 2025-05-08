// ==================== SERVICE WORKER REGISTRATION ====================
// Enregistrement et gestion des mises à jour du Service Worker
navigator.serviceWorker.register('/sw.js').then(reg => {
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          showUpdateAlert();
        } else {
          console.log('Service Worker installé pour la première fois');
        }
      }
    });
  });
  
  // Vérifier les mises à jour périodiquement
  setInterval(() => {
    reg.update().catch(err => console.log('Échec de la mise à jour du SW:', err));
  }, 3600000); // Vérifie toutes les heures
});

function showUpdateAlert() {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'update-alert alert alert-info';
  alertDiv.style.position = 'fixed';
  alertDiv.style.bottom = '20px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '1000';
  alertDiv.innerHTML = `
    <p>Une nouvelle version est disponible !</p>
    <button class="btn btn-sm btn-primary">Mettre à jour</button>
  `;
  
  document.body.appendChild(alertDiv);
  
  alertDiv.querySelector('button').addEventListener('click', () => {
    window.location.reload(true);
  });
}

// ==================== DONNÉES ET FONCTIONNALITÉS EXISTANTES ====================
// Exemple de données (remplacer par des données réelles de localStorage ou de backend)
const recettes = [
  { busMatricule: 'AK678AA', montant: 35000, date: '2025-04-16' },
  { busMatricule: 'AK679AA', montant: 35000, date: '2025-04-16' },
  { busMatricule: 'AK680AA', montant: 30000, date: '2025-04-16' },
];

const depenses = [
  { busMatricule: 'AK678AA', montant: 5000, date: '2025-04-16' },
  { busMatricule: 'AK679AA', montant: 8000, date: '2025-04-16' },
  { busMatricule: 'AK680AA', montant: 7000, date: '2025-04-16' },
];

const busData = [
  { matricule: 'AK678AA', latitude: '0.39', longitude: '9.45' },
  { matricule: 'AK679AA', latitude: '0.40', longitude: '9.46' },
  { matricule: 'AK680AA', latitude: '0.38', longitude: '9.47' },
];

// Gestion hors ligne
window.addEventListener('offline', () => {
  document.getElementById('offlineAlert').style.display = 'block';
  console.log('Mode hors ligne activé - Utilisation du cache');
});

window.addEventListener('online', () => {
  document.getElementById('offlineAlert').style.display = 'none';
  console.log('Connexion rétablie - Synchronisation des données');
  // Ici vous pourriez ajouter une logique de synchronisation
});

// Mettre à jour les meilleurs et pires bus
function updateTopBuses() {
  const busRentability = recettes.map((recette) => {
    const depenseBus = depenses.filter((depense) => depense.busMatricule === recette.busMatricule);
    const totalDepensesBus = depenseBus.reduce((acc, curr) => acc + curr.montant, 0);
    const rentabilite = (recette.montant - totalDepensesBus) / recette.montant * 100;

    return {
      matricule: recette.busMatricule,
      recettes: recette.montant,
      depenses: totalDepensesBus,
      rentabilite: rentabilite,
    };
  });

  const topBuses = busRentability.sort((a, b) => b.rentabilite - a.rentabilite).slice(0, 3);
  const worstBuses = busRentability.sort((a, b) => a.rentabilite - b.rentabilite).slice(0, 3);

  const topBusesHtml = topBuses.map(bus => `
    <tr>
      <td>${bus.matricule}</td>
      <td>${bus.recettes} XAF</td>
      <td>${bus.depenses} XAF</td>
      <td>${bus.rentabilite.toFixed(2)} %</td>
    </tr>
  `).join('');

  const worstBusesHtml = worstBuses.map(bus => `
    <tr>
      <td>${bus.matricule}</td>
      <td>${bus.recettes} XAF</td>
      <td>${bus.depenses} XAF</td>
      <td>${bus.rentabilite.toFixed(2)} %</td>
    </tr>
  `).join('');

  document.getElementById("topBuses").innerHTML = topBusesHtml;
  document.getElementById("worstBuses").innerHTML = worstBusesHtml;
}

// Mettre à jour les suggestions IA
function updateIASuggestions() {
  const suggestions = [];

  if (recettes.reduce((acc, r) => acc + r.montant, 0) < depenses.reduce((acc, d) => acc + d.montant, 0)) {
    suggestions.push("Les dépenses dépassent les recettes. Il est recommandé de réduire les coûts fixes.");
  }

  if (recettes.reduce((acc, r) => acc + r.montant, 0) > depenses.reduce((acc, d) => acc + d.montant, 0)) {
    suggestions.push("Votre entreprise est rentable. Vous pouvez envisager d'investir dans l'amélioration des services.");
  }

  if (recettes.reduce((acc, r) => acc + r.montant, 0) === depenses.reduce((acc, d) => acc + d.montant, 0)) {
    suggestions.push("L'entreprise est à l'équilibre. Recherchez des opportunités pour augmenter les recettes.");
  }

  document.getElementById("iaSuggestions").innerHTML = suggestions.map(sug => `<li>${sug}</li>`).join('');
}

// Charger la carte des bus actifs
function loadBusMap() {
  const map = L.map('busMap').setView([0.39, 9.45], 10); // Centré sur le Gabon

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  busData.forEach(bus => {
    L.marker([parseFloat(bus.latitude), parseFloat(bus.longitude)])
      .addTo(map)
      .bindPopup(`<b>Bus ${bus.matricule}</b><br>Status: En service`);
  });
}

// Filtrage des données par période
document.getElementById("filterData").addEventListener("click", function () {
  const startDate = new Date(document.getElementById("startDate").value);
  const endDate = new Date(document.getElementById("endDate").value);

  const filteredRecettes = recettes.filter((recette) => {
    const recetteDate = new Date(recette.date);
    return recetteDate >= startDate && recetteDate <= endDate;
  });

  const filteredDepenses = depenses.filter((depense) => {
    const depenseDate = new Date(depense.date);
    return depenseDate >= startDate && depenseDate <= endDate;
  });

  // Mettre à jour les graphiques avec les nouvelles données
  updateTopBuses(filteredRecettes, filteredDepenses);
  updateIASuggestions();
});

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'état de la connexion au chargement
  if (!navigator.onLine) {
    document.getElementById('offlineAlert').style.display = 'block';
  }
  
  loadBusMap();
  updateTopBuses();
  updateIASuggestions();
});
