
//https://docs.opencv.org/3.4/df/d6c/tutorial_js_face_detection_camera.html

//====================================

// function main() {
  import { OpenCVUtils } from './OpenCVUtils'



let utils = new OpenCVUtils('errorMessage');

  // utils.loadCode('codeSnippet', 'codeEditor');

  let streaming = false;
  let videoInput = document.getElementById('videoInput');
  let startAndStop = document.getElementById('startAndStop');
  let canvasOutput = document.getElementById('canvasOutput');
  let canvasContext = canvasOutput.getContext('2d');

  startAndStop.addEventListener('click', () => {
    if (!streaming) {
      utils.clearError();
      utils.startCamera('qvga', onVideoStarted, 'videoInput');
    } else {
      utils.stopCamera();
      onVideoStopped();
    }
  });

  function onVideoStarted() {
    streaming = true;
    startAndStop.innerText = 'Stop';
    videoInput.width = videoInput.videoWidth;
    videoInput.height = videoInput.videoHeight;
    codeEditor()
  }

  function onVideoStopped() {
    streaming = false;
    canvasContext.clearRect(0, 0, canvasOutput.width, canvasOutput.height);
    startAndStop.innerText = 'Start';
  }

  utils.loadOpenCv(() => {
    let faceCascadeFile = 'haarcascade_frontalface_default.xml';
    utils.createFileFromUrl(faceCascadeFile, 'experiments/ip/' + faceCascadeFile, () => {
      startAndStop.removeAttribute('disabled');
    });
  });

// }
//

// window.main = main


function codeEditor() {
  let video = document.getElementById('videoInput');
  let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  let dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  let gray = new cv.Mat();
  let cap = new cv.VideoCapture(video);
  let faces = new cv.RectVector();
  let classifier = new cv.CascadeClassifier();
debugger
// load pre-trained classifiers
  classifier.load('haarcascade_frontalface_default.xml');

  const FPS = 30;
  function processVideo() {
    try {
      if (!streaming) {
        // clean and stop.
        src.delete();
        dst.delete();
        gray.delete();
        faces.delete();
        classifier.delete();
        return;
      }
      let begin = Date.now();
      // start processing.
      cap.read(src);
      src.copyTo(dst);
      cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
      // detect faces.
      classifier.detectMultiScale(gray, faces, 1.1, 3, 0);
      // draw faces.
      for (let i = 0; i < faces.size(); ++i) {
        let face = faces.get(i);
        let point1 = new cv.Point(face.x, face.y);
        let point2 = new cv.Point(face.x + face.width, face.y + face.height);
        cv.rectangle(dst, point1, point2, [255, 0, 0, 255]);
      }
      cv.imshow('canvasOutput', dst);
      // schedule the next one.
      let delay = 1000/FPS - (Date.now() - begin);
      setTimeout(processVideo, delay);
    } catch (err) {
      utils.printError(err);
    }
  };

// schedule the first one.
  setTimeout(processVideo, 0);
}
