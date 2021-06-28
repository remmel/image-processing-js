# code to play with green chromakey, should put that somewhere else?

import cv2
import numpy as np

video = cv2.VideoCapture("output.mp4")
image = cv2.imread("photos/ghost_001.jpg")

#ffmpeg -framerate 25 -i ghost_%03d.jpg -c:v libx264 -profile:v high -crf 20 -pix_fmt yuv420p output.mp4
#merge sound: ffmpeg -i blenderoutput3.mp4 -i output-audio.aac -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 outputmerge.mp4

w = int(480);
h = int(640);


res = (w, h)
fourcc = cv2.VideoWriter_fourcc(*'XVID');
out = cv2.VideoWriter('test_vid.avi',fourcc, 10.0, res);


while True:
    ret, frame = video.read()
    if(ret == False): break;

    frame = cv2.resize(frame, (w, h))
    image = cv2.resize(image, (w, h))

    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    # define range of green color in HSV
    lower_green = np.array([50, 0, 0])
    upper_green = np.array([80, 255, 255])
    # Threshold the HSV image to extract green color
    mask = cv2.inRange(hsv, lower_green, upper_green)
    #mask = cv2.bitwise_not(mask)

    #u_green = np.array([104, 153, 70])
    #l_green = np.array([30, 30, 0])

    #mask = cv2.inRange(frame, l_green, u_green)
    res = cv2.bitwise_and(frame, frame, mask = mask)

    f = frame - res
    f = np.where(f == 0, image, f)

    # cv2.imshow("mask", mask)
    cv2.imshow("final", f)
    out.write(f);

    if cv2.waitKey(0) == 27:
        break

out.release()
video.release()
cv2.destroyAllWindows()
