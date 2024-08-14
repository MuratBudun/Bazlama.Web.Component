import { BazlamaWebComponent, useElementText, useElementInputValue, Attribute, ChangeHooks, CustomElement, TActionEvent, Action } from "bazlama-web-component"
import css from "./test-user-card.css"

@CustomElement("test-user-card")
export default class TestUserCard extends BazlamaWebComponent {
    private ComponentTitle = "Sample Bazlama Web Component"

    constructor() {
        super()
        this.InitProperties(this)

        //this.actionList.push(new Action(this, "#incAge", "click", this.userAgeClick))
    }

    @Action("#incAge", "click")
    public userAgeClick = (element:any , eventName:any, event:any) =>{
        console.log("Inc Age, this: ", this)
        console.log("Inc Age, element: ", element)
        console.log("Inc Age, eventName: ", eventName)
        console.log("Inc Age, event: ", event)
        console.log("Inc Age")
        this.userAge++
    }

    /*
    @Action("#testMethod", "click")
    public testMethod(element:any , eventName:any, event:any) {
        console.log("testMethod, this: ", this)
        console.log("testMethod, event: ", eventName)
        console.log(this.userAge)
    }
    */

    @ChangeHooks([useElementText("#username"), useElementInputValue("#username-input")])
    @Attribute("p-user-name", true)
    public userName: string = "Murat"

    @ChangeHooks([useElementText("#department"), useElementInputValue("#department-input")])
    @Attribute("p-department", true)
    public department: string = "Computer Engineering"

    @ChangeHooks([useElementText("#age"), useElementInputValue("#age-input")])
    @Attribute("p-user-age", true)
    public userAge: number = 47

    /*
    @Action("incAge", "click")
    IncAge() {
        this.userAge++
    }
    */


    /*
    afterRender(): void {
        this.root?.querySelector("#incAge")?.addEventListener("click", () => {
            console.log("Inc Age")
            this.userAge++
        })
    }
    */
   
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
                <button id="incAge">Inc Age</button>
            </div>
        `
    }
}