// Google 試算表發布的 CSV 連結（請換成你自己的 CSV 連結）
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvP7fRonwFfLup2OULUQ13jhhFrX7tIvBeGPti6bs9M-tkeUpmaqjoG_26y6OKsJ6BZK_doXdnfffF/pub?gid=0&single=true&output=csv";
let quizData = [];      // 題庫資料陣列
let items = [];         // 圖片放置區目標
let draggableCards = [];// 可拖曳文字卡片
let submitBtn;          // 提交按鈕
let resetBtn;           // 重新開始按鈕
let isSubmitted = false;// 測驗提交狀態
let score = 0;          // 總分
let isLoading = true;   // 載入狀態

function preload() {
  // 從 Google 試算表載入 CSV 檔案，設定 header: true 方便讀取欄位名稱
  loadTable(csvUrl, 'csv', 'header', (table) => {
    for (let r = 0; r < table.getRowCount(); r++) {
      let rowName = table.getString(r, 'name');
      let rowLabel = table.getString(r, 'label');
      let rowUrl = table.getString(r, 'gifUrl');
      
      // 載入 GIF 圖片
      let img = loadImage(rowUrl);

      quizData.push({
        name: rowName,
        label: rowLabel,
        gifUrl: rowUrl,
        img: img
      });
    }
    isLoading = false;
    initGame(); // 資料載入完成後初始化遊戲
  });
}

function setup() {
  let canvas = createCanvas(800, 630);
  canvas.parent('canvas-container');

  // 建立按鈕
  submitBtn = createButton('交卷並結算成績');
  submitBtn.size(130, 40);
  styleButton(submitBtn, '#4CAF50');
  submitBtn.mousePressed(checkAnswers);

  resetBtn = createButton('重新開始');
  resetBtn.size(130, 40);
  styleButton(resetBtn, '#2196F3');
  resetBtn.mousePressed(initGame);
  
  positionButtons();
}

function positionButtons() {
  let canvasContainer = document.getElementById('canvas-container');
  let rect = canvasContainer.getBoundingClientRect();
  
  submitBtn.position(rect.left + 115, rect.top + 555);
  resetBtn.position(rect.left + 260, rect.top + 555);
}

function windowResized() {
  positionButtons();
}

function initGame() {
  if (quizData.length === 0) return;

  isSubmitted = false;
  score = 0;
  items = [];
  draggableCards = [];

  const startY = 100;
  const spacingY = 130;
  const imgWidth = 100;
  const imgHeight = 100;

  // 建立左側圖片目標區域
  for (let i = 0; i < quizData.length; i++) {
    items.push({
      id: quizData[i].name,
      img: quizData[i].img,
      x: 80,
      y: startY + i * spacingY,
      w: imgWidth,
      h: imgHeight,
      droppedCard: null
    });
  }

  const rightBoxCenterX = 635;

  // 隨機打亂右側文字卡片並與左側放置框嚴格左右對齊
  let shuffledLabels = shuffle([...quizData]);
  for (let i = 0; i < shuffledLabels.length; i++) {
    let dropZoneCenterY = startY + i * spacingY + 50;

    draggableCards.push(new DraggableCard(
      rightBoxCenterX,      
      dropZoneCenterY,      
      140, 
      50, 
      shuffledLabels[i].label, 
      shuffledLabels[i].name
    ));
  }
}

function draw() {
  background(248, 249, 250);

  // 畫標題列
  fill(44, 62, 80);
  noStroke();
  rect(0, 0, width, 60);
  fill(255);
  textSize(22);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  text("動態圖文配對測驗", width / 2, 30);

  // 若資料還在載入中，顯示提示文字
  if (isLoading) {
    textSize(18);
    fill(100);
    text("正在從 Google 試算表載入題庫...", width / 2, height / 2);
    return;
  }

  // 畫分隔區域背景
  fill(235, 240, 245);
  rect(30, 80, 450, 460, 10); 
  rect(500, 80, 270, 460, 10); 

  fill(100);
  textSize(14);
  textStyle(NORMAL);
  text("將文字拖曳至左側對應圖片上", 255, 95);
  text("選項目標", 635, 95);

  // 繪製圖片放置目標框
  for (let item of items) {
    image(item.img, item.x, item.y, item.w, item.h);

    stroke(180);
    strokeWeight(2);
    fill(255, 255, 255, 150);
    rect(item.x + item.w + 30, item.y + 25, 160, 50, 8);

    fill(120);
    noStroke();
    textSize(12);
    textAlign(CENTER, CENTER);
    if (!item.droppedCard) {
      text("拖曳至此放置", item.x + item.w + 110, item.y + 50);
    }
  }

  // 繪製所有文字卡片
  for (let card of draggableCards) {
    card.update();
    card.display();
  }

  // 若已提交，顯示結果與成績
  if (isSubmitted) {
    drawResults();
  }
}

function mousePressed() {
  if (isLoading || isSubmitted) return;
  
  for (let i = draggableCards.length - 1; i >= 0; i--) {
    if (draggableCards[i].isMouseOver()) {
      draggableCards[i].startDragging();
      break;
    }
  }
}

function mouseReleased() {
  if (isLoading || isSubmitted) return;

  for (let card of draggableCards) {
    if (card.isDragging) {
      card.stopDragging();

      for (let item of items) {
        if (item.droppedCard === card) {
          item.droppedCard = null;
        }
      }

      for (let item of items) {
        let dropZoneX = item.x + item.w + 30;
        let dropZoneY = item.y + 25;
        let dropZoneW = 160;
        let dropZoneH = 50;

        if (
          card.x + card.w / 2 > dropZoneX &&
          card.x - card.w / 2 < dropZoneX + dropZoneW &&
          card.y + card.h / 2 > dropZoneY &&
          card.y - card.h / 2 < dropZoneY + dropZoneH
        ) {
          if (item.droppedCard) {
            item.droppedCard.resetPosition();
          }

          card.x = dropZoneX + dropZoneW / 2;
          card.y = dropZoneY + dropZoneH / 2;
          item.droppedCard = card;
          break;
        }
      }
    }
  }
}

function checkAnswers() {
  if (isLoading) return;
  score = 0;
  for (let item of items) {
    if (item.droppedCard && item.droppedCard.targetId === item.id) {
      score += Math.round(100 / quizData.length);
    }
  }
  isSubmitted = true;
}

function drawResults() {
  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  fill(255);
  stroke(200);
  strokeWeight(2);
  rect(width / 2 - 180, height / 2 - 110, 360, 200, 15);

  noStroke();
  fill(44, 62, 80);
  textSize(24);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("測驗結果", width / 2, height / 2 - 70);

  textSize(40);
  fill(score >= 60 ? '#4CAF50' : '#E91E63');
  text(`${score} 分`, width / 2, height / 2 - 10);

  textSize(16);
  fill(100);
  textStyle(NORMAL);
  text(`答對 ${Math.round((score / 100) * quizData.length)} / ${quizData.length} 題`, width / 2, height / 2 + 45);
}

function styleButton(btn, bgColor) {
  btn.style('background-color', bgColor);
  btn.style('color', 'white');
  btn.style('border', 'none');
  btn.style('border-radius', '6px');
  btn.style('font-size', '14px');
  btn.style('font-weight', 'bold');
  btn.style('cursor', 'pointer');
}

class DraggableCard {
  constructor(x, y, w, h, textLabel, targetId) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = textLabel;
    this.targetId = targetId;

    this.isDragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  update() {
    if (this.isDragging) {
      this.x = mouseX + this.offsetX;
      this.y = mouseY + this.offsetY;
    }
  }

  display() {
    rectMode(CENTER);
    
    if (this.isDragging) {
      fill(0, 0, 0, 30);
      noStroke();
      rect(this.x + 4, this.y + 4, this.w, this.h, 8);
    }

    fill(this.isDragging ? '#E3F2FD' : '#FFFFFF');
    stroke(this.isDragging ? '#2196F3' : '#B0BEC5');
    strokeWeight(2);
    rect(this.x, this.y, this.w, this.h, 8);

    fill(33);
    noStroke();
    textSize(16);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text(this.label, this.x, this.y);

    rectMode(CORNER);
  }

  isMouseOver() {
    return (
      mouseX > this.x - this.w / 2 &&
      mouseX < this.x + this.w / 2 &&
      mouseY > this.y - this.h / 2 &&
      mouseY < this.y + this.h / 2
    );
  }

  startDragging() {
    this.isDragging = true;
    this.offsetX = this.x - mouseX;
    this.offsetY = this.y - mouseY;
  }

  stopDragging() {
    this.isDragging = false;
  }

  resetPosition() {
    this.x = this.startX;
    this.y = this.startY;
  }
}