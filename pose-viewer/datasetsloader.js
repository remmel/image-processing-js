import * as THREE from './copypaste/three.module.js';
import {OrbitControls} from './copypaste/OrbitControls.js';
import {csv2objects, rgbdtum2objects} from "./csv.js";
import {closest} from "./utils.js";
import {Euler, Vector3} from "./copypaste/three.module.js";

export const DATASET_TYPE = {
    LUBOS: 'lubos3dscanner', //https://play.google.com/store/apps/details?id=com.lvonasek.arcore3dscannerpro
    AR3DPLAN: 'ar3dplanphoto', //https://github.com/remmel/ar3dplanphoto
    RGBDTUM: 'rgbdtum', //https://vision.in.tum.de/data/datasets/rgbd-dataset //eg https://vision.in.tum.de/rgbd/dataset/freiburg1/rgbd_dataset_freiburg1_desk2.tgz
    ARENGINERECORDER: 'arenginerecorder' //https://github.com/remmel/hms-AREngine-demo
};

export async function loadPoses(type, folder) {
    switch (type) {
        case DATASET_TYPE.RGBDTUM: return await loadTum(folder);
        case DATASET_TYPE.AR3DPLAN: return await loadAr3dplan(folder);
        case DATASET_TYPE.LUBOS: return await loadLubos(folder);
        case DATASET_TYPE.ARENGINERECORDER: return await loadAREngineRecorder(folder)
    }
    throw "Wrong dataset type:"+type;
}

async function loadLubos(folder) {
    var poses = [];
    var text = await(await fetch('./' + folder + '/posesOBJ.csv')).text();
    var items = csv2objects(text);
    items.forEach(item => {
        poses.push({
            'position': new Vector3(item.x, item.y, item.z),
            'rotation': new Euler(THREE.Math.degToRad(item.yaw), THREE.Math.degToRad(item.pitch), THREE.Math.degToRad(item.roll)),
            'path': folder + "/" + item.frame_id.padStart(8, "0") + ".jpg", //set image path
            'data': item
        })
    })
    return poses;
}

async function loadAr3dplan(folder) {
    var poses = [];
    var data = await(await fetch('./' + folder + '/3dplanphoto_objs.json')).json();

    data.list.forEach(item => {
        if (item.type !== "Photo") return;

        poses.push({
            'position': new Vector3(item.position.x, item.position.y, item.position.z),
            'rotation': new Euler(THREE.Math.degToRad(item.eulerAngles.x), THREE.Math.degToRad(item.eulerAngles.y), THREE.Math.degToRad(item.eulerAngles.z)),
            'path': folder + "/" + item.name,
            'data' : item,
        })
    });
    return poses;
}

async function loadAREngineRecorder(folder) {
    var poses = [];
    var text = await(await fetch('./' + folder + '/poses.csv')).text();

    var items = csv2objects(text);
    items.forEach(item => {
        var quaternion = new THREE.Quaternion(parseFloat(item.qx), parseFloat(item.qy), parseFloat(item.qz), parseFloat(item.qw));
        var euler = new Euler();
        euler.setFromQuaternion(quaternion);

        poses.push({
            'position': new Vector3(item.tx, item.ty, item.tz),
            'rotation': euler,
            'path': folder + "/" + item.frame + "_image.jpg",
            'data' : item,
        })
    });
    return poses;
}

async function loadTum(folder) {
    var poses = [];

    var images = await fetchAndAssociateRgbdTum(folder);

    var i = 0;
    images.forEach(image => {
        if(i++%5!==0) return; //one image out of 5
        var quaternion = new THREE.Quaternion(parseFloat(image.qx), parseFloat(image.qy), parseFloat(image.qz), parseFloat(image.qw));
        var rotation = new Euler();
        rotation.setFromQuaternion(quaternion);

        poses.push({
            'position': new Vector3(image.tx, image.ty, image.tz),
            'rotation': rotation,
            'path': folder + "/" + image.rgb_fn,
            'data' : image,
        });

    })
    return poses;
}

// get associated.txt data. If file missing get data from rgb.txt and groundtruth.txt
async function fetchAndAssociateRgbdTum(rgbd) {
    var response = await fetch('./' + rgbd + '/associate.txt');
    if(response.ok) { //already associated no need
        var text = await response.text();
        text = "pose_ts tx ty tz qx qy qz qw depth_ts depth_fn rgb_ts rgb_fn\n" + text;
        var images = csv2objects(text, ' ');
        return images;
    } else {
        console.warn("Missing associate.txt, will try to associate rgb.txt and groundtruth.txt");
        var rgbText = await fetch('./' + rgbd + '/rgb.txt').then(response => response.text());
        var groundtruthText = await fetch('./' + rgbd + '/groundtruth.txt').then(response => response.text());

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