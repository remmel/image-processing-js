import {selectPoseScene} from "./scene3d.js";
import * as THREE from "./copypaste/three.module.js";
import {poses} from "./global.js";
import {readAsDataURL} from "./form.js"; //do not like that, getPoses instead or move action in main.js?

var playpauseInterval = null, curPose = null

document.getElementById('btn-previous').addEventListener('click', e => {
    selectPose(curPose-1);
})

document.getElementById('btn-next').addEventListener('click', e => {
    selectPose(curPose+1);
})

document.getElementById('btn-playpause').addEventListener('click', e => {
    if(playpauseInterval){
        playpauseInterval = clearInterval(playpauseInterval);
    } else {
        preloadImagesOnce();
        if(curPose === poses.length-1 || curPose === null) curPose = -1; //if pressing btn when no pose selected or last one selected

        playpauseInterval = setInterval(() => {
            if(curPose === poses.length-1)
                playpauseInterval = clearInterval(playpauseInterval);
            else
                selectPose(curPose+1);
        }, 500);
    }
})

var preloadImagesOnce = () => {
    poses.forEach(pose => {
        var img=new Image();
        img.src=pose.path;
    })
    preloadImagesOnce = () => {}; //as that fct is called once
}

//TODO split that with a part in main.js?
export function selectPose(idxPose) {
    if(idxPose < 0 || idxPose >= poses.length) return;
    document.getElementById('info-num-pose').textContent = (idxPose === null ? '-' : idxPose+1)+"/"+poses.length;
    if(idxPose === null) return;

    curPose = idxPose;
    var pose = poses[idxPose];

    var $photo = document.getElementById('photo');
    if(typeof pose.path === 'string')
        $photo.src = pose.path
    else if(pose.path instanceof File)
        readAsDataURL(pose.path).then(dataurl => $photo.src = dataurl);

    document.getElementById('info-text').textContent = JSON.stringify(pose.data);
    selectPoseScene(pose.mesh);
}