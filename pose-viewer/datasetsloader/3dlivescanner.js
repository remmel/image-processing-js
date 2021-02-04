import {csv2arrays, csv2objects} from "../csv.js";
import {readOrFetchText} from "./datasetsloader.js";
import { Matrix4, Quaternion, Vector3 } from 'three'

//TODO avoid using thoses .mat files to avoid http calls, see git for my trials to use ply file for pose
export async function loadLubos(url, files) {
    var poses = [];
    var $loading = document.getElementById('loading');
    var text = await readOrFetchText(url, files, 'posesPLY.csv', true); //PLY: position(x,z,-y)

    var items = csv2objects(text);

    var i=0, nb = items.length;
    for(var item of items) {
        if(url) $loading.textContent = "loading "+ ++i + "/"+nb;

        var frameId = item.frame_id;
        item.mat4 = await fetchLubosMat(url, files, frameId + '.mat');
        var fn = frameId + '.jpg';

        poses.push({
            'id' : frameId,
            //MAT
            'rotation': (new Quaternion()).setFromRotationMatrix(item.mat4),
            'position': (new Vector3()).setFromMatrixPosition(item.mat4), //(e[12], e[13], e[14]),
            'rgbFn' : fn,
            'rgb': url ? url + '/' + fn : Array.from(files).find(f => f.name === fn), //set image path or reference to image file
            'data': item
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
