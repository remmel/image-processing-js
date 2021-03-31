import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

export class PlayerFPS {
  constructor(camera, domElement, scene) {
    var controls = new PointerLockControls(camera, domElement)

    scene.add(controls.getObject())
    setTimeout(() => controls.lock(), 500)

    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    let canJump = false;

    const onKeyDown = function ( event ) {

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          moveForward = true
          break
        case 'ArrowLeft':
        case 'KeyA':
          moveLeft = true
          break
        case 'ArrowDown':
        case 'KeyS':
          moveBackward = true
          break
        case 'ArrowRight':
        case 'KeyD':
          moveRight = true
          break
        case 'Space':
          if (canJump === true) velocity.y += 350
          canJump = false
          break
      }
    };

    const onKeyUp = function(event) {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          moveForward = false
          break
        case 'ArrowLeft':
        case 'KeyA':
          moveLeft = false
          break
        case 'ArrowDown':
        case 'KeyS':
          moveBackward = false
          break
        case 'ArrowRight':
        case 'KeyD':
          moveRight = false
          break
      }
    }

    window.document.addEventListener( 'keydown', onKeyDown );
    window.document.addEventListener( 'keyup', onKeyUp );
  }
}
