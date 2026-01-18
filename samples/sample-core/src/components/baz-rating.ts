/**
 * Star Rating Component
 * Demonstrates: Custom events, hover states, onRendered lifecycle
 */
import {
  BazlamaWebComponent,
  CustomElement,
  Property,
  Attribute,
  EventAction,
} from "bazlama-web-component";

@CustomElement("baz-rating")
export class BazRating extends BazlamaWebComponent {
  @Attribute("value", true)
  @Property({ defaultValue: 0 })
  value: number = 0;

  @Property({ defaultValue: 0 })
  hoverValue: number = 0;

  @Attribute("max", true)
  @Property({ defaultValue: 5 })
  max: number = 5;

  @Attribute("readonly", true)
  @Property({ defaultValue: false })
  readonly: boolean = false;

  private fireRatingChange(detail: { value: number; max: number }): void {
    this.dispatchEvent(
      new CustomEvent("rating-change", { detail, bubbles: true, composed: true })
    );
  }

  @EventAction(".stars-container", "click")
  onStarClick(
    _eventActionName: string,
    _element: HTMLElement,
    _eventName: string,
    event: Event
  ) {
    if (this.readonly) return;

    const target = event.target as HTMLElement;
    const star = target.closest(".star") as HTMLElement;
    if (star && star.dataset.value) {
      this.value = parseInt(star.dataset.value, 10);
      this.fireRatingChange({ value: this.value, max: this.max });
    }
  }

  @EventAction(".stars-container", "mouseover")
  onStarHover(
    _eventActionName: string,
    _element: HTMLElement,
    _eventName: string,
    event: Event
  ) {
    if (this.readonly) return;

    const target = event.target as HTMLElement;
    const star = target.closest(".star") as HTMLElement;
    if (star && star.dataset.value) {
      this.hoverValue = parseInt(star.dataset.value, 10);
      this.updateStars();
    }
  }

  @EventAction(".stars-container", "mouseout")
  onStarLeave() {
    if (this.readonly) return;
    this.hoverValue = 0;
    this.updateStars();
  }

  public updateStars(): void {
    const stars = this.root?.querySelectorAll(".star");
    const displayValue = this.hoverValue || this.value;

    stars?.forEach((star, index) => {
      const starEl = star as HTMLElement;
      if (index < displayValue) {
        starEl.classList.add("active");
        starEl.classList.toggle("hover", this.hoverValue > 0);
      } else {
        starEl.classList.remove("active", "hover");
      }
    });

    const ratingText = this.root?.querySelector(".rating-text");
    if (ratingText) {
      ratingText.textContent = `${this.value} / ${this.max}`;
    }
  }

  onRendered(): void {
    this.updateStars();
  }

  getRenderTemplate(): string {
    const stars = Array.from({ length: this.max }, (_, i) => i + 1);

    return `
      <style>
        :host {
          display: block;
        }
        .rating-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .stars-container {
          display: flex;
          gap: 4px;
        }
        .star {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          cursor: pointer;
          transition: transform 0.2s;
          color: #e2e8f0;
          -webkit-user-select: none;
          user-select: none;
        }
        :host([readonly]) .star {
          cursor: default;
        }
        .star:hover:not(:host([readonly]) .star) {
          transform: scale(1.2);
        }
        .star.active {
          color: #fbbf24;
        }
        .star.hover {
          color: #fcd34d;
        }
        .rating-text {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }
        .rating-label {
          font-size: 13px;
          color: #94a3b8;
        }
      </style>
      <div class="rating-container">
        <div class="rating-label">Rate your experience</div>
        <div class="stars-container">
          ${stars.map((n) => `<span class="star" data-value="${n}">★</span>`).join("")}
        </div>
        <div class="rating-text">0 / ${this.max}</div>
      </div>
    `;
  }
}
