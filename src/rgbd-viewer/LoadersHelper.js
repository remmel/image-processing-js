import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader'
import * as THREE from 'three'

/**
 * animated ply
 * http://www.openscenegraph.org/index.php/community/press-releases/223-openscenegraph-3-6-0-release
 * https://media.sketchfab.com/models/5485f94d0f6f4eb4b3ddd51490d1ec57/8108ac0958a4480cbf3644260fcc85f0/files/3581e1f3e4db46a8a8937368e6fc6a30/file.osgjs.gz
 * https://sketchfab.com/3d-models/animated-point-cloud-data-5485f94d0f6f4eb4b3ddd51490d1ec57
 */

export async function loadPLYs(onProgess) {
  var geometries = [];
  var count = 50;
  for(var i = 0; i<count; i++){
    geometries[i] = await loadPLYGeo('https://raw.githubusercontent.com/remmel/rgbd-dataset/main/20210113_182200.dataset/'+(i+'').padStart(8, '0')+'.ply')
    if(onProgess) onProgess((i+1)/count)
  }
  return geometries
}

/**
 * Returns ply Object3D as Points
 * @param url {string}
 * @returns {Promise<THREE.Points>}
 */
export async function loadPLYPoints(url) {
  var geometry = await loadPLYGeo(url)
  var material = new THREE.PointsMaterial({ size: 0.005 })
  material.vertexColors = geometry.attributes.color.count > 0
  return new THREE.Points(geometry, material)
}

/**
 * Returns ply Object3D as Mesh
 * @param url {string}
 * @returns {Promise<THREE.Points>}
 */
export async function loadPLYMesh(url) {
  var geometry = await loadPLYGeo(url)
  geometry.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial( { color: 0x0055ff, flatShading: true } );
  return new THREE.Mesh( geometry, material );
}

/**
 * Returns PLY geo
 * @param url {string}
 * @returns {Promise<THREE.BufferGeometry>}
 */
export function loadPLYGeo(url) {
  return new Promise((resolve, reject) => {
    const loader = new PLYLoader();
    loader.load(url,geometry=>resolve(geometry),()=>{},e=>reject(e));
  });
}

/**
 * Returns PCD mesh
 * @param url {string}
 * @returns {Promise<THREE.Points>}
 */
export function loadPCD(url) {
  return new Promise((resolve, reject) =>{
    const loader = new PCDLoader();
    loader.load(url,geometry=>resolve(geometry),()=>{},e=>reject(e));
  })
}
