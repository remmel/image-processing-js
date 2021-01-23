import {selectPoseScene} from "./scene3d.js";
import {poses} from "./main.js"; //do not like that, getPoses instead or move action in main.js?
import {readAsDataURL} from "./form/formUtils.js";

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
        if(typeof pose.path !== 'string') return;
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

    console.log('pose selected:', pose);

    var $photo = document.getElementById('photo');
    if(typeof pose.rgb === 'string')
        $photo.src = pose.rgb
    else if(pose.rgb instanceof File)
        readAsDataURL(pose.rgb).then(dataurl => $photo.src = dataurl);

    document.getElementById('info-text').textContent = JSON.stringify(pose.data);
    selectPoseScene(pose.mesh);
}