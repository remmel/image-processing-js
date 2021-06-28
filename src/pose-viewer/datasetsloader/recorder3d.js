import {csv2objects} from "../csv.js";
import { Math, Euler, Quaternion, Vector3, Matrix4, Matrix3 } from 'three'
import { convertM3ToM4, downloadCsv, readOrFetchText, urlOrFileImage } from './datasetsloader'

//TODO sometimes the order is inverted (, depending of AREngine version or phone orientation?
export async function loadRecorder3D(url, files) {
    var poses = [];

    var text = await readOrFetchText(url, files, 'poses.csv', true)

    var items = csv2objects(text);
    items.forEach(item => {
        var q = new Quaternion(parseFloat(item.qx), parseFloat(item.qy), parseFloat(item.qz), parseFloat(item.qw));
        //rot x 180 - don't understand why the rotation provided by AREngine must be rotated by X_180° - in one of my AREngine dataset, no need to rotate it, strange..

        q.multiply(new Quaternion(1,0,0,0));

        var v3  = new Vector3(parseFloat(item.tx), parseFloat(item.ty), parseFloat(item.tz))
        // var m4 = new Matrix4().compose(v3, q, new Vector3(1,1,1))

        var fn = item.frame + "_image.jpg";

        poses.push({
            'id' : item.frame,
            'position': v3,
            'rotation': q,
            // 'rotation': (new Quaternion()).setFromRotationMatrix(m4),
            // 'position': (new Vector3()).setFromMatrixPosition(m4), //(e[12], e[13], e[14]),
            // 'rotation': new Euler(Math.degToRad(item.pitch), Math.degToRad(item.yaw), Math.degToRad(item.roll), 'YZX'), //right order
            'rgbFn' : fn,
            'rgb': urlOrFileImage(url, files, fn),
            'raw' : item,
        })
    });
    return poses;
}

/**
 * Export poses in csv format, in order to be compatible with https://github.com/remmel/hms-AREngine-demo
 * Only quaternion, not Euler, as we use here the default ThreeJS (XYZ) whereas AREngine is YZX
 */
export function exportCsv(poses, arengineformat = false) {
    var csv = "frame,tx,ty,tz,qx,qy,qz,qw,pitch,yaw,roll\n";

    poses.forEach(pose => { //item.rotation.x, item.rotation.y, item.rotation.z
        if(!pose.rotation instanceof Euler && !pose.rotation instanceof Quaternion)
            console.error("rotation must be Quaternion or Euler");
        // default euler order is different depending of the system, for ThreeJS it's XYZ and for AREngine it's YZX
        // to use that order: (new Euler(0,0,0,'YZX')).setFromQu...
        var euler = pose.rotation instanceof Euler ? pose.rotation : new Euler().setFromQuaternion(pose.rotation)
        var q = pose.rotation instanceof Quaternion ? pose.rotation : new Quaternion().setFromEuler(pose.rotation)

        if(arengineformat) {
            euler.reorder('YZX')
            q.multiply(new Quaternion(-1,0,0,0))
        }

        csv += [
            pose.id, //pose.rgbFn.substring(0, 8), //pose.path.split("/").pop(), //.split('_')[0], //frame
            pose.position.x, pose.position.y, pose.position.z, //tx ty tz
            q.x, q.y, q.z, q.w,//qx qy qz qw
            Math.radToDeg(euler.x), Math.radToDeg(euler.y), Math.radToDeg(euler.z) //pitch yaw roll
        ].join(',') + "\n";
    });
    downloadCsv(csv, "poses.csv");
}

