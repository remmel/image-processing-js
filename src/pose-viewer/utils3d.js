import * as THREE from "three";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import { readAsArrayBuffer } from './form/formUtils'

export const RAD2DEG = 180 / Math.PI

async function loadPlyGeometry(urlOrFile) {
    return new Promise(async (resolve, reject) => {
        const loader = new PLYLoader();
        if(typeof urlOrFile === 'string')
            loader.load(urlOrFile, resolve, () => {}, () => resolve(null));
        else if(urlOrFile instanceof File) {
            var data = await readAsArrayBuffer(urlOrFile)
            resolve(loader.parse(data))
        }
    });
}

export async function createMeshPly(urlOrFile, pos, rot, scale){
    var geometry = await loadPlyGeometry(urlOrFile);
    if(!geometry) return null
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial( { color: 0x0055ff, flatShading: true } );
    const mesh = new THREE.Mesh( geometry, material );
    if(pos) mesh.position.copy(pos);
    if(rot) mesh.rotation.copy(rot)
    if(scale) mesh.scale.multiplyScalar( scale );
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

export function createFloor(size) {
    // size = size || 5
    var geo = new THREE.PlaneBufferGeometry(5, 5, 8, 8)
    var mat = new THREE.MeshBasicMaterial({ color: 0x777777, side: THREE.DoubleSide })
    return new THREE.Mesh(geo, mat)
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
