import {ASSETS,NEWS} from "./data.js";
export const FEE_RATE = 0.0015;
export const NPR_PER_USD = 140;
export const JOBS = [
{id:"brief",title:"Market briefing",type:"Research contract",description:"Summarise the day's biggest market movements.",reward:120,effort:"Easy"},
{id:"sentiment",title:"Sentiment report",type:"Analyst contract",description:"Review market sentiment and identify the strongest sector.",reward:220,effort:"Standard"},
{id:"risk",title:"Risk assessment",type:"Research contract",description:"Compare asset volatility and write a risk assessment.",reward:350,effort:"Advanced"}
];
export function claimJob(s,id){
 const job=JOBS.find(j=>j.id===id); if(!job) throw Error("Contract unavailable.");
 const key=`${s.day}:${id}`; if((s.jobClaims||[]).includes(key)) throw Error("Already completed today.");
 return {...s,cash:s.cash+job.reward,jobClaims:[...(s.jobClaims||[]),key],news:[{day:s.day,tag:"CONTRACT",title:`${job.title} completed`,body:`You earned ${formatMoney(job.reward,"USD")} for your work.`,impact:"positive"},...s.news].slice(0,30)};
}
export function createInitialState(){
  return {day:1,cash:0,currency:"USD",jobClaims:[],assets:ASSETS.map(a=>({...a,previous:a.price,change24:0,history:[a.price]})),holdings:{},transactions:[],news:[{day:1,tag:"WELCOME",title:"Your trading desk is open",body:"You start with $0. Earn your first capital through research contracts, then invest it.",impact:"neutral"}],marketMood:"NEUTRAL",paused:true,speed:1,lastEvent:"The market is waiting."};
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
export function formatMoney(n,currency="USD"){
 const value=currency==="NPR"?n*NPR_PER_USD:n;
 if(currency==="NPR") return "रू "+new Intl.NumberFormat("en-IN",{maximumFractionDigits:value<100?2:0}).format(value);
 return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:Math.abs(value)<1?4:2}).format(value);
}
export function formatNumber(n){return new Intl.NumberFormat("en-US",{maximumFractionDigits:6}).format(n);}
