(() => {
  const cfg = window.TH3FLOW_CONFIG || {};
  if (cfg.mode !== 'live') return;
  if (!window.supabase || !cfg.supabaseUrl || !cfg.supabasePublishableKey || cfg.supabaseUrl.includes('YOUR_PROJECT')) {
    console.error('TH3FLOW live mode needs Supabase URL + publishable key in /play/config.js');
    return;
  }

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const E = {
    balance: $('#balance'), price: $('#price'), delta: $('#delta'), chart: $('#chart'), phase: $('#phase'), timer: $('#timer'),
    statusSmall: $('#statusSmall'), statusBig: $('#statusBig'), statusNote: $('#statusNote'), upPool: $('#upPool'), downPool: $('#downPool'),
    upOdds: $('#upOdds'), downOdds: $('#downOdds'), enter: $('#enter'), receipt: $('#receipt'), floaters: $('#floaters'), result: $('#result'),
    resultTitle: $('#resultTitle'), resultText: $('#resultText'), resultSmall: $('#resultSmall'), shareWin: $('#shareWin'), roundNo: $('#roundNo'),
    customStake: $('#customStake'), marketBadge: $('#marketBadge'), pair: $('.pair'), watching: $('#watching'), hours: $('#hours'), toast: $('#toast'),
    raceTrack: $('#raceTrack'), betLabel: $('#betLabel'), positionBox: $('#positionBox'), positionSide: $('#positionSide'), positionStake: $('#positionStake'), positionNote: $('#positionNote')
  };
  const state = {
    session: null, profile: null, account: null, race: null, races: [], entry: null, selectedSide: null, stakeNaira: 500,
    latestBid: null, chartPoints: [], marketChannel: null, raceChannel: null, lobbyChannel: null, reactionChannel: null,
    lastResult: null, leaderboardPeriod: 'daily', leaderboardCity: 'Nigeria', roomSessionId: crypto.randomUUID(), nextSession: null, pendingEntryRequest: null
  };
  let timerHandle = null, lobbyPoll = null;
  const kobo = n => Math.round(Number(n) * 100);
  const naira = minor => Number(minor || 0) / 100;
  const moneyMinor = minor => { const n=naira(minor); return `₦${n.toLocaleString('en-NG',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2})}`; };
  const signedMinor = minor => { const n=Math.abs(naira(minor)); return `${Number(minor)>=0?'+':'−'}₦${n.toLocaleString('en-NG',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2})}`; };
  const poolFmt = minor => { const n=naira(minor); return '₦'+(n>=1e6?(n/1e6).toFixed(2)+'m':n>=1e3?Math.round(n/1e3)+'k':Math.round(n).toLocaleString('en-NG')); };
  const fmt = sec => { sec=Math.max(0,Math.floor(sec)); return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; };
  const toast = m => { E.toast.textContent=m; E.toast.classList.add('show'); setTimeout(()=>E.toast.classList.remove('show'),1600); };
  const secondsTo = iso => (new Date(iso).getTime()-Date.now())/1000;
  const durationLabel = s => s===60?'1 MIN':s===300?'5 MIN':s===900?'15 MIN':`${Math.round(s/60)} MIN`;
  const grossOdds = (side,r=state.race) => { if(!r) return 0; const u=Number(r.higher_pool_minor||0),d=Number(r.lower_pool_minor||0),p=side==='higher'?u:d; return p?(u+d)/p:0; };
  const localPhase = r => {
    if (!r) return 'quiet';
    if (['settled','void'].includes(r.status)) return r.status;
    const now=Date.now(), close=Date.parse(r.entry_close_at), start=Date.parse(r.start_at), finish=Date.parse(r.finish_at);
    if(now<close) return 'entry'; if(now<start) return 'closed'; if(now<finish) return 'live'; return 'settling';
  };

  function syncBalance() {
    E.balance.parentElement.firstChild.textContent='Balance';
    E.balance.textContent = state.account ? moneyMinor(state.account.balance_minor) : '₦—';
  }
  function syncPools() {
    const r=state.race; if(!r) return;
    E.upPool.textContent=poolFmt(r.higher_pool_minor); E.downPool.textContent=poolFmt(r.lower_pool_minor);
    E.upOdds.textContent=(grossOdds('higher')||0).toFixed(2)+(localPhase(r)==='entry'?'× est.':'× final');
    E.downOdds.textContent=(grossOdds('lower')||0).toFixed(2)+(localPhase(r)==='entry'?'× est.':'× final');
  }
  function syncPositionUI() {
    const has=!!state.entry;
    if(E.positionBox) E.positionBox.classList.toggle('show',has);
    if(E.betLabel) E.betLabel.textContent=has?'Add to your position':'Your stake';
    $$('.choice').forEach(b=>{
      const side=b.dataset.side==='up'?'higher':'lower';
      b.disabled=has && side!==state.entry.side;
      b.classList.toggle('locked',has && side!==state.entry.side);
      b.classList.toggle('selected',has ? side===state.entry.side : side===state.selectedSide);
    });
    if(has){
      state.selectedSide=state.entry.side;
      if(E.positionSide) E.positionSide.textContent=state.entry.side==='higher'?'▲ HIGHER':'▼ LOWER';
      if(E.positionStake) E.positionStake.textContent=moneyMinor(state.entry.stake_minor);
      if(E.positionNote) E.positionNote.textContent=localPhase(state.race)==='entry'?'Direction locked · scale in until entries close':'Position locked';
    }
  }

  function syncEntryButton() {
    const r=state.race, p=localPhase(r), bal=state.account?naira(state.account.balance_minor):0;
    syncPositionUI();
    if(!r){ E.enter.disabled=true; E.enter.textContent='No race selected'; return; }
    if(!state.session){ E.enter.disabled=false; E.enter.textContent='SIGN IN TO ENTER'; return; }
    if(p!=='entry'){ E.enter.disabled=true; E.enter.textContent=state.entry?'POSITION LOCKED':'ENTRY CLOSED'; return; }
    const side=state.entry?.side||state.selectedSide;
    const existing=state.entry?naira(state.entry.stake_minor):0;
    const raceMax=naira(r.max_stake_minor);
    const belowMin=state.stakeNaira < naira(r.min_stake_minor);
    const overBalance=state.stakeNaira>bal;
    const overPosition=existing+state.stakeNaira>raceMax;
    const valid=side && state.stakeNaira>0 && !belowMin && !overBalance && !overPosition;
    E.enter.disabled=!valid;
    if(!side) E.enter.textContent='Choose a side';
    else if(belowMin) E.enter.textContent=`MINIMUM ${moneyMinor(r.min_stake_minor)}`;
    else if(overBalance) E.enter.textContent='STAKE EXCEEDS BALANCE';
    else if(overPosition) E.enter.textContent='POSITION LIMIT REACHED';
    else if(state.entry) E.enter.textContent=`ADD ${moneyMinor(kobo(state.stakeNaira))} TO ${side.toUpperCase()}`;
    else E.enter.textContent=`ENTER ${side.toUpperCase()} · ${moneyMinor(kobo(state.stakeNaira))}`;
  }

  function renderLobby() {
    const rows=state.races.slice(0,6);
    if(!rows.length){
      E.raceTrack.innerHTML=`<div class="quiet-lobby"><b>THE FLOW IS QUIET.</b><span>${state.nextSession?`Next session opens ${new Date(state.nextSession.opens_at).toLocaleString()}.`:'No session is currently scheduled.'}</span></div>`;
      return;
    }
    E.raceTrack.innerHTML=rows.map(r=>{
      const phase=localPhase(r), active=state.race?.id===r.id, target=phase==='entry'?r.entry_close_at:phase==='closed'?r.start_at:r.finish_at;
      const label=phase==='entry'?'ENTRY OPEN':phase==='closed'?'POOL LOCKED':phase==='live'?'LIVE':phase.toUpperCase();
      return `<button class="racecard ${active?'on':''}" data-race-id="${r.id}">
        <div class="rc-top"><b>${r.symbol.replace(/(.{3})(.{3})/,'$1 / $2')} · ${durationLabel(r.duration_seconds)}</b><span class="rc-state">${label}</span></div>
        <div class="rc-mid"><span class="rc-lock">${phase==='entry'?'Locks in':phase==='closed'?'Starts in':phase==='live'?'Ends in':phase==='void'?'Refunded':'Settled'}</span> <strong class="rc-time">${fmt(secondsTo(target))}</strong></div>
        <div class="rc-bottom"><span class="rc-pool">${poolFmt(Number(r.higher_pool_minor)+Number(r.lower_pool_minor))} pool</span><span class="rc-players">${Number(r.player_count||0).toLocaleString()} players</span></div>
      </button>`;
    }).join('');
    E.raceTrack.querySelectorAll('.racecard').forEach(b=>b.onclick=()=>selectRace(b.dataset.raceId));
  }

  async function loadLobby() {
    const from=new Date(Date.now()-20*60_000).toISOString(), to=new Date(Date.now()+90*60_000).toISOString();
    const {data,error}=await sb.from('races').select('*').gte('finish_at',from).lte('start_at',to).in('status',['open','closed','live','settling','settled','void']).order('start_at').limit(30);
    if(error){ console.error(error); return; }
    state.races=(data||[]).filter(r=>!['settled','void'].includes(r.status)||Date.parse(r.settled_at||0)>Date.now()-120000);
    if(!state.race && state.races.length){const preferred=state.races.find(r=>!['settled','void'].includes(r.status))||state.races[0];await selectRace(preferred.id);}
    else if(state.race){ const fresh=state.races.find(r=>r.id===state.race.id); if(fresh) state.race=fresh; }
    renderLobby(); syncPools(); renderState();
    const {data:sessions}=await sb.from('game_sessions').select('*').eq('active',true).gt('closes_at',new Date().toISOString()).order('opens_at').limit(1);
    state.nextSession=sessions?.[0]||null; updateHours();
  }

  async function selectRace(id) {
    const r=state.races.find(x=>x.id===id) || (await sb.from('races').select('*').eq('id',id).single()).data;
    if(!r) return;
    state.race=r; state.entry=null; state.selectedSide=null; state.chartPoints=[]; E.result.classList.remove('show');
    $$('.choice').forEach(b=>{b.classList.remove('selected','locked');b.disabled=false;});
    E.pair.innerHTML=`<b>${r.symbol.replace(/(.{3})(.{3})/,'$1 / $2')}</b> · ${durationLabel(r.duration_seconds)}`;
    E.roundNo.textContent='ROUND #'+r.id.slice(0,8).toUpperCase();
    await subscribeRoom(); await loadMyEntry(); renderLobby(); syncPools(); renderState(); syncEntryButton(); draw();
  }

  async function subscribeRoom() {
    if(state.marketChannel) await sb.removeChannel(state.marketChannel);
    if(state.raceChannel) await sb.removeChannel(state.raceChannel);
    if(state.reactionChannel) await sb.removeChannel(state.reactionChannel);
    if(!state.race) return;
    const symbol=state.race.symbol, raceId=state.race.id;
    const {data:latest}=await sb.from('market_latest').select('*').eq('symbol',symbol).maybeSingle();
    if(latest){ state.latestBid=Number(latest.bid); pushPoint(state.latestBid,new Date(latest.source_time).getTime()); }

    state.marketChannel=sb.channel(`market:${symbol}`)
      .on('broadcast',{event:'market_tick'},({payload})=>{ const bid=Number(payload.bid); if(!Number.isFinite(bid)) return; state.latestBid=bid; pushPoint(bid,Date.parse(payload.source_time)||Date.now()); renderPrice(); draw(); })
      .subscribe();
    state.raceChannel=sb.channel(`race:${raceId}`)
      .on('broadcast',{event:'race_update'},async({payload})=>{ state.race={...state.race,...payload}; syncPools(); renderState(); renderLobby(); if(['settled','void'].includes(state.race.status)) await showSettlement(); })
      .subscribe();
    state.reactionChannel=sb.channel(`reactions:${raceId}`,{config:{broadcast:{self:true},presence:{key:state.roomSessionId}}})
      .on('broadcast',{event:'reaction'},({payload})=>spawn(payload.emoji,payload.side))
      .on('presence',{event:'sync'},()=>{ const p=state.reactionChannel.presenceState(); E.watching.textContent=`● ${Object.keys(p).length.toLocaleString()} watching`; })
      .subscribe(async status=>{ if(status==='SUBSCRIBED') await state.reactionChannel.track({joined_at:new Date().toISOString()}); });
  }
  function pushPoint(bid,time){ state.chartPoints.push({bid,time}); if(state.chartPoints.length>500) state.chartPoints.shift(); }

  async function loadSession() {
    const {data:{session}}=await sb.auth.getSession(); state.session=session;
    if(session){
      const [p,a]=await Promise.all([
        sb.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle(),
        sb.from('ledger_accounts').select('id,balance_minor,currency').eq('kind','player').eq('currency','NGN').maybeSingle()
      ]);
      state.profile=p.data||null; state.account=a.data||null;
    } else { state.profile=null; state.account=null; state.entry=null; }
    syncBalance(); syncEntryButton(); renderAccount();
  }
  async function loadMyEntry(){
    if(!state.session||!state.race){state.entry=null;syncPositionUI();return;}
    const {data}=await sb.from('race_entries').select('*').eq('race_id',state.race.id).eq('user_id',state.session.user.id).maybeSingle(); state.entry=data||null;
    if(state.entry){
      state.selectedSide=state.entry.side;
      E.receipt.innerHTML=`Your <strong>${state.entry.side.toUpperCase()}</strong> position is <strong>${moneyMinor(state.entry.stake_minor)}</strong>.${localPhase(state.race)==='entry'?'<br>You can add to it until entries close.':''}`;
    } else {
      E.receipt.textContent='You have not entered this race.';
    }
    syncEntryButton();
  }

  function renderState(){
    const r=state.race; if(!r){ E.phase.textContent='WAITING'; E.timer.textContent='—'; return; }
    const p=localPhase(r); let target,small,note,badge;
    if(p==='entry'){target=r.entry_close_at;small='Entry closes in';note='Price is live. Estimated returns move with the crowd.';badge='LIVE MARKET · NOT LOCKED';}
    else if(p==='closed'){target=r.start_at;small='Price locks in';note='The pool is final. The market is still moving.';badge='POOL CLOSED · START NOT LOCKED';}
    else if(p==='live'){target=r.finish_at;small='Race ends in';note='The starting Bid is locked. Only the finish now matters.';badge='RACE LIVE · BID FEED';}
    else if(p==='settling'){target=new Date(Date.now()+1000);small='Settling';note='Waiting for the first valid Bid at or after the finish.';badge='SETTLING';}
    else {target=new Date();small=p==='void'?'Round void':'Round complete';note=p==='void'?'Entries are refunded.':'The next pool is already forming.';badge=p.toUpperCase();}
    const t=fmt(secondsTo(target)); E.phase.textContent=p==='entry'?'ENTRY OPEN':p==='closed'?'BETTING CLOSED':p==='live'?'LIVE':p.toUpperCase(); E.timer.textContent=t; E.statusSmall.textContent=small; E.statusBig.textContent=t; E.statusNote.textContent=note; E.marketBadge.textContent=badge;
    renderPrice(); syncEntryButton();
  }
  function renderPrice(){
    if(state.latestBid==null){E.price.textContent='—';E.delta.textContent='WAITING FOR MARKET FEED';return;}
    E.price.textContent=state.latestBid.toFixed(5); const r=state.race,p=localPhase(r);
    if(p==='live'&&r?.start_bid!=null){ const d=(state.latestBid-Number(r.start_bid))*10000; E.delta.textContent=`${d>=0?'▲':'▼'} ${Math.abs(d).toFixed(1)} PIPS FROM START`; E.delta.className='delta '+(d>=0?'up':'down'); }
    else {E.delta.textContent=p==='closed'?'POOL CLOSED · PRICE STILL MOVING':'LIVE BID · START NOT YET KNOWN';E.delta.className='delta';}
  }

  function draw(){
    const c=E.chart,ctx=c.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2),rect=c.getBoundingClientRect(); if(!rect.width||!rect.height)return;
    if(c.width!==Math.floor(rect.width*dpr)||c.height!==Math.floor(rect.height*dpr)){c.width=Math.floor(rect.width*dpr);c.height=Math.floor(rect.height*dpr)}
    ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.scale(dpr,dpr);const W=rect.width,H=rect.height,r=state.race,pts=state.chartPoints.slice(-240);
    if(!pts.length){ctx.restore();return;} const anchor=r?.start_bid!=null?Number(r.start_bid):pts[0].bid;const vals=pts.map(p=>p.bid);let min=Math.min(anchor,...vals),max=Math.max(anchor,...vals),span=Math.max(max-min,.00018);min-=span*.5;max+=span*.5;
    const y=v=>H-((v-min)/(max-min))*H*.72-H*.14; const t0=pts[0].time,t1=Math.max(pts[pts.length-1].time,t0+1); const x=t=>12+((t-t0)/(t1-t0))*(W-24);
    if(r?.start_bid!=null&&['live','settling','settled','void'].includes(localPhase(r))){ctx.strokeStyle='rgba(238,232,223,.22)';ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(0,y(Number(r.start_bid)));ctx.lineTo(W,y(Number(r.start_bid)));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(238,232,223,.35)';ctx.font='9px Montserrat';ctx.fillText('START',14,y(Number(r.start_bid))-8)}
    ctx.strokeStyle='rgba(238,232,223,.82)';ctx.lineWidth=1.6;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(x(p.time),y(p.bid)):ctx.moveTo(x(p.time),y(p.bid)));ctx.stroke();const p=pts[pts.length-1];ctx.fillStyle='#eee8df';ctx.beginPath();ctx.arc(x(p.time),y(p.bid),3,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  function spawn(emoji,side=''){const d=document.createElement('div');d.className='floater';d.textContent=(side==='higher'?'▲':side==='lower'?'▼':'')+emoji;d.style.left=(8+Math.random()*84)+'%';E.floaters.appendChild(d);setTimeout(()=>d.remove(),2200)}
  async function sendReaction(emoji){if(!state.reactionChannel)return;await state.reactionChannel.send({type:'broadcast',event:'reaction',payload:{emoji,side:state.entry?.side||state.selectedSide||''}});}

  async function placeEntry(){
    if(!state.session){$('#accountOverlay').classList.add('show');return;}
    const side=state.entry?.side||state.selectedSide;
    if(!state.race||!side)return;
    const stakeMinor=kobo(state.stakeNaira);
    const fingerprint=`${state.race.id}:${side}:${stakeMinor}`;
    if(!state.pendingEntryRequest){
      try{state.pendingEntryRequest=JSON.parse(sessionStorage.getItem('th3flow_pending_position_request')||'null')}catch{}
    }
    if(!state.pendingEntryRequest||state.pendingEntryRequest.fingerprint!==fingerprint){
      state.pendingEntryRequest={fingerprint,key:crypto.randomUUID()};
      sessionStorage.setItem('th3flow_pending_position_request',JSON.stringify(state.pendingEntryRequest));
    }
    const requestKey=state.pendingEntryRequest.key;
    E.enter.disabled=true; E.enter.textContent=state.entry?'ADDING…':'ENTERING…';
    const {data:{session}}=await sb.auth.getSession();
    let res,body;
    try{
      res=await fetch(`${cfg.supabaseUrl}/functions/v1/enter-race`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,'apikey':cfg.supabasePublishableKey},body:JSON.stringify({race_id:state.race.id,side,stake_minor:stakeMinor,idempotency_key:requestKey})});
      body=await res.json();
    }catch(e){
      toast('Network interrupted · press again to retry safely');syncEntryButton();return;
    }
    if(!res.ok){
      if(res.status<500){state.pendingEntryRequest=null;sessionStorage.removeItem('th3flow_pending_position_request')}
      toast(body.message||'Position rejected');syncEntryButton();return;
    }
    state.pendingEntryRequest=null;sessionStorage.removeItem('th3flow_pending_position_request');
    state.account={...(state.account||{}),balance_minor:body.balance_minor};
    await loadMyEntry(); await loadLobby(); syncBalance();
    toast(body.action==='scaled_in'?`Added ${moneyMinor(body.added_stake_minor)}`:body.action==='idempotent_replay'?'Position already confirmed':'Entry confirmed');
  }

  async function showSettlement(){
    if(!state.race)return; await loadMyEntry();
    if(state.race.status==='void'){
      const reason=state.race.void_reason,hadEntry=!!state.entry;
      E.resultSmall.textContent='Round void';E.resultTitle.textContent=hadEntry?'ENTRY REFUNDED':'RACE VOID';
      E.resultText.textContent=reason==='one_sided_liquidity'?(hadEntry?'The pool closed without players on both sides. Your full position was refunded before the race began.':'The pool closed without players on both sides, so the race never started.'):reason==='no_entries'?'No players entered this race, so it never started.':reason==='feed_unavailable'?(hadEntry?'The declared price feed was unavailable at a required boundary. Your full position was refunded.':'The declared price feed was unavailable at a required boundary, so the race was voided.'):(hadEntry?'The race was voided and your full position was refunded.':'The race was voided.');
      E.shareWin.style.display='none';E.result.classList.add('show');await loadSession();return;
    }
    const winner=state.race.result; E.resultSmall.textContent='Round settled';E.resultTitle.textContent=winner==='higher'?'HIGHER WINS':winner==='lower'?'LOWER WINS':'TIE';
    let msg=`Start ${Number(state.race.start_bid).toFixed(5)} · Finish ${Number(state.race.end_bid).toFixed(5)}`;
    if(state.entry?.settled){msg+=` · ${signedMinor(state.entry.net_pnl_minor)}`; state.lastResult={...state.entry,race:state.race};}
    E.resultText.textContent=msg;E.shareWin.style.display=state.entry?.settled?'inline-block':'none';E.result.classList.add('show'); await loadSession();
  }

  async function renderStats(){
    const box=$('#history'); if(!state.session){$('#sRounds').textContent='0';$('#sWinRate').textContent='—';$('#sNet').textContent='₦0';$('#sStreak').textContent='0';box.innerHTML='<div class="empty">Sign in to see your Flow.</div>';return;}
    const [{data:stats},{data:rows}]=await Promise.all([sb.from('player_stats').select('*').eq('user_id',state.session.user.id).maybeSingle(),sb.from('race_entries').select('*,races(symbol,duration_seconds,start_at,result,void_reason)').eq('user_id',state.session.user.id).order('created_at',{ascending:false}).limit(20)]);
    $('#sRounds').textContent=stats?.rounds||0;$('#sWinRate').textContent=stats?.rounds?Math.round(stats.wins/stats.rounds*100)+'%':'—';$('#sNet').textContent=signedMinor(stats?.net_pnl_minor||0);$('#sStreak').textContent=stats?.best_streak||0;
    box.innerHTML=!rows?.length?'<div class="empty">Your first race will appear here.</div>':'<div class="hrow head"><span>Race</span><span>Side</span><span>Result</span><span>P/L</span></div>'+rows.map(h=>`<div class="hrow"><span>${h.races?.symbol||'—'} · ${durationLabel(h.races?.duration_seconds||60)}</span><span>${h.side==='higher'?'▲ HIGH':'▼ LOW'}</span><span>${h.races?.result==='void'?'VOID':h.settled?(h.net_pnl_minor>0?'WIN':h.net_pnl_minor<0?'LOSS':'TIE'):'OPEN'}</span><span class="${Number(h.net_pnl_minor||0)>=0?'pos':'neg'}">${h.settled?signedMinor(h.net_pnl_minor):'—'}</span></div>`).join('');
  }
  async function renderBoard(){
    const cityParam=['Nigeria','Global'].includes(state.leaderboardCity)?null:state.leaderboardCity; const {data,error}=await sb.rpc('get_leaderboard',{p_period:state.leaderboardPeriod,p_city:cityParam,p_limit:20}); if(error){console.error(error);return;}
    $('#leaderList').innerHTML=(data||[]).map(x=>`<div class="leaderrow"><div class="rank">${x.rank}</div><div><span class="lname">${x.display_name}</span><span class="lcity">${x.public_city||'—'}</span></div><div class="lstat">${signedMinor(x.net_pnl_minor)}</div><div class="lstreak">🔥 ${x.best_streak}</div></div>`).join('')||'<div class="empty">No public players here yet.</div>';
    $('#leaderToggle').classList.toggle('on',!!state.profile?.leaderboard_opt_in);
  }

  async function renderAccount(){
    const logged=!!state.session; $('#authLoggedOut').style.display=logged?'none':'block';$('#authLoggedIn').style.display=logged?'block':'none';
    if(!logged){$('#accountIdentity').textContent='Not signed in';return;}
    $('#accountIdentity').textContent=state.session.user.email||state.session.user.phone||'Signed in'; $('#profileName').value=state.profile?.display_name||'';$('#profileCity').value=state.profile?.public_city||'';$('#accountKyc').textContent=(state.profile?.kyc_status||'not_started').replaceAll('_',' ');$('#accountBalance').textContent=state.account?moneyMinor(state.account.balance_minor):'₦—'; $('#profileLeader').classList.toggle('on',!!state.profile?.leaderboard_opt_in);
  }
  async function saveProfile(){const updates={display_name:$('#profileName').value.trim()||null,public_city:$('#profileCity').value.trim()||null,leaderboard_opt_in:$('#profileLeader').classList.contains('on')};const {data,error}=await sb.from('profiles').update(updates).eq('user_id',state.session.user.id).select().single();if(error)return toast(error.message);state.profile=data;toast('Profile saved');}
  async function coolOff(hours){const {data:{session}}=await sb.auth.getSession();const res=await fetch(`${cfg.supabaseUrl}/functions/v1/responsible-play`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,'apikey':cfg.supabasePublishableKey},body:JSON.stringify({action:'cool_off',hours})});const body=await res.json();if(!res.ok)return toast(body.message||'Could not set cool-off');toast(`Cool-off active until ${new Date(body.cool_off_until).toLocaleString()}`);}

  function updateHours(){ const d=new Date(),mins=d.getUTCHours()*60+d.getUTCMinutes(),black=mins>=1245&&mins<1380; if(black)E.hours.innerHTML='<span class="dot"></span><span>THE FLOW IS QUIET · rollover blackout 20:45–23:00 UTC</span>'; else if(state.nextSession)E.hours.innerHTML=`<span class="dot"></span><span>Scheduled session · ${new Date(state.nextSession.opens_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}–${new Date(state.nextSession.closes_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>`; else E.hours.innerHTML='<span class="dot"></span><span>No live session currently scheduled</span>'; }

  // Main controls.
  $$('.stake').forEach(b=>b.onclick=()=>{state.stakeNaira=Number(b.dataset.v);$$('.stake').forEach(x=>x.classList.toggle('on',x===b));E.customStake.value='';syncEntryButton();});
  E.customStake.oninput=()=>{state.stakeNaira=Math.max(0,Number(E.customStake.value||0));$$('.stake').forEach(x=>x.classList.remove('on'));syncEntryButton();};
  $$('.choice').forEach(b=>b.onclick=()=>{if(state.entry)return;state.selectedSide=b.dataset.side==='up'?'higher':'lower';$$('.choice').forEach(x=>x.classList.toggle('selected',x===b));syncEntryButton();});
  E.enter.onclick=placeEntry;
  E.again.onclick=async()=>{ const next=state.races.find(r=>r.id!==state.race?.id && ['open','closed'].includes(r.status) && Date.parse(r.start_at)>=Date.now()); if(next) await selectRace(next.id); else await loadLobby(); };
  $$('.react').forEach(b=>b.onclick=()=>sendReaction(b.textContent));
  $('#accountBtn').onclick=()=>{$('#accountOverlay').classList.add('show');renderAccount();};
  $('#leaderBtn').onclick=()=>{$('#leaderOverlay').classList.add('show');renderBoard();}; $('#flowBtn').onclick=()=>{$('#flowOverlay').classList.add('show');renderStats();};
  $$('.close').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).classList.remove('show'));$$('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show')}));
  $$('#periodTabs .tab').forEach(b=>b.onclick=()=>{state.leaderboardPeriod=b.dataset.period;$$('#periodTabs .tab').forEach(x=>x.classList.toggle('on',x===b));renderBoard();});
  $$('#cityTabs .tab').forEach(b=>b.onclick=()=>{state.leaderboardCity=b.dataset.city;$$('#cityTabs .tab').forEach(x=>x.classList.toggle('on',x===b));renderBoard();});
  $('#leaderToggle').onclick=async()=>{if(!state.session)return $('#accountOverlay').classList.add('show');const next=!state.profile?.leaderboard_opt_in;const {data,error}=await sb.from('profiles').update({leaderboard_opt_in:next}).eq('user_id',state.session.user.id).select().single();if(error)return toast(error.message);state.profile=data;renderBoard();};
  $('#sendLogin').onclick=async()=>{const email=$('#loginEmail').value.trim();if(!email)return;const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+'/play/'}});toast(error?error.message:'Sign-in link sent');};
  $('#signOut').onclick=async()=>{await sb.auth.signOut();await loadSession();toast('Signed out');}; $('#saveProfile').onclick=saveProfile; $('#profileLeader').onclick=()=>$('#profileLeader').classList.toggle('on'); $('#coolOff24').onclick=()=>coolOff(24);
  $('#depositStub').onclick=()=>toast(cfg.paymentsEnabled?'Open configured deposit provider':'Payment rail not connected yet'); $('#withdrawStub').onclick=()=>toast(cfg.paymentsEnabled?'Open configured withdrawal provider':'Payment rail not connected yet');

  // Share result using the existing social modal.
  E.shareWin.onclick=()=>{if(!state.lastResult)return;const r=state.lastResult.race,profit=state.lastResult.net_pnl_minor;$('#shareArrow').textContent=r.result==='higher'?'▲':'▼';$('#shareProfit').textContent=signedMinor(profit);$('#shareSub').textContent=`${r.symbol} · ${durationLabel(r.duration_seconds)} · ${r.id.slice(0,8).toUpperCase()}`;$('#shareStreak').textContent=profit>0?'Called it.':'The market went the other way.';$('#shareOverlay').classList.add('show');};
  function shareText(){if(!state.lastResult)return 'TH3FLOW';const r=state.lastResult.race;return `I called ${state.lastResult.side.toUpperCase()} on TH3FLOW · ${r.symbol} ${durationLabel(r.duration_seconds)} · ${signedMinor(state.lastResult.net_pnl_minor)}.`;}
  $('#nativeShare').onclick=async()=>{const data={title:'TH3FLOW',text:shareText(),url:location.origin+'/play/'};if(navigator.share)try{await navigator.share(data)}catch{}else{await navigator.clipboard?.writeText(data.text+' '+data.url);toast('Copied')}};
  $('#waShare').onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent(shareText()+' '+location.origin+'/play/'),'_blank','noopener');$('#xShare').onclick=()=>window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText())+'&url='+encodeURIComponent(location.origin+'/play/'),'_blank','noopener');$('#copyShare').onclick=async()=>{await navigator.clipboard?.writeText(shareText()+' '+location.origin+'/play/');toast('Copied')};


  $('#saveShare').onclick=()=>{
    if(!state.lastResult)return;
    const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');
    const g=x.createRadialGradient(540,180,20,540,680,900);g.addColorStop(0,'#28221c');g.addColorStop(.48,'#0b0908');g.addColorStop(1,'#030303');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
    const r=state.lastResult.race;x.textAlign='center';x.fillStyle='rgba(238,232,223,.64)';x.font='300 28px sans-serif';x.fillText('T H 3 F L O W',540,125);
    x.fillStyle='#eee8df';x.font='300 180px serif';x.fillText(r.result==='higher'?'▲':'▼',540,410);x.font='300 122px serif';x.fillText(signedMinor(state.lastResult.net_pnl_minor),540,600);
    x.fillStyle='rgba(238,232,223,.55)';x.font='300 27px sans-serif';x.fillText(`${r.symbol} · ${durationLabel(r.duration_seconds)} · ${r.id.slice(0,8).toUpperCase()}`,540,680);
    x.fillStyle='rgba(238,232,223,.7)';x.font='italic 42px serif';x.fillText(state.lastResult.net_pnl_minor>0?'Called it.':'The market went the other way.',540,795);
    x.strokeStyle='rgba(238,232,223,.13)';x.beginPath();x.moveTo(260,870);x.lineTo(820,870);x.stroke();x.fillStyle='rgba(238,232,223,.36)';x.font='300 25px sans-serif';x.fillText('HIGHER OR LOWER. REAL MARKET. REAL CROWD.',540,960);x.fillStyle='rgba(238,232,223,.25)';x.font='300 24px sans-serif';x.fillText('th3flow.world/play',540,1190);
    const a=document.createElement('a');a.download=`th3flow-${r.id.slice(0,8)}.png`;a.href=c.toDataURL('image/png');a.click();toast('Share card saved');
  };

  // Keep lobby/race countdowns alive even without database writes.
  timerHandle=setInterval(()=>{renderState();renderLobby();draw();},250); lobbyPoll=setInterval(loadLobby,15000);
  state.lobbyChannel=sb.channel('lobby').on('broadcast',{event:'lobby_update'},({payload})=>{const i=state.races.findIndex(r=>r.id===payload.id);if(i>=0)state.races[i]={...state.races[i],...payload};else state.races.push(payload);if(state.race?.id===payload.id)state.race={...state.race,...payload};renderLobby();syncPools();renderState();}).subscribe();
  sb.auth.onAuthStateChange(async()=>{await loadSession();await loadMyEntry();});
  $('.demo').textContent='LIVE ENGINE · PAYMENT RAILS PENDING';
  $('.legal').innerHTML='<strong style="color:rgba(238,232,223,.42);font-weight:400">Player vs player · add to your position until entry close · 2% fee on profit only</strong><br>Direction locks on first entry · a race only starts with liquidity on both HIGHER and LOWER · one-sided pools refund before the start · reference price uses the declared MT5 broker Bid feed.';
  window.addEventListener('resize',draw);
  Promise.all([loadSession(),loadLobby()]).then(()=>{syncBalance();renderState();draw();});
})();
