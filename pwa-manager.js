/**
 * PWA Registration and Management
 * Handles service worker registration and PWA features
 */

class PWAManager {
  constructor() {
    this.swRegistration = null;
    this.updateAvailable = false;
  }

  /**
   * Initialize PWA
   */
  async init() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered:', this.swRegistration.scope);

      // Check for updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.updateAvailable = true;
            this.showUpdateNotification();
          }
        });
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Request notification permission
      await this.requestNotificationPermission();

      // Setup install prompt
      this.setupInstallPrompt();

      // Setup online/offline detection
      this.setupOnlineDetection();
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'pwa-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #667eea;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        display: flex;
        gap: 12px;
        align-items: center;
      ">
        <span>New version available!</span>
        <button onclick="pwaMgr.applyUpdate()" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        ">Update Now</button>
        <button onclick="this.parentElement.remove()" style="
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">Later</button>
      </div>
    `;
    document.body.appendChild(notification);
  }

  /**
   * Apply update
   */
  applyUpdate() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ action: 'skipWaiting' });
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('[PWA] Notification permission:', permission);
    }

    if (Notification.permission === 'granted') {
      await this.subscribeToPushNotifications();
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications() {
    if (!this.swRegistration) return;

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8zaRGGvQl5YX4TzdHou2fmPnadQd_6M7V9J0UM8PmHTyNVhYbXrXqU'
        )
      });

      console.log('[PWA] Push subscription:', subscription);

      // Send subscription to server
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Setup install prompt
   */
  setupInstallPrompt() {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show install button
      const installBtn = document.getElementById('pwa-install-btn');
      if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', async () => {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('[PWA] Install prompt outcome:', outcome);
          deferredPrompt = null;
          installBtn.style.display = 'none';
        });
      }
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      deferredPrompt = null;
    });
  }

  /**
   * Setup online/offline detection
   */
  setupOnlineDetection() {
    window.addEventListener('online', () => {
      this.showConnectionStatus('online');

      // Sync pending transactions
      if (this.swRegistration && this.swRegistration.sync) {
        this.swRegistration.sync.register('sync-transactions');
      }
    });

    window.addEventListener('offline', () => {
      this.showConnectionStatus('offline');
    });
  }

  /**
   * Show connection status
   */
  showConnectionStatus(status) {
    const notification = document.createElement('div');
    notification.className = 'connection-status';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${status === 'online' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
      ">
        ${status === 'online' ? '✓ Back online' : '⚠ You are offline'}
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Cache transaction for offline sync
   */
  async cacheTransaction(transaction) {
    const db = await this.openDB();
    await db.add('pending-transactions', {
      ...transaction,
      id: Date.now().toString(),
      createdAt: Date.now()
    });
  }

  /**
   * Open IndexedDB
   */
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AetheronDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(this.wrapDB(request.result));

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('pending-transactions')) {
          db.createObjectStore('pending-transactions', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Wrap IndexedDB with Promise API
   */
  wrapDB(db) {
    return {
      add: (storeName, item) => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const request = store.add(item);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    };
  }

  /**
   * Check if app is installed
   */
  isInstalled() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  /**
   * Get installation status
   */
  getInstallStatus() {
    return {
      installed: this.isInstalled(),
      serviceWorkerSupported: 'serviceWorker' in navigator,
      notificationsSupported: 'Notification' in window,
      notificationPermission: Notification.permission,
      pushSupported: 'PushManager' in window,
      syncSupported: 'sync' in (this.swRegistration || {}),
      shareSupported: 'share' in navigator
    };
  }
}

// Create global instance
const pwaMgr = new PWAManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => pwaMgr.init());
} else {
  pwaMgr.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAManager;
}
