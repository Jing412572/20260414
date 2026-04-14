let nodes = [];
let displayIframe;
let osc, env; // 用於合成水滴音效

// 模擬學生的作業資料（可自行替換 url 為實際的 html 檔案）
let weeksData = [
  { title: "Week 1: 基礎繪圖", url: "week1/index.html" },
  { title: "Week 2: 變數與動畫", url: "week2/index.html" },
  { title: "Week 3: 條件判斷", url: "week3/index.html" },
  { title: "Week 4: 陣列與迴圈", url: "week4/index.html" },
  { title: "Week 5: 函式與物件", url: "week5/index.html" },
  { title: "Midterm: 程式種子", url: "midterm/index.html" }
];

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container'); // 將 p5 畫布綁定到 HTML 中的 div 容器
  
  // 1. Iframe 整合：建立右側的大型顯示區域
  displayIframe = createElement('iframe');
  displayIframe.position(width / 2, 50);
  displayIframe.size(width / 2 - 50, height - 100);
  displayIframe.style('border', '4px solid #fff');
  displayIframe.style('border-radius', '15px');
  displayIframe.style('box-shadow', '0px 10px 20px rgba(0,0,0,0.5)');
  displayIframe.style('background', '#f4f4f4');
  displayIframe.hide(); // 初始先隱藏，點擊後再顯示

  // 2. 初始化 Class 節點
  let startY = height - 100;
  let endY = 100;
  for (let i = 0; i < weeksData.length; i++) {
    // 讓 y 座標從底部向上生長
    let y = map(i, 0, weeksData.length - 1, startY, endY);
    // 讓 x 座標產生波浪狀的藤蔓偏移
    let x = width / 4 + sin(i * 1.2) * 60;
    nodes.push(new SeedNode(x, y, weeksData[i].title, weeksData[i].url, i));
  }
  
  // 3. 設定音效 (包絡線與振盪器) 產生水滴聲
  env = new p5.Envelope();
  env.setADSR(0.01, 0.1, 0, 0); // 短促的聲音
  env.setRange(0.8, 0);
  osc = new p5.Oscillator('sine');
  osc.amp(env);
  osc.start();
}

function draw() {
  background(15, 25, 35); // 深邃的地底/夜晚背景
  
  drawGallerySpace();
  
  // 4. 視角切換：計算滑鼠引起的視差偏移量
  let moveX = map(mouseX, 0, width, 30, -30);
  let moveY = map(mouseY, 0, height, 30, -30);
  
  push();
  translate(moveX, moveY); // 應用視差效果
  
  drawDigitalPlant();
  drawVine();
  
  // 繪製所有的週次種子並偵測滑鼠懸停
  for (let node of nodes) {
    node.checkHover(mouseX - moveX, mouseY - moveY);
    node.display();
  }
  pop();
}

// 5. Vertex & For：繪製藤蔓 (時間軸)
function drawVine() {
  noFill();
  stroke(80, 200, 120, 200);
  strokeWeight(6);
  beginShape();
  curveVertex(width / 4, height); // 根部延伸
  curveVertex(width / 4, height);
  for (let i = 0; i < nodes.length; i++) {
    curveVertex(nodes[i].x, nodes[i].y);
  }
  // 頂部末端
  curveVertex(nodes[nodes.length - 1].x + 30, nodes[nodes.length - 1].y - 50);
  curveVertex(nodes[nodes.length - 1].x + 30, nodes[nodes.length - 1].y - 50);
  endShape();
}

// 裝飾：數位海草 / 盆栽
function drawDigitalPlant() {
  noFill();
  strokeWeight(12);
  for (let i = 0; i < 4; i++) {
    stroke(50, 150 + i * 20, 100, 80);
    beginShape();
    for (let y = height; y > height * 0.4; y -= 30) {
      let x = width / 5 + (i * 40) - 60 + noise(y * 0.01, frameCount * 0.01 + i) * 150;
      curveVertex(x, y);
    }
    endShape();
  }
}

// 空間感背景：營造畫廊透視效果
function drawGallerySpace() {
  stroke(255, 30);
  strokeWeight(2);
  // 天花板與地板的透視線
  line(0, height, width / 2, height * 0.8);
  line(width, height, width / 2, height * 0.8);
  line(0, 0, width / 2, height * 0.2);
  line(width, 0, width / 2, height * 0.2);
}

// 滑鼠點擊事件：播放音效並載入 iframe
function mousePressed() {
  let moveX = map(mouseX, 0, width, 30, -30);
  let moveY = map(mouseY, 0, height, 30, -30);
  
  for (let node of nodes) {
    let d = dist(mouseX - moveX, mouseY - moveY, node.x, node.y);
    if (d < node.r) {
      // 播放水滴聲
      osc.freq(random(600, 1200));
      env.play();
      
      // 更新並顯示 Iframe
      displayIframe.attribute('src', node.url);
      displayIframe.show();
      
      // 給學生的進階挑戰：點擊放大 (這裡示範加上光暈選取狀態)
      for(let n of nodes) n.selected = false;
      node.selected = true;
    }
  }
}

// 視窗縮放事件：保持 Iframe 與 Canvas 比例正確
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  displayIframe.position(width / 2, 50);
  displayIframe.size(width / 2 - 50, height - 100);
  
  // 重新計算節點位置可以寫在這裡（進階挑戰）
}

/* ================================================================= */
/* 週次種子 Class 物件                                                */
/* ================================================================= */
class SeedNode {
  constructor(x, y, title, url, index) {
    this.x = x;
    this.y = y;
    this.title = title;
    this.url = url;
    this.index = index;
    this.r = 25; // 基礎半徑
    this.hovered = false;
    this.selected = false;
    this.bloom = 0; // 開花/動態縮放因子 (0~1)
  }
  
  checkHover(mx, my) {
    let d = dist(mx, my, this.x, this.y);
    this.hovered = (d < this.r);
    // 平滑地過渡開花狀態 (lerp 達成動態緩動)
    if (this.hovered || this.selected) {
      this.bloom = lerp(this.bloom, 1, 0.15);
    } else {
      this.bloom = lerp(this.bloom, 0, 0.1);
    }
  }
  
  display() {
    push();
    translate(this.x, this.y);
    
    // 如果被選取，畫出一個打光的光暈效果
    if (this.selected) {
      noStroke();
      fill(255, 255, 150, 50 + sin(frameCount * 0.1) * 30);
      circle(0, 0, this.r * 4);
    }
    
    // 節點本體 (動態變大)
    let currentR = this.r + this.bloom * 15;
    fill(30, 40, 50);
    stroke(150, 255, 150);
    strokeWeight(3);
    circle(0, 0, currentR);
    
    // 懸停時的花瓣動態效果 (利用 vertex/迴圈 畫出開花)
    if (this.bloom > 0.05) {
      noStroke();
      fill(255, 150, 100, this.bloom * 200);
      let petals = 6;
      for (let i = 0; i < petals; i++) {
        let angle = TWO_PI / petals * i + frameCount * 0.02;
        let px = cos(angle) * (currentR * 0.8);
        let py = sin(angle) * (currentR * 0.8);
        circle(px, py, 12 * this.bloom);
      }
    }
    
    // 繪製中心小點
    fill(255);
    noStroke();
    circle(0, 0, 8);
    
    // 顯示標題文字 (帶有一點透明度淡入效果)
    textAlign(RIGHT, CENTER);
    textSize(16);
    textStyle(BOLD);
    fill(255, 255, 255, 150 + this.bloom * 105);
    // 根據奇偶數決定文字放左邊或右邊，避免擋到藤蔓
    if (this.index % 2 === 0) {
      textAlign(RIGHT, CENTER);
      text(this.title, -currentR - 15, 0);
    } else {
      textAlign(LEFT, CENTER);
      text(this.title, currentR + 15, 0);
    }
    pop();
  }
}
