/**
 * Todo List Component
 * Demonstrates: Complex state management, custom events, dynamic rendering
 */
import {
  BazlamaWebComponent,
  CustomElement,
  Property,
  EventAction,
} from "bazlama-web-component";

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

@CustomElement("baz-todo")
export class BazTodo extends BazlamaWebComponent {
  @Property({ defaultValue: [] })
  items: TodoItem[] = [];

  @Property({ defaultValue: 0 })
  private nextId: number = 0;

  private fireTodoAdded(detail: { item: TodoItem }): void {
    this.dispatchEvent(
      new CustomEvent("todo-added", { detail, bubbles: true, composed: true })
    );
  }

  private fireTodoRemoved(detail: { id: number }): void {
    this.dispatchEvent(
      new CustomEvent("todo-removed", { detail, bubbles: true, composed: true })
    );
  }

  @EventAction(".add-btn", "click")
  onAddClick() {
    const input = this.root?.querySelector(".todo-input") as HTMLInputElement;
    if (input && input.value.trim()) {
      this.addTodo(input.value.trim());
      input.value = "";
    }
  }

  @EventAction(".todo-input", "keypress")
  onInputKeypress(
    _eventActionName: string,
    element: HTMLElement,
    _eventName: string,
    event: Event
  ) {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.key === "Enter") {
      const input = element as HTMLInputElement;
      if (input.value.trim()) {
        this.addTodo(input.value.trim());
        input.value = "";
      }
    }
  }

  @EventAction(".todo-list", "click")
  onListClick(
    _eventActionName: string,
    _element: HTMLElement,
    _eventName: string,
    event: Event
  ) {
    const target = event.target as HTMLElement;

    // Handle delete button click
    if (target.classList.contains("delete-btn")) {
      const id = parseInt(target.dataset.id || "0", 10);
      this.removeTodo(id);
      return;
    }

    // Handle checkbox click
    if (target.classList.contains("todo-checkbox")) {
      const id = parseInt(target.dataset.id || "0", 10);
      this.toggleTodo(id);
    }
  }

  private addTodo(text: string): void {
    const newItem: TodoItem = {
      id: this.nextId++,
      text,
      completed: false,
    };
    this.items = [...this.items, newItem];
    this.fireTodoAdded({ item: newItem });
    this.updateList();
  }

  private removeTodo(id: number): void {
    this.items = this.items.filter((item) => item.id !== id);
    this.fireTodoRemoved({ id });
    this.updateList();
  }

  private toggleTodo(id: number): void {
    this.items = this.items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    this.updateList();
  }

  private updateList(): void {
    const list = this.root?.querySelector(".todo-list");
    const counter = this.root?.querySelector(".todo-counter");

    if (list) {
      if (this.items.length === 0) {
        list.innerHTML = '<li class="empty-state">No todos yet. Add one above!</li>';
      } else {
        list.innerHTML = this.items
          .map(
            (item) => `
            <li class="todo-item ${item.completed ? "completed" : ""}">
              <input 
                type="checkbox" 
                class="todo-checkbox" 
                data-id="${item.id}" 
                ${item.completed ? "checked" : ""}
              />
              <span class="todo-text">${item.text}</span>
              <button class="delete-btn" data-id="${item.id}">×</button>
            </li>
          `
          )
          .join("");
      }
    }

    if (counter) {
      const remaining = this.items.filter((i) => !i.completed).length;
      const total = this.items.length;
      counter.textContent = `${remaining} of ${total} remaining`;
    }
  }

  getRenderTemplate(): string {
    return `
      <style>
        :host {
          display: block;
        }
        .todo-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .todo-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          color: white;
        }
        .todo-header h3 {
          margin: 0 0 16px 0;
          font-size: 1.25rem;
        }
        .input-group {
          display: flex;
          gap: 8px;
        }
        .todo-input {
          flex: 1;
          padding: 10px 14px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        }
        .add-btn {
          padding: 10px 20px;
          border: none;
          background: rgba(255,255,255,0.2);
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }
        .add-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        .todo-list {
          list-style: none;
          margin: 0;
          padding: 0;
          max-height: 300px;
          overflow-y: auto;
        }
        .todo-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.2s;
        }
        .todo-item:hover {
          background: #f8fafc;
        }
        .todo-item.completed .todo-text {
          text-decoration: line-through;
          color: #94a3b8;
        }
        .todo-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .todo-text {
          flex: 1;
          color: #334155;
        }
        .delete-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .todo-item:hover .delete-btn {
          opacity: 1;
        }
        .delete-btn:hover {
          background: #fecaca;
        }
        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #94a3b8;
          font-style: italic;
        }
        .todo-footer {
          padding: 12px 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        .todo-counter {
          color: #64748b;
          font-size: 13px;
        }
      </style>
      <div class="todo-container">
        <div class="todo-header">
          <h3>📝 Todo List</h3>
          <div class="input-group">
            <input type="text" class="todo-input" placeholder="What needs to be done?" />
            <button class="add-btn">Add</button>
          </div>
        </div>
        <ul class="todo-list">
          <li class="empty-state">No todos yet. Add one above!</li>
        </ul>
        <div class="todo-footer">
          <span class="todo-counter">0 of 0 remaining</span>
        </div>
      </div>
    `;
  }
}
