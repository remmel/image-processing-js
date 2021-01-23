import {csv2objects} from "../csv.js";
import {Euler, Quaternion, Vector3} from "../copypaste/three.module.js";
import * as THREE from "../copypaste/three.module.js";

//TODO sometimes the order is inverted (, depending of AREngine version or phone orientation?
export async function loadAREngineRecorder(url) {
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

        var fn = item.frame + "_image.jpg";

        poses.push({
            'id' : item.frame,
            'position': new Vector3(item.tx, item.ty, item.tz),
            'rotation': q,
            // 'rotation': new Euler(THREE.Math.degToRad(item.pitch), THREE.Math.degToRad(item.yaw), THREE.Math.degToRad(item.roll), 'YZX'), //right order
            'rgbFn' : fn,
            'rgb': url + "/" + fn,
            'data' : item,
        })
    });
    return poses;
}

/**
 * Export poses in csv format, in order to be compatible with https://github.com/remmel/hms-AREngine-demo
 * Only quaternion, not Euler, as we use here the default ThreeJS (XYZ) whereas AREngine is YZX
 */
export function exportAREngineRecorder(poses) {
    var csv = "frame,tx,ty,tz,qx,qy,qz,qw,pitch,yaw,roll\n";

    poses.forEach(pose => { //item.rotation.x, item.rotation.y, item.rotation.z
        if(!pose.rotation instanceof Euler && !pose.rotation instanceof Quaternion)
            console.error("rotation must be Quaternion or Euler");
        // default euler order is different depending of the system, for ThreeJS it's XYZ and for AREngine it's YZX
        // to use that order: (new Euler(0,0,0,'YZX')).setFromQu...
        var euler = pose.rotation instanceof Euler ? pose.rotation : new Euler().setFromQuaternion(pose.rotation);
        var q = pose.rotation instanceof Quaternion ? pose.rotation : new Quaternion().setFromEuler(pose.rotation);

        csv += [
            pose.path.split("/").pop(), //.split('_')[0], //frame
            pose.position.x, pose.position.y, pose.position.z, //tx ty tz
            q.x, q.y, q.z, q.w,//qx qy qz qw
            THREE.Math.radToDeg(euler.x), THREE.Math.radToDeg(euler.y), THREE.Math.radToDeg(euler.z) //pitch yaw roll
        ].join(',') + "\n";
    });
    downloadCsv(csv, "poses.csv");
}