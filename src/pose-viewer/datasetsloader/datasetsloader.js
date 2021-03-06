import {Matrix4} from "three";
import {readAsText} from "../form/formUtils.js";
import {loadTum, exportTumAssociate} from "./rgbdtum.js";
import {exportAlicevision, loadAlicevision} from "./alicevision.js";
import {exportCsv, loadRecorder3D} from "./recorder3d.js";
import {loadAr3dplan} from "./ar3dplan.js";
import {loadLubos} from "./3dlivescanner.js";
import { exportAgisoftReferenceCsv, exportAgisoftXml, loadAgisoft } from './agisoft.js'
import * as X2JS from 'x2js-fork'
import { loadTsdfFusion } from './tsdfusion'

export const DATASET_TYPE = {
    RGBDTUM: 'RGBDTUM', //https://vision.in.tum.de/data/datasets/rgbd-dataset //eg https://vision.in.tum.de/rgbd/dataset/freiburg1/rgbd_dataset_freiburg1_desk2.tgz
    LUBOS: 'LUBOS', //https://play.google.com/store/apps/details?id=com.lvonasek.arcore3dscannerpro
    AR3DPLAN: 'AR3DPLAN', //https://github.com/remmel/ar3dplanphoto
    RECORDER3D: 'RECORDER3D', //https://github.com/remmel/hms-AREngine-demo
    ALICEVISION_SFM: 'ALICEVISION_SFM', //https://meshroom-manual.readthedocs.io/en/latest/node-reference/nodes/ConvertSfMFormat.html
    AGISOFT: 'AGISOFT', //Agilesoft Metashape format (File > Export > Export Cameras)
    TSDFFUSION: 'TSDFFUSION'
};

export const DATASET_TYPE_EXPORT = {
    FAST_FUSION: 'FAST_FUSION',
    ALICEVISION_SFM:'ALICEVISION_SFM',
    AGISOFT_CSV: 'AGISOFT_CSV',
    AGISOFT_XML: 'AGISOFT_XML',
    RECORDER3D: 'RECORDER3D',
    DEFAULT: 'DEFAULT'
}

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
export async function loadPoses(type, folder, files, onProgress) {
    var url = folderNameToUrl(folder);

    var poses = [];

    switch (type) {
        case DATASET_TYPE.RGBDTUM: poses = await loadTum(url, files); break;
        case DATASET_TYPE.AR3DPLAN: poses = await loadAr3dplan(url, files); break;
        case DATASET_TYPE.LUBOS: poses = await loadLubos(url, files, onProgress); break;
        case DATASET_TYPE.RECORDER3D: poses = await loadRecorder3D(url, files); break;
        case DATASET_TYPE.ALICEVISION_SFM: poses = await loadAlicevision(url, files); break;
        case DATASET_TYPE.AGISOFT: poses = await loadAgisoft(url, files); break;
        case DATASET_TYPE.TSDFFUSION: poses = await loadTsdfFusion(url, files); break;
        default: throw "Wrong dataset type:"+type;
    }

    poses = limitDisplayedPoses(poses, 1000);
    return poses;
}

export async function loadModel(folder, files) {
    var fn = 'model_low.ply';
    if(folder || files) return urlOrFileImage(folder, files, fn)
    throw new Error("should have folder or files")
}

function limitDisplayedPoses(poses, maximagesdisplayed) {
//limit the number of poses displayed
    var i = 0;
    var modulo = 1;
    if(poses.length > maximagesdisplayed) {
        modulo = Math.floor(poses.length / maximagesdisplayed); //limit display to maximagesdisplayed images
        console.warn("Has "+ poses.length + " images to display, display only ~"+maximagesdisplayed + ", thus 1 image every "+modulo);
    }

    var posesFiltered = [];

    for(var numPose in poses) {
        if(i++%modulo!==0) continue;
        var p = poses[numPose];
        posesFiltered.push(p);
    }
    return posesFiltered;
}

//read a file from an url or in Files API
export async function readOrFetchText(url, files, fn, displayError, ask) {
    var text = null;
    if(ask) {
        fn = prompt(fn, fn)
    }
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

/**
 * Set image path or reference to image file
 */
export function urlOrFileImage(urlFolder, files, fn) { //TODO handle properly f.webkitRelativePath
    return urlFolder ? urlFolder + '/' + fn : Array.from(files).find(f => f.name === fn || f.name === fn.split('/').pop())
}

//TODO not sure about that, specially the scale as I do later "position.x *= scale;"
// use compose instead ? new Matrix4()).compose(
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
        case DATASET_TYPE_EXPORT.FAST_FUSION:
            exportTumAssociate(poses); break;
        case DATASET_TYPE_EXPORT.ALICEVISION_SFM:
            exportAlicevision(poses); break;
        case DATASET_TYPE_EXPORT.AGISOFT_CSV:
            exportAgisoftReferenceCsv(poses); break;
        case DATASET_TYPE_EXPORT.AGISOFT_XML:
            exportAgisoftXml(poses); break;
        case DATASET_TYPE_EXPORT.RECORDER3D:
            exportCsv(poses, true); break;
        case DATASET_TYPE_EXPORT.DEFAULT:
        default:
            exportCsv(poses);
    }
}

export function downloadCsv(csv, fn) {
    var encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv)
    downloadData(encodedUri, fn)
}

export function downloadJson(obj, fn) {
    var encodedUri = encodeURI('data:text/json;charset=utf-8,' + JSON.stringify(obj, null, 4))
    downloadData(encodedUri, fn)
}

export function downloadXml(obj, fn) {
    var x2js = new X2JS()
    var xmlAsStr = x2js.json2xml_str(obj)
    var encodedUri = encodeURI('data:text/xml;charset=utf-8,' + xmlAsStr)
    downloadData(encodedUri, fn)
}

function downloadData(encodedUri, fn) {
    var link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', fn)
    document.body.appendChild(link) // Required for FF
    link.click()
}
