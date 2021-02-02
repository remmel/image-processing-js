# Project an image on mesh

- I printed and assemble to cube (cube.csv). In my case it has 68mm size (same size for the mesh).
- I used OpenCamera to get yaw (`Location Settings` > `Store yaw,pitch and roll`) and took a picture.
- I used exiftool to read yaw:
```
sudo apt install libimage-exiftool-perl
exiftool IMG_20210201_142032_0.jpg | grep "User Comment"
```
- I printed a chessboard and Use [Boofcv](https://play.google.com/store/apps/details?id=org.boofcv.android&hl=en_US&gl=US) to get fov o my camera
- I calculated the distance of the camerapose from the left cube vertical edge using focal, edge points pixel height and camera yaw.
- I rotated my cube and adjust camerapose distance.
- There are not need to get thoses numbers and make the calculation but you will have to play with the number.

Ideas:
- Calculate distance using openCV [solvePnp](https://docs.opencv.org/master/d9/d0c/group__calib3d.html#ga549c2075fac14829ff4a58bc931c033d)
- Add QRCore or whaterver code to printed cube to detect faces
- Update the texture projection when position changes to be able to adjust the postions without reloading the webpage

Huawei P20 Pro instrinsics:
- 




