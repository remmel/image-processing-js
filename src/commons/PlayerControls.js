import {css, html, LitElement} from 'lit-element';

class PlayerControls extends LitElement {
    static get styles() {
        // language=CSS
        return css`
            :host {
                bottom: 10px;
                width: 100%;
                position: absolute;
                text-align: center;
            }
            
            progress{
                height: 25px;
            }
            
            #btn-controls{
                background-color:  rgba(255,255,255, 0.2);
                display: inline-block;
                padding: 3px;
                border-radius: 3px;
            }
        `
    }

    static get properties() {
        return {
            idx: {type: Number},
            count: {type: Number},
            isPlaying: {type: Boolean}
        };
    }

    constructor() {
        super()
        this.isPlaying = false
        this.playingInterval = null
    }

    render() {
        return html`
            <progress id="progressBar" value=${this.idx + 1} max=${this.count}
                      @click=${this.onclickProgress}></progress>
            <br/>
            <div id="btn-controls">
                <span id="info-num-pose">${this.idx === null ? '-' : this.idx + 1} / ${this.count}</span>
                <button @click=${() => this.selectFrame(this.idx - 1)}>⏮️</button>
                <button @click=${this.togglePlayPause}>${this.isPlaying ? "⏸️" : "▶️"}</button>
                <button @click=${() => this.selectFrame(this.idx + 1)}>⏭️</button>
            </div>
        `
    }

    async selectFrame(idx, isPlaying) {
        if (idx === -1) idx = this.count - 1
        else if (idx === this.count) idx = 0
        this.idx = idx

        var time = new Date()
        this.dispatchEvent(new CustomEvent('select', {
            detail: {
                idx: this.idx,
                done: () => {
                    if(isPlaying && this.isPlaying) {
                        setTimeout(() => this.isPlaying && this.selectFrame(this.idx+1, true), 200 - ((new Date) - time))
                    }
                }
            }
        }))
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying
        if (this.isPlaying) this.selectFrame(this.idx+1, true)
    }

    onclickProgress(e){
        var bounds = e.target.getBoundingClientRect();
        var pos = e.pageX - bounds.left; //Position cursor
        var percentage  = pos/bounds.width
        var idx = Math.round((this.count-1)*percentage)
        this.selectFrame(idx)
    }
}

window.customElements.define('player-controls-elt', PlayerControls)