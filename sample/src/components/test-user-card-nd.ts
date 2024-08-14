import { BazlamaWebComponent, EventActionBuilder, EventActionMap, PropertyBuilder, PropertyDefine, useElementInputValue, useElementText } from "bazlama-web-component"
import { IPropertyChangeHandlers } from "bazlama-web-component/dist/property/types/IPropertyChangeHandlers"
import css from "./test-user-card.css"

export default class TestUserCardNd extends BazlamaWebComponent {
    private ComponentTitle = "Sample Bazlama Web Component"

    constructor() {
        super()
        this.InitBazlamaWebComponent()
    }

    static CreatePropertyDefines(): PropertyDefine[] {
        return [
            new PropertyBuilder("userName2", "string")
                .setAttribute("p-user-name")
                .setDefaultValue("Murat")
                .build(),
            new PropertyBuilder("department2", "string")
                .setAttribute("p-department")
                .setDefaultValue("Computer Engineering")
                .build(),
            new PropertyBuilder("userAge2", "number")
                .setAttribute("p-user-age")
                .setDefaultValue(47)
                .build()
        ]
    }

    static CreatePropertyHooks(): IPropertyChangeHandlers {
        return {
            "userName2": [
                useElementText("#username"), 
                useElementInputValue("#username-input")],

            "department2": [
                useElementText("#department"), 
                useElementInputValue("#department-input")],

            "userAge2": [
                useElementText("#age"), 
                useElementInputValue("#age-input")]
        }
    }

    createEventActionMaps(): EventActionMap[] {
        return [
            new EventActionBuilder("userAgeClick2", "#incAge", "click")
                .setActionMethod(() => {
                    const userAge = this.GetPropertyValue("userAge2") as number
                    this.SetPropertyValue("userAge2", userAge + 1)
                })
                .build()
        ]
    }

    getRenderTemplate(): string {
        return /*html*/`
            <style>${css}</style>
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

customElements.define("test-user-card-nd", TestUserCardNd)