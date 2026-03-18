// ==================== STATE MANAGEMENT ====================

const state = {
    userId: null,
    currentPage: 'home',
    currentTask: -1, // -1 = not started, 0-2 = calibration, 3-13 = tasks
    calibrationWpms: [],
    finalWpm: 0,
    calibrationTimerId: null,
    calibrationStartTime: null,
    briefingTimerId: null,
    currentTaskTimerId: null,
    isBriefingPhase: false,
    tasksPageHTML: null,
    calibrationPageHTML: null,
    themeIntervalId: null,
    mathTaskProblems: [],
    blinkIntervalId: null,
    
    // Adaptive difficulty system
    currentDifficulty: 'MEDIUM', // Difficulty level of current task (EASY, MEDIUM, HARD)
    performanceScore: 0, // Score from 0-100 of previous task
    
    // Task data
    taskData: {
        0: { input: '', startTime: null, endTime: null, features: {}, difficulty: 'MEDIUM' },
        1: { input: '', startTime: null, endTime: null, features: {}, difficulty: 'MEDIUM' },
        2: { input: '', startTime: null, endTime: null, features: {}, difficulty: 'MEDIUM' },
        3: { clicks: [], startTime: null, endTime: null, features: {}, difficulty: 'MEDIUM' },
        4: { input: '', startTime: null, endTime: null, features: {}, difficulty: 'MEDIUM' },
        5: { input: '', startTime: null, endTime: null, features: {}, difficulty: 'MEDIUM' },
        6: { input: '', startTime: null, endTime: null, features: {}, difficulty: 'MEDIUM' },
        7: { input: '', startTime: null, endTime: null, features: {}, difficulty: 'MEDIUM' },
        8: { input: '', startTime: null, endTime: null, features: {}, difficulty: 'MEDIUM' },
        9: { clicks: [], startTime: null, endTime: null, features: {}, difficulty: 'MEDIUM' },
        10: { solved: 0, startTime: null, endTime: null, features: {}, difficulty: 'MEDIUM' },
    },
    
    // Event tracking
    keystrokeEvents: [],
    mouseEvents: [],
    clickEvents: [],
    
    // Task configuration with descriptions
    tasks: [
        { id: 1, name: 'Typing + Math', type: 'typing+math', duration: 60, wordMultiplier: 1, description: 'Type all given words AND solve random math problems. The timer continues while you solve math - stay focused!' },
        { id: 2, name: 'Distraction-Free', type: 'typing', duration: 60, wordMultiplier: 1.1, description: 'Type clean and accurate. No distractions, just focus on typing all words with minimal errors.' },
        { id: 3, name: 'Theme Changes', type: 'typing', duration: 60, wordMultiplier: 1, description: 'Type while the theme (colors and background) changes every 10 seconds. Adapt quickly!' },
        { id: 4, name: 'Balloons', type: 'balloons', duration: 25, target: 50, description: 'Click and burst 50 balloons as fast as possible. Speed and accuracy matter!' },
        { id: 5, name: 'Increased Load', type: 'typing', duration: 60, wordMultiplier: 1.2, description: 'More words, same time. Type all words in 60 seconds - increased cognitive load!' },
        { id: 6, name: 'Blinking', type: 'typing', duration: 60, wordMultiplier: 1, description: 'Words blink randomly. Type from memory when they disappear. Test your recall!' },
        { id: 7, name: 'Scrolling', type: 'typing', duration: 60, wordMultiplier: 1, description: 'Words scroll horizontally. Follow the moving text and type what you see.' },
        { id: 8, name: 'Vanishing', type: 'typing', duration: 60, wordMultiplier: 1, description: 'Words vanish one by one as time passes. Type before they disappear!' },
        { id: 9, name: 'Color Avoid', type: 'typing', duration: 60, wordMultiplier: 1, description: 'Type words but AVOID the colored ones. Typing colored words loses lives. Stay alert!' },
        { id: 10, name: 'Click Boxes', type: 'boxes', duration: 30, target: 12, description: 'Click ONLY the red boxes. Ignore other colored boxes. Accuracy is key!' },
        { id: 11, name: 'Math', type: 'math', duration: 80, problems: 10, description: 'Solve 10 math problems quickly. Choose the correct answer from options. Think fast!' },
    ],
    
    // Word pool for tasks
    wordPool: ['algorithm', 'bandwidth', 'circuit', 'database', 'encryption', 'firewall', 
               'gateway', 'hardware', 'interface', 'kernel', 'latency', 'memory', 'network', 
               'operation', 'protocol', 'quantum', 'router', 'storage', 'transmission', 'upload',
               'variable', 'wireless', 'xserver', 'yottabyte', 'zeroing', 'access', 'backup',
               'cache', 'daemon', 'ethernet', 'framework', 'graphics', 'handler', 'internet',
               'javascript', 'keyboard', 'library', 'module', 'navigate', 'offspring', 'package',
               'query', 'request', 'system', 'terminal', 'utility', 'version', 'website', 'zeigfeld'],
    
    // Results
    results: null,
};

// ==================== TASK DIFFICULTY VARIANTS ====================
// Each task has 3 difficulty levels (EASY, MEDIUM, HARD) with different parameters
// These variants ensure authentic cognitive load variation across users
// Scientific Justification: Time pressure is primary stressor (Paas & Sweller, 2012)
// Increased task complexity increases working memory demand (Baddeley's Model)

const taskVariants = {
    0: {  // Task 1: Typing + Math
        EASY: { duration: 75, wordMultiplier: 0.8, mathFrequency: 2500 },      // 2.5s between math problems (easier)
        MEDIUM: { duration: 60, wordMultiplier: 1.0, mathFrequency: 1500 },    // 1.5s between math problems
        HARD: { duration: 45, wordMultiplier: 1.2, mathFrequency: 1000 }       // 1s between math problems (high frequency)
    },
    1: {  // Task 2: Distraction-Free
        EASY: { duration: 75, wordMultiplier: 0.8 },      // More time, fewer words
        MEDIUM: { duration: 60, wordMultiplier: 1.1 },    // Baseline
        HARD: { duration: 45, wordMultiplier: 1.3 }       // Less time, more words
    },
    2: {  // Task 3: Theme Changes
        EASY: { duration: 70, wordMultiplier: 0.9, themeChangePeriod: 15000 },    // Theme changes every 15s
        MEDIUM: { duration: 60, wordMultiplier: 1.0, themeChangePeriod: 10000 },  // Every 10s
        HARD: { duration: 50, wordMultiplier: 1.1, themeChangePeriod: 5000 }      // Every 5s (high distraction)
    },
    3: {  // Task 4: Balloons
        EASY: { duration: 30, target: 35 },      // Fewer balloons to click
        MEDIUM: { duration: 25, target: 50 },    // Baseline
        HARD: { duration: 20, target: 70 }       // More balloons, less time
    },
    4: {  // Task 5: Increased Load
        EASY: { duration: 75, wordMultiplier: 1.0 },     // More time
        MEDIUM: { duration: 60, wordMultiplier: 1.2 },   // Baseline (20% more words)
        HARD: { duration: 45, wordMultiplier: 1.4 }      // Less time, 40% more words
    },
    5: {  // Task 6: Blinking (only target words blink)
        EASY: { duration: 70, wordMultiplier: 0.9, blinkSpeed: 1000 },     // Slower blinks (1s)
        MEDIUM: { duration: 60, wordMultiplier: 1.0, blinkSpeed: 500 },    // Medium blinks (500ms)
        HARD: { duration: 50, wordMultiplier: 1.1, blinkSpeed: 300 }       // Fast blinks (300ms)
    },
    6: {  // Task 7: Scrolling
        EASY: { duration: 70, wordMultiplier: 0.9, scrollSpeed: 50 },      // Slow scroll
        MEDIUM: { duration: 60, wordMultiplier: 1.0, scrollSpeed: 80 },    // Medium scroll
        HARD: { duration: 50, wordMultiplier: 1.1, scrollSpeed: 120 }      // Fast scroll
    },
    7: {  // Task 8: Vanishing
        EASY: { duration: 75, wordMultiplier: 0.8, vanishStartTime: 45000 },   // Words vanish after 45s
        MEDIUM: { duration: 60, wordMultiplier: 1.0, vanishStartTime: 30000 }, // Vanish after 30s
        HARD: { duration: 45, wordMultiplier: 1.2, vanishStartTime: 15000 }    // Vanish after 15s
    },
    8: {  // Task 9: Color Avoid
        EASY: { duration: 70, wordMultiplier: 0.9, colorPenalty: 1 },     // 1 life lost per colored word
        MEDIUM: { duration: 60, wordMultiplier: 1.0, colorPenalty: 2 },   // 2 lives lost per colored word
        HARD: { duration: 50, wordMultiplier: 1.1, colorPenalty: 3 }      // 3 lives lost per colored word
    },
    9: {  // Task 10: Click Boxes
        EASY: { duration: 35, target: 8 },      // Fewer boxes to click
        MEDIUM: { duration: 30, target: 12 },   // Baseline
        HARD: { duration: 25, target: 16 }      // More boxes, less time
    },
    10: {  // Task 11: Math
        EASY: { duration: 100, problems: 6, numberRange: 10 },      // Fewer problems, smaller numbers
        MEDIUM: { duration: 80, problems: 10, numberRange: 20 },    // Baseline
        HARD: { duration: 60, problems: 14, numberRange: 50 }       // More problems, larger numbers
    }
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Check if session already has an ID (survives page refreshes)
    const sessionId = sessionStorage.getItem('sessionId');
    if (sessionId) {
        // Returning in same session
        state.userId = sessionId;
        console.log('Existing Session ID (from sessionStorage):', state.userId);
    } else {
        // New session - generate unique Session ID
        // Format: SID-{timestamp}-{random}
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 100000);
        const tempId = `SID-${timestamp}-${random}`;
        sessionStorage.setItem('sessionId', tempId);
        state.userId = tempId;
        console.log('New Session ID generated:', state.userId);
    }
    
    updateSidebar();
    navigateTo('home');
}

// ==================== PAGE NAVIGATION ====================

function navigateTo(page) {
    try {
        // Hide all pages - safely check each element
        const pages = document.querySelectorAll('[id$="Page"]');
        pages.forEach(el => {
            if (el && el.classList) {
                el.classList.add('hidden');
            }
        });
        
        // Show selected page
        const pageEl = document.getElementById(page + 'Page');
        if (pageEl && pageEl.classList) {
            pageEl.classList.remove('hidden');
        }
        
        // Update active nav button - safely
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            if (btn && btn.classList) {
                btn.classList.remove('active');
            }
        });
        
        // Only add active class if we have an actual event with a target
        if (typeof event !== 'undefined' && event && event.target && event.target.classList) {
            event.target.classList.add('active');
        }
        
        state.currentPage = page;
        console.log('[Navigation] Switched to page:', page);
        
        // Initialize page content
        if (page === 'calibration') initializeCalibration();
        else if (page === 'tasks') initializeTasks();
        else if (page === 'results') displayResults();
        else if (page === 'data') loadData();
    } catch (e) {
        console.error('[Navigation Error]', e.message);
    }
}

// ==================== CALIBRATION ====================

function initializeCalibration() {
    const level = state.calibrationWpms.length;
    
    // Clear any existing timer
    if (state.calibrationTimerId !== null) {
        clearInterval(state.calibrationTimerId);
        state.calibrationTimerId = null;
    }
    
    if (level >= 3) {
        // Calibration complete
        document.getElementById('calibrationActive').classList.add('hidden');
        document.getElementById('calibrationComplete').classList.remove('hidden');
        
        const avgWpm = Math.round(state.calibrationWpms.reduce((a,b) => a+b, 0) / 3);
        state.finalWpm = avgWpm;
        document.getElementById('finalWpm').textContent = avgWpm;
        return;
    }
    
    const levelNames = ['0 (Slow)', '0.2 (Baseline)', '0.5 (Faster)'];
    const descriptions = [
        'Simple, common words. Get comfortable with typing. This is your warm-up.',
        'Medium-difficulty words. Measure your baseline typing speed.',
        'Complex words. See how you handle challenging vocabulary.'
    ];
    
    // Show calibration briefing
    showCalibrationBriefing(level, levelNames[level], descriptions[level]);
}

function showCalibrationBriefing(level, levelName, description) {
    state.isBriefingPhase = true;
    let briefingTime = 15;
    
    // Hide calibration page and create briefing overlay
    const calibrationPage = document.getElementById('calibrationPage');
    calibrationPage.classList.add('hidden');
    
    // Create briefing container
    const briefingDiv = document.createElement('div');
    briefingDiv.id = 'calibrationBriefing';
    briefingDiv.innerHTML = `
        <div class="container" style="text-align: center; padding: 60px 40px;">
            <h2 style="color: #667eea; margin-bottom: 20px; font-size: 28px; font-weight: 700;">📊 Calibration Level ${level + 1}/3</h2>
            <h1 style="color: #764ba2; font-size: 40px; margin-bottom: 30px; font-weight: 700;">${levelName}</h1>
            <div class="alert alert-info" style="font-size: 19px; line-height: 1.8; margin: 30px 0; font-weight: 600; color: #0d47a1;">
                <strong style="font-size: 21px;">📋 Instructions:</strong><br><br>
                ${description}<br><br>
                <strong style="font-size: 18px;">You'll have 60 seconds to type as many words as possible.</strong>
            </div>
            <div class="metric" style="margin: 30px 0; padding: 30px;">
                <div style="font-size: 26px; color: #555; margin-bottom: 10px; font-weight: 700;">Get ready in</div>
                <div id="calibrationBriefingTimer" class="timer" style="font-size: 84px; color: #667eea; animation: none; font-weight: 700;">15</div>
            </div>
            <p style="color: #333; font-size: 16px; margin-top: 20px; font-weight: 600;">⏰ Starting in 15 seconds...</p>
        </div>
    `;
    
    // Insert briefing before calibration page
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(briefingDiv, calibrationPage);
    
    // Countdown timer
    state.briefingTimerId = setInterval(() => {
        briefingTime--;
        const timerEl = document.getElementById('calibrationBriefingTimer');
        if (timerEl) {
            timerEl.textContent = briefingTime;
            timerEl.style.color = briefingTime <= 5 ? '#f44336' : '#667eea';
        }
        
        if (briefingTime <= 0) {
            clearInterval(state.briefingTimerId);
            state.briefingTimerId = null;
            
            // Remove briefing div
            const briefingDiv = document.getElementById('calibrationBriefing');
            if (briefingDiv) {
                briefingDiv.remove();
            }
            
            // Show calibration page again
            const calibrationPage = document.getElementById('calibrationPage');
            if (calibrationPage) {
                calibrationPage.classList.remove('hidden');
            }
            
            // Start the actual calibration
            startActualCalibration(level);
        }
    }, 1000);
}

function startActualCalibration(level) {
    state.isBriefingPhase = false;
    
    // Re-enable all buttons for the new calibration level
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(btn => btn.disabled = false);
    
    // Restore calibration page
    const calibrationPage = document.getElementById('calibrationPage');
    calibrationPage.classList.remove('hidden');
    
    document.getElementById('calibrationActive').classList.remove('hidden');
    document.getElementById('calibrationComplete').classList.add('hidden');
    
    const levelNames = ['0 (Slow)', '0.2 (Baseline)', '0.5 (Faster)'];
    document.getElementById('levelHeader').innerHTML = `<h2>Level ${level + 1}/3: ${levelNames[level]}</h2><p>Type for 60 seconds. Let's find your baseline WPM.</p>`;
    
    // Generate target words
    const wordCount = 40 + (level * 10);
    const words = generateWords(wordCount);
    const targetText = words.join(' ');
    
    document.getElementById('targetWords').value = targetText;
    document.getElementById('typingInput').value = '';
    document.getElementById('calLevel').textContent = `${level + 1}/3`;
    
    // Reset tracking
    state.keystrokeEvents = [];
    state.mouseEvents = [];
    state.clickEvents = [];
    
    // Start timer
    startCalibrationTimer(level);
    
    // Start input tracking
    const input = document.getElementById('typingInput');
    input.focus();
    input.addEventListener('input', updateCalibrationMetrics);
}

function startCalibrationTimer(level) {
    state.calibrationStartTime = Date.now();
    const duration = 60000;
    
    state.calibrationTimerId = setInterval(() => {
        const elapsed = Date.now() - state.calibrationStartTime;
        const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
        
        document.getElementById('calTimer').textContent = remaining;
        document.getElementById('calTimer').className = 'timer' + (remaining <= 10 ? ' danger' : remaining <= 20 ? ' warning' : '');
        
        if (remaining === 0) {
            clearInterval(state.calibrationTimerId);
            state.calibrationTimerId = null;
            submitCalibration();
        }
    }, 100);
}

function updateCalibrationMetrics() {
    const input = document.getElementById('typingInput').value;
    const chars = input.length;
    const words = input.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // WPM = (characters / 5) / minutes
    if (state.calibrationStartTime) {
        const elapsed = Date.now() - state.calibrationStartTime;
        const minutes = elapsed / 60000;
        const wpm = minutes > 0 ? Math.round((chars / 5) / minutes) : 0;
        
        document.getElementById('calWpm').textContent = Math.min(120, wpm);
    }
    document.getElementById('calChars').textContent = chars;
}

function submitCalibration() {
    const input = document.getElementById('typingInput').value;
    const chars = input.length;
    const wpm = Math.min(Math.max(10, Math.round((chars / 5) / 1)), 120);
    
    state.calibrationWpms.push(wpm);
    
    if (state.calibrationWpms.length < 3) {
        setTimeout(() => initializeCalibration(), 500);
    } else {
        const avgWpm = Math.round(state.calibrationWpms.reduce((a,b) => a+b, 0) / 3);
        state.finalWpm = avgWpm;
        initializeCalibration();
    }
}

function skipCalibration() {
    state.calibrationWpms.push(45); // Default
    if (state.calibrationWpms.length < 3) {
        setTimeout(() => initializeCalibration(), 100);
    } else {
        state.finalWpm = 45;
        initializeCalibration();
    }
}

function resetCalibration() {
    state.calibrationWpms = [];
    state.keystrokeEvents = [];
    state.mouseEvents = [];
    state.clickEvents = [];
    initializeCalibration();
}

// ==================== TASKS ====================

function initializeTasks() {
    if (state.calibrationWpms.length === 0) {
        alert('Please complete calibration first');
        navigateTo('calibration');
        return;
    }
    
    state.currentTask = 0;
    displayTask();
}

function displayTask() {
    // This is called from the sidebar when user clicks "Tasks" button after calibration
    // Make sure we're in the tasks page
    const tasksPage = document.getElementById('tasksPage');
    if (tasksPage) {
        tasksPage.classList.remove('hidden');
    }
    
    // Hide other pages
    document.querySelectorAll('[id$="Page"]').forEach(el => {
        if (el.id !== 'tasksPage') {
            el.classList.add('hidden');
        }
    });
    
    // Hide all tasks
    for (let i = 1; i <= 11; i++) {
        const el = document.getElementById(`task${i}`);
        if (el) el.classList.add('hidden');
    }
    
    // Clear any existing briefing
    const oldBriefing = document.getElementById('taskBriefing');
    if (oldBriefing) {
        oldBriefing.remove();
    }
    
    // Clear any existing briefing timer
    if (state.briefingTimerId !== null) {
        clearInterval(state.briefingTimerId);
        state.briefingTimerId = null;
    }
    
    if (state.currentTask < 0 || state.currentTask > 10) {
        navigateTo('results');
        return;
    }
    
    const task = state.tasks[state.currentTask];
    
    // Show briefing phase
    showTaskBriefing(task);
}

function showTaskBriefing(task) {
    console.log('showTaskBriefing called for task:', task.name);
    
    state.isBriefingPhase = true;
    let briefingTime = 15;
    
    // Clear any existing briefing timer
    if (state.briefingTimerId !== null) {
        clearInterval(state.briefingTimerId);
        state.briefingTimerId = null;
        console.log('Cleared existing briefing timer');
    }
    
    // Remove any existing briefing div
    const oldBriefing = document.getElementById('taskBriefing');
    if (oldBriefing) {
        oldBriefing.remove();
        console.log('Removed old briefing div');
    }
    
    // Hide tasksPage if not already hidden
    const tasksPage = document.getElementById('tasksPage');
    if (tasksPage) {
        tasksPage.classList.add('hidden');
        console.log('Hidden tasksPage');
    }
    
    // Create briefing container - a full screen overlay
    const briefingDiv = document.createElement('div');
    briefingDiv.id = 'taskBriefing';
    briefingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    briefingDiv.innerHTML = `
        <div style="text-align: center; padding: 60px 40px; max-width: 800px; color: white;">
            <h2 style="color: white; margin-bottom: 20px; font-size: 28px; font-weight: 700;">🎯 Task ${state.currentTask + 1}/11</h2>
            <h1 style="color: white; font-size: 40px; margin-bottom: 30px; font-weight: 700;">${task.name}</h1>
            <div style="background: rgba(255,255,255,0.2); margin: 20px 0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: white; height: 100%; width: ${(state.currentTask + 1) / 11 * 100}%; transition: width 0.3s;"></div>
            </div>
            <div style="font-size: 19px; line-height: 1.8; margin: 30px 0; font-weight: 600; color: white; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
                <strong style="font-size: 21px; display: block; margin-bottom: 10px;">📋 Instructions:</strong>
                ${task.description}
            </div>
            <div style="margin: 30px 0; padding: 30px;">
                <div style="font-size: 26px; color: white; margin-bottom: 10px; font-weight: 700;">Get ready in</div>
                <div id="briefingTimer" style="font-size: 84px; color: #ffd700; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">15</div>
            </div>
            <p style="color: white; font-size: 16px; margin-top: 20px; font-weight: 600;">⏰ Starting in 15 seconds...</p>
        </div>
    `;
    
    // Append to body to ensure it's on top
    document.body.appendChild(briefingDiv);
    console.log('Added briefing div to body');
    
    // Countdown timer
    state.briefingTimerId = setInterval(() => {
        briefingTime--;
        const timerEl = document.getElementById('briefingTimer');
        if (timerEl) {
            timerEl.textContent = briefingTime;
            timerEl.style.color = briefingTime <= 5 ? '#ff4444' : '#ffd700';
        }
        
        if (briefingTime <= 0) {
            clearInterval(state.briefingTimerId);
            state.briefingTimerId = null;
            console.log('Briefing countdown complete');
            
            // Remove briefing div
            const briefingDiv = document.getElementById('taskBriefing');
            if (briefingDiv) {
                briefingDiv.remove();
                console.log('Removed briefing div');
            }
            
            // Start the actual task
            console.log('Calling startActualTask for task:', task.name);
            startActualTask(task);
        }
    }, 1000);
    
    console.log('Briefing timer started, will countdown from', briefingTime);
}

function startActualTask(task) {
    console.log('startActualTask called for task:', task.name);
    console.log('Current difficulty:', state.currentDifficulty);
    
    // Apply difficulty variants to task parameters
    const taskIndex = state.currentTask;
    const variants = taskVariants[taskIndex];
    if (variants && variants[state.currentDifficulty]) {
        const variant = variants[state.currentDifficulty];
        console.log('[Adaptive] Applying', state.currentDifficulty, 'difficulty variants:', variant);
        
        // Update task parameters based on difficulty variant
        if (variant.duration) task.duration = variant.duration;
        if (variant.wordMultiplier !== undefined) task.wordMultiplier = variant.wordMultiplier;
        if (variant.mathFrequency) task.mathFrequency = variant.mathFrequency;
        if (variant.themeChangePeriod) task.themeChangePeriod = variant.themeChangePeriod;
        if (variant.blinkSpeed) task.blinkSpeed = variant.blinkSpeed;
        if (variant.scrollSpeed) task.scrollSpeed = variant.scrollSpeed;
        if (variant.vanishStartTime) task.vanishStartTime = variant.vanishStartTime;
        if (variant.colorPenalty) task.colorPenalty = variant.colorPenalty;
        if (variant.target) task.target = variant.target;
        if (variant.problems) task.problems = variant.problems;
        if (variant.numberRange) task.numberRange = variant.numberRange;
    }
    
    // Store the difficulty level applied to this task
    state.taskData[taskIndex].difficulty = state.currentDifficulty;
    console.log('Task', taskIndex + 1, 'will be performed at', state.currentDifficulty, 'difficulty');
    
    state.isBriefingPhase = false;
    
    // Clear current task timer if still running
    if (state.currentTaskTimerId !== null) {
        clearInterval(state.currentTaskTimerId);
        state.currentTaskTimerId = null;
        console.log('Cleared existing task timer');
    }
    
    // Clear any briefing timer
    if (state.briefingTimerId !== null) {
        clearInterval(state.briefingTimerId);
        state.briefingTimerId = null;
        console.log('Cleared briefing timer');
    }
    
    // Remove any briefing div
    const briefing = document.getElementById('taskBriefing');
    if (briefing) {
        briefing.remove();
        console.log('Removed briefing div');
    }
    
    // Re-enable all buttons for the new task (they were disabled on previous task submit)
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(btn => btn.disabled = false);
    console.log('Re-enabled all buttons');
    
    // Clear any theme interval from previous task
    if (state.themeIntervalId !== null) {
        clearInterval(state.themeIntervalId);
        state.themeIntervalId = null;
    }
    
    // Clear any blink interval from previous task
    if (state.blinkIntervalId !== null) {
        clearInterval(state.blinkIntervalId);
        state.blinkIntervalId = null;
        // Reset opacity of blink words
        const blinkSpans = document.querySelectorAll('.blink-text');
        blinkSpans.forEach(span => {
            span.style.opacity = '1';
        });
        // Reset opacity of task5 blinking column
        const task5Column = document.getElementById('task5BlinkingColumn');
        if (task5Column) {
            task5Column.style.opacity = '1';
        }
    }
    
    // Reset main content background to default
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        mainContent.style.color = '#222';
    }
    
    // Reset container background to default
    const container = document.querySelector('.container');
    if (container) {
        container.style.background = 'white';
        container.style.color = '#222';
    }
    
    // Hide all task divs
    for (let i = 1; i <= 11; i++) {
        const el = document.getElementById(`task${i}`);
        if (el) el.classList.add('hidden');
    }
    console.log('Hidden all task divs');
    
    // Restore and show the specific task
    const taskEl = document.getElementById(`task${task.id}`);
    if (taskEl) {
        taskEl.classList.remove('hidden');
        console.log('Showed task div for task', task.id);
    }
    
    // Show tasksPage
    const tasksPage = document.getElementById('tasksPage');
    if (tasksPage) {
        tasksPage.classList.remove('hidden');
        console.log('Made tasksPage visible');
    }
    
    // Update task header
    const taskHeader = document.getElementById('taskHeader');
    if (taskHeader) {
        taskHeader.innerHTML = `
            <h2>🎮 Task ${state.currentTask + 1}/11: ${task.name}</h2>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(state.currentTask + 1) / 11 * 100}%"></div>
            </div>
        `;
        console.log('Updated task header');
    }
    
    // Reset tracking
    state.keystrokeEvents = [];
    state.mouseEvents = [];
    state.clickEvents = [];
    state.taskData[state.currentTask].input = '';
    state.taskData[state.currentTask].startTime = Date.now();
    console.log('Reset event tracking arrays for task', state.currentTask);
    console.log('Reset tracking for task', state.currentTask);
    
    // Initialize task-specific content
    if (task.type === 'typing' || task.type === 'typing+math') {
        console.log('Initializing typing task');
        initializeTypingTask(task);
    } else if (task.type === 'balloons') {
        console.log('Initializing balloon task');
        initializeBalloonTask(task);
    } else if (task.type === 'boxes') {
        console.log('Initializing box task');
        initializeBoxTask(task);
    } else if (task.type === 'math') {
        console.log('Initializing math task');
        initializeMathTask(task);
    }
    
    console.log('startActualTask completed for task:', task.name);
}

function initializeTypingTask(task) {
    const wordCount = Math.round(state.finalWpm * (task.duration / 60) * task.wordMultiplier);
    const words = generateWords(wordCount);
    const targetText = words.join(' ');
    
    // Set target text
    const targetId = `task${task.id}Words`;
    if (document.getElementById(targetId)) {
        document.getElementById(targetId).value = targetText;
    }
    
    // Clear input
    const inputId = `task${task.id}Input`;
    const inputEl = document.getElementById(inputId);
    if (inputEl) {
        console.log('[DEBUG] Found input element:', inputId);
        inputEl.value = '';
        inputEl.focus();
        
        // DIAGNOSTIC: Log input element properties
        console.log('[DEBUG] Input element properties:', {
            id: inputEl.id,
            type: inputEl.type,
            value: inputEl.value,
            visible: inputEl.offsetParent !== null,
            readonly: inputEl.readOnly,
            disabled: inputEl.disabled
        });
        
        // Create a unique tracking function for this task to ensure proper binding
        const keystrokeTracker = (e) => {
            console.log('[KEYSTROKE]', e.key, 'at', Date.now());
            state.keystrokeEvents.push({
                key: e.key || e.code,
                timestamp: Date.now(),
                type: e.type
            });
            console.log('[DEBUG] Total keystrokes so far:', state.keystrokeEvents.length);
        };
        
        const mouseTracker = (e) => {
            state.mouseEvents.push({
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now()
            });
            if (state.mouseEvents.length % 5 === 0) {
                console.log('[DEBUG] Total mouse events so far:', state.mouseEvents.length);
            }
        };
        
        // Remove old event listeners first to prevent duplicates
        inputEl.removeEventListener('keydown', trackKeystroke);
        inputEl.removeEventListener('keypress', trackKeystroke);
        inputEl.removeEventListener('keyup', trackKeystroke);
        inputEl.removeEventListener('mousedown', trackMouse);
        inputEl.removeEventListener('mouseup', trackMouse);
        inputEl.removeEventListener('mousemove', trackMouse);
        
        // Add event listeners using the new tracking functions
        inputEl.addEventListener('input', (e) => {
            state.taskData[state.currentTask].input = e.target.value;
            console.log('[INPUT UPDATE] Length:', e.target.value.length);
        });
        
        inputEl.addEventListener('keydown', keystrokeTracker);
        inputEl.addEventListener('keyup', keystrokeTracker);
        inputEl.addEventListener('keypress', keystrokeTracker);
        inputEl.addEventListener('mousedown', mouseTracker);
        inputEl.addEventListener('mouseup', mouseTracker);
        inputEl.addEventListener('mousemove', mouseTracker);
        
        console.log('[DEBUG] Event listeners attached to', inputId);
        console.log('[DEBUG] Task timing:', {
            taskId: task.id,
            duration: task.duration,
            wordCount: wordCount,
            wordMultiplier: task.wordMultiplier
        });
    } else {
        console.error('[ERROR] Input element not found:', inputId);
        console.error('[ERROR] Looking for element with ID:', `task${task.id}Input`);
        console.error('[ERROR] Available elements:', Array.from(document.querySelectorAll('input')).map(el => el.id));
    }
    
    // Task-specific initialization
    if (task.id === 1) {
        initializeMathTaskDuringTyping(task);
    } else if (task.id === 3) {
        initializeThemeChanging();
    } else if (task.id === 5) {
        initializeIncreasedLoadBlinking();
    } else if (task.id === 6) {
        initializeBlinking(words);
    } else if (task.id === 7) {
        initializeScrolling(targetText);
    } else if (task.id === 8) {
        initializeVanishing(words);
    } else if (task.id === 9) {
        initializeColorAvoidance(words);
    }
    
    startTaskTimer(task);
}

function initializeThemeChanging() {
    const themes = [
        { bg: '#ffffff', text: '#222', name: '🎨 Light', borderColor: '#667eea' },
        { bg: '#333333', text: '#ffffff', name: '🌙 Dark', borderColor: '#f44336' },
        { bg: '#e8f5e9', text: '#1b5e20', name: '🟢 Green', borderColor: '#4caf50' },
        { bg: '#e3f2fd', text: '#0d47a1', name: '🔵 Blue', borderColor: '#2196f3' },
        { bg: '#ffebee', text: '#c62828', name: '🔴 Red', borderColor: '#f44336' },
        { bg: '#fff9c4', text: '#f57f17', name: '🟡 Yellow', borderColor: '#fbc02d' }
    ];
    
    let themeIndex = 0;
    const themeDisplay = document.getElementById('themeDisplay');
    const mainContent = document.querySelector('.main-content');
    const container = document.querySelector('.container');
    
    const changeTheme = () => {
        const theme = themes[themeIndex % themes.length];
        
        // Update display box
        if (themeDisplay) {
            themeDisplay.textContent = theme.name;
            themeDisplay.style.background = theme.bg;
            themeDisplay.style.color = theme.text;
            themeDisplay.style.border = `3px solid ${theme.borderColor}`;
            themeDisplay.style.margin = '20px 0';
            themeDisplay.style.padding = '30px';
            themeDisplay.style.fontSize = '18px';
            themeDisplay.style.fontWeight = '700';
        }
        
        // Update main content area background
        if (mainContent) {
            mainContent.style.background = theme.bg;
            mainContent.style.color = theme.text;
        }
        
        // Update container
        if (container) {
            container.style.background = theme.bg;
            container.style.color = theme.text;
            container.style.borderColor = theme.borderColor;
        }
        
        // Update all textareas and labels in task3
        const task3 = document.getElementById('task3');
        if (task3 && !task3.classList.contains('hidden')) {
            const textareas = task3.querySelectorAll('textarea');
            textareas.forEach(ta => {
                ta.style.color = theme.text;
                ta.style.borderColor = theme.borderColor;
                ta.style.background = theme.bg === '#333333' ? '#444' : '#ffffff';
            });
            
            const labels = task3.querySelectorAll('.label');
            labels.forEach(label => {
                label.style.color = theme.text;
            });
        }
        
        themeIndex++;
    };
    
    changeTheme();
    state.themeIntervalId = setInterval(changeTheme, 10000);
}

function initializeIncreasedLoadBlinking() {
    const blinkingColumn = document.getElementById('task5BlinkingColumn');
    if (!blinkingColumn) return;
    
    // Set transition for smooth opacity changes
    blinkingColumn.style.transition = 'opacity 0.5s ease-in-out';
    blinkingColumn.style.opacity = '1';
    
    const startTime = Date.now();
    const duration = 60000; // 60 seconds task duration
    
    const startBlinking = () => {
        // Clear previous interval if exists
        if (state.blinkIntervalId) clearInterval(state.blinkIntervalId);
        
        const updateBlink = () => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed >= duration) {
                clearInterval(state.blinkIntervalId);
                blinkingColumn.style.opacity = '1';
                return;
            }
            
            // Progressive speed stages: slow blink that gets faster
            // 0-3s: 3000ms cycle, 3-15s: 2000ms, 15-30s: 1200ms, 30-45s: 800ms, 45-60s: 400ms
            let cycleTime;
            if (elapsed < 3000) {
                cycleTime = 3000;
            } else if (elapsed < 15000) {
                cycleTime = 2000;
            } else if (elapsed < 30000) {
                cycleTime = 1200;
            } else if (elapsed < 45000) {
                cycleTime = 800;
            } else {
                cycleTime = 400;
            }
            
            // Calculate opacity based on cycle position (0 to 0.5 = visible, 0.5 to 1 = dimmed)
            const posInCycle = (elapsed % cycleTime) / cycleTime;
            const targetOpacity = posInCycle < 0.5 ? 1 : 0.3;
            
            blinkingColumn.style.opacity = targetOpacity;
        };
        
        state.blinkIntervalId = setInterval(updateBlink, 50);
    };
    
    startBlinking();
}

function initializeMathTaskDuringTyping(task) {
    // Generate and show math problems during typing task 1
    if (!state.mathTaskProblems) {
        state.mathTaskProblems = [];
    }
    state.mathTaskProblems = [];
    generateMathProblemForTypingTask();
}

function generateMathProblemForTypingTask() {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    const operators = ['+', '-', '*'];
    const op = operators[Math.floor(Math.random() * 3)];
    
    let answer;
    if (op === '+') answer = num1 + num2;
    else if (op === '-') answer = num1 - num2;
    else answer = num1 * num2;
    
    const problem = { num1, num2, op, answer };
    state.mathTaskProblems.push(problem);
    
    const display = document.getElementById('task1MathDisplay');
    if (display) {
        display.textContent = `${num1} ${op} ${num2} = ?`;
    }
    
    // Generate options
    const options = [answer];
    while (options.length < 4) {
        let opt = Math.floor(Math.random() * 100);
        if (!options.includes(opt)) options.push(opt);
    }
    
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    const optionsGrid = document.getElementById('task1MathOptions');
    if (optionsGrid) {
        optionsGrid.innerHTML = options.map(opt => `
            <button class="option-btn" onclick="selectMathOptionDuringTyping(${opt}, ${answer})">
                ${opt}
            </button>
        `).join('');
    }
}

function selectMathOptionDuringTyping(selected, correct) {
    const isCorrect = selected === correct;
    if (isCorrect) {
        state.taskData[state.currentTask].solved = (state.taskData[state.currentTask].solved || 0) + 1;
    }
    
    // Generate next problem
    generateMathProblemForTypingTask();
}

function initializeBlinking(words) {
    const blinkingWords = document.getElementById('blinkingWords');
    blinkingWords.innerHTML = '';
    
    // Create word spans without animation
    words.forEach(word => {
        const span = document.createElement('span');
        span.className = 'blink-text';
        span.textContent = word;
        span.style.opacity = '1';
        span.style.transition = 'opacity 0.3s ease-in-out';
        blinkingWords.appendChild(span);
        blinkingWords.appendChild(document.createTextNode(' '));
    });
    
    // Start progressive blinking
    const startTime = Date.now();
    const duration = 60000; // 60 seconds task duration
    const blinkSpans = blinkingWords.querySelectorAll('.blink-text');
    
    let blinkInterval;
    
    const startBlinking = () => {
        if (blinkInterval) clearInterval(blinkInterval);
        
        const updateBlink = () => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed >= duration) {
                clearInterval(blinkInterval);
                // Make words fully visible at end
                blinkSpans.forEach(span => {
                    span.style.opacity = '1';
                });
                return;
            }
            
            // Calculate blink speed based on elapsed time
            // Starts slow (3s cycle) and speeds up to fast (0.4s cycle)
            let cycleTime;
            
            if (elapsed < 3000) {
                // First 3 seconds: very slow (3000ms cycle)
                cycleTime = 3000;
            } else if (elapsed < 15000) {
                // 3-15 seconds: slow (2000ms cycle)
                cycleTime = 2000;
            } else if (elapsed < 30000) {
                // 15-30 seconds: medium-slow (1200ms cycle)
                cycleTime = 1200;
            } else if (elapsed < 45000) {
                // 30-45 seconds: medium (800ms cycle)
                cycleTime = 800;
            } else {
                // 45-60 seconds: fast (400ms cycle)
                cycleTime = 400;
            }
            
            // Calculate position in current cycle (0 to 1)
            const posInCycle = (elapsed % cycleTime) / cycleTime;
            
            // Blink: opacity 1 for first half, opacity 0.2 for second half
            const targetOpacity = posInCycle < 0.5 ? 1 : 0.2;
            
            blinkSpans.forEach(span => {
                span.style.opacity = targetOpacity;
            });
        };
        
        // Update blink state every 50ms for smooth transitions
        blinkInterval = setInterval(updateBlink, 50);
    };
    
    startBlinking();
    
    // Store interval ID for cleanup
    state.blinkIntervalId = blinkInterval;
}

function initializeScrolling(text) {
    const scrollContent = document.querySelector('.scroll-content');
    scrollContent.textContent = text;
}

function initializeVanishing(words) {
    const container = document.getElementById('vanishingWords');
    container.innerHTML = '';
    
    words.forEach((word, index) => {
        const span = document.createElement('span');
        span.textContent = word + ' ';
        span.style.opacity = '1';
        container.appendChild(span);
        
        setTimeout(() => {
            span.style.opacity = '0.1';
        }, 1500 + index * 500);
    });
}

function initializeColorAvoidance(words) {
    const colored = document.getElementById('coloredWords');
    colored.innerHTML = '';
    
    // Mark every 3rd-4th word as red
    words.forEach((word, index) => {
        const span = document.createElement('span');
        span.className = 'word' + ((index % 4) === 0 ? ' colored' : '');
        span.textContent = word;
        colored.appendChild(span);
    });
}

function initializeBalloonTask(task) {
    const grid = document.getElementById('balloonGrid');
    grid.innerHTML = '';
    
    for (let i = 0; i < 50; i++) {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        balloon.textContent = '🎈';
        balloon.onclick = () => {
            balloon.remove();
            document.getElementById('balloonCount').textContent = 
                parseInt(document.getElementById('balloonCount').textContent) + 1;
            
            state.clickEvents.push({
                timestamp: Date.now(),
                x: event.clientX,
                y: event.clientY,
                type: 'balloon'
            });
        };
        grid.appendChild(balloon);
    }
    
    startTaskTimer(task);
}

function initializeBoxTask(task) {
    const grid = document.getElementById('boxGrid');
    grid.innerHTML = '';
    
    const boxes = [];
    for (let i = 0; i < 12; i++) boxes.push('red');
    for (let i = 0; i < 13; i++) boxes.push('blue');
    
    // Shuffle
    for (let i = boxes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [boxes[i], boxes[j]] = [boxes[j], boxes[i]];
    }
    
    boxes.forEach((color, index) => {
        const box = document.createElement('div');
        box.className = `box ${color}-box`;
        box.textContent = color === 'red' ? '🔴' : '🟦';
        box.style.opacity = '1';
        
        box.onclick = () => {
            if (color === 'red') {
                document.getElementById('redClicked').textContent = 
                    parseInt(document.getElementById('redClicked').textContent) + 1;
                box.style.opacity = '0.3';
            } else {
                box.style.opacity = '0';
                box.style.pointerEvents = 'none';
            }
            
            state.clickEvents.push({
                timestamp: Date.now(),
                x: event.clientX,
                y: event.clientY,
                color: color
            });
        };
        
        grid.appendChild(box);
    });
    
    startTaskTimer(task);
}

function initializeMathTask(task) {
    // Reset math problems array for this task
    mathProblems.length = 0;
    state.taskData[state.currentTask].solved = 0;
    document.getElementById('mathCorrect').textContent = '0';
    generateMathProblem();
    startTaskTimer(task);
}

const mathProblems = [];
function generateMathProblem() {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    const operators = ['+', '-', '*'];
    const op = operators[Math.floor(Math.random() * 3)];
    
    let answer;
    if (op === '+') answer = num1 + num2;
    else if (op === '-') answer = Math.abs(num1 - num2);
    else answer = num1 * num2;
    
    const problem = { num1, num2, op, answer };
    mathProblems.push(problem);
    
    document.getElementById('mathDisplay').textContent = `${num1} ${op} ${num2} = ?`;
    document.getElementById('mathCount').textContent = `${mathProblems.length}/10`;
    
    // Generate options
    const options = [answer];
    while (options.length < 4) {
        let opt = Math.floor(Math.random() * 100);
        if (!options.includes(opt)) options.push(opt);
    }
    
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    const optionsGrid = document.getElementById('mathOptions');
    optionsGrid.innerHTML = options.map(opt => `
        <button class="option-btn" onclick="selectMathOption(${opt}, ${answer})">
            ${opt}
        </button>
    `).join('');
}

function selectMathOption(selected, correct) {
    const isCorrect = selected === correct;
    if (isCorrect) {
        state.taskData[state.currentTask].solved++;
        document.getElementById('mathCorrect').textContent = state.taskData[state.currentTask].solved;
    }
    
    // Check if all 10 problems are complete
    if (mathProblems.length >= 10) {
        console.log('All 10 math problems completed! Auto-submitting task...');
        // Auto-submit the task when all 10 problems are done
        submitTask(state.currentTask);
        return;
    }
    
    if (mathProblems.length < 10) {
        setTimeout(generateMathProblem, 500);
    }
}

function startTaskTimer(task) {
    const startTime = Date.now();
    const duration = task.duration * 1000;
    
    // Store the timer interval ID so we can clear it later
    state.currentTaskTimerId = null;
    
    let timerInterval;
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
        
        const timerId = `task${task.id}Timer`;
        const timerEl = document.getElementById(timerId);
        if (timerEl) {
            timerEl.textContent = remaining;
            timerEl.className = 'timer' + (remaining <= 10 ? ' danger' : remaining <= 20 ? ' warning' : '');
        }
        
        if (remaining === 0) {
            clearInterval(timerInterval);
            state.currentTaskTimerId = null;
            
            // DEBUG: Log when timer expires
            console.log('Timer expired for Task ' + state.currentTask + ', calling submitTask...');
            
            // Auto-submit task when timer expires
            submitTask(state.currentTask);
        }
    }, 100);
    
    state.currentTaskTimerId = timerInterval;
}

function submitTask(taskIndex) {
    try {
        console.log('submitTask called for taskIndex:', taskIndex);
        
        // Clear the current task timer if it exists
        if (state.currentTaskTimerId !== null) {
            clearInterval(state.currentTaskTimerId);
            state.currentTaskTimerId = null;
        }
        
        // Prevent double-clicking/double-submission by disabling all buttons immediately
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
        buttons.forEach(btn => btn.disabled = true);
        
        console.log('Recording end time for task:', taskIndex);
        
        // Record end time
        if (state.taskData[taskIndex]) {
            state.taskData[taskIndex].endTime = Date.now();
        }
        
        // Calculate features for this task
        console.log('Calculating features for task:', taskIndex);
        try {
            calculateTaskFeatures(taskIndex);
            console.log('Features calculated successfully');
        } catch (e) {
            console.error('Error calculating features:', e);
        }
        
        // Calculate performance score for adaptive difficulty
        console.log('Calculating performance score for task:', taskIndex);
        try {
            const performanceScore = calculatePerformanceScore(taskIndex);
            state.performanceScore = performanceScore;
            
            // Determine difficulty for NEXT task based on this performance
            if (taskIndex < 10) {  // If not the last task
                const nextDifficulty = selectDifficultyForNextTask(performanceScore);
                state.currentDifficulty = nextDifficulty;
                console.log('Next task difficulty set to:', nextDifficulty);
            }
        } catch (e) {
            console.error('Error calculating performance score:', e);
        }
        
        // Increment to next task
        state.currentTask++;
        console.log('Incremented currentTask to:', state.currentTask);
        
        if (state.currentTask < 11) {
            console.log('More tasks remaining. Transitioning to task', state.currentTask);
            
            // Schedule transition
            setTimeout(() => {
                try {
                    console.log('In setTimeout: Preparing for next task briefing');
                    
                    const nextTask = state.tasks[state.currentTask];
                    console.log('Getting nextTask:', nextTask ? nextTask.name : 'null');
                    
                    if (!nextTask) {
                        throw new Error('nextTask is null or undefined');
                    }
                    
                    // Hide all current task divs
                    for (let i = 1; i <= 11; i++) {
                        const taskEl = document.getElementById(`task${i}`);
                        if (taskEl) taskEl.classList.add('hidden');
                    }
                    
                    // Show briefing
                    showTaskBriefing(nextTask);
                    console.log('showTaskBriefing called succesfully');
                } catch (e) {
                    console.error('Error in transition setTimeout:', e);
                    // Re-enable buttons on error
                    buttons.forEach(btn => btn.disabled = false);
                }
            }, 100);
        } else {
            console.log('All 11 tasks completed. Moving to results.');
            
            // All tasks completed - auto-save and show results
            setTimeout(() => {
                try {
                    console.log('In setTimeout: Calling compileResults and navigateTo results');
                    compileResults();
                    autoSaveResults(); // Auto-save before showing results page
                    navigateTo('results');
                    // Re-enable buttons so results page actions work
                    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => btn.disabled = false);
                } catch (e) {
                    console.error('Error navigating to results:', e);
                    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => btn.disabled = false);
                }
            }, 500);
        }
    } catch (e) {
        console.error('Fatal error in submitTask:', e);
        // Re-enable buttons on any error
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
        buttons.forEach(btn => btn.disabled = false);
    }
}

function skipTask() {
    try {
        console.log('skipTask called for taskIndex:', state.currentTask);
        
        // Clear the current task timer if it exists
        if (state.currentTaskTimerId !== null) {
            clearInterval(state.currentTaskTimerId);
            state.currentTaskTimerId = null;
        }
        
        // Prevent double-clicking by disabling all buttons immediately
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
        buttons.forEach(btn => btn.disabled = true);
        
        // Mark as skipped but still count the skip
        if (state.taskData[state.currentTask]) {
            state.taskData[state.currentTask].endTime = Date.now();
            state.taskData[state.currentTask].skipped = true;
        }
        
        // Calculate features for this skipped task
        try {
            calculateTaskFeatures(state.currentTask);
            console.log('Features calculated for skipped task');
        } catch (e) {
            console.error('Error calculating features for skipped task:', e);
        }
        
        // Calculate performance score for adaptive difficulty (even for skipped tasks)
        console.log('Calculating performance score for skipped task:', state.currentTask);
        try {
            const performanceScore = calculatePerformanceScore(state.currentTask);
            state.performanceScore = performanceScore;
            
            // Determine difficulty for NEXT task based on this performance
            if (state.currentTask < 10) {  // If not the last task
                const nextDifficulty = selectDifficultyForNextTask(performanceScore);
                state.currentDifficulty = nextDifficulty;
                console.log('Next task difficulty set to:', nextDifficulty);
            }
        } catch (e) {
            console.error('Error calculating performance score for skipped task:', e);
        }
        
        // Move to next task
        state.currentTask++;
        console.log('Skipped task, incremented to:', state.currentTask);
        
        if (state.currentTask < 11) {
            setTimeout(() => {
                try {
                    console.log('In skipTask setTimeout: Preparing next briefing');
                    
                    // Hide all current tasks
                    for (let i = 1; i <= 11; i++) {
                        const taskEl = document.getElementById(`task${i}`);
                        if (taskEl) taskEl.classList.add('hidden');
                    }
                    
                    const nextTask = state.tasks[state.currentTask];
                    if (!nextTask) {
                        throw new Error('nextTask is null or undefined after skip');
                    }
                    
                    showTaskBriefing(nextTask);
                    console.log('showTaskBriefing called from skipTask');
                } catch (e) {
                    console.error('Error in skipTask transition:', e);
                    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
                    buttons.forEach(btn => btn.disabled = false);
                }
            }, 100);
        } else {
            console.log('All tasks skipped, moving to results');
            setTimeout(() => {
                try {
                    compileResults();
                    autoSaveResults();
                    navigateTo('results');
                    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => btn.disabled = false);
                } catch (e) {
                    console.error('Error navigating to results from skipTask:', e);
                    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => btn.disabled = false);
                }
            }, 500);
        }
    } catch (e) {
        console.error('Fatal error in skipTask:', e);
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
        buttons.forEach(btn => btn.disabled = false);
    }
}

// ==================== FEATURE CALCULATION ====================

function calculateTaskFeatures(taskIndex) {
    console.log('\n' + '='.repeat(60));
    console.log('[FEATURE CALCULATION] Starting for Task', taskIndex + 1);
    console.log('='.repeat(60));
    
    const data = state.taskData[taskIndex];
    const duration = (data.endTime - data.startTime) / 1000;
    
    // DEBUG: Log event counts
    console.log('[FEATURE CALCULATION] TASK DATA:');
    console.log('  Duration:', duration.toFixed(2), 'seconds');
    console.log('  Keystroke events captured:', state.keystrokeEvents.length);
    console.log('  Mouse events captured:', state.mouseEvents.length);
    console.log('  Click events captured:', state.clickEvents.length);
    console.log('  Typed input length:', (data.input || '').length, 'characters');
    
    if (state.keystrokeEvents.length === 0 && state.mouseEvents.length === 0) {
        console.error('[FEATURE CALCULATION] ❌ NO EVENTS CAPTURED! Event listeners may not be attached correctly');
    }
    
    // Initialize all 14 features with 0
    const features = {
        typing_speed: 0,
        error_rate: 0,
        backspace_rate: 0,
        burst_typing_duration: 0,
        sentence_pause: 0,
        key_interval_variance: 0,
        correction_latency: 0,
        typing_rhythm_entropy: 0,
        cursor_speed_mean: 0,
        cursor_speed_variance: 0,
        cursor_path_efficiency: 0,
        click_rate: 0,
        hover_time_before_click: 0,
        cursor_movement_entropy: 0
    };
    
    const task = state.tasks[taskIndex];
    console.log('Task type:', task.type);
    
    // Calculate typing features for typing-based tasks
    if (task.type === 'typing' || task.type === 'typing+math') {
        const input = data.input || '';
        const chars = input.length;
        const words = input.trim().split(/\s+/).filter(w => w.length > 0).length;
        console.log('Typing task - Characters:', chars, 'Words:', words);
        
        features.typing_speed = Math.min(120, Math.max(0, (chars / 5) / (duration / 60)));
        features.error_rate = calculateErrorRate(input, taskIndex);
        features.backspace_rate = calculateBackspaceRate(taskIndex);
        features.burst_typing_duration = calculateBurstDuration(taskIndex);
        features.sentence_pause = calculateSentencePause(taskIndex);
        features.key_interval_variance = calculateKeyVariance(taskIndex);
        features.correction_latency = calculateCorrectionLatency(taskIndex);
        features.typing_rhythm_entropy = calculateTypingEntropy(taskIndex);
    }
    
    // Calculate mouse features for all tasks
    features.cursor_speed_mean = calculateCursorSpeedMean(taskIndex);
    features.cursor_speed_variance = calculateCursorSpeedVariance(taskIndex);
    features.cursor_path_efficiency = calculateCursorPathEfficiency(taskIndex);
    features.click_rate = calculateClickRate(taskIndex, duration);
    features.hover_time_before_click = calculateHoverTimeBeforeClick(taskIndex);
    features.cursor_movement_entropy = calculateCursorMovementEntropy(taskIndex);
    
    data.features = features;
    
    // DEBUG: Log calculated features
    console.log('Calculated features:');
    console.log('  Typing Speed:', features.typing_speed.toFixed(2));
    console.log('  Error Rate:', features.error_rate.toFixed(4));
    console.log('  Backspace Rate:', features.backspace_rate.toFixed(4));
    console.log('  Burst Duration:', features.burst_typing_duration.toFixed(2));
    console.log('  Sentence Pause:', features.sentence_pause.toFixed(2));
    console.log('  Click Rate:', features.click_rate.toFixed(2));
    console.log('  Hover Time:', features.hover_time_before_click.toFixed(2));
    console.log('=== END TASK', taskIndex + 1, '===\n');
}

function calculateErrorRate(input, taskIndex) {
    if (state.keystrokeEvents.length === 0) return 0;
    
    // Count backspace events as errors (indicate corrections needed)
    let backspaceCount = 0;
    for (let i = 0; i < state.keystrokeEvents.length; i++) {
        const event = state.keystrokeEvents[i];
        if (event.key === 'Backspace') {
            backspaceCount++;
        }
    }
    
    // Error rate = backspace count / total keystrokes
    const errorRate = backspaceCount / state.keystrokeEvents.length;
    return Math.min(1.0, Math.max(0, errorRate));
}

function calculateBackspaceRate(taskIndex) {
    if (state.keystrokeEvents.length === 0) return 0;
    
    let backspaceCount = 0;
    let consecutiveBackspace = false;
    
    // Group consecutive backspaces (<100ms apart) as single event
    for (let i = 0; i < state.keystrokeEvents.length; i++) {
        const event = state.keystrokeEvents[i];
        if (event.key === 'Backspace') {
            if (!consecutiveBackspace) {
                backspaceCount++;
                consecutiveBackspace = true;
            } else if (i > 0 && event.timestamp - state.keystrokeEvents[i-1].timestamp > 100) {
                backspaceCount++;
            }
        } else {
            consecutiveBackspace = false;
        }
    }
    
    const backspaceRate = backspaceCount / state.keystrokeEvents.length;
    return Math.min(1.0, Math.max(0, backspaceRate));
}

function calculateBurstDuration(taskIndex) {
    if (state.keystrokeEvents.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < state.keystrokeEvents.length; i++) {
        const interval = state.keystrokeEvents[i].timestamp - state.keystrokeEvents[i-1].timestamp;
        // Exclude pauses > 50s (external distraction)
        if (interval < 50000) {
            intervals.push(interval);
        }
    }
    
    if (intervals.length === 0) return 0;
    
    // Maximum pause between consecutive keystrokes
    const maxPause = Math.max(...intervals);
    return maxPause / 1000; // Convert to seconds
}

function calculateSentencePause(taskIndex) {
    if (state.keystrokeEvents.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < state.keystrokeEvents.length; i++) {
        const interval = state.keystrokeEvents[i].timestamp - state.keystrokeEvents[i-1].timestamp;
        // Only consider pauses > 1s and < 15s
        if (interval > 1000 && interval < 15000) {
            intervals.push(interval);
        }
    }
    
    if (intervals.length === 0) return 0;
    
    // Average of pauses > 1s
    const sum = intervals.reduce((a, b) => a + b, 0);
    return (sum / intervals.length) / 1000; // Convert to seconds
}

function calculateKeyVariance(taskIndex) {
    if (state.keystrokeEvents.length < 3) return 0;
    
    const intervals = [];
    for (let i = 1; i < state.keystrokeEvents.length; i++) {
        const interval = state.keystrokeEvents[i].timestamp - state.keystrokeEvents[i-1].timestamp;
        if (interval < 50000) {
            intervals.push(interval);
        }
    }
    
    if (intervals.length < 2) return 0;
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev / 1000; // Convert to seconds
}

function calculateCorrectionLatency(taskIndex) {
    if (state.keystrokeEvents.length < 2) return 0;
    
    let correctionLatencies = [];
    
    for (let i = 0; i < state.keystrokeEvents.length - 1; i++) {
        const event = state.keystrokeEvents[i];
        const nextEvent = state.keystrokeEvents[i + 1];
        
        // If next event is backspace within 10s, this is a correction
        if (nextEvent.key === 'Backspace' && nextEvent.timestamp - event.timestamp < 10000) {
            const latency = nextEvent.timestamp - event.timestamp;
            correctionLatencies.push(latency);
        }
    }
    
    if (correctionLatencies.length === 0) return 0;
    
    const avgLatency = correctionLatencies.reduce((a, b) => a + b, 0) / correctionLatencies.length;
    return avgLatency / 1000; // Convert to seconds
}

function calculateTypingEntropy(taskIndex) {
    // Requires minimum 30 keystrokes
    if (state.keystrokeEvents.length < 30) return 0;
    
    const intervals = [];
    for (let i = 1; i < state.keystrokeEvents.length; i++) {
        const interval = state.keystrokeEvents[i].timestamp - state.keystrokeEvents[i-1].timestamp;
        if (interval < 50000) {
            intervals.push(Math.round(interval / 50)); // Bucket by 50ms
        }
    }
    
    // Calculate frequency distribution
    const freq = {};
    intervals.forEach(i => freq[i] = (freq[i] || 0) + 1);
    
    // Calculate entropy: -sum(p_i * log2(p_i))
    let entropy = 0;
    const total = intervals.length;
    Object.values(freq).forEach(count => {
        const p = count / total;
        if (p > 0) {
            entropy -= p * Math.log2(p);
        }
    });
    
    return entropy;
}

function calculateCursorSpeedMean(taskIndex) {
    if (state.mouseEvents.length < 2) return 0;
    
    const speeds = [];
    for (let i = 1; i < state.mouseEvents.length; i++) {
        const prev = state.mouseEvents[i - 1];
        const curr = state.mouseEvents[i];
        
        const distance = Math.sqrt(
            Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
        );
        const time = (curr.timestamp - prev.timestamp) / 1000; // seconds
        
        if (time > 0 && time < 1) { // Exclude unrealistic values
            const speed = distance / time;
            if (speed < 10000) { // Filter outliers
                speeds.push(speed);
            }
        }
    }
    
    if (speeds.length === 0) return 0;
    
    const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    return mean;
}

function calculateCursorSpeedVariance(taskIndex) {
    if (state.mouseEvents.length < 2) return 0;
    
    const speeds = [];
    for (let i = 1; i < state.mouseEvents.length; i++) {
        const prev = state.mouseEvents[i - 1];
        const curr = state.mouseEvents[i];
        
        const distance = Math.sqrt(
            Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
        );
        const time = (curr.timestamp - prev.timestamp) / 1000;
        
        if (time > 0 && time < 1) {
            const speed = distance / time;
            if (speed < 10000) {
                speeds.push(speed);
            }
        }
    }
    
    if (speeds.length < 2) return 0;
    
    const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / speeds.length;
    
    return Math.sqrt(variance);
}

function calculateCursorPathEfficiency(taskIndex) {
    if (state.mouseEvents.length < 2) return 0;
    
    let totalDistance = 0;
    let straightDistance = 0;
    
    for (let i = 1; i < state.mouseEvents.length; i++) {
        const prev = state.mouseEvents[i - 1];
        const curr = state.mouseEvents[i];
        
        const distance = Math.sqrt(
            Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
        );
        totalDistance += distance;
        
        // For efficiency, compare with straight line from first to last position
        if (i === state.mouseEvents.length - 1) {
            straightDistance = Math.sqrt(
                Math.pow(curr.x - state.mouseEvents[0].x, 2) + 
                Math.pow(curr.y - state.mouseEvents[0].y, 2)
            );
        }
    }
    
    if (straightDistance === 0 || totalDistance === 0) return 1.0;
    
    // Efficiency = straight line distance / actual path distance
    return Math.min(1.0, straightDistance / totalDistance);
}

function calculateClickRate(taskIndex, duration) {
    if (duration === 0) return 0;
    
    const clicks = state.clickEvents.length || 
                   state.taskData[taskIndex].clicks.length || 0;
    
    return clicks / duration; // clicks per second
}

function calculateHoverTimeBeforeClick(taskIndex) {
    if (state.clickEvents.length === 0) return 0;
    
    let hoverTimes = [];
    
    // For each click, find the time spent hovering (minimal movement) before it
    state.clickEvents.forEach(clickEvent => {
        // Look at mouse events before this click
        const eventsBeforeClick = state.mouseEvents.filter(me => me.timestamp <= clickEvent.timestamp);
        
        if (eventsBeforeClick.length > 1) {
            // Find period of minimal movement (hover)
            let hoverStart = eventsBeforeClick[eventsBeforeClick.length - 1].timestamp;
            let threshold = 5; // px
            
            for (let i = eventsBeforeClick.length - 2; i >= 0; i--) {
                const distance = Math.sqrt(
                    Math.pow(eventsBeforeClick[i+1].x - eventsBeforeClick[i].x, 2) +
                    Math.pow(eventsBeforeClick[i+1].y - eventsBeforeClick[i].y, 2)
                );
                
                if (distance < threshold) {
                    hoverStart = eventsBeforeClick[i].timestamp;
                } else {
                    break;
                }
            }
            
            const hoverDuration = (clickEvent.timestamp - hoverStart) / 1000;
            if (hoverDuration >= 0 && hoverDuration < 10) { // Reasonable range
                hoverTimes.push(hoverDuration);
            }
        }
    });
    
    if (hoverTimes.length === 0) return 0;
    
    return hoverTimes.reduce((a, b) => a + b, 0) / hoverTimes.length;
}

function calculateCursorMovementEntropy(taskIndex) {
    if (state.mouseEvents.length < 10) return 0;
    
    const directions = [];
    
    for (let i = 1; i < state.mouseEvents.length; i++) {
        const prev = state.mouseEvents[i - 1];
        const curr = state.mouseEvents[i];
        
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        
        if (dx === 0 && dy === 0) continue;
        
        // Determine direction (8 directions: N, NE, E, SE, S, SW, W, NW)
        const angle = Math.atan2(dy, dx);
        const direction = Math.round((angle + Math.PI) / (Math.PI / 4));
        
        directions.push(direction);
    }
    
    if (directions.length === 0) return 0;
    
    // Calculate entropy of direction distribution
    const freq = {};
    directions.forEach(d => freq[d] = (freq[d] || 0) + 1);
    
    let entropy = 0;
    const total = directions.length;
    Object.values(freq).forEach(count => {
        const p = count / total;
        if (p > 0) {
            entropy -= p * Math.log2(p);
        }
    });
    
    return entropy;
}

// ==================== PERFORMANCE SCORING ====================
// Calculate a 0-100 performance score for the just-completed task
// Score reflects how well user performed (speed, accuracy, consistency)
// Used to determine difficulty of next task (EASY/MEDIUM/HARD)
// Scientific Justification: Performance-based adaptation ensures optimal challenge level
// (Csikszentmihalyi's Flow Theory - challenge must match skill)

function calculatePerformanceScore(taskIndex) {
    const features = state.taskData[taskIndex].features;
    
    console.log('\n[PERFORMANCE SCORING] Task', taskIndex + 1);
    console.log('[PERFORMANCE SCORING] Features available:', features);
    
    if (!features || Object.keys(features).length === 0) {
        console.log('[PERFORMANCE SCORING] No features available, returning default 50 (MEDIUM)');
        return 50; // Default to MEDIUM difficulty if no data
    }
    
    let scores = [];
    
    // 1. TYPING SPEED COMPONENT (0-25 points)
    // High WPM indicates good performance (aim for >80 WPM)
    const wpmScore = Math.min(25, (features.typing_speed || 0) / 80 * 25);
    scores.push(wpmScore);
    console.log('  [WPM] Typing Speed:', (features.typing_speed || 0).toFixed(1), '→ Score:', wpmScore.toFixed(1), '/ 25');
    
    // 2. ACCURACY COMPONENT (0-25 points)
    // Low error rate indicates accuracy (aim for <5% errors)
    const errorScore = Math.max(0, 25 - ((features.error_rate || 0) * 250)); // 0.1 error = 25 point loss
    scores.push(Math.min(25, errorScore));
    console.log('  [ERR] Error Rate:', ((features.error_rate || 0) * 100).toFixed(2), '% → Score:', Math.min(25, errorScore).toFixed(1), '/ 25');
    
    // 3. CONSISTENCY COMPONENT (0-25 points)
    // Low variance in keystroke intervals indicates rhythm consistency
    const varianceScore = Math.max(0, 25 - ((features.key_interval_variance || 0) / 100 * 25));
    scores.push(Math.min(25, varianceScore));
    console.log('  [CON] Key Variance:', (features.key_interval_variance || 0).toFixed(2), '→ Score:', Math.min(25, varianceScore).toFixed(1), '/ 25');
    
    // 4. EFFICIENCY COMPONENT (0-25 points)
    // High cursor path efficiency + low backspace rate indicates efficient execution
    const efficiencyScore = ((features.cursor_path_efficiency || 0) * 12.5) + (Math.max(0, 12.5 - ((features.backspace_rate || 0) * 125)));
    scores.push(Math.min(25, efficiencyScore));
    console.log('  [EFF] Path Eff:', (features.cursor_path_efficiency || 0).toFixed(2), 'Backspace:', ((features.backspace_rate || 0) * 100).toFixed(2), '% → Score:', Math.min(25, efficiencyScore).toFixed(1), '/ 25');
    
    // Total performance score (0-100)
    const totalScore = scores.reduce((a, b) => a + b, 0);
    console.log('[PERFORMANCE SCORING] TOTAL SCORE:', totalScore.toFixed(1), '/ 100');
    
    return Math.min(100, Math.max(0, totalScore));
}

// ==================== DIFFICULTY SELECTION ====================
// Determine next task difficulty based on previous task performance score

function selectDifficultyForNextTask(performanceScore) {
    // Performance Score ranges:
    // 0-40: Struggling - set to EASY
    // 40-70: On track - keep MEDIUM
    // 70-100: Excelling - increase to HARD
    
    let difficulty = 'MEDIUM';
    
    if (performanceScore < 40) {
        difficulty = 'EASY';
        console.log('[Adaptive System] Performance', performanceScore.toFixed(1), 'is LOW - Next task set to EASY');
    } else if (performanceScore >= 70) {
        difficulty = 'HARD';
        console.log('[Adaptive System] Performance', performanceScore.toFixed(1), 'is HIGH - Next task set to HARD');
    } else {
        console.log('[Adaptive System] Performance', performanceScore.toFixed(1), 'is MEDIUM - Keeping MEDIUM difficulty');
    }
    
    return difficulty;
}

// ==================== EVENT TRACKING ====================

function trackKeystroke(e) {
    // Store keystroke with key information
    state.keystrokeEvents.push({
        key: e.key || e.code,
        timestamp: Date.now(),
        type: e.type
    });
    console.log('Keystroke tracked:', e.key, '| Total keystrokes:', state.keystrokeEvents.length);
}

function trackMouse(e) {
    state.mouseEvents.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
    });
    // Log every 10th mouse event to avoid console spam
    if (state.mouseEvents.length % 10 === 0) {
        console.log('Mouse events tracked:', state.mouseEvents.length);
    }
}

function trackClick(e) {
    state.clickEvents.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
    });
}

// ==================== RESULTS & COMPILATION ====================

function compileResults() {
    const allFeatures = {
        typing_speed: 0,
        error_rate: 0,
        backspace_rate: 0,
        burst_typing_duration: 0,
        sentence_pause: 0,
        key_interval_variance: 0,
        correction_latency: 0,
        typing_rhythm_entropy: 0,
        cursor_speed_mean: 0,
        cursor_speed_variance: 0,
        cursor_path_efficiency: 0,
        click_rate: 0,
        hover_time_before_click: 0,
        cursor_movement_entropy: 0,
    };
    
    // Aggregate features from all tasks
    let featureCount = 0;
    Object.keys(state.taskData).forEach(taskIndex => {
        const features = state.taskData[taskIndex].features;
        Object.keys(features).forEach(feature => {
            allFeatures[feature] += features[feature];
            featureCount++;
        });
    });
    
    // Calculate cognitive load score
    let stressPoints = 0;
    if (allFeatures.error_rate > 0.1) stressPoints += 2;
    if (allFeatures.typing_speed < state.finalWpm * 0.8) stressPoints += 2;
    if (allFeatures.burst_typing_duration > 2) stressPoints += 1;
    if (allFeatures.sentence_pause > 3) stressPoints += 1;
    if (allFeatures.click_rate > 3) stressPoints += 2;
    
    let cognitiveLoad = 'MEDIUM';
    if (stressPoints < 5) cognitiveLoad = 'LOW';
    else if (stressPoints >= 10) cognitiveLoad = 'HIGH';
    
    // Store results with Session ID
    state.results = {
        userId: state.userId,
        sessionId: state.userId,
        timestamp: new Date().toLocaleString(),
        finalWpm: state.finalWpm,
        cognitiveLoad: cognitiveLoad,
        stressPoints: stressPoints,
        features: allFeatures
    };
}

function displayResults() {
    if (!state.results) {
        navigateTo('home');
        return;
    }
    
    const result = state.results;
    
    document.getElementById('resultUser').textContent = result.userId;
    document.getElementById('resultWpm').textContent = result.finalWpm;
    
    const badge = document.getElementById('cogLoadBadge');
    badge.textContent = result.cognitiveLoad;
    badge.className = `metric-value cog-${result.cognitiveLoad.toLowerCase()}`;
    
    // Fill feature table
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = Object.entries(result.features).map(([key, val]) => `
        <tr>
            <td>${key.replace(/_/g, ' ').toUpperCase()}</td>
            <td>${typeof val === 'number' ? val.toFixed(2) : val}</td>
        </tr>
    `).join('');
    
    updateSidebar();
}

// ==================== AUTO-SAVE (called at end of last task) ====================

function autoSaveResults() {
    if (!state.results) return;
    
    // Check if already saved this session to avoid duplicates
    if (state._resultsSaved) {
        console.log('Results already auto-saved for this session, skipping.');
        return;
    }
    
    const allData = JSON.parse(localStorage.getItem('allData') || '[]');
    
    for (let taskIndex = 0; taskIndex < 11; taskIndex++) {
        const taskData = state.taskData[taskIndex];
        const features = taskData.features || {};
        
        let stressPoints = 0;
        if (features.error_rate > 0.1) stressPoints += 2;
        if (features.typing_speed && features.typing_speed < state.finalWpm * 0.8) stressPoints += 2;
        if (features.burst_typing_duration > 2) stressPoints += 1;
        if (features.sentence_pause > 3) stressPoints += 1;
        if (features.click_rate > 3) stressPoints += 2;
        
        let cogLoad = 'MEDIUM';
        if (stressPoints < 5) cogLoad = 'LOW';
        else if (stressPoints >= 10) cogLoad = 'HIGH';
        
        const row = {
            secession_id: state.userId,
            task_id: taskIndex + 1,
            difficulty_level: taskData.difficulty || 'MEDIUM',
            typing_speed: (features.typing_speed || 0).toFixed(2),
            error_rate: (features.error_rate || 0).toFixed(4),
            backspace_rate: (features.backspace_rate || 0).toFixed(4),
            burst_typing_duration: (features.burst_typing_duration || 0).toFixed(2),
            sentence_pause: (features.sentence_pause || 0).toFixed(2),
            key_interval_variance: (features.key_interval_variance || 0).toFixed(4),
            correction_latency: (features.correction_latency || 0).toFixed(2),
            typing_rhythm_entropy: (features.typing_rhythm_entropy || 0).toFixed(4),
            cursor_speed_mean: (features.cursor_speed_mean || 0).toFixed(2),
            cursor_speed_variance: (features.cursor_speed_variance || 0).toFixed(2),
            cursor_path_efficiency: (features.cursor_path_efficiency || 0).toFixed(4),
            click_rate: (features.click_rate || 0).toFixed(2),
            hover_time_before_click: (features.hover_time_before_click || 0).toFixed(2),
            cursor_movement_entropy: (features.cursor_movement_entropy || 0).toFixed(4),
            cognitive_load: cogLoad,
            timestamp: state.results.timestamp,
            final_wpm: state.finalWpm
        };
        
        allData.push(row);
    }
    
    localStorage.setItem('allData', JSON.stringify(allData));
    state._resultsSaved = true;
    console.log('✅ Auto-saved results for Session ID:', state.userId);
}


function saveResults() {
    if (!state.results) return;
    
    if (state._resultsSaved) {
        showToast('✅ Results already saved! Session ID: ' + state.userId);
        return;
    }
    
    // Manual save path (if auto-save didn't run for some reason)
    autoSaveResults();
    showToast('✅ All 11 task results saved! Session ID: ' + state.userId);
}

// ==================== TOAST NOTIFICATION ====================

function showToast(message) {
    // Remove any existing toast
    const existing = document.getElementById('appToast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'appToast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #323232;
        color: white;
        padding: 14px 24px;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        z-index: 99999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transition: opacity 0.4s ease;
        opacity: 1;
        max-width: 90vw;
        text-align: center;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ==================== DATA PAGE ====================

function loadData() {
    const allData = JSON.parse(localStorage.getItem('allData') || '[]');
    
    const tbody = document.getElementById('dataTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = allData.map(record => `
        <tr>
            <td>${record.secession_id}</td>
            <td>${record.task_id || '-'}</td>
            <td><span class="difficulty-badge difficulty-${record.difficulty_level ? record.difficulty_level.toLowerCase() : 'medium'}">${record.difficulty_level || 'MEDIUM'}</span></td>
            <td>${record.final_wpm || '-'}</td>
            <td>${record.typing_speed || '0.00'}</td>
            <td>${record.error_rate || '0.00'}</td>
            <td>${record.backspace_rate || '0.00'}</td>
            <td>${record.burst_typing_duration || '0.00'}</td>
            <td>${record.sentence_pause || '0.00'}</td>
            <td>${record.key_interval_variance || '0.00'}</td>
            <td>${record.correction_latency || '0.00'}</td>
            <td>${record.typing_rhythm_entropy || '0.00'}</td>
            <td>${record.cursor_speed_mean || '0.00'}</td>
            <td>${record.cursor_speed_variance || '0.00'}</td>
            <td>${record.cursor_path_efficiency || '0.00'}</td>
            <td>${record.click_rate || '0.00'}</td>
            <td>${record.hover_time_before_click || '0.00'}</td>
            <td>${record.cursor_movement_entropy || '0.00'}</td>
            <td><span class="cog-load-badge cog-${record.cognitive_load ? record.cognitive_load.toLowerCase() : 'medium'}">${record.cognitive_load || 'MEDIUM'}</span></td>
            <td>${record.timestamp || '-'}</td>
        </tr>
    `).join('');
}

function downloadData() {
    const allData = JSON.parse(localStorage.getItem('allData') || '[]');
    
    // CSV header with all 14 features
    let csv = 'Secession_ID,Task_ID,Difficulty_Level,typing_speed (WPM),error_rate,backspace_rate,burst_typing_duration (s),sentence_pause (s),key_interval_variance,correction_latency,typing_rhythm_entropy,cursor_speed_mean (px/s),cursor_speed_variance,cursor_path_efficiency,click_rate (click/s),hover_time_before_click (s),cursor_movement_entropy,cognitive_load,Final_WPM,Timestamp\n';
    
    // Add each row with all 14 features
    allData.forEach(record => {
        csv += `${record.secession_id},${record.task_id},${record.difficulty_level || 'MEDIUM'},${record.typing_speed},${record.error_rate},${record.backspace_rate},${record.burst_typing_duration},${record.sentence_pause},${record.key_interval_variance},${record.correction_latency},${record.typing_rhythm_entropy},${record.cursor_speed_mean},${record.cursor_speed_variance},${record.cursor_path_efficiency},${record.click_rate},${record.hover_time_before_click},${record.cursor_movement_entropy},${record.cognitive_load},${record.final_wpm},${record.timestamp}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cognitive_load_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

function clearData() {
    if (confirm('Are you sure? This will delete all data.')) {
        localStorage.removeItem('allData');
        loadData();
    }
}

// ==================== UTILITIES ====================

function generateWords(count) {
    const words = [];
    for (let i = 0; i < count; i++) {
        words.push(state.wordPool[Math.floor(Math.random() * state.wordPool.length)]);
    }
    return words;
}

function updateSidebar() {
    try {
        // Safely update user ID
        const userIdEl = document.getElementById('sidebarUserId');
        if (userIdEl) {
            userIdEl.textContent = state.userId;
        }
        
        // Safely update WPM info
        if (state.finalWpm > 0) {
            const wpmInfoEl = document.getElementById('wpmInfo');
            const wpmTextEl = document.getElementById('sidebarWpm');
            if (wpmInfoEl) wpmInfoEl.style.display = 'block';
            if (wpmTextEl) wpmTextEl.textContent = state.finalWpm + ' WPM';
        }
        
        // Safely update progress info
        if (state.currentTask >= 0) {
            const progressInfoEl = document.getElementById('progressInfo');
            const progressFillEl = document.getElementById('sidebarProgress');
            const taskCountEl = document.getElementById('taskCount');
            
            if (progressInfoEl) progressInfoEl.style.display = 'block';
            if (progressFillEl) {
                const progress = Math.min(100, (state.currentTask + 1) / 11 * 100);
                progressFillEl.style.width = progress + '%';
            }
            if (taskCountEl) {
                taskCountEl.textContent = `${Math.min(state.currentTask + 1, 11)}/11`;
            }
        }
    } catch (e) {
        console.error('[Sidebar Error]', e.message);
    }
}

function newSession() {
    // Clear session ID to generate new one
    sessionStorage.removeItem('sessionId');
    
    // Generate new unique Session ID
    // Format: SID-{timestamp}-{random}
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    const tempId = `SID-${timestamp}-${random}`;
    sessionStorage.setItem('sessionId', tempId);
    state.userId = tempId;
    
    console.log('New Session ID created:', state.userId);
    
    // Reset state
    state.currentTask = -1;
    state.calibrationWpms = [];
    state.finalWpm = 0;
    state.keystrokeEvents = [];
    state.mouseEvents = [];
    state.clickEvents = [];
    state.results = null;
    state._resultsSaved = false;
    
    updateSidebar();
    navigateTo('home');
    showToast('✅ New session started: ' + state.userId);
}

function setupEventListeners() {
    // Global keyboard/mouse tracking
    document.addEventListener('keydown', trackKeystroke);
    document.addEventListener('mousemove', trackMouse);
    document.addEventListener('click', (e) => {
        state.clickEvents.push({
            timestamp: Date.now(),
            x: e.clientX,
            y: e.clientY
        });
    });
}
