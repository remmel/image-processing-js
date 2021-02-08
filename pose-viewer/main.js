import { exportPoses, loadModel, loadPoses } from './datasetsloader/datasetsloader.js'
import {getFormImportTypeLocal, getImportForm} from "./form/formImport.js";
import {init3dscene, renderPoses} from './scene3d.js';
import {getFormExportType} from "./form/formExport.js";
import css from './main.css'
import { ImagePanel } from './ImagePanel'
import { PoseCylinder } from './PoseCylinder'

var poses = [];
var imgPanel = null;

(async function () {
    var {datasetType, datasetFolder, scale} = getImportForm();
    init3dscene(datasetType);
    poses = await loadPoses(datasetType, datasetFolder, null);
    var model = await loadModel(datasetFolder, null)
    renderPosesMain(poses, model, datasetType, scale);
})();

document.getElementsByName('files-import').forEach(el => el.addEventListener('change', async e => {
    var datasetType = getFormImportTypeLocal(); //should autodetect the format?
    poses = await loadPoses(datasetType, null, e.target.files);
    var model = await loadModel(null, e.target.files)
    renderPosesMain(poses, model, datasetType, 1);
}));

document.getElementsByName('export')[0].addEventListener('click', e => {
    var exportType = getFormExportType();
    exportPoses(poses, exportType);
})


export function getPoses (){
    return poses;
}

function renderPosesMain(poses, model, datasetType, scale) {
    renderPoses(poses, model, datasetType, scale);
    imgPanel = new ImagePanel(poses.length)
    setTimeout(() => {selectPoseObj(poses[0].object)}, 1000)
}

export function selectPoseIdx(idxPose) {
    if(idxPose < 0 || idxPose >= poses.length || idxPose === null) return false;
    var pose = poses[idxPose];
    selectPoseObj(pose.object);
}

export async function selectPoseObj(poseObj) {
    console.log('main.selectPoseObj', poseObj)
    await imgPanel.select(poseObj)
    poseObj.select()
}
