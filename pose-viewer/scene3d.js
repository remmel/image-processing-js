import * as THREE from "three";
import {DATASET_TYPE} from './datasetsloader/datasetsloader.js';
import { createMeshPly, RAD2DEG } from './utils3d.js'
import PoseCylinder from './PoseCylinder'
import { selectPoseObj } from './main'
import WebGlApp from './WebGlApp'
//https://codesandbox.io/s/project-camera-gby2i

var raycaster = new THREE.Raycaster(),
    groupPoses = new THREE.Group(),
    meshPly = null,
    webgl = null

export async function init3dscene(datasetType) {
    webgl = new WebGlApp(document.getElementById('scene3d'))

    var camera = webgl.camera;
    var scene = webgl.scene;

    camera.position.set(5, 5, 5);

    switch (datasetType) {
        case DATASET_TYPE.RGBDTUM:
            camera.up = new THREE.Vector3( 0, 0, 1 ); //up is z not y
    }

    webgl.initOrbitControl();
    scene.add(createFloor(datasetType));
    scene.add(createLights());
    webgl.initClickEvent(onClick3dScene)
    webgl.animate()
}

export async function renderPoses(poses, modelUrlOrFile, datasetType, scale) {
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

    webgl.scene.add(groupPoses);
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

// When clicking on pose, display images and info
function onClick3dScene(mouse) {
    raycaster.setFromCamera(mouse, webgl.camera);
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

// export function cameraOnPose(pose) {
//     webgl.camera.position.copy(pose.camera.position)
//     webgl.camera.rotation.copy(pose.camera.rotation) //cannot be changed because of orbitcontrol
//     webgl.controls.update();
// }
