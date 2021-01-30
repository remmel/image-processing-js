import {Matrix4} from "../../modules/three.js";
import {readAsText} from "../form/formUtils.js";
import {loadTum, exportTumAssociate} from "./rgbdtum.js";
import {exportAlicevision, loadAlicevision} from "./alicevision.js";
import {exportAREngineRecorder, loadAREngineRecorder} from "./arenginerecorder.js";
import {loadAr3dplan} from "./ar3dplan.js";
import {loadLubos} from "./3dlivescanner.js";
import {loadAgisoft} from "./agisoft.js";

export const DATASET_TYPE = {
    RGBDTUM: 'RGBDTUM', //https://vision.in.tum.de/data/datasets/rgbd-dataset //eg https://vision.in.tum.de/rgbd/dataset/freiburg1/rgbd_dataset_freiburg1_desk2.tgz
    LUBOS: 'LUBOS', //https://play.google.com/store/apps/details?id=com.lvonasek.arcore3dscannerpro
    AR3DPLAN: 'AR3DPLAN', //https://github.com/remmel/ar3dplanphoto
    ARENGINERECORDER: 'ARENGINERECORDER', //https://github.com/remmel/hms-AREngine-demo
    ALICEVISION_SFM: 'ALICEVISION_SFM', //https://meshroom-manual.readthedocs.io/en/latest/node-reference/nodes/ConvertSfMFormat.html
    AGISOFT: 'AGISOFT', //Agilesoft Metashape format (File > Export > Export Cameras)
};

export const DATASET_TYPE_EXPORT = {
    LUBOS: DATASET_TYPE.LUBOS,
    ALICEVISION_SFM: DATASET_TYPE.ALICEVISION_SFM
};

/**
 * if "dataset/monstree" => "./dataset/monstree"
 * if "http://website.com/dataset/monstree" => http://website.com/dataset/monstree"
 */
function folderNameToUrl(folder) {
    if (!folder) return null;
    var isUrl = folder.startsWith('http://') || folder.startsWith('https://');
    return isUrl ? folder : './' + folder;
}

// folder or file
export async function loadPoses(type, folder, files) {
    var url = folderNameToUrl(folder);

    switch (type) {
        case DATASET_TYPE.RGBDTUM: return await loadTum(url, files);
        case DATASET_TYPE.AR3DPLAN: return await loadAr3dplan(url, files);
        case DATASET_TYPE.LUBOS: return await loadLubos(url, files);
        case DATASET_TYPE.ARENGINERECORDER: return await loadAREngineRecorder(url, files);
        case DATASET_TYPE.ALICEVISION_SFM: return await loadAlicevision(url, files);
        case DATASET_TYPE.AGISOFT: return await loadAgisoft(url, files);
    }
    throw "Wrong dataset type:"+type;
}

//read a file from an url or in Files API
export async function readOrFetchText(url, files, fn, displayError) {
    var text = null;
    if(url) {
        var response = await fetch(url + '/' + fn);
        text = response.ok ? await(response).text() : null;
    } else if(files) {
        var f = Array.from(files).find(f => f.name === fn);
        text = f ? await readAsText(f) : null;
    } else
        console.error('no url and no files, should not happen');

    if(text === null) {
        var error = "File "+fn+" not found. Did you selected it?";
        console.warn(error);
        if(displayError) { alert(error); throw error;} //catch instead?
    }
    return text;
}

//TODO not sure about that, specially the scale as I do later "position.x *= scale;"
export function convertM3ToM4(m3, translation, scale) {
    var m4 = new Matrix4();
    var m3arr = m3.elements;
    m4.fromArray([
        m3arr[0], m3arr[1], m3arr[2], translation.x/scale,
        m3arr[3], m3arr[4], m3arr[5], translation.y/scale,
        m3arr[6], m3arr[7], m3arr[8], translation.z/scale,
        0,0,0,1
    ]);
    return m4;
}

export function exportPoses(poses, exportType){
    switch (exportType) {
        case 'FAST_FUSION':
            exportTumAssociate(poses); break;
        case 'ALICEVISION_SFM':
            exportAlicevision(poses); break;
        case 'AGISOFT': //more or less same than default (to check)
        default:
            exportAREngineRecorder(poses);
    }
}

export function downloadCsv(csv, fn) {
    var encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fn);
    document.body.appendChild(link); // Required for FF
    link.click()
}

export function downloadJson(obj, fn) {
    var encodedUri = encodeURI("data:text/json;charset=utf-8," + JSON.stringify(obj, null, 4));
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fn);
    document.body.appendChild(link); // Required for FF
    link.click()
}