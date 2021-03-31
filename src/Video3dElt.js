import {css, html, LitElement} from 'lit-element';
import WebGlApp from "./WebGlApp";
import * as THREE from "three";
import {loadDepth16BinMeshTexture} from "./rgbd-viewer/RgbdLoader";
import {loadRecorder3D} from "./pose-viewer/datasetsloader/recorder3d";
import "./commons/PlayerControlsElt"


export class Video3dElt extends LitElement {
    static get styles() {
        // language=CSS
        return css`
            :host {
            }

            #scene3d {
                width: 100%;
                height: 100vh;
            }
        `
    }

    static get properties() {
        return {
            frameIdx: {type: Number}
        };
    }

    constructor() {
        super()
        var params = new URLSearchParams(window.location.search)
        this.datasetFolder = params.get("datasetFolder")
    }

    render() {
        return html`
            <div id='scene3d'></div>

            ${this.frames ? html`
                <player-controls-elt idx='${this.frameIdx}'
                                     count='${this.frames.length}'
                                     @select='${this.selectEvent}"'>
                </player-controls-elt>
            ` : ''}

        `
    }

    firstUpdated(_changedProperties) {
        this.webGlApp = new WebGlApp(this.shadowRoot.getElementById('scene3d'))
        this.webGlApp.animate()
        this.webGlApp.scene.add(new THREE.AmbientLight(0xFFFFFF, 1)) //to render exactly the texture (photogrammetry)
        // this.webGlApp.scene.add(this.createFloor())

        this.loadPoses()
        super.firstUpdated(_changedProperties)
    }

    async loadPoses() {
        var poses = await loadRecorder3D(this.datasetFolder)

        this.group = new THREE.Group()
        var p = poses[0]
        this.group.setRotationFromQuaternion(p.rotation)
        this.webGlApp.scene.add(this.group)
        this.webGlApp.canTransformControlAdd(this.group)

        if (poses.length === 0) return
        var frames = [];
        poses.forEach((p) => {
            frames.push({
                depth: this.datasetFolder + '/' + p.id + '_depth16.bin',
                rgb: this.datasetFolder + '/' + p.id + '_image.jpg'
            })
        })
        this.frames = frames
        this.selectFrame(0)
    }

    async selectEvent(e){
        await this.selectFrame(e.detail.idx)
        e.detail.done() //to display or not next one. To avoid displaying next one if prev one is not yet displayed
    }

    async selectFrame(idx) {
        if (idx === -1) idx = this.frames.length - 1
        else if (idx === this.frames.length) idx = 0
        this.frameIdx = idx

        var frame = this.frames[idx]
        var m = await loadDepth16BinMeshTexture(frame.depth, frame.rgb)

        //there is always ONE child
        this.group.children.forEach((c)=>{
            c.geometry.dispose();
            c.material.dispose();
        })
        this.group.remove(...this.group.children)
        this.group.add(m)
    }
}

window.customElements.define('video3d-elt', Video3dElt)
