import {csv2objects, rgbdtum2objects} from "../csv.js";
import {closest} from "../utils.js";
import {Vector3, Euler, Quaternion} from "three";


export async function loadTum(url) {
    var poses = [];

    var images = await fetchAndAssociateRgbdTum(url);

    var i = 0;

    var modulo = 1;
    var maximagesdisplayed = 1000; //TODO move that outside to use that feature for all dataset type
    if(images.length > maximagesdisplayed) {
        var modulo = Math.floor(images.length / maximagesdisplayed); //limit display to maximagesdisplayed images
        console.warn("Has "+ images.length + " images to display, display only ~"+maximagesdisplayed + ", thus 1 image every "+modulo);
    }

    images.forEach(image => {
        if(i++%modulo!==0) return;

        poses.push({
            'id' : image.pose_ts,
            'position': new Vector3(image.tx, image.ty, image.tz),
            'rotation': new Quaternion(parseFloat(image.qx), parseFloat(image.qy), parseFloat(image.qz), parseFloat(image.qw)),
            'rgbFn' : image.rgb_fn,
            'rgb': url + "/" + image.rgb_fn,
            'data' : image,
        });

    })
    return poses;
}

// get associated.txt data. If file missing get data from rgb.txt and groundtruth.txt
async function fetchAndAssociateRgbdTum(url) {
    var response = await fetch(url + '/associate.txt');
    if(response.ok) { //already associated no need
        var text = await response.text();
        text = "pose_ts tx ty tz qx qy qz qw depth_ts depth_fn rgb_ts rgb_fn\n" + text;
        var images = csv2objects(text, ' ');
        return images;
    } else {
        console.warn("Missing associate.txt, will try to associate rgb.txt and groundtruth.txt");
        var rgbText = await fetch(url + '/rgb.txt').then(response => response.text());
        var groundtruthText = await fetch(url + '/groundtruth.txt').then(response => response.text());

        var rgbs = rgbdtum2objects(rgbText);
        var poses = rgbdtum2objects(groundtruthText);
        var posesAssoc = [];
        poses.forEach(item => { //array to assoc with ts as key
            var key = Math.floor(parseFloat(item.timestamp)*1000);
            item.timestamp_ms = key;
            posesAssoc[key] = item;
        });

        var images = [];

        var posesTimestamps = Object.keys(posesAssoc);
        rgbs.forEach(rgb => {
            var rgbTs = Math.floor(parseFloat(rgb.timestamp)*1000);
            var poseTs = closest(posesTimestamps, rgbTs);
            var pose = posesAssoc[poseTs];

            images.push({
                ...rgb,
                ...pose,
                pose_ts: pose.timestamp,
                rgb_ts: rgb.timestamp,
                rgb_fn: rgb.filename,
                debug_ts: poseTs
            })
        });
        return images;
    }
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
            id, //depth_ts //dumb
            id + ".png", //"_depth16.bin.png" //depth_fn
            id, //rgb_ts //dumb
            id + ".jpg", //"_image.jpg" //rgb_fn //pose.rgbFn
        ].join(' ') + "\n";
    });
    downloadCsv(csv, "associate.txt");
}
