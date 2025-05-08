// ==================== CONFIGURATION ====================
const APP_CONFIG = {
  syncInterval: 300000, // 5 minutes
  maxOfflineDataAge: 48 * 60 * 60 * 1000 // 48 heures
};

// ==================== SERVICE WORKER & OFFLINE MANAGEMENT ====================
class OfflineManager {
  constructor() {
    this.pendingChanges = [];
    this.initServiceWorker();
    this.initOfflineListeners();
    this.setupSyncInterval();
  }

  initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => this.handleSWRegistration(reg))
        .catch(err => console.error('SW registration failed:', err));
    }
  }

  handleSWRegistration(reg) {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.showUpdateAlert();
        }
      });
    });

    // Vérification périodique des mises à jour
    setInterval(() => reg.update(), 3600000);
  }

  initOfflineListeners() {
    window.addEventListener('offline', () => this.handleOffline());
    window.addEventListener('online', () => this.handleOnline());
    
    // État initial
    if (!navigator.onLine) this.handleOffline();
  }

  handleOffline() {
    this.showOfflineBanner();
    console.warn('Application en mode hors ligne');
    this.backupCriticalData();
  }

  handleOnline() {
    this.hideOfflineBanner();
    console.log('Connexion rétablie');
    this.syncPendingChanges();
  }

  setupSyncInterval() {
    setInterval(() => {
      if (navigator.onLine && this.pendingChanges.length > 0) {
        this.syncPendingChanges();
      }
    }, APP_CONFIG.syncInterval);
  }

  // ... (autres méthodes showUpdateAlert, showOfflineBanner, etc.)
}

// ==================== DATA MANAGEMENT ====================
class DataManager {
  constructor() {
    this.recettes = this.loadData('recettes') || [
      { busMatricule: 'AK678AA', montant: 35000, date: '2025-04-16' },
      // ... autres données par défaut
    ];
    
    this.depenses = this.loadData('depenses') || [
      { busMatricule: 'AK678AA', montant: 5000, date: '2025-04-16' },
      // ... autres données par défaut
    ];
  }

  loadData(key) {
    const data = localStorage.getItem(`offline_${key}`);
    return data ? JSON.parse(data) : null;
  }

  saveData(key, data) {
    localStorage.setItem(`offline_${key}`, JSON.stringify(data));
    localStorage.setItem(`offline_${key}_timestamp`, Date.now());
  }

  backupCriticalData() {
    this.saveData('recettes', this.recettes);
    this.saveData('depenses', this.depenses);
  }

  syncWithServer() {
    return new Promise((resolve) => {
      // Implémentez votre logique de synchronisation ici
      console.log('Synchronisation des données avec le serveur');
      resolve();
    });
  }
}

// ==================== APPLICATION INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Initialisation des managers
  const offlineManager = new OfflineManager();
  const dataManager = new DataManager();

  // Initialisation des composants UI
  if (document.getElementById('busMap')) {
    initMap();
  }
  
  if (document.getElementById('topBuses')) {
    updateDashboard();
  }

  function initMap() {
    // Votre code existant pour la carte
  }

  function updateDashboard() {
    // Vos fonctions existantes updateTopBuses, updateIASuggestions
  }

  // Gestion des formulaires hors ligne
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      if (!navigator.onLine) {
        e.preventDefault();
        await handleOfflineFormSubmit(form);
      }
    });
  });

  async function handleOfflineFormSubmit(form) {
    const formData = new FormData(form);
    // Stocker les données du formulaire pour soumission ultérieure
    const pendingSubmissions = JSON.parse(localStorage.getItem('pendingFormSubmissions') || [];
    pendingSubmissions.push(Object.fromEntries(formData));
    localStorage.setItem('pendingFormSubmissions', JSON.stringify(pendingSubmissions));
    
    alert('Formulaire enregistré localement. Il sera soumis lorsque la connexion sera rétablie.');
    form.reset();
  }
});
