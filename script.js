let records = JSON.parse(localStorage.getItem("weights")) || [];
let goal = parseFloat(localStorage.getItem("goal")) || 60;
let chart;
let visibleCount = 5;
const messageDiv = document.getElementById("message");

const dateInput = document.getElementById("dateInput");
const goalInput = document.getElementById("goalInput");
dateInput.value = getTodayJST();
goalInput.value = goal;

function getTodayJST() {
  const now = new Date();
  const jstOffset = 9 * 60;
  const localOffset = now.getTimezoneOffset();
  const jstTime = new Date(now.getTime() + (jstOffset + localOffset) * 60000);
  return jstTime.toISOString().split("T")[0];
}

function showMessage(msg, type="info") {
  messageDiv.textContent = msg;
  messageDiv.className = "";
  messageDiv.classList.add(`message-${type}`);
  void messageDiv.offsetWidth;
  messageDiv.classList.add("show");
  setTimeout(() => messageDiv.classList.remove("show"), 4000);
}

document.getElementById("recordForm").addEventListener("submit", e => {
  e.preventDefault();
  const date = dateInput.value;
  const weight = parseFloat(document.getElementById("weightInput").value);
  const meal = document.getElementById("mealInput").value;
  const newGoal = parseFloat(goalInput.value);
  if (newGoal) {
    goal = newGoal;
    localStorage.setItem("goal", goal);
  }
  if (!weight) return;

  const existingIndex = records.findIndex(r => r.date === date);
  if (existingIndex !== -1) {
    records[existingIndex] = { date, weight, meal };
  } else {
    records.push({ date, weight, meal });
  }
  records.sort((a,b)=>new Date(a.date)-new Date(b.date));
  localStorage.setItem("weights", JSON.stringify(records));

  showMessage(`${weight}kg を記録しました！`, "info");
  renderRecords();
  updateChart();
  updateStats();
  e.target.reset();
  dateInput.value = getTodayJST();
  goalInput.value = goal;
});

function renderRecords() {
  const list = document.getElementById("recordList");
  list.innerHTML = "";
  const sorted = [...records].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const toShow = sorted.slice(0, visibleCount);
  toShow.forEach((r,index) => {
    const li = document.createElement("li");
    let arrow = "";
    let cls = "noChange";
    if (index < sorted.length-1) {
      const next = sorted[index+1].weight;
      if (r.weight>next){ arrow="⬆"; cls="increase"; }
      else if(r.weight<next){ arrow="⬇"; cls="decrease"; }
      else { arrow="→"; }
    }
    li.className = cls;
    li.innerHTML = `<div><strong>${r.weight}kg ${arrow}</strong><br><small>${r.date}</small><br>食事: ${r.meal || ""}</div>`;
    const delBtn = document.createElement("button");
    delBtn.textContent="削除";
    delBtn.onclick=()=> {
      records = records.filter(x=>!(x.date===r.date&&x.weight===r.weight));
      localStorage.setItem("weights", JSON.stringify(records));
      renderRecords();
      updateChart();
      updateStats();
    };
    li.appendChild(delBtn);
    list.appendChild(li);
  });
  document.getElementById("loadMoreBtn").style.display = visibleCount < sorted.length ? "block" : "none";
}

document.getElementById("loadMoreBtn").addEventListener("click", () => {
  visibleCount += 5;
  renderRecords();
});

function updateChart() {
  const ctx = document.getElementById("weightChart").getContext("2d");
  if(chart) chart.destroy();
  const labels = records.map(r=>r.date);
  const data = records.map(r=>r.weight);
  chart = new Chart(ctx,{
    type:'line',
    data:{
      labels,
      datasets:[
        {label:'体重(kg)', data, borderColor:'#1a73e8', fill:false},
        {label:'目標体重', data:labels.map(_=>goal), borderColor:'#28a745', borderDash:[5,5], fill:false}
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false
    }
  });
}

function updateStats() {
  if(records.length===0) return;
  const start = records[0].weight;
  const latest = records[records.length-1].weight;
  const diff = (start-latest).toFixed(1);
  document.getElementById("totalLoss").textContent=`${diff}kg`;
  const achievement = ((start-latest)/(start-goal)*100).toFixed(1);
  document.getElementById("achievement").textContent=`${Math.min(Math.max(achievement,0),100)}%`;
  if(latest<=goal){ showMessage("🏆 目標達成！おめでとう！","celebration"); }
  else if(start-latest>=10){ showMessage("🎉 最初から10kg減！すごすぎる！","celebration"); }
  else if(start-latest>=5){ showMessage("🎉 最初から5kg減！かなり頑張ったね！","celebration"); }
  else if(start-latest>=3){ showMessage("🎉 最初から3kg減！素晴らしい！","celebration"); }
  else if(achievement>50){ showMessage("順調です！この調子！","encourage"); }
}

// 初期描画
renderRecords();
updateChart();
updateStats();