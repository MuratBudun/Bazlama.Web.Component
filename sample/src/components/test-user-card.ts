import { BazlamaWebComponent, BazlamaProperty, useElementText, useElementInputValue, ShadowRootMode } from "bazlama-web-component"
import css from "./test-user-card.css"

class TestUserCard extends BazlamaWebComponent {
    private ComponentTitle = "Sample Bazlama Web Component"

    static get Properties(): BazlamaProperty<any>[] {
        return [
            new BazlamaProperty<string>("userName", {
                defaultValue: "Murat",
                isAttribute: true,
                isAttributeObserved: true,
                attributeName: "p-user-name",
                changeHooks: [
                    useElementText("#username"),
                    useElementInputValue("#username-input"),
                ],
            }),

            new BazlamaProperty<string>("department", {
                defaultValue: "Computer Engineering",
                isAttribute: true,
                isAttributeObserved: true,
                attributeName: "p-department",
                changeHooks: [
                    useElementText("#department"),
                    useElementInputValue("#department-input"),
                ],
            }),

            new BazlamaProperty<number>("userAge", {
                defaultValue: 47,
                isAttribute: true,
                isAttributeObserved: true,
                attributeName: "p-user-age",
                changeHooks: [
                    useElementText("#age"),
                    useElementInputValue("#age-input"),
                ],
            }),
        ]
    }

    getRenderTemplate(): string {
        return `
            <style>${css}</style>
            <div class="vertical container">
                <span class="title">${this.ComponentTitle}</span>
                <div class="horizontal">
                    <div class="card">
                        <div class="form-control">
                            <label for="username">User Name</label>
                            <input type="text" id="username-input" />
                        </div>
                        <div class="form-control">
                            <label for="department">User Department</label>
                            <input type="text" id="department-input" />
                        </div>
                        <div class="form-control">
                            <label for="age">User Age</label>
                            <input type="number" id="age-input" />
                        </div>
                    </div>
                    <div class="card">
                        <div class="form-control">
                            <label for="username">User Name</label>
                            <span id="username"></span>
                        </div>
                        <div class="form-control">
                            <label for="department">User Department</label>
                            <span id="department"></span>
                        </div>
                        <div class="form-control">
                            <label for="age">User Age</label>
                            <span id="age"></span>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
}