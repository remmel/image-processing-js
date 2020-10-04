// import * as THREE from 'https://threejs.org/build/three.module.js';
// import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

import * as THREE from './copypaste/three.module.js';
import {OrbitControls} from './copypaste/OrbitControls.js';
import {csv2objects} from "./csv.js";

var camera, controls, scene, renderer, raycaster, geometry, material, materialRed, divScene;

function init() {
    divScene = document.getElementById("scene3d");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(divScene.clientWidth, divScene.clientHeight);
    divScene.appendChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera(60, divScene.clientWidth / divScene.clientHeight, 1, 1000);
    camera.position.set(400, 200, 0);

    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.01;
    controls.maxDistance = 5;
    controls.maxPolarAngle = Math.PI / 2;

    raycaster = new THREE.Raycaster();

    var axesHelper = new THREE.AxesHelper(1);
    scene.add(axesHelper);

    // world
    var geo = new THREE.PlaneBufferGeometry(5, 5, 8, 8);
    var mat = new THREE.MeshBasicMaterial({color: 0x777777, side: THREE.DoubleSide});
    var plane = new THREE.Mesh(geo, mat);
    plane.rotation.x = THREE.Math.degToRad(90); //plane.rotateX( - Math.PI / 2);
    plane.position.y = -1; //as I usally took the first image 1m

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

    geometry = new THREE.CylinderBufferGeometry(0, 0.1, 0.1, 4);
    material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true});
    materialRed = new THREE.MeshPhongMaterial({color: 0xff0000, flatShading: true});


    var lubos3dscannerFolder = "20201004_154033.dataset";
    var arf3dplanphotoFolder = "";//"unityarf3dplanphoto";

    if (lubos3dscannerFolder)
        fetch('./' + lubos3dscannerFolder + '/posesOBJ.csv')
            .then(response => response.text())
            .then(text => {
                var items = csv2objects(text);
                // geometry.rotateX(-Math.PI / 2)
                // geometry.rotateZ(Math.PI / 4);
                // geometry.applyMatrix(new THREE.Matrix4().makeScale(1, 0.75, 1)); //rectangular base
                items.forEach(item => {
                    var mesh = new THREE.Mesh(geometry, material);
                    mesh.position.x = item.x * 1;
                    mesh.position.y = item.y * 1;
                    mesh.position.z = item.z * 1;
                    mesh.rotation.x = THREE.Math.degToRad(item.yaw); //item.pitch);
                    mesh.rotation.y = THREE.Math.degToRad(item.roll);
                    mesh.rotation.z = THREE.Math.degToRad(item.pitch);
                    mesh.updateMatrix();
                    mesh.matrixAutoUpdate = false;

                    item.path = lubos3dscannerFolder + "/" + item.frame_id.padStart(8, "0") + ".jpg"; //set image path
                    mesh.data = item;
                    scene.add(mesh);
                })
            });

    if (arf3dplanphotoFolder)
        fetch('./' + arf3dplanphotoFolder + '/3dplanphoto_objs.json')
            .then(function (response) {
                response.json().then(function (data) {
                    //offsets
                    geometry.rotateX(-Math.PI / 2)
                    geometry.rotateZ(Math.PI / 4);
                    geometry.applyMatrix(new THREE.Matrix4().makeScale(1, 0.75, 1)); //rectangular base

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
                        item.path = "unityarf3dplanphoto/" + item.name;
                        mesh.data = item;
                        scene.add(mesh);
                    })
                })
            });
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

    intersects.forEach(intersect => {
        let data = intersect.object.data;
        if (!data) return;
        intersect.object.material = materialRed;
        console.log(intersect)

        document.getElementById('photo').src = data.path;
        document.getElementById('info-text').textContent = JSON.stringify(data);

        setTimeout(function () {
            intersect.object.material = material;
        }, 500)
    });
}

window.addEventListener('click', onMouseClick, false);

window.run = function () {
    init();
    //render(); // remove when using next line for animation loop (requestAnimationFrame)
    animate();
}

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