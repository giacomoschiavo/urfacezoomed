import "core-js/stable";
import "regenerator-runtime/runtime";
import * as tf from "@tensorflow/tfjs";
import { startIndicesWithElidedDims } from "@tensorflow/tfjs-core/dist/ops/slice_util";

const blazeface = require("@tensorflow-models/blazeface");

async function doStuff() {
  try {
    const model = await blazeface.load();
    const hiddenVideo = document.getElementById("hiddenVideo");
    const camDetails = await setupWebcam(hiddenVideo); // returns [ctx, imgHeight, imgWidth]
    main(model, hiddenVideo, camDetails);
  } catch (error) {
    Swal.fire({
      title: "Woooops",
      text: "Sorry but I need to see your face🧐",
      icon: "error",
      confirmButtonText: "Ok",
    });
  }
}

async function main(model, hiddenVideo, camDetails) {
  const [ctx] = camDetails;
  const predictions = await model.estimateFaces(hiddenVideo, false);
  if (predictions.length > 0) {
    predictions.forEach((prediction) => {
      if (prediction.probability < 0.9) return;
      const start = prediction.topLeft;
      const end = prediction.bottomRight;
      const size = [end[0] - start[0], end[1] - start[1]];
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(
        hiddenVideo,
        parseInt(start[0], 0),
        parseInt(start[1], 0),
        parseInt(size[0], 0),
        parseInt(size[1], 0),
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
    });
  } else {
    ctx.drawImage(hiddenVideo, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  // console.log("Memory status:", tf.memory().numTensors);
  requestAnimationFrame(() => {
    main(model, hiddenVideo, camDetails);
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
        const detection = document.getElementById("zoomedVideo");
        const ctx = detection.getContext("2d");
        const imgWidth = videoRef.clientWidth;
        const imgHeight = videoRef.clientHeight;
        detection.width = imgWidth;
        detection.height = imgHeight;
        resolve([ctx, imgHeight, imgWidth]);
      };
    });
  } else {
    Swal.fire({
      title: "Oh, sorry!",
      text: "It seems like you have no webcam😥",
      icon: "error",
      confirmButtonText: "Alright",
    });
  }
}

doStuff();
