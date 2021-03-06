import { PLYExporter } from 'three/examples/jsm/exporters/PLYExporter'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'

export function exportGltf(scene) {
    new GLTFExporter().parse(scene, result => {
    if (result instanceof ArrayBuffer) {
      saveArrayBuffer(result, 'scene.glb')
    } else {
      const output = JSON.stringify(result, null, 2)
      saveString(output, 'scene.gltf')
    }
  })
}

function saveString(text, filename) {
  save(new Blob([text], { type: 'text/plain' }), filename)
}

function save(blob, filename) {
  const link = document.createElement( 'a' );
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
