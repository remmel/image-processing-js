export function create(rgbBytes, depthBytes) {
  var geometry = new BufferGeometry();
  geometry.setAttribute( 'color', new Float32BufferAttribute( buffer.colors, 3 ) );
}
