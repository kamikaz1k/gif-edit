window.utils = {
  debounce: (func, delay) => {
    let lastTimeout = window.performance.now();
    let queued = 0;
    let consuming = false;

    function queueConsumer() {
      // console.log('debounce worker state', { queued, delay, latency: window.performance.now() - lastTimeout });
      lastTimeout = window.performance.now();
      if (queued === 0) {
        consuming = false;
        return;
      }

      queued = 0;
      setTimeout(queueConsumer, delay);
      func(); // so the debounce doesn't get affected by the latency of the wrapped function
    }

    return () => {
      if (consuming) {
        queued++;
        return;
      }

      consuming = true;
      setTimeout(queueConsumer, delay);
      func(); // so the debounce doesn't get affected by the latency of the wrapped function
    }
  },

  timed: (func) => {
    const start = window.performance.now();
    let result = null;
    let exception = null;
    try {
      result = func();
    } catch (e) {
      exception = e;
    }

    console.log(`### timed ${func.name}: ${window.performance.now() - start}`);

    if (exception) throw exception;

    return result;
  },

  find: (selector) => document.querySelector(selector),

  findAll: (selector) => document.querySelectorAll(selector),

  hide: function hide(elementOrSelector) {
    if (!elementOrSelector.nodeType) {
      elementOrSelector = this.find(elementOrSelector);
    }
    elementOrSelector.classList.add("hidden");
  },

  reveal: function reveal(elementOrSelector) {
    if (!elementOrSelector.nodeType) {
      elementOrSelector = this.find(elementOrSelector);
    }
    elementOrSelector.classList.remove("hidden");
  },

  addSlider: ({ containerDiv, sliderId, label, onUpdate, startingValue = 0.5 }) => {
    const div = document.createElement('div');

    div.id = sliderId;
    div.classList.add('dragdealer');
    div.innerHTML = `<div class="handle bar slider-button">${label}</div>`

    containerDiv.appendChild(div);

    return new Dragdealer(sliderId, { x: startingValue, animationCallback: (x, y) => onUpdate(x) });
  },

  getPositionForCursor: function(element, e) {
    if (['mousedown', 'mousemove', 'mouseup'].includes(e.type)) {
      const box = element.getBoundingClientRect();

      return {
        x: e.x - box.left,
        y: e.y - box.top
      };
    }
  },

  getPositionForTouchMove: function(element, event) {
    const touchEvent = event.targetTouches[0];
    const box = element.getBoundingClientRect();

    return {
      x: touchEvent.clientX - box.left,
      y: touchEvent.clientY - box.top
    };
  }
};

    // var { sizeRatio, top, left } = vars;
    // var vertOffset = canvas.height * sizeRatio;
    // var vertRange = canvas.height + vertOffset;

    // var horizontalOffset = canvas.width * sizeRatio;
    // var horizontalRange = canvas.width + horizontalOffset;
    // var x = left * horizontalRange;
    // var y = top * vertRange;
    // var ctx = canvas.getContext("2d");
    // ctx.globalCompositeOperation = "source-over"; // layer on top
    // console.log('drawImage', image, x - horizontalOffset, y - vertOffset, image.width * sizeRatio, image.height * sizeRatio);
    // ctx.drawImage(image, x - horizontalOffset, y - vertOffset, image.width * sizeRatio, image.height * sizeRatio);


(() => {
  function boundedRectangle(width, height, widthToHeightRatio) {
    const ratio = width / height;

    if (ratio == widthToHeightRatio) {
      return { width, height };
    }

    // source is wider than destination
    if (widthToHeightRatio > ratio) {
      return { width, height: width / widthToHeightRatio };
    }

    // source is taller than destination
    return {
      height,
      width: height * widthToHeightRatio
    };
  }

  function resizeAndOffsetImage(image, destinationCanvas, { sizeRatio, top, left }) {
    const {
      height,
      width
    } = boundedRectangle(destinationCanvas.width, destinationCanvas.height, image.width / image.height);

    const finalHeight = height * sizeRatio;
    const finalWidth = width * sizeRatio;

    const horizontalRange = (destinationCanvas.width + finalWidth);
    const vertRange = (destinationCanvas.height + finalHeight);

    const x = left * horizontalRange;
    const y = top * vertRange;

    const ctx = destinationCanvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over"; // layer on top

    ctx.drawImage(image, x - finalWidth, y - finalHeight, finalWidth, finalHeight);

    return destinationCanvas;
  }

  function flipImage(imgElement) {
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = imgElement.width;
    overlayCanvas.height = imgElement.height;

    const overlayCtx = overlayCanvas.getContext("2d");
    overlayCtx.translate(imgElement.width, 0);
    overlayCtx.scale(-1, 1);
    overlayCtx.drawImage(imgElement, 0, 0);

    return overlayCanvas;
  }

  function calculateRotation(sliderRotationValue) {
    const angle = (sliderRotationValue - 0.5) * 360; // normalize 0 - 1.0 to -0.5 - 0.5
    let radianAngle = angle * Math.PI / 180;

    return radianAngle;
  }

  function calculateRotatedImageSize(oWidth, oHeight, radianAngle) {
    let adjustedRadianAngle = Math.abs(radianAngle);
    if (adjustedRadianAngle > Math.PI / 2) {
      adjustedRadianAngle = Math.PI - adjustedRadianAngle;
    }

    return {
      adjustedRadianAngle: adjustedRadianAngle,
      width: oWidth * Math.cos(adjustedRadianAngle) + oHeight * Math.sin(adjustedRadianAngle),
      height: oWidth * Math.sin(adjustedRadianAngle) + oHeight * Math.cos(adjustedRadianAngle)
    }
  }

  function rotateImage(imgElement, sliderRotationValue) {
    const overlayCanvas = document.createElement('canvas');
    const overlayCtx = overlayCanvas.getContext("2d");

    if (sliderRotationValue === 0.5) {
      overlayCanvas.width = imgElement.width;
      overlayCanvas.height = imgElement.height;

      overlayCtx.drawImage(imgElement, 0, 0);
      return overlayCanvas;
    }

    const radianAngle = calculateRotation(sliderRotationValue);

    const { width, height } = calculateRotatedImageSize(imgElement.width, imgElement.height, radianAngle);
    overlayCanvas.width = width;
    overlayCanvas.height = height;

    overlayCtx.translate(overlayCanvas.width / 2, overlayCanvas.height / 2);
    overlayCtx.rotate(radianAngle);

    overlayCtx.drawImage(imgElement, -imgElement.width / 2, -imgElement.height / 2);

    return overlayCanvas;
  }

  window.imageUtils = {
    resizeAndOffsetImage,
    flipImage,
    calculateRotation,
    calculateRotatedImageSize,
    rotateImage,
    boundedRectangle,
  };
})();
