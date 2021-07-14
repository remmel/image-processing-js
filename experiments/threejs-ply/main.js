// import * as  THREE from '../node_modules/three/build/three.module.js';
// import {PLYLoader} from '../node_modules/three/examples/jsm/loaders/PLYLoader.js';

import * as THREE from '../web-modules/three.js';
import {PLYLoader} from "../web-modules/three.js";

let container;

let camera, cameraTarget, scene, renderer;

init();
animate();

async function loadPly(url) {
    return new Promise((resolve, reject) => {
        const loader = new PLYLoader();
        loader.load(url, resolve);
    });
}

async function addPly(url, pos, rot, scale){
    var geometry = await loadPly( url);
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial( { color: 0x0055ff, flatShading: true } );
    const mesh = new THREE.Mesh( geometry, material );
    mesh.position.copy(pos);
    if(rot) mesh.rotation.copy(rot)
    mesh.scale.multiplyScalar( scale );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add( mesh );
    return mesh;
}

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 15 );
    camera.position.set( 3, 0.15, 3 );

    cameraTarget = new THREE.Vector3( 0, - 0.1, 0 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x72645b );
    scene.fog = new THREE.Fog( 0x72645b, 2, 15 );


    // Ground
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry( 40, 40 ),
        new THREE.MeshPhongMaterial( { color: 0x999999, specular: 0x101010 } )
    );
    plane.rotation.x = - Math.PI / 2;
    plane.position.y = - 0.5;
    scene.add( plane );

    plane.receiveShadow = true;

    scene.add(new THREE.AxesHelper(1));


    // PLY file
    addPly('https://threejs.org/examples/models/ply/ascii/dolphins.ply', new THREE.Vector3( 0, - 0.2, 0.3) , new THREE.Euler(- Math.PI / 2, 0, 0), 0.001);
    addPly('https://threejs.org/examples/models/ply/binary/Lucy100k.ply', new THREE.Vector3(- 0.2, -0.02, -0.2), null, 0.0006)

    // Lights

    scene.add( new THREE.HemisphereLight( 0x443333, 0x111122 ) );

    addShadowedLight( 1, 1, 1, 0xffffff, 1.35 );
    addShadowedLight( 0.5, 1, - 1, 0xffaa00, 1 );

    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.outputEncoding = THREE.sRGBEncoding;

    renderer.shadowMap.enabled = true;

    container.appendChild( renderer.domElement );

    // resize

    window.addEventListener( 'resize', onWindowResize );

}



function addShadowedLight( x, y, z, color, intensity ) {

    const directionalLight = new THREE.DirectionalLight( color, intensity );
    directionalLight.position.set( x, y, z );
    scene.add( directionalLight );

    directionalLight.castShadow = true;

    const d = 1;
    directionalLight.shadow.camera.left = - d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = - d;

    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 4;

    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;

    directionalLight.shadow.bias = - 0.001;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    render();

}

function render() {

    const timer = Date.now() * 0.00005;

    camera.position.x = Math.sin( timer ) * 2.5;
    camera.position.z = Math.cos( timer ) * 2.5;

    camera.lookAt( cameraTarget );

    renderer.render( scene, camera );

}
