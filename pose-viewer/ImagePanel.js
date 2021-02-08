import {readAsDataURL} from "./form/formUtils.js";
import { getPoses, selectPoseIdx } from './main'
import { getImageUrl, URLDATAPIXEL } from './utils'
import { PoseCylinder } from './PoseCylinder'

export class ImagePanel{
    constructor(posesLength) {
        this.curPoseIdx = null
        this.playpauseInterval = null
        this.posesLength = posesLength;

        document.getElementById('btn-previous').onclick = e => {
            selectPoseIdx(this.curPoseIdx-1);
        }

        document.getElementById('btn-next').onclick = e => {
            selectPoseIdx(this.curPoseIdx+1);
        }

        document.getElementById('btn-playpause').onclick = e => {
            if(this.playpauseInterval){
                this.playpauseInterval = clearInterval(this.playpauseInterval);
            } else {
                preloadImagesOnce();
                if(this.curPoseIdx === this.posesLength-1 || this.curPoseIdx === null) this.curPoseIdx = -1; //if pressing btn when no pose selected or last one selected

                this.playpauseInterval = setInterval(() => {
                    if(this.curPoseIdx === this.posesLength-1)
                        this.playpauseInterval = clearInterval(this.playpauseInterval);
                    else
                        selectPoseIdx(this.curPoseIdx+1);
                }, 500);
            }
        }

        this.renderInfoNumPose(null)
    }

    renderInfoNumPose(){
        document.getElementById('info-num-pose').textContent = (this.curPoseIdx === null ? '-' : this.curPoseIdx+1)+"/"+this.posesLength;
    }

    async select(poseObj) {
        var $photoRgb = document.getElementById('photo-rgb');
        poseObj.data.rgb = await getImageUrl(poseObj.data.rgb)
        $photoRgb.src = poseObj.data.rgb

        var $photoDepth = document.getElementById('photo-depth');
        if(poseObj.data.depth) {
            poseObj.data.depth = await getImageUrl(poseObj.data.depth)
            $photoDepth.src = poseObj.data.depth
        } else {
            $photoDepth.src = URLDATAPIXEL
        }

        document.getElementById('info-text').textContent = JSON.stringify(poseObj.data.raw);
        this.curPoseIdx = poseObj.idxPose;
        this.renderInfoNumPose()
    }
}

var preloadImagesOnce = () => {
    getPoses().forEach(pose => {
        if(typeof pose.path !== 'string') return;
        var img=new Image();
        img.src=pose.path;
    })
    preloadImagesOnce = () => {}; //as that fct is called once
}

