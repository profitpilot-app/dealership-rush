import './style.css';
import {Game,roles,symbols} from './game.js';
import {Board} from './board.js';
import {Sound} from './sound.js';
const $=id=>document.getElementById(id);
const storage={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
let game;try{game=new Game(storage.get('dealership-chess:pgn')||'')}catch{game=new Game()}
let mode=storage.get('dealership-chess:mode')==='house'?'house':'local',selected=null,busy=false,requestId=0,flipped=false,is2D=false,board;
const sound=new Sound();sound.enabled=storage.get('dealership-chess:sound')!=='off';
const reducedPreference=storage.get('dealership-chess:motion');
let reduced=reducedPreference?reducedPreference==='reduced':matchMedia('(prefers-reduced-motion: reduce)').matches;
let ai=new Worker(new URL('./ai.worker.js',import.meta.url),{type:'module'});
document.querySelector('#app').innerHTML=`
<header class="header"><a class="brand" href="./"><span class="brand-icon">D<span>♟</span></span><span>DEALERSHIP<span class="brand-sub">C H E S S &nbsp; C L U B</span></span></a><span class="edition">THE FINAL DEAL <span class="pill">PROTOTYPE</span></span><button id="settings" class="icon-button" aria-label="Open settings">⚙</button></header>
<main><div class="intro"><div><span class="eyebrow">A DIFFERENT KIND OF NEGOTIATION</span><h1>Take the floor.</h1><p>Every move is a deal. Protect your General Manager.</p></div></div>
<div class="layout"><section class="game-panel" aria-label="Chess game"><section class="status-card"><span class="eyebrow">LOT OPEN</span><h2 id="status" aria-live="polite"></h2><p id="hint">Select a piece to see its legal moves.</p><div class="status-footer"><span class="live-dot"></span> STANDARD CHESS RULES</div></section><div class="player-strip"><span class="avatar blue">C</span><div><strong>Cobalt team</strong><span id="opponent-label">Across the desk</span></div><span id="blue-tag" class="turn-tag">WAITING</span><span class="score" id="blue-captured"></span></div>
<div class="stage"><div id="board3d"></div><div id="board2d" hidden aria-label="Chessboard"></div><div class="board-corner"><span class="tiny-dot"></span><span id="view-label">3D SHOWROOM</span></div><button id="camera" class="camera-button" aria-pressed="false">Showroom view</button><button id="view" class="view-button">2D board</button></div>
<div class="player-strip bottom"><span class="avatar red">C</span><div><strong>Crimson team</strong><span>Your side of the showroom</span></div><span id="red-tag" class="turn-tag">ON THE FLOOR</span><span class="score" id="red-captured"></span></div>
</section>
<aside><section class="action-desk"><h3>Action Desk</h3><div class="mode-switch" aria-label="Game mode"><button id="local" title="Local two-player">Two desks <small>2 players</small></button><button id="house" title="Play the computer">Play the house <small>vs computer</small></button></div><div class="board-toolbar"><button id="undo">↶ <span>Take back</span></button><button id="flip">⇅ <span>Turn the lot</span></button><button id="new">＋ <span>Fresh deal</span></button><button id="sound" aria-pressed="true">♫ <span>Sound on</span></button></div></section>
<details class="log-card" open><summary>Negotiation Log</summary><div class="card-heading"><h3>Negotiation Log</h3><span id="move-count">0 MOVES</span></div><div class="log-labels"><span>#</span><span>CRIMSON</span><span>COBALT</span></div><div id="log" aria-label="Move history"></div><button id="export" class="text-button">Export game ↗</button></details>
<section class="legend-card"><h3>Meet your team</h3><div class="legend">${[['k','GM','King'],['q','Closer','Queen'],['b','Finance','Bishop'],['n','Service','Knight'],['r','GM Desk','Rook'],['p','Car','Pawn']].map(([p,n,r])=>`<div><span class="piece-icon"><img src="/figures/w${p}.png" alt=""></span><span><strong>${n}</strong><small>${r}</small></span></div>`).join('')}</div></section></aside></div>
<footer>BUILT FOR THE FLOOR. PLAYED BY THE RULES.<span>Local save · No account needed</span></footer></main>
<dialog id="settings-dialog"><div class="dialog-header"><h2>Your showroom</h2><button id="close-settings" aria-label="Close settings">×</button></div><label class="setting">Sound effects<input id="sound-setting" type="checkbox"></label><label class="setting">Reduced motion<input id="motion-setting" type="checkbox"></label><p>Original synthesized sound effects. Reduced motion makes moves and board rotation instant.</p><p>Play the house uses a basic, unrated computer opponent. Your game is saved on this browser.</p></dialog>
<dialog id="new-dialog"><h2>Start a fresh deal?</h2><p>Your current game will be replaced. Export it first if you want to keep a copy.</p><div class="dialog-actions"><button id="cancel-new">Keep playing</button><button id="confirm-new" class="primary">Fresh deal</button></div></dialog>
<dialog id="promotion"><h2>Promote your car</h2><p>Choose a new role.</p><div class="promotion-options">${['q','r','b','n'].map(p=>`<button data-promote="${p}"><span>${symbols[p]}</span>${roles[p]}</button>`).join('')}</div></dialog>`;
if(matchMedia('(max-width:760px)').matches)document.querySelector('.log-card').open=false;
let fallbackReason='';
try{board=new Board($('board3d'),select);board.reduced=reduced;}catch{is2D=true;fallbackReason='3D is unavailable on this device. The 2D board is ready.';$('view').disabled=true;$('camera').disabled=true;$('board3d').hidden=true;$('board2d').hidden=false;$('view-label').textContent='2D SHOWROOM';$('view').textContent='2D board';}
function save(){storage.set('dealership-chess:pgn',game.chess.pgn());storage.set('dealership-chess:mode',mode);}
function lastMove(){return game.chess.history({verbose:true}).at(-1)}
function highlight(){const last=lastMove();const king=game.chess.isCheck()?game.chess.board().flat().find(p=>p?.type==='k'&&p.color===game.chess.turn())?.square:null;board?.highlight(selected,selected?game.legal(selected).map(m=>m.to):[],last?[last.from,last.to]:[],king);render2D();}
function render2D(){
  const c=game.chess,files=flipped?'hgfedcba':'abcdefgh',ranks=flipped?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1],legal=selected?game.legal(selected).map(m=>m.to):[];
  $('board2d').innerHTML=ranks.map(r=>[...files].map(f=>{const s=f+r,p=c.get(s),dark=(f.charCodeAt(0)-97+r)%2===1;return `<button class="square ${dark?'dark':'light'} ${p?.color==='w'?'crimson':'cobalt'} ${selected===s?'selected':''} ${legal.includes(s)?'legal':''}" data-square="${s}" aria-label="${s}${p?', '+(p.color==='w'?'Crimson ':'Cobalt ')+roles[p.type]:', empty'}" aria-pressed="${selected===s}"><span>${p?`<img src="/figures/${p.color}${p.type}.png" alt="" draggable="false">`:''}</span><small>${s}</small></button>`}).join('')).join('');
}
function refresh(){
  const c=game.chess,moves=c.history();$('status').textContent=game.status;
  $('red-tag').textContent=c.turn()==='w'&&!c.isGameOver()?'ON THE FLOOR':'WAITING';$('blue-tag').textContent=c.turn()==='b'&&!c.isGameOver()?'ON THE FLOOR':'WAITING';
  $('red-tag').classList.toggle('active',c.turn()==='w');$('blue-tag').classList.toggle('active',c.turn()==='b');
  $('opponent-label').textContent=mode==='house'?'The house · casual computer':'Across the desk';$('local').classList.toggle('active',mode==='local');$('house').classList.toggle('active',mode==='house');
  $('local').setAttribute('aria-pressed',String(mode==='local'));$('house').setAttribute('aria-pressed',String(mode==='house'));
  $('move-count').textContent=`${moves.length} ${moves.length===1?'PLY':'PLIES'}`;
  $('log').innerHTML=moves.length?Array.from({length:Math.ceil(moves.length/2)},(_,i)=>`<div class="log-row"><span>${i+1}.</span><strong>${moves[i*2]}</strong><strong>${moves[i*2+1]||'—'}</strong></div>`).join(''):'<div class="empty-log"><span>♙</span>The first move is yours.<small>Your deals will appear here.</small></div>';
  const latest=c.history({verbose:true}).at(-1);if(latest)$('log').insertAdjacentHTML('beforeend',`<p class="deal-description">${roles[latest.piece]} ${latest.captured?'captures on':'moves to'} ${latest.to}${latest.promotion?' · promoted to '+roles[latest.promotion]:''}.</p>`);
  $('log').scrollTop=$('log').scrollHeight;
  const history=c.history({verbose:true});for(const color of ['w','b'])$(color==='w'?'red-captured':'blue-captured').textContent=history.filter(m=>m.color===color&&m.captured).map(m=>symbols[m.captured]).join('');
  $('undo').disabled=busy||!history.length; $('new').disabled=busy;$('local').disabled=busy;$('house').disabled=busy;
  $('hint').textContent=fallbackReason||(c.isGameOver()?'Start a fresh deal or export this game.':mode==='house'&&c.turn()==='b'?'The house is considering its move…':selected?`${roles[c.get(selected).type]} · choose a highlighted square.`:'Select a piece to see its legal moves.');
  highlight();updateSound();
}
function updateSound(){$('sound').innerHTML=`♫ <span>Sound ${sound.enabled?'on':'off'}</span>`;$('sound').setAttribute('aria-pressed',String(sound.enabled));$('sound-setting').checked=sound.enabled;$('motion-setting').checked=reduced;}
async function select(s){
  const c=game.chess;if(busy||c.isGameOver()||(mode==='house'&&c.turn()==='b'))return;
  if(selected===s){selected=null;refresh();return;}
  const candidates=selected?game.legal(selected).filter(m=>m.to===s):[];
  if(candidates.length){let promote='q';if(candidates.some(m=>m.promotion)){promote=await promotion();if(!promote)return;}await makeMove(selected,s,promote);return;}
  if(c.get(s)?.color===c.turn()){selected=s;sound.play('select');refresh();}
}
function promotion(){busy=true;refresh();$('promotion').showModal();return new Promise(resolve=>{function finish(value){$('promotion').close();$('promotion').removeEventListener('click',click);$('promotion').removeEventListener('cancel',cancel);busy=false;refresh();resolve(value)}function click(e){const b=e.target.closest('[data-promote]');if(b)finish(b.dataset.promote)}function cancel(e){e.preventDefault();finish(null)}$('promotion').addEventListener('click',click);$('promotion').addEventListener('cancel',cancel);});}
async function makeMove(from,to,promotion='q'){
  const move=game.move(from,to,promotion);if(!move)return;
  busy=true;selected=null;save();refresh();
  sound.play(game.chess.isCheckmate()?'win':game.chess.isCheck()?'check':move.promotion?'promotion':move.flags.includes('k')||move.flags.includes('q')?'castle':move.captured?'capture':move.piece==='n'?'knight':'move');
  if(!is2D)await board?.animate(move);board?.sync(game.chess);busy=false;refresh();askHouse();
}
function askHouse(){if(mode!=='house'||game.chess.turn()!=='b'||game.chess.isGameOver())return;busy=true;refresh();ai.postMessage({id:++requestId,fen:game.chess.fen()});}
ai.onmessage=({data})=>{if(data.id!==requestId)return;if(data.error||!data.move){busy=false;mode='local';save();refresh();$('hint').textContent='Computer unavailable. Continue with two players.';return;}busy=false;makeMove(data.move.from,data.move.to,data.move.promotion);};
ai.onerror=()=>{busy=false;mode='local';save();refresh();$('hint').textContent='Computer unavailable. Continue with two players.';};
$('board2d').addEventListener('click',e=>{const b=e.target.closest('[data-square]');if(b)select(b.dataset.square)});
$('camera').onclick=()=>{if(!board)return;board.setCinematic(!board.cinematic);$('camera').textContent=board.cinematic?'Play view':'Showroom view';$('camera').setAttribute('aria-pressed',String(board.cinematic));};
$('flip').onclick=()=>{flipped=!flipped;board?.flip();render2D()};
$('view').onclick=()=>{is2D=!is2D;$('camera').hidden=is2D;$('board3d').hidden=is2D;$('board2d').hidden=!is2D;$('view').textContent=is2D?'3D board':'2D board';$('view-label').textContent=is2D?'2D SHOWROOM':'3D SHOWROOM';board?.resize();};
$('sound').onclick=()=>{sound.enabled=!sound.enabled;storage.set('dealership-chess:sound',sound.enabled?'on':'off');updateSound();sound.play('select')};
$('sound-setting').onchange=e=>{sound.enabled=e.target.checked;storage.set('dealership-chess:sound',sound.enabled?'on':'off');updateSound();sound.play('select')};
$('motion-setting').onchange=e=>{reduced=e.target.checked;if(board)board.reduced=reduced;storage.set('dealership-chess:motion',reduced?'reduced':'full')};
$('settings').onclick=()=>$('settings-dialog').showModal();$('close-settings').onclick=()=>$('settings-dialog').close();
$('new').onclick=()=>$('new-dialog').showModal();$('cancel-new').onclick=()=>$('new-dialog').close();
$('confirm-new').onclick=()=>{requestId++;game=new Game();selected=null;busy=false;save();board?.sync(game.chess);refresh();$('new-dialog').close()};
$('undo').onclick=()=>{if(busy)return;requestId++;game.chess.undo();if(mode==='house'&&game.chess.turn()==='b')game.chess.undo();selected=null;save();board?.sync(game.chess);refresh()};
for(const m of ['local','house'])$(m).onclick=()=>{if(busy)return;mode=m;save();refresh();askHouse()};
$('export').onclick=()=>{const blob=new Blob([game.chess.pgn()],{type:'application/x-chess-pgn'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='dealership-chess.pgn';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
board?.sync(game.chess);refresh();askHouse();
