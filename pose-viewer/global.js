import {exportPoses, loadPoses} from "./datasetsloader/datasetsloader.js";
import {getFormExportType, getFormImportType, getImportForm} from "./form.js";
import {init3dscene, renderPoses} from './scene3d.js';
import {} from './imagepanel.js'

export var poses = [];

(async function () {
    var {datasetType, datasetFolder, scale} = getImportForm();
    init3dscene(datasetType);
    poses = await loadPoses(datasetType, datasetFolder, null);
    renderPoses(poses, datasetType, scale);
})();

document.getElementsByName('export')[0].addEventListener('click', e => {
    var exportType = getFormExportType();
    exportPoses(poses, exportType);
})

document.getElementsByName('files-import')[0].addEventListener('change', async e => {
    var datasetType = getFormImportType(); //should autodetect the format?
    poses = await loadPoses(datasetType, null, e.target.files);
    renderPoses(poses, datasetType, 1);
});
