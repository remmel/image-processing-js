// import * as THREE from 'https://threejs.org/build/three.module.js';
// import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

import * as THREE from './copypaste/three.module.js';
import {OrbitControls} from './copypaste/OrbitControls.js';
import {csv2objects, rgbdtum2objects} from "./csv.js";
import {closest} from "./utils.js";

var camera, controls, scene, renderer, raycaster, material, materialRed, divScene, datasetType, datasetFolder;

const DATASET_TYPE = {
    LUBOS: 'lubos3dscanner', //https://play.google.com/store/apps/details?id=com.lvonasek.arcore3dscannerpro
    AR3DPLAN: 'ar3dplanphoto', //https://github.com/remmel/ar3dplanphoto
    RGBDTUM: 'rgbdtum', //https://vision.in.tum.de/data/datasets/rgbd-dataset
};

datasetType = DATASET_TYPE.LUBOS; datasetFolder = 'dataset/20201004_215742.dataset';
// datasetType = DATASET_TYPE.AR3DPLAN; datasetFolder = 'dataset/unityarf3dplanphoto';
// datasetType = DATASET_TYPE.RGBDTUM; datasetFolder = 'dataset/rgbd_dataset_freiburg1_desk2';

function init() {
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

    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.01;
    controls.maxDistance = 5;
    // controls.maxPolarAngle = Math.PI / 2;

    raycaster = new THREE.Raycaster();

    var axesHelper = new THREE.AxesHelper(1);
    scene.add(axesHelper);

    // floor
    var geo = new THREE.PlaneBufferGeometry(5, 5, 8, 8);
    var mat = new THREE.MeshBasicMaterial({color: 0x777777, side: THREE.DoubleSide});
    var plane = new THREE.Mesh(geo, mat);
    switch (datasetType) {
        case DATASET_TYPE.AR3DPLAN:
        case DATASET_TYPE.LUBOS:
            plane.rotation.x = THREE.Math.degToRad(90); //plane.rotateX( - Math.PI / 2);
            plane.position.y = -1; //as I usally took the first image 1m
            break;
        case DATASET_TYPE.RGBDTUM:
            break;
    }
    scene.add(plane);

    // lights
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);
    var light = new THREE.DirectionalLight(0x002288);
    light.position.set(-1, -1, -1);
    scene.add(light);
    var light = new THREE.AmbientLight(0x222222);
    scene.add(light);
    window.addEventListener('resize', onWindowResize, false);

    material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true});
    materialRed = new THREE.MeshPhongMaterial({color: 0xff0000, flatShading: true});

    loadDataset();
}

async function loadDataset() {
    switch (datasetType) {
        case DATASET_TYPE.LUBOS:
            fetch('./' + datasetFolder + '/posesOBJ.csv')
                .then(response => response.text())
                .then(text => {
                    var items = csv2objects(text);
                    var geometry = createCylinder();
                    items.forEach(item => {
                        var mesh = new THREE.Mesh(geometry, material);
                        mesh.position.set(item.x, item.y, item.z);
                        mesh.rotation.set(THREE.Math.degToRad(item.yaw), THREE.Math.degToRad(item.pitch), THREE.Math.degToRad(item.roll));
                        mesh.updateMatrix();
                        mesh.matrixAutoUpdate = false;

                        item.path = datasetFolder + "/" + item.frame_id.padStart(8, "0") + ".jpg"; //set image path
                        mesh.data = item;
                        scene.add(mesh);
                    })
                });
            break;

        case DATASET_TYPE.AR3DPLAN:
            fetch('./' + datasetFolder + '/3dplanphoto_objs.json')
                .then(function (response) {
                    response.json().then(function (data) {
                        var geometry = createCylinder();

                        data.list.forEach(item => {
                            if (item.type !== "Photo") return;

                            var mesh = new THREE.Mesh(geometry, material);
                            mesh.position.x = item.position.x;
                            mesh.position.y = item.position.y;
                            mesh.position.z = item.position.z;

                            mesh.rotation.x = THREE.Math.degToRad(item.eulerAngles.x); //red
                            mesh.rotation.y = THREE.Math.degToRad(item.eulerAngles.y); //green
                            mesh.rotation.z = THREE.Math.degToRad(item.eulerAngles.z); //blue
                            mesh.updateMatrix();
                            mesh.matrixAutoUpdate = false;
                            item.path = datasetFolder + "/" + item.name;
                            mesh.data = item;
                            scene.add(mesh);
                        })
                    })
                });
            break;

        case DATASET_TYPE.RGBDTUM:
            fetchAndAssociateRgbdTum(datasetFolder).then(images => {
                var geometry = createCylinder();

                var i = 0;
                images.forEach(image => {
                    if(i++%10!==0) return; //one image out of 10
                    var mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(image.tx, image.ty, image.tz);
                    var quaternion = new THREE.Quaternion(parseFloat(image.qx), parseFloat(image.qy), parseFloat(image.qz), parseFloat(image.qw));
                    mesh.rotation.setFromQuaternion(quaternion);
                    mesh.updateMatrix();
                    mesh.matrixAutoUpdate = false;

                    image.path = datasetFolder + "/" + image.rgb_fn;
                    mesh.data = image;

                    // setTimeout(function() {
                    scene.add(mesh);
                    // }, i*50);

                })
            })
            break;
    }
}

// get associated.txt data. If file missing get data from rgb.txt and groundtruth.txt
async function fetchAndAssociateRgbdTum(rgbd) {
    var response = await fetch('./' + rgbd + '/associate.txt');
    if(response.ok) { //already associated no need
        var text = await response.text();
        text = "pose_ts tx ty tz qx qy qz qw depth_ts depth_fn rgb_ts rgb_fn\n" + text;
        var images = csv2objects(text, ' ');
        return images;
    } else {
        console.warn("Missing associate.txt, will try to associate rgb.txt and groundtruth.txt");
        var rgbText = await fetch('./' + rgbd + '/rgb.txt').then(response => response.text());
        var groundtruthText = await fetch('./' + rgbd + '/groundtruth.txt').then(response => response.text());

        var rgbs = rgbdtum2objects(rgbText);
        var poses = rgbdtum2objects(groundtruthText);
        var posesAssoc = [];
        poses.forEach(item => { //array to assoc with ts as key
            var key = Math.floor(parseFloat(item.timestamp)*1000);
            item.timestamp_ms = key;
            posesAssoc[key] = item;
        });

        var images = [];

        var posesTimestamps = Object.keys(posesAssoc);
        rgbs.forEach(rgb => {
            var rgbTs = Math.floor(parseFloat(rgb.timestamp)*1000);
            var poseTs = closest(posesTimestamps, rgbTs);
            var pose = posesAssoc[poseTs];

            images.push({
                ...rgb,
                ...pose,
                pose_ts: pose.timestamp,
                rgb_ts: rgb.timestamp,
                debug_ts: poseTs
            })
        });
        return images;
    }
}

//1st position is landscape. on the x,y plan looking in z direction.
function createCylinder() {
    var geometry = new THREE.CylinderBufferGeometry(0, 0.1, 0.1, 4);
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

window.addEventListener('click', onMouseClick, false);

init();
//render(); // remove when using next line for animation loop (requestAnimationFrame)
animate();

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