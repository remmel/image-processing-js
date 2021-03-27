import {html, LitElement} from "lit-element";

class SelectElt extends LitElement {
    static get properties() {
        return {
            options: {type: Array},
            selected: {type: String}
        }
    }

    constructor() {
        super();
        this.options = {} //{1: "Ben", 2: "Steve", 9: "James"}
        this.selected = null //9

        this.optionsSlot = {}

        // as <slot> cannot be a children of <select>, this is the workaround:
        this.shadowRoot.host.querySelectorAll('option').forEach(opt => {
            this.optionsSlot[opt.value] = opt.text
        })
    }

    render() {
        return html`
            <select @change="${this._onChange}">
                ${Object.entries({...this.optionsSlot, ...this.options}).map(([val,text]) => html`
                    <option value="${val}" ?selected=${this.selected === val}>${text}</option>
                `)}
            </select>
        `;
    }

    // firstUpdated(_changedProperties) {
    //     console.log(this.shadowRoot.host.querySelector( 'slot' ))
    //     debugger
    // }

    _onChange(e) {
        var value = e.target.value
        var index = e.target.options.selectedIndex
        var text = e.target.options[index].text
        this.dispatchEvent(new CustomEvent('change', {detail: {value, index, text}}))
    }
}

window.customElements.define('select-elt', SelectElt)