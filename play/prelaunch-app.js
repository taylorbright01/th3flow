(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const cfg = window.TH3FLOW_CONFIG || {};
  const LAUNCH_AT = Date.parse('2026-09-21T14:00:00Z'); // 15:00 WAT (UTC+1)
  const REF_STORE = 'th3flow_pending_referral';
  const AFFILIATE_INTENT = 'th3flow_affiliate_intent';

  if (Date.now() >= LAUNCH_AT) {
    location.reload();
    return;
  }

  const E = {
    balance: $('#balance'), price: $('#price'), delta: $('#delta'), chart: $('#chart'), phase: $('#phase'), timer: $('#timer'),
    statusSmall: $('#statusSmall'), statusBig: $('#statusBig'), statusNote: $('#statusNote'), upPool: $('#upPool'), downPool: $('#downPool'),
    upOdds: $('#upOdds'), downOdds: $('#downOdds'), enter: $('#enter'), receipt: $('#receipt'), floaters: $('#floaters'), result: $('#result'),
    resultTitle: $('#resultTitle'), resultText: $('#resultText'), resultSmall: $('#resultSmall'), shareWin: $('#shareWin'), again: $('#again'),
    roundNo: $('#roundNo'), clockMeta: $('#clockMeta'), customStake: $('#customStake'), marketBadge: $('#marketBadge'), watching: $('#watching'),
    hours: $('#hours'), toast: $('#toast'), betLabel: $('#betLabel'), positionBox: $('#positionBox')
  };

  const toast = msg => {
    if (!E.toast) return;
    E.toast.textContent = msg;
    E.toast.classList.add('show');
    setTimeout(() => E.toast.classList.remove('show'), 1800);
  };

  // ---------------------------------------------------------------------------
  // Launch countdown / prelaunch shell
  // ---------------------------------------------------------------------------
  function updateLaunchCountdown() {
    const remaining = Math.max(0, LAUNCH_AT - Date.now());
    const seconds = Math.floor(remaining / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const put = (id, value) => { const el = $('#'+id); if (el) el.textContent = String(value).padStart(2, '0'); };
    put('cdDays', days); put('cdHours', hours); put('cdMinutes', minutes); put('cdSeconds', secs);
    if (remaining <= 0) setTimeout(() => location.reload(), 250);
  }
  updateLaunchCountdown();
  setInterval(updateLaunchCountdown, 1000);

  $('.demo').textContent = 'PREVIEW MODE · SIMULATED MARKET';
  if (E.clockMeta) E.clockMeta.textContent = 'SIMULATED PREVIEW';
  if (E.hours) E.hours.innerHTML = '<span class="dot"></span><span>ROUND 001 · 21 SEPTEMBER · 15:00 WAT · PREVIEW RUNNING 24/7</span>';
  if (E.receipt) E.receipt.textContent = 'Preview only. Real entries open with Round 001 on 21 September at 15:00 WAT.';
  if (E.betLabel) E.betLabel.textContent = 'Example stake';
  if (E.positionBox) E.positionBox.classList.remove('show');
  const rules = document.querySelector('.side .legal');
  if (rules) rules.innerHTML = '<strong style="color:rgba(238,232,223,.52);font-weight:400">PREVIEW ONLY · simulated price, crowd and pool · no money can be entered</strong><br>Launch rules: player vs player · direction locks on first entry · 2% fee on profit only · one-sided pools refund before the race starts.';

  // Make the fake race observational only. It should feel like a video, not a fake playable game.
  [...$$('.stake'), ...$$('.choice'), ...$$('.react'), ...$$('.racecard')].forEach(el => {
    el.disabled = true;
    el.setAttribute('aria-disabled', 'true');
  });
  if (E.customStake) E.customStake.disabled = true;
  if (E.enter) {
    E.enter.disabled = true;
    E.enter.textContent = 'REAL ENTRIES OPEN 21 SEP · 15:00 WAT';
  }
  if (E.shareWin) E.shareWin.style.display = 'none';
  if (E.again) E.again.style.display = 'none';

  const launchJoin = $('#launchJoin');
  if (launchJoin) launchJoin.onclick = () => $('#accountOverlay')?.classList.add('show');

  // ---------------------------------------------------------------------------
  // Deterministic simulated market + crowd. No API, no Supabase feed, no writes.
  // ---------------------------------------------------------------------------
  const PRE_ENTRY_SECONDS = 12;
  const CLOSED_SECONDS = 6;
  const RACE_SECONDS = 60;
  const RESULT_SECONDS = 8;
  const scenarios = [
    { driftPips: 5.8, bias: .53 },
    { driftPips: -4.4, bias: .47 },
    { driftPips: 1.1, bias: .51 },
    { driftPips: -7.2, bias: .46 },
    { driftPips: 3.4, bias: .55 },
    { driftPips: -.8, bias: .49 },
    { driftPips: 6.6, bias: .52 },
    { driftPips: -2.7, bias: .48 }
  ];

  let round = 1;
  let scenario = scenarios[0];
  let phase = 'entry';
  let phaseStarted = performance.now();
  let phaseDuration = PRE_ENTRY_SECONDS;
  let current = 1.17120;
  let startPrice = null;
  let points = [];
  let higherPool = 155000;
  let lowerPool = 148000;
  let targetHigher = 665000;
  let targetLower = 610000;
  let fakeEntries = 84;
  let random = mulberry32(0x3f10 + round * 7919);
  let lastTickAt = performance.now();
  let lastPoolAt = 0;
  let lastReactionAt = 0;
  let resultWinner = 'higher';
  let resultEndsAt = 0;

  function mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function randn() {
    const u = Math.max(random(), 1e-9), v = Math.max(random(), 1e-9);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const poolFmt = n => '₦' + (n >= 1e6 ? (n/1e6).toFixed(2)+'m' : Math.round(n/1000)+'k');
  const fmt = s => {
    s = Math.max(0, Math.ceil(s));
    return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  };
  function grossOdds(side) {
    const total = higherPool + lowerPool;
    const sidePool = side === 'higher' ? higherPool : lowerPool;
    return sidePool ? total / sidePool : 0;
  }

  function resetRound() {
    round += 1;
    scenario = scenarios[(round - 1) % scenarios.length];
    random = mulberry32(0x3f10 + round * 7919);
    phase = 'entry';
    phaseStarted = performance.now();
    phaseDuration = PRE_ENTRY_SECONDS;
    current = 1.1680 + random() * .0100;
    startPrice = null;
    points = [];
    const totalTarget = 1050000 + Math.round(random() * 700000);
    const sideShare = .45 + random() * .10;
    targetHigher = Math.round(totalTarget * sideShare / 1000) * 1000;
    targetLower = Math.round((totalTarget - targetHigher) / 1000) * 1000;
    higherPool = 110000 + Math.round(random()*90000/1000)*1000;
    lowerPool = 110000 + Math.round(random()*90000/1000)*1000;
    fakeEntries = 55 + Math.floor(random()*45);
    resultWinner = 'higher';
    resultEndsAt = 0;
    if (E.result) E.result.classList.remove('show');
    if (E.roundNo) E.roundNo.textContent = 'PREVIEW #' + String(round).padStart(3,'0');
    syncPools();
    renderState();
  }

  function transition(next, seconds) {
    phase = next;
    phaseStarted = performance.now();
    phaseDuration = seconds;
    if (next === 'race') {
      startPrice = current;
      points = [{ time: performance.now(), bid: current }];
    }
    renderState();
  }

  function settlePreview() {
    phase = 'result';
    phaseStarted = performance.now();
    phaseDuration = RESULT_SECONDS;
    resultWinner = current >= startPrice ? 'higher' : 'lower';
    if (E.resultSmall) E.resultSmall.textContent = 'SIMULATED PREVIEW RESULT';
    if (E.resultTitle) E.resultTitle.textContent = resultWinner === 'higher' ? 'HIGHER WINS' : 'LOWER WINS';
    if (E.resultText) E.resultText.textContent = `Start ${startPrice.toFixed(5)} · Finish ${current.toFixed(5)} · real Round 001 begins 21 Sep · 15:00 WAT`;
    if (E.result) E.result.classList.add('show');
    for (let i=0;i<9;i++) setTimeout(() => spawn(resultWinner === 'higher' ? '🔥' : '👀'), i*95);
    resultEndsAt = performance.now() + RESULT_SECONDS*1000;
    renderState();
  }

  function simulatePool() {
    if (phase !== 'entry') return;
    const now = performance.now();
    if (now - lastPoolAt < 260) return;
    lastPoolAt = now;
    const progress = Math.min(1, (now - phaseStarted)/(PRE_ENTRY_SECONDS*1000));
    const intensity = progress < .25 ? .8 : progress < .75 ? 1.15 : .65;
    for (let i=0;i<Math.ceil(5*intensity);i++) {
      const stakeChoices = [1000,2000,2500,3000,5000,5000,7500,10000];
      const stake = stakeChoices[Math.floor(random()*stakeChoices.length)];
      const chooseHigher = random() < scenario.bias;
      if (chooseHigher && higherPool < targetHigher) higherPool = Math.min(targetHigher, higherPool + stake);
      else if (lowerPool < targetLower) lowerPool = Math.min(targetLower, lowerPool + stake);
      fakeEntries++;
    }
    // Pull toward the desired launch-scale example pool so every preview reads clearly.
    const pull = .055;
    higherPool += Math.max(0, (targetHigher-higherPool)*pull);
    lowerPool += Math.max(0, (targetLower-lowerPool)*pull);
    syncPools();
  }

  function simulateMarket(dt) {
    // Small noisy movement before the lock. During the race, add deterministic drift
    // so preview rounds include up, down and near-photo-finish examples.
    const noiseScale = phase === 'race' ? 0.000018 : 0.000014;
    let drift = 0;
    if (phase === 'race') drift = (scenario.driftPips * 0.0001 / RACE_SECONDS) * dt;
    const microMomentum = (random()-.5) * 0.000006 * dt;
    current += drift + microMomentum + randn() * noiseScale * Math.sqrt(Math.max(dt,.001));
    if (E.price) E.price.textContent = current.toFixed(5);
    points.push({ time: performance.now(), bid: current });
    if (points.length > 1000) points.shift();
  }

  function syncPools() {
    if (E.upPool) E.upPool.textContent = poolFmt(higherPool);
    if (E.downPool) E.downPool.textContent = poolFmt(lowerPool);
    if (E.upOdds) E.upOdds.textContent = grossOdds('higher').toFixed(2) + (phase==='entry' ? '× demo' : '× locked');
    if (E.downOdds) E.downOdds.textContent = grossOdds('lower').toFixed(2) + (phase==='entry' ? '× demo' : '× locked');
    if (E.watching) E.watching.textContent = `SIMULATED CROWD · ${fakeEntries.toLocaleString()} entries`;
    const cards = $$('.racecard');
    if (cards[0]) {
      cards[0].classList.add('on');
      cards[0].querySelector('.rc-state').textContent = 'SIMULATED';
      cards[0].querySelector('.rc-pool').textContent = poolFmt(higherPool+lowerPool) + ' demo pool';
      cards[0].querySelector('.rc-players').textContent = fakeEntries.toLocaleString() + ' example entries';
      cards[0].querySelector('.rc-time').textContent = phase === 'race' ? fmt(phaseDuration-(performance.now()-phaseStarted)/1000) : 'PREVIEW';
    }
    [1,2].forEach((idx) => {
      const card = cards[idx];
      if (!card) return;
      card.classList.remove('on');
      card.querySelector('.rc-state').textContent = 'LAUNCH DAY';
      card.querySelector('.rc-time').textContent = '21 SEP';
      card.querySelector('.rc-pool').textContent = 'Real crowd on launch';
      card.querySelector('.rc-players').textContent = idx===1 ? '5 minute races' : '15 minute races';
    });
  }

  function renderState() {
    const elapsed = (performance.now() - phaseStarted)/1000;
    const left = Math.max(0, phaseDuration - elapsed);
    if (E.timer) E.timer.textContent = fmt(left);
    if (E.statusBig) E.statusBig.textContent = fmt(left);

    if (phase === 'entry') {
      E.phase.textContent = 'SIMULATED ENTRY';
      E.statusSmall.textContent = 'Example pool closes in';
      E.statusNote.textContent = 'Watch the example crowd build the pool. No entries are real.';
      E.marketBadge.textContent = 'PREVIEW · SIMULATED PRICE';
      E.delta.textContent = 'SIMULATED EUR/USD · START NOT LOCKED';
      E.delta.className = 'delta';
    } else if (phase === 'closed') {
      E.phase.textContent = 'EXAMPLE POOL CLOSED';
      E.statusSmall.textContent = 'Example price locks in';
      E.statusNote.textContent = 'The example pool is frozen. The simulated price keeps moving.';
      E.marketBadge.textContent = 'PREVIEW · POOL LOCKED';
      E.delta.textContent = 'SIMULATED PRICE · APPROACHING START';
      E.delta.className = 'delta';
    } else if (phase === 'race') {
      E.phase.textContent = 'SIMULATED RACE';
      E.statusSmall.textContent = 'Preview race ends in';
      E.statusNote.textContent = 'The simulated starting price is locked. Higher or Lower wins at the finish.';
      E.marketBadge.textContent = 'PREVIEW · START LOCKED';
      const pips = (current - startPrice) * 10000;
      E.delta.textContent = `${pips>=0?'▲':'▼'} ${Math.abs(pips).toFixed(1)} PIPS FROM START`;
      E.delta.className = 'delta ' + (pips>=0?'up':'down');
    } else {
      E.phase.textContent = 'PREVIEW COMPLETE';
      E.statusSmall.textContent = 'Next simulated race';
      E.statusNote.textContent = 'Real entries open on 21 September at 15:00 WAT.';
      E.marketBadge.textContent = 'PREVIEW · SIMULATED RESULT';
      E.statusBig.textContent = fmt(Math.max(0,(resultEndsAt-performance.now())/1000));
    }
    if (E.enter) E.enter.textContent = 'REAL ENTRIES OPEN 21 SEP · 15:00 WAT';
    syncPools();
  }

  function spawn(emoji) {
    if (!E.floaters) return;
    const d = document.createElement('div');
    d.className = 'floater';
    d.textContent = emoji;
    d.style.left = (8 + random()*84) + '%';
    d.style.animationDuration = (1.2 + random()*.8) + 's';
    E.floaters.appendChild(d);
    setTimeout(() => d.remove(), 2200);
  }

  function maybeReaction() {
    const now = performance.now();
    if (now - lastReactionAt < 700 + random()*950) return;
    lastReactionAt = now;
    if (random() < .8) spawn(['🔥','👀','😂','😭','🚀','💀'][Math.floor(random()*6)]);
  }

  function draw() {
    if (!E.chart) return;
    const c = E.chart, ctx = c.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2), rect = c.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const pw=Math.floor(rect.width*dpr), ph=Math.floor(rect.height*dpr);
    if (c.width!==pw || c.height!==ph) { c.width=pw; c.height=ph; }
    ctx.clearRect(0,0,c.width,c.height);
    ctx.save(); ctx.scale(dpr,dpr);
    const W=rect.width, H=rect.height;
    const visible = points.slice(-500);
    if (!visible.length) { ctx.restore(); return; }
    const vals = visible.map(p=>p.bid);
    const anchor = phase==='race' && startPrice!=null ? startPrice : vals[0];
    let min=Math.min(anchor,...vals), max=Math.max(anchor,...vals), span=Math.max(max-min,.00018);
    min-=span*.45; max+=span*.45;
    const y = v => H - ((v-min)/(max-min))*H*.72 - H*.14;
    const t0=visible[0].time, t1=Math.max(visible[visible.length-1].time,t0+1);
    const x = t => 12 + ((t-t0)/(t1-t0))*(W-24);
    if (phase==='race' && startPrice!=null) {
      ctx.strokeStyle='rgba(238,232,223,.22)'; ctx.lineWidth=1; ctx.setLineDash([5,7]);
      ctx.beginPath(); ctx.moveTo(0,y(startPrice)); ctx.lineTo(W,y(startPrice)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='rgba(238,232,223,.35)'; ctx.font='9px Montserrat'; ctx.fillText('START',14,y(startPrice)-8);
    }
    ctx.strokeStyle='rgba(238,232,223,.82)'; ctx.lineWidth=1.6; ctx.beginPath();
    visible.forEach((p,i)=> i ? ctx.lineTo(x(p.time),y(p.bid)) : ctx.moveTo(x(p.time),y(p.bid)));
    ctx.stroke();
    const p=visible[visible.length-1]; ctx.fillStyle='#eee8df'; ctx.beginPath(); ctx.arc(x(p.time),y(p.bid),3,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function animationFrame(now) {
    const dt = Math.min(.1, Math.max(.001,(now-lastTickAt)/1000));
    lastTickAt = now;
    if (phase !== 'result') simulateMarket(dt);
    simulatePool();
    maybeReaction();
    renderState();
    draw();

    const elapsed = (now-phaseStarted)/1000;
    if (elapsed >= phaseDuration) {
      if (phase==='entry') transition('closed', CLOSED_SECONDS);
      else if (phase==='closed') transition('race', RACE_SECONDS);
      else if (phase==='race') settlePreview();
      else if (phase==='result') resetRound();
    }
    requestAnimationFrame(animationFrame);
  }

  points.push({time:performance.now(),bid:current});
  syncPools(); renderState(); draw();
  window.addEventListener('resize', draw);
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
  }

  async function renderStats() {
    const box=$('#history');
    if (!state.session) {
      $('#sRounds').textContent='0'; $('#sWinRate').textContent='—'; $('#sNet').textContent='₦0'; $('#sStreak').textContent='0';
      box.innerHTML='<div class="empty">Create an account now. Your real Flow begins with Round 001 on 21 September.</div>';
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
    $('#leaderList').innerHTML='<div class="empty">The public leaderboard opens with Round 001 · 21 September · 15:00 WAT.</div>';
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
    setAuthStatus(authMode==='signup'?'Create your TH3FLOW account now so you are ready for Round 001.':'Use your email and password to sign in.');
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
        if(data?.session){setAuthStatus('Account created. You are ready for launch.');await loadSession();$('#accountOverlay').classList.remove('show');toast('Account ready for launch');}
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
    if(!logged){$('#accountIdentity').textContent='Not signed in · create an account before launch';setAuthMode(authMode);return;}
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
  $$('#periodTabs .tab').forEach(b=>b.onclick=()=>toast('Leaderboard opens on launch day'));
  $$('#cityTabs .tab').forEach(b=>b.onclick=()=>toast('Leaderboard opens on launch day'));
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
  $('#depositStub').onclick=()=>toast('Deposits open for the launch event');
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
