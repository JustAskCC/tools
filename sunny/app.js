// Sunny, Your Talk Buddy. Runs as a home screen app from tools.justaskcc.com.
// After you set up the Worker (see worker/SETUP.md), paste its address here:
const BRAIN_URL = '';

(function(){
  const $ = id => document.getElementById(id);
  const chat = $('chat'), statusEl = $('status'), sunny = $('sunny'), mic = $('mic');
  const form = $('form'), input = $('input'), voiceOn = $('voiceOn'), notice = $('notice');

  let age = '8 to 10';
  let history = []; // {role:'user'|'assistant', content}
  let busy = false, listening = false, helpShown = false;

  const GREETING = "Hi friend! I'm Sunny. I'm here to listen and help. You can tell me about friends, homework, school, or any big feelings. What's on your mind today?";

  function setMood(m, text){
    sunny.classList.remove('talking','listening','thinking');
    if(m) sunny.classList.add(m);
    if(text !== undefined) statusEl.textContent = text;
  }
  function readyText(){ return Recog ? 'Tap the sun button and talk to me!' : 'Type to me below!'; }

  function addMsg(who, text){
    const d = document.createElement('div');
    d.className = 'msg ' + (who === 'user' ? 'kid-msg' : 'sunny-msg');
    const t = document.createTextNode(text);
    d.appendChild(t);
    if(who === 'assistant'){
      const b = document.createElement('button');
      b.className = 'say'; b.textContent = '🔊 Hear it';
      b.onclick = () => speak(t.textContent);
      d.appendChild(document.createElement('br')); d.appendChild(b);
    }
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
    return t;
  }

  // Words that may mean a child is unsafe: show the help card right away, before Sunny even answers.
  const DANGER = /\b(kill(ing)? myself|suicide|want to die|wanna die|end my life|hurt(ing)? myself|cut(ting)? myself|self harm|not be alive|better off dead|someone (is )?hurt(ing|s)? me|hits? me|touch(ed|es|ing)? me|abus|not safe|unsafe|scared to go home|run(ning)? away|has a (gun|knife)|bring a (gun|knife))\b/i;

  function showHelp(){
    const old = chat.querySelector('.help-card');
    if(old){ chat.appendChild(old); chat.scrollTop = chat.scrollHeight; return; }
    const c = document.createElement('div');
    c.className = 'help-card';
    c.innerHTML = '<b>You matter, and you deserve to be safe. 💛</b><br>' +
      'Please tell a grown up you trust <b>right now</b>: a parent, teacher, school counselor, or another adult you feel safe with.<br><br>' +
      '📞 Call or text <b><a href="tel:988">988</a></b> to talk to a kind helper any time, day or night.<br>' +
      '🚨 If you are in danger right now, call <b><a href="tel:911">911</a></b>.';
    chat.appendChild(c);
    chat.scrollTop = chat.scrollHeight;
  }

  function clean(t){ return t.replace(/\s*[–—―]\s*/g, ', ').replace(/([A-Za-z])-([A-Za-z])/g, '$1 $2').replace(/[*_#`]/g,'').replace(/\s{2,}/g,' ').trim(); }

  async function send(text){
    text = (text || '').trim();
    if(!text || busy) return;
    stopSpeaking();
    addMsg('user', text);
    history.push({role:'user', content:text});
    if(DANGER.test(text)) showHelp();

    if(!BRAIN_URL){
      addMsg('assistant', "I'm almost ready! A grown up still needs to finish setting up my brain. Until then, a trusted grown up is a great person to talk to.");
      return;
    }
    busy = true;
    setMood('thinking', 'Sunny is thinking...');
    const bubble = addMsg('assistant', '...');
    try{
      const r = await fetch(BRAIN_URL, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ age, messages: history.slice(-20) })
      });
      const data = await r.json().catch(() => ({}));
      if(!r.ok) throw { code: data.error || 'error' };
      const reply = clean(data.reply || '') || "I'm here with you. Can you tell me a little more?";
      bubble.textContent = reply;
      history.push({role:'assistant', content:reply});
      if(history.length > 30) history = history.slice(-30);
      speak(reply);
    }catch(e){
      bubble.textContent = (e && e.code === 'rate_limited')
        ? "Whew, I need a tiny rest. Try again in a minute, okay?"
        : navigator.onLine === false
        ? "I can't reach the internet right now. Ask a grown up to check the WiFi."
        : "Oops, something went wobbly. Can you say that again?";
      history.pop(); // let them try again cleanly
    }finally{
      busy = false;
      if(!sunny.classList.contains('talking')) setMood(null, readyText());
      chat.scrollTop = chat.scrollHeight;
    }
  }

  // Talking out loud with the device's own voice
  let voice = null;
  function pickVoice(){
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const en = vs.filter(v => /^en/i.test(v.lang));
    voice = en.find(v => /samantha|aria|jenny|google us english|female|karen|moira/i.test(v.name)) || en[0] || null;
  }
  if('speechSynthesis' in window){ pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  function speak(text){
    if(!voiceOn.checked || !text || !('speechSynthesis' in window)) return;
    const done = () => setMood(null, readyText());
    try{
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 1.15;
      if(voice) u.voice = voice;
      u.onstart = () => setMood('talking', 'Sunny is talking...');
      u.onend = done; u.onerror = done;
      speechSynthesis.speak(u);
    }catch(e){ done(); }
  }
  function stopSpeaking(){
    try{ window.speechSynthesis && speechSynthesis.cancel(); }catch(e){}
    if(sunny.classList.contains('talking')) setMood(null, readyText());
  }

  // Listening with the device's speech recognition (Chrome, Android, Safari on iPhone and iPad)
  const Recog = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, heard = '';
  if(Recog){
    mic.hidden = false;
    statusEl.textContent = readyText();
    mic.addEventListener('click', () => {
      if(listening){ rec && rec.stop(); return; }
      stopSpeaking();
      heard = '';
      rec = new Recog();
      rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true;
      rec.onstart = () => { listening = true; mic.classList.add('on'); setMood('listening', "I'm listening... tap again when you're done!"); };
      rec.onresult = ev => {
        let finalText = '', interim = '';
        for(const res of ev.results){ if(res.isFinal) finalText += res[0].transcript + ' '; else interim += res[0].transcript; }
        heard = finalText.trim();
        input.value = (finalText + interim).trim();
      };
      rec.onerror = ev => {
        if(ev.error === 'not-allowed' || ev.error === 'service-not-allowed'){
          mic.hidden = true; statusEl.textContent = 'Type to me below!';
          notice.innerHTML = '<div class="notice">To talk out loud, a grown up can turn on the microphone for this app in the phone settings.</div>';
        }
      };
      rec.onend = () => {
        listening = false; mic.classList.remove('on'); setMood(null, readyText());
        const said = (input.value || heard).trim();
        input.value = '';
        if(said) send(said);
      };
      try{ rec.start(); }catch(e){}
    });
  } else {
    statusEl.textContent = 'Type to me below!';
  }

  form.addEventListener('submit', e => { e.preventDefault(); const t = input.value; input.value=''; send(t); });
  $('topics').addEventListener('click', e => { const b = e.target.closest('.topic'); if(b) send(b.dataset.topic); });
  $('ages').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    document.querySelectorAll('#ages button').forEach(x => x.classList.toggle('on', x === b));
    age = b.dataset.age;
    try{ localStorage.setItem('sunny-age', age); }catch(e){}
  });
  try{
    const saved = localStorage.getItem('sunny-age');
    if(saved){ age = saved; document.querySelectorAll('#ages button').forEach(x => x.classList.toggle('on', x.dataset.age === saved)); }
  }catch(e){}
  $('stopTalk').onclick = stopSpeaking;
  voiceOn.onchange = () => { if(!voiceOn.checked) stopSpeaking(); };
  $('restart').onclick = () => {
    stopSpeaking(); history = []; chat.innerHTML = '';
    addMsg('assistant', GREETING); history.push({role:'assistant', content:GREETING});
  };
  addMsg('assistant', GREETING);
  history.push({role:'assistant', content:GREETING});

  // Home screen install
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const banner = $('install'), go = $('installGo'), txt = $('installText');
  let dismissed = false; try{ dismissed = localStorage.getItem('sunny-install-x') === '1'; }catch(e){}
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    if(!standalone && !dismissed) banner.classList.add('show');
  });
  go.onclick = async () => {
    if(deferred){ deferred.prompt(); await deferred.userChoice.catch(()=>{}); deferred = null; banner.classList.remove('show'); }
  };
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if(isIOS && !standalone && !dismissed){
    txt.innerHTML = '<b>Put Sunny on your home screen!</b><br>In Safari, tap the Share button, then <b>Add to Home Screen</b>.';
    go.style.display = 'none';
    banner.classList.add('show');
  }
  $('installX').onclick = () => { banner.classList.remove('show'); try{ localStorage.setItem('sunny-install-x','1'); }catch(e){} };
  window.addEventListener('appinstalled', () => banner.classList.remove('show'));
})();
