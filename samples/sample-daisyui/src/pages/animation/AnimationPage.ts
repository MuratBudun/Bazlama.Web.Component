import { BasePage } from "../../baz-ui/baz-router/classes/BasePage";
import BazAnimation from "../../baz-ui/baz-animation/BazAnimation";
import animationHtml from "./animation.htm";

/**
 * BazAnimation utility demo page
 */
export class AnimationPage extends BasePage {
    render(): string {
        return animationHtml;
    }

    init(): void {
        // Animation handlers - using event delegation
        this.addDelegatedListener('click', '[data-action]', (e) => {
            const button = (e.target as HTMLElement).closest('[data-action]') as HTMLElement;
            if (!button) return;

            const action = button.getAttribute('data-action');
            const animTarget = this.querySelector(`[data-target="${action}"]`) as HTMLElement;
            if (!animTarget) return;

            switch (action) {
                case 'fade-in':
                    BazAnimation.animate(animTarget, 'fadeIn');
                    break;
                case 'fade-out':
                    BazAnimation.animate(animTarget, 'fadeOut');
                    break;
                case 'fade-in-up':
                    BazAnimation.animate(animTarget, 'fadeInUp');
                    break;
                case 'fade-in-down':
                    BazAnimation.animate(animTarget, 'fadeInDown');
                    break;
                case 'slide-in-left':
                    BazAnimation.animate(animTarget, 'slideInLeft');
                    break;
                case 'slide-in-right':
                    BazAnimation.animate(animTarget, 'slideInRight');
                    break;
                case 'slide-out-left':
                    BazAnimation.animate(animTarget, 'slideOutLeft');
                    break;
                case 'slide-out-right':
                    BazAnimation.animate(animTarget, 'slideOutRight');
                    break;
                case 'zoom-in':
                    BazAnimation.animate(animTarget, 'zoomIn');
                    break;
                case 'zoom-out':
                    BazAnimation.animate(animTarget, 'zoomOut');
                    break;
                case 'bounce':
                    BazAnimation.animate(animTarget, 'bounce');
                    break;
                case 'shake':
                    BazAnimation.animate(animTarget, 'shake');
                    break;
                case 'rotate-in':
                    BazAnimation.animate(animTarget, 'rotateIn');
                    break;
                case 'rotate-out':
                    BazAnimation.animate(animTarget, 'rotateOut');
                    break;
                case 'pulse':
                    BazAnimation.animate(animTarget, 'pulse');
                    break;
                case 'flash':
                    BazAnimation.animate(animTarget, 'flash');
                    break;
                case 'flip-x':
                    BazAnimation.animate(animTarget, 'flipX');
                    break;
                case 'flip-y':
                    BazAnimation.animate(animTarget, 'flipY');
                    break;
                case 'sequence':
                    BazAnimation.sequence(animTarget, [
                        { name: 'fadeIn', options: { duration: 300 } },
                        { name: 'bounce', options: { duration: 500 } },
                        { name: 'pulse', options: { duration: 800 } },
                        { name: 'shake', options: { duration: 500 } }
                    ]);
                    break;
                case 'parallel':
                    BazAnimation.parallel(animTarget, [
                        { name: 'fadeIn', options: { duration: 1000 } },
                        { name: 'bounce', options: { duration: 1000 } }
                    ]);
                    break;
                case 'custom':
                    BazAnimation.registerAnimation('rainbow', {
                        keyFrames: [
                            { filter: 'hue-rotate(0deg)' },
                            { filter: 'hue-rotate(360deg)' }
                        ],
                        options: { duration: 2000, iterations: 3 }
                    }, 'custom');
                    BazAnimation.animate(animTarget, 'rainbow', {}, ['custom']);
                    break;
            }
        });

        // Configuration controls
        this.addChangeListener('[data-config="enabled"]', (e) => {
            const enabled = (e.target as HTMLInputElement).checked;
            BazAnimation.configure({ enabled });
        });

        this.addChangeListener('[data-config="reduce-motion"]', (e) => {
            const reduceMotion = (e.target as HTMLInputElement).checked;
            BazAnimation.configure({ reduceMotion });
        });

        this.addInputListener('[data-config="speed"]', (e) => {
            const speed = parseFloat((e.target as HTMLInputElement).value);
            const display = this.querySelector('[data-display="speed"]');
            if (display) {
                display.textContent = `${speed.toFixed(1)}x`;
            }
            BazAnimation.configure({ playbackSpeed: speed });
        });
    }
}
