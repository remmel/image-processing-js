import {Euler, Matrix3, Matrix4, Quaternion, Vector3} from "three";
import {
    convertM3ToM4,
    downloadCsv,
    downloadXml,
    readOrFetchText,
    urlOrFileImage,
} from './datasetsloader'
import * as X2JS from 'x2js-fork'
import { getImageSize } from '../ImagePanelElt'
import { HONOR20VIEW_DEPTH_INTRINSICS } from '../../commons/rgbd/RgbdMeshLoader'

//import xml, export csv
export async function loadAgisoft(url, files) {
    var poses = [];

    var xml = await readOrFetchText(url, files, 'cameras.xml', true) //no default name for agisoft
    var document = (new X2JS()).xml_str2json(xml);

    var scale = 1; //TODO estimate default scale
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

        var fn = item._label + ".jpg"

        poses.push({
            'id': item._id,
            'position': position,
            'rotation': quaternion,
            'rgbFn' : fn,
            'rgb': urlOrFileImage(url, files, fn),
            'raw' : item
        })
    });

    return poses;
}

export function exportAgisoftReferenceCsv(poses){
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

        // TODO also output yaw,pitch,roll order compatible with Agisoft
        // //reorder
        // euler2 = (new Euler(0,0,0,'ZYX')).setFromQuaternion(q);
        // console.log([Math.radToDeg(euler2.x), Math.radToDeg(euler2.y), Math.radToDeg(euler2.z)])

        csv += [
            pose.rgbFn,
            pose.position.x, pose.position.y, pose.position.z, //tx ty tz
            Math.radToDeg(euler.x), Math.radToDeg(euler.y), Math.radToDeg(euler.z)
        ].join(',') + "\n";
    });
    downloadCsv(csv, "references.csv");
}

//TODO add other export which complete existing cameras.xml
export async function exportAgisoftXml(poses) {

    var cameraList = []
    poses.forEach(p => {
        var m4 = new Matrix4()
        m4.makeRotationFromQuaternion(p.rotation)
        m4.setPosition(p.position)

        // m4.invert() //should I?
        m4.transpose()
        cameraList.push({
            'transform': m4.elements.join(' '),
            '_id': p.id,
            '_sensor_id': 0,
            '_label': p.rgbFn.replace('.jpg', ''),
        })
    })

    //get resolution of 1 image
    var size = await getImageSize(poses[0].rgb)

    var hardcodedHonor20ViewFocal = Math.round(HONOR20VIEW_DEPTH_INTRINSICS.fx / HONOR20VIEW_DEPTH_INTRINSICS.w * size.width)

    var root = {
        'document': {
            '_version': '1.5.0',
            'chunk': {
                '_label': 'Chunk 1',
                '_enabled': true,
                'sensors': {
                    '_next_id': 1,
                    'sensor': {
                        'resolution': { '_width': size.width, '_height': size.height },
                        'property': { '_name': 'layer_index', '_value': '0' },
                        'bands': { 'band': [{ '_label': 'Red' }, { '_label': 'Green' }, { '_label': 'Blue' }] },
                        'data_type': 'uint8',
                        'calibration': {
                            'resolution': { '_width': size.width, '_height': size.height },
                            'f': hardcodedHonor20ViewFocal, //to put something, better to calibrate using chessboard (eg boofcv android app)
                            'cx': '0', //it's look this is diff with width/2
                            'cy': '0', //it's look this is diff with height/2
                            '_type': 'frame',
                            '_class': 'adjusted',
                        },
                        '_id': '0',
                        '_label': 'unknown',
                        '_type': 'frame',
                    },
                },
                'cameras': [{
                    '_next_id': poses.length,
                    '_next_group_id': 0,
                    'camera': cameraList,
                }],
            },
        },
    }

    downloadXml(root, "cameras_exported.xml");
}
