/**
 * Notification/Toast Component
 * Demonstrates: Custom events, dynamic content, auto-dismiss
 */
import {
  BazlamaWebComponent,
  CustomElement,
  Property,
  Attribute,
  EventAction,
} from "bazlama-web-component";

type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationItem {
  id: number;
  message: string;
  type: NotificationType;
}

@CustomElement("baz-notification")
export class BazNotification extends BazlamaWebComponent {
  @Property({ defaultValue: [] })
  notifications: NotificationItem[] = [];

  @Property({ defaultValue: 0 })
  private nextId: number = 0;

  @Attribute("duration", true)
  @Property({ defaultValue: 3000 })
  duration: number = 3000;

  private fireNotificationShown(detail: { notification: NotificationItem }): void {
    this.dispatchEvent(
      new CustomEvent("notification-shown", { detail, bubbles: true, composed: true })
    );
  }

  private fireNotificationDismissed(detail: { id: number }): void {
    this.dispatchEvent(
      new CustomEvent("notification-dismissed", { detail, bubbles: true, composed: true })
    );
  }

  @EventAction(".btn-success", "click")
  onSuccessClick() {
    this.show("Operation completed successfully!", "success");
  }

  @EventAction(".btn-error", "click")
  onErrorClick() {
    this.show("Something went wrong. Please try again.", "error");
  }

  @EventAction(".btn-warning", "click")
  onWarningClick() {
    this.show("Please review your input before continuing.", "warning");
  }

  @EventAction(".btn-info", "click")
  onInfoClick() {
    this.show("Here's some helpful information for you.", "info");
  }

  @EventAction(".notifications-container", "click")
  onContainerClick(
    _eventActionName: string,
    _element: HTMLElement,
    _eventName: string,
    event: Event
  ) {
    const target = event.target as HTMLElement;
    if (target.classList.contains("dismiss-btn")) {
      const id = parseInt(target.dataset.id || "0", 10);
      this.dismiss(id);
    }
  }

  public show(message: string, type: NotificationType = "info"): void {
    const notification: NotificationItem = {
      id: this.nextId++,
      message,
      type,
    };

    this.notifications = [...this.notifications, notification];
    this.fireNotificationShown({ notification });
    this.updateNotifications();

    // Auto-dismiss after duration
    if (this.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, this.duration);
    }
  }

  private dismiss(id: number): void {
    const notification = this.root?.querySelector(`[data-notification-id="${id}"]`);
    if (notification) {
      notification.classList.add("dismissing");
      setTimeout(() => {
        this.notifications = this.notifications.filter((n) => n.id !== id);
        this.fireNotificationDismissed({ id });
        this.updateNotifications();
      }, 300);
    }
  }

  private updateNotifications(): void {
    const container = this.root?.querySelector(".notifications-container");
    if (container) {
      container.innerHTML = this.notifications
        .map(
          (n) => `
          <div class="notification notification-${n.type}" data-notification-id="${n.id}">
            <span class="notification-icon">${this.getIcon(n.type)}</span>
            <span class="notification-message">${n.message}</span>
            <button class="dismiss-btn" data-id="${n.id}">×</button>
          </div>
        `
        )
        .join("");
    }
  }

  private getIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };
    return icons[type];
  }

  getRenderTemplate(): string {
    return `
      <style>
        :host {
          display: block;
        }
        .demo-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .trigger-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: transform 0.1s, box-shadow 0.2s;
        }
        .trigger-btn:active {
          transform: scale(0.98);
        }
        .btn-success {
          background: #10b981;
          color: white;
        }
        .btn-success:hover {
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .btn-error {
          background: #ef4444;
          color: white;
        }
        .btn-error:hover {
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
        .btn-warning {
          background: #f59e0b;
          color: white;
        }
        .btn-warning:hover {
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }
        .btn-info {
          background: #3b82f6;
          color: white;
        }
        .btn-info:hover {
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .notifications-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 60px;
        }
        .notification {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          animation: slideIn 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .notification.dismissing {
          animation: slideOut 0.3s ease forwards;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(20px);
          }
        }
        .notification-success {
          background: #ecfdf5;
          border-left: 4px solid #10b981;
        }
        .notification-error {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
        }
        .notification-warning {
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
        }
        .notification-info {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
        }
        .notification-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 12px;
          font-weight: bold;
        }
        .notification-success .notification-icon {
          background: #10b981;
          color: white;
        }
        .notification-error .notification-icon {
          background: #ef4444;
          color: white;
        }
        .notification-warning .notification-icon {
          background: #f59e0b;
          color: white;
        }
        .notification-info .notification-icon {
          background: #3b82f6;
          color: white;
        }
        .notification-message {
          flex: 1;
          color: #334155;
          font-size: 14px;
        }
        .dismiss-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          font-size: 18px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .dismiss-btn:hover {
          background: rgba(0,0,0,0.1);
          color: #64748b;
        }
      </style>
      <div class="demo-container">
        <div class="button-group">
          <button class="trigger-btn btn-success">✓ Success</button>
          <button class="trigger-btn btn-error">✕ Error</button>
          <button class="trigger-btn btn-warning">⚠ Warning</button>
          <button class="trigger-btn btn-info">ℹ Info</button>
        </div>
        <div class="notifications-container"></div>
      </div>
    `;
  }
}
