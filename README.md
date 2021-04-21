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

# Convert video
```shell
# Extract video to images
ffmpeg -i Chae_Demo_Upres.mp4 -vframes 3 frames/frame-%05d.png

# Resize depth
mogrify -resize 1440 -path resized1440 *.png

#magnify?
#convert 00000455_depthhue.png -filter point -resize 1440  resized1440/00000455_depthhue.png

for file in *.png; do convert $file -filter point -resize 1440 resized1440/$file; done

# Images to video
# rgb
ffmpeg -framerate 25 -start_number 354 -i %08d_image.jpg -c:v libx264 -profile:v high -crf 20 -pix_fmt yuv420p video/output_color_1440x1080.mp4
# depth
ffmpeg -framerate 25 -start_number 354 -i %08d_depthhue.png -c:v libx264 -profile:v high -crf 0 -pix_fmt yuv420p output_depth_1440x1080_crf0.mp4

# Merge rgb+depth video
ffmpeg -i output_color_1440x1080.mp4 -i output_depth_1440x1080_crf50.mp4 -filter_complex vstack output_rgbd_1440x1080_crf50.mp4

# or directly
ffmpeg -framerate 25 -start_number 354 -i %08d_image.jpg -start_number 354 -i depth/resized1440/%08d_depthhue.png -crf 0 -filter_complex vstack output_rgbd_1440x1080_direct.mp4


#scale:
-vf scale=240:180,setsar=1:1
```

```shell
# lossless?

ffmpeg -framerate 25 -start_number 354 -i %08d_image.jpg -c:v libx264 -crf 0 -pix_fmt yuv420p output_color_1440x1080_crf0.mp4
ffmpeg -framerate 25 -start_number 354 -i %08d_depthhue.png -c:v libx264 -crf 0 -pix_fmt yuv420p output_depth_1440x1080_crf0.mp4

ffmpeg -i output_color_1440x1080_crf0.mp4 -i output_depth_1440x1080_crf0.mp4 -crf 0 -filter_complex vstack output_rgbd_1440x1080_crf0b.mp4

#1 frame video
ffmpeg -i 00000354_image.jpg -i depth/resized1440/00000354_depthhue.png -crf 0 -filter_complex vstack output_rgbd_1440x1080_crf0_1f.mp4
ffmpeg -i 00000354_image.jpg -i depth/resized1440/00000354_depthhue.png -lossless 1 -filter_complex vstack output_rgbd_1440x1080_lossless_1f.webm
```

mogrify -resize 1080x1440 -path upscaled *.png


# How to store depth data in RGB ? (hue?)
Grayscale 16bits precision is 2^16=65536. As RGB is 8bit per channel <=> 2^24=16 millions
Usually we have 1<=>1mm, thus in grayscale we could store 65 meters, although we don't need so much
Thus is we want to have same range than grayscale (0-65m), max eror is 0.2cm, this is bad when for grayscale this is 1mm
```javascript
Math.floor(hsv2rgb2rgb(10066/65535) * 65535) //10069
Math.floor(hsv2rgb2rgb(10065/65535) * 65535) //9898
```

With 4m range, the max error is 8mm, this is not acceptable neither
```javascript
Math.floor(hsv2rgb2rgb(1001/4000) * 4000) //1000
Math.floor(hsv2rgb2rgb(1002/4000) * 4000) //1010
```

In hsv, with s=v=100%, h can have 2*256=1536 differents values when encoded in RGB 8b

We could also set a minrange and maxrange (clipping box), as we know that first 0.5m is not accurange

[Depthkit.js](https://juniorxsound.github.io/Depthkit.js/examples/simple.html) is using a clipping box, and only save depth between 1757 and 2486 (729)

Understand HSV: https://alloyui.com/examples/color-picker/hsv.html

[recorder-3d]:(https://github.com/remmel/recorder-3d)
[pose-viewer.html]:(https://remmel.github.com/image-processing-js/pose-viewer.html)
[video3d-editor.html]:(https://remmel.github.com/image-processing-js/video3d-editor.html)
[fps-viewer.html]:(https://remmel.github.com/image-processing-js/fps-viewer.html)
