import {css, html, LitElement} from 'lit-element';
import WebGlApp from "../WebGlApp";


import * as FormImportExportElt from './form/formImport'
import * as ImagePanelElt from './ImagePanel'


import {getMeshPly, init3dscene, renderPoses} from "./scene3d";
import {DATASET_TYPE, exportPoses, loadModel, loadPoses} from "./datasetsloader/datasetsloader";
import {selectPoseObj} from "../pose-viewer/main";
import PoseCylinder from "./PoseCylinder";

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
export class Main extends LitElement {
    static get styles() {
        return css`
        
      .container{
        display: flex;
      }
            
      #scene3d {
        width: 70%;
        height: 100vh;
      }
      
      #image-panel{
        width: 30%
      }
      
      #info-text{
        background-color: rgba(255, 255, 255, 0.5);
      }
    `
    }

    static get properties() {
        return {
            curPose: {type: PoseCylinder},
        };
    }


    constructor() {
        super()
        this.poses = []
        this.curPose = null
    }

    render() {
        return html`
            <div class="container">
                <div id="scene3d"></div>
                <image-panel-elt id="image-panel"
                                 posesLength=${this.poses.length}
                                 .curPose=${this.curPose}
                                 @select-pose-idx=${this.onSelectPoseIdx}
                />
            </div>
            
            <form-import-export-elt
                    @load-poses="${this.onLoadPoses}"
                    @click-export="${this.onClickExport}">
                <span id="info-text">Click on Tetrahedron to display pose & image details. <br />x:red; y:green; z:blue</span>
            </form-import-export-elt>
        `
    }

    firstUpdated(_changedProperties) {
        let box = this.shadowRoot.getElementById('scene3d')
        var webGlApp = new WebGlApp(box)
        init3dscene(DATASET_TYPE.RECORDER3D, webGlApp,  this.selectPoseObj.bind(this))

        super.firstUpdated(_changedProperties)
    }

    onClickExport(e) {
        exportPoses(this.poses, e.detail.dataType)
    }

    onSelectPoseIdx(e) {
        this.selectPoseIdx(e.detail)
    }

    async onLoadPoses(e) {
        console.log('onLoadPoses', e.detail)
        var {datasetType, datasetFolder, scale, files} = e.detail
        this.poses = await loadPoses(datasetType, datasetFolder, files)
        var model = await loadModel(datasetFolder, files)
        this.renderPosesMain(this.poses, model, datasetType, scale);
    }

    renderPosesMain(poses, model, datasetType, scale) {
        renderPoses(poses, model, datasetType, scale);
        setTimeout(() => {this.selectPoseObj(poses[0].object)}, 1000)
    }

    selectPoseIdx(idxPose) {
        if(idxPose < 0 || idxPose >= this.poses.length || idxPose === null) return false;
        var pose = this.poses[idxPose];
        this.selectPoseObj(pose.object);
    }

    /** @param poseObj {PoseCylinder}*/
    selectPoseObj(poseObj) {
        console.log('main.selectPoseObj', poseObj, this)
        this.curPose = poseObj
        poseObj.select(getMeshPly())
        this.shadowRoot.getElementById('info-text').textContent = JSON.stringify(poseObj.data.raw);
    }

    // // When clicking on pose, display images and info
    // onClick3dScene(mouse) {
    //     raycaster.setFromCamera(mouse, webgl.camera)
    //     var intersects = raycaster.intersectObjects(groupPoses.children) //scene.children
    //     intersects.some(intersect => {
    //         if (!(intersect.object instanceof PoseCylinder)) return false
    //         console.log(onClickSelectPose)
    //         if(onClickSelectPose) onClickSelectPose(intersect.object)
    //         else selectPoseObj(intersect.object)
    //         return true
    //     })
    // }
}

window.customElements.define('pose-viewer-elt', Main)