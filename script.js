const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const imageInput = document.getElementById("imageInput");
const downloadLink = document.getElementById("downloadLink");

let img = new Image();
let imageData;

// Load the selected image into the canvas
imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            img.onload = function() {
                // Draw image on canvas
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                // Save image data for trimming
                imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

// Trim and resize the image to desired dimensions while maintaining the aspect ratio
function trimAndResizeImage() {
    const image = imageData;
    const pixels = image.data;
    const width = canvas.width;
    const height = canvas.height;

    // 1. Find the most common color (background color using clustering)
    let colorCounts = {};
    let maxColorCount = 0;
    let backgroundColor = null;

    // Analyze pixels for the most frequent color
    for (let i = 0; i < pixels.length; i += 4) {
        const color = `rgb(${pixels[i]},${pixels[i + 1]},${pixels[i + 2]})`;
        colorCounts[color] = (colorCounts[color] || 0) + 1;
        if (colorCounts[color] > maxColorCount) {
            maxColorCount = colorCounts[color];
            backgroundColor = color;
        }
    }

    // 2. Trim the image based on the background color
    let top = height, left = width, bottom = 0, right = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const r = pixels[index];
            const g = pixels[index + 1];
            const b = pixels[index + 2];

            const pixelColor = `rgb(${r},${g},${b})`;

            if (pixelColor !== backgroundColor) {
                if (y < top) top = y;
                if (y > bottom) bottom = y;
                if (x < left) left = x;
                if (x > right) right = x;
            }
        }
    }

    // 3. Calculate the width and height of the trimmed image
    const trimmedWidth = right - left + 1;
    const trimmedHeight = bottom - top + 1;

    // If no content is found, return
    if (trimmedWidth <= 0 || trimmedHeight <= 0) {
        alert("No content found in the image.");
        return;
    }

    // 4. Create a new canvas with the trimmed size
    const trimmedCanvas = document.createElement("canvas");
    const trimmedCtx = trimmedCanvas.getContext("2d");

    trimmedCanvas.width = trimmedWidth;
    trimmedCanvas.height = trimmedHeight;

    // Draw the trimmed image onto the new canvas
    trimmedCtx.putImageData(image, -left, -top);

    // 5. Resize the image while maintaining the aspect ratio
    const targetWidth = 360;
    const targetHeight = 180;

    let scaleFactor = Math.min(targetWidth / trimmedWidth, targetHeight / trimmedHeight);

    // Calculate the new dimensions
    const resizedWidth = trimmedWidth * scaleFactor;
    const resizedHeight = trimmedHeight * scaleFactor;

    // Create the resized canvas
    const resizedCanvas = document.createElement("canvas");
    const resizedCtx = resizedCanvas.getContext("2d");
    
    resizedCanvas.width = resizedWidth;
    resizedCanvas.height = resizedHeight;

    // Draw the resized image
    resizedCtx.drawImage(trimmedCanvas, 0, 0, resizedWidth, resizedHeight);

    // Convert the resized image to a data URL for downloading
    const resizedImageDataURL = resizedCanvas.toDataURL();
    downloadLink.href = resizedImageDataURL;
    downloadLink.download = "trimmed-and-resized-image.png";
    downloadLink.style.display = "inline-block";
}
