For the future myself, with fish memory...

It was really difficult to find a png browser lib which is compatible with PNG 16 grayscale and works properly 

//jimp does not handle grayscale 16b // import Jimp from 'jimp/browser/lib/jimp'
//pngtoy - decoded has 1 bit shift
// var pngtoy = new PngToy(); await pngtoy.fetch(sogh); var raw = pngtoy.getChunk("IDAT"); var decoded = await P.decode(); (script tag)
//pngjs (@vivaxy/png) does not handle 16b grayscale
//pngjs3 error importing Parser
//read-png : use canvas, thus not working for 16b grayscale
//png-es6 : worker, not sure ok no canvas in browser // import { fromImageData } from 'png-es6';


```javascript
// TUM PNG 16b grayscale on dropbox (CORS OK)
const depthurl = "https://uc89daeff68107502f68265ef5a0.previews.dropboxusercontent.com/p/thumb/ABEy1DSpxsZQI8_1ZJrnTQ0Sxz6K4GVfKpeeAT3VgwsYdF3iM1I16J3k1dEBHcM4mW8_JjshtmTZVP05bZbtm3anqKB2bUK9TYMOk7DvW2bWO-SfZbaGhDfkJlmtbfuQvnp4WetRA2ptiCkOjtYuIfJHDrtKnjnHtGnSmgWQs_fH8z-An4dT94J6wt-RVK9wc9hSXcl-yEP1_GbY-2oMd0OfibSnbn1TKW27uAMQ8wPj-AMH7meBjznSr3jUPrn_WZW5GeFAkVi3UUUERAxmucOwloPHICKxBDg6v098GwxgvOE92cJGweOKMizxxUOdQBm1Wx8ehHMpb8Ps59DcuysqBlwDtJvdYktsxmzJ9XhPo7Bmu5RDkoIcWkpY8-HalYT29jBoIV2MhMNk8B86jVKy/p.png?fv_content=true&size_mode=5"
var bin = await((await fetch(depthurl)).arrayBuffer());
```

https://stackoverflow.com/questions/66308827/how-to-load-16-bits-grayscale-png-in-opencv-js
https://github.com/oliver-moran/jimp/issues/988
