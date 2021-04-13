# Intro

Main projects:

- [3D Poses Viewer][pose-viewer.html] : display poses in 3d (from photogrammetry tool or 3d scanner)
- [Video3D Editor][video3d-editor.html] : visualize volumetric video
- [FPS game][fps-viewer.html] : visualize a 3d scene with first person view; collision and gravity on mobile / desktop / VR device

Thoses projects are made in js, three.js, webpack, lit-element.
pose-viewer and video3d-editor are also used in [3d Recorder][recorder-3d]

# Pose Viewer
[pose-viewer][pose-viewer.html] is a tool to visualize the poses of a photo dataset.  
Thoses poses can be estimated by photogrammetry tool (free opensource Meshroom, Metashape...) or AR capture tool ([3d live scanner](https://play.google.com/store/apps/details?id=com.lvonasek.arcore3dscanner); my app [3d Recorder][recorder-3d]...)  

With that online tool, you can choose a demo dataset, remote dataset (url), or local dataset. 
For developers: it also possible to start a local server to serve your local dataset, but using the online tool.

It is possible to import and export the poses in many format.

# Video3D Editor

[Video3D Editor][video3d-editor.html] : can currently only visualize 3d video

Thoses rgbd images can be: rgb(jpg) + depth(depth16.bin) or rgb(jpg) + depth(16b grayscale png)

Todos:
- add depth cropping box
- add rgb cropping rectangle
- view the animation in realtime (not 5fps) 
  Viewing the video in realtime takes too much GPU memory : ~12MB per frame.  
  To avoid that, after each frame the texture is removed from memory (.disposed()) and reloaded at next animation loop  
  But it takes ~200ms <=> 5fps; when 30 fps <=> 33ms would be perfect

# FPS viewer
- Fps mode: Walk in a 3d scene as you will be in a 3d game. Collision and gravity handled.
- Editor mode: move the object to help configurating the scene

Todos:
- Merge the VR app with that one ?

# Developers

## Install the project
```shell
git clone git@github.com:remmel/image-processing-js.git
cd image-processing-js
npm install
npm run start
```
Then open https://localhost:9000/pose-viewer.html (ssl is fake, but requiered for VR)

### Create a symlink
- Linux: `image-processing-js/dist$ ln -s ~/workspace/dataset dataset`
- Windows: `image-processing-js/dist> mklink dataset "C:\Users\remme\workspace\dataset"` (cmd as admin or Developer mode on)

## Only serve your dataset via http

Many ways to start a http server, among them :
- Node Server: `sudo npm install --global http-server` and `npm start`
- Php server: `php -S localhost:8000`
- [Chrome extension](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb)

# Troubleshooting
## Cannot import multiple files on Android
You might need to install specific file picker to be able to do that. I works with [Cx File Explorer](https://play.google.com/store/apps/details?id=com.cxinventor.file.explorer)

## Cannot import folder on Android
It doesn't work neither on my smartphone. Because of OS file picker according to [caniuse](https://caniuse.com/input-file-directory)

## Npm http-server error
Error `Error: EPERM: operation not permitted, stat` is produced on Windows 10 when using symlink and npm; don't know how to fix that, expect not using symlink, using php webserver instead or using a second webserver for dataset.

# Interesting resources
- [React + Threejs](https://blog.bitsrc.io/starting-with-react-16-and-three-js-in-5-minutes-3079b8829817)
- https://stemkoski.github.io/AR-Examples/
- http://www.threejsgames.com/extensions/
- https://discoverthreejs.com/book/contents/
- VR in desktop / barrel effect
  - https://www.creativebloq.com/how-to/get-started-with-webvr
  - https://github.com/googlearchive/vrview
  - https://stackoverflow.com/questions/46205117/three-js-custom-vr-cardboard-effect
  - https://threejs.org/examples/#webgl_effects_stereo
  - https://github.com/mrdoob/three.js/issues/8400
  - https://www.decarpentier.nl/downloads/lensdistortion-webgl/lensdistortion-webgl.html


[recorder-3d]:(https://github.com/remmel/recorder-3d)
[pose-viewer.html]:(https://remmel.github.com/image-processing-js/pose-viewer.html)
[video3d-editor.html]:(https://remmel.github.com/image-processing-js/video3d-editor.html)
[fps-viewer.html]:(https://remmel.github.com/image-processing-js/fps-viewer.html)
