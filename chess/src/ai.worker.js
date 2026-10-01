import {chooseMove} from './game.js';
self.onmessage=({data})=>{try{self.postMessage({id:data.id,move:chooseMove(data.fen,2)});}catch{self.postMessage({id:data.id,error:true});}};
