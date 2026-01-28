// --- Core Random Logic (Web Crypto API) ---
function getCryptoRandomInt(min, max) {
    const range = max - min + 1;
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return min + (array[0] % range);
}

function getCryptoRandomIndex(length) {
    if (length === 0) return -1;
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % length;
}

// --- History Management ---
function saveToHistory(toolName, result) {
    const history = JSON.parse(localStorage.getItem('randomToolHistory') || '[]');
    const newItem = {
        tool: toolName,
        result: result,
        timestamp: new Date().toLocaleString()
    };
    history.unshift(newItem);
    if (history.length > 50) history.pop();
    localStorage.setItem('randomToolHistory', JSON.stringify(history));
    updateHistoryUI();
}

function updateHistoryUI() {
    const container = document.getElementById('history-container');
    const history = JSON.parse(localStorage.getItem('randomToolHistory') || '[]');
    
    if (history.length === 0) {
        container.innerHTML = '<p class="empty-msg">No history yet</p>';
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="history-item">
            <span class="timestamp">${item.timestamp}</span>
            <strong>${item.tool}:</strong> ${item.result}
        </div>
    `).join('');
}

function clearHistory() {
    localStorage.setItem('randomToolHistory', '[]');
    updateHistoryUI();
}

// --- Random Number Generator ---
function generateNumbers() {
    const min = parseInt(document.getElementById('num-min').value);
    const max = parseInt(document.getElementById('num-max').value);
    const count = parseInt(document.getElementById('num-count').value);
    const unique = document.getElementById('num-unique').checked;
    const display = document.getElementById('num-result');

    if (isNaN(min) || isNaN(max) || isNaN(count)) {
        display.innerText = "Error";
        return;
    }

    if (unique && count > (max - min + 1)) {
        alert("Count exceeds range for unique numbers.");
        return;
    }

    let results = [];
    if (unique) {
        let pool = [];
        for (let i = min; i <= max; i++) pool.push(i);
        for (let i = 0; i < count; i++) {
            const idx = getCryptoRandomIndex(pool.length);
            results.push(pool.splice(idx, 1)[0]);
        }
    } else {
        for (let i = 0; i < count; i++) {
            results.push(getCryptoRandomInt(min, max));
        }
    }

    const resultStr = results.join(', ');
    display.innerText = resultStr;
    saveToHistory("Random Number", resultStr);
}

// --- Shuffle List ---
function shuffleList() {
    const input = document.getElementById('shuffle-input').value;
    const resultArea = document.getElementById('shuffle-result');
    
    let items = input.split('\n').filter(line => line.trim() !== '');
    if (items.length === 0) return;

    // Fisher-Yates shuffle using Crypto API
    for (let i = items.length - 1; i > 0; i--) {
        const j = getCryptoRandomIndex(i + 1);
        [items[i], items[j]] = [items[j], items[i]];
    }

    const shuffledText = items.join('\n');
    resultArea.innerText = shuffledText;
    saveToHistory("Shuffle List", `Shuffled ${items.length} items`);
}

function copyShuffleResult() {
    const text = document.getElementById('shuffle-result').innerText;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        alert("Copied to clipboard!");
    });
}

// --- Yes/No Decision ---
function decideYesNo() {
    const card = document.getElementById('decision-card');
    const resultFace = document.getElementById('decision-result');
    const options = ["YES", "NO", "MAYBE"];
    
    card.classList.remove('flipped');
    
    // Play with timeout for animation sync
    setTimeout(() => {
        const result = options[getCryptoRandomIndex(options.length)];
        resultFace.innerText = result;
        card.classList.add('flipped');
        saveToHistory("Yes/No", result);
    }, 100);
}

// --- Spin Wheel ---
let wheelItems = ["Item 1", "Item 2", "Item 3"];
function updateWheel() {
    const input = document.getElementById('wheel-input').value;
    wheelItems = input.split('\n').filter(line => line.trim() !== '');
    drawWheel(0);
}

function drawWheel(rotation) {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 10;

    ctx.clearRect(0, 0, width, height);

    if (wheelItems.length === 0) return;

    const ArcSize = (2 * Math.PI) / wheelItems.length;
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    wheelItems.forEach((item, i) => {
        ctx.beginPath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, i * ArcSize, (i + 1) * ArcSize);
        ctx.fill();
        ctx.closePath();

        // Add text
        ctx.save();
        ctx.rotate(i * ArcSize + ArcSize / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Inter";
        ctx.fillText(item.length > 10 ? item.substring(0, 8) + ".." : item, radius - 20, 5);
        ctx.restore();
    });

    // Outer Border
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 5;
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.restore();
}

function spinWheel() {
    if (wheelItems.length === 0) return;
    const btn = document.getElementById('spin-button');
    btn.disabled = true;

    const spins = 5 + Math.random() * 5; // Extra spins
    const extraDegrees = Math.random() * (2 * Math.PI);
    const totalRotation = spins * 2 * Math.PI + extraDegrees;
    
    let currentRotation = 0;
    const startTime = Date.now();
    const duration = 4000; // 4 seconds

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (out-cubic)
        const ease = 1 - Math.pow(1 - progress, 3);
        currentRotation = totalRotation * ease;
        
        drawWheel(currentRotation);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            btn.disabled = false;
            // Calculate pointing item (pointer is at top = -Math.PI/2)
            const finalRotation = (currentRotation % (2 * Math.PI));
            const pointerAngle = (3 * Math.PI / 2) - finalRotation;
            let normalizedAngle = pointerAngle % (2 * Math.PI);
            if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;

            const segmentStep = (2 * Math.PI) / wheelItems.length;
            const index = Math.floor(normalizedAngle / segmentStep);
            const winner = wheelItems[index];
            
            document.getElementById('wheel-result-text').innerText = "Winner: " + winner;
            saveToHistory("Spin Wheel", winner);
        }
    }

    animate();
}

// --- "Hôm nay ăn gì?" ---
let foodList = ["Bún chả", "Phở bò", "Cơm tấm", "Bánh mì", "Pizza", "Gà rán", "Sushi", "Bún đậu mắm tôm"];

function initFood() {
    const stored = localStorage.getItem('foodList');
    if (stored) {
        foodList = JSON.parse(stored);
    }
    renderFood();
}

function renderFood() {
    const container = document.getElementById('food-list');
    container.innerHTML = foodList.map((food, i) => `
        <div class="food-tag">
            <span>${food}</span>
            <span class="remove" onclick="removeFood(${i})">×</span>
        </div>
    `).join('');
}

function addFood() {
    const input = document.getElementById('food-input');
    const val = input.value.trim();
    if (val) {
        foodList.push(val);
        input.value = "";
        localStorage.setItem('foodList', JSON.stringify(foodList));
        renderFood();
    }
}

function removeFood(index) {
    foodList.splice(index, 1);
    localStorage.setItem('foodList', JSON.stringify(foodList));
    renderFood();
}

function randomFood() {
    if (foodList.length === 0) return;
    const resultDisplay = document.getElementById('food-result');
    
    // Animation effect
    let count = 0;
    const timer = setInterval(() => {
        resultDisplay.innerText = foodList[getCryptoRandomIndex(foodList.length)];
        count++;
        if (count > 10) {
            clearInterval(timer);
            const final = foodList[getCryptoRandomIndex(foodList.length)];
            resultDisplay.innerText = final;
            saveToHistory("Hôm nay ăn gì?", final);
        }
    }, 100);
}

// --- Initialize ---
window.onload = () => {
    updateHistoryUI();
    updateWheel();
    initFood();
};
