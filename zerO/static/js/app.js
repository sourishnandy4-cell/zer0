// ZER0 Smart Plug UI Controller & Preloader Engine

let currentDevice = 'Heater';
let currentStatus = 'ACTIVE';
let telemetryChart = null;
const maxChartPoints = 20;

// Dial Configuration
const DIAL_MAX_POWER = 2000; // Max watts for scale
const DIAL_CIRCUMFERENCE = 691; // 2 * PI * 110

// Theme colors matching CSS
const COLORS = {
    active: '#2d6a6b',   // Deep Slate Teal
    standby: '#f5c542',  // Warm Sun Gold
    leak: '#d46a3a',     // Terracotta Orange
    patched: '#5a9e9f'   // Soft Muted Teal/Sage
};

// Plant & Theme Variables
let plantGrowth = parseFloat(localStorage.getItem('zerO_plant_growth') || '10');

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Theme
    initTheme();

    // 1. Initialize Canvas Loader & Progress Bar
    initLoader();
    
    // 2. Initialize Telemetry Chart
    initChart();
    
    // 3. Poll backend for state updates every 1.0 seconds
    setInterval(() => {
        // Only poll if loader is finished to avoid resource contention
        if (loaderComplete) {
            fetchState(false);
        }
    }, 1000);

    // 4. Initialize Plant Growth system
    initPlantSystem();
});

/* ============================================================
   CANVAS PRELOADER SYSTEM (Warm Energy Particles)
   ============================================================ */
let loaderComplete = false;

function initLoader() {
    const loader = document.getElementById('loader');
    const canvas = document.getElementById('loader-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');

    let width, height, particles = [];
    const PARTICLE_COUNT = 80; // slightly optimized
    let progress = 0;
    let loaderAnimationId = null;

    function resizeCanvas() {
        const rect = loader.getBoundingClientRect();
        width = canvas.width = rect.width;
        height = canvas.height = rect.height;
    }

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 3.0 + 1.0;
            this.speedY = Math.random() * 0.5 + 0.15;
            this.speedX = (Math.random() - 0.5) * 0.25;
            this.alpha = Math.random() * 0.5 + 0.2;
            this.pulse = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.02 + Math.random() * 0.02;
            
            // Warm Terracotta / Orange / Gold hues
            this.hue = 20 + Math.random() * 25; // 20–45 range
            this.sat = 75 + Math.random() * 25;
            this.light = 55 + Math.random() * 25;
        }

        update() {
            this.y -= this.speedY;
            this.x += this.speedX + Math.sin(this.pulse) * 0.15;
            this.pulse += this.pulseSpeed;

            if (this.y < -10) {
                this.y = height + 10;
                this.x = Math.random() * width;
            }
            if (this.x < -10) this.x = width + 10;
            if (this.x > width + 10) this.x = -10;

            this.currentSize = this.size + Math.sin(this.pulse) * 0.4;
        }

        draw() {
            const a = this.alpha * (0.6 + 0.4 * Math.sin(this.pulse * 0.5 + 1));
            ctx.beginPath();
            const grad = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.currentSize * 1.8
            );
            grad.addColorStop(0, `hsla(${this.hue}, ${this.sat}%, ${this.light}%, ${a})`);
            grad.addColorStop(1, `hsla(${this.hue + 12}, ${this.sat}%, ${this.light - 15}%, 0)`);
            ctx.fillStyle = grad;
            ctx.arc(this.x, this.y, this.currentSize * 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
    }

    function animateLoader() {
        if (!loaderComplete) {
            drawParticles();
            loaderAnimationId = requestAnimationFrame(animateLoader);
        }
    }

    // Simulate loader progress loading bar
    function simulateProgress() {
        const duration = 2000; // 2.0 seconds
        const steps = 50;
        let step = 0;

        function tick() {
            step++;
            const raw = step / steps;
            // Cubic ease-out
            const eased = 1 - Math.pow(1 - raw, 3);
            progress = Math.min(eased * 100, 100);

            if (progressFill) progressFill.style.width = progress + '%';
            if (progressLabel) progressLabel.textContent = Math.round(progress) + '%';

            if (progress < 100) {
                const delay = duration / steps + (Math.random() * 20 - 10);
                setTimeout(tick, delay);
            } else {
                // Done loading -> reveal app contents
                setTimeout(() => {
                    if (loader) loader.classList.add('hidden');
                    const mainContent = document.getElementById('main-content');
                    if (mainContent) mainContent.classList.add('visible');
                    
                    loaderComplete = true;
                    if (loaderAnimationId) cancelAnimationFrame(loaderAnimationId);
                    
                    // Fetch initial baseline data from server
                    fetchState(true);
                }, 400);
            }
        }

        tick();
    }

    // Fire preloader
    resizeCanvas();
    initParticles();
    animateLoader();
    simulateProgress();

    window.addEventListener('resize', () => {
        if (!loaderComplete) {
            resizeCanvas();
            particles.forEach(p => {
                p.x = Math.min(p.x, width);
                p.y = Math.min(p.y, height);
            });
        }
    });
}

/* ============================================================
   TELEMETRY CONTROLLER
   ============================================================ */

/* ============================================================
   CLIENT-SIDE STATIC DEMO FALLBACK SIMULATOR
   ============================================================ */
let isLocalFallback = false;
let localState = {
    current_device: 'Heater',
    status: 'ACTIVE',
    power: 1500.0,
    saved_energy_wh: 0.0,
    saved_cost_inr: 0.0,
    inverter_mins_gained: 0.0,
    last_updated: Date.now() / 1000,
    device_profiles: {
        'Heater': {
            'name': 'Electric Room Heater',
            'active': 1500.0,
            'standby': 0.0,
            'leak': 45.0,
            'descriptions': {
                'ACTIVE': 'Electric room heater running at full capacity.',
                'STANDBY': 'Mechanical heater switched OFF (no standby load).',
                'LEAK': 'Heater turned OFF, but display and thermostat controller leaking 45W.',
                'PATCHED': 'Smart relay opened by ZER0. Standby power cut to absolute zero.'
            }
        },
        'Laptop Charger': {
            'name': 'USB-C Fast Charger',
            'active': 65.0,
            'standby': 8.0,
            'leak': 6.5,
            'descriptions': {
                'ACTIVE': 'USB-C fast charger actively charging a laptop at 65W.',
                'STANDBY': 'Laptop is fully charged. Charger drawing minor standby power.',
                'LEAK': 'Laptop disconnected, but empty charger still drawing 6.5W vampire power.',
                'PATCHED': 'Smart relay opened by ZER0. Empty charger leak cut to absolute zero.'
            }
        },
        'Fan': {
            'name': 'Ceiling Fan (Smart)',
            'active': 75.0,
            'standby': 5.0,
            'leak': 12.0,
            'descriptions': {
                'ACTIVE': 'Ceiling fan running at active speed.',
                'STANDBY': 'Fan remote receiver active in standby mode.',
                'LEAK': 'Fan turned off via remote control, but internal regulator leaking 12W.',
                'PATCHED': 'Smart relay opened by ZER0. Remote receiver standby load cut to absolute zero.'
            }
        },
        'Projector': {
            'name': 'LCD Media Projector',
            'active': 240.0,
            'standby': 18.0,
            'leak': 28.0,
            'descriptions': {
                'ACTIVE': 'LCD media projector actively displaying video at 240W.',
                'STANDBY': 'Projector lamp off. Cooling fan and indicators drawing standby power.',
                'LEAK': 'Projector turned OFF, but internal transformer and remote sensor leaking 28W.',
                'PATCHED': 'Smart relay opened by ZER0. Projector standby drain cut to absolute zero.'
            }
        }
    },
    base_load: 80.0
};

function getLocalLivePower(device, status) {
    const profile = localState.device_profiles[device];
    if (status === 'ACTIVE') return profile.active + (Math.random() - 0.5) * 5;
    if (status === 'STANDBY') return profile.standby + (Math.random() - 0.5) * 0.5;
    if (status === 'LEAK') return profile.leak + (Math.random() - 0.5) * 0.5;
    return 0.0;
}

function updateLocalCumulativeStats() {
    const now = Date.now() / 1000;
    const dt = now - localState.last_updated;
    localState.last_updated = now;
    
    if (localState.status === 'PATCHED') {
        const profile = localState.device_profiles[localState.current_device];
        const wh = (profile.leak * dt) / 3600.0;
        localState.saved_energy_wh += wh;
        localState.saved_cost_inr += (wh / 1000.0) * 5.5;
        
        const time_with_leak = (1200.0 / (80.0 + profile.leak)) * 60.0;
        const time_without_leak = (1200.0 / 80.0) * 60.0;
        const max_mins = time_without_leak - time_with_leak;
        
        const accelerated_seconds = dt * 60.0;
        localState.inverter_mins_gained += (accelerated_seconds / 3600.0) * max_mins;
    }
}

function processStateData(data, isInitialLoad) {
    currentDevice = data.current_device;
    currentStatus = data.status;
    
    // 1. Update text telemetry
    document.getElementById('wattsVal').textContent = Math.round(data.power);
    document.getElementById('deviceDesc').textContent = data.description;
    
    // Update total load info in inverter card
    document.getElementById('metricTotalLoad').textContent = Math.round(data.power + data.base_load) + 'W';
    
    // 2. Update status badges
    const badge = document.getElementById('statusBadge');
    badge.textContent = getStatusLabel(currentStatus);
    badge.className = 'live-status-badge ' + getBadgeClass(currentStatus);
    
    // Update Dial CSS classes
    const telemetryCard = document.getElementById('telemetryCard');
    telemetryCard.className = 'glass-card telemetry-card ' + getDialStateClass(currentStatus);
    
    // 3. Update Dial progress ring
    updateDial(data.power, currentStatus);
    
    // 4. Update Cumulative Metrics
    document.getElementById('metricEnergySaved').textContent = data.saved_energy_wh.toFixed(3);
    document.getElementById('metricCostSaved').textContent = '₹' + data.saved_cost_inr.toFixed(3);
    document.getElementById('metricInverterGained').textContent = data.inverter_mins_gained.toFixed(1);
    document.getElementById('metricInverterRemaining').textContent = data.backup_mins_remaining.toFixed(1);
    
    // 5. Update AI Classifier details
    updateAIClassifier(data);
    
    // 6. Update Control Action Buttons
    updateControls(currentStatus);
    
    // 7. Update devices list if it is the first load
    if (isInitialLoad) {
        renderDevices(data.device_profiles, currentDevice);
    } else {
        updateDeviceListWatts(data.power, currentDevice, currentStatus);
    }
    
    // 8. Add data point to scrolling line chart
    updateChartData(data.power);
    
    // 9. Manage Leak alert banner
    const alertBanner = document.getElementById('leakAlert');
    if (currentStatus === 'LEAK') {
        alertBanner.style.display = 'flex';
        document.getElementById('leakAlertDesc').innerHTML = `The <strong>${data.device_name}</strong> is turned "OFF" but is leaking a standby phantom load of <strong>${Math.round(data.power)}W</strong>. Activating the <strong>ZER0 Smart Relay</strong> can reclaim <strong>${Math.round(data.inverter_mins_gained + 15)} mins</strong> of inverter capacity!`;
    } else {
        alertBanner.style.display = 'none';
    }
    
    // Update System top badge status
    const sysBadge = document.getElementById('systemStatus');
    if (currentStatus === 'PATCHED') {
        sysBadge.innerHTML = 'Relay Guard: SECURE';
        sysBadge.style.color = 'var(--color-secondary-light)';
        sysBadge.style.borderColor = 'rgba(90, 158, 159, 0.4)';
        sysBadge.style.background = 'rgba(90, 158, 159, 0.08)';
    } else if (currentStatus === 'LEAK') {
        sysBadge.innerHTML = 'Relay Guard: WARN';
        sysBadge.style.color = 'var(--color-primary)';
        sysBadge.style.borderColor = 'rgba(212, 106, 58, 0.4)';
        sysBadge.style.background = 'rgba(212, 106, 58, 0.08)';
    } else {
        sysBadge.innerHTML = 'Relay Guard: ACTIVE';
        sysBadge.style.color = 'var(--color-secondary)';
        sysBadge.style.borderColor = 'rgba(45, 106, 107, 0.3)';
        sysBadge.style.background = 'rgba(45, 106, 107, 0.1)';
    }
    
    // Refresh icons dynamically loaded via Lucide
    lucide.createIcons();
}

// Fetch state from server
function fetchState(isInitialLoad = false) {
    if (isLocalFallback) {
        updateLocalCumulativeStats();
        localState.power = getLocalLivePower(localState.current_device, localState.status);
        const profile = localState.device_profiles[localState.current_device];
        const backup_mins = (1200.0 / (localState.base_load + localState.power)) * 60.0;
        
        const fallbackData = {
            current_device: localState.current_device,
            device_name: profile.name,
            status: localState.status,
            power: localState.power,
            power_active: profile.active,
            power_standby: profile.standby,
            power_leak: profile.leak,
            saved_energy_wh: localState.saved_energy_wh,
            saved_cost_inr: localState.saved_cost_inr,
            inverter_mins_gained: localState.inverter_mins_gained,
            backup_mins_remaining: backup_mins,
            device_profiles: localState.device_profiles,
            base_load: localState.base_load,
            description: profile.descriptions[localState.status] || ''
        };
        processStateData(fallbackData, isInitialLoad);
        return;
    }

    fetch('/api/state')
        .then(response => {
            if (!response.ok) throw new Error('Not local Flask server');
            return response.json();
        })
        .then(data => {
            processStateData(data, isInitialLoad);
        })
        .catch(err => {
            console.warn('Backend API unavailable, switching to local client-side fallback simulator:', err);
            isLocalFallback = true;
            fetchState(isInitialLoad);
        });
}

// Translate status strings to nice human readable labels
function getStatusLabel(status) {
    switch (status) {
        case 'ACTIVE': return 'Active Load';
        case 'STANDBY': return 'Standby Load';
        case 'LEAK': return 'Phantom Leak';
        case 'PATCHED': return 'Safe (Patched)';
        default: return 'Unknown';
    }
}

// Badge CSS mappings
function getBadgeClass(status) {
    switch (status) {
        case 'ACTIVE': return 'badge-active';
        case 'STANDBY': return 'badge-standby';
        case 'LEAK': return 'badge-leak';
        case 'PATCHED': return 'badge-patched';
        default: return '';
    }
}

// Dial color classes
function getDialStateClass(status) {
    switch (status) {
        case 'ACTIVE': return 'state-active';
        case 'STANDBY': return 'state-standby';
        case 'LEAK': return 'state-leak';
        case 'PATCHED': return 'state-patched';
        default: return '';
    }
}

// Update the circular SVG progress ring
function updateDial(power, status) {
    const progressRing = document.getElementById('dialProgress');
    if (!progressRing) return;
    
    // Calculate percentage filled
    let percentage = Math.min(1.0, power / DIAL_MAX_POWER);
    if (status === 'PATCHED') percentage = 0.0;
    
    const offset = DIAL_CIRCUMFERENCE - (percentage * DIAL_CIRCUMFERENCE);
    progressRing.style.strokeDashoffset = offset;
    
    // Dynamically change color of stroke
    switch (status) {
        case 'ACTIVE':
            progressRing.style.stroke = COLORS.active;
            break;
        case 'STANDBY':
            progressRing.style.stroke = COLORS.standby;
            break;
        case 'LEAK':
            progressRing.style.stroke = COLORS.leak;
            break;
        case 'PATCHED':
            progressRing.style.stroke = COLORS.patched;
            break;
    }
}

// Render the device selector cards
function renderDevices(profiles, activeDeviceKey) {
    const listContainer = document.getElementById('deviceList');
    listContainer.innerHTML = '';
    
    Object.keys(profiles).forEach(key => {
        const p = profiles[key];
        const isActive = key === activeDeviceKey;
        
        const card = document.createElement('div');
        card.className = `device-card ${isActive ? 'active' : ''}`;
        card.id = `device-card-${key}`;
        card.onclick = () => selectDevice(key);
        
        // Pick an SVG icon based on key
        let iconName = 'plug';
        if (p.icon === 'flame') iconName = 'flame';
        if (p.icon === 'battery-charging') iconName = 'battery-charging';
        if (p.icon === 'wind') iconName = 'wind';
        if (p.icon === 'projector') iconName = 'tv'; // Lucide 'tv' fits projector
        
        card.innerHTML = `
            <div class="device-icon-wrapper">
                <i data-lucide="${iconName}"></i>
            </div>
            <div class="device-info">
                <div class="device-name">${p.name}</div>
                <div class="device-type">Active: ${p.active}W | Leak: ${p.leak}W</div>
            </div>
            <div class="device-power-tag" id="device-power-tag-${key}">
                ${isActive ? 'Loading...' : 'Idle'}
            </div>
        `;
        
        listContainer.appendChild(card);
    });
    
    lucide.createIcons();
}

// Update the power tags next to the device cards
function updateDeviceListWatts(currentPower, activeDeviceKey, status) {
    const cards = document.querySelectorAll('.device-card');
    cards.forEach(card => {
        const isThisOne = card.id === `device-card-${activeDeviceKey}`;
        if (isThisOne) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
            const key = card.id.replace('device-card-', '');
            const tag = document.getElementById(`device-power-tag-${key}`);
            if (tag) {
                tag.textContent = 'Idle';
                tag.style.color = 'var(--color-text-muted)';
            }
        }
    });
    
    const activeTag = document.getElementById(`device-power-tag-${activeDeviceKey}`);
    if (activeTag) {
        if (status === 'PATCHED') {
            activeTag.textContent = '0.0 W';
            activeTag.style.color = COLORS.patched;
        } else {
            activeTag.textContent = Math.round(currentPower) + ' W';
            if (status === 'LEAK') activeTag.style.color = COLORS.leak;
            else if (status === 'STANDBY') activeTag.style.color = COLORS.standby;
            else activeTag.style.color = COLORS.active;
        }
    }
}

// Update UI buttons based on state
function updateControls(status) {
    const btnToggle = document.getElementById('btnTogglePower');
    const toggleText = document.getElementById('togglePowerText');
    const btnPatch = document.getElementById('btnPatch');
    const patchedInfo = document.getElementById('patchedInfo');
    
    if (status === 'ACTIVE' || status === 'STANDBY') {
        btnToggle.style.display = 'flex';
        toggleText.textContent = 'Turn Device OFF';
        btnPatch.style.display = 'none';
        patchedInfo.style.display = 'none';
    } 
    else if (status === 'LEAK') {
        btnToggle.style.display = 'flex';
        toggleText.textContent = 'Turn Device ON';
        btnPatch.style.display = 'flex';
        patchedInfo.style.display = 'none';
        
        btnPatch.className = 'btn btn-cyan animate-pulse';
    } 
    else if (status === 'PATCHED') {
        btnToggle.style.display = 'flex';
        toggleText.textContent = 'Turn Device ON';
        btnPatch.style.display = 'none';
        patchedInfo.style.display = 'block';
    }
}

// Update the AI classification logs
function updateAIClassifier(data) {
    const power = data.power;
    const status = data.status;
    const profile = data.device_profiles[data.current_device];
    
    document.getElementById('aiValPower').textContent = power.toFixed(1) + ' W';
    document.getElementById('aiValSig').textContent = profile.name + ' Signature';
    
    const standbyLimit = profile.standby + 2.0;
    document.getElementById('aiValThresh').textContent = `Standby Limit: ${standbyLimit.toFixed(1)}W`;
    
    const relayVal = document.getElementById('aiValRelay');
    const descText = document.getElementById('aiClassificationDesc');
    
    if (status === 'ACTIVE') {
        relayVal.textContent = 'CLOSED (Power ON)';
        relayVal.style.color = COLORS.active;
        descText.textContent = `Appliance load (${Math.round(power)}W) matches standard operational profile. Relay remains securely closed.`;
    } 
    else if (status === 'STANDBY') {
        relayVal.textContent = 'CLOSED (Standby)';
        relayVal.style.color = COLORS.standby;
        descText.textContent = `Standby load detected. Device is consuming normal sleep power. Grid monitoring continuous.`;
    } 
    else if (status === 'LEAK') {
        relayVal.textContent = 'CLOSED (Leak Warning)';
        relayVal.style.color = COLORS.leak;
        descText.textContent = `VULNERABILITY DETECTED: Device switched to OFF, but active power (${Math.round(power)}W) is higher than standby limit (${standbyLimit}W). Classification: Phantom Leak. Smart Patch recommended.`;
    } 
    else if (status === 'PATCHED') {
        relayVal.textContent = 'OPEN (Relay Tripped)';
        relayVal.style.color = COLORS.patched;
        descText.textContent = `ISOLATION SECURE: ZER0 opened the physical smart plug relay. Leak blocked. Active grid drain cut to 0.0W. Savings active.`;
    }
}

// Click Handlers
function selectDevice(deviceName) {
    if (isLocalFallback) {
        localState.current_device = deviceName;
        localState.status = 'ACTIVE';
        localState.power = getLocalLivePower(deviceName, 'ACTIVE');
        fetchState(false);
        return;
    }

    fetch('/api/select_device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device: deviceName })
    })
    .then(response => {
        if (!response.ok) throw new Error('Action failed');
        return response.json();
    })
    .then(() => {
        fetchState(false);
    })
    .catch(() => {
        isLocalFallback = true;
        selectDevice(deviceName);
    });
}

function togglePower() {
    let action = 'turn_off';
    if (currentStatus === 'LEAK' || currentStatus === 'PATCHED') {
        action = 'turn_on';
    }
    sendAction(action);
}

function sendAction(actionName) {
    if (isLocalFallback) {
        if (actionName === 'turn_off') {
            localState.status = 'LEAK';
        } else if (actionName === 'patch') {
            localState.status = 'PATCHED';
        } else if (actionName === 'turn_on') {
            localState.status = 'ACTIVE';
        }
        localState.power = getLocalLivePower(localState.current_device, localState.status);
        fetchState(false);
        return;
    }

    fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName })
    })
    .then(response => {
        if (!response.ok) throw new Error('Action failed');
        return response.json();
    })
    .then(() => {
        fetchState(false);
    })
    .catch(() => {
        isLocalFallback = true;
        sendAction(actionName);
    });
}

function resetStats() {
    if (isLocalFallback) {
        localState.saved_energy_wh = 0.0;
        localState.saved_cost_inr = 0.0;
        localState.inverter_mins_gained = 0.0;
        localState.last_updated = Date.now() / 1000;
        fetchState(false);
        return;
    }

    fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) throw new Error('Action failed');
        return response.json();
    })
    .then(() => {
        fetchState(false);
    })
    .catch(() => {
        isLocalFallback = true;
        resetStats();
    });
}

// Chart.js Timeline graph setup
function initChart() {
    const ctx = document.getElementById('telemetryChart').getContext('2d');
    
    // Create initial dummy data
    const labels = [];
    const data = [];
    for (let i = 0; i < maxChartPoints; i++) {
        labels.push('');
        data.push(0);
    }
    
    // Create an initial linear gradient for chart fill (Teal default)
    const fillGradient = ctx.createLinearGradient(0, 0, 0, 220);
    fillGradient.addColorStop(0, 'rgba(45, 106, 107, 0.15)');
    fillGradient.addColorStop(1, 'rgba(45, 106, 107, 0.0)');

    telemetryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Smart Plug Active Power (Watts)',
                data: data,
                borderColor: COLORS.active,
                backgroundColor: fillGradient,
                borderWidth: 2.5,
                pointRadius: 0,
                tension: 0.38,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(44, 38, 32, 0.3)',
                        font: {
                            family: 'Inter',
                            size: 10
                        }
                    }
                },
                y: {
                    min: 0,
                    max: 1600, // Room heater peak is 1500
                    grid: {
                        color: 'rgba(44, 38, 32, 0.03)'
                    },
                    ticks: {
                        color: 'rgba(44, 38, 32, 0.45)',
                        font: {
                            family: 'Inter',
                            size: 11
                        }
                    }
                }
            },
            animation: {
                duration: 200 // fast transition for smooth ticking
            }
        }
    });
}

// Add new telemetry point to chart
function updateChartData(newPower) {
    if (!telemetryChart) return;
    
    // Push new point and shift older point
    telemetryChart.data.datasets[0].data.push(newPower);
    telemetryChart.data.datasets[0].data.shift();
    
    // Dynamic chart boundary adjustment
    let dynamicMax = 100;
    if (newPower > 1000) {
        dynamicMax = 1600;
    } else if (newPower > 150) {
        dynamicMax = 300;
    } else {
        dynamicMax = 100;
    }
    telemetryChart.options.scales.y.max = dynamicMax;
    
    // Change line border color and fill gradient based on system status
    let activeColor = COLORS.active;
    let fillRgba = 'rgba(45, 106, 107, 0.15)'; // Active Teal
    
    if (currentStatus === 'LEAK') {
        activeColor = COLORS.leak;
        fillRgba = 'rgba(212, 106, 58, 0.15)'; // Leak Terracotta
    } else if (currentStatus === 'STANDBY') {
        activeColor = COLORS.standby;
        fillRgba = 'rgba(245, 197, 66, 0.15)'; // Standby Gold
    } else if (currentStatus === 'PATCHED') {
        activeColor = COLORS.patched;
        fillRgba = 'rgba(90, 158, 159, 0.15)'; // Patched Muted Teal/Sage
    }
    
    const canvas = document.getElementById('telemetryChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const fillGradient = ctx.createLinearGradient(0, 0, 0, 220);
        fillGradient.addColorStop(0, fillRgba);
        fillGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        telemetryChart.data.datasets[0].backgroundColor = fillGradient;
    }
    
    telemetryChart.data.datasets[0].borderColor = activeColor;
    
    // Redraw
    telemetryChart.update();
}

/* ============================================================
   SCREEN & NAVIGATION CONTROLS
   ============================================================ */

// Switch to the live simulator dashboard screen
function showDashboard() {
    const homeScreen = document.getElementById('home-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const navBackBtn = document.getElementById('navBackBtn');
    const sysBadge = document.getElementById('systemStatus');
    
    if (homeScreen && dashboardScreen) {
        homeScreen.style.opacity = 0;
        setTimeout(() => {
            homeScreen.style.display = 'none';
            dashboardScreen.style.display = 'block';
            setTimeout(() => {
                dashboardScreen.style.opacity = 1;
                if (navBackBtn) navBackBtn.style.display = 'flex';
                if (sysBadge) sysBadge.style.display = 'flex';
            }, 50);
        }, 300);
    }
}

// Switch back to the home landing screen
function showHome() {
    const homeScreen = document.getElementById('home-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const navBackBtn = document.getElementById('navBackBtn');
    const sysBadge = document.getElementById('systemStatus');
    
    if (homeScreen && dashboardScreen) {
        dashboardScreen.style.opacity = 0;
        setTimeout(() => {
            dashboardScreen.style.display = 'none';
            homeScreen.style.display = 'block';
            setTimeout(() => {
                homeScreen.style.opacity = 1;
                if (navBackBtn) navBackBtn.style.display = 'none';
                if (sysBadge) sysBadge.style.display = 'none';
            }, 50);
        }, 300);
    }
}

/* ============================================================
   OPTIONS SIDE DRAWER CONTROLS
   ============================================================ */
function toggleDrawer() {
    const drawer = document.getElementById('options-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer && overlay) {
        const isOpen = drawer.classList.toggle('open');
        overlay.classList.toggle('open');
        
        if (isOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
    }
}

/* ============================================================
   WATCH STORY SLIDES MODAL CONTROLS
   ============================================================ */
let currentStorySlideIndex = 1;
const totalStorySlides = 3;

function openStoryModal() {
    const modal = document.getElementById('story-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
        currentStorySlideIndex = 1;
        updateStorySlideDisplay();
        modal.classList.add('open');
        overlay.classList.add('open');
        document.body.classList.add('no-scroll');
    }
}

function closeStoryModal() {
    const modal = document.getElementById('story-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
        modal.classList.remove('open');
        overlay.classList.remove('open');
        document.body.classList.remove('no-scroll');
    }
}

function gotoStorySlide(index) {
    if (index >= 1 && index <= totalStorySlides) {
        currentStorySlideIndex = index;
        updateStorySlideDisplay();
    }
}

function nextStorySlide() {
    if (currentStorySlideIndex < totalStorySlides) {
        currentStorySlideIndex++;
    } else {
        // Loop back to first or close
        currentStorySlideIndex = 1;
    }
    updateStorySlideDisplay();
}

function prevStorySlide() {
    if (currentStorySlideIndex > 1) {
        currentStorySlideIndex--;
    } else {
        currentStorySlideIndex = totalStorySlides;
    }
    updateStorySlideDisplay();
}

function updateStorySlideDisplay() {
    // Hide all slides, show active slide
    for (let i = 1; i <= totalStorySlides; i++) {
        const slide = document.getElementById(`slide-${i}`);
        if (slide) {
            if (i === currentStorySlideIndex) {
                slide.classList.add('active-slide');
            } else {
                slide.classList.remove('active-slide');
            }
        }
    }
    
    // Update dots indicator
    const dots = document.querySelectorAll('.slide-dot');
    dots.forEach((dot, index) => {
        if (index + 1 === currentStorySlideIndex) {
            dot.classList.add('active-dot');
        } else {
            dot.classList.remove('active-dot');
        }
    });
}

/* ============================================================
   THEMING & COLOR SCHEMES
   ============================================================ */
function initTheme() {
    const isDark = localStorage.getItem('zerO_dark_theme') === 'true';
    if (isDark) {
        document.body.classList.add('dark-theme');
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.innerHTML = '<i data-lucide="sun" style="width: 18px; height: 18px;"></i>';
        }
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('zerO_dark_theme', isDark ? 'true' : 'false');
    
    // Update theme toggle icon
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        if (isDark) {
            themeBtn.innerHTML = '<i data-lucide="sun" style="width: 18px; height: 18px;"></i>';
        } else {
            themeBtn.innerHTML = '<i data-lucide="moon" style="width: 18px; height: 18px;"></i>';
        }
        lucide.createIcons();
    }
}

/* ============================================================
   GROWING PLANT SYSTEM (Living Interface Zen Screen)
   ============================================================ */
let activeScreenBeforePlant = 'home-screen';

function showPlantScreen() {
    // 1. Close side drawer
    toggleDrawer();
    
    // 2. Identify which screen is currently visible
    const homeScreen = document.getElementById('home-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    if (homeScreen && homeScreen.style.display !== 'none') {
        activeScreenBeforePlant = 'home-screen';
        homeScreen.style.opacity = 0;
        setTimeout(() => {
            homeScreen.style.display = 'none';
            openPlantScreenView();
        }, 300);
    } else if (dashboardScreen && dashboardScreen.style.display !== 'none') {
        activeScreenBeforePlant = 'dashboard-screen';
        dashboardScreen.style.opacity = 0;
        setTimeout(() => {
            dashboardScreen.style.display = 'none';
            openPlantScreenView();
        }, 300);
    }
}

function openPlantScreenView() {
    const plantScreen = document.getElementById('plant-screen');
    if (plantScreen) {
        plantScreen.style.display = 'flex';
        setTimeout(() => {
            plantScreen.style.opacity = 1;
            // Hide standard Home back button while in zen view
            const navBackBtn = document.getElementById('navBackBtn');
            if (navBackBtn) navBackBtn.style.display = 'none';
        }, 50);
    }
}

function closePlantScreen() {
    const plantScreen = document.getElementById('plant-screen');
    const targetScreen = document.getElementById(activeScreenBeforePlant);
    
    if (plantScreen && targetScreen) {
        plantScreen.style.opacity = 0;
        setTimeout(() => {
            plantScreen.style.display = 'none';
            
            if (activeScreenBeforePlant === 'dashboard-screen') {
                targetScreen.style.display = 'block';
            } else {
                targetScreen.style.display = 'block';
            }
            
            setTimeout(() => {
                targetScreen.style.opacity = 1;
                // Restore nav buttons
                if (activeScreenBeforePlant === 'dashboard-screen') {
                    const navBackBtn = document.getElementById('navBackBtn');
                    if (navBackBtn) navBackBtn.style.display = 'flex';
                }
            }, 50);
        }, 300);
    }
}

function initPlantSystem() {
    // Initial draw
    updatePlantGraphics();
    
    // Run growth ticker and particle generator
    setInterval(() => {
        const plantScreen = document.getElementById('plant-screen');
        const isVisible = plantScreen && plantScreen.style.display === 'flex';
        
        if (currentStatus === 'PATCHED') {
            if (plantGrowth < 100) {
                // Grow by 0.5% when active (Patched state)
                plantGrowth = Math.min(100, plantGrowth + 0.5);
                localStorage.setItem('zerO_plant_growth', plantGrowth.toString());
                updatePlantGraphics();
            }
            
            // Spawn energy particles inside zen view pot if visible
            if (isVisible) {
                spawnZenParticle();
                if (Math.random() < 0.5) {
                    setTimeout(spawnZenParticle, 300);
                }
            }
        } else {
            // Dormant state - draw current state anyway to ensure correct display
            updatePlantGraphics();
        }
    }, 1500);
}

function spawnZenParticle() {
    const container = document.getElementById('zenEnergyParticles');
    if (!container) return;
    
    const particle = document.createElement('div');
    particle.className = 'zen-particle';
    particle.style.left = (Math.random() * 80 + 10) + '%';
    
    const duration = (Math.random() * 0.4 + 1.6); // 1.6 to 2.0s
    particle.style.animationDuration = duration + 's';
    
    container.appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, duration * 1000);
}

function updatePlantGraphics() {
    const stem = document.getElementById('zen-plant-stem');
    const leafLeft = document.getElementById('zen-plant-leaf-left');
    const leafRight = document.getElementById('zen-plant-leaf-right');
    const flower = document.getElementById('zen-plant-flower');
    
    const label = document.getElementById('zenGrowthLabel');
    const fill = document.getElementById('zenGrowthFill');
    const badge = document.getElementById('zenPlantStatusBadge');
    const descText = document.getElementById('zenPlantStatus');
    
    if (!stem) return; // not loaded yet
    
    // Update progress elements
    if (label) label.textContent = Math.round(plantGrowth) + '%';
    if (fill) fill.style.width = plantGrowth + '%';
    
    // Update growth status badge and desc texts
    if (badge) {
        if (plantGrowth >= 100) {
            badge.textContent = 'Bloomed 🌻';
            badge.className = 'plant-badge active-grow';
            if (descText) descText.textContent = 'Complete! Your ZER0 relay reclaimed enough standby power to successfully bloom a sunflower. 🌱✨';
        } else if (currentStatus === 'PATCHED') {
            badge.textContent = 'Growing';
            badge.className = 'plant-badge active-grow';
            if (descText) descText.innerHTML = `Absorbing energy! The plant is growing from reclaimed standby grids. (Relay is <strong>PATCHED</strong>)`;
        } else {
            badge.textContent = 'Dormant';
            badge.className = 'plant-badge';
            if (descText) descText.innerHTML = `Dormant — waiting for energy. Feed me saved standby phantom load to help me grow! (Active when relay is <strong>PATCHED</strong>)`;
        }
    }
    
    // Update SVG Stem Height (grows from Q50 90 50 85 up to Q50 70 50 50)
    const targetStemY = 100 - (plantGrowth * 0.5);
    const controlPointY = 100 - (plantGrowth * 0.25);
    stem.setAttribute('d', `M50 100 Q50 ${controlPointY} 50 ${targetStemY}`);
    
    // Position leaves along the stem
    if (leafLeft) {
        if (plantGrowth >= 30) {
            leafLeft.style.display = 'block';
            const leafY = 100 - (30 * 0.5); // position at 30% mark
            leafLeft.setAttribute('d', `M50 ${leafY} Q32 ${leafY - 10} 27 ${leafY - 6} Q39 ${leafY + 6} 50 ${leafY}`);
        } else {
            leafLeft.style.display = 'none';
        }
    }
    
    if (leafRight) {
        if (plantGrowth >= 65) {
            leafRight.style.display = 'block';
            const leafY = 100 - (65 * 0.5); // position at 65% mark
            leafRight.setAttribute('d', `M50 ${leafY} Q68 ${leafY - 10} 73 ${leafY - 6} Q60 ${leafY + 6} 50 ${leafY}`);
        } else {
            leafRight.style.display = 'none';
        }
    }
    
    // Position and show flower group
    if (flower) {
        if (plantGrowth >= 100) {
            flower.style.display = 'block';
            // Place flower group at top of stem (ends at Y = 50 when growth is 100)
            flower.setAttribute('transform', 'translate(0, 0)');
        } else {
            flower.style.display = 'none';
        }
    }
}

