import { BazlamaWebComponent, useElementText, useElementInputValue, Attribute, ChangeHooks, CustomElement } from "bazlama-web-component"
import css from "./test-user-card.css"

@CustomElement("test-user-card")
export default class TestUserCard extends BazlamaWebComponent {
    private ComponentTitle = "Sample Bazlama Web Component"

    @ChangeHooks([useElementText("#username"), useElementInputValue("#username-input")])
    @Attribute("p-user-name", true)
    public userName: string = "Murat"

    @ChangeHooks([useElementText("#department"), useElementInputValue("#department-input")])
    @Attribute("p-department", true)
    public department: string = "Computer Engineering"

    @ChangeHooks([useElementText("#age"), useElementInputValue("#age-input")])
    @Attribute("p-user-age", true)
    public userAge: number = 47

    getRenderTemplate(): string {
        return /*html*/`
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