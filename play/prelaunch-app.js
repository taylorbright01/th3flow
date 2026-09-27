(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const cfg = window.TH3FLOW_CONFIG || {};
  const REF_STORE = 'th3flow_pending_referral';
  const AFFILIATE_INTENT = 'th3flow_affiliate_intent';
  let launchStatus = window.__TH3FLOW_LAUNCH_STATUS || null;

  const reducedMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const lowPower = reducedMotion ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    window.matchMedia?.('(max-width: 700px)').matches;
  if (lowPower) document.body.classList.add('low-power');

  const E = {
    balance: $('#balance'), price: $('#price'), delta: $('#delta'), chart: $('#chart'), phase: $('#phase'), timer: $('#timer'),
    statusSmall: $('#statusSmall'), statusBig: $('#statusBig'), statusNote: $('#statusNote'), upPool: $('#upPool'), downPool: $('#downPool'),
    upOdds: $('#upOdds'), downOdds: $('#downOdds'), enter: $('#enter'), receipt: $('#receipt'), floaters: $('#floaters'), result: $('#result'),
    resultTitle: $('#resultTitle'), resultText: $('#resultText'), resultSmall: $('#resultSmall'), shareWin: $('#shareWin'), again: $('#again'),
    roundNo: $('#roundNo'), clockMeta: $('#clockMeta'), customStake: $('#customStake'), marketBadge: $('#marketBadge'), watching: $('#watching'),
    hours: $('#hours'), toast: $('#toast'), betLabel: $('#betLabel'), positionBox: $('#positionBox')
  };
  const H = {
    eyebrow: $('#launchEyebrow'), headline: $('#launchHeadline'), subline: $('#launchSubline'), meter: $('#launchMeter'), countdown: $('#launchCountdown'),
    count: $('#signupCount'), target: $('#signupTarget'), progress: $('#signupProgress'), remaining: $('#signupRemaining')
  };
  const raceCards = $$('.racecard');

  const setText = (el, value) => { const v=String(value); if (el && el.textContent !== v) el.textContent=v; };
  const toast = msg => {
    if (!E.toast) return;
    E.toast.textContent = msg;
    E.toast.classList.add('show');
    setTimeout(() => E.toast.classList.remove('show'), 1800);
  };
  const fmtNum = n => Number(n || 0).toLocaleString('en-NG');
  const launchDateLabel = iso => {
    if (!iso) return null;
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return null;
    const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Africa/Lagos',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
    return parts.replace(',', '') + ' WAT';
  };
  const compactLaunchDate = iso => {
    if (!iso) return null;
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return null;
    return new Intl.DateTimeFormat('en-GB', {timeZone:'Africa/Lagos',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(d).replace(',', '').toUpperCase() + ' WAT';
  };

  function updateLaunchCountdown() {
    const launchAt = launchStatus?.launch_at ? Date.parse(launchStatus.launch_at) : NaN;
    if (!Number.isFinite(launchAt)) return;
    const remaining = Math.max(0, launchAt - Date.now());
    const seconds = Math.floor(remaining / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const put = (id, value) => { const el=$('#'+id); if(el) setText(el,String(value).padStart(2,'0')); };
    put('cdDays',days); put('cdHours',hours); put('cdMinutes',minutes); put('cdSeconds',secs);
    if (remaining <= 0) setTimeout(() => location.reload(), 250);
  }

  function renderLaunchStatus() {
    const count = Number(launchStatus?.signup_count);
    const target = Math.max(1, Number(launchStatus?.signup_target || 500));
    const days = Math.max(1, Number(launchStatus?.countdown_days || 7));
    const launchAt = launchStatus?.launch_at || null;

    if (!Number.isFinite(count)) {
      setText(H.eyebrow,'THE FIRST FLOW · BUILD THE CROWD');
      setText(H.headline,'BUILDING THE FIRST FLOW');
      setText(H.subline,'Create an account now. The public launch counter will appear as soon as the connection is available.');
      if (H.meter) H.meter.hidden=false;
      if (H.countdown) H.countdown.hidden=true;
      setText(H.count,'—'); setText(H.target,target); setText(H.remaining,'Confirmed accounts unlock launch week');
      if (H.progress) H.progress.style.width='0%';
      return;
    }

    setText(H.count,fmtNum(count));
    setText(H.target,fmtNum(target));
    const pct=Math.max(0,Math.min(100,count/target*100));
    if (H.progress) H.progress.style.width=pct.toFixed(2)+'%';

    if (!launchAt) {
      const remaining=Math.max(0,target-count);
      setText(H.eyebrow,'THE FIRST FLOW · BUILD THE CROWD');
      setText(H.headline,`${fmtNum(count)} PLAYER${count===1?'':'S'} READY`);
      setText(H.subline,`At ${fmtNum(target)} confirmed players, Round 001 is scheduled exactly ${days} days later.`);
      setText(H.remaining,remaining ? `${fmtNum(remaining)} TO UNLOCK LAUNCH WEEK` : 'TARGET REACHED · LOCKING LAUNCH WEEK');
      if (H.meter) H.meter.hidden=false;
      if (H.countdown) H.countdown.hidden=true;
      if (E.hours) E.hours.innerHTML=`<span class="dot"></span><span>PREVIEW 24/7 · ${fmtNum(remaining)} MORE CONFIRMED PLAYER${remaining===1?'':'S'} TO UNLOCK LAUNCH WEEK</span>`;
    } else {
      const label=launchDateLabel(launchAt) || 'Launch week locked';
      setText(H.eyebrow,'THE FIRST FLOW · LAUNCH WEEK LOCKED');
      setText(H.headline,'ROUND 001 IS COUNTING DOWN');
      setText(H.subline,`${label} · ${fmtNum(count)} confirmed players and growing.`);
      if (H.meter) H.meter.hidden=true;
      if (H.countdown) H.countdown.hidden=false;
      if (E.hours) E.hours.innerHTML=`<span class="dot"></span><span>ROUND 001 · ${compactLaunchDate(launchAt) || 'LAUNCH WEEK'} · PREVIEW RUNNING 24/7</span>`;
      updateLaunchCountdown();
    }
  }
  renderLaunchStatus();
  setInterval(updateLaunchCountdown,1000);

  $('.demo').textContent = 'PREVIEW MODE · SIMULATED MARKET';
  if (E.clockMeta) E.clockMeta.textContent = 'SIMULATED PREVIEW';
  if (E.receipt) E.receipt.textContent = 'Preview only. Real entries open when the First Flow launch countdown completes.';
  if (E.betLabel) E.betLabel.textContent = 'Example stake';
  if (E.positionBox) E.positionBox.classList.remove('show');
  const rules = document.querySelector('.side .legal');
  if (rules) rules.innerHTML = '<strong style="color:rgba(238,232,223,.52);font-weight:400">PREVIEW ONLY · simulated price, crowd and pool · no money can be entered</strong><br>Launch rules: player vs player · direction locks on first entry · 2% fee on profit only · one-sided pools refund before the race starts.';

  [...$$('.stake'), ...$$('.choice'), ...$$('.react'), ...raceCards].forEach(el => {
    el.disabled = true;
    el.setAttribute('aria-disabled','true');
  });
  if (E.customStake) E.customStake.disabled = true;
  if (E.enter) E.enter.disabled = true;
  if (E.shareWin) E.shareWin.style.display='none';
  if (E.again) E.again.style.display='none';

  const launchJoin = $('#launchJoin');
  if (launchJoin) launchJoin.onclick = () => $('#accountOverlay')?.classList.add('show');

  // ---------------------------------------------------------------------------
  // Efficient deterministic preview. 8–12 FPS instead of a full 60 FPS DOM/canvas loop.
  // ---------------------------------------------------------------------------
  const PRE_ENTRY_SECONDS=12, CLOSED_SECONDS=6, RACE_SECONDS=60, RESULT_SECONDS=8;
  const scenarios=[
    {driftPips:5.8,bias:.53},{driftPips:-4.4,bias:.47},{driftPips:1.1,bias:.51},{driftPips:-7.2,bias:.46},
    {driftPips:3.4,bias:.55},{driftPips:-.8,bias:.49},{driftPips:6.6,bias:.52},{driftPips:-2.7,bias:.48}
  ];
  const FRAME_MS=lowPower?125:80;
  const UI_MS=lowPower?350:220;
  const MAX_POINTS=lowPower?240:360;
  const DPR_CAP=lowPower?1:1.5;

  let round=1,scenario=scenarios[0],phase='entry',phaseStarted=performance.now(),phaseDuration=PRE_ENTRY_SECONDS;
  let current=1.17120,startPrice=null,points=[],higherPool=155000,lowerPool=148000,targetHigher=665000,targetLower=610000,fakeEntries=84;
  let random=mulberry32(0x3f10+round*7919),lastTickAt=performance.now(),lastFrameAt=0,lastUiAt=0,lastPoolAt=0,lastReactionAt=0,resultWinner='higher',resultEndsAt=0;

  function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function randn(){const u=Math.max(random(),1e-9),v=Math.max(random(),1e-9);return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
  const poolFmt=n=>'₦'+(n>=1e6?(n/1e6).toFixed(2)+'m':Math.round(n/1000)+'k');
  const fmt=s=>{s=Math.max(0,Math.ceil(s));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
  const grossOdds=side=>{const total=higherPool+lowerPool,sidePool=side==='higher'?higherPool:lowerPool;return sidePool?total/sidePool:0;};
  const launchWhen=()=>launchStatus?.launch_at?(compactLaunchDate(launchStatus.launch_at)||'LAUNCH WEEK'):'AFTER THE SIGNUP TARGET';

  function resetRound(){
    round+=1;scenario=scenarios[(round-1)%scenarios.length];random=mulberry32(0x3f10+round*7919);phase='entry';phaseStarted=performance.now();phaseDuration=PRE_ENTRY_SECONDS;
    current=1.1680+random()*.0100;startPrice=null;points=[];
    const totalTarget=1050000+Math.round(random()*700000),sideShare=.45+random()*.10;
    targetHigher=Math.round(totalTarget*sideShare/1000)*1000;targetLower=Math.round((totalTarget-targetHigher)/1000)*1000;
    higherPool=110000+Math.round(random()*90000/1000)*1000;lowerPool=110000+Math.round(random()*90000/1000)*1000;fakeEntries=55+Math.floor(random()*45);
    resultWinner='higher';resultEndsAt=0;if(E.result)E.result.classList.remove('show');setText(E.roundNo,'PREVIEW #'+String(round).padStart(3,'0'));syncPools();renderState();
  }
  function transition(next,seconds){phase=next;phaseStarted=performance.now();phaseDuration=seconds;if(next==='race'){startPrice=current;points=[{time:performance.now(),bid:current}];}renderState();}
  function settlePreview(){
    phase='result';phaseStarted=performance.now();phaseDuration=RESULT_SECONDS;resultWinner=current>=startPrice?'higher':'lower';
    setText(E.resultSmall,'SIMULATED PREVIEW RESULT');setText(E.resultTitle,resultWinner==='higher'?'HIGHER WINS':'LOWER WINS');
    setText(E.resultText,`Start ${startPrice.toFixed(5)} · Finish ${current.toFixed(5)} · real Round 001 opens ${launchWhen()}`);
    if(E.result)E.result.classList.add('show');
    if(!lowPower) for(let i=0;i<5;i++) setTimeout(()=>spawn(resultWinner==='higher'?'🔥':'👀'),i*130);
    resultEndsAt=performance.now()+RESULT_SECONDS*1000;renderState();
  }
  function simulatePool(now){
    if(phase!=='entry'||now-lastPoolAt<(lowPower?420:300))return;lastPoolAt=now;
    const progress=Math.min(1,(now-phaseStarted)/(PRE_ENTRY_SECONDS*1000)),intensity=progress<.25?.8:progress<.75?1.15:.65;
    for(let i=0;i<Math.ceil(4*intensity);i++){
      const stakes=[1000,2000,2500,3000,5000,5000,7500,10000],stake=stakes[Math.floor(random()*stakes.length)],chooseHigher=random()<scenario.bias;
      if(chooseHigher&&higherPool<targetHigher)higherPool=Math.min(targetHigher,higherPool+stake);else if(lowerPool<targetLower)lowerPool=Math.min(targetLower,lowerPool+stake);fakeEntries++;
    }
    const pull=.07;higherPool+=Math.max(0,(targetHigher-higherPool)*pull);lowerPool+=Math.max(0,(targetLower-lowerPool)*pull);
  }
  function simulateMarket(dt,now){
    const noiseScale=phase==='race'?.000018:.000014;let drift=0;if(phase==='race')drift=(scenario.driftPips*.0001/RACE_SECONDS)*dt;
    current+=drift+(random()-.5)*.000006*dt+randn()*noiseScale*Math.sqrt(Math.max(dt,.001));
    points.push({time:now,bid:current});if(points.length>MAX_POINTS)points.shift();
  }
  function syncPools(){
    setText(E.upPool,poolFmt(higherPool));setText(E.downPool,poolFmt(lowerPool));
    setText(E.upOdds,grossOdds('higher').toFixed(2)+(phase==='entry'?'× demo':'× locked'));setText(E.downOdds,grossOdds('lower').toFixed(2)+(phase==='entry'?'× demo':'× locked'));
    setText(E.watching,`SIMULATED CROWD · ${fakeEntries.toLocaleString()} entries`);
    const c0=raceCards[0];if(c0){c0.classList.add('on');setText(c0.querySelector('.rc-state'),'SIMULATED');setText(c0.querySelector('.rc-pool'),poolFmt(higherPool+lowerPool)+' demo pool');setText(c0.querySelector('.rc-players'),fakeEntries.toLocaleString()+' example entries');setText(c0.querySelector('.rc-time'),phase==='race'?fmt(phaseDuration-(performance.now()-phaseStarted)/1000):'PREVIEW');}
    [1,2].forEach(idx=>{const card=raceCards[idx];if(!card)return;card.classList.remove('on');setText(card.querySelector('.rc-state'),'LAUNCH WEEK');setText(card.querySelector('.rc-time'),'COMING');setText(card.querySelector('.rc-pool'),'Real crowd on launch');setText(card.querySelector('.rc-players'),idx===1?'5 minute races':'15 minute races');});
  }
  function renderState(){
    const elapsed=(performance.now()-phaseStarted)/1000,left=Math.max(0,phaseDuration-elapsed);setText(E.timer,fmt(left));setText(E.statusBig,fmt(left));setText(E.price,current.toFixed(5));
    if(phase==='entry'){setText(E.phase,'SIMULATED ENTRY');setText(E.statusSmall,'Example pool closes in');setText(E.statusNote,'Watch the example crowd build the pool. No entries are real.');setText(E.marketBadge,'PREVIEW · SIMULATED PRICE');setText(E.delta,'SIMULATED EUR/USD · START NOT LOCKED');E.delta.className='delta';}
    else if(phase==='closed'){setText(E.phase,'EXAMPLE POOL CLOSED');setText(E.statusSmall,'Example price locks in');setText(E.statusNote,'The example pool is frozen. The simulated price keeps moving.');setText(E.marketBadge,'PREVIEW · POOL LOCKED');setText(E.delta,'SIMULATED PRICE · APPROACHING START');E.delta.className='delta';}
    else if(phase==='race'){setText(E.phase,'SIMULATED RACE');setText(E.statusSmall,'Preview race ends in');setText(E.statusNote,'The simulated starting price is locked. Higher or Lower wins at the finish.');setText(E.marketBadge,'PREVIEW · START LOCKED');const pips=(current-startPrice)*10000;setText(E.delta,`${pips>=0?'▲':'▼'} ${Math.abs(pips).toFixed(1)} PIPS FROM START`);E.delta.className='delta '+(pips>=0?'up':'down');}
    else{setText(E.phase,'PREVIEW COMPLETE');setText(E.statusSmall,'Next simulated race');setText(E.statusNote,'Real entries open when the First Flow countdown completes.');setText(E.marketBadge,'PREVIEW · SIMULATED RESULT');setText(E.statusBig,fmt(Math.max(0,(resultEndsAt-performance.now())/1000)));}
    setText(E.enter,launchStatus?.launch_at?`REAL ENTRIES OPEN · ${launchWhen()}`:'REAL ENTRIES OPEN AFTER LAUNCH COUNTDOWN');syncPools();
  }
  function spawn(emoji){if(!E.floaters||lowPower)return;const d=document.createElement('div');d.className='floater';d.textContent=emoji;d.style.left=(8+random()*84)+'%';d.style.animationDuration=(1.2+random()*.6)+'s';E.floaters.appendChild(d);setTimeout(()=>d.remove(),2100);}
  function maybeReaction(now){if(lowPower||now-lastReactionAt<1200+random()*1300)return;lastReactionAt=now;if(random()<.72)spawn(['🔥','👀','😂','😭','🚀','💀'][Math.floor(random()*6)]);}
  function draw(){
    if(!E.chart)return;const c=E.chart,ctx=c.getContext('2d',{alpha:true}),rect=c.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(devicePixelRatio||1,DPR_CAP),pw=Math.max(1,Math.floor(rect.width*dpr)),ph=Math.max(1,Math.floor(rect.height*dpr));if(c.width!==pw||c.height!==ph){c.width=pw;c.height=ph;}
    ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.scale(dpr,dpr);const W=rect.width,H=rect.height,visible=points;if(!visible.length){ctx.restore();return;}
    const anchor=phase==='race'&&startPrice!=null?startPrice:visible[0].bid;let min=anchor,max=anchor;for(const p of visible){if(p.bid<min)min=p.bid;if(p.bid>max)max=p.bid;}const span=Math.max(max-min,.00018);min-=span*.45;max+=span*.45;
    const y=v=>H-((v-min)/(max-min))*H*.72-H*.14,t0=visible[0].time,t1=Math.max(visible[visible.length-1].time,t0+1),x=t=>12+((t-t0)/(t1-t0))*(W-24);
    if(phase==='race'&&startPrice!=null){ctx.strokeStyle='rgba(238,232,223,.22)';ctx.lineWidth=1;ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(0,y(startPrice));ctx.lineTo(W,y(startPrice));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(238,232,223,.35)';ctx.font='9px Montserrat';ctx.fillText('START',14,y(startPrice)-8);}
    ctx.strokeStyle='rgba(238,232,223,.82)';ctx.lineWidth=1.5;ctx.beginPath();visible.forEach((p,i)=>i?ctx.lineTo(x(p.time),y(p.bid)):ctx.moveTo(x(p.time),y(p.bid)));ctx.stroke();const p=visible[visible.length-1];ctx.fillStyle='#eee8df';ctx.beginPath();ctx.arc(x(p.time),y(p.bid),2.5,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function animationFrame(now){
    requestAnimationFrame(animationFrame);if(document.hidden||now-lastFrameAt<FRAME_MS)return;
    const dt=Math.min(.25,Math.max(.001,(now-lastTickAt)/1000));lastTickAt=now;lastFrameAt=now;if(phase!=='result')simulateMarket(dt,now);simulatePool(now);maybeReaction(now);draw();
    if(now-lastUiAt>=UI_MS){lastUiAt=now;renderState();}
    const elapsed=(now-phaseStarted)/1000;if(elapsed>=phaseDuration){if(phase==='entry')transition('closed',CLOSED_SECONDS);else if(phase==='closed')transition('race',RACE_SECONDS);else if(phase==='race')settlePreview();else resetRound();}
  }
  points.push({time:performance.now(),bid:current});syncPools();renderState();draw();
  window.addEventListener('resize',()=>requestAnimationFrame(draw),{passive:true});
  document.addEventListener('visibilitychange',()=>{lastTickAt=performance.now();lastFrameAt=0;});
  requestAnimationFrame(animationFrame);

  // ---------------------------------------------------------------------------
  // Real Supabase account + referral layer remains active during preview.
  // ---------------------------------------------------------------------------
  if (!window.supabase || cfg.mode !== 'live' || !cfg.supabaseUrl || !cfg.supabasePublishableKey) {
    console.warn('TH3FLOW preview: Supabase unavailable; visual preview will continue without account tools.');
    return;
  }

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
  });
  async function refreshLaunchStatus() {
    if (document.hidden) return;
    try {
      const {data,error}=await sb.rpc('get_launch_hype_status');
      if (error) { console.warn('TH3FLOW launch counter refresh failed:',error.message); return; }
      if (data) { launchStatus=data; window.__TH3FLOW_LAUNCH_STATUS=data; renderLaunchStatus(); }
    } catch (error) {
      console.warn('TH3FLOW launch counter refresh failed:',error);
    }
  }
  void refreshLaunchStatus();
  setInterval(refreshLaunchStatus, 60000);
  const state = { session:null, profile:null, account:null, referralCode:null };
  let authMode='signin', passwordRecovery=false;
  const q = new URLSearchParams(location.search);
  const refParam=(q.get('ref')||'').trim().toUpperCase();
  const randomId=()=>globalThis.crypto?.randomUUID?.()||('v-'+Date.now()+'-'+Math.random().toString(36).slice(2));
  let referralVisitToken=null;

  function moneyMinor(minor) {
    const n=Number(minor||0)/100;
    return `₦${n.toLocaleString('en-NG',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2})}`;
  }
  function signedMinor(minor) {
    const n=Math.abs(Number(minor||0)/100);
    return `${Number(minor)>=0?'+':'−'}₦${n.toLocaleString('en-NG',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2})}`;
  }
  function durationLabel(s){return s===60?'1 MIN':s===300?'5 MIN':s===900?'15 MIN':`${Math.round(Number(s||60)/60)} MIN`;}

  if (refParam) {
    try {
      const visitKey='th3flow_ref_visit_'+refParam;
      referralVisitToken=localStorage.getItem(visitKey);
      if (!referralVisitToken) { referralVisitToken=randomId(); localStorage.setItem(visitKey,referralVisitToken); }
      localStorage.setItem(REF_STORE,JSON.stringify({code:refParam,captured_at:Date.now(),visit_token:referralVisitToken}));
    } catch {}
  }
  if (q.get('affiliate')==='1') { try{localStorage.setItem(AFFILIATE_INTENT,'1')}catch{} }

  async function recordReferralVisit() {
    let pending=null;
    try { pending=JSON.parse(localStorage.getItem(REF_STORE)||'null'); } catch {}
    const code=refParam || pending?.code;
    const token=referralVisitToken || pending?.visit_token;
    if (!code || !token) return;
    const {error}=await sb.rpc('record_referral_visit',{
      p_code:String(code).toUpperCase(), p_visit_token:token, p_landing_path:location.pathname,
      p_utm_source:q.get('utm_source'), p_utm_medium:q.get('utm_medium'), p_utm_campaign:q.get('utm_campaign')
    });
    if (error) console.warn('TH3FLOW referral visit tracking failed:',error.message);
  }
  void recordReferralVisit();

  async function claimPendingReferral() {
    if (!state.session) return;
    let pending=null;
    try { pending=JSON.parse(localStorage.getItem(REF_STORE)||'null'); } catch {}
    if (!pending?.code) return;
    if (!pending.captured_at || Date.now()-Number(pending.captured_at)>8*24*60*60*1000) {
      try{localStorage.removeItem(REF_STORE)}catch{}
      return;
    }
    const call=pending.visit_token?'claim_referral_with_visit':'claim_referral';
    const args=pending.visit_token?{p_code:String(pending.code).toUpperCase(),p_visit_token:pending.visit_token}:{p_code:String(pending.code).toUpperCase()};
    const {data,error}=await sb.rpc(call,args);
    if (!error) {
      try{localStorage.removeItem(REF_STORE)}catch{}
      if (data?.status==='attributed') toast('Referral connected');
      return;
    }
    if (/already|yourself|first race|expired|not found/i.test(String(error.message||''))) {
      try{localStorage.removeItem(REF_STORE)}catch{}
    }
  }

  async function loadReferralIdentity() {
    if (!state.session) { state.referralCode=null; return; }
    const {data,error}=await sb.rpc('get_my_referral_dashboard');
    if (!error) state.referralCode=data?.code||null;
  }

  async function loadSession() {
    const {data:{session}}=await sb.auth.getSession();
    state.session=session;
    if (session) {
      await claimPendingReferral();
      const [p,a]=await Promise.all([
        sb.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle(),
        sb.from('ledger_accounts').select('id,balance_minor,currency').eq('kind','player').eq('currency','NGN').maybeSingle()
      ]);
      state.profile=p.data||null; state.account=a.data||null;
      await loadReferralIdentity();
      if (E.balance) E.balance.textContent = state.account ? moneyMinor(state.account.balance_minor) : 'READY';
      const balanceWrap=E.balance?.parentElement;
      if(balanceWrap && balanceWrap.firstChild) balanceWrap.firstChild.textContent='Account ';
      if (launchJoin) launchJoin.textContent='ACCOUNT READY · SEE LAUNCH';
      try {
        if (localStorage.getItem(AFFILIATE_INTENT)==='1') {
          localStorage.removeItem(AFFILIATE_INTENT);
          setTimeout(()=>{location.href='../cabinet/?view=referrals'},250);
        }
      } catch {}
    } else {
      state.profile=null; state.account=null; state.referralCode=null;
      if (E.balance) E.balance.textContent='JOIN';
      if (launchJoin) launchJoin.textContent='JOIN THE LAUNCH';
    }
    renderAccount();
    void refreshLaunchStatus();
  }

  async function renderStats() {
    const box=$('#history');
    if (!state.session) {
      $('#sRounds').textContent='0'; $('#sWinRate').textContent='—'; $('#sNet').textContent='₦0'; $('#sStreak').textContent='0';
      box.innerHTML='<div class="empty">Create an account now. Your real Flow begins with Round 001 when the launch countdown completes.</div>';
      return;
    }
    const [{data:stats},{data:rows}]=await Promise.all([
      sb.from('player_stats').select('*').eq('user_id',state.session.user.id).maybeSingle(),
      sb.from('race_entries').select('*,races(symbol,duration_seconds,start_at,result,void_reason)').eq('user_id',state.session.user.id).order('created_at',{ascending:false}).limit(20)
    ]);
    $('#sRounds').textContent=stats?.rounds||0;
    $('#sWinRate').textContent=stats?.rounds?Math.round(stats.wins/stats.rounds*100)+'%':'—';
    $('#sNet').textContent=signedMinor(stats?.net_pnl_minor||0);
    $('#sStreak').textContent=stats?.best_streak||0;
    box.innerHTML=!rows?.length?'<div class="empty">Your real race history will start here on launch day.</div>':'<div class="hrow head"><span>Race</span><span>Side</span><span>Result</span><span>P/L</span></div>'+rows.map(h=>`<div class="hrow"><span>${h.races?.symbol||'—'} · ${durationLabel(h.races?.duration_seconds||60)}</span><span>${h.side==='higher'?'▲ HIGH':'▼ LOW'}</span><span>${h.races?.result==='void'?'VOID':h.settled?(h.net_pnl_minor>0?'WIN':h.net_pnl_minor<0?'LOSS':'TIE'):'OPEN'}</span><span class="${Number(h.net_pnl_minor||0)>=0?'pos':'neg'}">${h.settled?signedMinor(h.net_pnl_minor):'—'}</span></div>`).join('');
  }

  function renderBoard() {
    $('#leaderList').innerHTML='<div class="empty">The public leaderboard opens with Round 001.</div>';
    $('#leaderToggle').classList.toggle('on',!!state.profile?.leaderboard_opt_in);
  }

  function setAuthStatus(message,isError=false) {
    const el=$('#authStatus'); if(!el)return;
    el.textContent=message; el.style.color=isError?'rgba(239,192,188,.92)':'rgba(238,232,223,.48)';
  }
  function setAuthMode(mode) {
    authMode=mode==='signup'?'signup':'signin';
    $$('#authModeTabs .tab').forEach(b=>b.classList.toggle('on',b.dataset.authMode===authMode));
    const confirm=$('#confirmPasswordField'), forgot=$('#forgotPassword'), submit=$('#passwordAuthSubmit'), password=$('#loginPassword');
    if(confirm)confirm.style.display=authMode==='signup'?'grid':'none';
    if(forgot)forgot.style.visibility=authMode==='signin'?'visible':'hidden';
    if(submit)submit.textContent=authMode==='signup'?'Create account':'Sign in';
    if(password)password.autocomplete=authMode==='signup'?'new-password':'current-password';
    setAuthStatus(authMode==='signup'?'Create your TH3FLOW account now. Confirmed accounts move the public launch counter.':'Use your email and password to sign in.');
  }
  async function submitPasswordAuth() {
    const email=$('#loginEmail')?.value.trim()||'', password=$('#loginPassword')?.value||'', confirm=$('#confirmPassword')?.value||'', submit=$('#passwordAuthSubmit');
    if(!email)return setAuthStatus('Enter your email address.',true);
    if(password.length<8)return setAuthStatus('Password must be at least 8 characters.',true);
    if(authMode==='signup'&&password!==confirm)return setAuthStatus('Passwords do not match.',true);
    if(submit){submit.disabled=true;submit.textContent=authMode==='signup'?'Creating…':'Signing in…';}
    try {
      if(authMode==='signup') {
        const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/play/'}});
        if(error){setAuthStatus(error.message,true);return;}
        if(data?.session){setAuthStatus('Account created. You are in the First Flow.');await loadSession();$('#accountOverlay').classList.remove('show');toast('Account ready · welcome to the First Flow');}
        else setAuthStatus('Account created. Check your email to confirm it, then sign in.');
      } else {
        const {error}=await sb.auth.signInWithPassword({email,password});
        if(error){setAuthStatus(error.message,true);return;}
        await loadSession(); $('#accountOverlay').classList.remove('show'); toast('Signed in');
      }
    } catch(err) {
      console.error('TH3FLOW auth error',err); setAuthStatus('Could not complete authentication. Please try again.',true);
    } finally {
      if(submit){submit.disabled=false;submit.textContent=authMode==='signup'?'Create account':'Sign in';}
    }
  }
  async function sendPasswordReset() {
    const email=$('#loginEmail')?.value.trim()||'';
    if(!email)return setAuthStatus('Enter your email first, then choose Forgot password.',true);
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/play/'});
    setAuthStatus(error?error.message:'Password reset email sent. Open the link in that email.',!!error);
  }
  async function saveRecoveredPassword() {
    const p1=$('#recoveryPassword')?.value||'', p2=$('#recoveryPasswordConfirm')?.value||'';
    if(p1.length<8)return toast('Password must be at least 8 characters');
    if(p1!==p2)return toast('Passwords do not match');
    const {error}=await sb.auth.updateUser({password:p1}); if(error)return toast(error.message);
    passwordRecovery=false; $('#recoveryPassword').value=''; $('#recoveryPasswordConfirm').value=''; await loadSession(); renderAccount(); toast('Password updated');
  }
  function renderAccount() {
    const logged=!!state.session, loggedOut=$('#authLoggedOut'), recovery=$('#authRecovery'), loggedIn=$('#authLoggedIn');
    if(loggedOut)loggedOut.style.display=!logged&&!passwordRecovery?'block':'none';
    if(recovery)recovery.style.display=passwordRecovery?'block':'none';
    if(loggedIn)loggedIn.style.display=logged&&!passwordRecovery?'block':'none';
    if(passwordRecovery){$('#accountIdentity').textContent='Password recovery';return;}
    if(!logged){$('#accountIdentity').textContent='Not signed in · create an account to move the launch counter';setAuthMode(authMode);return;}
    $('#accountIdentity').textContent=state.session.user.email||'Signed in';
    $('#profileName').value=state.profile?.display_name||''; $('#profileCity').value=state.profile?.public_city||'';
    $('#accountKyc').textContent='ready';
    const verificationLabel=$('#accountKyc')?.nextElementSibling; if(verificationLabel) verificationLabel.textContent='Launch access';
    $('#accountBalance').textContent=state.account?moneyMinor(state.account.balance_minor):'₦—';
    $('#profileLeader').classList.toggle('on',!!state.profile?.leaderboard_opt_in);
  }
  async function saveProfile() {
    if(!state.session)return;
    const updates={display_name:$('#profileName').value.trim()||null,public_city:$('#profileCity').value.trim()||null,leaderboard_opt_in:$('#profileLeader').classList.contains('on')};
    const {data,error}=await sb.from('profiles').update(updates).eq('user_id',state.session.user.id).select().single();
    if(error)return toast(error.message); state.profile=data; toast('Profile saved');
  }
  async function coolOff(hours) {
    const {data:{session}}=await sb.auth.getSession(); if(!session)return;
    const res=await fetch(`${cfg.supabaseUrl}/functions/v1/responsible-play`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,'apikey':cfg.supabasePublishableKey},body:JSON.stringify({action:'cool_off',hours})});
    const body=await res.json(); if(!res.ok)return toast(body.message||'Could not set cool-off'); toast(`Cool-off active until ${new Date(body.cool_off_until).toLocaleString()}`);
  }

  // Navigation / account bindings.
  $('#accountBtn').onclick=()=>{$('#accountOverlay').classList.add('show');renderAccount();};
  $('#leaderBtn').onclick=()=>{$('#leaderOverlay').classList.add('show');renderBoard();};
  $('#flowBtn').onclick=()=>{$('#flowOverlay').classList.add('show');renderStats();};
  $$('.close').forEach(b=>b.onclick=()=>$('#'+b.dataset.close)?.classList.remove('show'));
  $$('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show')}));
  $$('#periodTabs .tab').forEach(b=>b.onclick=()=>toast('Leaderboard opens with Round 001'));
  $$('#cityTabs .tab').forEach(b=>b.onclick=()=>toast('Leaderboard opens with Round 001'));
  $('#leaderToggle').onclick=async()=>{
    if(!state.session){$('#accountOverlay').classList.add('show');return;}
    const next=!state.profile?.leaderboard_opt_in;
    const {data,error}=await sb.from('profiles').update({leaderboard_opt_in:next}).eq('user_id',state.session.user.id).select().single();
    if(error)return toast(error.message); state.profile=data; renderBoard();
  };
  $$('#authModeTabs .tab').forEach(b=>b.onclick=()=>setAuthMode(b.dataset.authMode));
  $('#passwordAuthSubmit').onclick=submitPasswordAuth;
  $('#passwordAuthForm').addEventListener('submit',e=>{e.preventDefault();submitPasswordAuth();});
  $('#forgotPassword').onclick=sendPasswordReset;
  $('#saveNewPassword').onclick=saveRecoveredPassword;
  $('#cancelRecovery').onclick=()=>{passwordRecovery=false;renderAccount();};
  $('#signOut').onclick=async()=>{await sb.auth.signOut();await loadSession();toast('Signed out');};
  $('#saveProfile').onclick=saveProfile;
  $('#profileLeader').onclick=()=>$('#profileLeader').classList.toggle('on');
  $('#coolOff24').onclick=()=>coolOff(24);
  $('#depositStub').onclick=()=>toast('Deposits open when Round 001 goes live');
  $('#withdrawStub').onclick=()=>toast('Withdrawals open with real-money play');

  sb.auth.onAuthStateChange((event,session)=>{
    state.session=session;
    if(event==='PASSWORD_RECOVERY'){
      passwordRecovery=true; $('#accountOverlay').classList.add('show'); renderAccount();
    }
    setTimeout(loadSession,0);
  });

  loadSession();
})();
