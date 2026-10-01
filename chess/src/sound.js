// Original procedural Foley: no remote audio assets or loading delay.
export class Sound {
 constructor(){this.enabled=true;this.context=null;this.voices=new Set();}
 play(event){
  if(!this.enabled)return;
  try{
   this.context ||= new (window.AudioContext||window.webkitAudioContext)();
   const c=this.context;if(c.state==='suspended')c.resume().catch(()=>{});
   if(this.voices.size>20)this.stop();
   const track=(source,gain)=>{this.voices.add(source);source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(source);};};
   const tone=(freq,end,delay,duration,volume=.06,type='sine')=>{
    const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;
    o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
    o.connect(g);g.connect(c.destination);track(o,g);o.start(t);o.stop(t+duration+.01);
   };
   const noise=(delay,duration,frequency,volume)=>{
    const b=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),a=b.getChannelData(0);
    for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,2);
    const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=b;f.type='lowpass';f.frequency.value=frequency;g.gain.value=volume;
    src.connect(f);f.connect(g);g.connect(c.destination);track(src,g);src.onended=()=>{src.disconnect();f.disconnect();g.disconnect();this.voices.delete(src);};src.start(c.currentTime+delay);
   };
   if(event==='engine'){tone(65,220,0,.38,.055,'sawtooth');tone(130,340,0,.34,.025,'triangle');noise(.45,.13,800,.23);tone(95,35,.45,.17,.12);tone(1100,1100,.65,.065,.035);return;}
   if(event==='ratchet'){for(let i=0;i<5;i++){noise(i*.075,.035,4800,.10);tone(1500+i*90,700,i*.075,.04,.03,'square');}noise(.44,.10,1600,.16);return;}
   if(event==='stamp'){noise(0,.18,2200,.06);noise(.4,.12,650,.25);tone(110,32,.4,.19,.13);return;}
   if(event==='phone'){tone(65,30,0,.45,.08);for(const t of [.36,.47,.58]){tone(760,760,t,.09,.045);tone(1040,1040,t,.09,.035);}return;}
   if(event==='signed'){noise(0,.025,3500,.1);[1047,1319,1568].forEach((f,i)=>tone(f,f,.35+i*.065,.22,.04));return;}
   if(event==='lock'){for(const t of [0,.16])tone(1500,1450,t,.075,.055,'triangle');return;}
   const notes={select:[420],move:[240,180],capture:[740,990,660],knight:[310,460],castle:[440,330],check:[550,440],win:[523,659,784,1047],promotion:[440,660,880]}[event]||[240];
   notes.forEach((f,i)=>tone(f,f,i*.085,.16,.055));
  }catch{/* Audio remains optional. */}
 }
 stop(){for(const source of this.voices){try{source.stop();}catch{}}this.voices.clear();}
}
