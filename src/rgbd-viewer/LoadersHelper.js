import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {FileLoader} from 'three/src/loaders/FileLoader'
import { readAsDataURL, readAsText } from '../pose-viewer/form/formUtils'
import { Loader, LoaderUtils, MeshBasicMaterial, MeshPhongMaterial, TextureLoader } from 'three'

/**
 * Returns ply Object3D as Points
 * @param url {string}
 * @returns {Promise<THREE.Points>}
 */
export async function loadPLYPoints(url) {
  var geometry = await new PLYLoader().loadAsync(url)
  var material = new THREE.PointsMaterial({ size: 0.005 })
  material.vertexColors = geometry.attributes.color.count > 0
  return new THREE.Points(geometry, material)
}

/**
 * Returns ply Object3D as Mesh
 * @param url {string}
 * @returns {Promise<THREE.Mesh>}
 */
export async function loadPLYMesh(url) {
  var geometry = await new PLYLoader().loadAsync(url)
  geometry.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial( { color: 0x0055ff, flatShading: true } );
  return new THREE.Mesh( geometry, material );
}

/**
 * Returns PCD mesh
 * @param url {string}
 * @returns {Promise<THREE.Points>}
 */
export function loadPCD(url) {
  return new PCDLoader().loadAsync(url)
}

class OBJMTLLoader extends OBJLoader {
  load(url, onLoad, onProgress, onError) {
    if(!this.path) { //if the url provided is full url not fn
      this.setPath(url.substr(0,url.lastIndexOf('/')))
      url = url.substr(url.lastIndexOf('/')) //url is fn
    }

    const scope = this
    const loader = new FileLoader(this.manager)
    loader.setPath(this.path)
    loader.setRequestHeader(this.requestHeader)
    loader.setWithCredentials(this.withCredentials)
    loader.load(url, text => {
      this.parseMtlAndLoad(text,  () =>{
        try {
          onLoad(scope.parse(text))
        } catch (e) {
          if (onError) {
            onError(e)
          } else {
            console.error(e)
          }
          scope.manager.itemError(url)
        }
      })
    }, onProgress, onError)
  }

  parseMtlAndLoad(text, onLoadMtl) {
    if(!this.materials) { //do not load a material if already provided
      let idxStart = text.indexOf("mtllib ")
      let idxEnd = text.indexOf(".mtl")
      if (idxStart !== -1 && idxEnd !== -1 && idxEnd - idxStart > 7) {
        var mtlFn = text.substring(idxStart + 7, idxEnd + 4); //to be improved
        new MTLLoader().loadAsync(this.path + "/" + mtlFn).then(materials => {
          materials.preload()
          // If not providing manually the material, the object will be "blurry" because it use vertrex colors not jpg
          this.setMaterials(materials)
          onLoadMtl()
        })
      }
    } else {
      onLoadMtl()
    }
  }
}

/**
 * Load an obj (photogrammetry: no shading)
 * @returns {Promise<THREE.Group>}
 */
export async function loadObj(objFn, mtlFn, onProgress) {
  onProgress = onProgress || (() => {})
  // Diff says that the blurry one has map:null; vertexColors:true
  // Material is MeshPhongMaterial, MeshBasicMaterial might be better, has we don't want shaders

  var objLoader = new OBJMTLLoader()

  var group = await objLoader
    .loadAsync(objFn, e => onProgress(e.loaded / e.total * 0.95))

  group.name = objFn.substr(objFn.lastIndexOf('/')+1).slice(0, -4)

  // group.children[0].material.flatShading = true //hum... smooth
  onProgress(1)

  // debugger

  return group
}

/**
 * Load an obj with its mat and jpg
 * TODO, do not call by http the image
 * @param {FileList} fileList
 * @returns {Promise<THREE.Object3D>}
 */
export async function loadObjFiles(fileList) {
  var files = Array.from(fileList)

  // 1. Material
  var fMtl = files.find( f => f.name.endsWith(".mtl"))
  var materials = null
  if(fMtl) {
    var txtMat = await readAsText(fMtl)
    materials = await new MTLLoader().parse(txtMat)
  }

  // 2. Obj
  var fobj = files.find( f => f.name.endsWith(".obj"))
  if(!fobj) { alert(".obj not found"); return}
  var dataObj = await readAsText(fobj)
  var group = new OBJLoader().setMaterials(materials).parse(dataObj)

  // 3. Image
  var fImg = files.find(f => f.name.match(/\.(jpg|jpeg|png)$/i) !== null)
  if(fImg) {
  var dataUriImg = await readAsDataURL(fImg)
    var texture = new THREE.TextureLoader().load(dataUriImg);
    group.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material.map = texture
        child.material.flatShading = true
      }
    })
  }
  return group
}

export async function loadGltf(url, onProgress) {
  onProgress = onProgress || (() => {})
  //e.total is expected to be provided by apache server (not by local server)
  const data = await new GLTFLoader().loadAsync(url, e => onProgress(e.loaded / e.total * 0.95))

  recursiveMaterialMapEncLinear(data.scene)

    //m.material = new THREE.MeshBasicMaterial({map: m.material.map})
    // m.material.flatShading = true
    // m.material.needsUpdate = true

  onProgress(1)
  return data.scene
}

/** {Object3D} mesh or group*/
function recursiveMaterialMapEncLinear(o3d) {
  if(o3d.isGroup)
    o3d.children.forEach(m => recursiveMaterialMapEncLinear(m))
  else if(o3d.material && o3d.material.map && o3d.material.map.encoding)
    o3d.material.map.encoding = THREE.LinearEncoding
}
