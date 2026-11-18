import {ASSETS,NEWS} from "./data.js";
export const FEE_RATE = 0.0015;
export function createInitialState(){
  return {day:1,cash:0,assets:ASSETS.map(a=>({...a,previous:a.price,change24:0,history:[a.price]})),holdings:{},transactions:[],news:[{day:1,tag:"WELCOME",title:"Your trading desk is open",body:"You start with 0 CR. Build your capital carefully; the market owes you nothing.",impact:"neutral"}],marketMood:"NEUTRAL",paused:true,speed:1,lastEvent:"The market is waiting."};
}
export function portfolioValue(s){return Object.entries(s.holdings).reduce((n,[id,h])=>n+(s.assets.find(a=>a.id===id)?.price||0)*h.quantity,0);}
export function totalEquity(s){return s.cash+portfolioValue(s);}
export function holdingCost(h){return h.quantity*h.average;}
export function buy(s,id,quantity){
  const a=s.assets.find(x=>x.id===id); quantity=Number(quantity);
  if(!a||!Number.isFinite(quantity)||quantity<=0) throw Error("Enter a valid quantity.");
  const gross=a.price*quantity, fee=gross*FEE_RATE, total=gross+fee;
  if(total>s.cash+1e-8) throw Error("Not enough cash for this trade.");
  const old=s.holdings[id]||{quantity:0,average:0};
  const next={...s, cash:s.cash-total,holdings:{...s.holdings,[id]:{quantity:old.quantity+quantity,average:(old.quantity*old.average+gross)/(old.quantity+quantity)}}};
  next.transactions=[{day:s.day,type:"BUY",asset:id,quantity,price:a.price,fee,total},...s.transactions];
  return next;
}
export function sell(s,id,quantity){
  const a=s.assets.find(x=>x.id===id),h=s.holdings[id]; quantity=Number(quantity);
  if(!a||!h||!Number.isFinite(quantity)||quantity<=0) throw Error("Enter a valid quantity.");
  if(quantity>h.quantity+1e-8) throw Error("You don't own that many units.");
  const gross=a.price*quantity,fee=gross*FEE_RATE,proceeds=gross-fee,remaining=h.quantity-quantity;
  const holdings={...s.holdings};
  if(remaining<1e-8) delete holdings[id]; else holdings[id]={...h,quantity:remaining};
  const next={...s,cash:s.cash+proceeds,holdings};
  next.transactions=[{day:s.day,type:"SELL",asset:id,quantity,price:a.price,fee,total:proceeds},...s.transactions];
  return next;
}
const rand=(min,max)=>min+Math.random()*(max-min);
export function advanceDay(s){
  const event=Math.random()<.58?NEWS[Math.floor(Math.random()*NEWS.length)]:null;
  const mood=event?.impact==="positive"?"BULLISH":event?.impact==="negative"?"BEARISH":(["BULLISH","BEARISH","NEUTRAL"][Math.floor(Math.random()*3)]);
  const assets=s.assets.map(a=>{
    const marketBias=mood==="BULLISH"?.006:mood==="BEARISH"?-.006:0;
    const shock=rand(-a.volatility,a.volatility)+marketBias;
    const next=Math.max(.0001,a.price*(1+shock));
    return {...a,previous:a.price,price:next,change24:(next/a.price-1)*100,history:[...a.history.slice(-23),next]};
  });
  const day=s.day+1;
  return {...s,day,assets,marketMood:mood,lastEvent:event?.title||"A quiet session across the market.",news:event?[{...event,day},...s.news].slice(0,30):s.news};
}
export function formatMoney(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:n<1?4:2}).format(n);}
export function formatNumber(n){return new Intl.NumberFormat("en-US",{maximumFractionDigits:6}).format(n);}
