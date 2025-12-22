// script.js - Enhanced with API calls
// Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
let navTabs, pages, actionButtons, prohibitedSourceBtn, prohibitedSourceModal;
let modalCloseButtons, checkSourceBtn, sourceCheckSelect, checkResult;
let resultTitle, resultDesc, resultRule, reviewGiftButtons, reviewGiftModal;
let submitReviewBtn, giftDeclarationForm, successModal, penaltyValueInput;
let breachNumberSelect, calculatedFine, filterButtons, saveDraftBtn;
let viewGiftButtons, relationshipSelect, prohibitedCheck, receiptDateInput;

// Initialize application
async function initApp() {
    console.log('Bhutan Gift Transparency System (BGTS) Initialized');
    console.log('Compliant with Gift Rules 2017, Anti-Corruption Commission, Bhutan');
    
    // Cache DOM elements
    cacheDOMElements();
    
    // Set default receipt date to now
    setDefaultReceiptDate();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize penalty calculator
    calculateFine();
    
    // Load initial data
    await loadInitialData();
    
    // Check server connection
    await checkServerConnection();
}

// Cache DOM elements for better performance
function cacheDOMElements() {
    navTabs = document.querySelectorAll('.nav-tab');
    pages = document.querySelectorAll('.page');
    actionButtons = document.querySelectorAll('.action-btn');
    prohibitedSourceBtn = document.getElementById('check-prohibited-btn');
    prohibitedSourceModal = document.getElementById('prohibited-source-modal');
    modalCloseButtons = document.querySelectorAll('.modal-close');
    checkSourceBtn = document.getElementById('check-source-btn');
    sourceCheckSelect = document.getElementById('source-check');
    checkResult = document.getElementById('check-result');
    resultTitle = document.getElementById('result-title');
    resultDesc = document.getElementById('result-desc');
    resultRule = document.getElementById('result-rule');
    reviewGiftButtons = document.querySelectorAll('.review-gift-btn');
    reviewGiftModal = document.getElementById('review-gift-modal');
    submitReviewBtn = document.getElementById('submit-review-btn');
    giftDeclarationForm = document.getElementById('gift-declaration-form');
    successModal = document.getElementById('success-modal');
    penaltyValueInput = document.getElementById('penalty-value');
    breachNumberSelect = document.getElementById('breach-number');
    calculatedFine = document.getElementById('calculated-fine');
    filterButtons = document.querySelectorAll('.filter-btn');
    saveDraftBtn = document.getElementById('save-draft-btn');
    viewGiftButtons = document.querySelectorAll('.view-gift-btn');
    relationshipSelect = document.getElementById('relationship');
    prohibitedCheck = document.getElementById('prohibited-check');
    receiptDateInput = document.getElementById('receipt-date');
}

// Set default receipt date to current date/time
function setDefaultReceiptDate() {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 16);
    if (receiptDateInput) {
        receiptDateInput.value = localISOTime;
    }
}

// Check server connection
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/gifts`);
        if (response.ok) {
            console.log('✅ Backend server connected successfully');
            updateConnectionStatus(true);
        }
    } catch (error) {
        console.warn('⚠️ Backend server not responding, using demo mode');
        updateConnectionStatus(false);
    }
}

// Update connection status indicator
function updateConnectionStatus(connected) {
    const statusElement = document.createElement('div');
    statusElement.id = 'connection-status';
    statusElement.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 0.8rem;
        z-index: 1000;
        ${connected ? 'background: #d4edda; color: #155724;' : 'background: #fff3cd; color: #856404;'}
    `;
    statusElement.textContent = connected ? '✅ Connected to server' : '⚠️ Demo mode (offline)';
    
    // Remove existing status if any
    const existingStatus = document.getElementById('connection-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    document.body.appendChild(statusElement);
}

// Load initial data from API
async function loadInitialData() {
    try {
        // Load gifts
        const giftsResponse = await fetch(`${API_BASE_URL}/gifts`);
        if (giftsResponse.ok) {
            const gifts = await giftsResponse.json();
            console.log(`Loaded ${gifts.length} gifts from server`);
        }
        
        // Load penalties
        const penaltiesResponse = await fetch(`${API_BASE_URL}/penalties`);
        if (penaltiesResponse.ok) {
            const penalties = await penaltiesResponse.json();
            console.log(`Loaded ${penalties.length} penalties from server`);
        }
    } catch (error) {
        console.log('Using demo data (offline mode)');
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Navigation
    navTabs.forEach(tab => {
        tab.addEventListener('click', handleNavigation);
    });
    
    // Action buttons navigation
    actionButtons.forEach(button => {
        button.addEventListener('click', handleActionButtonClick);
    });
    
    // Prohibited Source Checker
    if (prohibitedSourceBtn) {
        prohibitedSourceBtn.addEventListener('click', () => {
            prohibitedSourceModal.classList.add('active');
        });
    }
    
    // Check source button
    if (checkSourceBtn) {
        checkSourceBtn.addEventListener('click', checkSource);
    }
    
    // Review Gift buttons
    reviewGiftButtons.forEach(button => {
        button.addEventListener('click', () => {
            reviewGiftModal.classList.add('active');
        });
    });
    
    // Submit review
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', submitReview);
    }
    
    // Gift declaration form
    if (giftDeclarationForm) {
        giftDeclarationForm.addEventListener('submit', submitGiftDeclaration);
    }
    
    // Save draft
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveDraft);
    }
    
    // Penalty calculator
    if (penaltyValueInput) {
        penaltyValueInput.addEventListener('input', calculateFine);
    }
    if (breachNumberSelect) {
        breachNumberSelect.addEventListener('change', calculateFine);
    }
    
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilterClick);
    });
    
    // View gift buttons
    viewGiftButtons.forEach(button => {
        button.addEventListener('click', viewGiftDetails);
    });
    
    // Relationship select change
    if (relationshipSelect) {
        relationshipSelect.addEventListener('change', handleRelationshipChange);
    }
    
    // Close modals
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Handle navigation between pages
function handleNavigation(e) {
    e.preventDefault();
    const tab = e.currentTarget;
    const pageId = tab.getAttribute('data-page');
    
    // Update active tab
    navTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show selected page
    pages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// Handle action button clicks
function handleActionButtonClick(e) {
    e.preventDefault();
    const button = e.currentTarget;
    
    if (button.hasAttribute('data-page')) {
        const pageId = button.getAttribute('data-page');
        
        // Update active tab
        navTabs.forEach(t => {
            t.classList.remove('active');
            if (t.getAttribute('data-page') === pageId) {
                t.classList.add('active');
            }
        });
        
        // Show selected page
        pages.forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    }
}

// Check prohibited source via API
async function checkSource() {
    const selectedValue = sourceCheckSelect.value;
    
    if (!selectedValue) {
        alert('Please select a relationship');
        return;
    }
    
    try {
        // Call API
        const response = await fetch(`${API_BASE_URL}/check-source`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ relationship: selectedValue })
        });
        
        if (response.ok) {
            const result = await response.json();
            displayCheckResult(result);
        } else {
            // Fallback to local check
            fallbackCheckSource(selectedValue);
        }
    } catch (error) {
        console.error('API call failed, using fallback:', error);
        fallbackCheckSource(selectedValue);
    }
}

// Display check result
function displayCheckResult(result) {
    resultTitle.textContent = result.title;
    resultDesc.textContent = result.desc;
    resultRule.textContent = result.rule;
    
    // Set colors based on result
    if (result.isProhibited === true) {
        checkResult.style.backgroundColor = '#f8d7da';
        checkResult.style.color = '#721c24';
    } else if (result.isProhibited === false) {
        checkResult.style.backgroundColor = '#d4edda';
        checkResult.style.color = '#155724';
    } else {
        checkResult.style.backgroundColor = '#cce5ff';
        checkResult.style.color = '#004085';
    }
    
    checkResult.style.display = 'block';
}

// Fallback check if API fails
function fallbackCheckSource(selectedValue) {
    const results = {
        'seeks-action': {
            title: 'PROHIBITED SOURCE',
            desc: 'This giver is a prohibited source under Rule 8(a). You cannot accept gifts from them.',
            rule: 'Rule 8(a): Who seeks official action or business from the public servant\'s agency.',
            isProhibited: true
        },
        'does-business': {
            title: 'PROHIBITED SOURCE',
            desc: 'This giver is a prohibited source under Rule 8(b). You cannot accept gifts from them.',
            rule: 'Rule 8(b): Who does business or seeks to do business with the public servant\'s agency.',
            isProhibited: true
        },
        'regulated': {
            title: 'PROHIBITED SOURCE',
            desc: 'This giver is a prohibited source under Rule 8(c). You cannot accept gifts from them.',
            rule: 'Rule 8(c): Who conducts activities regulated by the public servant\'s agency.',
            isProhibited: true
        },
        'family': {
            title: 'ALLOWED (with conditions)',
            desc: 'Gifts from immediate relatives are allowed if clearly motivated by the relationship rather than official position.',
            rule: 'Rule 11(b): Gift from an immediate relative when the circumstances make it clear that it is the relationship rather than the position which is the motivating factor.',
            isProhibited: false
        }
    };
    
    const result = results[selectedValue] || {
        title: 'REVIEW REQUIRED',
        desc: 'This relationship requires further review.',
        rule: 'Please consult with your Gift Disclosure Administrator.',
        isProhibited: null
    };
    
    displayCheckResult(result);
}

// Submit review decision
async function submitReview() {
    const decision = document.getElementById('review-decision').value;
    
    if (!decision) {
        alert('Please select a decision');
        return;
    }
    
    // In a real app, this would submit to API
    showSuccessMessage('Review decision submitted successfully!');
    closeAllModals();
    
    // Reset form
    document.getElementById('review-decision').value = '';
    document.getElementById('review-comments').value = '';
    checkResult.style.display = 'none';
}

// Submit gift declaration via API
async function submitGiftDeclaration(e) {
    e.preventDefault();
    
    // Basic validation
    const giftValue = document.getElementById('gift-value').value;
    const relationship = document.getElementById('relationship').value;
    const giftDescription = document.getElementById('gift-description').value;
    const giverName = document.getElementById('giver-name').value;
    
    if (!giftDescription || !giftValue || !relationship || !giverName) {
        alert('Please fill all required fields marked with *');
        return;
    }
    
    // Prepare gift data
    const giftData = {
        description: giftDescription,
        value: parseFloat(giftValue),
        type: document.getElementById('gift-type').value,
        receiptDate: document.getElementById('receipt-date').value,
        giver: {
            name: giverName,
            designation: document.getElementById('giver-designation').value,
            agency: document.getElementById('giver-agency').value,
            address: document.getElementById('giver-address').value
        },
        relationship: relationship,
        circumstances: document.getElementById('circumstances').value,
        disposition: document.getElementById('disposition').value,
        isProhibitedSource: document.getElementById('prohibited-check').checked,
        recipient: {
            name: 'Tashi Sherpa',
            designation: 'Public Servant',
            agency: 'Ministry of Finance'
        }
    };
    
    try {
        // Submit to API
        const response = await fetch(`${API_BASE_URL}/gifts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(giftData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccessMessage(`Your gift declaration has been submitted successfully. Reference: ${result.reference}`);
            
            // Reset form
            giftDeclarationForm.reset();
            setDefaultReceiptDate();
        } else {
            throw new Error('API submission failed');
        }
    } catch (error) {
        console.error('API submission failed, using fallback:', error);
        // Fallback to local success message
        const refNumber = 'BGTS-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        showSuccessMessage(`Your gift declaration has been submitted successfully. Reference: ${refNumber} (Offline Mode)`);
        
        // Reset form
        giftDeclarationForm.reset();
        setDefaultReceiptDate();
    }
}

// Save draft to localStorage
function saveDraft() {
    const giftData = {
        description: document.getElementById('gift-description').value,
        value: document.getElementById('gift-value').value,
        type: document.getElementById('gift-type').value,
        receiptDate: document.getElementById('receipt-date').value,
        giverName: document.getElementById('giver-name').value,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('bgts_gift_draft', JSON.stringify(giftData));
    showSuccessMessage('Draft saved successfully! You can continue editing later.');
}

// Calculate fine via API or locally
async function calculateFine() {
    const value = parseFloat(penaltyValueInput.value) || 0;
    const breachNum = parseInt(breachNumberSelect.value);
    
    try {
        // Try API first
        const response = await fetch(`${API_BASE_URL}/calculate-penalty`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value, breachNumber: breachNum })
        });
        
        if (response.ok) {
            const result = await response.json();
            calculatedFine.textContent = result.formatted;
            return;
        }
    } catch (error) {
        console.log('Using local penalty calculation');
    }
    
    // Fallback local calculation
    let multiplier;
    switch(breachNum) {
        case 1: multiplier = 2; break;
        case 2: multiplier = 5; break;
        case 3: multiplier = 10; break;
        default: multiplier = 2;
    }
    
    const fine = value * multiplier;
    calculatedFine.textContent = `Nu. ${fine.toLocaleString()}`;
}

// Handle filter clicks
function handleFilterClick(e) {
    const button = e.currentTarget;
    const filterType = button.getAttribute('data-filter');
    
    // Update active filter button
    filterButtons.forEach(btn => {
        btn.classList.remove('btn-primary', 'active');
        btn.classList.add('btn-secondary');
    });
    button.classList.remove('btn-secondary');
    button.classList.add('btn-primary', 'active');
    
    // Filter table rows
    const tableRows = document.querySelectorAll('#my-gifts-table tbody tr');
    tableRows.forEach(row => {
        const status = row.getAttribute('data-status');
        
        if (filterType === 'all' || status === filterType) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// View gift details
function viewGiftDetails(e) {
    const button = e.currentTarget;
    const row = button.closest('tr');
    const date = row.cells[0].textContent;
    const description = row.cells[1].textContent;
    const value = row.cells[2].textContent;
    const giver = row.cells[3].textContent;
    const status = row.cells[4].querySelector('.status-badge').textContent;
    
    alert(`Gift Details:\n\nDate: ${date}\nDescription: ${description}\nValue: Nu. ${value}\nGiver: ${giver}\nStatus: ${status}\n\nFull details would be shown in a detailed view.`);
}

// Handle relationship change
function handleRelationshipChange() {
    const selectedValue = this.value;
    
    // Auto-check prohibited source based on relationship
    if (selectedValue === 'contractor' || selectedValue === 'business') {
        prohibitedCheck.checked = true;
    } else if (selectedValue === 'immediate-relative' || selectedValue === 'personal-friend') {
        prohibitedCheck.checked = false;
    }
}

// Show success message
function showSuccessMessage(message) {
    document.getElementById('success-message').textContent = message;
    successModal.classList.add('active');
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);