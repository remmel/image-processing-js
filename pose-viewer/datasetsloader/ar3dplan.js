import {Quaternion,Euler, Vector3} from "three";

export async function loadAr3dplan(url) {
    var poses = [];
    var data = await(await fetch(url + '/3dplanphoto.json')).json();

    data.list.forEach(item => {
        if (item.type !== "Photo") return;

        var quaternion = new Quaternion(item.rotation.x, item.rotation.y, item.rotation.z, item.rotation.w);
        quaternion.inverse();   //why?
        var euler = new Euler();
        euler.setFromQuaternion(quaternion);

        poses.push({
            'id' : null,
            'position': new Vector3(item.position.x, item.position.y, item.position.z),
            'rotation': euler, //new Euler(Math.degToRad(item.eulerAngles.x), Math.degToRad(item.eulerAngles.y), Math.degToRad(item.eulerAngles.z)),
            'rgbFn': item.name,
            'rgb': url + "/" + item.name,
            'raw' : item,
        })
    });
    return poses;
}
