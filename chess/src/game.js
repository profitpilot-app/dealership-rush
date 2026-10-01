import { Chess } from 'chess.js';
export const roles = {k:'General Manager',q:'Closer',b:'Finance Manager',n:'Service Technician',r:'GM Desk',p:'Car'};
export const symbols = {k:'♚',q:'♛',b:'♝',n:'♞',r:'♜',p:'♟'};
export class Game {
  constructor(pgn='') { this.chess=new Chess(); if(pgn) this.chess.loadPgn(pgn); }
  legal(square) { return this.chess.moves({square,verbose:true}); }
  move(from,to,promotion='q') { try{return this.chess.move({from,to,promotion});}catch{return null;} }
  get status() {
    const c=this.chess, side=c.turn()==='w'?'Crimson':'Cobalt';
    if(c.isCheckmate()) return `${c.turn()==='w'?'Cobalt':'Crimson'} wins. Deal closed.`;
    if(c.isStalemate()) return 'Draw by stalemate.';
    if(c.isThreefoldRepetition()) return 'Draw by repetition.';
    if(c.isInsufficientMaterial()) return 'Draw: insufficient material.';
    if(c.isDrawByFiftyMoves()) return 'Draw: fifty-move rule.';
    return `${side} has the floor${c.isCheck()?' — check!':'.'}`;
  }
}
export function chooseMove(fen,depth=2) {
  const c=new Chess(fen), values={p:100,n:320,b:330,r:500,q:900,k:0};
  function score() {
    if(c.isCheckmate()) return -100000;
    if(c.isDraw()) return 0;
    let s=0;
    for(const row of c.board()) for(const p of row) if(p) {
      const center=3.5-Math.abs(p.square.charCodeAt(0)-97-3.5);
      const advance=p.color==='w'?Number(p.square[1])-2:7-Number(p.square[1]);
      const v=values[p.type]+(p.type==='p'?advance*7:(p.type==='n'||p.type==='b')?center*8:0);
      s+=(p.color===c.turn()?v:-v);
    }
    return s;
  }
  function search(d,a,b) {
    if(!d||c.isGameOver()) return score();
    let best=-Infinity;
    const moves=c.moves({verbose:true}).sort((a,b)=>(values[b.captured]||0)-(values[a.captured]||0));
    for(const m of moves){c.move(m);const s=-search(d-1,-b,-a);c.undo();best=Math.max(best,s);a=Math.max(a,s);if(a>=b)break;}
    return best;
  }
  let best=-Infinity, chosen=null;
  for(const m of c.moves({verbose:true})) {c.move(m);const s=-search(depth-1,-Infinity,Infinity);c.undo();if(s>best){best=s;chosen={from:m.from,to:m.to,promotion:m.promotion};}}
  return chosen;
}
