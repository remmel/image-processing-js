import {Matrix3, Matrix4, Quaternion, Vector3} from "../../modules/three.js";

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
            'data' : item
        })
    });

    return poses;
}