export const Notifications = {
  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `
      fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transform transition-all duration-300 
      ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
      text-white max-w-md z-50
    `;
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">
          ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
        </span>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), duration);
  }
};