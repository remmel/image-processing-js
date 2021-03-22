import {LitElement, html, css} from 'lit-element';
import {getImageUrl, URLDATAPIXEL} from "./utils";
import PoseCylinder from "./PoseCylinder";

class ImagePanelElt extends LitElement {
    static get styles() {
        return css`
            #photo-container {
                max-height: 100vh;
                text-align: center;
                position: relative;
            }
            
            #photo-container img {
                max-width: 100%;
                max-height: 100%;
            }
            
            #info-num-pose{
                color: white;
                background-color: rgba(0,0,0,0.4);
            }
            
            #photo-container #photo-info{
                position: absolute;
                top: 0;
                left: 33%;
            }
    `;
    }

    static get properties() {
        return {
            posesLength: {type: Number},
            curPoseIdx: {type: Number},
            curPose: {type: PoseCylinder}, //FIXME why that type is useless? maybe because this is a property, not attribute?
        };
    }

    constructor() {
        super()
        this.curPoseIdx = -1

        /** @param {PoseCylinder} this.curPose */
        this.curPose = null
        this.playpauseInterval = null
        this.posesLength = null
        this.rgb = null
        this.depth = null
    }

    render() {
        return html`
        <div id="photo-container">
            ${this.curPose && html`
                <img src="${this.rgb ? this.rgb : URLDATAPIXEL}"/>
                <img src="${this.depth ? this.depth : URLDATAPIXEL}"/>
            `}

            <div id="photo-info">
                <span id="info-num-pose">
                    ${this.curPoseIdx === -1 ? '-' : this.curPoseIdx+1} / ${this.posesLength}
                </span>
                <button id="btn-previous" @click=${() => this.selectPoseIdx(this.curPoseIdx-1)}>⏮️</button>
                <button id="btn-playpause" @click=${this.playpause}>⏯️</button>
                <button id="btn-next" @click=${() => this.selectPoseIdx(this.curPoseIdx+1)}>⏭️</button>
            </div>
        </div>
    `;
    }

    async updated(changedProperties) {
        if(changedProperties.has('curPose') && this.curPose) {
            this.rgb = await getImageUrl(this.curPose.data.rgb)
            this.depth = await getImageUrl(this.curPose.data.depth)
            this.curPoseIdx = this.curPose.idxPose
        }
    }

    selectPoseIdx(idxPose) {
        console.log('ImagePanelElt.selectPoseIdx', idxPose)
        if(idxPose < 0 || idxPose >= this.posesLength || idxPose === null) return false;
        this.dispatchEvent(new CustomEvent('select-pose-idx', {detail: idxPose}));
    }

    playpause() {
        if(this.playpauseInterval){
            this.playpauseInterval = clearInterval(this.playpauseInterval);
        } else {
            preloadImagesOnce();
            if(this.curPoseIdx === this.posesLength-1 || this.curPoseIdx === null) this.curPoseIdx = -1; //if pressing btn when no pose selected or last one selected

            this.playpauseInterval = setInterval(() => {
                if(this.curPoseIdx === this.posesLength-1)
                    this.playpauseInterval = clearInterval(this.playpauseInterval);
                else
                    this.selectPoseIdx(this.curPoseIdx+1);
            }, 500);
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

