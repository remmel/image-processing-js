import * as THREE from 'three'
import WebGlApp from '../WebGlApp'
import { GameFps } from '../commons/fps/GameFps'
import { loadAnimTest, loadRgbdImg, loadSceneApartof, loadSceneCocina } from '../commons/demoscenes'
import { addElement } from '../commons/domUtils'

//https://discourse.threejs.org/t/how-to-draw-3d-graphics-on-google-map/3796/4

var webglApp

var loadingHtml = `
  <span style='position: absolute;
    text-align: center;
    top: 10px;
    width: 100%;
    user-select: none;'>
      Loading...
  </span>
`

var scenesHtml = `
  <div style='position: absolute;
    top: 5px; 
    right: 5px;'>
      <select onchange='document.location="?scene="+this.value'>
          <option>- Scene -</option>
          <option>apartof</option>
          <option>cocina</option>
      </select>
  </div>
`

export async function initFpsViewer() {
  webglApp = window.WEBGLAPP = new WebGlApp()
  var gameFps = null //dumb gameFps

  var elLoading = addElement(loadingHtml)

  /** @param percentage {Number} : float between 0-1 included */
  function onProgress(percentage) {
    //if not 1 add 0.001 because of adding floating value, doesn't means 1 (eg thirteen times +=1/13, won't be 1)
    elLoading.innerText = percentage >= 1  ? '' : 'Loading ' + Math.round(percentage * 100) + '%'
  }

  var elScene = addElement(scenesHtml)

  switch (getMode()) {
    case MODE.FPS:
      gameFps = new GameFps(webglApp.camera, webglApp.renderer.domElement)
      webglApp.animateAdd(delta => gameFps.update(delta))
      break
    case MODE.EDITOR:
      webglApp.enableOrbitControls()
      webglApp.scene.add(new THREE.GridHelper(20, 20))
      break
    case MODE.VR:
      webglApp.enableVr()
  }

  switch (getScene()) {
    case SCENE.COCINA:
      loadSceneCocina(webglApp, gameFps, onProgress)
      break
    case SCENE.APARTOF:
      loadSceneApartof(webglApp, gameFps, onProgress)
      break
    case SCENE.ANIMTEST:
      loadAnimTest(webglApp, gameFps, onProgress)
      break
    case SCENE.RGBDIMG:
      loadRgbdImg(webglApp, gameFps, onProgress)
      break
    default:
      alert('scene not found')
  }

  webglApp.scene.add(new THREE.AmbientLight(0xFFFFFF, 1)) //to render exactly the texture (photogrammetry)
  webglApp.animate()
}

const MODE = {
  FPS : 'fps',
  EDITOR: 'editor',
  VR: 'vr'
}

const SCENE = {
  COCINA: 'cocina',
  APARTOF: 'apartof',
  ANIMTEST: 'animtest',
  RGBDIMG: 'rgbdimg'
}

function getMode() {
  return new URLSearchParams(window.location.search).get('mode') || MODE.FPS
}

function getScene() {
  return new URLSearchParams(window.location.search).get('scene') || 'apartof'
}
