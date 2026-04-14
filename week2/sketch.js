let bubbles = [];
let numBubbles = 40; // 畫面中的氣泡總數
let particles = [];  // 新增：用於儲存氣泡破裂特效的粒子

let seaweeds = [];
let numSeaweeds = 30; // 減少水草林的數量，讓畫面不要太擁擠
const palette = ['#9b5de5', '#f15bb5', '#fee440', '#00bbf9', '#00f5d4']; // 指定顏色調色盤

function setup() {
  // 採用全螢幕畫布，並儲存為變數以設定樣式
  let cvs = createCanvas(windowWidth, windowHeight);
  cvs.style('position', 'absolute');
  cvs.style('top', '0');
  cvs.style('left', '0');
  cvs.style('pointer-events', 'none'); // 允許滑鼠事件穿透畫布，以操作後方的 iframe
  cvs.style('z-index', '1');

  // 建立滿版 iframe 作為背景網頁
  let iframe = document.createElement('iframe');
  iframe.src = 'https://www.et.tku.edu.tw';
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.zIndex = '-1'; // 確保網頁置於動畫後方
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  
  // 取消外層網頁預設邊距與卷軸 (iframe 內部仍可正常捲動)
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  
  // 初始化水草陣列
  for (let i = 0; i < numSeaweeds; i++) {
    seaweeds.push({
      xRatio: map(i, 0, numSeaweeds, 0.05, 0.95) + random(-0.02, 0.02), // 讓水草平均分散，並加上些微隨機偏移
      noiseOffset: random(0, 1000),  // 獨立的時間差，讓每株水草搖晃不同步
      heightRatio: 0.4,              // 水草長度改為佔視窗高度的 40%
      color: random(palette),        // 亂數抽出指定顏色
      thickness: random(40, 50),     // 亂數產生 40~50 之間的粗細
      swaySpeed: random(0.0005, 0.003) // 再次降低搖晃速度，讓水草移動更慢更柔和
    });
  }

  // 初始化氣泡陣列
  for (let i = 0; i < numBubbles; i++) {
    bubbles.push({
      x: random(width),         // 隨機水平位置
      y: random(height, height + 200), // 初始時從視窗底部以下開始往上升
      size: random(12, 25),     // 氣泡隨機大小 (稍微加大讓反光更明顯)
      speed: random(1, 3.5),    // 氣泡往上升的速度
      noiseOffsetX: random(0, 1000), // 用於左右自然飄移的 offset
      burstY: random(height * 0.1, height * 0.7) // 亂數決定氣泡上升到哪個高度時會破裂
    });
  }
}

function draw() {
  // 清除前一影格，避免半透明背景疊加造成殘影
  clear();

  // 設定背景顏色為 e3f2fd，並套用 0.3 透明度
  let bgColor = color('#e3f2fd');
  bgColor.setAlpha(255 * 0.3);
  background(bgColor);
  
  blendMode(BLEND);    // 利用 blendMode(BLEND) 確保透明色彩重疊產生特效
  noFill();            // 取消填滿，只保留線條
  
  // 繪製多條水草形成水草林
  for (let s = 0; s < seaweeds.length; s++) {
    let weed = seaweeds[s];
    
    // 取得指定顏色並加入透明度
    let weedColor = color(weed.color);
    weedColor.setAlpha(180); // 設定透明度 (範圍 0~255，大約 70% 不透明)
    stroke(weedColor);
    strokeWeight(weed.thickness); // 套用該株水草專屬粗細

    beginShape();
    let segments = 15; // 將水草分為多個分段以產生弧度
    
    for (let i = 0; i <= segments; i++) {
      // 依據各自的 heightRatio 決定水草長度 (1 - heightRatio 代表最高點的 Y 座標)
      let y = map(i, 0, segments, height, height * (1 - weed.heightRatio));
      
      // 越往上的區段，水草搖晃的幅度越大
      let swayAmplitude = map(i, 0, segments, 0, 80); // 再次減小搖晃幅度，讓動作更柔和
      // 加入個別的 x 軸座標、noiseOffset 與專屬搖晃速度 (swaySpeed) 讓動態不一致
      let x = (width * weed.xRatio) + map(noise(i * 0.2, frameCount * weed.swaySpeed + weed.noiseOffset), 0, 1, -swayAmplitude, swayAmplitude);
      
      // 使用 curveVertex 呈現圓弧線條
      curveVertex(x, y);
      
      // curveVertex 需要重複第一個與最後一個點作為控制點，才能畫出完整的弧線
      if (i === 0 || i === segments) {
        curveVertex(x, y);
      }
    }
    endShape();
  }
  
  noStroke();               // 氣泡不顯示外框線
  
  // 繪製氣泡破裂時產生的向外擴散粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx; // 往四周飛散
    p.y += p.vy;
    p.life -= 15; // 逐漸淡出消失
    fill(255, 255, 255, p.life);
    circle(p.x, p.y, p.size);
    
    if (p.life <= 0) {
      particles.splice(i, 1); // 粒子透明度歸零後從陣列中移除
    }
  }

  // 繪製由下往上飄動的氣泡
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    
    // 讓氣泡往上升
    b.y -= b.speed;
    
    // 利用 noise 產生平滑的左右飄動效果
    b.x += map(noise(b.noiseOffsetX), 0, 1, -1.5, 1.5);
    b.noiseOffsetX += 0.01;
    
    // 繪製氣泡主體：白色，透明度約 0.5 (127/255)
    fill(255, 255, 255, 127);
    circle(b.x, b.y, b.size);
    
    // 繪製氣泡左上角反光：白色，透明度約 0.8 (204/255)
    fill(255, 255, 255, 204);
    circle(b.x - b.size * 0.25, b.y - b.size * 0.25, b.size * 0.3);
    
    // 如果氣泡到達指定的破裂高度
    if (b.y < b.burstY) {
      // 產生破裂粒子
      for (let j = 0; j < 5; j++) {
        particles.push({
          x: b.x, y: b.y,
          vx: random(-2, 2), vy: random(-2, 2), // 隨機四散的方向
          life: 255, // 初始透明度為不透明
          size: random(2, 6) // 碎片大小
        });
      }
      
      // 從視窗底部重新產生新氣泡
      b.y = height + random(20, 100);
      b.x = random(width);
      b.burstY = random(height * 0.1, height * 0.7);
      b.size = random(12, 25);
    }
  }
}

// 當視窗大小改變時，自動調整畫布大小以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 當滑鼠點擊時觸發的事件
function mousePressed() {
  // 檢查是否點擊到氣泡
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    let d = dist(mouseX, mouseY, b.x, b.y);
    
    // b.size 是直徑，所以半徑是 b.size / 2。加上 10 的緩衝範圍讓飄動的小氣泡更好點擊
    if (d <= (b.size / 2) + 10) {
      // 點擊到氣泡時，同樣產生破裂粒子
      for (let j = 0; j < 6; j++) {
        particles.push({
          x: b.x, y: b.y,
          vx: random(-3, 3), vy: random(-3, 3), 
          life: 255, size: random(3, 8)
        });
      }
      
      // 將氣泡重置到畫面底部，並重新給予隨機大小與速度，如同產生了新的氣泡
      b.y = height + 20;
      b.x = random(width);
      b.size = random(12, 25);
      b.speed = random(1, 3.5);
      b.noiseOffsetX = random(0, 1000);
      b.burstY = random(height * 0.1, height * 0.7);
    }
  }
}
