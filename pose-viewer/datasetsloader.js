import * as THREE from './copypaste/three.module.js';
import {OrbitControls} from './copypaste/OrbitControls.js';
import {csv2objects, rgbdtum2objects} from "./csv.js";
import {closest} from "./utils.js";
import {Euler, Matrix4, Quaternion, Vector3} from "./copypaste/three.module.js";
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

    var text = await(await fetch(url + '/posesPLY.csv')).text();
    var items = csv2objects(text);

    var i=0, nb = items.length;
    for(var item of items) {
        $loading.textContent = "loading "+ ++i + "/"+nb;
        item.mat4 = await fetchLubosMat(url, item.frame_id);
    }

    items.forEach(item => {
        poses.push({
            'mat4': item.mat4, //TODO transform matrix to postition and rotation here
            // 'position': new Vector3(item.mat4.elements[12], item.mat4.elements[13], item.mat4.elements[14]),
            // 'position': new Vector3(item.x, item.y, item.z),
            // 'rotation': new Euler(THREE.Math.degToRad(item.pitch), THREE.Math.degToRad(item.yaw), THREE.Math.degToRad(item.roll), 'YZX'),
            'path': url + "/" + item.frame_id.padStart(8, "0") + ".jpg", //set image path
            'data': item
        })
    })
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

async function loadAREngineRecorder(url) {
    var poses = [];
    var text = await(await fetch(url + '/poses.csv')).text();

    var items = csv2objects(text);
    items.forEach(item => {
        var quaternion = new THREE.Quaternion(parseFloat(item.qx), parseFloat(item.qy), parseFloat(item.qz), parseFloat(item.qw));
        var euler = new Euler();
        euler.setFromQuaternion(quaternion);
        
        // euler = new Euler(THREE.Math.degToRad(item.pitch), THREE.Math.degToRad(item.yaw), THREE.Math.degToRad(item.roll), 'YZX'); //right order

        poses.push({
            'position': new Vector3(item.tx, item.ty, item.tz),
            'rotation': euler,
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
    var maximagesdisplayed = 100;
    if(images.length > maximagesdisplayed) {
        var modulo = Math.floor(images.length / maximagesdisplayed); //limit display to maximagesdisplayed images
        console.warn("Has "+ images.length + " images to display, display only ~"+maximagesdisplayed + ", thus 1 image every "+modulo);
    }

    images.forEach(image => {
        if(i++%modulo!==0) return;
        var quaternion = new THREE.Quaternion(parseFloat(image.qx), parseFloat(image.qy), parseFloat(image.qz), parseFloat(image.qw));
        var rotation = new Euler();
        rotation.setFromQuaternion(quaternion);

        poses.push({
            'position': new Vector3(image.tx, image.ty, image.tz),
            'rotation': rotation,
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
        var r = item.pose.transform.rotation.map(parseFloat);
        var center = item.pose.transform.center;

        // var m = new Matrix3(); m.fromArray(r);
        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/
        var qw = Math.sqrt(1+r[0]+r[4]+r[8])/2;
        var w4 = 4*qw;
        var qx = (r[7] - r[5]) / w4;
        var qy = (r[2] - r[6]) / w4;
        var qz = (r[3] - r[1]) / w4;

        var quaternion = new THREE.Quaternion(qx, qy, qz, qw);
        var rotation = new Euler();
        rotation.setFromQuaternion(quaternion);

        var view = viewsByPoseId[item.poseId];

        var fn = view.path.split("/").pop();

        poses.push({
            'position': new Vector3(center[0], center[1], center[2]),
            'rotation': rotation, //Euler rotation
            'quaternion': quaternion, //Quaternion rotation
            'path': url + "/" + fn,
            'data' : item
        })
    });

    // console.log("csv", exportPosesRemmelAndroid(poses));

    return poses;
}

async function loadAgisoft(url) {
    var poses = [];
    var xml = await (await fetch(url + '/cameras.xml')).text();

    var document = (new X2JS()).xml_str2json(xml);

    document.document.chunk.cameras.camera.forEach(item => {
        var transform = item.transform.split(" ").map(parseFloat);

        var m = new Matrix4();
        m.fromArray(transform);
        m.transpose(); //or position.x = m.elements[3]; position.y = m.elements[7]; position.z = m.elements[11];

        var position = new Vector3();
        position.setFromMatrixPosition(m);
        position.x /= 10; //is not scale like reality, I assume it changes all the time
        position.y /= 10;
        position.z /= 10;

        var euler = (new Euler()).setFromRotationMatrix(m);

        var quaternion = new Quaternion();
        quaternion.setFromRotationMatrix(m);

        poses.push({
            'position': position,
            'rotation': euler, //Euler rotation
            'quaternion': quaternion, //Quaternion rotation
            'path': url + "/" + item._label + ".jpg",
            'data' : item
        })
    });

    // console.log("csv", exportPosesRemmelAndroid(poses));

    return poses;
}

//poses.csv to be compatible with https://github.com/remmel/hms-AREngine-demo
function exportPosesRemmelAndroid(poses) {
    var csv = "frame,tx,ty,tz,qx,qy,qz,qw,yaw,pitch,roll\n";
    poses.forEach(item => { //item.rotation.x, item.rotation.y, item.rotation.z
        var q = item.quaternion;
        if(!q) { //no quaternion set, calculate it from euler rotation
            q = new THREE.Quaternion();
            q.setFromEuler(item.rotation);
        }

        csv += [item.path, item.position.x, item.position.y, item.position.z, q.x, q.y, q.z, q.w].join(',') + "\n";
    });
    return csv;
}