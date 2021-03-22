import {css, html, LitElement} from 'lit-element';
import {DATASET_TYPE, DATASET_TYPE_IMPORTLOCAL} from "../datasetsloader/datasetsloader";
import {fillSelect} from "./formUtils";

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
class FormElt extends LitElement {
    static get styles() {
        return css`      
      #info{
            position: absolute;
            top: 0px;
            width: 100%;
            padding: 10px;
            box-sizing: border-box;
            text-align: center;
            user-select: none;
            overflow-wrap: break-word;
        }
    `
    }

    static get properties() {
        return {
        }
    }

    constructor() {
        super()
    }

    render() {
        return html`
            <div id="info">
                Import source:
                <label><input type="radio" name="datasetSrc" @change=${this.updateSrcTab} value="demo">Demo</label>
                <label><input type="radio" name="datasetSrc" @change=${this.updateSrcTab} value="local">Local</label>
                <label><input type="radio" name="datasetSrc" @change=${this.updateSrcTab} value="remote">Remote</label>
                <!--    Demo:-->
                <form class="tab-src tab-src-demo">
                    <select name="querystring" onchange="document.location = this.form.querystring.value">
                        <option value="?">- Load demo dataset -</option>
                        <option value="?datasetType=RGBDTUM&datasetFolder=https://raw.githubusercontent.com/remmel/rgbd-dataset/main/rgbd_dataset_freiburg1_desk">RGBDTUM / rgbd_dataset_freiburg1_desk</option>
                        <option value="?datasetType=RECORDER3D&datasetFolder=https://raw.githubusercontent.com/remmel/rgbd-dataset/main/2020-11-26_121940">RECORDER3D / 2020-11-26_121940</option>
                        <option value="?datasetType=ALICEVISION_SFM&datasetFolder=https://raw.githubusercontent.com/remmel/rgbd-dataset/main/2020-11-26_121940">ALICEVISION_SFM / 2020-11-26_121940</option>
                        <option value="?datasetType=AGISOFT&datasetFolder=https://raw.githubusercontent.com/remmel/rgbd-dataset/main/2020-11-26_121940">AGISOFT / 2020-11-26_121940</option>
                        <option value="?datasetType=AR3DPLAN&datasetFolder=https://raw.githubusercontent.com/remmel/rgbd-dataset/main/2020-11-27_195204">AR3DPLAN / 2020-11-27_195204</option>
                        <option value="?datasetType=LUBOS&datasetFolder=https://raw.githubusercontent.com/remmel/rgbd-dataset/main/20201130_195000.dataset">LUBOS / 20201130_195000.dataset</option>
                    </select>
                </form>
                <!--    Local:-->
                <form class="tab-src tab-src-local">
                    <select name="datasetTypeLocal">
                        <option value="">- Select datasetType -</option>
                    </select>
                    <label>Choose folder: <input type="file" name="files-import" webkitdirectory mozdirectory msdirectory odirectory directory value="Choose Folder" @change="${this._onBrowseChange}"/></label> (or
                    <label>Choose files: <input type="file" name="files-import" multiple @change=${this._onBrowseChange}/></label>)
                </form>
                <!--    Remote:-->
                <form class="tab-src tab-src-remote">
                    <select name="datasetType">
                        <option value="">- Select datasetType -</option>
                    </select>
                    <input type="text" name="datasetFolder" placeholder="datasetFolder url eg: https://raw.githubusercontent.com/remmel/rgbd-dataset/main/rgbd_dataset_freiburg1_desk" />
                    <input type="submit" value="Load"/>
                </form>
                <!--    Export:-->
                <hr width="25%"/>
                <form>
                    <select name="exportType">
                        <option value="">- Select Export type -</option>
                        <option value="ALICEVISION_SFM">Alicevision - .sfm</option>
                        <option value="AGISOFT">Agisoft (omega,phi,kappa) - .csv</option>
                        <option value="FAST_FUSION">FastFusion - associate.txt</option>
                        <option value="DEFAULT">Default - .csv</option>
                    </select>
                    <input type="file" value="file-general" name="file" style="display: none"/>
                    <input type="button" value="Export" name="export" @click=${this._onClickExport}/>
                </form>
                <hr width="25%"/>
                <slot></slot>
            </div>
        `
    }

    _onClickExport() {
        var detail = {
            dataType: this.shadowRoot.querySelector("select[name=exportType]").value
        }
        this.dispatchEvent(new CustomEvent('click-export', {detail}));
    }

    _onBrowseChange(e) {
        var detail = {
            datasetType: this.getFormImportTypeLocal(),
            files: e.target.files,
            scale: 1
        }
        this.dispatchEvent(new CustomEvent('load-poses', {detail}))
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties)
        var detail = this.getImportForm()
        this.dispatchEvent(new CustomEvent('load-poses', {detail}))

    }

    decodeUrl() {
        var params = new URLSearchParams(window.location.search);
        var datasetType = params.get("datasetType");
        var datasetFolder = params.get("datasetFolder");
        var scale = params.get("scale") ? params.get("scale") : 1;
        return {datasetType, datasetFolder, scale};
    }

    /**
     * Init the form with the url params
     * The form is submitted to take into account new params
     * FIXME has multiple responsabilities, not good
     */
    getImportForm() {
        var {datasetType, datasetFolder, scale} = this.decodeUrl();
        if(!datasetType && !datasetFolder) {
            datasetType = DATASET_TYPE.RECORDER3D; datasetFolder = 'https://raw.githubusercontent.com/remmel/rgbd-dataset/main/2020-11-26_121940';
        }

        //set form
        var $selectDsType = this.shadowRoot.querySelector("select[name=datasetType]");
        fillSelect($selectDsType, DATASET_TYPE);
        $selectDsType.value = datasetType;

        fillSelect(this.shadowRoot.querySelector("select[name=datasetTypeLocal]"), DATASET_TYPE_IMPORTLOCAL);

        var $inputDsFolder = this.shadowRoot.querySelector("input[name=datasetFolder]");
        $inputDsFolder.value = datasetFolder;

        var querystring = "?datasetType="+datasetType+"&datasetFolder="+datasetFolder;
        var $selectDsDemo = this.shadowRoot.querySelector("select[name=querystring]");
        var isDemo = $selectDsDemo.querySelector('[value="'+querystring+'"]');
        if(isDemo)
            $selectDsDemo.value = querystring;

        //radio - when page loaded, can only be one of thoses values
        if(isDemo) this.shadowRoot.querySelector("input[name=datasetSrc][value=demo]").checked = true;
        else this.shadowRoot.querySelector("input[name=datasetSrc][value=remote]").checked = true

        this.updateSrcTab();

        if(datasetFolder.endsWith('/')) console.warn(datasetFolder + " must not end with slash (/)")

        //document.querySelector("input[name=datasetSrc]:checked").value
        return {datasetType, datasetFolder, scale}
    }

    getFormImportTypeLocal() {
        return this.shadowRoot.querySelector("select[name=datasetTypeLocal]").value;
    }

    updateSrcTab() {
        var src = this.shadowRoot.querySelector('input[name=datasetSrc]:checked').value //FIXME, use litelt
        this.shadowRoot.querySelectorAll('.tab-src').forEach(node => node.style.display = 'none')
        this.shadowRoot.querySelectorAll('.tab-src-'+src).forEach(node => node.style.display='block')
    }

}

window.customElements.define('form-import-export-elt', FormElt)