// Command Implementations
// =======================
// All terminal commands and command processing logic

import { SESSION_START, CONTACT_EMAIL, asciiArt } from './config.js';
import { vfs } from './vfs.js';
import { createMatrixEffect } from './effects.js';
import { renderWelcome, addOutput, scrollToBottom, appendNode, appendLine } from './rendering.js';
import { openImageViewer, startSlideshow } from './effects.js';

// Get output element (will be set from main.js)
let output;

export function setOutputElement(outputEl) {
    output = outputEl;
}

// Available commands
export const commands = {
    help: () => {
        return `
Available commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  help       - Display this help message
  about      - Information about this terminal
  neofetch   - Display system information
  date       - Display current date and time
  clear      - Clear the terminal screen
  echo       - Echo back the input text
  whoami     - Display current user
  pwd        - Show current directory
  ls         - List files
  cd         - Change directory
  cat        - Display file contents
  nano       - Edit/create text file
  open       - Open a picture (overlay)
  welcome    - Show the welcome message again
  matrix     - Mini matrix effect
  uptime     - System uptime
  contact    - Send your contact details
  snake      - Play a simple terminal snake
  meaning.of.life.exe - Choose your destiny
  slideshow.exe - Family photos slideshow
  fsreset    - Reset virtual filesystem
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    },

    about: () => {
        return `
CRT Terminal Simulator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Created with pure HTML, CSS, and JavaScript
Features authentic CRT effects:
  • Scanlines
  • RGB chromatic aberration
  • Phosphor glow
  • Subtle flicker

Built with nostalgia for the golden age of
computing. No frameworks, just code.
`;
    },

    date: () => {
        return new Date().toString();
    },

    clear: () => {
        output.innerHTML = '';
        return null;
    },

    echo: (args) => {
        return args.join(' ') || '';
    },

    whoami: () => {
        return 'guest';
    },

    pwd: () => {
        return window.terminalState?.cwd || '/';
    },

    ls: (args) => {
        const target = resolvePath(args[0] || '.', window.terminalState?.cwd || '/');
        const items = vfs.list(target);
        if (!items) return `ls: cannot access '${args[0] || '.'}': No such directory`;
        return items.map(i => i.type === 'dir' ? i.name + '/' : i.name).join('\n');
    },

    cat: (args) => {
        const file = args[0];
        if (!file) return 'cat: missing file operand';
        const path = resolvePath(file, window.terminalState?.cwd || '/');
        const node = vfs.getNode(path);
        if (!node) return `cat: ${file}: No such file`;
        if (node.type !== 'text') return `cat: ${file}: Not a text file`;
        return node.content || '';
    },

    cd: (args) => {
        const destRaw = args[0] || '~';
        const cwd = window.terminalState?.cwd || '/';
        const dest = resolvePath(destRaw, cwd);
        const node = vfs.getNode(dest);
        if (!node) return `cd: ${destRaw}: No such file or directory`;
        if (node.type !== 'dir') return `cd: ${destRaw}: Not a directory`;
        window.terminalState?.setCwd(dest);
        return null;
    },

    nano: (args) => {
        const target = args[0];
        if (!target) return 'nano: please specify a filename (e.g., nano notes.txt)';
        startNanoEditor(target);
        return null;
    },

    open: (args) => {
        const target = args[0];
        if (!target) return 'open: please specify an image path (e.g., open pictures/ravon-dev.svg)';
        const path = resolvePath(target, window.terminalState?.cwd || '/');
        const node = vfs.getNode(path);
        if (!node) return `open: ${target}: No such file`;
        if (node.type !== 'image') return `open: ${target}: Not an image file`;
        try { openImageViewer(node.src); } catch (_) {}
        return `Opening ${target}… (press any key or click to close)`;
    },

    welcome: () => {
        renderWelcome();
        return null;
    },

    matrix: () => {
        // Thin wrapper - calls the effect implementation
        createMatrixEffect();
        return 'Matrix effect started. Press any key or tap to exit.';
    },

    uptime: () => {
        const uptime = Math.floor(performance.now() / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        return 'System uptime: ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
    },

    neofetch: () => {
        const uptimeMs = Date.now() - SESSION_START;
        const uptime = Math.floor(uptimeMs / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);

        return {
            type: 'neofetch',
            data: {
                logo: asciiArt,
                header: 'ravon@terminal',
                divider: '──────────────────────',
                info: [
                    { label: 'Site', value: 'ravon.dev' },
                    { label: 'User', value: 'Ravon' },
                    { label: 'GitHub', value: 'https://github.com/Kidflash1233' },
                    { label: 'Creator', value: 'https://github.com/davislcruz' },
                    { label: 'Inspiration', value: 'Ravon (Kidflash1233)' },
                    { label: 'Uptime', value: `${hours}h ${minutes}m` },
                    { label: 'Likes', value: "Ben & Jerry's Chocolate Fudge Brownie" },
                    { label: 'Loves', value: 'Docker • Proxmox • Tailscale' },
                    { label: 'Homelab', value: 'Ubuntu + Docker Compose + GH Actions' },
                    { label: 'Stack', value: 'JS, CRT CSS, ASCII art' },
                    { label: 'Resolution', value: `${window.innerWidth}x${window.innerHeight}` },
                    { label: 'Terminal', value: 'crt-terminal' },
                    { label: 'Projects', value: 'Fake-CRT-Terminal • Homelab • Ravon.dev' }
                ]
            }
        };
    },

    // Interactive contact flow
    contact: () => {
        startContactFlow();
        return null;
    },

    // Simple snake game
    snake: () => {
        startSnakeGame();
        return 'Snake starting… Use arrow keys to move. Press Q to quit.';
    },

    // Matrix-themed red/blue pill game (renamed)
    'meaning.of.life.exe': () => {
        startPillsGame(true);
        return null;
    },
    // Backward-compatible alias (not shown in help)
    pills: () => { startPillsGame(false); return null; },

    // Family slideshow (.exe name shown in help)
    'slideshow.exe': () => {
        const base = 'img/family/';
        const imgs = [
            { src: base + 'IMG-20251116-WA0000.jpg', caption: 'Family — November 2025 (1/3)' },
            { src: base + 'IMG-20251116-WA0001.jpg', caption: 'Family — November 2025 (2/3)' },
            { src: base + 'IMG-20251116-WA0002.jpg', caption: 'Family — November 2025 (3/3)' }
        ];
        startSlideshow(imgs, { interval: 3500 });
        return 'Starting slideshow… Space: pause/play, ←/→: prev/next, Esc: close';
    },
    // Backward-compatible alias (not shown in help)
    slideshow: () => {
        return commands['slideshow.exe']();
    },

    // Reset the virtual filesystem (debug/helpful when a dir gets overwritten)
    fsreset: () => {
        vfs._reset();
        return 'Filesystem reset. Try ls, cd pictures, open ravon-dev.svg';
    }
};

// Add command to output
export function addCommand(cmd) {
    const div = document.createElement('div');
    div.className = 'command-line';
    const promptStr = (window.terminalState && window.terminalState.getPromptString) ? window.terminalState.getPromptString() : 'guest@terminal:~$';
    div.innerHTML = `<span class="prompt">${promptStr}</span> ${cmd}`;
    output.appendChild(div);
}

// Configuration for memory management
const MAX_COMMAND_HISTORY = 50; // Keep last 50 commands

// Process command
export function processCommand(cmd, input, updateCursorPositionFn) {
    cmd = cmd.trim();
    if (!cmd) return;

    // Get command history from main.js
    const { commandHistory, setHistoryIndex } = window.terminalState || {};

    // Add to history with limit to prevent memory bloat
    if (commandHistory) {
        commandHistory.unshift(cmd);
        // Trim history if it exceeds max size
        if (commandHistory.length > MAX_COMMAND_HISTORY) {
            commandHistory.length = MAX_COMMAND_HISTORY;
            console.log(`♻️ Trimmed command history to ${MAX_COMMAND_HISTORY} entries`);
        }
        setHistoryIndex(-1);
    }

    // Display command
    addCommand(cmd);

    // Parse command
    const parts = cmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Execute command
    if (commands[command]) {
        const result = commands[command](args);
        if (result !== null) {
            addOutput(result);
        }
    } else {
        addOutput(`Command not found: ${command}`, 'error-text');
        addOutput('Type "help" for available commands.');
    }

    // Clear input
    input.value = '';
    updateCursorPositionFn();
}

// ===========================
// Contact Interactive Session
// ===========================

let contactSession = null;

function startContactFlow() {
    // Prevent starting if already in a session
    if (window.terminalState?.isInteractive && window.terminalState.isInteractive()) {
        addOutput('Another interactive session is in progress. Finish it first.', 'error-text');
        return;
    }

    // Header and intro with a bit of flair
    addOutput('┌──────────────── CONTACT ────────────────┐', 'welcome-divider');
    addOutput('Let\'s get you in touch. I\'ll ask three quick things.', 'welcome-text');
    addOutput('Press Enter after each answer.', 'info-text');
    addOutput('└─────────────────────────────────────────┘', 'welcome-divider');

    contactSession = { step: 'name', data: {} };

    // Ask first question
    addOutput('Your name?', 'question-text');

    // Register handler for subsequent input
    window.terminalState?.setInteractiveHandler(handleContactInput);
}

function handleContactInput(value, input, updateCursorPositionFn) {
    // Echo what user typed in a subtle style
    if (value && value.length) {
        addOutput('» ' + value, 'muted-text');
    }

    if (!contactSession) {
        // Safety: clear interactive handler
        window.terminalState?.setInteractiveHandler(null);
        return;
    }

    if (contactSession.step === 'name') {
        const name = (value || '').trim();
        if (!name) {
            addOutput('Please enter a name.', 'error-text');
            return; // Stay on same step
        }
        contactSession.data.name = name;
        addOutput(`Nice to meet you, ${name}!`, 'info-text');
        addOutput('Best email or phone number?', 'question-text');
        contactSession.step = 'contact';
        // Clear input and keep cursor updated
        input.value = '';
        updateCursorPositionFn();
        return;
    }

    if (contactSession.step === 'contact') {
        const contact = (value || '').trim();
        const digits = contact.replace(/\D/g, '');
        const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
        const looksLikePhone = digits.length >= 7 && digits.length <= 20;
        if (!contact || (!looksLikeEmail && !looksLikePhone)) {
            addOutput('Please enter a valid email address or phone number.', 'error-text');
            return; // Ask again
        }
        contactSession.data.contact = contact;
        addOutput('What should I know about your role, project, or opportunity?', 'question-text');
        contactSession.step = 'details';
        input.value = '';
        updateCursorPositionFn();
        return;
    }

    if (contactSession.step === 'details') {
        const details = (value || '').trim();
        if (!details || details.length < 8) {
            addOutput('Please share a short note with at least a few words.', 'error-text');
            return;
        }
        contactSession.data.details = details;
        finalizeContact(input, updateCursorPositionFn);
        return;
    }
}

function finalizeContact(input, updateCursorPositionFn) {
    const { name, contact, details } = contactSession.data;

    // Simulate sending with an animated status line
    const statusEl = appendLine('Sending', 'info-text');
    let dots = 0;
    const spinner = setInterval(() => {
        dots = (dots + 1) % 4;
        statusEl.textContent = 'Sending' + '.'.repeat(dots);
    }, 250);

    // Save to localStorage for convenience
    const nowIso = new Date().toISOString();
    try {
        const key = 'terminalContacts';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.push({ name, contact, details, timestamp: nowIso });
        localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
        // Ignore storage errors (private mode, etc.)
    }

    const summary =
        `New contact request\n` +
        `Name: ${name}\n` +
        `Contact: ${contact}\n` +
        `Details: ${details}\n` +
        `Received: ${nowIso}`;

    submitContactRequest({ name, contact, details, submittedAt: nowIso }).then((result) => {
        clearInterval(spinner);
        statusEl.textContent = 'Sent ✓';
        statusEl.className = 'output-line success-text';

        // Try to copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(summary).then(() => {
                addOutput('Details copied to clipboard.', 'success-text');
            }).catch(() => {
                // no-op
            });
        }

        addOutput(`Thanks, ${name}! I’ll get back to you soon.`, 'success-text');
        if (result?.id) {
            addOutput(`Reference ID: ${result.id}`, 'muted-text');
        }
        addOutput('Tip: run "help" or explore more commands.', 'muted-text');

        // Clear input box and exit interactive mode
        input.value = '';
        updateCursorPositionFn();
        contactSession = null;
        window.terminalState?.setInteractiveHandler(null);
    }).catch((error) => {
        clearInterval(spinner);
        statusEl.textContent = 'Send failed';
        statusEl.className = 'output-line error-text';

        addOutput(error?.message || 'Unable to submit your request right now.', 'error-text');
        addOutput('You can still use the fallback email link below.', 'info-text');

        const mail = document.createElement('div');
        mail.className = 'output-line info-text';
        const a = document.createElement('a');
        const to = (CONTACT_EMAIL && CONTACT_EMAIL.trim()) ? CONTACT_EMAIL.trim() : '';
        a.href =
            'mailto:' +
            to +
            '?subject=' +
            encodeURIComponent('New contact from CRT Terminal') +
            '&body=' +
            encodeURIComponent(summary);
        a.textContent = 'Open email composer with details';
        a.style.color = '#66ccff';
        a.rel = 'noopener noreferrer';
        mail.appendChild(a);
        appendNode(mail);

        input.value = '';
        updateCursorPositionFn();
        contactSession = null;
        window.terminalState?.setInteractiveHandler(null);
    });
}

async function submitContactRequest(payload) {
    const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.error || 'Unable to submit your request right now.');
    }

    return result;
}

// ===========================
// Snake Game (simple, ASCII)
// ===========================

let snakeInterval = null;
let snakeKeyHandler = null;
let snakeState = null;

function startSnakeGame() {
    if (window.terminalState?.isInteractive && window.terminalState.isInteractive()) {
        addOutput('Finish the current interactive session first.', 'error-text');
        return;
    }

    const width = 32;
    const height = 16;
    const tickMs = 120;

    // Initialize state
    const startX = Math.floor(width / 2);
    const startY = Math.floor(height / 2);
    snakeState = {
        width,
        height,
        dir: 'right',
        nextDir: 'right',
        snake: [ {x: startX - 2, y: startY}, {x: startX - 1, y: startY}, {x: startX, y: startY} ],
        food: null,
        score: 0,
        boardEl: null,
        scoreEl: null,
        running: true
    };

    // Build UI elements
    addOutput('╔══════════════ S N A K E ══════════════╗', 'welcome-divider');
    const scoreEl = document.createElement('div');
    scoreEl.className = 'output-line info-text';
    scoreEl.textContent = 'Score: 0';
    appendNode(scoreEl);
    snakeState.scoreEl = scoreEl;

    const board = document.createElement('pre');
    board.className = 'output-line ascii';
    board.setAttribute('aria-label', 'Snake game board');
    appendNode(board);
    snakeState.boardEl = board;

    const help = document.createElement('div');
    help.className = 'output-line muted-text';
    help.textContent = 'Controls: ← ↑ → ↓ to move • Q to quit';
    appendNode(help);

    addOutput('╚═══════════════════════════════════════╝', 'welcome-divider');

    // Place initial food
    placeFood();
    renderBoard();

    // Enter interactive mode to suppress history/autocomplete
    window.terminalState?.setInteractiveHandler(() => {});

    // Key handler
    snakeKeyHandler = (e) => {
        const key = e.key;
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','q','Q','Escape'].includes(key)) {
            e.preventDefault();
            e.stopPropagation();
        }
        switch (key) {
            case 'ArrowUp': if (snakeState.dir !== 'down') snakeState.nextDir = 'up'; break;
            case 'ArrowDown': if (snakeState.dir !== 'up') snakeState.nextDir = 'down'; break;
            case 'ArrowLeft': if (snakeState.dir !== 'right') snakeState.nextDir = 'left'; break;
            case 'ArrowRight': if (snakeState.dir !== 'left') snakeState.nextDir = 'right'; break;
            case 'q':
            case 'Q':
            case 'Escape':
                endSnakeGame('Exited');
                break;
        }
    };
    document.addEventListener('keydown', snakeKeyHandler, { capture: true });

    // Game loop
    snakeInterval = setInterval(tickSnake, tickMs);
}

function tickSnake() {
    if (!snakeState?.running) return;
    const { width, height } = snakeState;
    const head = snakeState.snake[snakeState.snake.length - 1];
    let nx = head.x;
    let ny = head.y;
    snakeState.dir = snakeState.nextDir;
    switch (snakeState.dir) {
        case 'up': ny -= 1; break;
        case 'down': ny += 1; break;
        case 'left': nx -= 1; break;
        case 'right': nx += 1; break;
    }

    // Wrap around edges for more fun (no hard walls)
    if (nx < 0) nx = width - 1;
    if (nx >= width) nx = 0;
    if (ny < 0) ny = height - 1;
    if (ny >= height) ny = 0;

    // Check self collision
    if (snakeState.snake.some(seg => seg.x === nx && seg.y === ny)) {
        endSnakeGame('Game Over');
        return;
    }

    // Move
    snakeState.snake.push({ x: nx, y: ny });

    // Eat food?
    if (snakeState.food && snakeState.food.x === nx && snakeState.food.y === ny) {
        snakeState.score += 10;
        if (snakeState.scoreEl) snakeState.scoreEl.textContent = 'Score: ' + snakeState.score;
        placeFood();
        // Grow: do not pop tail this tick
    } else {
        // Normal move: remove tail
        snakeState.snake.shift();
    }

    renderBoard();
}

function placeFood() {
    const { width, height } = snakeState;
    while (true) {
        const fx = Math.floor(Math.random() * width);
        const fy = Math.floor(Math.random() * height);
        if (!snakeState.snake.some(seg => seg.x === fx && seg.y === fy)) {
            snakeState.food = { x: fx, y: fy };
            return;
        }
    }
}

function renderBoard() {
    const { width, height, snake, food } = snakeState;
    // Build a char matrix
    const grid = new Array(height);
    for (let y = 0; y < height; y++) {
        const row = new Array(width);
        for (let x = 0; x < width; x++) row[x] = ' ';
        grid[y] = row;
    }
    // Draw snake
    for (let i = 0; i < snake.length - 1; i++) {
        const s = snake[i];
        grid[s.y][s.x] = '■';
    }
    // Head with brighter char
    const head = snake[snake.length - 1];
    grid[head.y][head.x] = '█';
    // Food
    if (food) grid[food.y][food.x] = '●';

    // Render into <pre>
    let lines = [];
    for (let y = 0; y < height; y++) {
        lines.push(grid[y].join(''));
    }
    if (snakeState.boardEl) snakeState.boardEl.textContent = lines.join('\n');
}

function endSnakeGame(reason) {
    if (!snakeState) return;
    snakeState.running = false;
    if (snakeInterval) {
        clearInterval(snakeInterval);
        snakeInterval = null;
    }
    if (snakeKeyHandler) {
        document.removeEventListener('keydown', snakeKeyHandler, { capture: true });
        snakeKeyHandler = null;
    }
    addOutput(`${reason}! Final score: ${snakeState.score}`, reason === 'Game Over' ? 'error-text' : 'info-text');
    window.terminalState?.setInteractiveHandler(null);
}

// ===========================
// Red Pill / Blue Pill Game
// ===========================

let pillSession = null;

function startPillsGame(drama = false) {
    if (window.terminalState?.isInteractive && window.terminalState.isInteractive()) {
        addOutput('Finish the current interactive session first.', 'error-text');
        return;
    }

    if (drama) {
        addOutput('Accessing meaning.of.life.exe…', 'muted-text');
        addOutput('Loading Oracle.dll……', 'muted-text');
        addOutput('Decrypting fate matrices…', 'muted-text');
    } else {
        addOutput('Wake up, Neo…', 'muted-text');
        addOutput('Follow the white rabbit.', 'muted-text');
    }
    addOutput(' ', '');

    // Render two pills side-by-side using the neofetch container flex style
    const container = document.createElement('div');
    container.className = 'neofetch-container';

    const red = document.createElement('pre');
    red.className = 'ascii red-text';
    red.textContent = '      █████████\n    ████  RED ████\n      █████████';

    const blue = document.createElement('pre');
    blue.className = 'ascii blue-text';
    blue.textContent = '      █████████\n    ███ BLUE ███\n      █████████';

    container.appendChild(red);
    container.appendChild(blue);
    appendNode(container);

    addOutput('Choose your path: [red] or [blue]', 'question-text');
    addOutput('Type red or blue and press Enter.', 'muted-text');

    pillSession = { awaiting: true };
    window.terminalState?.setInteractiveHandler(handlePillsInput);
}

function handlePillsInput(value, input, updateCursorPositionFn) {
    if (!pillSession) {
        window.terminalState?.setInteractiveHandler(null);
        return;
    }

    const choice = (value || '').trim().toLowerCase();
    if (!choice) {
        addOutput('Say red or blue.', 'error-text');
        return;
    }
    if (choice.startsWith('r')) {
        addOutput('You take the RED pill…', 'red-text');
        // Small dramatic ellipsis
        const status = appendLine('Deeper. Deeper.. Deeper...', 'muted-text');
        let dots = 0;
        const iv = setInterval(() => {
            dots = (dots + 1) % 4;
            status.textContent = 'Deeper' + '.'.repeat(dots);
        }, 220);
        // Trigger matrix rain overlay and then conclude
        setTimeout(() => {
            clearInterval(iv);
            status.textContent = 'Tracing reality…';
            try { createMatrixEffect(); } catch (e) {}
            setTimeout(() => {
                addOutput('Welcome to the desert of the real.', 'info-text');
                addOutput('The choice is made. Nothing will ever be the same.', 'muted-text');
                endPills(input, updateCursorPositionFn);
            }, 1800);
        }, 1200);
    } else if (choice.startsWith('b')) {
        addOutput('You take the BLUE pill…', 'blue-text');
        addOutput('The story ends. You wake up in your bed…', 'muted-text');
        // Fun little dream animation
        const z = appendLine('Z', 'muted-text');
        let count = 0;
        const iv2 = setInterval(() => {
            count++;
            z.textContent = 'Z' + 'z'.repeat(count % 6);
            if (count > 18) {
                clearInterval(iv2);
                addOutput('…and believe whatever you want to believe.', 'info-text');
                endPills(input, updateCursorPositionFn);
            }
        }, 140);
    } else {
        addOutput('Only two choices: red or blue.', 'error-text');
    }
}

function endPills(input, updateCursorPositionFn) {
    pillSession = null;
    window.terminalState?.setInteractiveHandler(null);
    input.value = '';
    updateCursorPositionFn();
    addOutput('Tip: try snake, neofetch, or matrix.', 'muted-text');
}

// ===========================
// Nano Editor (line-based)
// ===========================

let nanoSession = null;

function startNanoEditor(target) {
    if (window.terminalState?.isInteractive && window.terminalState.isInteractive()) {
        addOutput('Finish the current interactive session first.', 'error-text');
        return;
    }
    const cwd = window.terminalState?.cwd || '/';
    const path = resolvePath(target, cwd);
    const node = vfs.getNode(path);
    if (node && node.type === 'dir') {
        addOutput(`nano: ${target}: Is a directory`, 'error-text');
        return;
    }
    const existing = (node && node.type === 'text') ? node.content : '';

    addOutput(`nano ${target}`, 'welcome-text');
    addOutput('Editing. Type text and press Enter for new lines.', 'muted-text');
    addOutput('Commands: Ctrl+X to save & quit, Esc to abort, or :wq / :x / :q / :q!', 'muted-text');
    if (existing) {
        addOutput('--- current content ---', 'muted-text');
        addOutput(existing);
        addOutput('--- end current content ---', 'muted-text');
    }

    nanoSession = { path, buffer: [] };
    window.terminalState?.setInteractiveHandler(handleNanoInput);
}

function handleNanoInput(value, input, updateCursorPositionFn) {
    if (!nanoSession) { window.terminalState?.setInteractiveHandler(null); return; }
    // Normalize
    const v = (value || '').trim();
    const saveAndQuit = v === ':wq' || v === ':x' || v === 'save' || v === 'write' || v === 'exit' || v === ':ctrlx';
    const abortQuit = v === ':q!' || v === ':q' || v === 'quit' || v === 'abort' || v === ':esc';

    if (saveAndQuit) {
        try {
            vfs.setTextFile(nanoSession.path, nanoSession.buffer.join('\n'));
            addOutput('Saved.', 'success-text');
        } catch (e) {
            addOutput('nano: ' + (e?.message || 'save error'), 'error-text');
        }
        nanoSession = null;
        window.terminalState?.setInteractiveHandler(null);
        input.value = '';
        updateCursorPositionFn();
        return;
    }
    if (abortQuit) {
        addOutput('Aborted.', 'error-text');
        nanoSession = null;
        window.terminalState?.setInteractiveHandler(null);
        input.value = '';
        updateCursorPositionFn();
        return;
    }

    nanoSession.buffer.push(value);
    addOutput('│ ' + value, 'muted-text');
    input.value = '';
    updateCursorPositionFn();
}

// ===========================
// Path helpers
// ===========================
function resolvePath(input, cwd) {
    if (!input) return cwd || '/';
    if (input === '~') return '/home/guest';
    return vfs.join(cwd || '/', input);
}
