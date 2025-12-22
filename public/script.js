// script.js - Updated for Vercel deployment
// Configuration
const API_BASE_URL = window.location.origin + '/api';

// State management
let appState = {
    user: {
        name: 'Tashi Sherpa',
        designation: 'Public Servant',
        agency: 'Ministry of Finance',
        role: 'public-servant'
    },
    gifts: [],
    penalties: [],
    connectionStatus: 'connected'
};

// DOM Elements Cache
let domElements = {};

// Initialize application
async function initApp() {
    console.log('🇧🇹 Bhutan Gift Transparency System (BGTS) Initialized');
    console.log('📋 Compliant with Gift Rules 2017, Anti-Corruption Commission of Bhutan');
    console.log('🌐 API Base URL:', API_BASE_URL);
    
    // Cache DOM elements
    cacheDOMElements();
    
    // Set default receipt date to now
    setDefaultReceiptDate();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize components
    initializeComponents();
    
    // Load initial data
    await loadInitialData();
    
    // Check server connection
    await checkServerConnection();
    
    // Update UI with user info
    updateUserInfo();
}

// Cache DOM elements for better performance
function cacheDOMElements() {
    domElements = {
        navTabs: document.querySelectorAll('.nav-tab'),
        pages: document.querySelectorAll('.page'),
        actionButtons: document.querySelectorAll('.action-btn'),
        prohibitedSourceBtn: document.getElementById('check-prohibited-btn'),
        prohibitedSourceModal: document.getElementById('prohibited-source-modal'),
        modalCloseButtons: document.querySelectorAll('.modal-close'),
        checkSourceBtn: document.getElementById('check-source-btn'),
        sourceCheckSelect: document.getElementById('source-check'),
        checkResult: document.getElementById('check-result'),
        resultTitle: document.getElementById('result-title'),
        resultDesc: document.getElementById('result-desc'),
        resultRule: document.getElementById('result-rule'),
        reviewGiftButtons: document.querySelectorAll('.review-gift-btn'),
        reviewGiftModal: document.getElementById('review-gift-modal'),
        submitReviewBtn: document.getElementById('submit-review-btn'),
        giftDeclarationForm: document.getElementById('gift-declaration-form'),
        successModal: document.getElementById('success-modal'),
        penaltyValueInput: document.getElementById('penalty-value'),
        breachNumberSelect: document.getElementById('breach-number'),
        calculatedFine: document.getElementById('calculated-fine'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        saveDraftBtn: document.getElementById('save-draft-btn'),
        viewGiftButtons: document.querySelectorAll('.view-gift-btn'),
        relationshipSelect: document.getElementById('relationship'),
        prohibitedCheck: document.getElementById('prohibited-check'),
        receiptDateInput: document.getElementById('receipt-date'),
        searchInput: document.querySelector('.search-input'),
        giftDescription: document.getElementById('gift-description'),
        giftValue: document.getElementById('gift-value'),
        giftType: document.getElementById('gift-type'),
        giverName: document.getElementById('giver-name'),
        giverDesignation: document.getElementById('giver-designation'),
        giverAgency: document.getElementById('giver-agency'),
        giverAddress: document.getElementById('giver-address'),
        circumstances: document.getElementById('circumstances'),
        disposition: document.getElementById('disposition'),
        myGiftsTable: document.getElementById('my-gifts-table'),
        notificationBadge: document.querySelector('.notification-badge')
    };
}

// Set default receipt date to current date/time
function setDefaultReceiptDate() {
    if (domElements.receiptDateInput) {
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now - timezoneOffset).toISOString().slice(0, 16);
        domElements.receiptDateInput.value = localISOTime;
    }
}

// Update user information in UI
function updateUserInfo() {
    const userInfoElements = document.querySelectorAll('.user-info');
    userInfoElements.forEach(element => {
        if (element.classList.contains('user-name')) {
            element.textContent = appState.user.name;
        } else if (element.classList.contains('user-role')) {
            element.textContent = appState.user.designation;
        }
    });
}

// Check server connection
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend server connected:', data);
            appState.connectionStatus = 'connected';
            updateConnectionStatus(true);
            return true;
        } else {
            throw new Error('Server responded with error');
        }
    } catch (error) {
        console.warn('⚠️ Backend server not responding, using demo mode:', error.message);
        appState.connectionStatus = 'offline';
        updateConnectionStatus(false);
        return false;
    }
}

// Update connection status indicator
function updateConnectionStatus(connected) {
    // Remove existing status if any
    const existingStatus = document.getElementById('connection-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    if (!connected) {
        const statusElement = document.createElement('div');
        statusElement.id = 'connection-status';
        statusElement.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            z-index: 1000;
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        statusElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Demo Mode (Offline)</span>
        `;
        document.body.appendChild(statusElement);
    }
}

// Load initial data from API
async function loadInitialData() {
    try {
        // Load gifts
        const giftsResponse = await fetch(`${API_BASE_URL}/gifts`);
        if (giftsResponse.ok) {
            const result = await giftsResponse.json();
            if (result.success) {
                appState.gifts = result.data;
                console.log(`📦 Loaded ${appState.gifts.length} gifts from server`);
                updateGiftsTable();
            }
        }
        
        // Load penalties
        const penaltiesResponse = await fetch(`${API_BASE_URL}/penalties`);
        if (penaltiesResponse.ok) {
            const result = await penaltiesResponse.json();
            if (result.success) {
                appState.penalties = result.data;
                console.log(`⚖️ Loaded ${appState.penalties.length} penalties from server`);
            }
        }
        
        // Update dashboard stats
        updateDashboardStats();
        
    } catch (error) {
        console.log('📴 Using demo data (offline mode)');
        // Use demo data
        appState.gifts = [
            {
                id: 1,
                description: 'Traditional Thanka painting',
                value: 5000,
                date: '2023-10-15',
                giver: 'Local Artist',
                status: 'pending'
            },
            {
                id: 2,
                description: 'Book on Bhutanese Culture',
                value: 800,
                date: '2023-10-10',
                giver: 'Brother (Immediate Relative)',
                status: 'approved'
            }
        ];
        updateGiftsTable();
        updateDashboardStats();
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    const totalGifts = appState.gifts.length;
    const pendingGifts = appState.gifts.filter(g => g.status === 'pending').length;
    const approvedGifts = appState.gifts.filter(g => g.status === 'approved').length;
    const returnedGifts = appState.gifts.filter(g => g.status === 'returned').length;
    
    // Update stat cards if they exist
    const statCards = document.querySelectorAll('.stat-value');
    if (statCards.length >= 4) {
        statCards[0].textContent = totalGifts;
        statCards[1].textContent = pendingGifts;
        statCards[2].textContent = approvedGifts;
        statCards[3].textContent = returnedGifts;
    }
    
    // Update notification badge
    if (domElements.notificationBadge) {
        domElements.notificationBadge.textContent = pendingGifts > 0 ? pendingGifts : '';
    }
}

// Update gifts table
function updateGiftsTable() {
    if (!domElements.myGiftsTable) return;
    
    const tbody = domElements.myGiftsTable.querySelector('tbody');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Add gift rows
    appState.gifts.forEach(gift => {
        const row = document.createElement('tr');
        row.setAttribute('data-status', gift.status);
        
        // Format date
        const displayDate = gift.date || gift.submittedAt?.split('T')[0] || 'N/A';
        
        // Status badge
        let statusBadge = '';
        let statusClass = '';
        switch(gift.status) {
            case 'pending':
                statusBadge = 'Under Review';
                statusClass = 'status-pending';
                break;
            case 'approved':
                statusBadge = 'Approved';
                statusClass = 'status-approved';
                break;
            case 'returned':
                statusBadge = 'Returned';
                statusClass = 'status-returned';
                break;
            default:
                statusBadge = 'Unknown';
                statusClass = 'status-pending';
        }
        
        row.innerHTML = `
            <td>${displayDate}</td>
            <td>${gift.description}</td>
            <td>${gift.value ? gift.value.toLocaleString() : '0'}</td>
            <td>${gift.giver?.name || gift.giver || 'Unknown'}</td>
            <td><span class="status-badge ${statusClass}">${statusBadge}</span></td>
            <td><button class="btn btn-secondary view-gift-btn" data-id="${gift.id}" style="padding: 5px 10px; font-size: 0.85rem;">View</button></td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Re-attach event listeners to view buttons
    attachViewButtonListeners();
}

// Attach event listeners to view buttons
function attachViewButtonListeners() {
    const viewButtons = document.querySelectorAll('.view-gift-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', viewGiftDetails);
    });
}

// Initialize components
function initializeComponents() {
    // Initialize penalty calculator
    if (domElements.penaltyValueInput && domElements.breachNumberSelect) {
        calculateFine();
    }
    
    // Check for saved draft
    const savedDraft = localStorage.getItem('bgts_gift_draft');
    if (savedDraft && domElements.giftDeclarationForm) {
        try {
            const draft = JSON.parse(savedDraft);
            loadDraft(draft);
            console.log('📝 Loaded saved draft');
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    }
}

// Load draft data into form
function loadDraft(draft) {
    if (!domElements.giftDeclarationForm) return;
    
    if (draft.description) domElements.giftDescription.value = draft.description;
    if (draft.value) domElements.giftValue.value = draft.value;
    if (draft.type) domElements.giftType.value = draft.type;
    if (draft.receiptDate) domElements.receiptDateInput.value = draft.receiptDate;
    if (draft.giverName) domElements.giverName.value = draft.giverName;
    
    console.log('Draft loaded into form');
}

// Set up all event listeners
function setupEventListeners() {
    // Navigation
    domElements.navTabs.forEach(tab => {
        tab.addEventListener('click', handleNavigation);
    });
    
    // Action buttons navigation
    domElements.actionButtons.forEach(button => {
        button.addEventListener('click', handleActionButtonClick);
    });
    
    // Prohibited Source Checker
    if (domElements.prohibitedSourceBtn) {
        domElements.prohibitedSourceBtn.addEventListener('click', () => {
            domElements.prohibitedSourceModal.classList.add('active');
        });
    }
    
    // Check source button
    if (domElements.checkSourceBtn) {
        domElements.checkSourceBtn.addEventListener('click', checkSource);
    }
    
    // Review Gift buttons
    domElements.reviewGiftButtons.forEach(button => {
        button.addEventListener('click', () => {
            domElements.reviewGiftModal.classList.add('active');
        });
    });
    
    // Submit review
    if (domElements.submitReviewBtn) {
        domElements.submitReviewBtn.addEventListener('click', submitReview);
    }
    
    // Gift declaration form
    if (domElements.giftDeclarationForm) {
        domElements.giftDeclarationForm.addEventListener('submit', submitGiftDeclaration);
    }
    
    // Save draft
    if (domElements.saveDraftBtn) {
        domElements.saveDraftBtn.addEventListener('click', saveDraft);
    }
    
    // Penalty calculator
    if (domElements.penaltyValueInput) {
        domElements.penaltyValueInput.addEventListener('input', calculateFine);
    }
    if (domElements.breachNumberSelect) {
        domElements.breachNumberSelect.addEventListener('change', calculateFine);
    }
    
    // Filter buttons
    domElements.filterButtons.forEach(button => {
        button.addEventListener('click', handleFilterClick);
    });
    
    // View gift buttons
    domElements.viewGiftButtons.forEach(button => {
        button.addEventListener('click', viewGiftDetails);
    });
    
    // Relationship select change
    if (domElements.relationshipSelect) {
        domElements.relationshipSelect.addEventListener('change', handleRelationshipChange);
    }
    
    // Search input
    if (domElements.searchInput) {
        domElements.searchInput.addEventListener('input', handleSearch);
    }
    
    // Auto-save form on change
    if (domElements.giftDeclarationForm) {
        domElements.giftDeclarationForm.addEventListener('input', autoSaveDraft);
    }
    
    // Close modals
    domElements.modalCloseButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', handlePopState);
}

// Handle navigation between pages
function handleNavigation(e) {
    e.preventDefault();
    const tab = e.currentTarget;
    const pageId = tab.getAttribute('data-page');
    
    // Update URL without reload
    history.pushState({ page: pageId }, '', `#${pageId}`);
    
    // Update active tab
    domElements.navTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show selected page
    domElements.pages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// Handle browser back/forward
function handlePopState(e) {
    if (e.state && e.state.page) {
        const pageId = e.state.page;
        const tab = document.querySelector(`.nav-tab[data-page="${pageId}"]`);
        if (tab) {
            domElements.navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            domElements.pages.forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(pageId).classList.add('active');
        }
    }
}

// Handle action button clicks
function handleActionButtonClick(e) {
    e.preventDefault();
    const button = e.currentTarget;
    
    if (button.hasAttribute('data-page')) {
        const pageId = button.getAttribute('data-page');
        
        // Update active tab
        domElements.navTabs.forEach(t => {
            t.classList.remove('active');
            if (t.getAttribute('data-page') === pageId) {
                t.classList.add('active');
            }
        });
        
        // Show selected page
        domElements.pages.forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
        
        // Update URL
        history.pushState({ page: pageId }, '', `#${pageId}`);
    }
}

// Check prohibited source via API
async function checkSource() {
    const selectedValue = domElements.sourceCheckSelect.value;
    
    if (!selectedValue) {
        showAlert('Please select a relationship', 'warning');
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
            if (result.success) {
                displayCheckResult(result.data);
            } else {
                throw new Error(result.error || 'API error');
            }
        } else {
            throw new Error('Server error');
        }
    } catch (error) {
        console.error('API call failed, using fallback:', error);
        fallbackCheckSource(selectedValue);
    }
}

// Display check result
function displayCheckResult(result) {
    domElements.resultTitle.textContent = result.title;
    domElements.resultDesc.textContent = result.description;
    domElements.resultRule.textContent = `${result.rule}: ${result.details}`;
    
    // Set colors based on result
    if (result.isProhibited === true) {
        domElements.checkResult.style.backgroundColor = '#f8d7da';
        domElements.checkResult.style.color = '#721c24';
        domElements.checkResult.style.borderColor = '#f5c6cb';
    } else if (result.isProhibited === false) {
        domElements.checkResult.style.backgroundColor = '#d4edda';
        domElements.checkResult.style.color = '#155724';
        domElements.checkResult.style.borderColor = '#c3e6cb';
    } else {
        domElements.checkResult.style.backgroundColor = '#cce5ff';
        domElements.checkResult.style.color = '#004085';
        domElements.checkResult.style.borderColor = '#b8daff';
    }
    
    domElements.checkResult.style.display = 'block';
}

// Fallback check if API fails
function fallbackCheckSource(selectedValue) {
    const results = {
        'seeks-action': {
            title: 'PROHIBITED SOURCE',
            description: 'This giver is a prohibited source under Rule 8(a).',
            details: 'Who seeks official action or business from the public servant\'s agency.',
            isProhibited: true,
            rule: 'Rule 8(a)'
        },
        'does-business': {
            title: 'PROHIBITED SOURCE',
            description: 'This giver is a prohibited source under Rule 8(b).',
            details: 'Who does business or seeks to do business with the public servant\'s agency.',
            isProhibited: true,
            rule: 'Rule 8(b)'
        },
        'family': {
            title: 'ALLOWED (with conditions)',
            description: 'Gifts from immediate relatives are allowed.',
            details: 'When clearly motivated by the relationship rather than the official position.',
            isProhibited: false,
            rule: 'Rule 11(b)'
        }
    };
    
    const result = results[selectedValue] || {
        title: 'REVIEW REQUIRED',
        description: 'This relationship requires further review.',
        details: 'Please consult with your Gift Disclosure Administrator.',
        isProhibited: null,
        rule: 'General review required'
    };
    
    displayCheckResult(result);
}

// Submit review decision
async function submitReview() {
    const decision = document.getElementById('review-decision').value;
    
    if (!decision) {
        showAlert('Please select a decision', 'warning');
        return;
    }
    
    // In a real app, this would submit to API
    showSuccessMessage('Review decision submitted successfully!');
    closeAllModals();
    
    // Reset form
    document.getElementById('review-decision').value = '';
    document.getElementById('review-comments').value = '';
    domElements.checkResult.style.display = 'none';
}

// Submit gift declaration via API
async function submitGiftDeclaration(e) {
    e.preventDefault();
    
    // Basic validation
    const giftValue = domElements.giftValue.value;
    const relationship = domElements.relationshipSelect.value;
    const giftDescription = domElements.giftDescription.value;
    const giverName = domElements.giverName.value;
    
    if (!giftDescription || !giftValue || !relationship || !giverName) {
        showAlert('Please fill all required fields marked with *', 'error');
        return;
    }
    
    // Check if nominal value (for demo, assuming Nu. 10000 is nominal threshold)
    const valueNum = parseInt(giftValue);
    if (valueNum > 10000 && relationship !== 'immediate-relative') {
        if (!confirm(`This gift value (Nu. ${valueNum.toLocaleString()}) exceeds typical nominal value. Are you sure it's permissible under the Rules?`)) {
            return;
        }
    }
    
    // Prepare gift data
    const giftData = {
        description: giftDescription,
        value: parseFloat(giftValue),
        receiptDate: domElements.receiptDateInput.value,
        giftType: domElements.giftType.value,
        giverName: giverName,
        giverDesignation: domElements.giverDesignation.value,
        giverAgency: domElements.giverAgency.value,
        relationship: relationship,
        circumstances: domElements.circumstances.value,
        disposition: domElements.disposition.value,
        isProhibitedSource: domElements.prohibitedCheck.checked
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
            if (result.success) {
                showSuccessMessage(`Your gift declaration has been submitted successfully. Reference: ${result.reference}`);
                
                // Add to local state
                appState.gifts.push(result.data);
                updateGiftsTable();
                updateDashboardStats();
                
                // Clear form and localStorage
                domElements.giftDeclarationForm.reset();
                setDefaultReceiptDate();
                localStorage.removeItem('bgts_gift_draft');
            } else {
                throw new Error(result.error || 'Submission failed');
            }
        } else {
            throw new Error('Server error');
        }
    } catch (error) {
        console.error('API submission failed:', error);
        // Fallback to local success message
        const refNumber = 'BGTS-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        showSuccessMessage(`Your gift declaration has been submitted successfully. Reference: ${refNumber} (Offline Mode)`);
        
        // Add to local state
        const newGift = {
            id: Date.now(),
            ...giftData,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            reference: refNumber
        };
        appState.gifts.push(newGift);
        updateGiftsTable();
        updateDashboardStats();
        
        // Clear form and localStorage
        domElements.giftDeclarationForm.reset();
        setDefaultReceiptDate();
        localStorage.removeItem('bgts_gift_draft');
    }
}

// Auto-save draft
function autoSaveDraft() {
    const draft = {
        description: domElements.giftDescription.value,
        value: domElements.giftValue.value,
        type: domElements.giftType.value,
        receiptDate: domElements.receiptDateInput.value,
        giverName: domElements.giverName.value,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('bgts_gift_draft', JSON.stringify(draft));
}

// Save draft to localStorage
function saveDraft() {
    autoSaveDraft();
    showAlert('Draft saved successfully!', 'success');
}

// Calculate fine via API or locally
async function calculateFine() {
    const value = parseFloat(domElements.penaltyValueInput.value) || 0;
    const breachNum = parseInt(domElements.breachNumberSelect.value);
    
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
            if (result.success) {
                domElements.calculatedFine.textContent = result.data.formattedFine;
                return;
            }
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
    domElements.calculatedFine.textContent = `Nu. ${fine.toLocaleString()}`;
}

// Handle filter clicks
function handleFilterClick(e) {
    const button = e.currentTarget;
    const filterType = button.getAttribute('data-filter');
    
    // Update active filter button
    domElements.filterButtons.forEach(btn => {
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
    const giftId = parseInt(button.getAttribute('data-id'));
    const gift = appState.gifts.find(g => g.id === giftId);
    
    if (gift) {
        const modalContent = `
            <div class="gift-details">
                <h3>Gift Details</h3>
                <div class="detail-row">
                    <strong>Reference:</strong> ${gift.reference || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Description:</strong> ${gift.description}
                </div>
                <div class="detail-row">
                    <strong>Value:</strong> Nu. ${gift.value ? gift.value.toLocaleString() : '0'}
                </div>
                <div class="detail-row">
                    <strong>Giver:</strong> ${gift.giver?.name || gift.giver || 'Unknown'}
                </div>
                <div class="detail-row">
                    <strong>Relationship:</strong> ${gift.relationship || 'Not specified'}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> ${gift.status || 'Unknown'}
                </div>
                <div class="detail-row">
                    <strong>Submitted:</strong> ${gift.submittedAt ? new Date(gift.submittedAt).toLocaleString() : 'N/A'}
                </div>
                ${gift.circumstances ? `<div class="detail-row"><strong>Circumstances:</strong> ${gift.circumstances}</div>` : ''}
            </div>
        `;
        
        showModal('Gift Details', modalContent);
    } else {
        showAlert('Gift details not found', 'error');
    }
}

// Handle relationship change
function handleRelationshipChange() {
    const selectedValue = this.value;
    
    // Auto-check prohibited source based on relationship
    if (selectedValue === 'contractor' || selectedValue === 'business') {
        domElements.prohibitedCheck.checked = true;
    } else if (selectedValue === 'immediate-relative' || selectedValue === 'personal-friend') {
        domElements.prohibitedCheck.checked = false;
    }
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const table = document.querySelector('.table');
    
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Show success message
function showSuccessMessage(message) {
    document.getElementById('success-message').textContent = message;
    domElements.successModal.classList.add('active');
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        if (domElements.successModal.classList.contains('active')) {
            domElements.successModal.classList.remove('active');
        }
    }, 5000);
}

// Show alert message
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `custom-alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        ${type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
        ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
        ${type === 'warning' ? 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;' : ''}
        ${type === 'info' ? 'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;' : ''}
    `;
    
    const icon = type === 'error' ? '✕' : type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ';
    alert.innerHTML = `
        <span style="font-weight: bold; font-size: 1.2em;">${icon}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; font-size: 1.2em; cursor: pointer; opacity: 0.7;">×</button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(alert)) {
            alert.remove();
        }
    }, 5000);
}

// Show modal with custom content
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="background: white; border-radius: 10px; max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; color: #1a5f7a;">${title}</h3>
                <button class="modal-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                ${content}
            </div>
            <div class="modal-footer" style="padding: 20px; border-top: 1px solid #dee2e6; text-align: right;">
                <button class="btn btn-primary modal-close">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close handlers
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Make functions available globally for inline handlers
window.checkSource = checkSource;
window.closeAllModals = closeAllModals;
window.viewGiftDetails = viewGiftDetails;

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .modal.active .modal-content {
        animation: fadeIn 0.3s ease;
    }
    
    .page.active {
        animation: fadeIn 0.5s ease;
    }
`;
document.head.appendChild(style);