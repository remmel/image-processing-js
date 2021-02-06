import * as THREE from "three";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'

export const RAD2DEG = 180 / Math.PI

async function loadPly(url) {
    return new Promise((resolve, reject) => {
        const loader = new PLYLoader();
        loader.load(url, resolve, () => {}, () => resolve(null));
    });
}

export async function addPly(url, pos, rot, scale){
    var geometry = await loadPly(url);
    if(!geometry) return null
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial( { color: 0x0055ff, flatShading: true } );
    const mesh = new THREE.Mesh( geometry, material );
    if(pos) mesh.position.copy(pos);
    if(rot) mesh.rotation.copy(rot)
    if(scale) mesh.scale.multiplyScalar( scale );
    // material.project(mesh)
    return mesh;
}

export function angles2euler(xangle, yangle, zangle) {
    return new THREE.Euler(
      THREE.Math.degToRad(xangle),
      THREE.Math.degToRad(yangle),
      THREE.Math.degToRad(zangle),
    )
}

export function createSphere(radius, color) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(radius),
      new THREE.MeshBasicMaterial({ color: color }),
    )
}

export const Color = {
    Blue: 0x0000ff,
    Red: 0xff0000,
    Green: 0x00ff00,
    Yellow: 0xffff00,
    White: 0xffffff,
    Gray: 0xaaaaaa,
    Black: 0x000000,
}
