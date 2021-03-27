import {css, html, LitElement} from 'lit-element';
import WebGlApp from "./WebGlApp";
import * as THREE from "three";
import {loadDepth16BinMeshTexture} from "./rgbd-viewer/RgbdLoader";
import {loadRecorder3D} from "./pose-viewer/datasetsloader/recorder3d";


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

            #player-controls {
                bottom: 10px;
                width: 100%;
                position: absolute;
                background-color: white;
                text-align: center;
            }
        `
    }

    static get properties() {
        return {
            frameIdx: {type: Number},
            isPlaying: {type: Boolean}
        };
    }

    constructor() {
        super()
        this.webGlApp = null
        this.isPlaying = false
        this.playingInterval = null
        var params = new URLSearchParams(window.location.search)
        this.datasetFolder = params.get("datasetFolder")
    }

    render() {
        return html`
            <div id="scene3d"></div>
            <div id="player-controls">
                <span id="info-num-pose">
                    ${this.frames ? html`
                        ${this.frameIdx === null ? '-' : this.frameIdx + 1} / ${this.frames.length}` : ''}
                    
                </span>
                <button @click=${() => this.selectFrame(this.frameIdx - 1)}>⏮️</button>
                <button @click=${this.togglePlayPause}>
                    ${this.isPlaying ? "⏸️" : "▶️"}
                </button>
                <button @click=${() => this.selectFrame(this.frameIdx + 1)}>⏭️</button>
            </div>
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
        this.webGlApp.canTransformControl(this.group)

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

    async selectFrame(idx) {
        if (idx === -1) idx = this.frames.length - 1
        else if (idx === this.frames.length) idx = 0
        this.frameIdx = idx

        var frame = this.frames[idx]
        var m;
        if (frame.mesh) { //"cache" system
            m = frame.mesh
            m.visible = true
        } else {
            m = await loadDepth16BinMeshTexture(frame.depth, frame.rgb)
            this.group.add(m)
            frame.mesh = m
        }
        if (this.prevMesh) this.prevMesh.visible = false // app crash after loading ~200 models, maybe better to remove and dispose?
        this.prevMesh = m
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying
        if (this.isPlaying) this.playing()
    }

    async playing() {
        console.log('isPlaying', this.isPlaying)
        if (!this.isPlaying) return
        var time = new Date()
        await this.selectFrame(this.frameIdx + 1)
        setTimeout(() => this.playing(), 200 - ((new Date) - time)) //if it tooks time to load the image, do not cumulate that time
    }
}

window.customElements.define('video3d-elt', Video3dElt)