export function createLoadingScreen() {
  const loadingScreen = document.createElement('div');
  loadingScreen.className = 'fixed inset-0 bg-white z-50 flex flex-col items-center justify-center';
  
  loadingScreen.innerHTML = `
    <div class="w-24 h-24 mb-4">
      <svg class="animate-spin text-blue-500" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
    </div>
    <div id="loading-message" class="text-lg font-medium text-gray-700 mb-2">Initializing...</div>
    <div class="w-64 bg-gray-200 rounded-full h-2">
      <div id="loading-progress" class="h-full bg-blue-500 rounded-full transition-all duration-300" style="width: 0%"></div>
    </div>
  `;

  return loadingScreen;
}

export function updateLoadingProgress(message, progress) {
  const messageEl = document.getElementById('loading-message');
  const progressEl = document.getElementById('loading-progress');
  
  if (messageEl) messageEl.textContent = message;
if (progressEl) {
  progressEl.style.width = `${progress}%`;
} else {
  console.warn('Loading progress element not found');
}
}