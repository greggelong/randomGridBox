// --- Config ---
let cells = 8;
let gridSize = 480; // total grid span (X/Z)
let spacing; // computed from gridSize / cells
let totalBoxes = 22; // how many boxes per round
let animationSpeed = 30; // frames between revealing boxes

// --- State ---
let grid = []; // centers of each cell (x, y=0, z)
let boxes = []; // { pos: p5.Vector, type: 'small|medium|large', size, color, notation }
let boxesToShow = 0; // reveal counter
let savedThisRound = false;

let cols = ["A", "B", "C", "D", "E", "F", "G", "H"];
let font;
let cnv;

function preload() {
  // Use your OTF font path
  font = loadFont(
    "https://greggelong.github.io/randomGridBox/assets/Chunk.otf"
  );
}

function setup() {
  //createCanvas(800, 800, WEBGL);
  cnv = createCanvas(800, 800, WEBGL);
  let cx = (windowWidth - cnv.width) / 2;
  let cy = (windowHeight - cnv.height) / 2;
  cnv.position(cx, cy);
  textFont(font);
  textSize(20);
  textAlign(CENTER, CENTER);

  // Create a div to display placements
  outputDiv = createDiv("Instructions will appear. . .");
  outputDiv.style("width", "300px");
  outputDiv.style("border", "1px solid black");
  outputDiv.style("padding", "10px");
  outputDiv.style("font-size", "24px");
  outputDiv.style("background-color", "#ADD8E6");
  outputDiv.position(cx, cy + cnv.height);

  spacing = gridSize / cells;

  // Build grid centers on XZ plane (y = 0)
  for (let i = 0; i < cells; i++) {
    grid[i] = [];
    for (let j = 0; j < cells; j++) {
      let x = -gridSize / 2 + i * spacing + spacing / 2;
      let z = -gridSize / 2 + j * spacing + spacing / 2;
      grid[i][j] = createVector(x, 0, z);
    }
  }

  pickRandomBoxes();
}

function draw() {
  background(30);

  // Nice, neutral lighting (keeps your colors but gives shape)
  ambientLight(80);
  directionalLight(255, 255, 255, 0.3, -1, -0.2);
  directionalLight(180, 180, 220, -0.5, 0.4, -0.5);

  // View tilt (board stays flat in XZ, y=up)
  rotateX(-PI / 6);
  rotateY(PI / 4);

  stroke(255);
  strokeWeight(2);

  // --- Draw grid lines on XZ plane (y=0) ---
  for (let i = 0; i <= cells; i++) {
    const p = -gridSize / 2 + i * spacing;
    // lines parallel to X (varying z)
    line(-gridSize / 2, 0, p, gridSize / 2, 0, p);
    // lines parallel to Z (varying x)
    line(p, 0, -gridSize / 2, p, 0, gridSize / 2);
  }

  // --- Labels (flat on board): letters bottom, numbers left ---
  push();
  // Text normally draws in XY; rotate into XZ so it lies flat
  rotateX(HALF_PI);
  noStroke();
  fill(255);

  // Letters A–H along the bottom edge (near viewer = max Z)
  for (let i = 0; i < cells; i++) {
    const x = -gridSize / 2 + spacing / 2 + i * spacing;
    const z = gridSize / 2 + 20; // just outside the board
    text(cols[i], x, z);
  }

  // Numbers 8→1 down the left edge (far=8 at top, near=1 at bottom)
  for (let j = 0; j < cells; j++) {
    const rowLabel = j + 1; // chess order: far=8 ... near=1
    const x = -gridSize / 2 - 20; // just left of the board
    const z = gridSize / 2 - spacing / 2 - j * spacing;
    text(rowLabel, x, z);
  }
  pop();

  // --- Reveal boxes one at a time ---
  if (frameCount % animationSpeed === 0 && boxesToShow < boxes.length) {
    boxesToShow++;
  }

  // --- Draw visible boxes (sit on the grid) ---
  noStroke();
  for (let k = 0; k < boxesToShow; k++) {
    const b = boxes[k];
    push();
    // y is vertical; move up by half height so it sits on y=0 plane
    translate(b.pos.x, -b.size / 2, b.pos.z);
    ambientMaterial(b.color[0], b.color[1], b.color[2]);
    box(b.size);
    pop();
  }

  // --- Save once, after all boxes are visible ---
  if (boxesToShow === boxes.length && !savedThisRound) {
    const lines = boxes.map((b) => `${b.type} box at ${b.notation}`);
    saveStrings(lines, "placements.txt");
    // call AFTER drawing so the boxes appear in the image
    saveCanvas("board_snapshot", "png");
    // Show placements in the DOM
    outputDiv.html(lines.join("<br/>"));

    savedThisRound = true;
    // If you want it to loop with new random boxes, uncomment next lines:
    // pickRandomBoxes();
    // boxesToShow = 0;
    // savedThisRound = false;
  }
}

// Create a new random set of boxes
function pickRandomBoxes() {
  boxes = [];
  boxesToShow = 0;
  savedThisRound = false;

  for (let n = 0; n < totalBoxes; n++) {
    const i = floor(random(cells)); // column index 0..7
    const j = floor(random(cells)); // row index 0..7 (0 = far, 7 = near)
    const pos = grid[i][j];

    const type = random(["small", "medium", "large"]);
    let size;
    if (type === "small") size = spacing * 0.4;
    else if (type === "medium") size = spacing * 0.6;
    else size = spacing * 0.8;

    const color = [random(60, 255), random(60, 255), random(60, 255)];

    // Chess notation: columns A–H, rows 1 (near) to 8 (far)
    const notation = cols[i] + (cells - j);

    boxes.push({
      pos: pos.copy(),
      type,
      size,
      color,
      notation,
    });
  }
}
