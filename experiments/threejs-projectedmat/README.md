# Project an image on mesh

- I printed and assemble to cube (cube.csv). In my case it has 68mm size (same size for the mesh).
- I used OpenCamera to get yaw (`Location Settings` > `Store yaw,pitch and roll`) and took a picture.
- I used exiftool to read yaw:
```
sudo apt install libimage-exiftool-perl
exiftool IMG_20210201_142032_0.jpg | grep "User Comment"
```
- I printed a chessboard and Use [Boofcv](https://play.google.com/store/apps/details?id=org.boofcv.android&hl=en_US&gl=US) to get fov o my camera
- The camera pose position is calculated (using the real cube side size, distance between that camera and from the left cube vertical edge, focal, edge points pixel height and camera yaw).
- I rotated my cube.

Ideas:
- Determine pose using openCV [solvePnp](https://docs.opencv.org/master/d9/d0c/group__calib3d.html#ga549c2075fac14829ff4a58bc931c033d)
- Add QRCode or whaterver code to printed cube to detect faces easier





