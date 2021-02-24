import RayMarcher from './RayMarcher'

window.rm = null;
function init() {

  rm = new RayMarcher();
  rm.loadFragmentShader("raymarching/fragment.glsl", onFragmentLoaded );
  document.body.appendChild( rm.domElement );

  window.addEventListener( "resize", onResize, false );
  onResize();
}

function onFragmentLoaded( scope ){

  scope.setTexture( "map", "raymarching/matcap.png" );
  animate();
}

function onResize(e){

  rm.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

  requestAnimationFrame( animate );
  rm.update();
  rm.render();
}

init();
