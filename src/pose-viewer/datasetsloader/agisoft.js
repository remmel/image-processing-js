import {Euler, Math, Matrix3, Matrix4, Quaternion, Vector3} from "three";
import {convertM3ToM4, downloadCsv} from "./datasetsloader";

//import xml, export csv
export async function loadAgisoft(url) {
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
            'id': item._id,
            'position': position,
            'rotation': quaternion,
            'rgbFn' : item._label + ".jpg",
            'rgb': url + "/" + item._label + ".jpg",
            'raw' : item
        })
    });

    return poses;
}

export function exportAgisoftReference(poses){
    var csv = "label,tx,ty,tz,omega (x),phi (y),kappa (z)\n";
    poses.forEach(pose => {
        if(!pose.rotation instanceof Euler && !pose.rotation instanceof Quaternion)
            console.error("rotation must be Quaternion or Euler");
        // default euler order is different depending of the system, for ThreeJS it's XYZ and for AREngine it's YZX
        // to use that order: (new Euler(0,0,0,'YZX')).setFromQu...
        // var euler = pose.rotation instanceof Euler ? pose.rotation : new Euler().setFromQuaternion(pose.rotation);
        var q = pose.rotation instanceof Quaternion ? pose.rotation : new Quaternion().setFromEuler(pose.rotation);

        //ω,φ,κ omega,phi,kappa
        var q2 = q.clone()
        q2.multiply(new Quaternion(1,0,0,0)); //done also in arenginerecorder...
        var euler = (new Euler()).setFromQuaternion(q2);

        // TODO yaw,pitch,roll order compatible with Agisoft
        // //reorder
        // euler = (new Euler(0,0,0,'ZYX')).setFromQuaternion(q);
        // var eulerDegXZY = [Math.radToDeg(euler.z), Math.radToDeg(euler.y), Math.radToDeg(euler.x)]

        csv += [
            pose.rgbFn,
            pose.position.x, pose.position.y, pose.position.z, //tx ty tz
            Math.radToDeg(euler.x), Math.radToDeg(euler.y), Math.radToDeg(euler.z)
        ].join(',') + "\n";
    });
    downloadCsv(csv, "references.csv");
}
