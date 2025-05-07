document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleTheme');
  const icon = toggleButton.querySelector('i');

  // Charger la préférence depuis localStorage
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    icon.classList.replace('ph-moon-stars', 'ph-sun');
  }

  toggleButton.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    icon.classList.toggle('ph-moon-stars', !isDark);
    icon.classList.toggle('ph-sun', isDark);

    // Sauvegarder la préférence
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
});