// import * as THREE from 'https://threejs.org/build/three.module.js';
// import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

import * as THREE from './copypaste/three.module.js';
import {OrbitControls} from './copypaste/OrbitControls.js';
import {DATASET_TYPE, loadPoses} from "./datasetsloader.js";
import {getForm} from './form.js'

var camera, controls, scene, renderer, divScene,
    raycaster = new THREE.Raycaster(),
    material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true}),
    materialRed = new THREE.MeshPhongMaterial({color: 0xff0000, flatShading: true});

var {datasetType, datasetFolder, scale} = getForm();


console.log(datasetType, datasetFolder);

async function main() {
    divScene = document.getElementById("scene3d");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(divScene.clientWidth, divScene.clientHeight);
    divScene.appendChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera(60, divScene.clientWidth / divScene.clientHeight, 0.1, 100);
    camera.position.set(400, 200, 0);

    if(datasetType === DATASET_TYPE.RGBDTUM) //inverted axis for tum
        camera.up = new THREE.Vector3( 0, 0, 1 ); //rgbdtum

    createOrbitControl(camera, renderer);
    scene.add(new THREE.AxesHelper(1));
    scene.add(createFloor(datasetType));
    scene.add(createLights());
    window.addEventListener('resize', onWindowResize, false);

    var poses = await loadPoses(datasetType, datasetFolder);

    var geometry = createCylinder(scale);
    poses.forEach(pose => {
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(pose.position);
        mesh.rotation.copy(pose.rotation);
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        mesh.data = pose;
        scene.add(mesh);
    });

    animate();
    //render(); // remove when using next line for animation loop (requestAnimationFrame)
}

//1st position is landscape. on the x,y plan looking in z direction.
function createCylinder(scale) {
    //when scale is 1 (default) base is 10cm (0.1)
    var geometry = new THREE.CylinderBufferGeometry(0, 0.1/scale, 0.1/scale, 4);
    geometry.rotateX(-Math.PI / 2) //PI <=> 180°
    geometry.rotateZ(Math.PI / 4);
    geometry.applyMatrix(new THREE.Matrix4().makeScale(1, 0.75, 1)); //rectangular base
    return geometry;
}

function onWindowResize() {
    camera.aspect = divScene.clientWidth / divScene.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(divScene.clientWidth, divScene.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    render();
}

function render() {
    renderer.render(scene, camera);
}

// When clicking on pose, display images and info
function onMouseClick(event) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / divScene.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / divScene.clientHeight) * 2 + 1;

    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects(scene.children);
    intersects.some(intersect => {
        let data = intersect.object.data;
        if (!data) return false; //continue
        intersect.object.material = materialRed;
        document.getElementById('photo').src = data.path;
        document.getElementById('info-text').textContent = JSON.stringify(data);

        setTimeout(function () {
            intersect.object.material = material;
        }, 500)
        return true;
    })
}

function createFloor(datasetType) {
    var geo = new THREE.PlaneBufferGeometry(5, 5, 8, 8);
    var mat = new THREE.MeshBasicMaterial({color: 0x777777, side: THREE.DoubleSide});
    var plane = new THREE.Mesh(geo, mat);
    switch (datasetType) {
        case DATASET_TYPE.AR3DPLAN:
        case DATASET_TYPE.ARENGINERECORDER:
        case DATASET_TYPE.LUBOS:
        case DATASET_TYPE.ALICEVISION_SFM:
        case DATASET_TYPE.AGISOFT:
            //place floor like that as y is height
            plane.rotation.x = THREE.Math.degToRad(90); //plane.rotateX( - Math.PI / 2);
            plane.position.y = -1; //as I usally took the first image 1m
            break;
        case DATASET_TYPE.RGBDTUM:
            break;
        default:
            console.error("Default floor rotation as that dataset is not handled: "+datasetType)
    }
    return plane;
}

function createLights() {
    var group = new THREE.Group();
    // lights
    var light1 = new THREE.DirectionalLight(0xffffff);
    light1.position.set(1, 1, 1);
    group.add(light1);
    var light2 = new THREE.DirectionalLight(0x002288);
    light2.position.set(-1, -1, -1);
    group.add(light2);
    var light3 = new THREE.AmbientLight(0x222222);
    group.add(light3);
    return group;
}

function createOrbitControl(camera, renderer) {
    controls = new OrbitControls(camera, renderer.domElement);
    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.01;
    controls.maxDistance = 5;
    // controls.maxPolarAngle = Math.PI / 2;
}

window.addEventListener('click', onMouseClick, false);

main();


// var openFile = function(event) {
//     var input = event.target;
//
//     var reader = new FileReader();
//     reader.onload = function(){
//         var dataURL = reader.result;
//         var output = document.getElementById('output');
//         output.src = dataURL;
//     };
//     reader.readAsDataURL(input.files[0]);
// };