import * as THREE from "../copypaste/three.module.js";
import {browseFile} from "../form.js";
import {convertM3ToM4, downloadJson} from "./datasetsloader.js";

export async function loadAlicevision(url) {
    var poses = [];
    var data = await(await fetch(url + '/sfm.json')).json();

    var viewsByPoseId = {};

    data.views.forEach(item => {
        viewsByPoseId[item.poseId] = item;
    });

    data.poses.forEach(item => {
        var m3 = new THREE.Matrix3().fromArray(item.pose.transform.rotation.map(parseFloat));
        var m4 = convertM3ToM4(m3,  new THREE.Vector3());
        m4.transpose();

        var view = viewsByPoseId[item.poseId];
        var fn = view.path.split("/").pop();

        poses.push({
            'position': new THREE.Vector3().fromArray(item.pose.transform.center.map(parseFloat)),
            'rotation': new THREE.Quaternion().setFromRotationMatrix(m4), //ThreeJs should let us use directly m3! and why is that transposed?
            'path': url + "/" + fn,
            'data' : item
        })
    });

    return poses;
}

export async function exportAlicevision(poses) {
    alert("Load cameraInit.sfm (to have same viewId and poseId)"); //or cameras.sfm?
    // var url = "dataset/20210113_182314.dataset/mr2020/MeshroomCache/StructureFromMotion/90d8f247280881f623f416a361924d03f4fbaf71/cameras.sfm";
    // var camerasSfm = await(await fetch(url)).json();

    var txt  = await browseFile();
    var camerasSfm = JSON.parse(txt);

    var fn2PoseId = [];
    camerasSfm.views.forEach(view => {
        var path = view.path;
        var fn = path.substring(path.lastIndexOf('/') + 1);
        fn2PoseId[fn] = view.poseId;
    });

    var newalicevisionposes = [];

    poses.forEach(pose => {
        var rgbFn = pose.rgbFn;
        var poseId = fn2PoseId[rgbFn];

        var m3 = new THREE.Matrix3(); //TODO use quaternion instead
        m3.setFromMatrix4(pose.data.mat4);

        newalicevisionposes.push({
            'poseId': poseId,
            'pose' : {
                'transform' : {
                    'rotation' : m3.elements,
                    'center' : pose.mesh.position.toArray(),
                },
                'locked' : '1'
            }
        })
    });

    camerasSfm.poses = newalicevisionposes;
    // delete camerasSfm['featuresFolders'];
    // delete camerasSfm['matchesFolders'];

    downloadJson(camerasSfm, 'camerasWithPoses.sfm');
    //https://github.com/alicevision/meshroom/wiki/Using-known-camera-positions

    console.log(camerasSfm);
}