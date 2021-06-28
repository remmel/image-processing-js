 
I'm currently working on volumetric video, I can record with [my app](https://github.com/remmel/recorder-3d) I developed for Huawei Tof phones

A) 1 Mesh per frame
I tried to display the video creating 1 mesh per frame (depth:180x240 50KB, rgb:1440x1080 1MB), but it takes ~200ms to create and 14MB in memory per frame, thus 2sec video takes 2*30*14=840MB which is huge. Because it creates ~200ms to create, I cannot "create on the fly" on dispose the model. Until now I only make a small 5s anim with 5fps.
(I found 2 solutions, a group with all the models, and at every frame I hide all execpt the wanted one, or using an animation `new THREE.BooleanKeyframeTrack('.visible', times, values)`)

You will find demos there: https://github.com/remmel/image-processing-js

B) Encode as video, depth use hsv (hue) color map
A solution is to use VideoTexture and using shaders to create the mesh and texture, this is quick, without memory problem but in that case part of the information is lost.

A way to store the depth value in "color" was to use the 16 bits grayscale (2^16 values, allow me to store range from 0 to 65meters with 1 mm precision - the sensor give me 1mm precision range between 0-5m)  but video usually allow 8bit per channel, and thus the gray (R=G=B) will only have 256 differents values (2^8 bits). Without thinking about compression impact on depth information. Thus storing in gray video is not ok.

The https://threejs.org/examples/?q=kinect#webgl_video_kinect




, but how can I store the depth map video in a rgb way without loosing information?
The depth can be stored in 16bit PNG grayscale  , but as video 


https://gist.github.com/mrdoob/1326080
