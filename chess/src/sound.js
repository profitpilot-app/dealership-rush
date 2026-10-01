export class Sound {
  constructor(){this.enabled=true;this.context=null;}
  play(event){
    if(!this.enabled) return;
    try {
      this.context ||= new (window.AudioContext||window.webkitAudioContext)();
      const ctx=this.context; if(ctx.state==='suspended')ctx.resume().catch(()=>{});
      const notes={select:[420],move:[240,180],capture:[740,990,660],knight:[310,460],castle:[440,330],check:[550,440],win:[523,659,784,1047],promotion:[440,660,880]}[event]||[240];
      notes.forEach((freq,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*.085;o.type='sine';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.075,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.18);});
    }catch{/* Sound is optional when unavailable. */}
  }
}
