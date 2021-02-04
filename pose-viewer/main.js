import {exportPoses, loadPoses} from "./datasetsloader/datasetsloader.js";
import {getFormImportTypeLocal, getImportForm} from "./form/formImport.js";
import {init3dscene, renderPoses} from './scene3d.js';
import {} from './imagepanel.js'
import {getFormExportType} from "./form/formExport.js";
// import css from './main.css'

export var poses = [];

(async function () {
    var {datasetType, datasetFolder, scale} = getImportForm();
    init3dscene(datasetType);
    poses = await loadPoses(datasetType, datasetFolder, null);
    renderPoses(poses, datasetType, scale);
})();

document.getElementsByName('files-import').forEach(el => el.addEventListener('change', async e => {
    var datasetType = getFormImportTypeLocal(); //should autodetect the format?
    poses = await loadPoses(datasetType, null, e.target.files);
    renderPoses(poses, datasetType, 1);
}));

document.getElementsByName('export')[0].addEventListener('click', e => {
    var exportType = getFormExportType();
    exportPoses(poses, exportType);
})
