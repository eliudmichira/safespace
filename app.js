document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Logic ---
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    function switchSection(sectionId) {
        sections.forEach(s => s.classList.remove('active'));
        navLinks.forEach(l => l.classList.remove('active'));

        const targetSection = document.getElementById(sectionId);
        const targetLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);

        if (targetSection) targetSection.classList.add('active');
        if (targetLink) targetLink.classList.add('active');
        
        window.scrollTo(0, 0);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.dataset.section);
        });
    });

    // --- Home Buttons ---
    document.getElementById('start-report-btn').addEventListener('click', () => switchSection('report'));
    document.getElementById('start-counseling-btn').addEventListener('click', () => switchSection('counsel'));

    // --- SOS Trigger Logic (Press & Hold) ---
    const mainSosBtn = document.getElementById('main-sos-trigger');
    const sosOverlay = document.getElementById('sos-overlay');
    const sosCounter = document.querySelector('.sos-counter');
    const cancelSosBtn = document.querySelector('.cancel-sos');
    
    let sosTimer;
    let countdownInterval;
    let isSosActivating = false;

    function startSosSequence() {
        if (isSosActivating) return;
        isSosActivating = true;
        sosOverlay.style.display = 'flex';
        
        let count = 3;
        sosCounter.textContent = count;
        
        countdownInterval = setInterval(() => {
            count--;
            sosCounter.textContent = count;
            if (count <= 0) {
                clearInterval(countdownInterval);
                triggerSosFinal();
            }
        }, 1000);
    }

    function triggerSosFinal() {
        sosCounter.textContent = '!!!';
        document.querySelector('.sos-title').textContent = 'ALERTS SENT SUCCESSFULLY';
        document.querySelector('.sos-countdown-container p').textContent = 'Security dispatch is on the way. Stay calm.';
        cancelSosBtn.textContent = 'Close';
        
        // Update dashboard stat
        const activeAlerts = document.querySelector('.stat-value.pulse-text');
        activeAlerts.textContent = parseInt(activeAlerts.textContent) + 1;
    }

    function resetSos() {
        clearInterval(countdownInterval);
        sosOverlay.style.display = 'none';
        isSosActivating = false;
        document.querySelector('.sos-title').textContent = 'ACTIVATING EMERGENCY ALERTS';
        document.querySelector('.sos-countdown-container p').textContent = 'Notifying JKUAT Security & Juja NPS...';
        cancelSosBtn.textContent = 'Cancel';
    }

    // Long press simulation
    let pressTimer;
    mainSosBtn.addEventListener('mousedown', () => {
        pressTimer = setTimeout(startSosSequence, 500); // 0.5s hold to activate
    });
    mainSosBtn.addEventListener('mouseup', () => clearTimeout(pressTimer));
    mainSosBtn.addEventListener('touchstart', () => {
        pressTimer = setTimeout(startSosSequence, 500);
    });
    mainSosBtn.addEventListener('touchend', () => clearTimeout(pressTimer));

    cancelSosBtn.addEventListener('click', resetSos);

    // --- Report Wizard Logic ---
    const wizardPanes = document.querySelectorAll('.wizard-pane');
    const wizardSteps = document.querySelectorAll('.wizard-steps .step');
    let currentStep = 1;

    function goToStep(step) {
        wizardPanes.forEach(p => p.classList.remove('active'));
        wizardSteps.forEach(s => s.classList.remove('active'));
        
        document.getElementById(`report-step-${step}`).classList.add('active');
        document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
        currentStep = step;
    }

    document.querySelectorAll('.next-step').forEach(btn => {
        btn.addEventListener('click', () => goToStep(currentStep + 1));
    });

    document.querySelectorAll('.prev-step').forEach(btn => {
        btn.addEventListener('click', () => goToStep(currentStep - 1));
    });

    document.getElementById('submit-report-final').addEventListener('click', () => {
        alert('Report submitted securely. Reference ID: SS-' + Math.floor(Math.random()*10000));
        switchSection('home');
        goToStep(1);
    });

    // --- Chat Logic ---
    const chatInput = document.getElementById('user-chat-input');
    const sendBtn = document.getElementById('send-chat-btn');
    const chatMessages = document.getElementById('chat-messages');

    function addMessage(text, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        msgDiv.innerHTML = `
            <div class="message-content">${text}</div>
            <div class="message-time">Just now</div>
        `;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        addMessage(text, true);
        chatInput.value = '';

        // Simple bot responses
        setTimeout(() => {
            const responses = [
                "I hear you, and I want you to know that you are not alone. Your safety is what matters most.",
                "Thank you for sharing that with me. It takes a lot of strength to talk about these things.",
                "I'm here to listen. Would you like to know more about the support services available at JKUAT?",
                "That sounds very difficult. Remember that we can help you file a secure report whenever you're ready."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addMessage(randomResponse);
        }, 1000);
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});
