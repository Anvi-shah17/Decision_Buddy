// API Configuration - automatically detects environment
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5003' 
    : 'https://decision-buddy-backend.onrender.com';

// DOM Elements
const decisionInput = document.getElementById('decision-input');
const analyzeBtn = document.getElementById('analyze-btn');
const charCount = document.getElementById('char-count');
const resultsSection = document.getElementById('results-section');
const errorSection = document.getElementById('error-section');
const loadingSpinner = analyzeBtn.querySelector('.loading-spinner');
const btnText = analyzeBtn.querySelector('.btn-text');

// Results Elements
const prosList = document.getElementById('pros-list');
const consList = document.getElementById('cons-list');
const opportunityCostText = document.getElementById('opportunity-cost-text');
const timeEstimateText = document.getElementById('time-estimate-text');
const errorMessage = document.getElementById('error-message');

// Button Elements
const newAnalysisBtn = document.getElementById('new-analysis-btn');
const exportBtn = document.getElementById('export-btn');
const retryBtn = document.getElementById('retry-btn');

// Rating Elements
const stars = document.querySelectorAll('.star');
const feedbackText = document.getElementById('feedback-text');
const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
const feedbackStatus = document.getElementById('feedback-status');

// Global variables
let currentAnalysis = null;
let currentAnalysisId = null;
let selectedRating = 0;
let submittedAnalyses = new Set(); // Track submitted analysis IDs

// Example buttons
const exampleButtons = document.querySelectorAll('.example-btn');

// Multi-stage question flow variables
let userContext = {
    decision: '',
    decisionType: '',
    priorities: [],
    timeCommitment: '',
    stressLevel: '',
    budget: '',
    specificAnswers: {}
};

let currentStage = 1;
const maxStage = 3;

// Decision-specific question templates
const specificQuestions = {
    career: [
        {
            id: 'paid_status',
            question: 'Is this paid or unpaid?',
            options: [
                { value: 'paid', label: '💰 Paid position' },
                { value: 'unpaid', label: '🎓 Unpaid/Volunteer' },
                { value: 'uncertain', label: '❓ Not sure yet' }
            ]
        },
        {
            id: 'long_term_alignment',
            question: 'Does this align with what you want to do long-term?',
            options: [
                { value: 'yes', label: '✅ Yes, definitely' },
                { value: 'no', label: '❌ No, not really' },
                { value: 'unsure', label: '🤔 Unsure' }
            ]
        }
    ],
    study: [
        {
            id: 'term_time',
            question: 'Is this during term time?',
            options: [
                { value: 'yes', label: '📚 Yes, during term' },
                { value: 'no', label: '🏖️ No, during break' },
                { value: 'ongoing', label: '🔄 Ongoing commitment' }
            ]
        },
        {
            id: 'current_workload',
            question: 'Is your workload currently heavy?',
            options: [
                { value: 'light', label: '😌 Light workload' },
                { value: 'medium', label: '📖 Medium workload' },
                { value: 'heavy', label: '😰 Heavy workload' }
            ]
        }
    ],
    money: [
        {
            id: 'cost_type',
            question: 'Is this a one-time cost or recurring?',
            options: [
                { value: 'onetime', label: '💳 One-time cost' },
                { value: 'recurring', label: '💸 Recurring cost' },
                { value: 'mixed', label: '🔄 Both' }
            ]
        },
        {
            id: 'affects_essentials',
            question: 'Will this affect essentials (rent, food, transport)?',
            options: [
                { value: 'yes', label: '⚠️ Yes, might impact essentials' },
                { value: 'no', label: '✅ No, essentials are safe' },
                { value: 'unsure', label: '🤔 Not sure' }
            ]
        }
    ],
    health: [
        {
            id: 'long_term_health',
            question: 'Will this improve your health in the long run?',
            options: [
                { value: 'yes', label: '📈 Yes, definitely' },
                { value: 'no', label: '📉 No improvement expected' },
                { value: 'unsure', label: '🤔 Unsure' }
            ]
        },
        {
            id: 'wellbeing_risk',
            question: 'Is there any risk to your wellbeing?',
            options: [
                { value: 'low', label: '🟢 Low risk' },
                { value: 'medium', label: '🟡 Medium risk' },
                { value: 'high', label: '🔴 High risk' }
            ]
        }
    ],
    relationships: [
        {
            id: 'affects_others',
            question: 'Is this decision likely to affect someone else significantly?',
            options: [
                { value: 'yes', label: '👥 Yes, affects others' },
                { value: 'no', label: '👤 Just affects me' },
                { value: 'maybe', label: '🤷 Might affect others' }
            ]
        },
        {
            id: 'setting_boundary',
            question: 'Is this about setting a boundary?',
            options: [
                { value: 'yes', label: '🚧 Yes, setting boundaries' },
                { value: 'no', label: '🤝 No, about connection' },
                { value: 'unclear', label: '❓ Not clear' }
            ]
        }
    ],
    time: [
        {
            id: 'deadline_soon',
            question: 'Is there a deadline soon?',
            options: [
                { value: 'yes', label: '⏰ Yes, deadline approaching' },
                { value: 'no', label: '📅 No immediate deadline' },
                { value: 'flexible', label: '🔄 Flexible timing' }
            ]
        },
        {
            id: 'what_delayed',
            question: 'What will you delay if you say yes to this?',
            options: [
                { value: 'work', label: '💼 Work tasks' },
                { value: 'personal', label: '👤 Personal time' },
                { value: 'other_commitments', label: '📋 Other commitments' },
                { value: 'nothing', label: '✅ Nothing important' }
            ]
        }
    ],
    other: [
        {
            id: 'decision_urgency',
            question: 'How urgent is this decision?',
            options: [
                { value: 'urgent', label: '🚨 Very urgent' },
                { value: 'moderate', label: '⏰ Somewhat urgent' },
                { value: 'flexible', label: '😌 Can take time' }
            ]
        }
    ]
};

// Initialize the application
function init() {
    setupEventListeners();
    updateCharacterCount();
    checkInputValidity();
    addDelightfulInteractions();
    animateStats();
    
    // Initialize analyze button text
    const analyzeBtn = document.getElementById('analyze-btn');
    analyzeBtn.innerHTML = '<span class="btn-text">Continue to Questions →</span>';
    
    // Enhanced input feedback
    let lastFeedbackLength = 0;
    decisionInput.addEventListener('input', () => {
        const currentLength = decisionInput.value.length;
        if (currentLength > lastFeedbackLength + 50) {
            showContextualFeedback(currentLength);
            lastFeedbackLength = currentLength;
        }
    });
    
    // Initialize multi-stage flow
    initMultiStageFlow();
    
    // TEST: Force show results section for star rating testing
    if (window.location.search.includes('test=stars')) {
        setTimeout(() => {
            showResultsForTesting();
        }, 1000);
    }
}

// Force show results section for testing star ratings
function showResultsForTesting() {
    // Set up realistic analysis data
    currentAnalysisId = 'test_analysis_' + Date.now();
    selectedRating = 0;
    currentAnalysis = {
        decision: 'Test decision for star rating',
        pros: ['Test pro 1', 'Test pro 2'],
        cons: ['Test con 1'],
        opportunity_cost: 'Test opportunity cost',
        time: 'Test time'
    };
    
    console.log('🧪 Setting up test analysis data:');
    console.log('  - Analysis ID:', currentAnalysisId);
    console.log('  - Analysis:', currentAnalysis);
    
    // Show results section
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
    
    // Populate with test data
    if (prosList) {
        prosList.innerHTML = '<li>Test pro 1</li><li>Test pro 2</li>';
    }
    if (consList) {
        consList.innerHTML = '<li>Test con 1</li>';
    }
    if (opportunityCostText) {
        opportunityCostText.textContent = 'Test opportunity cost';
    }
    if (timeEstimateText) {
        timeEstimateText.textContent = 'Test time';
    }
    
    // Reset and setup star rating
    selectedRating = 0;
    setupStarRating();
    enableRatingSystem();
    
    // Ensure feedback button is ready
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
    if (submitFeedbackBtn) {
        submitFeedbackBtn.disabled = true; // Will be enabled when star is clicked
    }
    
    console.log('✅ Test results section shown. Try clicking stars now.');
    console.log('📝 Click a star and then the "Share Feedback" button to test feedback submission.');
}

// Event Listeners
function setupEventListeners() {
    // Input events
    decisionInput.addEventListener('input', handleInputChange);
    decisionInput.addEventListener('keypress', handleKeyPress);
    
    // Button events
    // Note: analyzeBtn handler is set up in initMultiStageFlow for better stage management
    newAnalysisBtn.addEventListener('click', handleNewAnalysis);
    exportBtn.addEventListener('click', handleExport);
    retryBtn.addEventListener('click', handleRetry);
    
    // Rating events - Query stars dynamically to ensure they exist
    setupStarRating();
    
    // Feedback submission
    if (submitFeedbackBtn) {
        submitFeedbackBtn.addEventListener('click', handleSubmitFeedback);
    }
    
    // Example button events
    if (exampleButtons && exampleButtons.length > 0) {
        exampleButtons.forEach(btn => {
            btn.addEventListener('click', handleExampleClick);
        });
    }
}

function setupStarRating() {
    // Re-query stars to make sure we get them - only target feedback stars
    const starElements = document.querySelectorAll('.feedback-star');
    
    if (starElements && starElements.length > 0) {
        starElements.forEach((star, index) => {
            // Remove existing listeners to prevent duplicates
            star.removeEventListener('click', handleStarClick);
            star.removeEventListener('mouseover', handleStarHover);
            star.removeEventListener('mouseout', handleStarOut);
            
            // Add fresh listeners
            star.addEventListener('click', handleStarClick);
            star.addEventListener('mouseover', handleStarHover);
            star.addEventListener('mouseout', handleStarOut);
            
            // Add keyboard accessibility
            star.setAttribute('tabindex', '0');
            star.setAttribute('role', 'button');
            star.setAttribute('aria-label', `Rate ${index + 1} out of 5 stars`);
            
            star.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStarClick(e);
                }
            });
        });
    }
}

// Handle input changes
function handleInputChange() {
    updateCharacterCount();
    checkInputValidity();
}

// Handle Enter key press (with Shift+Enter for new line)
function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!analyzeBtn.disabled) {
            handleAnalyze();
        }
    }
}

// Update character count display
function updateCharacterCount() {
    const currentLength = decisionInput.value.length;
    charCount.textContent = currentLength;
    
    // Change color based on character count
    if (currentLength > 750) {
        charCount.style.color = '#dc3545';
    } else if (currentLength > 600) {
        charCount.style.color = '#ffc107';
    } else {
        charCount.style.color = '#6c757d';
    }
}

// Check if input is valid and enable/disable button
function checkInputValidity() {
    const isValid = decisionInput.value.trim().length > 15;
    
    // In multi-stage flow, button state is handled by stage-specific functions
    if (currentStage === 3) {
        // Stage 3 - check if all questions are answered
        updateStage3ButtonState();
        return;
    } else if (currentStage === 2) {
        // Stage 2 - handled by updateStage2ButtonState
        return;
    } else if (currentStage === 1) {
        // Stage 1 - check if decision text is long enough
        const nextBtn = document.getElementById('next-to-stage-2');
        if (nextBtn) {
            nextBtn.disabled = !isValid;
        }
        // Update button text for stage 1
        if (isValid) {
            nextBtn.innerHTML = '<span class="btn-text">Continue to Questions →</span>';
        } else {
            nextBtn.innerHTML = '<span class="btn-text">Enter your decision first</span>';
        }
        return;
    }
    
    // Fallback for non-multi-stage flow (if ever needed)
    analyzeBtn.disabled = !isValid;
    
    // Add visual feedback for input quality
    const wordCount = decisionInput.value.trim().split(/\s+/).length;
    const inputContainer = document.querySelector('.input-container');
    
    if (wordCount > 20) {
        inputContainer.classList.add('detailed-input');
    } else {
        inputContainer.classList.remove('detailed-input');
    }
    
    if (isValid) {
        analyzeBtn.style.opacity = '1';
        analyzeBtn.style.cursor = 'pointer';
    } else {
        analyzeBtn.style.opacity = '0.6';
        analyzeBtn.style.cursor = 'not-allowed';
    }
}

// Handle analyze button click
async function handleAnalyze() {
    const decisionText = decisionInput.value.trim();
    
    if (!decisionText || decisionText.length < 10) {
        showError('Please enter a decision that\'s at least 10 characters long.');
        return;
    }
    
    setLoadingState(true);
    hideAllSections();
    
    try {
        const analysis = await analyzeDecision(decisionText);
        currentAnalysis = { decision: decisionText, ...analysis.analysis };
        currentAnalysisId = analysis.analysis_id;
        displayResults(analysis.analysis);
        showSection('results');
        
        // Disable the analyze button and input after successful analysis
        disableAnalysisInput();
        
        // Check if this analysis was already rated
        checkIfAlreadyRated();
    } catch (error) {
        console.error('Analysis failed:', error);
        showError(error.message || 'Failed to analyze your decision. Please try again.');
        showSection('error');
    } finally {
        setLoadingState(false);
    }
}

// Make API request to analyze decision
async function analyzeDecision(decisionText) {
    // Send both decision text and user context for personalized analysis
    const requestBody = {
        decision: decisionText,
        user_context: userContext
    };
    
    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
    }
    
    return data;
}

// Display analysis results
function displayResults(analysis) {
    currentAnalysis = analysis;
    // currentAnalysisId is already set by handleAnalyze from the backend response
    
    // Add conversational introductions to each section
    const prosIntro = getProsIntroMessage(analysis.pros.length);
    const consIntro = getConsIntroMessage(analysis.cons.length);
    
    // Update section subtitles with conversational tone
    document.querySelector('.pros-header .section-subtitle').textContent = prosIntro;
    document.querySelector('.cons-header .section-subtitle').textContent = consIntro;
    
    // Clear previous results
    prosList.innerHTML = '';
    consList.innerHTML = '';
    
    // Display pros with enhanced presentation
    analysis.pros.forEach((pro, index) => {
        const li = document.createElement('li');
        li.textContent = pro;
        li.style.animationDelay = `${index * 0.1}s`;
        li.classList.add('fadeInLeft');
        prosList.appendChild(li);
    });
    
    // Display cons with enhanced presentation
    analysis.cons.forEach((con, index) => {
        const li = document.createElement('li');
        li.textContent = con;
        li.style.animationDelay = `${index * 0.1}s`;
        li.classList.add('fadeInRight');
        consList.appendChild(li);
    });
    
    // Display additional info with conversational tone
    opportunityCostText.textContent = analysis.opportunity_cost;
    timeEstimateText.textContent = analysis.time;
    
    // Reset feedback system for new analysis
    resetFeedbackSystem();
    
    // Show results with staggered animation
    errorSection.style.display = 'none';
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Generate a unique analysis ID
function generateAnalysisId() {
    return 'analysis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getProsIntroMessage(count) {
    if (count >= 4) return "I found quite a few positive aspects here";
    if (count >= 2) return "Here are the main advantages I see";
    return "At least there's this going for it";
}

function getConsIntroMessage(count) {
    if (count >= 4) return "There are several important considerations";
    if (count >= 2) return "A few things to keep in mind";
    return "Worth considering this aspect";
}

// Set loading state
function setLoadingState(isLoading) {
    if (isLoading) {
        btnText.style.display = 'none';
        loadingSpinner.style.display = 'block';
        analyzeBtn.disabled = true;
        analyzeBtn.style.cursor = 'not-allowed';
        decisionInput.disabled = true;
    } else {
        btnText.style.display = 'block';
        loadingSpinner.style.display = 'none';
        
        // Don't automatically re-enable after loading - let other functions handle this
        // analyzeBtn.disabled = false;
        // analyzeBtn.style.cursor = 'pointer';
        // decisionInput.disabled = false;
        // checkInputValidity(); // Recheck input validity
    }
}

// Show specific section
function showSection(sectionType) {
    hideAllSections();
    
    const sectionMap = {
        'results': resultsSection,
        'error': errorSection
    };
    
    const section = sectionMap[sectionType];
    if (section) {
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Hide all result sections
function hideAllSections() {
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
}

// Handle new analysis button
function handleNewAnalysis() {
    decisionInput.value = '';
    decisionInput.focus();
    hideAllSections();
    updateCharacterCount();
    checkInputValidity();
    currentAnalysis = null;
    currentAnalysisId = null;
    selectedRating = 0;
    enableRatingSystem(); // Reset rating system for new analysis
    enableAnalysisInput(); // Re-enable the input and analyze button
    
    // Reset multi-stage flow
    currentStage = 1;
    userContext = {
        decision: '',
        decisionType: '',
        priorities: [],
        timeCommitment: '',
        stressLevel: '',
        budget: '',
        specificAnswers: {}
    };
    
    // Reset to stage 1
    transitionToStage(1);
    
    // Reset button selections in all stages
    document.querySelectorAll('.option-btn.selected').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Smooth scroll to input
    decisionInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Handle export button
function handleExport() {
    if (!currentAnalysis) {
        alert('No analysis to export');
        return;
    }
    
    try {
        const exportData = {
            analysis_id: currentAnalysisId,
            decision: currentAnalysis.decision,
            timestamp: new Date().toISOString(),
            analysis: {
                pros: currentAnalysis.pros,
                cons: currentAnalysis.cons,
                opportunity_cost: currentAnalysis.opportunity_cost,
                time: currentAnalysis.time
            },
            rating_submitted: submittedAnalyses.has(currentAnalysisId)
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `decision-analysis-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success feedback
        const originalText = exportBtn.textContent;
        exportBtn.textContent = 'Exported';
        exportBtn.style.background = '#059669';
        
        setTimeout(() => {
            exportBtn.textContent = originalText;
            exportBtn.style.background = '';
        }, 2000);
        
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export analysis');
    }
}

// Handle retry button
function handleRetry() {
    if (decisionInput.value.trim()) {
        // Re-enable input first
        enableAnalysisInput();
        handleAnalyze();
    } else {
        hideAllSections();
        enableAnalysisInput();
        decisionInput.focus();
    }
}

// Handle example button clicks
function handleExampleClick(e) {
    const exampleText = e.target.dataset.example;
    decisionInput.value = exampleText;
    
    // Add a delightful typing effect
    decisionInput.value = '';
    typeText(exampleText, 0);
    
    updateCharacterCount();
    checkInputValidity();
    
    // Scroll to textarea
    decisionInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Focus on the textarea after typing is done
    setTimeout(() => {
        decisionInput.focus();
        decisionInput.setSelectionRange(exampleText.length, exampleText.length);
    }, exampleText.length * 30 + 500);
}

// Delightful typing effect for examples
function typeText(text, index) {
    if (index < text.length) {
        decisionInput.value += text.charAt(index);
        updateCharacterCount();
        checkInputValidity();
        setTimeout(() => typeText(text, index + 1), 30);
    }
}

// Add delightful micro-interactions
function addDelightfulInteractions() {
    // Add welcome message animation
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        setTimeout(() => {
            welcomeMessage.style.opacity = '0';
            welcomeMessage.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                welcomeMessage.style.transition = 'all 0.5s ease-in-out';
                welcomeMessage.style.opacity = '1';
                welcomeMessage.style.transform = 'translateY(0)';
            }, 100);
        }, 500);
    }
    
    // Add floating animation to trust indicators
    const trustItems = document.querySelectorAll('.trust-item');
    trustItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.2}s`;
        item.classList.add('float-in');
    });
    
    // Add encouraging messages when user starts typing
    let typingTimer;
    let hasShownEncouragement = false;
    
    decisionInput.addEventListener('input', () => {
        clearTimeout(typingTimer);
        
        if (!hasShownEncouragement && decisionInput.value.length > 20) {
            showEncouragingMessage();
            hasShownEncouragement = true;
        }
        
        // Show real-time feedback
        typingTimer = setTimeout(() => {
            if (decisionInput.value.length > 50 && decisionInput.value.length < 100) {
                showTip("Great start! The more context you provide, the better insights I can offer.");
            }
        }, 2000);
    });
}

// Show encouraging messages
function showEncouragingMessage() {
    const encouragementDiv = document.createElement('div');
    encouragementDiv.className = 'encouragement-message';
    encouragementDiv.innerHTML = `
        <div class="encouragement-content">
            <span class="encouragement-icon">💭</span>
            <p>I can see you're really thinking this through. Take your time—good decisions deserve careful consideration.</p>
        </div>
    `;
    
    const inputContainer = document.querySelector('.input-container');
    inputContainer.appendChild(encouragementDiv);
    
    setTimeout(() => {
        encouragementDiv.style.opacity = '1';
        encouragementDiv.style.transform = 'translateY(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (encouragementDiv.parentNode) {
            encouragementDiv.style.opacity = '0';
            encouragementDiv.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                inputContainer.removeChild(encouragementDiv);
            }, 300);
        }
    }, 5000);
}

// Show contextual tips
function showTip(message) {
    const tipDiv = document.createElement('div');
    tipDiv.className = 'contextual-tip';
    tipDiv.innerHTML = `
        <div class="tip-content">
            <div class="tip-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            </div>
            <p>${message}</p>
        </div>
    `;
    
    const inputContainer = document.querySelector('.input-container');
    inputContainer.appendChild(tipDiv);
    
    setTimeout(() => {
        tipDiv.style.opacity = '1';
        tipDiv.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        if (tipDiv.parentNode) {
            tipDiv.style.opacity = '0';
            tipDiv.style.transform = 'translateX(10px)';
            setTimeout(() => {
                inputContainer.removeChild(tipDiv);
            }, 300);
        }
    }, 4000);
}

// Show quick confirmation for actions
function showQuickConfirmation(message) {
    console.log('✅', message);
    
    // Create a small tooltip-like confirmation
    const tooltip = document.createElement('div');
    tooltip.className = 'quick-confirmation';
    tooltip.textContent = message;
    tooltip.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #059669;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(tooltip);
    
    // Show the tooltip
    setTimeout(() => {
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 2 seconds
    setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (tooltip.parentNode) {
                document.body.removeChild(tooltip);
            }
        }, 300);
    }, 2000);
}

function showQuickTip(message, type = 'info') {
    console.log(`ℹ️ ${message}`);
    
    const colors = {
        info: '#3B82F6',
        warning: '#F59E0B',
        error: '#EF4444',
        success: '#059669'
    };
    
    const tooltip = document.createElement('div');
    tooltip.className = 'quick-tip';
    tooltip.textContent = message;
    tooltip.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (tooltip.parentNode) {
                document.body.removeChild(tooltip);
            }
        }, 300);
    }, 3000);
}

// Rating System Functions
function handleStarClick(e) {
    console.log('Star click detected!', e.target);
    
    // Check if already submitted
    if (submittedAnalyses.has(currentAnalysisId)) {
        showFeedbackStatus('You have already rated this analysis.', 'error');
        return;
    }
    
    const target = e.target.closest('.feedback-star');
    if (!target) {
        console.log('No star target found');
        return;
    }
    
    const rating = parseInt(target.dataset.rating);
    console.log('Rating:', rating, 'Target:', target);
    
    if (rating && rating >= 1 && rating <= 5) {
        selectedRating = rating;
        console.log('Selected rating set to:', selectedRating);
        
        // Immediately update display
        updateStarDisplay(selectedRating);
        
        // Enable submit button
        if (submitFeedbackBtn) {
            submitFeedbackBtn.disabled = false;
            console.log('Submit button enabled');
        }
        
        // Clear status
        if (feedbackStatus) {
            feedbackStatus.textContent = '';
        }
        
        // Add visual confirmation with animation
        target.style.transform = 'scale(1.2)';
        setTimeout(() => {
            target.style.transform = '';
            updateStarDisplay(selectedRating);
        }, 200);
        
        showQuickConfirmation(`You rated this ${rating} star${rating > 1 ? 's' : ''}!`);
    } else {
        console.log('Invalid rating:', rating);
    }
}

function handleStarHover(e) {
    // Only show hover effect if no rating is selected yet
    if (selectedRating > 0) {
        return;
    }
    
    const target = e.target.closest('.feedback-star');
    if (!target) return;
    
    const hoverRating = parseInt(target.dataset.rating);
    
    // Show preview of what rating would be selected
    const starElements = document.querySelectorAll('.feedback-star');
    starElements.forEach((star, index) => {
        star.classList.remove('hover-preview');
        
        if (index < hoverRating) {
            star.classList.add('hover-preview');
        }
    });
}

function handleStarOut(e) {
    // If a rating is selected, restore the selected state
    if (selectedRating > 0) {
        updateStarDisplay(selectedRating);
        return;
    }
    
    // Clear hover preview effects
    const starElements = document.querySelectorAll('.feedback-star');
    starElements.forEach(star => {
        star.classList.remove('hover-preview');
    });
}

function updateStarDisplay(rating) {
    const starElements = document.querySelectorAll('.feedback-star');
    
    starElements.forEach((star, index) => {
        star.classList.remove('active', 'hover-preview');
        
        if (index < rating) {
            star.classList.add('active');
        }
    });
}

async function handleSubmitFeedback() {
    console.log('=== FEEDBACK SUBMISSION DEBUG ===');
    console.log('Selected rating:', selectedRating);
    console.log('Current analysis ID:', currentAnalysisId);
    console.log('Current analysis:', currentAnalysis);
    
    // Check if we're in test mode (when testing star ratings)
    const isTestMode = window.location.search.includes('test=stars');
    
    if (isTestMode) {
        console.log('🧪 Test mode detected - using test data if needed');
        // Set up test data if missing
        if (!currentAnalysisId) {
            currentAnalysisId = 'test_analysis_' + Date.now();
        }
        if (!currentAnalysis) {
            currentAnalysis = {
                decision: 'Test decision for star rating',
                pros: ['Test pro 1', 'Test pro 2'],
                cons: ['Test con 1'],
                opportunity_cost: 'Test opportunity cost',
                time: 'Test time'
            };
        }
    }
    
    // Validate required data
    if (!selectedRating) {
        console.log('Missing rating');
        showFeedbackStatus('Please select a rating first—I\'d love to know how I did!', 'error');
        return;
    }
    
    if (!currentAnalysisId || !currentAnalysis) {
        console.log('Missing analysis data');
        if (isTestMode) {
            // In test mode, create fake data
            currentAnalysisId = 'test_analysis_' + Date.now();
            currentAnalysis = {
                decision: 'Test decision for feedback',
                pros: ['Test advantage'],
                cons: ['Test consideration'],
                opportunity_cost: 'Test cost',
                time: 'Test time'
            };
            console.log('✅ Created test analysis data for feedback testing');
        } else {
            showFeedbackStatus('Please complete an analysis first before rating!', 'error');
            return;
        }
    }
    
    // Double-check if already submitted
    if (submittedAnalyses.has(currentAnalysisId)) {
        console.log('Analysis already submitted');
        showFeedbackStatus('Thanks again for your feedback—it really helps me learn!', 'error');
        return;
    }
    
    const feedback = feedbackText ? feedbackText.value.trim() : '';
    console.log('Feedback text:', feedback);
    
    // Store original button state
    const originalDisabled = submitFeedbackBtn.disabled;
    const originalHTML = submitFeedbackBtn.innerHTML;
    
    // Set loading state
    submitFeedbackBtn.disabled = true;
    submitFeedbackBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        Sharing your thoughts...
    `;
    
    const requestBody = {
        analysis_id: currentAnalysisId,
        decision: currentAnalysis.decision || userContext.decision || decisionInput.value.trim(),
        analysis: {
            pros: currentAnalysis.pros,
            cons: currentAnalysis.cons,
            opportunity_cost: currentAnalysis.opportunity_cost,
            time: currentAnalysis.time
        },
        rating: selectedRating,
        feedback_text: feedback
    };
    
    console.log('Request body being sent:', JSON.stringify(requestBody, null, 2));
    console.log('API URL:', `${API_BASE_URL}/feedback`);
    console.log('DEBUG: Decision sources:');
    console.log('  - currentAnalysis.decision:', currentAnalysis.decision);
    console.log('  - userContext.decision:', userContext.decision);
    console.log('  - decisionInput.value:', decisionInput.value.trim());
    console.log('  - Final decision used:', requestBody.decision);
    
    try {
        // First test API connectivity
        console.log('Testing API connectivity...');
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        if (!healthResponse.ok) {
            throw new Error('API server is not responding');
        }
        
        console.log('API is healthy, sending feedback request...');
        
        const response = await fetch(`${API_BASE_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('Error response text:', errorText);
            console.log('Response status code:', response.status);
            console.log('Response status text:', response.statusText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            console.log('Feedback submitted successfully!');
            
            // Mark this analysis as submitted
            submittedAnalyses.add(currentAnalysisId);
            
            // Show personalized thank you message based on rating
            let thankYouMessage;
            if (selectedRating >= 4) {
                thankYouMessage = 'Wonderful! Your positive feedback means the world to me. I\'m so glad I could help with your decision.';
            } else if (selectedRating === 3) {
                thankYouMessage = 'Thank you for the honest feedback! I\'ll keep working to provide even more helpful insights.';
            } else {
                thankYouMessage = 'I appreciate your honest feedback. This helps me understand how to better support decision-making in the future.';
            }
            
            showFeedbackStatus(thankYouMessage, 'success');
            submitFeedbackBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
                Feedback Received
            `;
            
            // Disable the rating system for this analysis
            disableRatingSystem();
            
            // Add a little celebration animation
            addCelebrationAnimation();
            
        } else {
            console.log('Server returned unsuccessful response:', data);
            throw new Error(data.error || 'Failed to submit feedback');
        }
        
    } catch (error) {
        console.error('Feedback submission failed:', error);
        
        // Provide specific error messages based on the error type
        let errorMessage = 'Sorry, there was an issue submitting your feedback. Please try again.';
        
        if (error.message.includes('fetch')) {
            errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('API server is not responding')) {
            errorMessage = 'The feedback service is temporarily unavailable. Please try again in a moment.';
        } else if (error.message.includes('Server error')) {
            errorMessage = 'There was a server error. Please try again.';
        }
        
        showFeedbackStatus(errorMessage, 'error');
        
        // Restore original button state
        submitFeedbackBtn.disabled = originalDisabled;
        submitFeedbackBtn.innerHTML = originalHTML;
    }
}

function showFeedbackStatus(message, type) {
    feedbackStatus.textContent = message;
    feedbackStatus.className = `feedback-status ${type}`;
    
    // Add some personality based on the type
    if (type === 'success') {
        feedbackStatus.style.animation = 'none';
        setTimeout(() => {
            feedbackStatus.style.animation = 'fadeInScale 0.5s ease-out';
        }, 10);
    }
}

function resetFeedbackForm() {
    selectedRating = 0;
    updateStarDisplay(0);
    
    if (feedbackText) {
        feedbackText.value = '';
    }
    
    if (submitFeedbackBtn) {
        submitFeedbackBtn.disabled = true;
        submitFeedbackBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            Share Feedback
        `;
    }
    
    if (feedbackStatus) {
        feedbackStatus.textContent = '';
        feedbackStatus.className = 'feedback-status';
    }
}

function resetFeedbackSystem() {
    console.log('Resetting feedback system');
    
    resetFeedbackForm();
    enableRatingSystem();
    
    feedbackStatus.textContent = '';
    feedbackStatus.className = 'feedback-status';
    
    setupStarRating();
    setTimeout(() => {
        setupStarRating();
        console.log('Delayed star rating setup complete');
    }, 100);
}

function checkIfAlreadyRated() {
    if (submittedAnalyses.has(currentAnalysisId)) {
        disableRatingSystem();
        showFeedbackStatus('You have already rated this analysis.', 'success');
        submitFeedbackBtn.textContent = 'Rating Submitted';
    } else {
        enableRatingSystem();
    }
}

function disableRatingSystem() {
    const starElements = document.querySelectorAll('.feedback-star');
    
    starElements.forEach(star => {
        star.style.pointerEvents = 'none';
        star.style.opacity = '0.6';
        star.classList.add('disabled');
    });
    
    if (feedbackText) {
        feedbackText.disabled = true;
    }
    
    if (submitFeedbackBtn) {
        submitFeedbackBtn.disabled = true;
    }
    
    const ratingContainer = document.querySelector('.rating-container');
    if (ratingContainer) {
        ratingContainer.style.opacity = '0.6';
    }
}

function enableRatingSystem() {
    const starElements = document.querySelectorAll('.feedback-star');
    
    starElements.forEach(star => {
        star.style.pointerEvents = 'auto';
        star.style.opacity = '1';
        star.classList.remove('disabled');
    });
    
    if (feedbackText) {
        feedbackText.disabled = false;
    }
    
    const ratingContainer = document.querySelector('.rating-container');
    if (ratingContainer) {
        ratingContainer.style.opacity = '1';
    }
    
    resetFeedbackForm();
}

function disableAnalysisInput() {
    decisionInput.disabled = true;
    decisionInput.style.backgroundColor = '#f8f9fa';
    decisionInput.style.color = '#6c757d';
    decisionInput.style.cursor = 'not-allowed';
    
    analyzeBtn.disabled = true;
    analyzeBtn.style.opacity = '0.6';
    analyzeBtn.style.cursor = 'not-allowed';
    btnText.textContent = 'Analysis Complete';
    
    if (!document.getElementById('analysis-complete-message')) {
        const message = document.createElement('div');
        message.id = 'analysis-complete-message';
        message.className = 'analysis-complete-message';
        message.innerHTML = 'Analysis complete! Use "New Analysis" below to analyze another decision.';
        
        // Check if analyzeBtn has a parent before trying to insert
        if (analyzeBtn && analyzeBtn.parentNode) {
            analyzeBtn.parentNode.insertBefore(message, analyzeBtn.nextSibling);
        } else {
            console.warn('Cannot insert analysis complete message - analyze button has no parent');
            // Try to find a suitable container
            const container = document.querySelector('.input-container') || document.querySelector('.question-stage.active');
            if (container) {
                container.appendChild(message);
            }
        }
    }
}

function enableAnalysisInput() {
    decisionInput.disabled = false;
    decisionInput.style.backgroundColor = '';
    decisionInput.style.color = '';
    decisionInput.style.cursor = '';
    
    btnText.textContent = 'Analyze Decision';
    analyzeBtn.style.opacity = '';
    analyzeBtn.style.cursor = '';
    
    const message = document.getElementById('analysis-complete-message');
    if (message) {
        message.remove();
    }
    
    checkInputValidity();
}

// Multi-stage question flow functions
function initMultiStageFlow() {
    // Wait a bit to ensure DOM is fully rendered
    setTimeout(() => {
        const nextToStage2Btn = document.getElementById('next-to-stage-2');
        const nextToStage3Btn = document.getElementById('next-to-stage-3');
        const analyzeBtn = document.getElementById('analyze-btn');
        
        console.log('🔧 Initializing multi-stage flow...');
        console.log('Buttons found:', {
            nextToStage2: !!nextToStage2Btn,
            nextToStage3: !!nextToStage3Btn,
            analyze: !!analyzeBtn
        });
        
        // Stage 1 to 2 transition
        if (nextToStage2Btn) {
            nextToStage2Btn.addEventListener('click', () => {
                if (decisionInput.value.trim().length > 15) {
                    userContext.decision = decisionInput.value.trim();
                    transitionToStage(2);
                }
            });
        }
        
        // Stage 2 to 3 transition
        if (nextToStage3Btn) {
            nextToStage3Btn.addEventListener('click', () => {
                if (validateStage2()) {
                    generateSpecificQuestions();
                    transitionToStage(3);
                }
            });
        }
        
        // Final analyze button in stage 3
        setupAnalyzeButton();
        setupStage2Handlers();
    }, 100);
}

// Separate function to set up the analyze button
function setupAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyze-btn');
    
    if (!analyzeBtn) {
        console.warn('⚠️ Analyze button not found, will try again later');
        return false;
    }
    
    console.log('✅ Setting up analyze button event listener');
    
    // Try to replace the button if it has a parent, otherwise just add event listener
    if (analyzeBtn.parentNode) {
        try {
            // Remove any existing event listeners by replacing the button
            const newAnalyzeBtn = analyzeBtn.cloneNode(true);
            analyzeBtn.parentNode.replaceChild(newAnalyzeBtn, analyzeBtn);
            
            // Update the reference to point to the new button
            const updatedAnalyzeBtn = document.getElementById('analyze-btn');
            
            if (updatedAnalyzeBtn) {
                setupAnalyzeButtonHandler(updatedAnalyzeBtn);
                return true;
            }
        } catch (error) {
            console.warn('Failed to replace analyze button, using direct approach:', error);
        }
    }
    
    // Fallback: just add event listener directly
    setupAnalyzeButtonHandler(analyzeBtn);
    return true;
}

// Set up the actual click handler for the analyze button
function setupAnalyzeButtonHandler(button) {
    if (!button) return;
    
    // Add a data attribute to track that handler is attached
    button.setAttribute('data-handler-attached', 'true');
    
    const clickHandler = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🎯 Analyze button clicked in multi-stage flow!');
        console.log('Button disabled state:', button.disabled);
        console.log('Current userContext:', userContext);
        
        if (button.disabled) {
            console.log('❌ Analyze button is disabled, ignoring click');
            return;
        }
        
        // Prepare decision text from multi-stage context
        const decisionText = userContext.decision || decisionInput.value.trim();
        
        console.log('Decision text for analysis:', decisionText);
        
        if (!decisionText || decisionText.length < 10) {
            showError('Please enter a decision that\'s at least 10 characters long.');
            return;
        }
        
        console.log('🚀 Calling handleAnalyze...');
        
        // Call the main analyze function
        await handleAnalyze();
    };
    
    button.addEventListener('click', clickHandler);
    
    // Store reference to handler for debugging
    window._analyzeButtonHandler = clickHandler;
    window._analyzeButton = button;
    
    console.log('✅ Event handler attached successfully to analyze button');
}

function transitionToStage(stageNumber) {
    console.log(`Transitioning to stage ${stageNumber}`);
    
    // Update step indicators
    for (let i = 1; i <= maxStage; i++) {
        const step = document.getElementById(`step-${i}`);
        if (step) {
            if (i < stageNumber) {
                step.classList.remove('active');
                step.classList.add('completed');
            } else if (i === stageNumber) {
                step.classList.remove('completed');
                step.classList.add('active');
            } else {
                step.classList.remove('active', 'completed');
            }
        }
    }
    
    // Hide current stage
    const currentStageEl = document.getElementById(`stage-${currentStage}`);
    if (currentStageEl) {
        currentStageEl.classList.add('stage-exit');
    }
    
    setTimeout(() => {
        if (currentStageEl) {
            currentStageEl.classList.remove('active', 'stage-exit');
        }
        
        // Show new stage
        const newStageEl = document.getElementById(`stage-${stageNumber}`);
        if (newStageEl) {
            newStageEl.classList.add('active', 'stage-enter');
            
            setTimeout(() => {
                newStageEl.classList.remove('stage-enter');
            }, 500);
        }
        
        currentStage = stageNumber;
        
        if (stageNumber === 2) {
            setTimeout(() => setupStage2Handlers(), 100);
        } else if (stageNumber === 3) {
            // When transitioning to stage 3, ensure analyze button handler is set up
            setTimeout(() => setupAnalyzeButton(), 200);
        }
        
        document.querySelector('.input-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 300);
}

function setupStage2Handlers() {
    setupSingleSelect('decision-type-buttons', (value) => {
        userContext.decisionType = value;
        
        const budgetQuestion = document.getElementById('budget-question');
        if (value === 'money') {
            budgetQuestion.style.display = 'block';
        } else {
            budgetQuestion.style.display = 'none';
            userContext.budget = '';
        }
        
        updateStage2ButtonState();
    });
    
    setupMultiSelect('priorities-buttons', (values) => {
        userContext.priorities = values;
        updateStage2ButtonState();
    });
    
    setupSingleSelect('time-commitment-buttons', (value) => {
        userContext.timeCommitment = value;
        updateStage2ButtonState();
    });
    
    setupSingleSelect('stress-level-buttons', (value) => {
        userContext.stressLevel = value;
        updateStage2ButtonState();
    });
    
    setupSingleSelect('budget-buttons', (value) => {
        userContext.budget = value;
        updateStage2ButtonState();
    });
}

function setupSingleSelect(containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container ${containerId} not found`);
        return;
    }
    
    const buttons = container.querySelectorAll('.option-btn');
    console.log(`Setting up ${buttons.length} buttons in ${containerId}`);
    
    buttons.forEach(btn => {
        // Remove existing listeners
        btn.removeEventListener('click', btn._clickHandler);
        
        // Create new handler
        btn._clickHandler = () => {
            console.log(`Button clicked: ${btn.dataset.value} in ${containerId}`);
            buttons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            callback(btn.dataset.value);
        };
        
        btn.addEventListener('click', btn._clickHandler);
    });
}

function setupMultiSelect(containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container ${containerId} not found`);
        return;
    }
    
    const buttons = container.querySelectorAll('.option-btn');
    let selectedValues = [];
    
    buttons.forEach(b => b.classList.add('multi-select'));
    
    buttons.forEach(btn => {
        // Remove existing listeners
        btn.removeEventListener('click', btn._clickHandler);
        
        // Create new handler
        btn._clickHandler = () => {
            const value = btn.dataset.value;
            
            if (btn.classList.contains('selected')) {
                btn.classList.remove('selected');
                selectedValues = selectedValues.filter(v => v !== value);
            } else {
                if (selectedValues.length < 2) {
                    btn.classList.add('selected');
                    selectedValues.push(value);
                } else {
                    showQuickTip('You can select up to 2 priorities', 'warning');
                    return;
                }
            }
            
            callback(selectedValues);
        };
        
        btn.addEventListener('click', btn._clickHandler);
    });
}

function validateStage2() {
    const hasDecisionType = userContext.decisionType !== '';
    const hasPriorities = userContext.priorities.length > 0;
    const hasTimeCommitment = userContext.timeCommitment !== '';
    const hasStressLevel = userContext.stressLevel !== '';
    const budgetOk = userContext.decisionType !== 'money' || userContext.budget !== '';
    
    return hasDecisionType && hasPriorities && hasTimeCommitment && hasStressLevel && budgetOk;
}

function updateStage2ButtonState() {
    const nextBtn = document.getElementById('next-to-stage-3');
    const isValid = validateStage2();
    nextBtn.disabled = !isValid;
    
    if (isValid) {
        nextBtn.innerHTML = '<span class="btn-text">Continue to Final Questions →</span>';
    } else {
        nextBtn.innerHTML = '<span class="btn-text">Complete all fields above</span>';
    }
}

function generateSpecificQuestions() {
    console.log('🔧 Generating specific questions for decision type:', userContext.decisionType);
    const container = document.getElementById('specific-questions');
    const questions = specificQuestions[userContext.decisionType] || specificQuestions.other;
    
    console.log('Questions to generate:', questions);
    
    container.innerHTML = '';
    
    questions.forEach(question => {
        console.log('Creating question:', question.id);
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-group specific-question';
        
        questionDiv.innerHTML = `
            <label class="question-label">${question.question}</label>
            <div class="button-grid" id="${question.id}-buttons">
                ${question.options.map(option => `
                    <button class="option-btn" data-value="${option.value}" data-question="${question.id}">
                        ${option.label}
                    </button>
                `).join('')}
            </div>
        `;
        
        container.appendChild(questionDiv);
        
        setupSpecificQuestionHandler(question.id);
    });
    
    console.log('✅ Generated', questions.length, 'specific questions');
    updateStage3ButtonState();
}

function setupSpecificQuestionHandler(questionId) {
    console.log('🔗 Setting up handler for question:', questionId);
    const container = document.getElementById(`${questionId}-buttons`);
    const buttons = container.querySelectorAll('.option-btn');
    
    console.log('Found', buttons.length, 'buttons for question', questionId);
    
    buttons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            console.log(`🎯 Answer selected for ${questionId}:`, btn.dataset.value);
            buttons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            userContext.specificAnswers[questionId] = btn.dataset.value;
            console.log('Updated specificAnswers:', userContext.specificAnswers);
            updateStage3ButtonState();
        });
    });
}

function updateStage3ButtonState() {
    const analyzeBtn = document.getElementById('analyze-btn');
    if (!analyzeBtn) {
        console.error('Analyze button not found in updateStage3ButtonState');
        return;
    }
    
    const questions = specificQuestions[userContext.decisionType] || specificQuestions.other;
    const answeredQuestions = Object.keys(userContext.specificAnswers).length;
    
    const allAnswered = answeredQuestions >= questions.length;
    analyzeBtn.disabled = !allAnswered;
    
    console.log('Stage 3 button state:', {
        decisionType: userContext.decisionType,
        totalQuestions: questions.length,
        answeredQuestions: answeredQuestions,
        allAnswered: allAnswered,
        buttonDisabled: analyzeBtn.disabled,
        specificAnswers: userContext.specificAnswers
    });
    
    if (allAnswered) {
        analyzeBtn.innerHTML = '<span class="btn-text">🚀 Analyze My Decision</span>';
        console.log('✅ Analyze button should be enabled now');
    } else {
        analyzeBtn.innerHTML = `<span class="btn-text">Answer all questions (${answeredQuestions}/${questions.length})</span>`;
        console.log('❌ Analyze button disabled - need more answers');
    }
}

// Debug helper function for analyzing button issues
window.debugAnalyzeButton = function() {
    console.log('🔍 ANALYZE BUTTON DEBUG:');
    console.log('=========================');
    
    const analyzeBtn = document.getElementById('analyze-btn');
    console.log('1. Button found:', !!analyzeBtn);
    console.log('2. Button disabled:', analyzeBtn ? analyzeBtn.disabled : 'N/A');
    console.log('3. Button innerHTML:', analyzeBtn ? analyzeBtn.innerHTML : 'N/A');
    console.log('4. Handler attached:', analyzeBtn ? analyzeBtn.getAttribute('data-handler-attached') === 'true' : 'N/A');
    
    console.log('5. Current Stage:', currentStage);
    console.log('6. UserContext:');
    console.log('   - decision:', userContext.decision);
    console.log('   - decisionType:', userContext.decisionType);
    console.log('   - priorities:', userContext.priorities);
    console.log('   - timeCommitment:', userContext.timeCommitment);
    console.log('   - stressLevel:', userContext.stressLevel);
    console.log('   - budget:', userContext.budget);
    console.log('   - specificAnswers:', userContext.specificAnswers);
    console.log('   - specificAnswers count:', Object.keys(userContext.specificAnswers).length);
    
    const questions = specificQuestions[userContext.decisionType] || specificQuestions.other;
    console.log('7. Expected questions:', questions.length);
    console.log('8. Questions:', questions.map(q => q.id));
    
    console.log('9. Current stage visibility:');
    for (let i = 1; i <= 3; i++) {
        const stage = document.getElementById(`stage-${i}`);
        const isActive = stage ? stage.classList.contains('active') : false;
        console.log(`   - Stage ${i}:`, stage ? `${isActive ? 'ACTIVE' : 'hidden'}` : 'not found');
    }
    
    // Check specific questions container
    const specificContainer = document.getElementById('specific-questions');
    console.log('10. Specific questions container:', !!specificContainer);
    if (specificContainer) {
        console.log('   - Children count:', specificContainer.children.length);
        const questionBtns = specificContainer.querySelectorAll('.option-btn.selected');
        console.log('   - Selected answers:', questionBtns.length);
    }
    
    // Global handler check
    console.log('11. Global handler references:');
    console.log('   - window._analyzeButton exists:', !!window._analyzeButton);
    console.log('   - window._analyzeButtonHandler exists:', !!window._analyzeButtonHandler);
    
    console.log('=========================');
    
    // Try to trigger updateStage3ButtonState manually
    console.log('🔧 Manually triggering updateStage3ButtonState...');
    updateStage3ButtonState();
    
    // If button is enabled, try a test click
    if (analyzeBtn && !analyzeBtn.disabled) {
        console.log('🎯 Button appears enabled! Try clicking it now or run testButtonDirectly()');
    }
    
    return { analyzeBtn, userContext, questions };
};

console.log('💡 Debug helper loaded! Type debugAnalyzeButton() in console to debug');

// Comprehensive test function 
window.testAnalyzeFlow = function() {
    console.log('🧪 STARTING COMPREHENSIVE ANALYZE FLOW TEST');
    console.log('===========================================');
    
    return new Promise((resolve) => {
        // Reset to beginning
        handleNewAnalysis();
        
        setTimeout(() => {
            console.log('📝 Step 1: Filling decision...');
            const decisionInput = document.getElementById('decision-input');
            decisionInput.value = "Should I switch to a career in data science from my current job in marketing?";
            decisionInput.dispatchEvent(new Event('input'));
            userContext.decision = decisionInput.value;
            
            setTimeout(() => {
                console.log('➡️ Step 2: Moving to stage 2...');
                const nextBtn = document.getElementById('next-to-stage-2');
                console.log('Next button found:', !!nextBtn, 'disabled:', nextBtn?.disabled);
                
                if (nextBtn && !nextBtn.disabled) {
                    nextBtn.click();
                    
                    setTimeout(() => {
                        console.log('🎯 Step 3: Filling stage 2 options...');
                        
                        // Career decision
                        const careerBtn = document.querySelector('[data-value="career"]');
                        if (careerBtn) {
                            careerBtn.click();
                            console.log('✅ Selected career');
                        }
                        
                        setTimeout(() => {
                            // Priorities (select first 2)
                            const priorityBtns = document.querySelectorAll('#priorities-buttons .option-btn');
                            console.log('Priority buttons found:', priorityBtns.length);
                            if (priorityBtns.length >= 2) {
                                priorityBtns[0].click();
                                priorityBtns[1].click();
                                console.log('✅ Selected 2 priorities');
                            }
                            
                            setTimeout(() => {
                                // Time commitment
                                const timeBtns = document.querySelectorAll('#time-commitment-buttons .option-btn');
                                if (timeBtns.length > 0) {
                                    timeBtns[1].click();
                                    console.log('✅ Selected time commitment');
                                }
                                
                                setTimeout(() => {
                                    // Stress level
                                    const stressBtns = document.querySelectorAll('#stress-level-buttons .option-btn');
                                    if (stressBtns.length > 0) {
                                        stressBtns[1].click();
                                        console.log('✅ Selected stress level');
                                    }
                                    
                                    setTimeout(() => {
                                        console.log('➡️ Step 4: Moving to stage 3...');
                                        const nextToStage3 = document.getElementById('next-to-stage-3');
                                        console.log('Stage 3 button found:', !!nextToStage3, 'disabled:', nextToStage3?.disabled);
                                        
                                        if (nextToStage3 && !nextToStage3.disabled) {
                                            nextToStage3.click();
                                            
                                            setTimeout(() => {
                                                console.log('🎯 Step 5: Filling stage 3 questions...');
                                                const questionGroups = document.querySelectorAll('#stage-3 .button-grid');
                                                console.log('Question groups found:', questionGroups.length);
                                                
                                                questionGroups.forEach((group, index) => {
                                                    const firstBtn = group.querySelector('.option-btn');
                                                    if (firstBtn) {
                                                        setTimeout(() => {
                                                            firstBtn.click();
                                                            console.log(`✅ Answered question ${index + 1}`);
                                                            
                                                            // Check if this was the last question
                                                            if (index === questionGroups.length - 1) {
                                                                setTimeout(() => {
                                                                    console.log('🎯 Step 6: Testing analyze button...');
                                                                    debugAnalyzeButton();
                                                                    
                                                                    const analyzeBtn = document.getElementById('analyze-btn');
                                                                    if (analyzeBtn && !analyzeBtn.disabled) {
                                                                        console.log('🎉 SUCCESS! Button is enabled. Testing click...');
                                                                        analyzeBtn.click();
                                                                        resolve(true);
                                                                    } else {
                                                                        console.log('❌ FAILED! Button is disabled or missing');
                                                                        resolve(false);
                                                                    }
                                                                }, 500);
                                                            }
                                                        }, index * 200);
                                                    }
                                                });
                                                
                                            }, 500);
                                        } else {
                                            console.log('❌ FAILED at stage 3 transition');
                                            resolve(false);
                                        }
                                    }, 300);
                                }, 300);
                            }, 300);
                        }, 300);
                    }, 500);
                } else {
                    console.log('❌ FAILED at stage 2 transition');
                    resolve(false);
                }
            }, 300);
        }, 300);
    });
};

// Quick test function to fill form automatically
window.quickFillForm = function() {
    console.log('🚀 Auto-filling form for testing...');
    
    // Step 1: Fill decision
    const decisionInput = document.getElementById('decision-input');
    if (decisionInput) {
        decisionInput.value = "Should I change my career to data science?";
        userContext.decision = decisionInput.value;
        console.log('✅ Step 1: Decision filled');
    }
    
    // Move to stage 2
    if (currentStage === 1) {
        transitionToStage(2);
        console.log('✅ Moved to Stage 2');
    }
    
    // Fill stage 2 selections
    setTimeout(() => {
        // Select decision type
        const careerBtn = document.querySelector('[data-value="career"]');
        if (careerBtn) {
            careerBtn.click();
            console.log('✅ Selected career decision');
        }
        
        // Select priorities
        setTimeout(() => {
            const happinessBtn = document.querySelector('[data-priority="happiness"]');
            const moneyBtn = document.querySelector('[data-priority="money"]');
            if (happinessBtn) happinessBtn.click();
            if (moneyBtn) moneyBtn.click();
            console.log('✅ Selected priorities');
            
            // Select time commitment  
            setTimeout(() => {
                const timeBtn = document.querySelector('[data-value="moderate"]');
                if (timeBtn) {
                    timeBtn.click();
                    console.log('✅ Selected time commitment');
                }
                
                // Select stress level
                setTimeout(() => {
                    const stressBtn = document.querySelector('[data-value="medium"]');
                    if (stressBtn) {
                        stressBtn.click();
                        console.log('✅ Selected stress level');
                    }
                    
                    // Move to stage 3
                    setTimeout(() => {
                        const nextBtn = document.getElementById('next-to-stage-3');
                        if (nextBtn && !nextBtn.disabled) {
                            nextBtn.click();
                            console.log('✅ Moved to Stage 3');
                            
                            // Fill stage 3 questions
                            setTimeout(() => {
                                const stage3Buttons = document.querySelectorAll('#stage-3 .option-btn');
                                stage3Buttons.forEach((btn, index) => {
                                    if (index % 2 === 0) { // Select every other button
                                        setTimeout(() => btn.click(), index * 100);
                                    }
                                });
                                console.log('✅ Filled Stage 3 questions');
                            }, 500);
                        }
                    }, 200);
                }, 200);
            }, 200);
        }, 200);
    }, 200);
};

console.log('💡 Type testAnalyzeFlow() to run complete flow test');
console.log('💡 Type debugAnalyzeButton() to debug current state');

// Direct button test
window.testButtonDirectly = function() {
    console.log('🔘 Testing analyze button directly...');
    const btn = document.getElementById('analyze-btn');
    if (!btn) {
        console.log('❌ Button not found!');
        return;
    }
    
    console.log('✅ Button found');
    console.log('   Disabled:', btn.disabled);
    console.log('   Has click listeners:', btn.onclick ? 'yes' : 'probably via addEventListener');
    console.log('   Handler attached attribute:', btn.getAttribute('data-handler-attached'));
    
    // Force enable and try click
    const wasDisabled = btn.disabled;
    btn.disabled = false;
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
    
    console.log('🎯 Forcing click...');
    btn.click();
    
    console.log('🎯 Forcing click with event...');
    btn.dispatchEvent(new Event('click', { bubbles: true }));
    
    // Try calling the handler directly if it exists
    if (window._analyzeButtonHandler) {
        console.log('🎯 Calling handler directly...');
        window._analyzeButtonHandler({ preventDefault: () => {}, stopPropagation: () => {} });
    }
    
    // Restore state
    btn.disabled = wasDisabled;
};

// Manual analyze function for emergencies
window.forceAnalyze = function() {
    console.log('🚀 FORCING ANALYSIS...');
    const decisionText = userContext.decision || document.getElementById('decision-input').value.trim();
    
    if (!decisionText) {
        console.log('❌ No decision text available');
        return;
    }
    
    console.log('Decision text:', decisionText);
    console.log('Calling handleAnalyze directly...');
    handleAnalyze();
};

console.log('💡 Additional functions: testButtonDirectly(), forceAnalyze()');

// Test feedback submission directly
window.testFeedbackSubmission = function() {
    console.log('🧪 Testing feedback submission directly...');
    
    // Set up test data
    currentAnalysisId = 'test_feedback_' + Date.now();
    currentAnalysis = {
        decision: 'Test decision for feedback submission',
        pros: ['Test pro 1', 'Test pro 2'],
        cons: ['Test con 1'],
        opportunity_cost: 'Test opportunity cost',
        time: 'Test time'
    };
    selectedRating = 4;
    
    // Also set userContext as fallback
    userContext.decision = 'Test decision for feedback submission';
    
    console.log('✅ Test data set up');
    console.log('Analysis ID:', currentAnalysisId);
    console.log('Selected Rating:', selectedRating);
    console.log('Analysis with decision:', currentAnalysis);
    
    // Call the feedback function directly
    handleSubmitFeedback();
};

console.log('💡 Type testFeedbackSubmission() to test feedback directly');

// Enhanced error handling
function displayError(message, details = null) {
    let friendlyMessage = message;
    
    if (message.includes('network') || message.includes('fetch')) {
        friendlyMessage = "I'm having trouble connecting right now. Could you check your internet connection and try again?";
    } else if (message.includes('timeout')) {
        friendlyMessage = "This is taking longer than expected. Let me try that again for you.";
    } else if (message.includes('500')) {
        friendlyMessage = "Something went wrong on my end. Give it a moment and try again—I should be back to normal soon.";
    }
    
    errorMessage.textContent = friendlyMessage;
    resultsSection.style.display = 'none';
    errorSection.style.display = 'block';
}

// Add stats counter animation
function animateStats() {
    const statsSection = document.querySelector('.stats-section');
    if (!statsSection) return;
    
    const statNumbers = statsSection.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statNumbers.forEach((statNumber, index) => {
                    const finalValue = statNumber.textContent;
                    statNumber.textContent = '0';
                    
                    setTimeout(() => {
                        animateCounter(statNumber, finalValue);
                    }, index * 200);
                });
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });
    
    observer.observe(statsSection);
}

function animateCounter(element, targetValue) {
    const isRating = targetValue.includes('/');
    const isPercentage = targetValue.includes('%');
    const numericValue = parseFloat(targetValue.replace(/[^\d.]/g, ''));
    
    let currentValue = 0;
    const increment = numericValue / 50;
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= numericValue) {
            currentValue = numericValue;
            clearInterval(timer);
        }
        
        if (isRating) {
            element.textContent = currentValue.toFixed(1) + '/5';
        } else if (isPercentage) {
            element.textContent = Math.round(currentValue) + '%';
        } else {
            element.textContent = Math.round(currentValue).toLocaleString();
        }
    }, 30);
}

// Enhanced typing feedback
function showContextualFeedback(length) {
    const feedbackMessages = [
        { min: 50, message: "Good start! Keep going to help me understand your situation better." },
        { min: 100, message: "Great detail! This context will help me provide more accurate insights." },
        { min: 200, message: "Excellent! With this level of detail, I can give you really personalized analysis." },
        { min: 300, message: "Perfect amount of context! I have everything I need to help you thoroughly." }
    ];
    
    const applicableMessage = feedbackMessages.reverse().find(msg => length >= msg.min);
    if (applicableMessage && !document.querySelector('.contextual-feedback')) {
        showContextualTip(applicableMessage.message, 'success');
    }
}

function showContextualTip(message, type = 'info') {
    const existingTips = document.querySelectorAll('.contextual-feedback');
    existingTips.forEach(tip => tip.remove());
    
    const tipDiv = document.createElement('div');
    tipDiv.className = `contextual-feedback contextual-tip-${type}`;
    tipDiv.innerHTML = `
        <div class="tip-content">
            <div class="tip-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    ${type === 'success' 
                        ? '<path d="M20 6L9 17l-5-5"/>' 
                        : '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="12" r="10"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
                    }
                </svg>
            </div>
            <p>${message}</p>
        </div>
    `;
    
    const inputContainer = document.querySelector('.input-container');
    inputContainer.appendChild(tipDiv);
    
    setTimeout(() => {
        tipDiv.style.opacity = '1';
        tipDiv.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        if (tipDiv.parentNode) {
            tipDiv.style.opacity = '0';
            tipDiv.style.transform = 'translateX(10px)';
            setTimeout(() => {
                if (tipDiv.parentNode) {
                    inputContainer.removeChild(tipDiv);
                }
            }, 300);
        }
    }, 5000);
}

// Check API health on load
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error('API health check failed');
        }
        console.log('✅ API is healthy');
    } catch (error) {
        console.warn('⚠️ API health check failed:', error.message);
    }
}

// Add celebration animation after feedback submission
function addCelebrationAnimation() {
    const feedbackCard = document.querySelector('.feedback-card');
    feedbackCard.classList.add('celebration');
    
    // Create floating hearts or sparkles
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createFloatingElement();
        }, i * 100);
    }
    
    setTimeout(() => {
        feedbackCard.classList.remove('celebration');
    }, 2000);
}

function createFloatingElement() {
    const element = document.createElement('div');
    element.className = 'floating-sparkle';
    element.innerHTML = '✨';
    
    const feedbackCard = document.querySelector('.feedback-card');
    feedbackCard.appendChild(element);
    
    element.style.left = Math.random() * feedbackCard.offsetWidth + 'px';
    element.style.animationDelay = Math.random() * 0.5 + 's';
    
    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }, 2000);
}

// Debug functions
window.debugRequestData = function() {
    console.log('=== REQUEST DATA DEBUG ===');
    console.log('currentAnalysisId:', currentAnalysisId, 'Type:', typeof currentAnalysisId);
    console.log('currentAnalysis:', currentAnalysis, 'Type:', typeof currentAnalysis);
    console.log('selectedRating:', selectedRating, 'Type:', typeof selectedRating);
    
    if (!currentAnalysis) {
        console.error('ERROR: currentAnalysis is null/undefined!');
        return false;
    }
    
    if (!currentAnalysisId) {
        console.error('ERROR: currentAnalysisId is null/undefined!');
        return false;
    }
    
    if (!selectedRating) {
        console.error('ERROR: selectedRating is null/undefined!');
        return false;
    }
    
    if (currentAnalysis) {
        console.log('Analysis.decision:', currentAnalysis.decision);
        console.log('Analysis.pros:', currentAnalysis.pros);
        console.log('Analysis.cons:', currentAnalysis.cons);
        console.log('Analysis.opportunity_cost:', currentAnalysis.opportunity_cost);
        console.log('Analysis.time:', currentAnalysis.time);
    }
    
    const requestBody = {
        analysis_id: currentAnalysisId,
        decision: currentAnalysis.decision,
        analysis: {
            pros: currentAnalysis.pros,
            cons: currentAnalysis.cons,
            opportunity_cost: currentAnalysis.opportunity_cost,
            time: currentAnalysis.time
        },
        rating: selectedRating,
        feedback_text: 'Debug test feedback'
    };
    
    console.log('Generated request body:', requestBody);
    
    const requiredFields = ['analysis_id', 'decision', 'analysis', 'rating'];
    const missingFields = requiredFields.filter(field => {
        const value = requestBody[field];
        const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
        if (isEmpty) {
            console.error(`Missing field ${field}:`, value);
        }
        return isEmpty;
    });
    
    if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        return false;
    }
    
    console.log('All required fields present ✓');
    return true;
};

window.checkFeedbackState = function() {
    console.log('=== FEEDBACK STATE CHECK ===');
    console.log('1. Current Analysis ID:', currentAnalysisId);
    console.log('2. Selected Rating:', selectedRating);
    console.log('3. Current Analysis exists:', !!currentAnalysis);
    
    if (!currentAnalysisId) {
        console.warn('❌ No analysis ID - you need to complete an analysis first!');
        return false;
    }
    
    if (!selectedRating) {
        console.warn('❌ No rating selected - click on the stars to select a rating!');
        return false;
    }
    
    if (!currentAnalysis) {
        console.warn('❌ No analysis data - something went wrong with the analysis!');
        return false;
    }
    
    console.log('✅ All required data is present!');
    return true;
};

window.fixFeedbackSystem = function() {
    console.log('=== FIXING FEEDBACK SYSTEM ===');
    
    // Always create fresh test data
    currentAnalysisId = 'manual-fix-' + Date.now();
    currentAnalysis = {
        decision: 'Test decision for feedback',
        pros: ['Test pro 1', 'Test pro 2'],
        cons: ['Test con 1'],
        opportunity_cost: 'Test opportunity cost',
        time: 'Test time'
    };
    console.log('✅ Test analysis data created');
    console.log('  - Analysis ID:', currentAnalysisId);
    console.log('  - Analysis:', currentAnalysis);
    
    const resultsSection = document.getElementById('results-section');
    if (resultsSection && resultsSection.style.display === 'none') {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        console.log('✅ Results section shown');
    }
    
    // Populate results if empty
    if (prosList && !prosList.innerHTML) {
        prosList.innerHTML = '<li>Test pro 1</li><li>Test pro 2</li>';
    }
    if (consList && !consList.innerHTML) {
        consList.innerHTML = '<li>Test con 1</li>';
    }
    if (opportunityCostText && !opportunityCostText.textContent) {
        opportunityCostText.textContent = 'Test opportunity cost';
    }
    if (timeEstimateText && !timeEstimateText.textContent) {
        timeEstimateText.textContent = 'Test time';
    }
    
    selectedRating = 0;
    updateStarDisplay(0);
    setupStarRating();
    enableRatingSystem();
    console.log('✅ Star rating system reset');
    
    console.log('🎯 Now click a star (1-5) and then the "Share Feedback" button!');
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    checkAPIHealth();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!analyzeBtn.disabled) {
            e.preventDefault();
            handleAnalyze();
        }
    }
    
    if (e.key === 'Escape' && (resultsSection.style.display === 'block' || errorSection.style.display === 'block')) {
        e.preventDefault();
        handleNewAnalysis();
    }
});


