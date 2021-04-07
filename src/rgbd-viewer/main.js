
import {initRgbdViewer} from "./mainRgbdViewer";
import {initVr} from "./mainVr";
import { initFpsViewer } from './mainFpsViewer'
import { initPhoto360, initVideo360 } from './main360Viewer'

window.mainRgbdViewer = initRgbdViewer
window.mainFpsViewer = initFpsViewer
window.mainVr = initVr
window.mainPhoto360 = initPhoto360
window.mainVideo360 = initVideo360
