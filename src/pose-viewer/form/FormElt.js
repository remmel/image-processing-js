import {css, html, LitElement} from 'lit-element'
import {DATASET_TYPE} from "../datasetsloader/datasetsloader"
import './SelectElt'

class FormElt extends LitElement {
    static get styles() {
        // language=CSS
        return css`
            :host {
                position: absolute;
                top: 0px;
                width: inherit;
                padding: 10px;
                box-sizing: border-box;
                text-align: center;
                user-select: none;
                overflow-wrap: break-word;
            }

            hr {
                width: 25%;
            }

            .tab-src:not([selected]) {
                display: none;
            }
        `
    }

    static get properties() {
        return {
            datasetType: {type: String},
            datasetFolder: {type: String},
            tabDatasetSrc: {type: String}
        }
    }

    constructor() {
        super()
        var {datasetType, datasetFolder, scale} = this.getUrlParams()
        this.datasetType = datasetType ? datasetType : DATASET_TYPE.RECORDER3D
        this.datasetFolder = datasetFolder ? datasetFolder : 'https://raw.githubusercontent.com/remmel/rgbd-dataset/main/2020-11-26_121940'
        this.scale = scale ? scale : 1
        this.tabDatasetSrc = 'remote'

        if (this.datasetFolder.endsWith('/')) console.warn(this.datasetFolder + " must not end with slash (/)")
    }

    render() {
        return html`
            Import source:
            <label><input type="radio" name="datasetSrc" @change=${this._onChangeRadio} value="demo" ?checked=${this.tabDatasetSrc==="demo"}>Demo</label>
            <label><input type="radio" name="datasetSrc" @change=${this._onChangeRadio} value="local" ?checked=${this.tabDatasetSrc==="local"}>Local</label>
            <label><input type="radio" name="datasetSrc" @change=${this._onChangeRadio} value="remote" ?checked=${this.tabDatasetSrc==="remote"}>Remote</label>
            <!--    Demo:-->
            <form class="tab-src" ?selected=${this.tabDatasetSrc === "demo"}>
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
            <form class="tab-src" ?selected=${this.tabDatasetSrc === "local"}>
                <select-elt .options=${DATASET_TYPE}
                            selected=${this.datasetType}
                            @change=${e => this.datasetType = e.detail.value}>
                    <option value="">- Select datasetType -</option>
                </select-elt>
                <label>Choose folder: <input type="file" webkitdirectory mozdirectory msdirectory odirectory directory value="Choose Folder" @change="${this._onBrowseChange}"/></label> (or
                <label>Choose files: <input type="file" multiple @change=${this._onBrowseChange}/></label>)
            </form>
            <!--    Remote:-->
            <form class="tab-src" ?selected=${this.tabDatasetSrc === "remote"}>
                <select-elt .options=${DATASET_TYPE}
                            selected=${this.datasetType}
                            @change=${e => this.datasetType = e.detail.value}>
                    <option value="">- Select datasetType -</option>
                </select-elt>
                <input type="hidden" value=${this.datasetType} name="datasetType" /><!-- dirty wayaround -->
                <input type="text" value=${this.datasetFolder} name="datasetFolder" placeholder="datasetFolder url eg: https://raw.githubusercontent.com/remmel/rgbd-dataset/main/rgbd_dataset_freiburg1_desk" />
                <input type="submit" value="Load"/>
            </form>
            <hr/><!--    Export:-->
            <form>
                <select name="exportType">
                    <option value="">- Select Export type -</option>
                    <option value="ALICEVISION_SFM">Alicevision - .sfm</option>
                    <option value="AGISOFT_CSV">Agisoft (omega,phi,kappa) - .csv</option>
                    <option value="AGISOFT_XML">Agisoft .xml</option>
                    <option value="FAST_FUSION">FastFusion - associate.txt</option>
                    <option value="DEFAULT">Default - .csv</option>
                </select>
                <input type="file" value="file-general" name="file" style="display: none"/>
                <input type="button" value="Export" name="export" @click=${this._onClickExport}/>
            </form>
            <hr/>
            <slot></slot>
        `
    }

    _onClickExport() {
        this.dispatchEvent(new CustomEvent('click-export', {detail: {dataType: this.exportType}}))
    }

    _onBrowseChange(e) {
        this.dispatchEvent(new CustomEvent('load-poses', {
            detail: {
                datasetType: this.datasetType,
                files: e.target.files,
                scale: 1
            }
        }))
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties)

        this.querystring = "?datasetType=" + this.datasetType + "&datasetFolder=" + this.datasetFolder
        if (this.querystring) this.tabDatasetSrc = "demo" //querystring is set only if the value is an <option>

        this.dispatchEvent(new CustomEvent('load-poses', {
            detail: {
                datasetType: this.datasetType,
                datasetFolder: this.datasetFolder,
                scale: this.scale
            }
        }))
    }

    getUrlParams() {
        var params = new URLSearchParams(window.location.search);
        var datasetType = params.get("datasetType");
        var datasetFolder = params.get("datasetFolder");
        var scale = params.get("scale") ? params.get("scale") : 1;
        return {datasetType, datasetFolder, scale};
    }

    set querystring(val) {
        this.shadowRoot.querySelector("select[name=querystring]").value = val
    }

    get querystring() {
        return this.shadowRoot.querySelector("select[name=querystring]").value
    }

    get exportType() {
        return this.shadowRoot.querySelector("select[name=exportType]").value
    }

    _onChangeRadio(e) {
        this.tabDatasetSrc = e.target.value
    }

}

window.customElements.define('form-import-export-elt', FormElt)
