import * as THREE from "../copypaste/three.module.js";

export async function loadAr3dplan(url) {
    var poses = [];
    var data = await(await fetch(url + '/3dplanphoto.json')).json();

    data.list.forEach(item => {
        if (item.type !== "Photo") return;

        var quaternion = new THREE.Quaternion(item.rotation.x, item.rotation.y, item.rotation.z, item.rotation.w);
        quaternion.inverse();   //why?
        var euler = new THREE.Euler();
        euler.setFromQuaternion(quaternion);

        poses.push({
            'position': new THREE.Vector3(item.position.x, item.position.y, item.position.z),
            'rotation': euler, //new Euler(THREE.Math.degToRad(item.eulerAngles.x), THREE.Math.degToRad(item.eulerAngles.y), THREE.Math.degToRad(item.eulerAngles.z)),
            'path': url + "/" + item.name,
            'data' : item,
        })
    });
    return poses;
}