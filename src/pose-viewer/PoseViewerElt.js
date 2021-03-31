import {css, html, LitElement} from 'lit-element';
import './form/FormElt'
import './ImagePanelElt'
import {Scene3d} from "./Scene3d";
import {exportPoses, loadModel, loadPoses} from "./datasetsloader/datasetsloader";
import PoseCylinder from "./PoseCylinder";
import {classMap} from "lit-html/directives/class-map";


export class PoseViewerElt extends LitElement {
    static get styles() {
        // language=CSS
        return css`
            :host {
                display: flex;
            }

            @media (orientation: landscape) {
                :host {
                    flex-direction: row;
                }

                #scene3d {
                    width: 70%;
                    height: 100vh;
                }

                #image-panel {
                    width: 30%
                }
            }

            @media (orientation: portrait) {
                :host {
                    flex-direction: column;
                }

                #scene3d {
                    width: 100%;
                    height: 70vh;
                }

                #image-panel {
                    width: 100%;
                    height: 30vh;
                }
            }

            #info-text {
                background-color: rgba(255, 255, 255, 0.5);
            }

            #info-text:not(.show) {
                display: none;
            }
        `
    }

    static get properties() {
        return {
            curPose: {type: PoseCylinder},
            displayInfoText: {type: Boolean}
        };
    }

    constructor() {
        super()
        this.poses = []
        this.curPose = null
        this.scene3d = null
        this.displayInfoText = true
    }

    render() {
        return html`
            <div id="scene3d">
                <form-import-export-elt
                        @load-poses="${this.onLoadPoses}"
                        @click-export="${this.onClickExport}">
                    <div @click=${() => this.displayInfoText = !this.displayInfoText}>💬</div>
                    <div id="info-text" class=${classMap({show: this.displayInfoText})}>
                        Click on Tetrahedron to display pose & image details. <br/>x:red; y:green; z:blue
                    </div>
                </form-import-export-elt>
            </div>
            <image-panel-elt id="image-panel"
                             posesLength=${this.poses.length}
                             .curPose=${this.curPose}
                             @select-pose-idx=${this.onSelectPoseIdx}
            />
        `
    }

    firstUpdated(_changedProperties) {
        let box = this.shadowRoot.getElementById('scene3d')
        this.scene3d = new Scene3d(box)
        this.scene3d.onClickSelectPose = this.selectPoseObj.bind(this)

        super.firstUpdated(_changedProperties)
    }

    onClickExport(e) {
        exportPoses(this.poses, e.detail.dataType)
    }

    onSelectPoseIdx(e) {
        this.selectPoseIdx(e.detail)
    }

    async onLoadPoses(e) {
        var {datasetType, datasetFolder, scale, files} = e.detail
        this.poses = await loadPoses(datasetType, datasetFolder, files)
        var model = await loadModel(datasetFolder, files)
        this.renderPosesMain(this.poses, model, datasetType, scale);
    }

    renderPosesMain(poses, model, datasetType, scale) {
        this.scene3d.renderPoses(poses, model, datasetType, scale);
        setTimeout(() => {
            this.selectPoseObj(poses[0].object)
        }, 1000)
    }

    selectPoseIdx(idxPose) {
        if (idxPose < 0 || idxPose >= this.poses.length || idxPose === null) return false;
        var pose = this.poses[idxPose];
        this.selectPoseObj(pose.object);
    }

    /** @param poseObj {PoseCylinder}*/
    selectPoseObj(poseObj) {
        this.curPose = poseObj
        poseObj.select(this.scene3d.getMeshPly())
        this.shadowRoot.getElementById('info-text').textContent = JSON.stringify(poseObj.data.raw);
    }
}

window.customElements.define('pose-viewer-elt', PoseViewerElt)
