// Free Cool Kids voices: runs the Kokoro voice model on the device, in the background.
import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js";
const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
let tts = null;
let queue = Promise.resolve();
self.onmessage = e => { queue = queue.then(() => handle(e.data)); };

async function handle(m){
  try{
    if(m.type === "load"){
      if(tts){ self.postMessage({type:"ready"}); return; }
      const files = {};
      tts = await KokoroTTS.from_pretrained(MODEL, {
        dtype: m.dtype, device: m.device,
        progress_callback: p => {
          if(p.status === "progress" && p.total){
            files[p.file] = [p.loaded, p.total];
            let l = 0, t = 0;
            for(const f in files){ l += files[f][0]; t += files[f][1]; }
            self.postMessage({type:"progress", loaded:l, total:t});
          }
        }
      });
      self.postMessage({type:"ready"});
    } else if(m.type === "gen"){
      const pitch = m.pitch || 1;
      const a = await tts.generate(m.text, {voice:m.voice, speed:(m.speed || 1) / pitch});
      const sr = a.sampling_rate || 24000;
      const audio = pitch === 1 ? a.audio : resample(a.audio, pitch);
      const wav = encodeWav(audio, sr);
      self.postMessage({type:"done", id:m.id, wav}, [wav]);
    }
  }catch(err){
    self.postMessage({type:"error", id:m.id, stage:m.type, message:String((err && err.message) || err)});
  }
}

// Speeding the audio up by the pitch factor makes a voice sound younger.
function resample(x, f){
  const n = Math.floor(x.length / f), y = new Float32Array(n);
  for(let i = 0; i < n; i++){ const t = i * f, k = Math.floor(t), d = t - k; y[i] = (x[k] || 0) * (1 - d) + (x[k + 1] || 0) * d; }
  return y;
}

function encodeWav(p, sr){
  const n = p.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o, s) => { for(let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0,"RIFF"); v.setUint32(4, 36 + n * 2, true); w(8,"WAVE"); w(12,"fmt ");
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
  v.setUint32(24,sr,true); v.setUint32(28,sr*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true);
  w(36,"data"); v.setUint32(40, n * 2, true);
  let o = 44;
  for(let i = 0; i < n; i++){ const s = Math.max(-1, Math.min(1, p[i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2; }
  return buf;
}
