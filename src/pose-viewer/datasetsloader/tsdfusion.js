import { readOrFetchText, urlOrFileImage } from './datasetsloader'
import { csv2arrays } from '../csv'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { idPad } from '../utils'


export async function loadTsdfFusion(url, files, onProgress) {
  var poses = []

  for (var i = 0; i < 1000; i+=20) {
    var id = idPad(i, 6)
    var m4 = await fetchMat(url, files, 'frame-' + id + '.pose.txt')

    var fn = 'frame-' + id + '.color.jpg'

    poses.push({
      'id': id,
      //MAT
      'rotation': (new Quaternion()).setFromRotationMatrix(m4),
      'position': (new Vector3()).setFromMatrixPosition(m4), //(e[12], e[13], e[14]),
      'rgbFn': fn,
      'rgb': urlOrFileImage(url, files, fn),
    })
  }
  return poses
}

//the order is different than opengl matrice
async function fetchMat(url, files, matFn) {
  var text = await readOrFetchText(url, files, matFn)
  var arrays = csv2arrays(text, ' ', true)
  var array0_3 = [...arrays[0], ...arrays[1], ...arrays[2], ...arrays[3]]

  array0_3 = array0_3.map(parseFloat)

  var mat4 = new Matrix4()
  mat4.fromArray(array0_3)
  mat4.transpose()
  return mat4
}
