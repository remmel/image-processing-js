import {LitElement, html, css} from 'lit-element';
import {getImageUrl, URLDATAPIXEL} from "./utils";
import PoseCylinder from "./PoseCylinder";

class ImagePanelElt extends LitElement {
    static get styles() {
        // language=CSS
        return css`
            :host {
                height: 100%;
                text-align: center;
                position: relative;
                display: flex; /* for the images */
            }

            @media (orientation: landscape) {
                :host{
                    flex-direction: column;
                }
            }

            img {
                max-width: 100%;
                max-height: 50vh;
            }

            #photo-info {
                position: absolute;
                top: 0;
                width: 100%;
            }

            #info-num-pose {
                color: white;
                background-color: rgba(0, 0, 0, 0.4);
            }
        `;
    }

    static get properties() {
        return {
            posesLength: {type: Number},
            curPoseIdx: {type: Number},
            curPose: {type: PoseCylinder}, //FIXME why that type is useless? maybe because this is a property, not attribute?
            isPlaying: {type: Boolean}
        };
    }

    constructor() {
        super()
        this.curPoseIdx = -1
        /** @param {PoseCylinder} this.curPose */
        this.curPose = null
        this.playpauseInterval = null
        this.isPlaying = false
        this.posesLength = null

        this.rgb = null
        this.depth = null
    }

    render() {
        return html`
            ${this.curPose && html`
                <img src="${this.rgb ? this.rgb : URLDATAPIXEL}"/>
                <img src="${this.depth ? this.depth : URLDATAPIXEL}"/>
            `}

            <div id="photo-info">
                <span id="info-num-pose">
                    ${this.curPoseIdx === -1 ? '-' : this.curPoseIdx + 1} / ${this.posesLength}
                </span>
                <button id="btn-previous" @click=${() => this.selectPoseIdx(this.curPoseIdx - 1)}>⏮️</button>
                <button id="btn-playpause" @click=${this.playpause}>
                    ${this.isPlaying ? "⏸️" : "▶️"}
                </button>
                <button id="btn-next" @click=${() => this.selectPoseIdx(this.curPoseIdx + 1)}>⏭️</button>
            </div>
        `;
    }

    async updated(changedProperties) {
        if (changedProperties.has('curPose') && this.curPose) {
            this.rgb = await getImageUrl(this.curPose.data.rgb)
            this.depth = await getImageUrl(this.curPose.data.depth)
            this.curPoseIdx = this.curPose.idxPose
        }
    }

    selectPoseIdx(idxPose) { //check if idxPose is null?
        if (idxPose === -1) idxPose = this.posesLength - 1 //the user selected prev one, when 1st one was selected, go to last one
        else if(idxPose === this.posesLength) idxPose = 0 //the user selected next one, when last one was select, go to first
        this.curPoseIdx = idxPose
        console.log('ImagePanelElt.selectPoseIdx', idxPose)
        this.dispatchEvent(new CustomEvent('select-pose-idx', {detail: idxPose}));
    }

    playpause() {
        if (this.isPlaying) {
            this.playingInterval = clearInterval(this.playingInterval)
            this.isPlaying = false
        } else {
            this.isPlaying = true
            preloadImagesOnce();
            this.playingInterval = setInterval(() => this.selectPoseIdx(this.curPoseIdx + 1), 500)
        }
    }
}

var preloadImagesOnce = () => {
    // getPoses().forEach(pose => {
    //     if(typeof pose.path !== 'string') return;
    //     var img=new Image();
    //     img.src=pose.path;
    // })
    // preloadImagesOnce = () => {}; //as that fct is called once
}

window.customElements.define('image-panel-elt', ImagePanelElt);

