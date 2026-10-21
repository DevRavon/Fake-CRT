import {ARCH_LOGO, SESSION_START} from './config.js';
const $ = (selector, root = document) => root.querySelector(selector);
const chooser = $('#chooser');
const workspace = $('#workspace');
const desktop = $('#desktop-view');
const terminal = $('#terminal-view');
const layer = $('#window-layer');
const taskbar = $('#taskbar');
const terminalBody = $('#terminal-body');
const terminalInput = $('#terminal-input');
const terminalShell = $('.terminal-shell');
const launcher = $('#app-launcher');
let mode = null;
let zIndex = 30;
let activeWindow = null;
let cwd = '/';
let history = [];
let historyIndex = -1;
const windows = new Map();
const contactDraft = {};
const titles = {files:'Files',about:'About Ravon',projects:'Projects',skills:'Toolkit',games:'Playground',contact:'Get in touch',terminal:'Terminal'};
const icons = {files:'▤',about:'◈',projects:'▦',skills:'⌘',games:'✳',contact:'✉',terminal:'>_'};

const pages = {
  files: `<div class="files-app"><aside class="files-sidebar"><span class="section-label">PLACES</span><button data-path="/">⌂ <span>Home</span></button><button data-path="/about">◈ <span>About</span></button><button data-path="/projects">▦ <span>Projects</span></button><button data-path="/games">✳ <span>Games</span></button><button data-path="/contact">✉ <span>Contact</span></button></aside><div class="files-main"><div class="files-toolbar"><button class="files-back" aria-label="Back">←</button><button class="files-up" aria-label="Up one folder">↑</button><div class="files-path" aria-label="Current folder"></div></div><div class="files-list" aria-live="polite"></div><div class="files-preview hidden"></div></div></div>`,
  terminal: '',
  about: `<span class="section-label">01 / ABOUT</span><h2>Hey, I'm Ravon.</h2><p class="intro-lead">I like turning a complicated problem into a useful, approachable tool.</p><p>My interests meet at the intersection of practical software, Linux, networking, and automation. I experiment in a homelab, build with JavaScript, and enjoy finding better ways for people to work with technology.</p><hr class="content-rule"><h3>What you'll find here</h3><div class="feature-grid"><button class="feature-tile" data-open="projects"><span class="tile-icon">▦</span><strong>Selected projects</strong><small>Things I'm building and learning from.</small></button><button class="feature-tile" data-open="skills"><span class="tile-icon">⌘</span><strong>My toolkit</strong><small>The tools and systems I work with.</small></button></div><hr class="content-rule"><a class="text-link" href="https://github.com/DevRavon" target="_blank" rel="noopener noreferrer">View GitHub ↗</a> &nbsp; <button class="text-link" data-open="contact" style="border:0;background:none;cursor:pointer">Start a conversation ↗</button>`,
  projects: `<span class="section-label">02 / WORK & EXPERIMENTS</span><h2>Projects with a purpose.</h2><p>Some work is about making a daily process easier. Some is about learning how the pieces fit together. Here's a little of both.</p><div class="project-grid"><article class="project-card"><span class="project-index">01 / WEB</span><strong>Ravon.dev</strong><p>A personal site with two ways in: a visual desktop and a command line. Built in plain JavaScript.</p><small><a href="https://github.com/DevRavon/Fake-CRT" target="_blank" rel="noopener noreferrer">Explore source ↗</a></small></article><article class="project-card"><span class="project-index">02 / SYSTEMS</span><strong>Home lab</strong><p>Hands-on experiments with virtual machines, containers, Linux, private networking, and self-hosted services.</p><small>Proxmox · Docker · Tailscale</small></article><article class="project-card"><span class="project-index">03 / AUTOMATION</span><strong>Workflow tools</strong><p>Exploring useful ways to connect forms, spreadsheets, and operational information to reduce repetitive work.</p><small>Power Platform · JavaScript</small></article><article class="project-card"><span class="project-index">04 / YOUR IDEA</span><strong>Let's build something</strong><p>Have a problem worth solving or a project to discuss? I'd like to hear about it.</p><small><button class="text-link" data-open="contact" style="border:0;background:none;padding:0;cursor:pointer">Get in touch ↗</button></small></article></div>`,
  skills: `<span class="section-label">03 / TOOLKIT</span><h2>Curious by default.</h2><p>Tools are useful when they help people get something done. These are areas I keep exploring and putting to work.</p><div class="tool-grid"><div class="tool-card"><span class="tile-icon">⌘</span><strong>Web & scripting</strong><small>JavaScript, HTML, CSS, Google Apps Script</small></div><div class="tool-card"><span class="tile-icon">▣</span><strong>Linux & infrastructure</strong><small>Linux administration, Proxmox, Docker, self-hosting</small></div><div class="tool-card"><span class="tile-icon">◇</span><strong>Networking</strong><small>VLANs, Tailscale, troubleshooting, lab environments</small></div><div class="tool-card"><span class="tile-icon">↗</span><strong>Automation</strong><small>Power Apps, Power Automate, spreadsheets, practical workflows</small></div></div><hr class="content-rule"><p>Interested in comparing notes or working on a useful idea?</p><button class="primary-button" data-open="contact">Let's talk <span>↗</span></button>`,
  games: `<span class="section-label">04 / PLAYGROUND</span><h2>Take a break.</h2><p>A little play belongs in any good workspace. Pick a game below.</p><div class="game-grid"><button class="game-card" data-game="snake"><span class="tile-icon">▦</span><strong>Snake</strong><small>Collect the orange squares. Arrow keys or on-screen controls.</small></button><button class="game-card" data-game="tic"><span class="tile-icon">✳</span><strong>Tic-tac-toe</strong><small>Two players, one screen. Take turns placing X and O.</small></button></div><div id="game-area"></div>`,
  contact: `<span class="section-label">05 / CONTACT</span><h2>Let's make a connection.</h2><p>Tell me what you're working on, ask a question, or just say hello. Your message comes straight to my inbox.</p><div class="contact-layout"><form class="contact-form" id="contact-form"><div class="field-row"><label>Your name<input name="name" autocomplete="name" maxlength="100" required placeholder="Your name"></label><label>Email address<input type="email" name="email" autocomplete="email" maxlength="254" required placeholder="you@example.com"></label></div><label>Subject<input name="subject" maxlength="150" required placeholder="What would you like to discuss?"></label><label>Message<textarea name="message" maxlength="5000" required placeholder="Tell me a little about it..."></textarea></label><label class="honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><button type="submit" class="primary-button">Send message <span>↗</span></button><p class="contact-status" role="status" aria-live="polite"></p></form><aside class="contact-aside"><span class="section-label">OTHER WAYS</span><p>Email directly:<br><a class="text-link" href="mailto:admin@ravon.dev">admin@ravon.dev</a></p><p>See what I'm building:<br><a class="text-link" href="https://github.com/DevRavon" target="_blank" rel="noopener noreferrer">GitHub ↗</a></p><p>I read every message. Please don't include passwords or sensitive information.</p></aside></div>`
};

function updateClock() { $('#clock').textContent = new Intl.DateTimeFormat(undefined,{weekday:'short',hour:'numeric',minute:'2-digit'}).format(new Date()); }
updateClock();
setInterval(updateClock, 30000);

function closeAllWindows() { for (const id of [...windows.keys()]) closeWindow(id); }
function printWelcome() {
  if (terminalBody.childElementCount) return;
  printLine(ARCH_LOGO, 'accent-line terminal-logo');
  printLine("Welcome to ravon.dev. You're in the Terminal. Type help to explore, or desktop to switch views.");
}
function chooseMode(next, welcome = false) {
  closeLauncher();
  mode = next;
  chooser.classList.add('hidden');
  workspace.classList.remove('hidden');
  desktop.classList.toggle('hidden', next !== 'desktop');
  terminal.classList.toggle('hidden', next !== 'terminal');
  $('#workspace-label').textContent = next === 'desktop' ? 'Workspace' : 'Terminal';
  closeAllWindows();
  if (next === 'desktop' && welcome) openApp('about');
  if (next === 'terminal') {
    printWelcome();
    setTimeout(() => terminalInput.focus(), 0);
  }
}
function returnHome() {
  closeLauncher();
  closeAllWindows(); mode = null;
  workspace.classList.add('hidden'); chooser.classList.remove('hidden');
  $('#chooser').scrollIntoView();
}
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => chooseMode(button.dataset.mode, button.dataset.mode === 'desktop')));
$('#topbar-home').addEventListener('click', returnHome);
$('#mode-switch').addEventListener('click', returnHome);
$('#terminal-desktop').addEventListener('click', () => chooseMode('desktop', true));
function closeLauncher() {launcher.classList.add('hidden');$('#activities-button').setAttribute('aria-expanded','false');}
$('#activities-button').addEventListener('click', () => {launcher.classList.toggle('hidden');$('#activities-button').setAttribute('aria-expanded',String(!launcher.classList.contains('hidden')));});
document.addEventListener('keydown', event => {if(event.key === 'Escape') closeLauncher();});
document.addEventListener('click', event => {
  if (!event.target.closest('#app-launcher,#activities-button')) closeLauncher();
  const opener = event.target.closest('[data-open]');
  if (opener) openApp(opener.dataset.open);
  const folder = event.target.closest('[data-folder]');
  if (folder) openApp('files',folder.dataset.folder);
});

function focusWindow(id) {
  const entry = windows.get(id); if (!entry) return;
  if (activeWindow === 'games' && id !== 'games') windows.get('games')?.cleanup?.('pause');
  zIndex += 1; entry.node.style.zIndex = zIndex; activeWindow = id;
  const restoring = entry.node.classList.contains('is-minimized');
  entry.node.classList.remove('is-minimized');
  if (restoring || id === 'games') entry.resume?.();
  renderTaskbar();
}
function renderTaskbar() {
  taskbar.replaceChildren();
  for (const [id, entry] of windows) {
    const button = document.createElement('button');
    button.textContent = `${icons[id]} ${titles[id]}`;
    button.setAttribute('aria-label', `Restore ${titles[id]}`);
    button.addEventListener('click', () => focusWindow(id));
    taskbar.append(button);
  }
  document.querySelectorAll('.dock [data-open]').forEach(button => button.classList.toggle('active', windows.has(button.dataset.open)));
}
function closeWindow(id) {
  const entry = windows.get(id); if (!entry) return;
  if (id === 'terminal') terminal.prepend(terminalShell);
  entry.cleanup?.(); entry.node.remove(); windows.delete(id);
  if (activeWindow === id) activeWindow = null;
  renderTaskbar();
}
function openApp(id, startPath) {
  if (!(id in pages)) return;
  if (id === 'terminal' && mode === 'terminal') {terminalInput.focus();return;}
  if (windows.has(id)) { focusWindow(id); if(id === 'files' && startPath) windows.get(id).navigate(startPath); return; }
  const node = document.createElement('section');
  node.className = 'app-window';
  node.setAttribute('role','dialog');
  node.setAttribute('aria-label', titles[id]);
  node.innerHTML = `<div class="app-titlebar"><span class="app-title"><span class="app-title-icon">${icons[id]}</span>${titles[id]}</span><span class="window-actions"><button data-action="minimize" aria-label="Minimize ${titles[id]}">−</button><button data-action="maximize" aria-label="Maximize ${titles[id]}">□</button><button data-action="close" aria-label="Close ${titles[id]}">×</button></span></div><div class="app-content">${pages[id]}</div>`;
  node.style.left = `calc(50% - 300px + ${windows.size * 22}px)`;
  node.style.top = `calc(8% + ${windows.size * 20}px)`;
  layer.append(node);
  windows.set(id,{node,cleanup:null});
  if (id === 'terminal') {printWelcome();node.classList.add('terminal-app');$('.app-content',node).append(terminalShell);setTimeout(()=>terminalInput.focus(),0);}
  node.addEventListener('pointerdown', () => focusWindow(id));
  node.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.action === 'close') closeWindow(id);
    if (button.dataset.action === 'minimize') {node.classList.add('is-minimized'); windows.get(id)?.cleanup?.('pause');}
    if (button.dataset.action === 'maximize') node.classList.toggle('is-maximized');
  }));
  enableDrag(node);
  if (id === 'contact') setupContact(node);
  if (id === 'games') setupGames(node);
  if (id === 'files') setupFiles(node,startPath || '/');
  focusWindow(id);
}
function enableDrag(node) {
  const handle = $('.app-titlebar', node);
  handle.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || window.innerWidth <= 800 || node.classList.contains('is-maximized')) return;
    const startX = event.clientX, startY = event.clientY, left = node.offsetLeft, top = node.offsetTop;
    handle.setPointerCapture(event.pointerId);
    const move = e => {
      node.style.left = Math.max(0,Math.min(window.innerWidth - node.offsetWidth, left + e.clientX - startX)) + 'px';
      node.style.top = Math.max(0,Math.min(window.innerHeight - 85 - node.offsetHeight, top + e.clientY - startY)) + 'px';
    };
    const end = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', end); handle.removeEventListener('pointercancel', end); };
    handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
  });
}
function setupContact(node) {
  const form = $('#contact-form', node), status = $('.contact-status', node), submit = $('button[type=submit]', form);
  for (const [key,value] of Object.entries(contactDraft)) if(form.elements.namedItem(key)) form.elements.namedItem(key).value=value;
  form.addEventListener('input',event=>{if(event.target.name && event.target.name !== 'website') contactDraft[event.target.name]=event.target.value;});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || submit.disabled) return;
    submit.disabled = true; submit.textContent = 'Sending…'; status.textContent = ''; status.className = 'contact-status';
    const data = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      const result = await response.json().catch(()=>({error:'The message could not be sent right now. Please email admin@ravon.dev directly.'}));
      if (!response.ok) throw new Error(result.error || 'The message could not be sent. Please try again.');
      form.reset(); Object.keys(contactDraft).forEach(key=>delete contactDraft[key]); status.textContent = 'Message sent. Thanks for reaching out!'; status.classList.add('success');
    } catch (error) {
      status.textContent = error.message || 'Something went wrong. You can email admin@ravon.dev directly.';
      status.classList.add('error');
    } finally {submit.disabled = false; submit.innerHTML = 'Send message <span>↗</span>';}
  });
}

function printLine(value, className = '') {
  const line = document.createElement('div');
  line.className = 'terminal-line ' + className;
  line.textContent = value;
  terminalBody.append(line);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}
const files = {
  '/': ['about/','projects/','contact/','games/','pictures/','readme.txt','notes.txt'],
  '/about': ['bio.txt','toolkit.txt'],
  '/projects': ['ravon.dev.txt','homelab.txt','workflows.txt'],
  '/contact': ['email.txt','message.txt'],
  '/games': ['snake.exe','tic-tac-toe.exe'],
  '/pictures': ['ravon-dev.svg','matrix.svg']
};
const fileText = {
  '/readme.txt': 'Welcome to ravon.dev. Type help for commands, or desktop for the visual experience.',
  '/notes.txt': 'My notes\n\nA quiet space to write down an idea. These notes stay in this browser.',
  '/about/bio.txt': "I'm Ravon. I build useful tools, experiment with Linux and networking, and enjoy making technology more approachable.",
  '/about/toolkit.txt': 'JavaScript · Linux · Proxmox · Docker · Tailscale · Power Platform · Google Apps Script',
  '/projects/ravon.dev.txt': 'A personal site built in plain JavaScript with desktop and terminal experiences. Source: https://github.com/DevRavon/Fake-CRT',
  '/projects/homelab.txt': 'Hands-on experiments with virtual machines, containers, Linux, and private networking.',
  '/projects/workflows.txt': 'Exploring ways to connect forms, spreadsheets, and operational information.',
  '/contact/email.txt': 'admin@ravon.dev',
  '/contact/message.txt': 'Run contact to open the secure message form.'
};
const fileImages = {'/pictures/ravon-dev.svg':'img/ravon-dev.svg','/pictures/matrix.svg':'img/matrix.svg'};
try {fileText['/notes.txt'] = localStorage.getItem('ravon-notes') || fileText['/notes.txt'];} catch {}
function setupFiles(node, initialPath) {
  const list = $('.files-list',node), preview = $('.files-preview',node), breadcrumbs = $('.files-path',node);
  const back = $('.files-back',node), up = $('.files-up',node);
  let current = '/', trail = [], showingFile = false;
  function navigate(path, record = true) {
    if (!files[path] && !fileText[path] && !fileImages[path]) return;
    if (record && (path !== current || showingFile)) trail.push({path:current,file:showingFile ? preview.dataset.path : null});
    showingFile = !!fileText[path] || !!fileImages[path];
    current = showingFile ? (path.slice(0,path.lastIndexOf('/')) || '/') : path;
    back.disabled = !trail.length;
    up.disabled = current === '/' && !showingFile;
    breadcrumbs.replaceChildren();
    const segments = current.split('/').filter(Boolean);
    const crumbs = [{name:'Home',path:'/'}];
    segments.forEach((segment,index) => crumbs.push({name:segment,path:'/' + segments.slice(0,index+1).join('/')}));
    crumbs.forEach((crumb,index) => {
      const button = document.createElement('button');
      button.textContent = crumb.name;
      button.addEventListener('click',()=>navigate(crumb.path));
      breadcrumbs.append(button);
      if(index < crumbs.length - 1) breadcrumbs.append(document.createTextNode(' / '));
    });
    list.classList.toggle('hidden',showingFile); preview.classList.toggle('hidden',!showingFile);
    if (showingFile) {
      preview.dataset.path = path;
      preview.replaceChildren();
      const label = document.createElement('span'); label.className = 'section-label'; label.textContent = (fileImages[path] ? 'IMAGE / ' : 'TEXT DOCUMENT / ') + path.split('/').pop();
      preview.append(label);
      if (fileImages[path]) {const img=document.createElement('img');img.src=fileImages[path];img.alt=path.split('/').pop();img.className='files-image';preview.append(img);}
      else if(path === '/notes.txt') {
        const editor=document.createElement('textarea');editor.className='notes-editor';editor.value=fileText[path];editor.maxLength=5000;editor.setAttribute('aria-label','Edit local notes');
        const save=document.createElement('button');save.className='primary-button';save.textContent='Save notes';
        const status=document.createElement('p');status.className='files-hint';status.textContent='Saved only in this browser.';
        save.addEventListener('click',()=>{fileText[path]=editor.value;try{localStorage.setItem('ravon-notes',editor.value);status.textContent='Saved in this browser.';}catch{status.textContent='Storage is unavailable in this browser.';}});
        preview.append(editor,save,status);
      } else {const content=document.createElement('p');content.textContent=fileText[path];preview.append(content);}
    } else {
      list.replaceChildren();
      files[path].forEach(name => {
        const folder = name.endsWith('/');
        const full = (path === '/' ? '' : path) + '/' + name.replace(/\/$/,'');
        const button = document.createElement('button'); button.className = 'file-item';
        const icon = document.createElement('span'); icon.className = folder ? 'file-folder' : 'file-document'; icon.textContent = folder ? '▤' : name.endsWith('.exe') ? '✳' : '≡';
        const title = document.createElement('span'); title.textContent = name.replace(/\/$/,'');
        button.append(icon,title);
        button.addEventListener('click',()=>{
          if(folder || fileText[full] || fileImages[full]) navigate(full);
          else if(name === 'snake.exe' || name === 'tic-tac-toe.exe') {
            openApp('games'); setTimeout(() => $('[data-game='+ (name === 'snake.exe' ? 'snake' : 'tic') +']',windows.get('games')?.node)?.click(),0);
          }
        });
        list.append(button);
      });
      const hint = document.createElement('p'); hint.className='files-hint'; hint.textContent = 'These are the same folders you can explore with ls, cd, and cat in Terminal.'; list.append(hint);
    }
  }
  back.addEventListener('click',()=>{const previous = trail.pop(); if(!previous) return; navigate(previous.file || previous.path,false);back.disabled=!trail.length;});
  up.addEventListener('click',()=>navigate(showingFile ? current : (current.slice(0,current.lastIndexOf('/')) || '/')));
  node.querySelectorAll('[data-path]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.path)));
  windows.get('files').navigate = navigate;
  navigate(initialPath,false);
}
function resolvePath(path = '.') {
  const parts = (path.startsWith('/') ? path : cwd + '/' + path).split('/');
  const result = [];
  for (const part of parts) {if (!part || part === '.') continue; if (part === '..') result.pop(); else result.push(part);}
  return '/' + result.join('/');
}
function runCommand(raw) {
  const text = raw.trim(); if (!text) return;
  printLine(`ravon@dev:${cwd === '/' ? '~' : cwd}$ ${text}`, 'prompt-line');
  history.unshift(text); history = history.slice(0,50); historyIndex = -1;
  const [command, ...args] = text.split(/\s+/);
  const arg = args.join(' ');
  switch(command.toLowerCase()) {
    case 'help': printLine('COMMANDS\nhelp         Show this list\nabout        Meet Ravon\nprojects     Explore projects\nskills       See the toolkit\ncontact      Open the message form\ngames        Open the playground\nsnake        Play Snake\nls [path]    List a folder\ncd [path]    Change folder\ncat [file]   Read a file\nnano notes.txt Edit local notes\ntree [path]  Show folder contents\nopen [path]  Open in Files or launch an app\npwd          Current folder\nneofetch     Show Ravon OS info\nuptime       Session time\nhistory      Recent commands\nwhoami       Current user\ndate         Local date and time\necho TEXT    Print text\nclear        Clear output\ndesktop      Switch to desktop\nexit         Choose an interface'); break;
    case 'about': printLine(fileText['/about/bio.txt']); break;
    case 'projects': printLine('PROJECTS\n01  Ravon.dev — two ways to explore this site\n02  Home lab — Linux, VMs, containers, networking\n03  Workflow tools — practical automation\nRun desktop to browse the project cards.'); break;
    case 'skills': printLine(fileText['/about/toolkit.txt']); break;
    case 'whoami': printLine('Ravon Gordon'); break;
    case 'pwd': printLine(cwd); break;
    case 'date': printLine(new Date().toString()); break;
    case 'neofetch': printLine(ARCH_LOGO + '\nravon@dev  ·  JavaScript / Web Desktop\nShell: Terminal  ·  Home: ravon.dev\nApps: Files, Projects, Toolkit, Games, Contact', 'accent-line'); break;
    case 'uptime': printLine(`Session uptime: ${Math.floor((Date.now()-SESSION_START)/60000)} minute(s)`); break;
    case 'history': printLine(history.slice(0,20).reverse().map((item,index)=>`${index+1}  ${item}`).join('\n')); break;
    case 'echo': printLine(arg); break;
    case 'clear': terminalBody.replaceChildren(); break;
    case 'ls': {const path = resolvePath(args[0]); printLine(files[path]?.join('  ') || `ls: cannot access '${args[0]}': No such directory`); break;}
    case 'cd': {const path = resolvePath(args[0] || '/'); if (files[path]) {cwd = path; $('#terminal-prompt').textContent = `ravon@dev:${cwd === '/' ? '~' : cwd}$`;} else printLine(`cd: ${args[0]}: No such directory`,'error-line'); break;}
    case 'cat': {const path = resolvePath(args[0] || ''); printLine(fileText[path] || `cat: ${args[0] || ''}: No such file`); break;}
    case 'nano': {const path=resolvePath(args[0] || 'notes.txt');if(path === '/notes.txt') openApp('files',path);else printLine('nano: only ~/notes.txt is editable here.','error-line');break;}
    case 'tree': {const path = resolvePath(args[0] || '.'); if(!files[path]) {printLine(`tree: ${args[0] || ''}: No such directory`,'error-line');break;} printLine([path,...files[path].map(item=>'  ├─ '+item)].join('\n')); break;}
    case 'open': {
      const target = args[0] || '.';
      if (['about','projects','skills','contact','games','files'].includes(target)) {openApp(target);break;}
      const path = resolvePath(target);
      if (files[path] || fileText[path] || fileImages[path]) openApp('files',path);
      else if(path.endsWith('/snake.exe') || path.endsWith('/tic-tac-toe.exe')) {openApp('games');setTimeout(() => $('[data-game='+ (path.endsWith('/snake.exe') ? 'snake' : 'tic') +']',windows.get('games')?.node)?.click(),0);}
      else printLine(`open: ${target}: No such file or app`,'error-line');
      break;
    }
    case 'contact': openApp('contact'); break;
    case 'games': openApp('games'); break;
    case 'snake': openApp('games'); setTimeout(() => $('[data-game=snake]', windows.get('games')?.node)?.click(), 0); break;
    case 'desktop': case 'gui': chooseMode('desktop',true); break;
    case 'exit': returnHome(); break;
    default: printLine(`${command}: command not found. Type help for available commands.`,'error-line');
  }
}
$('#terminal-form').addEventListener('submit', event => {event.preventDefault(); runCommand(terminalInput.value); terminalInput.value = '';});
terminalInput.addEventListener('keydown', event => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault(); historyIndex = Math.max(-1,Math.min(history.length - 1, historyIndex + (event.key === 'ArrowUp' ? 1 : -1))); terminalInput.value = historyIndex < 0 ? '' : history[historyIndex];
  }
  if (event.key === 'Tab') {
    const options = ['help','about','projects','skills','contact','games','snake','ls','cd','cat','nano','tree','open','pwd','neofetch','uptime','history','whoami','date','echo','clear','desktop','exit'];
    const match = options.find(value => value.startsWith(terminalInput.value.toLowerCase()));
    if (match) {event.preventDefault();terminalInput.value = match;}
  }
});

function setupGames(node) {
  const area = $('#game-area', node);
  let stop = () => {};
  windows.get('games').cleanup = reason => {stop(reason); if (reason !== 'pause') stop = () => {};};
  windows.get('games').resume = () => stop.resume?.();
  const visibility = () => {if(document.hidden) stop('pause');};
  document.addEventListener('visibilitychange',visibility);
  const originalCleanup = windows.get('games').cleanup;
  windows.get('games').cleanup = reason => {originalCleanup(reason);if(reason !== 'pause') document.removeEventListener('visibilitychange',visibility);};
  node.querySelectorAll('[data-game]').forEach(button => button.addEventListener('click', () => {
    stop(); area.replaceChildren();
    if (button.dataset.game === 'snake') stop = startSnake(area, node);
    else {startTicTacToe(area); stop = () => {};}
  }));
}
function startSnake(area, node) {
  area.innerHTML = '<hr class="content-rule"><div class="game-stage"><h3>Snake <span id="snake-score">· Score 0</span></h3><canvas width="300" height="300" aria-label="Snake game board"></canvas><p id="snake-status">Use arrow keys or the controls below. Press Space to pause.</p><div class="game-controls"><button data-dir="up" aria-label="Up">↑</button><button data-dir="left" aria-label="Left">←</button><button data-dir="down" aria-label="Down">↓</button><button data-dir="right" aria-label="Right">→</button><button data-restart>Restart</button></div></div>';
  const canvas = $('canvas',area), ctx = canvas.getContext('2d'), status = $('#snake-status',area), scoreEl = $('#snake-score',area);
  let snake, food, direction, next, score, timer = null, paused = false;
  const randomFood = () => {const free=[];for(let y=0;y<20;y++)for(let x=0;x<20;x++)if(!snake.some(p=>p.x===x&&p.y===y))free.push({x,y});return free[Math.floor(Math.random()*free.length)];};
  const draw = () => {ctx.fillStyle='#201b26';ctx.fillRect(0,0,300,300);ctx.fillStyle='#fa9365';if(food)ctx.fillRect(food.x*15+2,food.y*15+2,11,11);ctx.fillStyle='#a9d5b2';snake.forEach((p,i)=>{ctx.fillStyle=i?'#a9d5b2':'#eef7ee';ctx.fillRect(p.x*15+1,p.y*15+1,13,13);});};
  function halt(message){clearInterval(timer);timer=null;status.textContent=message;}
  function tick() {
    direction=next;const head={x:snake[0].x+direction.x,y:snake[0].y+direction.y};
    const eats=food&&head.x===food.x&&head.y===food.y;
    const body=eats?snake:snake.slice(0,-1);
    if(head.x<0||head.x>=20||head.y<0||head.y>=20||body.some(p=>p.x===head.x&&p.y===head.y)){halt('Game over. Press Restart to try again.');return;}
    snake.unshift(head);if(eats){score++;scoreEl.textContent='· Score '+score;food=randomFood();if(!food){draw();halt('You filled the board. You win!');return;}}else snake.pop();draw();
  }
  const reset=()=>{clearInterval(timer);snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];direction={x:1,y:0};next=direction;score=0;paused=false;scoreEl.textContent='· Score 0';food=randomFood();status.textContent='Use arrow keys or the controls below. Press Space to pause.';draw();timer=setInterval(tick,135);};
  const change=key=>{const directions={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};const chosen=directions[key];if(chosen && (chosen.x!==-direction.x||chosen.y!==-direction.y))next=chosen;};
  const keydown=e=>{if(windows.get('games')?.node!==node||node.classList.contains('is-minimized')||activeWindow!=='games'||e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.key.startsWith('Arrow')){e.preventDefault();change(e.key);}if(e.code==='Space'){e.preventDefault();if(timer){clearInterval(timer);timer=null;paused=true;status.textContent='Paused. Press Space to resume.';}else if(paused){timer=setInterval(tick,135);paused=false;status.textContent='Playing…';}}};
  document.addEventListener('keydown',keydown);
  area.querySelectorAll('[data-dir]').forEach(button=>button.addEventListener('click',()=>change('Arrow'+button.dataset.dir[0].toUpperCase()+button.dataset.dir.slice(1))));
  $('[data-restart]',area).addEventListener('click',reset);
  reset();
  const stop = reason => {
    clearInterval(timer); timer = null;
    if (reason === 'pause') { paused = true; status.textContent = 'Paused while minimized. Restore the window to resume.'; }
    else document.removeEventListener('keydown',keydown);
  };
  stop.resume = () => { if (paused) { timer = setInterval(tick,135); paused = false; status.textContent = 'Playing…'; } };
  return stop;
}
function startTicTacToe(area) {
  area.innerHTML='<hr class="content-rule"><div class="game-stage"><h3>Tic-tac-toe</h3><p id="tic-status">X goes first. Two players share this screen.</p><div class="ttt-board" aria-label="Tic-tac-toe board"></div><button class="secondary-button" id="tic-reset">New game</button></div>';
  const board=$('.ttt-board',area), status=$('#tic-status',area);
  let cells=Array(9).fill(''),turn='X',done=false;
  const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const render=()=>{board.replaceChildren();cells.forEach((value,index)=>{const button=document.createElement('button');button.textContent=value;button.setAttribute('aria-label',`Row ${Math.floor(index/3)+1}, column ${index%3+1}${value?', '+value:''}`);button.disabled=!!value||done;button.addEventListener('click',()=>{cells[index]=turn;const won=wins.some(combo=>combo.every(i=>cells[i]===turn));if(won){done=true;status.textContent=turn+' wins!';}else if(cells.every(Boolean)){done=true;status.textContent="It's a draw.";}else{turn=turn==='X'?'O':'X';status.textContent=turn+' to play.';}render();});board.append(button);});};
  $('#tic-reset',area).addEventListener('click',()=>{cells=Array(9).fill('');turn='X';done=false;status.textContent='X goes first. Two players share this screen.';render();});
  render();
}
