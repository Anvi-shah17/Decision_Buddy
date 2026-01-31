// Test script to debug analyze button
// Paste this into the browser console

console.log('🧪 Starting analyze button test...');

// Test 1: Check if button exists
const analyzeBtn = document.getElementById('analyze-btn');
console.log('1. Analyze button found:', !!analyzeBtn);
if (analyzeBtn) {
    console.log('   - Disabled:', analyzeBtn.disabled);
    console.log('   - innerHTML:', analyzeBtn.innerHTML);
}

// Test 2: Check current stage
console.log('2. Current stage:', window.currentStage);

// Test 3: Check userContext
console.log('3. User context:', window.userContext);

// Test 4: Auto-fill form and test
function autoTest() {
    console.log('🚀 Auto-testing...');
    
    // Fill stage 1
    const input = document.getElementById('decision-input');
    if (input) {
        input.value = "Should I switch to a career in data science?";
        input.dispatchEvent(new Event('input'));
        
        // Trigger stage 1 validation
        window.userContext.decision = input.value;
        console.log('✅ Stage 1 filled');
        
        // Move to stage 2 if possible
        const nextBtn = document.getElementById('next-to-stage-2');
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.click();
            console.log('✅ Moved to stage 2');
            
            setTimeout(() => {
                // Fill stage 2
                const careerBtn = document.querySelector('[data-value="career"]');
                if (careerBtn) {
                    careerBtn.click();
                    console.log('✅ Selected career');
                }
                
                // Wait and fill more
                setTimeout(() => {
                    // Select priorities - look for buttons with specific data attributes
                    const priorityBtns = document.querySelectorAll('#priorities-buttons .option-btn');
                    if (priorityBtns.length >= 2) {
                        priorityBtns[0].click(); // Click first priority
                        priorityBtns[1].click(); // Click second priority
                        console.log('✅ Selected priorities');
                    }
                    
                    setTimeout(() => {
                        // Select time commitment
                        const timeBtns = document.querySelectorAll('#time-commitment-buttons .option-btn');
                        if (timeBtns.length > 0) {
                            timeBtns[1].click(); // Select middle option
                            console.log('✅ Selected time commitment');
                        }
                        
                        setTimeout(() => {
                            // Select stress level
                            const stressBtns = document.querySelectorAll('#stress-level-buttons .option-btn');
                            if (stressBtns.length > 0) {
                                stressBtns[1].click(); // Select middle option
                                console.log('✅ Selected stress level');
                            }
                            
                            setTimeout(() => {
                                // Try to move to stage 3
                                const nextToStage3 = document.getElementById('next-to-stage-3');
                                if (nextToStage3 && !nextToStage3.disabled) {
                                    nextToStage3.click();
                                    console.log('✅ Moved to stage 3');
                                    
                                    setTimeout(() => {
                                        // Fill stage 3 questions
                                        const stage3Btns = document.querySelectorAll('#stage-3 .option-btn');
                                        console.log('Stage 3 buttons found:', stage3Btns.length);
                                        
                                        // Click first option for each question group
                                        const questionGroups = document.querySelectorAll('#stage-3 .button-grid');
                                        questionGroups.forEach((group, index) => {
                                            const firstBtn = group.querySelector('.option-btn');
                                            if (firstBtn) {
                                                setTimeout(() => {
                                                    firstBtn.click();
                                                    console.log(`✅ Answered question ${index + 1}`);
                                                }, index * 100);
                                            }
                                        });
                                        
                                        setTimeout(() => {
                                            console.log('🎯 Testing analyze button...');
                                            const finalAnalyzeBtn = document.getElementById('analyze-btn');
                                            console.log('Analyze button disabled:', finalAnalyzeBtn?.disabled);
                                            console.log('Analyze button innerHTML:', finalAnalyzeBtn?.innerHTML);
                                            
                                            if (finalAnalyzeBtn && !finalAnalyzeBtn.disabled) {
                                                console.log('🎉 Button should be clickable! Attempting click...');
                                                finalAnalyzeBtn.click();
                                            } else {
                                                console.log('❌ Button is disabled or not found');
                                                // Run debug
                                                if (window.debugAnalyzeButton) {
                                                    window.debugAnalyzeButton();
                                                }
                                            }
                                        }, 1000);
                                        
                                    }, 500);
                                } else {
                                    console.log('❌ Cannot move to stage 3 - button disabled or not found');
                                }
                            }, 200);
                        }, 200);
                    }, 200);
                }, 200);
            }, 500);
        } else {
            console.log('❌ Cannot move to stage 2 - button disabled or not found');
        }
    }
}

// Run the test
autoTest();
