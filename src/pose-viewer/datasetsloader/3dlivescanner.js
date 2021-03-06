import {csv2arrays, csv2objects} from "../csv.js";
import {readOrFetchText, urlOrFileImage} from "./datasetsloader.js";
import { Matrix4, Quaternion, Vector3 } from 'three'

const STATE_HEADER = 'nb w h cx cy fx fy' // 89 1080 1920 534.779968 961.452026 1645.181030 1430.592285

//TODO avoid using thoses .mat files to avoid http calls, see git for my trials to use ply file for pose
export async function loadLubos(url, files, onProgress) {
    var poses = [];
    var text = await readOrFetchText(url, files, 'posesPLY.csv', true); //PLY: position(x,z,-y)
    var items = csv2objects(text);

    var textState = await readOrFetchText(url, files, 'state.txt')
    var state = textState ? csv2objects(STATE_HEADER+"\n"+textState, ' ')[0] : {}

    for(const [i, item] of items.entries()) {
        if(url) onProgress((i+1)/items.length)

        var frameId = item.frame_id;
        item.mat4 = await fetchLubosMat(url, files, frameId + '.mat');
        item.intrinsics = state //should store that somewhere else
        var fn = frameId + '.jpg';

        poses.push({
            'id' : frameId,
            //MAT
            'rotation': (new Quaternion()).setFromRotationMatrix(item.mat4),
            'position': (new Vector3()).setFromMatrixPosition(item.mat4), //(e[12], e[13], e[14]),
            'rgbFn' : fn,
            'rgb': urlOrFileImage(url, files, fn),
            'raw': item
        })
    }

    return poses;
}

async function fetchLubosMat(url, files, matFn) {
    var text = await readOrFetchText(url, files, matFn);
    var arrays = csv2arrays(text, ' ', true);
    var array0_3 = [...arrays[0], ...arrays[1], ...arrays[2], ...arrays[3]]

    var mat4 = new Matrix4();
    mat4.fromArray(array0_3);
    return mat4;
}
