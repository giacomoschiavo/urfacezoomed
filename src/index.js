import "core-js/stable";
import "regenerator-runtime/runtime";
import * as tf from "@tensorflow/tfjs";
import { CLASSES } from "./labels";

const blazeface = require("@tensorflow-models/blazeface");
async function doStuff() {
  try {
    const model = await blazeface.load();
    const mysteryVideo = document.getElementById("mystery");
    const camDetails = await setupWebcam(mysteryVideo); // returns [ctx, imgHeight, imgWidth]
    main(model, mysteryVideo, camDetails);
  } catch (error) {
    console.log(error);
  }
}

async function main(model, mysteryVideo, camDetails) {
  const [ctx] = camDetails;
  const predictions = await model.estimateFaces(mysteryVideo, false);

  if (predictions.length > 0) {
    /*
    [
      {
        topLeft: [232.28, 145.26],
        bottomRight: [449.75, 308.36],
        probability: [0.998],
        landmarks: [
          [295.13, 177.64], // right eye
          [382.32, 175.56], // left eye
          [341.18, 205.03], // nose
          [345.12, 250.61], // mouth
          [252.76, 211.37], // right ear
          [431.20, 204.93] // left ear
        ]
      }
    ]
    */
    predictions.forEach((prediction) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const start = prediction.topLeft;
      const end = prediction.bottomRight;
      const size = [end[0] - start[0], end[1] - start[1]];
      // ctx.drawImage(mysteryVideo, 0, 0, ctx.canvas.width, ctx.canvas.height);

      // Render a rectangle over each detected face.
      ctx.drawImage(
        mysteryVideo,
        start[0],
        start[1],
        size[0],
        size[1],
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
      // ctx.strokeRect(start[0], start[1], size[0], size[1]);

      // const landmarks = prediction.landmarks;
      // ctx.fillStyle = "blue";
      // for (let j = 0; j < landmarks.length; j++) {
      //   const x = landmarks[j][0];
      //   const y = landmarks[j][1];
      //   ctx.fillRect(x, y, 5, 5);
      // }
    });
  } else {
    ctx.drawImage(mysteryVideo, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  // tf.dispose([model]);

  console.log("Memory status:", tf.memory().numTensors);
  requestAnimationFrame(() => {
    main(model, mysteryVideo, camDetails);
  });
}

async function setupWebcam(videoRef) {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const webcamStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: "user" },
    });

    // compatibility for older browsers
    if ("srcObject" in videoRef) {
      videoRef.srcObject = webcamStream;
    } else {
      videoRef.src = window.URL.createObjectURL(webcamStream);
    }

    return new Promise((resolve, _) => {
      videoRef.onloadedmetadata = () => {
        const detection = document.getElementById("detection");
        const ctx = detection.getContext("2d");
        const imgWidth = videoRef.clientWidth;
        const imgHeight = videoRef.clientHeight;
        detection.width = imgWidth;
        detection.height = imgHeight;
        resolve([ctx, imgHeight, imgWidth]);
      };
    });
  } else {
    alert("no webcam");
  }
}

doStuff();
