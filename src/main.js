import "./style.css";
import {createInitialState,buy,sell,advanceDay,claimJob,JOBS,portfolioValue,totalEquity,formatMoney,formatNumber,FEE_RATE,NPR_PER_USD} from "./engine.js";
import {saveGame,loadGame,deleteSave} from "./storage.js";
let state=loadGame()||createInitialState();
state.currency=state.currency||"USD";state.jobClaims=state.jobClaims||[];
let page="menu",selected="BTCX",query="",sort="marketCap",tradeSide="BUY",quantity="1",toast="",toastTimer;
const app=document.querySelector("#app");
const money=n=>formatMoney(n,state.currency);
const pct=n=>`<span class="${n>=0?"up":"down"}">${n>=0?"+":""}${n.toFixed(2)}%</span>`;
function notify(message){toast=message;render();clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast="";render()},2600)}
function persist(){saveGame(state)}
function asset(id){return state.assets.find(a=>a.id===id)}
function valueOf(id){return (state.holdings[id]?.quantity||0)*asset(id).price}
function render(){
 if(page==="menu"){renderMenu();return;}
 const total=totalEquity(state),pValue=portfolioValue(state),invested=Object.values(state.holdings).reduce((n,h)=>n+h.quantity*h.average,0),unreal=pValue-invested;
 const nav=[["dashboard","Overview"],["markets","Markets"],["opportunities","Earn capital"],["portfolio","Portfolio"],["activity","Activity"]];
 app.innerHTML=`
 <div class="shell">
  <aside class="sidebar"><div class="brand"><span class="brand-mark">C</span><div><b>CRYPTANOMICS</b><small>TRADING SIMULATOR</small></div></div>
   <div class="desk-label">TRADING DESK</div><nav>${nav.map(([id,label])=>`<button class="nav ${page===id?"active":""}" data-page="${id}"><span>${({dashboard:"◫",markets:"⌁",opportunities:"＄",portfolio:"▤",activity:"↗"})[id]}</span>${label}</button>`).join("")}</nav>
   <div class="sidebar-bottom"><div class="status-dot"></div><span>SIMULATION ONLINE</span><small>PHASE 01 · BUILD 0.1</small></div>
  </aside>
  <main class="main"><header class="topbar"><div><div class="eyebrow">TRADER TERMINAL / DAY ${state.day}</div><h1>${({dashboard:"Market overview",markets:"Markets",opportunities:"Earn your first capital",portfolio:"Your portfolio",activity:"Trade activity",settings:"Settings"})[page]}</h1></div><div class="top-actions"><span class="mood">${state.marketMood}</span><button class="icon-btn" id="menuBtn" title="Main menu">⌂</button><button class="icon-btn" id="settingsBtn" title="Settings">⚙</button><button class="icon-btn" id="saveBtn" title="Save game">↧</button></div></header>
   <section class="metrics">
    <article class="metric primary"><label>TOTAL EQUITY</label><strong>${money(total)}</strong><small>Cash + current holdings</small></article>
    <article class="metric"><label>AVAILABLE CASH</label><strong>${money(state.cash)}</strong><small>Ready to trade</small></article>
    <article class="metric"><label>PORTFOLIO VALUE</label><strong>${money(pValue)}</strong><small>${Object.keys(state.holdings).length} assets held</small></article>
    <article class="metric"><label>UNREALISED P/L</label><strong class="${unreal>=0?"up":"down"}">${unreal>=0?"+":""}${money(unreal)}</strong><small>Based on average buy price</small></article>
   </section>
   ${page==="dashboard"?dashboard():page==="markets"?markets():page==="opportunities"?opportunities():page==="portfolio"?portfolio():page==="settings"?settingsPage():activity()}
   <footer><span>SIMULATED MARKET DATA · NOT REAL CRYPTOCURRENCY</span><span>TRADING FEE ${(FEE_RATE*100).toFixed(2)}%</span></footer>
  </main>
  <aside class="rightbar"><div class="panel-head"><div><div class="eyebrow">QUICK TRADE</div><h2>Order ticket</h2></div><span class="live">● LIVE</span></div>
   <div class="selected-asset"><div class="coin-icon">${selected.slice(0,1)}</div><div><b>${asset(selected).name}</b><small>${selected} / ${state.currency}</small></div><strong>${money(asset(selected).price)}</strong></div>
   <div class="toggle"><button data-side="BUY" class="${tradeSide==="BUY"?"chosen buy":""}">BUY</button><button data-side="SELL" class="${tradeSide==="SELL"?"chosen sell":""}">SELL</button></div>
   <label class="field-label">QUANTITY</label><input id="quantity" type="number" min="0" step="any" value="${quantity}" />
   <div class="estimate"><span>Estimated total</span><b>${money((Number(quantity)||0)*asset(selected).price*(tradeSide==="BUY"?1+FEE_RATE:1-FEE_RATE))}</b></div>
   <button class="trade-btn ${tradeSide.toLowerCase()}" id="tradeBtn">${tradeSide} ${selected}</button>
   <div class="trade-note">Includes ${(FEE_RATE*100).toFixed(2)}% trading fee. Prices are simulated.</div>
   <div class="right-divider"></div><div class="panel-head"><div><div class="eyebrow">MARKET CLOCK</div><h2>Simulation</h2></div></div>
   <div class="clock-row"><div><small>CURRENT DAY</small><b>DAY ${state.day}</b></div><span class="clock-state">${state.paused?"PAUSED":"RUNNING"}</span></div>
   <button class="advance-btn" id="advanceBtn">Advance one day ↗</button>
   <div class="clock-controls"><button id="pauseBtn">${state.paused?"Resume":"Pause"}</button><button id="resetBtn">Reset save</button></div>
   <div class="disclaimer">This is a fictional educational simulation. No real funds or exchange orders.</div>
  </aside>
 </div>
 ${toast?`<div class="toast">${toast}</div>`:""}
 `;
 bind();
}
function dashboard(){
 const movers=[...state.assets].sort((a,b)=>Math.abs(b.change24)-Math.abs(a.change24)).slice(0,5);
 return `<section class="content-grid"><div class="panel chart-panel"><div class="panel-head"><div><div class="eyebrow">MARKET PULSE</div><h2>Market performance</h2></div><span class="subtle">SIMULATED · 24H</span></div><div class="market-banner"><div><small>MARKET SENTIMENT</small><b>${state.marketMood}</b></div><p>${state.lastEvent}</p></div><div class="chart-wrap">${chartSvg(asset(selected).history)}</div><div class="chart-foot"><span>Selected: ${selected}</span><span>Current: ${money(asset(selected).price)}</span></div></div>
 <div class="panel movers"><div class="panel-head"><div><div class="eyebrow">VOLATILITY WATCH</div><h2>Biggest movers</h2></div><button class="text-btn" data-page="markets">All markets →</button></div>${movers.map(a=>`<button class="mover" data-asset="${a.id}"><span class="coin-icon small">${a.id[0]}</span><span><b>${a.name}</b><small>${a.id}</small></span><strong>${money(a.price)}</strong>${pct(a.change24)}</button>`).join("")}</div></section>
 <section class="panel news-panel"><div class="panel-head"><div><div class="eyebrow">THE WIRE</div><h2>Latest market news</h2></div><span class="subtle">SIMULATED HEADLINES</span></div>${state.news.slice(0,4).map(n=>`<div class="news-item"><span class="news-tag ${n.impact}">${n.tag}</span><div><b>${n.title}</b><p>${n.body}</p></div><small>DAY ${n.day}</small></div>`).join("")}</section>`;
}
function chartSvg(values){const w=680,h=190,p=12,min=Math.min(...values),max=Math.max(...values),range=max-min||1;const pts=values.map((v,i)=>`${p+i/(Math.max(values.length-1,1))*(w-p*2)},${h-p-(v-min)/range*(h-p*2)}`).join(" ");return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#57d6a0" stop-opacity=".22"/><stop offset="100%" stop-color="#57d6a0" stop-opacity="0"/></linearGradient></defs><path d="M ${pts.replaceAll(" "," L ")} L ${w-p},${h} L ${p},${h} Z" fill="url(#area)"/><polyline points="${pts}" fill="none" stroke="#57d6a0" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>`}
function markets(){
 const list=state.assets.filter(a=>(a.name+" "+a.id+" "+a.sector).toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="price"?b.price-a.price:sort==="change"?b.change24-a.change24:a.name.localeCompare(b.name));
 return `<section class="panel table-panel"><div class="panel-head"><div><div class="eyebrow">SPOT MARKET</div><h2>All assets <span class="count">${list.length}</span></h2></div><input class="search" id="search" placeholder="Search assets..." value="${query}"/></div><div class="table-scroll"><table><thead><tr><th>ASSET</th><th>PRICE</th><th>24H CHANGE</th><th>SUPPLY</th><th></th></tr></thead><tbody>${list.map(a=>`<tr><td><button class="asset-cell" data-asset="${a.id}"><span class="coin-icon small">${a.id[0]}</span><span><b>${a.name}</b><small>${a.id} · ${a.sector}</small></span></button></td><td>${money(a.price)}</td><td>${pct(a.change24)}</td><td>${a.supply}</td><td><button class="row-trade" data-pick="${a.id}">Trade</button></td></tr>`).join("")||'<tr><td colspan="5" class="empty">No assets match that search.</td></tr>'}</tbody></table></div></section>`;
}
function portfolio(){
 const entries=Object.entries(state.holdings);
 return `<section class="panel table-panel"><div class="panel-head"><div><div class="eyebrow">YOUR POSITIONS</div><h2>Holdings</h2></div><span class="subtle">${entries.length} OPEN POSITIONS</span></div>${entries.length?`<div class="table-scroll"><table><thead><tr><th>ASSET</th><th>QUANTITY</th><th>AVG. ENTRY</th><th>VALUE</th><th>P/L</th><th></th></tr></thead><tbody>${entries.map(([id,h])=>{const a=asset(id),v=valueOf(id),pl=v-h.quantity*h.average;return `<tr><td><b>${a.name}</b><small class="block">${id}</small></td><td>${formatNumber(h.quantity)}</td><td>${money(h.average)}</td><td>${money(v)}</td><td class="${pl>=0?"up":"down"}">${pl>=0?"+":""}${money(pl)}</td><td><button class="row-trade" data-pick="${id}" data-sell="true">Sell</button></td></tr>`}).join("")}</tbody></table></div>`:'<div class="empty-state"><div class="empty-icon">▤</div><h3>No positions yet</h3><p>Your portfolio is empty. Complete research contracts to earn cash, then invest it in the market.</p></div>'}</section>`;
}

function opportunities(){
 const jobs=JOBS.map(j=>({...j,claimed:(state.jobClaims||[]).includes(`${state.day}:${j.id}`)}));
 return `<section class="panel jobs-panel"><div class="panel-head"><div><div class="eyebrow">STARTER CAPITAL</div><h2>Research & freelance contracts</h2></div><span class="subtle">DAY ${state.day}</span></div><p class="jobs-intro">You begin with an empty wallet. Complete research jobs to build your first trading balance. Each contract can be completed once per simulation day.</p><div class="job-grid">${jobs.map(j=>`<article class="job-card"><div class="job-top"><span class="job-type">${j.type}</span><span class="job-effort">${j.effort}</span></div><h3>${j.title}</h3><p>${j.description}</p><div class="job-bottom"><div><small>CONTRACT REWARD</small><b>${money(j.reward)}</b></div><button class="claim-btn ${j.claimed?"claimed":""}" data-job="${j.id}" ${j.claimed?"disabled":""}>${j.claimed?"Completed":"Complete contract"}</button></div></article>`).join("")}</div><div class="capital-note"><b>Trading tip</b><span>Contract rewards are added to your available cash. You can invest, hold or build on that capital through trading.</span></div></section>`;
}
function settingsPage(){
 return `<section class="panel settings-panel"><div class="eyebrow">PREFERENCES</div><h2>Game settings</h2><div class="setting-row"><div><b>Display currency</b><p>Choose how prices, cash, portfolio value and transaction history are shown.</p></div><select id="currencySelect"><option value="USD" ${state.currency==="USD"?"selected":""}>USD · US Dollar ($)</option><option value="NPR" ${state.currency==="NPR"?"selected":""}>NPR · Nepalese Rupee (रू)</option></select></div><div class="fx-note">NPR display conversion uses a fixed simulated rate of रू ${NPR_PER_USD} per $1. This is not a live exchange quote. All trading calculations remain in USD.</div><button class="advance-btn settings-back" id="backToGame">Back to game</button></section>`;
}
function renderMenu(){
 const saved=!!loadGame();
 app.innerHTML=`<main class="menu-screen"><div class="menu-top"><div class="brand"><span class="brand-mark">C</span><div><b>CRYPTANOMICS</b><small>THE MARKET IS YOURS TO MASTER</small></div></div><span class="menu-build">PHASE 01 · TRADING SIMULATOR</span></div><section class="menu-hero"><div class="menu-kicker">A FINANCIAL WORLD SIMULATION</div><h1>Build your capital.<br><span>Read the market.</span></h1><p>Start with nothing. Earn your first money through research contracts, make calculated trades and grow your portfolio in a simulated crypto market.</p><div class="menu-actions"><button class="menu-primary" id="continueBtn" ${saved?"":"disabled"}>${saved?"Continue career":"No saved career"}</button><button class="menu-secondary" id="newGameBtn">Start new career</button><button class="menu-secondary" id="menuSettingsBtn">Settings</button></div></section><section class="menu-bottom"><div><small>YOUR STARTING BALANCE</small><b>$0.00</b><span>No handouts. Earn your first capital.</span></div><div><small>MARKET ENVIRONMENT</small><b>Real-inspired</b><span>15 fictional digital assets</span></div><div><small>SIMULATION</small><b>Hybrid progression</b><span>Pause, advance or let time move</span></div></section><footer><span>FICTIONAL MARKET DATA · NO REAL MONEY</span><span>CRYPTANOMICS © 2026</span></footer></main>`;
 document.querySelector("#continueBtn")?.addEventListener("click",()=>{const save=loadGame();if(!save)return;state=save;state.currency=state.currency||"USD";state.jobClaims=state.jobClaims||[];page="dashboard";render()});
 document.querySelector("#newGameBtn")?.addEventListener("click",()=>{if(saved&&!confirm("Start a new career? This replaces the saved game on this device."))return;deleteSave();state=createInitialState();persist();page="dashboard";render()});
 document.querySelector("#menuSettingsBtn")?.addEventListener("click",()=>renderMenuSettings());
}
function renderMenuSettings(){
 app.innerHTML=`<main class="menu-screen"><div class="menu-top"><div class="brand"><span class="brand-mark">C</span><div><b>CRYPTANOMICS</b><small>GAME SETTINGS</small></div></div><button class="menu-secondary" id="settingsMenuBack">Back to menu</button></div><section class="menu-settings"><div class="eyebrow">PREFERENCES</div><h1>Settings</h1><div class="setting-row"><div><b>Display currency</b><p>Choose how all financial values appear in the game.</p></div><select id="currencySelect"><option value="USD" ${state.currency==="USD"?"selected":""}>USD · US Dollar ($)</option><option value="NPR" ${state.currency==="NPR"?"selected":""}>NPR · Nepalese Rupee (रू)</option></select></div><div class="fx-note">NPR uses a fixed simulated display rate of रू ${NPR_PER_USD} per $1. It is not a live exchange rate. All game calculations remain in USD.</div></section></main>`;
 document.querySelector("#settingsMenuBack")?.addEventListener("click",()=>{page="menu";render()});
 document.querySelector("#currencySelect")?.addEventListener("change",e=>{state.currency=e.target.value;persist();renderMenuSettings()});
}
function activity(){
 return `<section class="panel table-panel"><div class="panel-head"><div><div class="eyebrow">ORDER HISTORY</div><h2>Transactions</h2></div><span class="subtle">${state.transactions.length} TOTAL</span></div>${state.transactions.length?`<div class="table-scroll"><table><thead><tr><th>DAY</th><th>TYPE</th><th>ASSET</th><th>QUANTITY</th><th>PRICE</th><th>FEE</th><th>TOTAL</th></tr></thead><tbody>${state.transactions.map(t=>`<tr><td>${t.day}</td><td><span class="type-pill ${t.type.toLowerCase()}">${t.type}</span></td><td>${t.asset}</td><td>${formatNumber(t.quantity)}</td><td>${money(t.price)}</td><td>${money(t.fee)}</td><td>${money(t.total)}</td></tr>`).join("")}</tbody></table></div>`:'<div class="empty-state"><div class="empty-icon">↗</div><h3>No trades recorded</h3><p>Your transaction history will appear here after your first trade.</p></div>'}</section>`;
}
function bind(){
 document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>{page=b.dataset.page;render()}));
 document.querySelector("#menuBtn")?.addEventListener("click",()=>{page="menu";render()});
 document.querySelector("#settingsBtn")?.addEventListener("click",()=>{page="settings";render()});
 document.querySelector("#currencySelect")?.addEventListener("change",e=>{state.currency=e.target.value;persist();render()});
 document.querySelector("#backToGame")?.addEventListener("click",()=>{page="dashboard";render()});
 document.querySelectorAll("[data-job]").forEach(b=>b.addEventListener("click",()=>{try{state=claimJob(state,b.dataset.job);persist();notify("Contract completed. Your cash balance has increased.")}catch(e){notify(e.message)}}));
 document.querySelectorAll("[data-asset]").forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.asset;render()}));
 document.querySelectorAll("[data-pick]").forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.pick;if(b.dataset.sell)tradeSide="SELL";page="markets";render()}));
 document.querySelectorAll("[data-side]").forEach(b=>b.addEventListener("click",()=>{tradeSide=b.dataset.side;render()}));
 const q=document.querySelector("#quantity");q?.addEventListener("input",e=>{quantity=e.target.value;const total=document.querySelector(".estimate b");if(total)total.textContent=money((Number(quantity)||0)*asset(selected).price*(tradeSide==="BUY"?1+FEE_RATE:1-FEE_RATE))});
 document.querySelector("#tradeBtn")?.addEventListener("click",()=>{try{state=tradeSide==="BUY"?buy(state,selected,quantity):sell(state,selected,quantity);persist();notify(`${tradeSide} order completed: ${quantity} ${selected}`)}catch(e){notify(e.message)}});
 document.querySelector("#advanceBtn")?.addEventListener("click",()=>{state=advanceDay(state);persist();notify(`Day ${state.day} market update complete.`)});
 document.querySelector("#pauseBtn")?.addEventListener("click",()=>{state.paused=!state.paused;persist();render()});
 document.querySelector("#saveBtn")?.addEventListener("click",()=>{persist();notify("Game saved on this device.")});
 document.querySelector("#resetBtn")?.addEventListener("click",()=>{if(confirm("Delete your local save and restart from Day 1 with $0?")){deleteSave();state=createInitialState();page="menu";persist();render()}});
 document.querySelector("#search")?.addEventListener("input",e=>{query=e.target.value;const pos=e.target.selectionStart;render();const input=document.querySelector("#search");input.focus();input.setSelectionRange(pos,pos)});
}
render();
