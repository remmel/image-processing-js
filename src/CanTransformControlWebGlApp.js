import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { RAD2DEG } from './pose-viewer/utils3d'

export class CanTransformControlWebGlApp {
  //when contructed, we will really need it
  constructor(camera, scene, renderer, orbitControls, webappgl) {
    this.camera = camera
    this.renderer = renderer
    this.scene = scene
    this.orbitControls = orbitControls

    this._canTransformControlIntersect = []
    var control = this.transformControl = new TransformControls(this.camera, this.renderer.domElement)
    this.scene.add(this.transformControl)

    control.addEventListener('dragging-changed', event => {
      if (orbitControls) orbitControls.enabled = !event.value
    })

    window.addEventListener('keydown', event => {
      switch (event.key.toLowerCase()) {
        case 'w':
          control.setSpace(control.space === 'local' ? 'world' : 'local')
          break
        case 't':
          control.setMode('translate')
          break
        case 'r':
          control.setMode('rotate')
          break
        case 's':
          control.setMode('scale')
          break
        case ' ': // spacebar - pretty print position of object
          var obj = control.object
          console.log('position', prettyPrint(obj.position), 'euler', prettyPrint(obj.rotation))
          break
      }
    })
  }

  onClick(coords) {
    var raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(coords, this.camera)
    var intersects = raycaster.intersectObjects(this._canTransformControlIntersect, true)
    console.log(intersects)
    intersects.some(intersect => {
      //FIXME quickfix to match group, should add something if is animatione
      var m = intersect.object.parent instanceof THREE.Group ? intersect.object.parent : intersect.object
      this.attachTransformControl(m)
      return true
    })
  }

  // control that mesh
  attachTransformControl(m) {
    if (!this.orbitControls.enabled) return
    console.log('attachTransformControl', m, 'W: local/world coordinate; T: translate; R: rotate; S: scale; Espace: translation and rotation info')
    this.transformControl.attach(m)
  }

  // add a mesh which can be controlled when selected
  canTransformControlAdd(m) {
    this._canTransformControlIntersect.push(m)
  }
}

function prettyPrint(object) {
  if (object instanceof THREE.Vector3)
    return '(' + [object.x.toFixed(3), object.y.toFixed(3), object.z.toFixed(3)].join(',') + ')'
  else if (object instanceof THREE.Euler) {
    return '(' + [object.x.toFixed(2), object.y.toFixed(2), object.z.toFixed(2)].join(',') + ')'
      + ' (' + [(object.x * RAD2DEG).toFixed(1), (object.y * RAD2DEG).toFixed(1), (object.z * RAD2DEG).toFixed(1)].join(',') + ')'
  } else if (object instanceof THREE.Quaternion) {
    return '(' + [object.x, object.y, object.z, object.w].join(',') + ')'
  }
}
