# image-processing-js

Try right now a demo dataset : [pose-viewer](https://raw.githack.com/remmel/image-processing-js/master/pose-viewer/index.html)
 

To use your own dataset, 3 solutions :
1. Your dataset is accessible online, set the `datasetFolder` param with the right url. [eg](https://raw.githack.com/remmel/image-processing-js/master/pose-viewer/index.html?datasetType=ARENGINERECORDER&datasetFolder=https://mywebsite.me/dataset/scan123)
1. Start a http server in the folder where is located your dataset, and set `datasetFolder` with the server url: [eg](https://raw.githack.com/remmel/image-processing-js/master/pose-viewer/index.html?datasetType=ARENGINERECORDER&datasetFolder=http://localhost:8081)
2. If you cloned the repo and start a server, put the dataset folder or create a symlink in pose-viewer folder and set subfolder [eg](http://localhost:8081/pose-viewer/?datasetType=ARENGINERECORDER&datasetFolder=dataset/2020-11-26_121940)


## Start a server

Many ways to start a http server :
- [Web Server for Chrome extension](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb) (I havn't tried)
- Node Server: `sudo npm install --global http-server` and `npm start`
- Php server: `php -S localhost:8000`

## Create a symlink
- Linux: `pose-viewer$ ln -s ~/workspace/photogrammetry/dataset dataset`
- Windows (cmd as admin): `pose-viewer> mklink dataset "C:\Users\remme\workspace\dataset"`
