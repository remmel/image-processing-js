import {Matrix3, Vector3, Quaternion} from "three";
import {browseFile} from "../form/formUtils.js";
import {convertM3ToM4, downloadJson, readOrFetchText, urlOrFileImage} from "./datasetsloader.js";

export async function loadAlicevision(url, files) {
    var poses = [];
    var data = JSON.parse(await readOrFetchText(url, files, 'cameras.sfm', true));

    var viewsByPoseId = {};

    data.views.forEach(item => {
        viewsByPoseId[item.poseId] = item;
    });

    data.poses.forEach(item => {
        var m3 = new Matrix3().fromArray(item.pose.transform.rotation.map(parseFloat));
        var m4 = convertM3ToM4(m3,  new Vector3());
        m4.transpose();

        var view = viewsByPoseId[item.poseId];
        var fn = view.path.split("/").pop();

        poses.push({
            'id' : item.poseId,
            'position': new Vector3().fromArray(item.pose.transform.center.map(parseFloat)),
            'rotation': new Quaternion().setFromRotationMatrix(m4), //ThreeJs should let us use directly m3! and why is that transposed?
            'rgbFn' : fn,
            'rgb': urlOrFileImage(url, files, fn),
            'raw' : item
        })
    });

    return poses;
}

export async function exportAlicevision(poses) {
    alert("Load cameraInit.sfm (to have same viewId and poseId)"); //or cameras.sfm?
    var camerasSfm = JSON.parse(await browseFile());

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

        var m3 = new Matrix3(); //TODO use quaternion instead
        m3.setFromMatrix4(pose.raw.mat4);

        newalicevisionposes.push({
            'poseId': poseId,
            'pose' : {
                'transform' : {
                    'rotation' : m3.elements,
                    'center' : pose.position.toArray(),
                },
                'locked' : '1'
            }
        })
    });

    camerasSfm.poses = newalicevisionposes;
    delete camerasSfm['featuresFolders'];
    delete camerasSfm['matchesFolders'];

    downloadJson(camerasSfm, 'camerasWithPoses.sfm');
    //https://github.com/alicevision/meshroom/wiki/Using-known-camera-positions

    console.log(camerasSfm);
}
