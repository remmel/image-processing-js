import {csv2objects} from "../csv.js";
import {closest} from "../utils.js";
import {Vector3, Euler, Quaternion} from "three";
import {downloadCsv, readOrFetchText, urlOrFileImage} from './datasetsloader'
import {readAsText} from "../form/formUtils";

export const KINECT_INTRINSICS = {
    w: 640, //x
    h: 480, //y
    fx : 525,
    fy: 525,
    cx : 319.5,
    cy: 239.5
}

export async function loadTum(url, files) {
    var poses = [];

    var images = await fetchAndAssociateRgbdTum(url, files);

    images.forEach(image => {
        image.intrinsics = KINECT_INTRINSICS //main tum dataset are using kinect v1, probably have to store some intrinsics.txt
        poses.push({
            'id' : image.pose_ts,
            'position': new Vector3(image.tx, image.ty, image.tz),
            'rotation': new Quaternion(parseFloat(image.qx), parseFloat(image.qy), parseFloat(image.qz), parseFloat(image.qw)),
            'rgbFn' : image.rgb_fn,
            'rgb': urlOrFileImage(url, files, image.rgb_fn),
            'depthFn' : image.depth_fn,
            'depth' : urlOrFileImage(url, files, image.depth_fn),
            'raw' : image,
        });

    })
    return poses;
}

// get associated.txt data. If file missing get data from rgb.txt and groundtruth.txt
async function fetchAndAssociateRgbdTum(url, files) {
    var text = await readOrFetchText(url, files, 'associate.txt', false)
    if(text) { //already associated no need
        text = "pose_ts tx ty tz qx qy qz qw depth_ts depth_fn rgb_ts rgb_fn\n" + text;
        var images = csv2objects(text, ' ');
        return images;
    } else {
        console.warn("Missing associate.txt, will try to associate rgb.txt and groundtruth.txt");
        var rgbText = await readOrFetchText(url, files, 'rgb.txt', true)
        var depthText = await readOrFetchText(url, files, 'depth.txt', true)
        var groundtruthText = await readOrFetchText(url, 'groundtruth.txt', true)
        var rgbs = rgbdtum2objects(rgbText);
        var depths = rgbdtum2objects(depthText);
        var poses = rgbdtum2objects(groundtruthText);

        var images = [];

        var posesTs = Object.keys(poses);
        var depthsTs = Object.keys(depths);

        //for each rgb find the closest pose and depth
        Object.entries(rgbs).forEach(([rgbTs,rgb]) => {
            var poseTs = closest(posesTs, rgbTs);
            var pose = poses[poseTs];
            var depthTs = closest(depthsTs, rgbTs);
            var depth = depths[depthTs];
            // console.log('diff', Math.abs(rgbTs-poseTs), Math.abs(rgbTs-depthTs))
            if(Math.abs(rgbTs-poseTs) < 20 && Math.abs(rgbTs-depthTs) < 20) { //only keep if <20ms
                images.push({
                    ...pose,
                    pose_ts: pose.timestamp,
                    rgb_ts: rgb.timestamp,
                    rgb_fn: rgb.filename,
                    depth_ts: depth.timestamp,
                    depth_fn: depth.filename,
                    debug_ts: poseTs
                })
            }
        });
        return images;
    }
}

//
/**
 * Convert TUM rgbd dataset format (https://vision.in.tum.de/data/datasets/rgbd-dataset/download) to objects
 * Remove the 2 first lines + "# " of 3rd line to get a csv with space delimiter
 * Then add timestamp as key
 */
function rgbdtum2objects(text) {
    var lines = text.split(/\r\n|\n/);
    lines.shift();
    lines.shift();
    lines[0] = lines[0].substring(2);

    var objs = csv2objects(lines.join("\n"), ' ');

    //use timestamp as key
    var assoc = [];
    objs.forEach(item => { //array to assoc with ts as key
        var key = Math.floor(parseFloat(item.timestamp)*1000); //cannot have a float as key
        item.timestamp_ms = key;
        assoc[key] = item;
    });
    return assoc
}

/**
 * Export poses in csv format, in order to be compatible with https://github.com/remmel/hms-AREngine-demo
 * Only quaternion, not Euler, as we use here the default ThreeJS (XYZ) whereas AREngine is YZX
 */
export function exportTumAssociate(poses) {
    var csv = "";

    poses.forEach(pose => { //item.rotation.x, item.rotation.y, item.rotation.z
        if(!pose.rotation instanceof Euler && !pose.rotation instanceof Quaternion)
            console.error("rotation must be Quaternion or Euler");
        // default euler order is different depending of the system, for ThreeJS it's XYZ and for AREngine it's YZX
        // to use that order: (new Euler(0,0,0,'YZX')).setFromQu...
        var euler = pose.rotation instanceof Euler ? pose.rotation : new Euler().setFromQuaternion(pose.rotation);
        var q = pose.rotation instanceof Quaternion ? pose.rotation : new Quaternion().setFromEuler(pose.rotation);

        //q.multiply(new Quaternion(0,0,1,0));

        var id = pose.id;

        //TODO make that more general as expected to come from AREngine
        csv += [
            id, //pose_ts
            pose.position.x, pose.position.y, pose.position.z, //tx ty tz
            q.x, q.y, q.z, q.w, //qx qy qz qw
            pose.raw.depth_ts ? pose.raw.depth_ts : id, //depth_ts //dumb
            pose.depthFn, //"_depth16.bin.png" //depth_fn
            pose.raw.rgb_ts ? pose.raw.rgb_ts : id, //rgb_ts //dumb
            pose.rgbFn, //"_image.jpg" //rgb_fn //pose.rgbFn
        ].join(' ') + "\n";
    });
    downloadCsv(csv, "associate.txt");
}
