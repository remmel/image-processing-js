import WebGlApp from '../WebGlApp'
import { createPhoto360, createVideo360 } from './Sphere360'

export async function initPhoto360() {
  var webglApp = new WebGlApp()
  webglApp.enableOrbitControls()

  var mesh = createPhoto360('https://www.kustgame.com/ftp/photovid360/PIC_20201231_205333.jpg')
  webglApp.scene.add(mesh)

  webglApp.animate()
}

export async function initVideo360() {
  var webglApp = new WebGlApp()
  webglApp.enableOrbitControls()

  var mesh = createVideo360("https://www.kustgame.com/ftp/photovid360/PIC_20201231_205342.mp4")
  webglApp.scene.add(mesh)

  webglApp.animate()
}
