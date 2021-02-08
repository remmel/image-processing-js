import * as THREE from "three";
import {DATASET_TYPE} from './datasetsloader/datasetsloader.js';
import { createMeshPly } from './utils3d.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import {PoseCylinder} from './PoseCylinder'
import { selectPoseObj } from './main'
import { PoseCamera } from './PoseCamera'
//https://codesandbox.io/s/project-camera-gby2i

var camera, controls, scene, renderer, divScene,
    raycaster = new THREE.Raycaster(),
    groupPoses = new THREE.Group(),
    meshPly = null

export async function init3dscene(datasetType) {
    divScene = document.getElementById('scene3d');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(divScene.clientWidth, divScene.clientHeight);
    divScene.appendChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera(60, divScene.clientWidth / divScene.clientHeight, 0.1, 100);
    camera.position.set(400, 200, 0);

    switch (datasetType) {
        case DATASET_TYPE.RGBDTUM:
            camera.up = new THREE.Vector3( 0, 0, 1 ); //up is z not y
    }

    createOrbitControl(camera, renderer);
    scene.add(new THREE.AxesHelper(1));
    scene.add(createFloor(datasetType));
    scene.add(createLights());
    // scene.add(createDebugCamera());
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

export async function renderPoses(poses, modelUrlOrFile, datasetType, scale, ) {
    removeCameras();

    for (var idxPose in poses) {
        var pose = poses[idxPose];
        pose.object = new PoseCylinder(pose, idxPose, scale, datasetType)
        // pose.object = new PoseCamera(pose, idxPose, scale, datasetType)
        groupPoses.add(pose.object)

    }
    if(modelUrlOrFile) {
        meshPly = await createMeshPly(modelUrlOrFile);
        if(meshPly) groupPoses.add(meshPly);
    }

    scene.add(groupPoses);
}

//FIXME better way to access the mesh
export function getMeshPly(){
    return meshPly;
}

function removeCameras() {
    // scene.remove(groupPoses); //why it doesn't work?
    //FIXME: filter(true), otherwise not all the item is removed. Why scene.remove(groupPoses) doesnot work?
    groupPoses.children.filter(() => true).forEach(child => {
        groupPoses.remove(child); // need to .dispose also geometry
        child.geometry.dispose();
        // child.material.dispose(); //is
    })
}

function createDebugCamera(){
    var mesh = createCamera(1);
    mesh.position.copy(new THREE.Vector3(1, 1, 1));
    return mesh;
}

function onWindowResize() {
    camera.aspect = divScene.clientWidth / divScene.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(divScene.clientWidth, divScene.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    renderer.render(scene, camera)
}

// When clicking on pose, display images and info
function onClick3dScene(xpx, ypx) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    var mouse = new THREE.Vector2();

    mouse.x = (xpx / divScene.clientWidth) * 2 - 1;
    mouse.y = -(ypx / divScene.clientHeight) * 2 + 1;
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects(groupPoses.children); //scene.children
    intersects.some(intersect => {
        if(!(intersect.object instanceof PoseCylinder)) return false;
        selectPoseObj(intersect.object);
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
        case DATASET_TYPE.ALICEVISION_SFM:
        case DATASET_TYPE.AGISOFT:
        case DATASET_TYPE.LUBOS:
            //place floor like that as y is height
            plane.rotation.x = THREE.Math.degToRad(90); //plane.rotateX( - Math.PI / 2);
            plane.position.y = -1.6; //as we usually took the first image at that height
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
    var light1 = new THREE.DirectionalLight(0xffffff);
    light1.position.set(1, 1, 1);
    group.add(light1);
    var light2 = new THREE.DirectionalLight(0xffffff);
    light2.position.set(-1, -1, -1);
    group.add(light2);
    var light3 = new THREE.AmbientLight(0x999999);
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

window.addEventListener('click', event => {
    return onClick3dScene(event.clientX, event.clientY);
}, false);

window.addEventListener('touchstart', event => {
    if(!event.touches.length) return;
    return onClick3dScene(event.touches[0].pageX, event.touches[0].pageY);
});

