const API_BASE  = window.location.origin + "/api";
const GAME_TIME = 90;

let scorePlayer = 0, scoreAI = 0, roundNum = 0;
let timeLeft = GAME_TIME, timerHandle = null;
let playerAnswer = null, isProcessing = false, gameActive = false;
let generatedData = null, aiResult = null;

// ── Screens ───────────────────────────────────────────────────────────────────
const screens = {
  menu:     document.getElementById("screen-menu"),
  loading:  document.getElementById("screen-loading"),
  playing:  document.getElementById("screen-playing"),
  gameover: document.getElementById("screen-gameover"),
};
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ── Menu ──────────────────────────────────────────────────────────────────────
document.getElementById("btn-start").addEventListener("click", startGame);

function startGame() {
  scorePlayer = 0; scoreAI = 0; roundNum = 0;
  timeLeft = GAME_TIME; gameActive = true;
  document.getElementById("menu-score").classList.add("hidden");
  startRound();
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
  clearInterval(timerHandle);
  updateTimerUI();
  timerHandle = setInterval(() => {
    timeLeft--;
    updateTimerUI();
    if (timeLeft <= 0) endGame();
  }, 1000);
}
function stopTimer() { clearInterval(timerHandle); timerHandle = null; }

function updateTimerUI() {
  const m  = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s  = String(timeLeft % 60).padStart(2, "0");
  const el = document.getElementById("timer-display");
  el.textContent = m + ":" + s;
  el.className   = "timer" +
    (timeLeft <= 15 ? " timer--danger" : timeLeft <= 30 ? " timer--warn" : "");
}

function endGame() {
  stopTimer();
  gameActive = false;
  document.getElementById("go-score").textContent    = "Bạn: " + scorePlayer + " điểm";
  document.getElementById("go-ai-score").textContent = "AI (YOLO): " + scoreAI + " điểm";
  const diff = scorePlayer - scoreAI;
  document.getElementById("go-verdict").textContent =
    diff > 0 ? "🏆 Bạn thắng!" : diff < 0 ? "🤖 AI thắng!" : "🤝 Hòa!";
  document.getElementById("go-rounds").textContent = "Đã chơi " + roundNum + " vòng";
  showScreen("gameover");
}

document.getElementById("btn-play-again").addEventListener("click", startGame);

// ── Input ─────────────────────────────────────────────────────────────────────
const btnConfirm  = document.getElementById("btn-confirm");
const playerInput = document.getElementById("player-input");

btnConfirm.addEventListener("click", confirmAnswer);
playerInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") confirmAnswer();
});

function confirmAnswer() {
  if (isProcessing || !gameActive) return;
  var val = playerInput.value.trim();
  if (!val || isNaN(val)) {
    playerInput.classList.add("input-error");
    setTimeout(function() { playerInput.classList.remove("input-error"); }, 500);
    return;
  }
  isProcessing = true;
  btnConfirm.disabled = true;
  btnConfirm.textContent = "ĐANG XỬ LÝ...";
  playerAnswer = parseInt(val, 10);
  analyzeGenerated();
}

function resetBtn() {
  isProcessing = false;
  btnConfirm.disabled = false;
  btnConfirm.textContent = "XÁC NHẬN";
}

// ── Round ─────────────────────────────────────────────────────────────────────
function startRound() {
  showScreen("loading");
  playerInput.value = "";
  aiResult = null; playerAnswer = null; generatedData = null;
  loadGeneratedImage();
}

function loadGeneratedImage() {
  setLoading("✨ Đang sinh ảnh mới...", "");
  fetch(API_BASE + "/generate")
    .then(function(r) {
      if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || "Generate failed"); });
      return r.json();
    })
    .then(function(data) {
      generatedData = data;
      var imgEl = document.getElementById("game-image");
      imgEl.onload = function() {
        document.getElementById("round-info").textContent = roundInfoText();
        if (roundNum === 0) startTimer();
        showScreen("playing");
        playerInput.value = "";
        playerInput.focus();
      };
      imgEl.onerror = function() { showError("Không tải được ảnh!"); };
      imgEl.src = data.image_b64;
    })
    .catch(function(e) {
      if (e.message.indexOf("cache") >= 0 || e.message.indexOf("Sprite") >= 0) {
        buildCacheAndRetry();
      } else {
        showError("Lỗi sinh ảnh: " + e.message);
      }
    });
}

function analyzeGenerated() {
  fetch(API_BASE + "/generate/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(generatedData),
  })
    .then(function(r) { return r.json(); })
    .then(function(result) {
      aiResult = result;
      showRoundResult(result);
    })
    .catch(function() { showError("Lỗi phân tích ảnh!"); })
    .finally(function() { resetBtn(); });
}

// ── Kết quả vòng (overlay 2.5s) ───────────────────────────────────────────────
function showRoundResult(result) {
  if (!gameActive) return;

  var correct    = result.correct;
  var aiGuess    = result.total;
  var playerDiff = Math.abs(playerAnswer - correct);
  var aiDiff     = Math.abs(aiGuess - correct);

  var playerMsg = "";
  if (playerDiff === 0)     { scorePlayer += 10; playerMsg = "+10 🎉"; }
  else if (playerDiff <= 1) { scorePlayer += 5;  playerMsg = "+5 👍"; }
  else                      { playerMsg = "+0 😅"; }

  var aiMsg = "";
  if (aiDiff === 0)         { scoreAI += 10; aiMsg = "+10 🎉"; }
  else if (aiDiff <= 1)     { scoreAI += 5;  aiMsg = "+5 👍"; }
  else                      { aiMsg = "+0 😅"; }

  roundNum++;

  document.getElementById("ov-correct").textContent   = "✅ Đáp án: " + correct + " con";
  document.getElementById("ov-ai-detail").textContent = "YOLO: " + result.dog + " chó + " + result.cat + " mèo";
  document.getElementById("ov-player").textContent    = "Bạn: " + playerAnswer + "  " + playerMsg;
  document.getElementById("ov-ai").textContent        = "AI: " + aiGuess + "  " + aiMsg;
  document.getElementById("ov-score").textContent     = "Tổng: Bạn " + scorePlayer + " - AI " + scoreAI;

  document.getElementById("ov-card-player").className =
    "ov-card " + (playerDiff === 0 ? "correct" : playerDiff <= 1 ? "close" : "wrong");
  document.getElementById("ov-card-ai").className =
    "ov-card " + (aiDiff === 0 ? "correct" : aiDiff <= 1 ? "close" : "wrong");

  document.getElementById("round-overlay").classList.remove("hidden");

  setTimeout(function() {
    document.getElementById("round-overlay").classList.add("hidden");
    if (gameActive) startRound();
  }, 2500);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildCacheAndRetry() {
  setLoading("Đang build sprite cache...", "Chỉ cần 1 lần, vui lòng chờ ~30 giây...");
  fetch(API_BASE + "/build-cache")
    .then(function(r) { return r.json(); })
    .then(function(d) {
      setLoading("Đã build " + d.built + " sprite!", "Đang sinh ảnh...");
      setTimeout(loadGeneratedImage, 800);
    })
    .catch(function(e) { showError("Không thể build cache: " + e.message); });
}

function setLoading(main, sub) {
  document.getElementById("loading-text").textContent = main;
  document.getElementById("loading-sub").textContent  = sub;
}
function roundInfoText() {
  return "Vòng " + (roundNum + 1) + "  ·  Điểm: Bạn " + scorePlayer + " - AI " + scoreAI;
}
function showError(msg) {
  showScreen("loading");
  setLoading(msg, "");
  setTimeout(function() { showScreen("menu"); }, 2500);
}
