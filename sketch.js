//LOGICA DELLA RAPPRESENTAZIONE

//5 colonne considerate: name, length, discharge, continent, avg_temp

//Ogni fiume è rappresentato da una spirale;
//I fiumi sono raggruppati per continente;
//I continenti sono ordinati per numero totale di fiumi in modo decrescente (dal continente con più fiumi a quello con meno fiumi);
//In ciascun continente, i fiumi sono ordinati a seconda della lunghezza in modo decrescente (dal fiume più lungo al più corto);
//Il colore della spirale dipende dalla temperatura media del fiume: se è bassa il blu è più brillante, se è alta il blu è meno brillante;
//Lo spessore dello stroke della spirale dipende dalla portata: maggiore la portata, maggiore lo spessore dello stroke.

let cols = 10;        // Numero di colonne per continente
let spacingCm = 0.5;  // Spaziatura tra celle (in cm)
let marginCm = 2;     // Margine esterno (in cm)
let bottomMarginCm = 2; // Margine in basso
let titleHeight = 80;  // Altezza del titolo 

let cellWidth, cellHeight, spacingPx, marginPx, bottomMarginPx;
let dataset = [];     // Dataset per "length", "name", "avg_temp", "continent" e "discharge"
let continentGroups = {}; // Gruppo per continente
let minTemp, maxTemp; // Range di temperature medie

let minDischarge, maxDischarge; // Range di portata

let data;

function preload() { // Carica il file CSV 
  data = loadTable("assets/rivers.csv", "csv", "header");
}

function setup() {
  // Conversione dei margini in pixel (96 DPI)
  let cmToPx = (dpi => dpi / 2.54)(96);        
  spacingPx = spacingCm * cmToPx;
  marginPx = marginCm * cmToPx;
  bottomMarginPx = bottomMarginCm * cmToPx;

  // Genera il dataset e raggruppa per continente
  generateDataset();
  groupByContinent();

  // Trova la temperatura minima e massima dentro a avg_temp
  minTemp = min(dataset.map(d => d.avgTemp));
  maxTemp = max(dataset.map(d => d.avgTemp));

  // Trova la portata minima e massima
  minDischarge = min(dataset.map(d => d.discharge));
  maxDischarge = max(dataset.map(d => d.discharge));

  // Calcola dimensioni delle celle considerando il margine
  cellWidth = (width - 2 * marginPx - (cols - 1) * spacingPx) / cols;
  cellHeight = cellWidth; // Celle quadrate
  
  // Calcola l'altezza totale necessaria per il canvas
  let totalHeight = marginPx + titleHeight; //altezza del titolo
  for (let continent in continentGroups) {
    let continentFountains = continentGroups[continent];
    let continentRows = ceil(continentFountains.length / cols);
    totalHeight += continentRows * (cellHeight + spacingPx + 40) + 40; // Aggiunge spazio tra ogni continente
  }

  // Imposta il canvas con l'altezza corretta
  createCanvas(windowWidth, totalHeight);
  noLoop();
}

function draw() {
  background(255, 253, 240); // Colore di sfondo panna

  // scrive il titolo
  drawTitle();

  let currentY = marginPx + titleHeight + 40; // spazio sotto il titolo

  // Ordina i continenti per numero di fiumi, da quello con più fiumi a quello con meno
  let sortedContinents = Object.keys(continentGroups).sort((a, b) => continentGroups[b].length - continentGroups[a].length);

  // Disegna la griglia con le spirali e i nomi, divise per continente
  for (let continent of sortedContinents) {
    let continentFountains = continentGroups[continent];

    // Ordina i fiumi di ciascun continente per lunghezza (decrescente)
    continentFountains.sort((a, b) => b.length - a.length);

    let continentRows = ceil(continentFountains.length / cols);

    // Scrive il nome del continente a sinistra
    fill(0);
    textSize(16);
    textAlign(LEFT); // allineamento a sinistra
    text(continent, marginPx, currentY - 20); // Posiziona il nome del continente a sinistra

    // Disegna le spirali per ogni fiume del continente
    for (let i = 0; i < continentRows; i++) {
      for (let j = 0; j < cols; j++) {
        let index = i * cols + j;
        if (index < continentFountains.length) {
          let river = continentFountains[index];
          let x = marginPx + j * (cellWidth + spacingPx);
          let y = currentY + (i * (cellHeight + spacingPx + 40));

          // Disegna la spirale con colore basato su avgTemp e spessore basato su discharge
          drawSpiral(
            x + cellWidth / 2,        // Centro della cella (x)
            y + cellHeight / 2,       // Centro della cella (y)
            cellWidth / 2 - 10,       // Raggio massimo della spirale
            river.length,             // Lunghezza del fiume
            river.avgTemp,            // Temperatura media
            river.discharge           // Portata
          );

          // Disegna il nome del fiume
          drawName(x, y + cellHeight + 5, cellWidth, river.name);
        }
      }
    }

    // Aggiungi spazio tra le sezioni di continenti
    currentY += continentRows * (cellHeight + spacingPx + 40) + 40;
  }
}

// Funzione per generare il dataset dal file CSV
function generateDataset() {
  dataset = []; // Filtra il dataset in base alle colonne considerate
  for (let i = 0; i < data.getRowCount(); i++) {
    let name = data.getString(i, "name");
    let length = data.getNum(i, "length");
    let avgTemp = data.getNum(i, "avg_temp"); // Legge la temperatura media
    let discharge = data.getNum(i, "discharge"); // Legge la portata
    let continent = data.getString(i, "continent"); // Legge il continente
    dataset.push({ name, length, avgTemp, discharge, continent });
  }
}

// Funzione per raggruppare i fiumi per continente
function groupByContinent() {
  continentGroups = {}; 

  dataset.forEach(river => {
    let continent = river.continent;

    // verifica e crea il gruppo continente
    if (!continentGroups[continent]) {
      continentGroups[continent] = [];
    }

    // Aggiunge il fiume al continente appropriato
    continentGroups[continent].push(river);
  });
}

// Funzione per disegnare una spirale
function drawSpiral(x, y, maxRadius, length, avgTemp, discharge) {
  push();
  translate(x, y); // Sposta al centro della cella
  
  // Mappa la temperatura media per determinare il colore
  let blueValue = map(avgTemp, minTemp, maxTemp, 255, 150); // Imposta una variazione di blu in base alla temperatura
  let baseColor = color(0, 127, blueValue); // Usa l'azzurro RGB con il valore B (blu) variabile 
  
  stroke(baseColor); // Imposta il colore della spirale in base a avgTemp
  
  // Mappa la portata per determinare lo spessore della spirale tra 1 e 3.5
  let strokeWidth = map(discharge, minDischarge, maxDischarge, 1, 3.5);
  strokeWeight(strokeWidth); // Imposta lo spessore della spirale
  
  noFill();
  
  // Parametri della spirale
  let maxLength = 1000; // Lunghezza massima della spirale
  let numIterations = map(length, 0, 10000, 100, maxLength); // Scala la lunghezza in un intervallo
  
  beginShape();
  for (let t = 0; t < numIterations; t++) {
    let angle = t * 0.1; // Angolo incrementale
    let radius = map(t, 0, numIterations, 0, maxRadius); // Raggio crescente
    let xPos = radius * cos(angle); // Posizione x della spirale
    let yPos = radius * sin(angle); // Posizione y della spirale
    vertex(xPos, yPos); // Aggiunge punto alla spirale
  }
  endShape();
  
  pop();
}

// Funzione per disegnare il nome dentro la cella
function drawName(x, y, maxWidth, name) {
    fill(0); // Colore del testo (nero)
    noStroke();
    textSize(10); // dimensione del testo
    textAlign(CENTER, TOP);
    textFont('Arial'); // Impostiamo un font standard se necessario
    textWrap(CHAR); // Abilita il ritorno a capo
    text(name, x, y, maxWidth); // Limita il testo alla larghezza massima
  }


// Funzione per disegnare il titolo
function drawTitle() {
  fill(0); // Colore del titolo (nero)
  textAlign(CENTER, CENTER);
  textSize(32); // Dimensione titolo
  text("Rivers in the World", width / 2, marginPx + titleHeight / 2); // Posizione centrale
}

// Adatta la griglia al ridimensionamento della finestra
function windowResized() {
  let cmToPx = (dpi => dpi / 2.54)(96);
  spacingPx = spacingCm * cmToPx;
  marginPx = marginCm * cmToPx;
  bottomMarginPx = bottomMarginCm * cmToPx;

  // Calcola dimensioni delle celle considerando il margine
  cellWidth = (width - 2 * marginPx - (cols - 1) * spacingPx) / cols;
  cellHeight = cellWidth; // Celle quadrate

  // Ricalcola l'altezza totale
  let totalHeight = marginPx + titleHeight; 
  for (let continent in continentGroups) {
    let continentFountains = continentGroups[continent];
    let continentRows = ceil(continentFountains.length / cols);
    totalHeight += continentRows * (cellHeight + spacingPx + 40) + 40; 
  }

  resizeCanvas(windowWidth, totalHeight);
  redraw();
}
