import { BazlamaWebComponent, useElementText, useElementInputValue, Attribute, ChangeHooks, EventAction } from "bazlama-web-component"
import css from "./test-user-card.css"
import htmlTemplate from "./user-card.template.htm"

export default class TestUserCard extends BazlamaWebComponent {
    private ComponentTitle = "Sample Bazlama Web Component"

    constructor() {
        super()
        this.InitBazlamaWebComponent()
    }

    @EventAction("#incAge", "click")
    public userAgeClick = () => {
        this.userAge++
    }

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
        return `<style>${css}</style>${htmlTemplate}` 

        return /*html*/`
            
            <div class="vertical container">
                <span part="title" class="title">${this.ComponentTitle}</span>
                <div class="horizontal">
                    <div class="card">
                        <div class="form-control">
                            <label part="label" for="username">User Name</label>
                            <input type="text" id="username-input" />
                        </div>
                        <div class="form-control">
                            <label part="label" for="department">User Department</label>
                            <input type="text" id="department-input" />
                        </div>
                        <div class="form-control">
                            <label part="label" for="age">User Age</label>
                            <input type="number" id="age-input" />
                        </div>
                    </div>
                    <div class="card">
                        <div class="form-control">
                            <label part="label" for="username">User Name</label>
                            <span id="username"></span>
                        </div>
                        <div class="form-control">
                            <label part="label" for="department">User Department</label>
                            <span id="department"></span>
                        </div>
                        <div class="form-control">
                            <label part="label" for="age">User Age</label>
                            <span id="age"></span>
                        </div>
                    </div>
                </div>
                <button part="button" id="incAge">Inc Age</button>
            </div>
        `
    }
}

window.customElements.define("test-user-card", TestUserCard)