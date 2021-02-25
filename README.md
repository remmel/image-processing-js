Multiples project : `pose-viewer` (webpack) and [experimentations](http://remmel.github.com/image-processing-js/experiments/) (es6 modules)

# Pose Viewer

Try right now a demo dataset : [pose-viewer](http://remmel.github.com/image-processing-js/pose-viewer.html)

To use your own dataset, 3 solutions :
1. Easier way, Select the folder containing all the data.
2. Your dataset is accessible online, set the `datasetFolder` param with the right url. [eg](http://remmel.github.com/image-processing-js/pose-viewer.html?datasetType=ARENGINERECORDER&datasetFolder=https://mywebsite.me/dataset/scan123)
3. Start a http server in the folder where is located your dataset, and set `datasetFolder` with the server url: [eg](http://remmel.github.com/image-processing-js/pose-viewer.html?datasetType=ARENGINERECORDER&datasetFolder=http://localhost:8081)
4. If you cloned the repo and start a server, put the dataset folder or create a symlink in pose-viewer folder and set subfolder [eg](http://localhost:8081/pose-viewer/?datasetType=ARENGINERECORDER&datasetFolder=dataset/2020-11-26_121940)


## Run the project on your computer (4)
```shell
git clone git@github.com:remmel/image-processing-js.git
cd image-processing-js
npm install
npm run start
```
Then open http://localhost:9000/pose-viewer.html

## Start a server, to access your dataset via http (3)

Many ways to start a http server :
- Node Server: `sudo npm install --global http-server` and `npm start`
- Php server: `php -S localhost:8000`

## Create a symlink
- Linux: `pose-viewer$ ln -s ~/workspace/dataset dataset`
- Windows: `pose-viewer> mklink dataset "C:\Users\remme\workspace\dataset"` (cmd as admin or Developer mode on)

# Troubleshooting
## Cannot import multiple files on Android
You might need to install specific file picker to be able to do that. I works with [Cx File Explorer](https://play.google.com/store/apps/details?id=com.cxinventor.file.explorer)

## Cannot import folder on Android
It doesn't work neither on my smartphone. Because of OS file picker according to [caniuse](https://caniuse.com/input-file-directory)

## Npm http-server error
Error `Error: EPERM: operation not permitted, stat` is produced on Windows 10 when using symlink; don't know how to fix that, expect not using symlink, using php webserver instead or using a second webserver for dataset.


# TODOs
- use react https://blog.bitsrc.io/starting-with-react-16-and-three-js-in-5-minutes-3079b8829817


# Interesting resources
https://stemkoski.github.io/AR-Examples/
http://www.threejsgames.com/extensions/
