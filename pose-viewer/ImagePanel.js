import {readAsDataURL} from "./form/formUtils.js";
import { getPoses, selectPoseIdx } from './main'

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

    select(poseObj) {
        var $photoRgb = document.getElementById('photo-rgb');
        if(typeof poseObj.data.rgb === 'string')
            $photoRgb.src = poseObj.data.rgb
        else if(poseObj.data.rgb instanceof File)
            readAsDataURL(poseObj.data.rgb).then(dataurl => $photoRgb.src = dataurl);


        var $photoDepth = document.getElementById('photo-depth');
        if(typeof poseObj.data.depth === 'string')
            $photoDepth.src = poseObj.data.depth
        else if(poseObj.data.depth instanceof File)
            readAsDataURL(poseObj.data.depth).then(dataurl => $photoDepth.src = dataurl);

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

