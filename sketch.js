let font;
let textInput;
let circles = [];
let spots = [];
let prevText = "";

function preload() {
  font = loadFont('Inter_18pt-SemiBold.ttf'); 
}

function setup() {
  createCanvas(windowWidth, windowHeight); 
  textInput = select('#textInput');
  updateSpots(textInput.value().trim()); 
}

function draw() {
  background(255); 
  drawWaterRipples();   

  let currentText = textInput.value().trim();
  if (currentText !== prevText) {
    updateSpots(currentText);
    prevText = currentText;
  }

  if (spots.length === 0) return;

  let count = 5; 
  for (let i = 0; i < count; i++) {
    let newC = createNewCircle();
    if (newC !== null) {
      circles.push(newC);
    }
  }

  for (let c of circles) {
    if (c.growing) {
      if (c.edges() || c.overlaps(circles)) {
        c.growing = false;
      } else {
        c.grow();
      }
    }
    c.show();
  }

  drawGrain();
}

function drawWaterRipples() {
  noFill();
  stroke(180, 180); 
  strokeWeight(0.5);

  let numRipples = 3; 
  let t = frameCount * 0.03; 

  for (let i = 0; i < numRipples; i++) {
    let cx = noise(i * 1000) * width;
    let cy = noise(i * 2000) * height;

    let rippleCount = 3 + int(noise(i * 3000) * 3); 
    for (let j = 0; j < rippleCount; j++) {
      let baseRadius = 300 + j * 350;
      let radius = baseRadius + sin(t + i + j) * 20; 

      beginShape();
      let detail = 100;
      for (let a = 0; a <= TWO_PI; a += TWO_PI / detail) {
        let xOff = sin(a * 4 + t + i) * 3; 
        let yOff = cos(a * 4 + t + i) * 3;

        let x = cx + (radius + xOff) * cos(a);
        let y = cy + (radius + yOff) * sin(a);
        vertex(x, y);
      }
      endShape(CLOSE);
    }
  }
}

function drawGrain() {
  let density = pixelDensity();
  let totalPixels = 4 * (width * density) * (height * density);

  loadPixels();
  for (let i = 0; i < totalPixels; i += 4) {
    let noiseVal = random(255);
    pixels[i]     = lerp(pixels[i], noiseVal, 0.1);
    pixels[i + 1] = lerp(pixels[i + 1], noiseVal, 0.1);
    pixels[i + 2] = lerp(pixels[i + 2], noiseVal, 0.1);
  }
  updatePixels();
}

function updateSpots(textValue) {
  spots = [];
  circles = [];

  if (textValue === "") return;

  let pg = createGraphics(width, height);
  pg.pixelDensity(1);
  pg.background(255);
  pg.textFont(font);
  const baseFontSize = 300;
  pg.textSize(baseFontSize);
  pg.fill(0);
  pg.textAlign(CENTER, TOP);

  const maxWidth = width * 0.8;
  const lineSpacing = 1;
  const lineHeight = baseFontSize * lineSpacing;

  const words = textValue.split(" ");
  let lines = [];
  let currentLine = "";

  for (let w of words) {
    let testLine = currentLine + w + " ";
    if (pg.textWidth(testLine) > maxWidth) {
      lines.push(currentLine.trim());
      currentLine = w + " ";
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine.trim());

  const startY = (height - lines.length * lineHeight) / 2;

  for (let i = 0; i < lines.length; i++) {
    pg.text(lines[i], width / 2, startY + i * lineHeight);
  }

  pg.loadPixels();

  for (let x = 0; x < pg.width; x += 4) {
    for (let y = 0; y < pg.height; y += 4) {
      let index = (x + y * pg.width) * 4;
      let brightness = (pg.pixels[index] + pg.pixels[index + 1] + pg.pixels[index + 2]) / 3;
      if (brightness < 128) {
        spots.push(createVector(x, y));
      }
    }
  }
}

function createNewCircle() {
  let attempts = 0;
  while (attempts < 100) {
    let spot = random(spots);
    let valid = true;
    for (let c of circles) {
      let d = dist(spot.x, spot.y, c.x, c.y);
      if (d < c.r + 2) {
        valid = false;
        break;
      }
    }
    if (valid) {
      return new Circle(spot.x, spot.y);
    }
    attempts++;
  }
  return null;
}

class Circle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 1;
    this.growing = true;

    this.baseMaxR = 18;
    this.maxRRange = 4;
    this.maxR = this.baseMaxR;
  }

  grow() {
    let pulse = sin(frameCount * 0.04 + this.x * 0.01) * 0.5 + 0.5;
    this.maxR = this.baseMaxR + this.maxRRange * pulse;

    if (this.r < this.maxR) {
      this.r += 0.5;
    } else {
      this.growing = false;
    }
  }

  edges() {
    return (
      this.x + this.r > width ||
      this.x - this.r < 0 ||
      this.y + this.r > height ||
      this.y - this.r < 0
    );
  }

  overlaps(others) {
    for (let other of others) {
      if (other !== this) {
        let d = dist(this.x, this.y, other.x, other.y);
        if (d < this.r + other.r) {
          return true;
        }
      }
    }
    return false;
  }

  show() {
    noFill();
    stroke(0);
    strokeWeight(1);

    let offsetX = sin(frameCount * 0.02 + this.x * 0.05) * 2;
    let offsetY = cos(frameCount * 0.015 + this.y * 0.05) * 2;

    let cx = this.x + offsetX;
    let cy = this.y + offsetY;
    let r = this.r;

    beginShape();
    let detail = 100;
    for (let i = 0; i <= detail; i++) {
      let angle = TWO_PI * (i / detail);
      let wiggle = sin(angle * 2 + frameCount * 0.1 + this.x) * 0.3;
      let rx = (r + wiggle) * cos(angle);
      let ry = (r + wiggle) * sin(angle);
      vertex(cx + rx, cy + ry);
    }
    endShape(CLOSE);
  }
}
