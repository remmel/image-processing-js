import {Quaternion,Euler, Vector3} from "three";
import {readOrFetchText, urlOrFileImage} from "./datasetsloader";

export async function loadAr3dplan(url, files) {
    var poses = [];
    var json = await readOrFetchText(url, files, '3dplanphoto.json')
    var data = JSON.parse(json)

    data.list.forEach(item => {
        if (item.type !== "Photo") return;

        var quaternion = new Quaternion(item.rotation.x, item.rotation.y, item.rotation.z, item.rotation.w);
        quaternion.inverse();   //why?
        var euler = new Euler();
        euler.setFromQuaternion(quaternion);

        var fn = item.name

        poses.push({
            'id' : null,
            'position': new Vector3(item.position.x, item.position.y, item.position.z),
            'rotation': euler, //new Euler(Math.degToRad(item.eulerAngles.x), Math.degToRad(item.eulerAngles.y), Math.degToRad(item.eulerAngles.z)),
            'rgbFn': fn,
            'rgb': urlOrFileImage(url, files, fn),
            'raw' : item,
        })
    });
    return poses;
}
