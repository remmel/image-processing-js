import * as THREE from "three";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'

async function loadPly(url) {
    return new Promise((resolve, reject) => {
        const loader = new PLYLoader();
        loader.load(url, resolve);
    });
}

export async function addPly(url, pos, rot, scale){
    var geometry = await loadPly(url);
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial( { color: 0x0055ff, flatShading: true } );
    const mesh = new THREE.Mesh( geometry, material );
    mesh.position.copy(pos);
    if(rot) mesh.rotation.copy(rot)
    mesh.scale.multiplyScalar( scale );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}
