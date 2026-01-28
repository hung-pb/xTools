// ============================================
// TAX CALCULATION CONSTANTS
// ============================================
const TAX_CONFIG = {
    selfDeduction: 15500000,
    dependentDeduction: 6200000,
    insuranceRate: 0.105,  // Total: BHXH 8% + BHYT 1.5% + BHTN 1%
    unionRate: 0.005,      // Union fee: 0.5% of insurance base
    unionMaxCap: 234000,   // Max union fee: 234,000 VND/month (10% of base salary 2.34M)
    insuranceBreakdown: {
        bhxh: 0.08,        // Social insurance
        bhyt: 0.015,       // Health insurance
        bhtn: 0.01         // Unemployment insurance
    },
    brackets: [
        { max: 10000000, rate: 0.05, label: '≤ 10 triệu' },
        { max: 30000000, rate: 0.10, label: '10 - 30 triệu' },
        { max: 60000000, rate: 0.20, label: '30 - 60 triệu' },
        { max: 100000000, rate: 0.30, label: '60 - 100 triệu' },
        { max: Infinity, rate: 0.35, label: '> 100 triệu' }
    ]
};

// ============================================
// STATE
// ============================================
let state = {
    income: 40000000,
    dependents: 1,
    customInsuranceBase: false,
    insuranceBase: 40000000,
    hasUnion: false
};

let taxChart = null;

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    income: document.getElementById('income'),
    dependentsDisplay: document.getElementById('dependentsDisplay'),
    incrementBtn: document.getElementById('incrementBtn'),
    decrementBtn: document.getElementById('decrementBtn'),
    calculateBtn: document.getElementById('calculateBtn'),
    customInsuranceCheckbox: document.getElementById('customInsuranceCheckbox'),
    insuranceBaseInputWrapper: document.getElementById('insuranceBaseInputWrapper'),
    insuranceBase: document.getElementById('insuranceBase'),
    unionCheckbox: document.getElementById('unionCheckbox'),
    unionRow: document.getElementById('unionRow'),

    totalIncome: document.getElementById('totalIncome'),
    totalInsurance: document.getElementById('totalInsurance'),
    bhxh: document.getElementById('bhxh'),
    bhyt: document.getElementById('bhyt'),
    bhtn: document.getElementById('bhtn'),
    unionFee: document.getElementById('unionFee'),
    incomeAfterDeductions: document.getElementById('incomeAfterDeductions'),
    familyDeduction: document.getElementById('familyDeduction'),
    taxableIncome: document.getElementById('taxableIncome'),
    totalTax: document.getElementById('totalTax'),
    effectiveRate: document.getElementById('effectiveRate'),
    taxTableBody: document.getElementById('taxTableBody'),
    tableTotalTax: document.getElementById('tableTotalTax')
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' VNĐ';
}

function parseCurrency(str) {
    return parseInt(str.replace(/[^\d]/g, '')) || 0;
}

function formatInputCurrency(input) {
    const value = parseCurrency(input.value);
    const formatted = new Intl.NumberFormat('vi-VN').format(value);
    input.value = formatted;
    return value;
}

// ============================================
// TAX CALCULATION LOGIC (NEW FORMULA)
// ============================================
function calculateTax(income, dependents, insuranceBase, hasUnion) {
    // Step 1: Validate and calculate insurance base
    const validInsuranceBase = Math.min(insuranceBase, income);

    // Step 2: Calculate insurance (10.5% total)
    const bhxh = validInsuranceBase * TAX_CONFIG.insuranceBreakdown.bhxh;
    const bhyt = validInsuranceBase * TAX_CONFIG.insuranceBreakdown.bhyt;
    const bhtn = validInsuranceBase * TAX_CONFIG.insuranceBreakdown.bhtn;
    const totalInsurance = validInsuranceBase * TAX_CONFIG.insuranceRate;

    // Step 3: Calculate union fee (0.5% of insurance base, max 234k VND)
    const unionFee = hasUnion ? Math.min(validInsuranceBase * TAX_CONFIG.unionRate, TAX_CONFIG.unionMaxCap) : 0;

    // Step 4: Income after deductions
    const incomeAfterDeductions = income - totalInsurance - unionFee;

    // Step 5: Family deduction
    const familyDeduction = TAX_CONFIG.selfDeduction + (dependents * TAX_CONFIG.dependentDeduction);

    // Step 6: Taxable income
    const taxableIncome = Math.max(0, incomeAfterDeductions - familyDeduction);

    // Step 7: Calculate tax for each bracket
    const bracketResults = [];
    let remainingIncome = taxableIncome;
    let totalTax = 0;
    let previousMax = 0;

    for (let i = 0; i < TAX_CONFIG.brackets.length; i++) {
        const bracket = TAX_CONFIG.brackets[i];
        const bracketMax = bracket.max - previousMax;
        const taxableInBracket = Math.min(remainingIncome, bracketMax);
        const taxInBracket = taxableInBracket * bracket.rate;

        bracketResults.push({
            bracket: i + 1,
            label: bracket.label,
            rate: bracket.rate,
            taxableAmount: taxableInBracket,
            taxAmount: taxInBracket
        });

        totalTax += taxInBracket;
        remainingIncome -= taxableInBracket;
        previousMax = bracket.max;

        if (remainingIncome <= 0) break;
    }

    // Fill remaining brackets with zeros
    for (let i = bracketResults.length; i < TAX_CONFIG.brackets.length; i++) {
        bracketResults.push({
            bracket: i + 1,
            label: TAX_CONFIG.brackets[i].label,
            rate: TAX_CONFIG.brackets[i].rate,
            taxableAmount: 0,
            taxAmount: 0
        });
    }

    const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;

    return {
        income,
        insuranceBreakdown: {
            bhxh,
            bhyt,
            bhtn,
            total: totalInsurance
        },
        unionFee,
        unionFee,
        incomeAfterDeductions,
        familyDeduction,
        taxableIncome,
        totalTax,
        effectiveRate,
        bracketResults
    };
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================
function updateResults(results) {
    // Update summary
    elements.totalIncome.textContent = formatCurrency(results.income);
    elements.totalInsurance.textContent = formatCurrency(results.insuranceBreakdown.total);
    elements.bhxh.textContent = formatCurrency(results.insuranceBreakdown.bhxh);
    elements.bhyt.textContent = formatCurrency(results.insuranceBreakdown.bhyt);
    elements.bhtn.textContent = formatCurrency(results.insuranceBreakdown.bhtn);
    elements.unionFee.textContent = formatCurrency(results.unionFee);
    elements.unionRow.style.display = results.unionFee > 0 ? 'flex' : 'none';
    elements.incomeAfterDeductions.textContent = formatCurrency(results.incomeAfterDeductions);
    elements.familyDeduction.textContent = formatCurrency(results.familyDeduction);
    elements.taxableIncome.textContent = formatCurrency(results.taxableIncome);
    elements.totalTax.textContent = formatCurrency(results.totalTax);
    elements.effectiveRate.textContent = results.effectiveRate.toFixed(2) + '%';
    elements.tableTotalTax.textContent = formatCurrency(results.totalTax);

    // Update table
    elements.taxTableBody.innerHTML = results.bracketResults.map(bracket => `
        <tr>
            <td class="table-number" data-label="Bậc">${bracket.bracket}</td>
            <td data-label="Phạm vi">${bracket.label}</td>
            <td class="table-rate" data-label="Thuế suất">${(bracket.rate * 100).toFixed(0)}%</td>
            <td class="table-number" data-label="Chịu thuế">${formatCurrency(bracket.taxableAmount)}</td>
            <td class="table-number" data-label="Nộp">${formatCurrency(bracket.taxAmount)}</td>
        </tr>
    `).join('');

    // Update chart
    updateChart(results.bracketResults);
}

function updateChart(bracketResults) {
    const ctx = document.getElementById('taxChart').getContext('2d');

    // Filter out brackets with no tax
    const activeBrackets = bracketResults.filter(b => b.taxAmount > 0);

    const data = {
        labels: activeBrackets.map(b => `Bậc ${b.bracket}`),
        datasets: [{
            label: 'Thuế phải nộp (VNĐ)',
            data: activeBrackets.map(b => b.taxAmount),
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(236, 72, 153, 0.8)',
                'rgba(251, 146, 60, 0.8)',
                'rgba(34, 197, 94, 0.8)'
            ],
            borderColor: [
                'rgba(59, 130, 246, 1)',
                'rgba(139, 92, 246, 1)',
                'rgba(236, 72, 153, 1)',
                'rgba(251, 146, 60, 1)',
                'rgba(34, 197, 94, 1)'
            ],
            borderWidth: 2
        }]
    };

    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#F8FAFC',
                    bodyColor: '#CBD5E1',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            return 'Thuế: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#94A3B8',
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        },
                        callback: function (value) {
                            return (value / 1000000).toFixed(1) + 'M';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94A3B8',
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        }
                    }
                }
            }
        }
    };

    if (taxChart) {
        taxChart.destroy();
    }

    taxChart = new Chart(ctx, config);
}

// ============================================
// EVENT HANDLERS
// ============================================
function handleCalculate() {
    const income = parseCurrency(elements.income.value);
    const dependents = state.dependents;
    const insuranceBase = state.customInsuranceBase ? parseCurrency(elements.insuranceBase.value) : income;
    const hasUnion = state.hasUnion;

    state.income = income;
    state.insuranceBase = insuranceBase;

    const results = calculateTax(income, dependents, insuranceBase, hasUnion);
    updateResults(results);
}

function handleCustomInsuranceToggle() {
    state.customInsuranceBase = elements.customInsuranceCheckbox.checked;

    if (state.customInsuranceBase) {
        elements.insuranceBaseInputWrapper.classList.remove('hidden');
        // Set insurance base to current income
        elements.insuranceBase.value = elements.income.value;
        formatInputCurrency(elements.insuranceBase);
    } else {
        elements.insuranceBaseInputWrapper.classList.add('hidden');
    }
}

function handleUnionToggle() {
    state.hasUnion = elements.unionCheckbox.checked;
}

function handleIncrement() {
    state.dependents++;
    elements.dependentsDisplay.textContent = state.dependents;
}

function handleDecrement() {
    if (state.dependents > 0) {
        state.dependents--;
        elements.dependentsDisplay.textContent = state.dependents;
    }
}

function handleIncomeInput(e) {
    formatInputCurrency(e.target);
}

// ============================================
// EVENT LISTENERS
// ============================================
elements.calculateBtn.addEventListener('click', handleCalculate);
elements.incrementBtn.addEventListener('click', handleIncrement);
elements.decrementBtn.addEventListener('click', handleDecrement);
elements.income.addEventListener('blur', handleIncomeInput);
elements.customInsuranceCheckbox.addEventListener('change', handleCustomInsuranceToggle);
elements.insuranceBase.addEventListener('blur', handleIncomeInput);
elements.unionCheckbox.addEventListener('change', handleUnionToggle);

// Allow Enter key to calculate
elements.income.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleCalculate();
    }
});

// ============================================
// INITIALIZATION
// ============================================
function init() {
    // Format initial income value
    formatInputCurrency(elements.income);

    // Calculate initial results
    handleCalculate();
}

// Run on page load
init();
