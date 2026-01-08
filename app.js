import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Firebase 初始化配置 [2][3]
const firebaseConfig = {
    apiKey: "AIzaSyBBpI1K7LA1zvN8qQOLzKpal0Q2Y3IKDGE",
    authDomain: "checklist-7dfa7.firebaseapp.com",
    projectId: "checklist-7dfa7",
    storageBucket: "checklist-7dfa7.firebasestorage.app",
    messagingSenderId: "961219093530",
    appId: "1:961219093530:web:a1a78aa5f8028c2497dda3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const expenseCol = collection(db, "expenses");

// 2. Chart.js 初始化 (紫色系配色) [1]
let myChart;
const ctx = document.getElementById('expenseChart').getContext('2d');

function updateChart(data) {
    const categories = data.map(item => item.category);
    const amounts = data.map(item => item.amount);
    const total = amounts.reduce((a, b) => a + b, 0);
    document.getElementById('totalAmount').innerText = `$ ${total.toLocaleString()}`;

    if (myChart) { myChart.destroy(); }

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#8b5cf6'], // 不同層次的紫色
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            cutout: '80%',
            plugins: { legend: { display: false } }
        }
    });
}

// 3. 監聽 Firestore 即時更新 (onSnapshot)
onSnapshot(query(expenseCol, orderBy("timestamp", "desc")), (snapshot) => {
    const transactions = [];
    snapshot.forEach(doc => transactions.push(doc.data()));

    // 更新圖表
    updateChart(transactions);

    // 更新列表 UI
    const listEl = document.getElementById('transactionList');
    listEl.innerHTML = transactions.map(t => `
        <div class="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                    ${t.category.charAt(0)}
                </div>
                <div>
                    <p class="text-sm font-bold text-gray-800">${t.category}</p>
                    <p class="text-xs text-gray-400">${t.note || 'General'}</p>
                </div>
            </div>
            <p class="font-bold text-gray-800">$ ${t.amount}</p>
        </div>
    `).join('');
});

// 4. 處理「貼上 JSON -> 寫入資料庫」
document.getElementById('uploadBtn').addEventListener('click', async () => {
    const jsonText = document.getElementById('jsonInput').value;
    try {
        const data = JSON.parse(jsonText);
        // 假設 Gemini 生成的是物件或陣列，我們統一處理
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
            await addDoc(expenseCol, {
                ...item,
                timestamp: new Date()
            });
        }
        alert('數據同步成功！');
        document.getElementById('jsonInput').value = '';
    } catch (e) {
        console.log('Raw input text:', jsonText);
        console.log('Input length:', jsonText.length);
        console.log('First 50 chars:', JSON.stringify(jsonText.substring(0, 50)));
        console.error('Parse error:', e.message);
        alert('JSON 格式錯誤：' + e.message + '\n\n請打開 DevTools Console (F12) 查看詳細資訊');
    }
});