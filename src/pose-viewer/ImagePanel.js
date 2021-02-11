import { getPoses, selectPoseIdx } from './main'
import { getImageUrl, URLDATAPIXEL } from './utils'

export default class ImagePanel{
    /** @param {number} posesLength */
    constructor(posesLength) {
        this.curPoseIdx = null
        this.curPose = null
        this.playpauseInterval = null
        this.posesLength = posesLength;

        document.getElementById('btn-previous').onclick = e => selectPoseIdx(this.curPoseIdx-1)
        document.getElementById('btn-next').onclick = e => selectPoseIdx(this.curPoseIdx+1)
        document.getElementById('btn-playpause').onclick = e => this.playpause()
        // document.getElementById('btn-target').onclick = e => cameraOnPose(this.curPose)

        this.renderInfoNumPose(null)
    }

    renderInfoNumPose(){
        document.getElementById('info-num-pose').textContent = (this.curPoseIdx === null ? '-' : this.curPoseIdx+1)+"/"+this.posesLength;
    }

    /** @param {PoseCylinder} poseObj */
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
        this.curPose = poseObj
        this.renderInfoNumPose()
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
                    selectPoseIdx(this.curPoseIdx+1);
            }, 500);
        }
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

