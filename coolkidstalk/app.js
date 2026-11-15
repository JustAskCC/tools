// Talk It Out with the Cool Kids. A Cool Kids University app.
// After the brain Worker is set up (see worker/SETUP.md), paste its address here:
const BRAIN_URL = '';

(function(){
'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};

/* ---------- The Cool Kids ---------- */
// Free voices: a Kokoro voice plus a pitch change (higher sounds younger).
const BUDDIES = [
  { id:'chloe',  name:'Chloe',  color:'#8B3DFF', text:'#FFFFFF', shadow:'#5A1FC2', line:'I notice everything, and I always have your back.', voiceName:'Big Sister voice', voice:'af_heart', pitch:1.14 },
  { id:'carter', name:'Carter', color:'#1E5BFF', text:'#FFFFFF', shadow:'#1340B8', line:"Every problem is like a chess game. We'll figure out the next move.", voiceName:'Big Brother voice', voice:'am_michael', pitch:1.2 },
  { id:'malik',  name:'Malik',  color:'#FF8A1F', text:'#1F2440', shadow:'#C25E00', line:"I get big feelings too. Let's figure them out together.", voiceName:'Little Boy voice', voice:'am_puck', pitch:1.32 },
  { id:'nyla',   name:'Nyla',   color:'#FF6B57', text:'#1F2440', shadow:'#C9402E', line:"Let's focus on the good, even on hard days.", voiceName:'Big Sister voice, a little brighter', voice:'af_sarah', pitch:1.18 },
  { id:'mia',    name:'Mia',    color:'#12B5A6', text:'#1F2440', shadow:'#0E6F66', line:"I'm little, but I'm a really good listener!", voiceName:'Little Girl voice', voice:'af_bella', pitch:1.28 },
  { id:'albert', name:'Albert', color:'#22B84B', text:'#1F2440', shadow:'#0E8A3B', line:'I ask lots of questions. Want to wonder with me?', voiceName:'Little Boy voice, a little higher', voice:'am_michael', pitch:1.42 }
];
const FEELINGS = [
  { id:'happy',   label:'Happy',    face:'#FFC914', bg:'#FFF3C4', mouth:'M18 34 Q28 44 38 34', brow:'' },
  { id:'sad',     label:'Sad',      face:'#6E93FF', bg:'#E3EBFF', mouth:'M18 40 Q28 31 38 40', brow:'M15 16 L23 19 M41 16 L33 19' },
  { id:'mad',     label:'Mad',      face:'#FF6B57', bg:'#FFE4DF', mouth:'M18 40 Q28 31 38 40', brow:'M14 17 L24 21 M42 17 L32 21' },
  { id:'worried', label:'Worried',  face:'#B58CFF', bg:'#EFE6FF', mouth:'M18 38 Q23 34 28 38 Q33 42 38 38', brow:'M15 18 Q20 14 24 17 M41 18 Q36 14 32 17' },
  { id:'excited', label:'Excited',  face:'#FF8A1F', bg:'#FFE9D4', mouth:'M17 33 Q28 48 39 33 Z', brow:'M15 15 Q20 12 24 15 M41 15 Q36 12 32 15' },
  { id:'unsure',  label:'Not sure', face:'#4FD1C5', bg:'#DDF7F4', mouth:'M19 37 L37 37', brow:'M15 17 L24 17 M32 15 L41 18' }
];

let kidName = store.get('ckt_name') || '';
let age = store.get('ckt_age') || '8 to 10';
let buddy = BUDDIES.find(b => b.id === store.get('ckt_buddy')) || BUDDIES[0];
let pending = buddy;              // highlighted on the picker
let feel = null, size = 'medium';
let history = [];                 // {role:'user'|'assistant', content}
let busy = false, voiceOn = store.get('ckt_voice') !== '0';

/* ---------- Screens ---------- */
let current = 'welcome';
function go(id){
  if(id === current) return;
  if(current === 'calm') stopCalm();
  stopSpeaking();
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  current = id;
  if(id === 'buddies'){ pending = buddy; renderBuddies(); voices.load(); }
  if(id === 'feelings'){ renderFeelings(); }
  if(id === 'talk'){ setTimeout(() => chatEl.scrollTop = chatEl.scrollHeight, 30); }
  if(id === 'calm'){ selectTool(calmTool); }
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if(g){ go(g.dataset.go); return; }
  const o = e.target.closest('[data-open]'); if(o){ openSheet(o.dataset.open); return; }
  const c = e.target.closest('[data-close]'); if(c){ closeSheet(); }
});

function applyBuddyTheme(b){
  const r = document.documentElement.style;
  r.setProperty('--buddy', b.color); r.setProperty('--buddyText', b.text); r.setProperty('--buddyShadow', b.shadow);
  document.querySelectorAll('.buddyImg').forEach(img => { img.src = 'buddies/' + b.id + '.jpg'; img.alt = b.name; });
  $('feelBtn').textContent = 'Tell ' + b.name + ' about it';
  $('typeIn').placeholder = 'Type to ' + b.name + '...';
  $('helpBack').textContent = 'Go back to ' + b.name;
}

/* ---------- Welcome ---------- */
$('kidName').value = kidName;
document.querySelectorAll('#agePills .pill').forEach(p => p.classList.toggle('on', p.dataset.age === age));
$('agePills').addEventListener('click', e => {
  const p = e.target.closest('.pill'); if(!p) return;
  age = p.dataset.age;
  document.querySelectorAll('#agePills .pill').forEach(x => x.classList.toggle('on', x === p));
});
$('setupForm').addEventListener('submit', e => { e.preventDefault(); $('startBtn').click(); });
$('startBtn').addEventListener('click', () => {
  audio.unlock();
  kidName = $('kidName').value.trim().replace(/[^\p{L}\p{M}' ]/gu, '').slice(0, 20);
  store.set('ckt_name', kidName); store.set('ckt_age', age);
  go('buddies');
});

/* ---------- Buddy picker ---------- */
function renderBuddies(){
  const grid = $('buddyGrid'); grid.innerHTML = '';
  BUDDIES.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'bcard' + (b.id === pending.id ? ' on' : '');
    btn.style.setProperty('--c', b.color);
    btn.innerHTML = '<img alt="" src="buddies/' + b.id + '.jpg"><span>' + b.name + '</span>';
    btn.setAttribute('aria-pressed', b.id === pending.id);
    btn.onclick = () => { pending = b; stopSpeaking(); renderBuddies(); };
    grid.appendChild(btn);
  });
  const p = $('buddyPanel');
  p.style.setProperty('--buddy', pending.color); p.style.setProperty('--buddyText', pending.text);
  p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
  $('bpImg').src = 'buddies/' + pending.id + '.jpg'; $('bpImg').alt = pending.name;
  $('bpName').textContent = "Hi, I'm " + pending.name + '!';
  $('bpLine').textContent = pending.line;
  $('bpVoice').textContent = pending.voiceName;
  $('pickBtn').textContent = 'Talk with ' + pending.name;
  setHear(false);
}
function setHear(on, label){
  $('hearIcon').innerHTML = on ? '<span class="bars" style="color:' + pending.color + '"><i></i><i></i><i></i><i></i></span>'
    : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F2440" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  $('hearTxt').textContent = label || (on ? pending.name + ' is talking...' : 'Hear my voice');
}
$('hearBtn').addEventListener('click', () => {
  audio.unlock();
  const b = pending;
  const hi = "Hi" + (kidName ? ' ' + kidName : '') + "! I'm " + b.name + '. ' + b.line;
  setHear(true, voices.ready ? null : 'Getting ' + b.name + "'s voice ready...");
  speak(hi, b, { onStart: () => setHear(true), onEnd: () => setHear(false) });
});
$('pickBtn').addEventListener('click', () => {
  audio.unlock();
  const changed = buddy.id !== pending.id;
  buddy = pending; store.set('ckt_buddy', buddy.id); applyBuddyTheme(buddy);
  if(changed || !history.length) resetChat();
  go('feelings');
});

/* ---------- Feelings ---------- */
function faceSVG(f){
  return '<svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26" fill="' + f.face + '"/>' +
    '<ellipse cx="20" cy="24" rx="3.5" ry="4.5" fill="#1F2440"/><ellipse cx="36" cy="24" rx="3.5" ry="4.5" fill="#1F2440"/>' +
    (f.brow ? '<path d="' + f.brow + '" stroke="#1F2440" stroke-width="3" stroke-linecap="round" fill="none"/>' : '') +
    '<path d="' + f.mouth + '" stroke="#1F2440" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg>';
}
function renderFeelings(){
  const g = $('feelGrid'); g.innerHTML = '';
  FEELINGS.forEach(f => {
    const b = document.createElement('button');
    b.className = 'fcard' + (feel === f.id ? ' on' : '');
    b.style.setProperty('--bg', f.bg);
    b.setAttribute('aria-pressed', feel === f.id);
    b.innerHTML = faceSVG(f) + '<span>' + f.label + '</span>';
    b.onclick = () => { feel = f.id; renderFeelings(); };
    g.appendChild(b);
  });
}
$('sizePills').addEventListener('click', e => {
  const s = e.target.closest('.size'); if(!s) return;
  size = s.dataset.size;
  document.querySelectorAll('#sizePills .size').forEach(x => x.classList.toggle('on', x === s));
});
$('feelBtn').addEventListener('click', () => {
  audio.unlock();
  go('talk');
  if(feel){
    const f = FEELINGS.find(x => x.id === feel);
    const text = f.id === 'unsure' ? "I'm not sure how I feel right now." : "I'm feeling " + f.label.toLowerCase() + ', ' + size + '.';
    feel = null;
    send(text);
  }
});
$('skipFeel').addEventListener('click', () => { audio.unlock(); go('talk'); });

/* ---------- Talk ---------- */
const chatEl = $('chat');
function greeting(){
  return 'Hey' + (kidName ? ' ' + kidName : '') + "! It's " + buddy.name + ". I'm here to listen and help with friends, homework, or big feelings. What's on your mind?";
}
function resetChat(){
  history = []; chatEl.innerHTML = '';
  const g = greeting(); addMsg('assistant', g); history.push({ role:'assistant', content:g });
}
function addMsg(role, text){
  const d = document.createElement('div');
  d.className = 'msg ' + (role === 'user' ? 'kid' : 'bud');
  const t = document.createTextNode(text); d.appendChild(t);
  if(role === 'assistant'){
    const b = document.createElement('button'); b.className = 'again';
    b.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1F2440" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg> Hear it';
    b.onclick = () => { audio.unlock(); speakAsBuddy(t.textContent); };
    d.appendChild(document.createElement('br')); d.appendChild(b);
  }
  chatEl.appendChild(d); chatEl.scrollTop = chatEl.scrollHeight;
  return t;
}
function setMode(m, text){
  const t = $('talk'); t.classList.remove('talking','listening','thinking'); if(m) t.classList.add(m);
  $('tstatus').textContent = text || (m === 'talking' ? buddy.name + ' is talking...' : m === 'listening' ? buddy.name + ' is listening...' : m === 'thinking' ? buddy.name + ' is thinking...' : 'Your turn!');
}

// Words that may mean a child is unsafe: open the help screen right away.
const DANGER = /\b(kill(ing)? myself|suicide|want to die|wanna die|end my life|hurt(ing)? myself|cut(ting)? myself|self harm|not be alive|better off dead|someone (is )?hurt(ing|s)? me|hits? me|touch(ed|es|ing)? me|abus|not safe|unsafe|scared to go home|run(ning)? away|has a (gun|knife)|bring a (gun|knife))\b/i;

function clean(t){ return t.replace(/\s*[–—―]\s*/g, ', ').replace(/([A-Za-z])-([A-Za-z])/g, '$1 $2').replace(/[*_#`]/g,'').replace(/\s{2,}/g,' ').trim(); }

async function send(text){
  text = (text || '').trim();
  if(!text || busy) return;
  stopSpeaking();
  addMsg('user', text);
  history.push({ role:'user', content:text });
  const danger = DANGER.test(text);

  if(!BRAIN_URL){
    const msg = "I'm almost ready to talk! A grown up still needs to finish setting me up. Until then, a trusted grown up is a great person to talk to.";
    addMsg('assistant', msg); history.push({ role:'assistant', content:msg });
    if(danger) go('help');
    return;
  }
  busy = true; setMode('thinking');
  const bubble = addMsg('assistant', '...');
  if(danger) go('help');
  try{
    const r = await fetch(BRAIN_URL, { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ buddy: buddy.id, age, messages: history.slice(-20) }) });
    const data = await r.json().catch(() => ({}));
    if(!r.ok) throw { code: data.error || 'error' };
    const reply = clean(data.reply || '') || "I'm here with you. Can you tell me a little more?";
    bubble.textContent = reply;
    history.push({ role:'assistant', content:reply });
    if(history.length > 30) history = history.slice(-30);
    if(current === 'talk') speakAsBuddy(reply); else setMode(null);
  }catch(e){
    bubble.textContent = (e && e.code === 'rate_limited') ? "Whew, I need a tiny rest. Try again in a minute, okay?"
      : navigator.onLine === false ? "I can't reach the internet right now. Ask a grown up to check the WiFi."
      : "Oops, something went wobbly. Can you say that again?";
    history.pop();
    setMode(null);
  }finally{ busy = false; if(!$('talk').classList.contains('talking')) setMode(null); }
}
function speakAsBuddy(text){
  if(!voiceOn) { setMode(null); return; }
  speak(text, buddy, { onStart: () => setMode('talking'), onEnd: () => setMode(null), onWait: () => setMode(null, 'Getting ' + buddy.name + "'s voice ready...") });
}
$('quick').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  audio.unlock();
  if(b.hasAttribute('data-again')){ const last = [...history].reverse().find(h => h.role === 'assistant'); if(last) speakAsBuddy(last.content); return; }
  send(b.dataset.q);
});
$('typeToggle').addEventListener('click', () => {
  const on = !$('typer').classList.contains('on');
  $('typer').classList.toggle('on', on);
  $('typeToggle').textContent = on ? 'Talk instead' : 'Type instead';
  if(on) $('typeIn').focus();
});
$('typer').addEventListener('submit', e => { e.preventDefault(); audio.unlock(); const t = $('typeIn').value; $('typeIn').value = ''; send(t); });

/* Listening with the device's speech recognition */
const Recog = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, listening = false;
if(!Recog){
  $('mic').style.display = 'none'; $('mhint').style.display = 'none'; $('typeToggle').style.display = 'none';
  $('typer').classList.add('on');
}
$('mic').addEventListener('click', () => {
  audio.unlock();
  if(listening){ rec && rec.stop(); return; }
  if(busy) return;
  stopSpeaking();
  let finalText = '', interim = '';
  rec = new Recog(); rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true;
  rec.onstart = () => { listening = true; $('mic').classList.add('on'); $('mic').setAttribute('aria-label','Stop'); $('mhint').textContent = 'Tap when you are done'; setMode('listening'); };
  rec.onresult = ev => {
    finalText = ''; interim = '';
    for(const res of ev.results){ if(res.isFinal) finalText += res[0].transcript + ' '; else interim += res[0].transcript; }
    $('tstatus').textContent = (finalText + interim).trim().slice(-60) || buddy.name + ' is listening...';
  };
  rec.onerror = ev => {
    if(ev.error === 'not-allowed' || ev.error === 'service-not-allowed'){
      $('mic').style.display = 'none'; $('mhint').textContent = 'Ask a grown up to turn on the microphone, or type below.';
      $('typer').classList.add('on'); $('typeToggle').style.display = 'none';
    }
  };
  rec.onend = () => {
    listening = false; $('mic').classList.remove('on'); $('mic').setAttribute('aria-label','Tap to talk'); $('mhint').textContent = 'Tap to talk';
    setMode(null);
    const said = (finalText + interim).trim();
    if(said) send(said);
  };
  try{ rec.start(); }catch(e){}
});

/* ---------- Free voices (Kokoro, on the device) ---------- */
const audio = (() => {
  const el = new Audio(); el.preload = 'auto';
  let unlocked = false;
  return {
    el,
    unlock(){
      if(unlocked) return; unlocked = true;
      // A tiny silent clip, played from a tap, lets later audio play on phones.
      el.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
      el.play().catch(() => {});
    }
  };
})();

const voices = (() => {
  let worker = null, state = 'idle', jobId = 0; const jobs = {}; const waiters = [];
  const api = { ready:false, failed:false,
    load(){
      if(state === 'ready') return Promise.resolve();
      if(state === 'failed') return Promise.reject(new Error('failed'));
      const p = new Promise((ok, fail) => waiters.push({ ok, fail }));
      if(state === 'loading') return p;
      state = 'loading';
      try{
        worker = new Worker('voice-worker.js', { type:'module' });
        worker.onmessage = e => {
          const m = e.data;
          if(m.type === 'progress'){ showVoiceBar(m.total ? m.loaded / m.total : 0); }
          else if(m.type === 'ready'){ state = 'ready'; api.ready = true; store.set('ckt_voices_once','1'); hideVoiceBar(); waiters.splice(0).forEach(w => w.ok()); }
          else if(m.type === 'done'){ jobs[m.id] && jobs[m.id].ok(new Blob([m.wav], { type:'audio/wav' })); delete jobs[m.id]; }
          else if(m.type === 'error'){
            if(m.stage === 'load') fail(m.message);
            else if(jobs[m.id]){ jobs[m.id].fail(new Error(m.message)); delete jobs[m.id]; }
          }
        };
        worker.onerror = () => fail('worker');
        const gpu = false; // the small model runs well on the phone's main processor
        worker.postMessage({ type:'load', device: gpu ? 'webgpu' : 'wasm', dtype: gpu ? 'fp32' : 'q8' });
      }catch(e){ fail(String(e)); }
      return p;
      function fail(msg){
        state = 'failed'; api.failed = true; hideVoiceBar();
        try{ worker && worker.terminate(); }catch(_){}
        waiters.splice(0).forEach(w => w.fail(new Error(msg)));
      }
    },
    gen(text, b){
      const id = ++jobId;
      return new Promise((ok, fail) => { jobs[id] = { ok, fail }; worker.postMessage({ type:'gen', id, text, voice:b.voice, pitch:b.pitch, speed:0.95 }); });
    }
  };
  return api;
})();
function showVoiceBar(f){
  if(store.get('ckt_voices_once')) return; // already downloaded: loads quietly
  $('voicebar').classList.add('on');
  $('voicebarTxt').textContent = 'Getting the Cool Kids voices ready (first time only, about 90MB)... ' + Math.round(f * 100) + '%';
  $('voicebarFill').style.width = Math.round(f * 100) + '%';
}
function hideVoiceBar(){ $('voicebar').classList.remove('on'); }

let speakToken = 0, speakEnd = null;
function splitSentences(t){ return (t.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [t]).map(s => s.trim()).filter(Boolean); }

// Speak sentence by sentence, so the first words start quickly.
async function speak(text, b, cb){
  cb = cb || {};
  stopSpeaking();
  const token = ++speakToken;
  speakEnd = cb.onEnd || null;
  const done = () => { if(token === speakToken){ speakEnd = null; cb.onEnd && cb.onEnd(); } };
  if(!voices.ready){
    cb.onWait && cb.onWait();
    try{ await voices.load(); }catch(e){ return deviceSpeak(text, b, cb, token); }
    if(token !== speakToken) return;
  }
  const parts = splitSentences(text);
  const clips = parts.map(p => voices.gen(p, b)); // queued in order in the background
  for(let i = 0; i < clips.length; i++){
    let blob;
    try{ blob = await clips[i]; }catch(e){ continue; }
    if(token !== speakToken) return;
    if(i === 0) cb.onStart && cb.onStart();
    await playBlob(blob, token);
    if(token !== speakToken) return;
  }
  done();
}
function playBlob(blob, token){
  return new Promise(res => {
    const url = URL.createObjectURL(blob);
    const el = audio.el;
    const fin = () => { el.onended = el.onerror = null; URL.revokeObjectURL(url); res(); };
    el.onended = fin; el.onerror = fin;
    el.src = url;
    el.play().catch(fin);
    const iv = setInterval(() => { if(token !== speakToken){ clearInterval(iv); fin(); } else if(el.ended){ clearInterval(iv); } }, 200);
  });
}
// Backup if the free voices cannot run on this device.
function deviceSpeak(text, b, cb, token){
  if(!('speechSynthesis' in window)) return cb.onEnd && cb.onEnd();
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.pitch = Math.min(2, b.pitch + 0.1);
    const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
    const female = ['chloe','nyla','mia'].includes(b.id);
    u.voice = vs.find(v => female ? /samantha|aria|jenny|female|karen|zira/i.test(v.name) : /daniel|alex|guy|male|david|fred/i.test(v.name)) || vs[0] || null;
    u.onstart = () => cb.onStart && cb.onStart();
    u.onend = u.onerror = () => { if(token === speakToken) cb.onEnd && cb.onEnd(); };
    speechSynthesis.speak(u);
  }catch(e){ cb.onEnd && cb.onEnd(); }
}
function stopSpeaking(){
  speakToken++;
  try{ audio.el.pause(); }catch(e){}
  try{ window.speechSynthesis && speechSynthesis.cancel(); }catch(e){}
  if(speakEnd){ const f = speakEnd; speakEnd = null; f(); }
}

/* ---------- Calm down corner ---------- */
const MIA = BUDDIES.find(b => b.id === 'mia');
const TOOLS = [
  { id:'balloon', label:'Balloon breaths', color:'#12B5A6', say:"Let's blow up a balloon with our breath. Follow the circle!" },
  { id:'see',     label:'Find 5 things',   color:'#1E5BFF', say:"Let's use our senses to feel calm. Look around with me!" },
  { id:'squeeze', label:'Squeeze and let go', color:'#FF8A1F', say:'Squeeze your hands really tight, then let all the worry go.' },
  { id:'draw',    label:'Draw my feeling', color:'#8B3DFF', say:'What color is your feeling? Draw it here. Any way is the right way!' }
];
let calmTool = 'balloon', calmTimers = [];
function later(fn, ms){ calmTimers.push(setTimeout(fn, ms)); }
function stopCalm(){ calmTimers.forEach(clearTimeout); calmTimers = []; $('ball').classList.remove('big'); $('balltxt').textContent = 'Tap start'; $('ballGo').textContent = 'Start'; $('fist').classList.remove('tight'); $('fist').textContent = 'Ready?'; $('sqGo').textContent = 'Start'; }
function renderTools(){
  const t = $('tools'); t.innerHTML = '';
  TOOLS.forEach((x, i) => {
    const b = document.createElement('button');
    b.className = 'tool' + (x.id === calmTool ? ' on' : ''); b.style.setProperty('--c', x.color);
    b.innerHTML = '<b>' + (i + 1) + '</b><span>' + x.label + '</span>';
    b.onclick = () => selectTool(x.id);
    t.appendChild(b);
  });
}
function selectTool(id){
  stopCalm(); stopSpeaking();
  calmTool = id;
  const tool = TOOLS.find(x => x.id === id);
  document.querySelectorAll('#calm .panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
  $('calmSay').textContent = tool.say;
  renderTools();
  if(id === 'see') resetSee();
  if(id === 'draw') setupDraw();
}
function miaSays(t){ if(voiceOn) speak(t, MIA); }

$('ballGo').addEventListener('click', () => {
  audio.unlock();
  if(calmTimers.length){ stopCalm(); return; }
  $('ballGo').textContent = 'Stop';
  let n = 0;
  const cycle = () => {
    n++;
    if(n > 5){ $('balltxt').textContent = 'Great job!'; $('ballStep').textContent = 'You did 5 balloon breaths!'; $('ballGo').textContent = 'Again'; calmTimers = []; return; }
    $('ballStep').textContent = 'Balloon breath ' + n + ' of 5';
    $('balltxt').textContent = 'Breathe in...'; $('ball').classList.add('big');
    later(() => { $('balltxt').textContent = 'Breathe out...'; $('ball').classList.remove('big'); }, 4000);
    later(cycle, 8000);
  };
  cycle();
});

const SEE = [[5,'things you can see'],[4,'things you can touch'],[3,'things you can hear'],[2,'things you can smell'],[1,'thing you can taste']];
let seeI = 0;
function resetSee(){ seeI = 0; showSee(); }
function showSee(){
  if(seeI >= SEE.length){ $('seeNum').textContent = '✓'; $('seeTxt').textContent = 'You did it!'; $('seeStep').textContent = 'Your senses helped you calm down.'; $('seeNext').textContent = 'Again'; return; }
  $('seeNum').textContent = SEE[seeI][0]; $('seeTxt').textContent = SEE[seeI][1];
  $('seeStep').textContent = 'Name them out loud, then tap Next.'; $('seeNext').textContent = 'Next';
}
$('seeNext').addEventListener('click', () => { audio.unlock(); if(seeI >= SEE.length){ resetSee(); return; } seeI++; showSee(); if(seeI < SEE.length) miaSays('Now find ' + SEE[seeI][0] + ' ' + SEE[seeI][1] + '.'); });

$('sqGo').addEventListener('click', () => {
  audio.unlock();
  if(calmTimers.length){ stopCalm(); return; }
  $('sqGo').textContent = 'Stop';
  let n = 0;
  const round = () => {
    n++;
    if(n > 3){ $('fist').classList.remove('tight'); $('fist').textContent = 'So calm!'; $('sqStep').textContent = 'Your body feels more relaxed now.'; $('sqGo').textContent = 'Again'; calmTimers = []; return; }
    $('sqStep').textContent = 'Round ' + n + ' of 3';
    $('fist').classList.add('tight'); $('fist').textContent = 'Squeeze!';
    later(() => { $('fist').textContent = 'Hold... 3'; }, 1000);
    later(() => { $('fist').textContent = 'Hold... 2'; }, 2000);
    later(() => { $('fist').textContent = 'Hold... 1'; }, 3000);
    later(() => { $('fist').classList.remove('tight'); $('fist').textContent = 'Let go!'; }, 4000);
    later(round, 6500);
  };
  round();
});

let drawReady = false, ink = '#8B3DFF';
function setupDraw(){
  const cv = $('draw'), ctx = cv.getContext('2d');
  const fit = () => { const r = cv.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; const img = drawReady ? ctx.getImageData(0, 0, cv.width, cv.height) : null; cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.scale(dpr, dpr); if(img) ctx.putImageData(img, 0, 0); };
  requestAnimationFrame(fit);
  if(drawReady) return; drawReady = true;
  const COLORS = ['#8B3DFF','#1E5BFF','#12B5A6','#22B84B','#FFC914','#FF8A1F','#FF6B57','#E8323C','#1F2440'];
  const box = $('colors');
  COLORS.forEach((c, i) => { const b = document.createElement('button'); b.style.background = c; b.setAttribute('aria-label','Color ' + (i + 1)); if(i === 0) b.classList.add('on'); b.onclick = () => { ink = c; box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }; box.appendChild(b); });
  const clr = document.createElement('button'); clr.textContent = 'Clear'; clr.style.cssText = 'width:auto;padding:0 14px;border-radius:19px;background:#fff;font-weight:800;font-size:13px';
  clr.onclick = () => { const r = cv.getBoundingClientRect(); ctx.clearRect(0, 0, r.width, r.height); }; box.appendChild(clr);
  let drawing = false, last = null;
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if(!drawing) return; const p = pos(e); ctx.strokeStyle = ink; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); last = p; });
  const up = () => { drawing = false; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}

/* ---------- Grown ups ---------- */
let gateA = 42;
function openSheet(){
  const a = 3 + Math.floor(Math.random() * 7), b = 4 + Math.floor(Math.random() * 6); gateA = a * b;
  $('gateQ').textContent = 'What is ' + a + ' times ' + b + '?';
  $('gateIn').value = ''; $('gate').style.display = 'flex'; $('parent').style.display = 'none';
  $('grownups').classList.add('on');
}
function closeSheet(){ $('grownups').classList.remove('on'); }
$('gateOk').addEventListener('click', () => {
  if(Number($('gateIn').value) === gateA){ $('gate').style.display = 'none'; $('parent').style.display = 'flex'; $('optVoice').checked = voiceOn; }
  else { $('gateIn').value = ''; $('gateIn').placeholder = 'Try again'; }
});
$('gateIn').addEventListener('keydown', e => { if(e.key === 'Enter') $('gateOk').click(); });
$('grownups').addEventListener('click', e => { if(e.target.id === 'grownups') closeSheet(); });
$('optVoice').addEventListener('change', e => { voiceOn = e.target.checked; store.set('ckt_voice', voiceOn ? '1' : '0'); if(!voiceOn) stopSpeaking(); });
$('optClear').addEventListener('click', () => { stopSpeaking(); resetChat(); closeSheet(); });
$('optReset').addEventListener('click', () => {
  ['ckt_name','ckt_age','ckt_buddy'].forEach(k => store.del(k));
  kidName = ''; age = '8 to 10'; buddy = BUDDIES[0]; $('kidName').value = '';
  document.querySelectorAll('#agePills .pill').forEach(p => p.classList.toggle('on', p.dataset.age === age));
  applyBuddyTheme(buddy); resetChat(); closeSheet(); go('welcome');
});

/* ---------- Install to home screen ---------- */
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
let deferred = null, dismissed = store.get('ckt_install_x') === '1';
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; if(!standalone && !dismissed) $('install').classList.add('on'); });
$('installGo').addEventListener('click', async () => { if(deferred){ deferred.prompt(); try{ await deferred.userChoice; }catch(e){} deferred = null; $('install').classList.remove('on'); } });
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if(isIOS && !standalone && !dismissed){
  $('installText').innerHTML = '<b>Add the Cool Kids to your home screen!</b><br>Tap Share, then Add to Home Screen.';
  $('installGo').style.display = 'none'; $('install').classList.add('on');
}
$('installX').addEventListener('click', () => { $('install').classList.remove('on'); store.set('ckt_install_x','1'); });
window.addEventListener('appinstalled', () => $('install').classList.remove('on'));

/* ---------- Start ---------- */
applyBuddyTheme(buddy);
resetChat();
renderTools();
// Returning kids skip setup and go straight to the feelings check in.
if(kidName || store.get('ckt_buddy')){ document.querySelector('#welcome').classList.remove('on'); current = ''; go('feelings'); }
else { document.querySelector('#welcome').classList.add('on'); }
})();
