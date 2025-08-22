let records = JSON.parse(localStorage.getItem("weights")) || [];
let chart;
let visibleCount = 5; // 最初に表示する件数
let goal = parseFloat(localStorage.getItem("goal")) || 60; // 初期目標体重
const messageDiv = document.getElementById("message");

// --- 今日の日付（日本時間）を取得 ---
function getTodayJST() {
  const now = new Date();
  const jstOffset = 9 * 60;
  const localOffset = now.getTimezoneOffset();
  const jstTime = new Date(now.getTime() + (jstOffset + localOffset) * 60 * 1000);
  return jstTime.toISOString().split("T")[0];
}

// --- 初期表示 ---
const dateInput = document.getElementById("dateInput");
dateInput.value = getTodayJST();

// --- 目標体重設定 ---
const goalInput = document.getElementById("goalInput");
goalInput.value = goal;

goalInput.addEventListener("change", () => {
  const val = parseFloat(goalInput.value);
  if (!isNaN(val)) {
    goal = val;
    localStorage.setItem("goal", goal);
    updateChart();
    updateStats();
  }
});

// --- メッセージ表示 ---
function showMessage(msg, type="info") {
  messageDiv.textContent = msg;
  messageDiv.className = "";
  messageDiv.classList.add(`message-${type}`);
  void messageDiv.offsetWidth;
  messageDiv.classList.add("show");
  setTimeout(() => messageDiv.classList.remove("show"), 4000);
}

// --- 記録フォームの送信 ---
document.getElementById("recordForm").addEventListener("submit", e => {
  e.preventDefault();
  const date = dateInput.value;
  const weight = parseFloat(document.getElementById("weightInput").value);
  const meal = document.getElementById("mealInput").value;
  if (!weight) return;

  const existingIndex = records.findIndex(r => r.date === date);
  if (existingIndex !== -1) {
    records[existingIndex] = { date, weight, meal };
  } else {
    records.push({ date, weight, meal });
  }
  records.sort((a, b) => new Date(a.date) - new Date(b.date));
  localStorage.setItem("weights", JSON.stringify(records));

  showMessage(`${weight}kg を記録しました！`);
  renderRecords();
  updateChart();
  updateStats();
  e.target.reset();
  dateInput.value = getTodayJST();
});

// --- 記録リスト描画 ---
function renderRecords() {
  const list = document.getElementById("recordList");
  list.innerHTML = "";
  const sorted = [...records].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const toShow = sorted.slice(0, visibleCount);

  toShow.forEach((r,index)=>{
    const li = document.createElement("li");
    let arrow="", cls="noChange";
    if(index<sorted.length-1){
      const next = sorted[index+1].weight;
      if(r.weight>next){ arrow="⬆"; cls="increase"; }
      else if(r.weight<next){ arrow="⬇"; cls="decrease"; }
      else { arrow="→"; }
    }
    li.className = cls;
    li.innerHTML = `<div><strong>${r.weight}kg ${arrow}</strong><br>
                    <small>${r.date}</small><br>食事: ${r.meal || ""}</div>`;
    const delBtn = document.createElement("button");
    delBtn.textContent="削除";
    delBtn.onclick = ()=>{
      records = records.filter(x=>!(x.date===r.date && x.weight===r.weight));
      localStorage.setItem("weights", JSON.stringify(records));
      renderRecords();
      updateChart();
      updateStats();
    };
    li.appendChild(delBtn);
    list.appendChild(li);
  });

  document.getElementById("loadMoreBtn").style.display =
    visibleCount < sorted.length ? "block" : "none";
}

// --- もっと見る ---
document.getElementById("loadMoreBtn").addEventListener("click", ()=>{
  visibleCount +=5;
  renderRecords();
});

// --- グラフ描画 ---
function updateChart() {
  const ctx = document.getElementById("weightChart").getContext("2d");
  if(chart) chart.destroy();
  const labels = records.map(r=>r.date);
  const dataWeight = records.map(r=>r.weight);
  const dataGoal = records.map(_=>goal); // 目標体重ライン

  chart = new Chart(ctx,{
    type:"line",
    data:{
      labels,
      datasets:[
        {label:"体重(kg)", data:dataWeight, borderColor:"#1a73e8", fill:false},
        {label:"目標体重", data:dataGoal, borderColor:"#28a745", borderDash:[5,5], fill:false}
      ]
    },
    options:{responsive:true}
  });
}

// --- 統計更新 ---
function updateStats() {
  if(records.length===0) return;
  const start = records[0].weight;
  const latest = records[records.length-1].weight;
  const diff = (start-latest).toFixed(1);
  document.getElementById("totalLoss").textContent = `${diff}kg`;

  const achievement = ((start-latest)/(start-goal)*100).toFixed(1);
  document.getElementById("achievement").textContent = `${Math.min(Math.max(achievement,0),100)}%`;

  if(latest<=goal){
    showMessage("🏆 目標達成！おめでとう！","celebration");
  } else if(start-latest>=10){
    showMessage("🎉 最初から10kg減！すごすぎる！","celebration");
  } else if(start-latest>=5){
    showMessage("🎉 最初から5kg減！かなり頑張ったね！","celebration");
  } else if(start-latest>=3){
    showMessage("🎉 最初から3kg減！素晴らしい！","celebration");
  } else if(achievement>50){
    showMessage("順調です！この調子！","encourage");
  }
}

// --- 初期描画 ---
renderRecords();
updateChart();
updateStats();