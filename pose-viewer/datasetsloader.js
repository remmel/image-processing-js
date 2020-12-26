import * as THREE from './copypaste/three.module.js';
import {OrbitControls} from './copypaste/OrbitControls.js';
import {csv2objects, rgbdtum2objects} from "./csv.js";
import {closest} from "./utils.js";
import {Euler, Matrix3, Matrix4, Quaternion, Vector3} from "./copypaste/three.module.js";
import {csv2arrays} from "./csv.js";

export const DATASET_TYPE = {
    RGBDTUM: 'RGBDTUM', //https://vision.in.tum.de/data/datasets/rgbd-dataset //eg https://vision.in.tum.de/rgbd/dataset/freiburg1/rgbd_dataset_freiburg1_desk2.tgz
    LUBOS: 'LUBOS', //https://play.google.com/store/apps/details?id=com.lvonasek.arcore3dscannerpro
    AR3DPLAN: 'AR3DPLAN', //https://github.com/remmel/ar3dplanphoto
    ARENGINERECORDER: 'ARENGINERECORDER', //https://github.com/remmel/hms-AREngine-demo
    ALICEVISION_SFM: 'ALICEVISION_SFM', //https://meshroom-manual.readthedocs.io/en/latest/node-reference/nodes/ConvertSfMFormat.html
    AGISOFT: 'AGISOFT', //Agilesoft Metashape format (File > Export > Export Cameras)
};

export async function loadPoses(type, folder) {
    var isUrl = folder.startsWith('http://') || folder.startsWith('https://');

    var url = isUrl ? folder : './' + folder;

    switch (type) {
        case DATASET_TYPE.RGBDTUM: return await loadTum(url);
        case DATASET_TYPE.AR3DPLAN: return await loadAr3dplan(url);
        case DATASET_TYPE.LUBOS: return await loadLubos(url);
        case DATASET_TYPE.ARENGINERECORDER: return await loadAREngineRecorder(url);
        case DATASET_TYPE.ALICEVISION_SFM: return await loadAliceVisionSfm(url);
        case DATASET_TYPE.AGISOFT: return await loadAgisoft(url);
    }
    throw "Wrong dataset type:"+type;
}

//TODO avoid using thoses .mat files to avoid http calls
async function loadLubos(url) {
    var poses = [];
    var $loading = document.getElementById('loading');

    var text = await(await fetch(url + '/posesPLY.csv')).text(); //PLY: position(x,z,-y)
    var items = csv2objects(text);

    var i=0, nb = items.length;
    for(var item of items) {
        $loading.textContent = "loading "+ ++i + "/"+nb;
        item.mat4 = await fetchLubosMat(url, item.frame_id);

        poses.push({
            //MAT
            'rotation': (new Quaternion()).setFromRotationMatrix(item.mat4),
            'position': (new Vector3()).setFromMatrixPosition(item.mat4), //(e[12], e[13], e[14]),

            // //PLY - doesn't work has wrong rotation
            // 'position': new Vector3(item.x, item.z, -item.y),
            // 'rotation': new Euler(THREE.Math.degToRad(item.pitch), THREE.Math.degToRad(item.yaw), THREE.Math.degToRad(item.roll), 'YZX'),

            'path': url + "/" + item.frame_id.padStart(8, "0") + ".jpg", //set image path
            'data': item
        })
    }

    return poses;
}

async function fetchLubosMat(url, frameId) {
    var fn = frameId.padStart(8, "0") + '.mat';//?t'+ (new Date().toISOString());
    var text = await(await fetch(url + "/" + fn)).text();
    var arrays = csv2arrays(text, ' ', true);
    var array0_3 = [...arrays[0], ...arrays[1], ...arrays[2], ...arrays[3]]

    var mat4 = new Matrix4();
    mat4.fromArray(array0_3);
    return mat4;
}

async function loadAr3dplan(url) {
    var poses = [];
    var data = await(await fetch(url + '/3dplanphoto.json')).json();

    data.list.forEach(item => {
        if (item.type !== "Photo") return;

        var quaternion = new THREE.Quaternion(item.rotation.x, item.rotation.y, item.rotation.z, item.rotation.w);
        quaternion.inverse();   //why?
        var euler = new Euler();
        euler.setFromQuaternion(quaternion);

        poses.push({
            'position': new Vector3(item.position.x, item.position.y, item.position.z),
            'rotation': euler, //new Euler(THREE.Math.degToRad(item.eulerAngles.x), THREE.Math.degToRad(item.eulerAngles.y), THREE.Math.degToRad(item.eulerAngles.z)),
            'path': url + "/" + item.name,
            'data' : item,
        })
    });
    return poses;
}

//TODO sometimes the order is inverted (, depending of AREngine version or phone orientation?
async function loadAREngineRecorder(url) {
    var poses = [];
    var fn = 'poses.csv';
    var response = await fetch(url + '/'+fn);
    if(!response.ok) {
        alert("missing poses file "+fn);
        return [];
    }
    var text = await(response).text();

    var items = csv2objects(text);
    items.forEach(item => {
        var q = new Quaternion(parseFloat(item.qx), parseFloat(item.qy), parseFloat(item.qz), parseFloat(item.qw));
        //rot x 180 - don't understand why the rotation provided by AREngine must be rotated by X_180° - in one of my AREngine dataset, no need to rotate it, strange..
        q.multiply(new Quaternion(1,0,0,0));

        poses.push({
            'position': new Vector3(item.tx, item.ty, item.tz),
            'rotation': q,
            // 'rotation': new Euler(THREE.Math.degToRad(item.pitch), THREE.Math.degToRad(item.yaw), THREE.Math.degToRad(item.roll), 'YZX'), //right order
            'path': url + "/" + item.frame + "_image.jpg",
            'data' : item,
        })
    });
    return poses;
}

async function loadTum(url) {
    var poses = [];

    var images = await fetchAndAssociateRgbdTum(url);

    var i = 0;

    var modulo = 1;
    var maximagesdisplayed = 100; //TODO move that outside to use that feature for all dataset type
    if(images.length > maximagesdisplayed) {
        var modulo = Math.floor(images.length / maximagesdisplayed); //limit display to maximagesdisplayed images
        console.warn("Has "+ images.length + " images to display, display only ~"+maximagesdisplayed + ", thus 1 image every "+modulo);
    }

    images.forEach(image => {
        if(i++%modulo!==0) return;

        poses.push({
            'position': new Vector3(image.tx, image.ty, image.tz),
            'rotation': new THREE.Quaternion(parseFloat(image.qx), parseFloat(image.qy), parseFloat(image.qz), parseFloat(image.qw)),
            'path': url + "/" + image.rgb_fn,
            'data' : image,
        });

    })
    return poses;
}

// get associated.txt data. If file missing get data from rgb.txt and groundtruth.txt
async function fetchAndAssociateRgbdTum(url) {
    var response = await fetch(url + '/associate.txt');
    if(response.ok) { //already associated no need
        var text = await response.text();
        text = "pose_ts tx ty tz qx qy qz qw depth_ts depth_fn rgb_ts rgb_fn\n" + text;
        var images = csv2objects(text, ' ');
        return images;
    } else {
        console.warn("Missing associate.txt, will try to associate rgb.txt and groundtruth.txt");
        var rgbText = await fetch(url + '/rgb.txt').then(response => response.text());
        var groundtruthText = await fetch(url + '/groundtruth.txt').then(response => response.text());

        var rgbs = rgbdtum2objects(rgbText);
        var poses = rgbdtum2objects(groundtruthText);
        var posesAssoc = [];
        poses.forEach(item => { //array to assoc with ts as key
            var key = Math.floor(parseFloat(item.timestamp)*1000);
            item.timestamp_ms = key;
            posesAssoc[key] = item;
        });

        var images = [];

        var posesTimestamps = Object.keys(posesAssoc);
        rgbs.forEach(rgb => {
            var rgbTs = Math.floor(parseFloat(rgb.timestamp)*1000);
            var poseTs = closest(posesTimestamps, rgbTs);
            var pose = posesAssoc[poseTs];

            images.push({
                ...rgb,
                ...pose,
                pose_ts: pose.timestamp,
                rgb_ts: rgb.timestamp,
                rgb_fn: rgb.filename,
                debug_ts: poseTs
            })
        });
        return images;
    }
}

async function loadAliceVisionSfm(url) {
    var poses = [];
    var data = await(await fetch(url + '/sfm.json')).json();

    var viewsByPoseId = {};

    data.views.forEach(item => {
        viewsByPoseId[item.poseId] = item;
    });

    data.poses.forEach(item => {
        var m3 = new THREE.Matrix3().fromArray(item.pose.transform.rotation.map(parseFloat));
        var m4 = convertM3ToM4(m3,  new Vector3());
        m4.transpose();

        var view = viewsByPoseId[item.poseId];
        var fn = view.path.split("/").pop();

        poses.push({
            'position': new Vector3().fromArray(item.pose.transform.center.map(parseFloat)),
            'rotation': new THREE.Quaternion().setFromRotationMatrix(m4), //ThreeJs should let us use directly m3! and why is that transposed?
            'path': url + "/" + fn,
            'data' : item
        })
    });

    return poses;
}

//TODO not sure about that, specially the scale as I do later "position.x *= scale;"
function convertM3ToM4(m3, translation, scale) {
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

async function loadAgisoft(url) {
    var poses = [];

    var fn = "cameras.xml"; //no default name for agisoft
    var response = await fetch(url + '/' + fn);
    if(!response.ok) {
        alert("missing poses file "+fn);
        return [];
    }
    var xml = await (response).text();
    var document = (new X2JS()).xml_str2json(xml);

    var scale = 0.1; //TODO estimate default scale
    var transformWorld = null;
    if(document.document.chunk.transform) {
        var transform = document.document.chunk.transform;
        if (transform.scale)
            scale = parseFloat(transform.scale.__text);

        if (transform.rotation && transform.scale && transform.translation) {
            var rotationWorld = new Matrix3().fromArray(transform.rotation.__text.split(' ').map(parseFloat));
            var translationWorld = new Vector3().fromArray(transform.translation.__text.split(' ').map(parseFloat));
            transformWorld = convertM3ToM4(rotationWorld, translationWorld, scale);
        }
    }

    //TODO add 1st expected pose, to place calculated pose according to the expected one, in order to have right world position and world rotation
    document.document.chunk.cameras.camera.forEach(item => {
        if(!item.transform) return; //agisoft was not able to align that camera
        var transform = item.transform.split(' ').map(parseFloat);

        var m = new Matrix4();
        m.fromArray(transform);
        if(transformWorld)
            m = m.multiply(transformWorld);
        m.transpose();

        var position = new Vector3().setFromMatrixPosition(m);
        position.x *= scale;
        position.y *= scale;
        position.z *= scale;

        var quaternion = new Quaternion().setFromRotationMatrix(m);

        poses.push({
            'position': position,
            'rotation': quaternion,
            'path': url + "/" + item._label + ".jpg",
            'data' : item
        })
    });

    return poses;
}

/**
 * Export poses in csv format, in order to be compatible with https://github.com/remmel/hms-AREngine-demo
 * Only quaternion, not Euler, as we use here the default ThreeJS (XYZ) whereas AREngine is YZX
 */
export function exportPosesRemmelAndroid(poses) {
    var csv = "frame,tx,ty,tz,qx,qy,qz,qw,pitch,yaw,roll\n";

    poses.forEach(pose => { //item.rotation.x, item.rotation.y, item.rotation.z
        if(!pose.rotation instanceof Euler && !pose.rotation instanceof Quaternion)
            console.error("rotation must be Quaternion or Euler");
        // default euler order is different depending of the system, for ThreeJS it's XYZ and for AREngine it's YZX
        // to use that order: (new Euler(0,0,0,'YZX')).setFromQu...
        var euler = pose.rotation instanceof Euler ? pose.rotation : new Euler().setFromQuaternion(pose.rotation);
        var q = pose.rotation instanceof Quaternion ? pose.rotation : new Quaternion().setFromEuler(pose.rotation);

        csv += [
            pose.path.split("/").pop(), //.split('_')[0],
            pose.position.x, pose.position.y, pose.position.z,
            q.x, q.y, q.z, q.w,
            THREE.Math.radToDeg(euler.x), THREE.Math.radToDeg(euler.y), THREE.Math.radToDeg(euler.z)
        ].join(',') + "\n";
    });
    return csv;
}