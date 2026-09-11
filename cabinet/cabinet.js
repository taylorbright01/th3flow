(()=>{
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const cfg=window.TH3FLOW_CONFIG||{};
const live=cfg.mode==='live'&&cfg.supabaseUrl&&!cfg.supabaseUrl.includes('YOUR_PROJECT')&&cfg.supabasePublishableKey&&!cfg.supabasePublishableKey.includes('REPLACE_ME');
const sb=live&&window.supabase?window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const REF_STORE='th3flow_pending_referral';
const fallbackAchievements=[{"id":"first_flow","name":"First Flow","desc":"Complete your first valid race.","cat":"Origins","rarity":"common","glyph":"◉","scope":"lifetime","metric_key":"rounds","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"first_win","name":"Called It","desc":"Record your first winning call.","cat":"Origins","rarity":"common","glyph":"▲","scope":"lifetime","metric_key":"wins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"first_loss","name":"Scar Tissue","desc":"Finish your first race on the wrong side.","cat":"Origins","rarity":"common","glyph":"×","scope":"lifetime","metric_key":"losses","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"first_tie","name":"Dead Heat","desc":"Take part in a race whose start and finish Bid are identical.","cat":"Origins","rarity":"rare","glyph":"=","scope":"lifetime","metric_key":"ties","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"ten_rounds","name":"Into The Flow","desc":"Complete 10 valid races.","cat":"Origins","rarity":"common","glyph":"10","scope":"lifetime","metric_key":"rounds","threshold":10,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"fifty_rounds","name":"Known Current","desc":"Complete 50 valid races.","cat":"Endurance","rarity":"rare","glyph":"50","scope":"lifetime","metric_key":"rounds","threshold":50,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"hundred_rounds","name":"Century","desc":"Complete 100 valid races.","cat":"Endurance","rarity":"epic","glyph":"100","scope":"lifetime","metric_key":"rounds","threshold":100,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"250_rounds","name":"Deep Water","desc":"Complete 250 valid races.","cat":"Endurance","rarity":"epic","glyph":"250","scope":"lifetime","metric_key":"rounds","threshold":250,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"500_rounds","name":"The Long Current","desc":"Complete 500 valid races.","cat":"Endurance","rarity":"legendary","glyph":"500","scope":"lifetime","metric_key":"rounds","threshold":500,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"1000_rounds","name":"A Thousand Calls","desc":"Complete 1,000 valid races.","cat":"Endurance","rarity":"legendary","glyph":"1K","scope":"lifetime","metric_key":"rounds","threshold":1000,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"win3","name":"Three Clean","desc":"Win 3 races.","cat":"Accuracy","rarity":"common","glyph":"III","scope":"lifetime","metric_key":"wins","threshold":3,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"win10","name":"Ten Correct","desc":"Win 10 races.","cat":"Accuracy","rarity":"common","glyph":"X","scope":"lifetime","metric_key":"wins","threshold":10,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"win25","name":"Twenty Five","desc":"Win 25 races.","cat":"Accuracy","rarity":"rare","glyph":"XXV","scope":"lifetime","metric_key":"wins","threshold":25,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"win50","name":"Fifty Calls","desc":"Win 50 races.","cat":"Accuracy","rarity":"epic","glyph":"L","scope":"lifetime","metric_key":"wins","threshold":50,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"acc55","name":"Edge","desc":"Hold 55%+ accuracy across at least 20 races.","cat":"Accuracy","rarity":"rare","glyph":"55","scope":"lifetime","metric_key":"accuracy_bp","threshold":5500,"minimum_rounds":20,"direction":"gte","earned":false},{"id":"acc60","name":"Sharp","desc":"Hold 60%+ accuracy across at least 50 races.","cat":"Accuracy","rarity":"epic","glyph":"60","scope":"lifetime","metric_key":"accuracy_bp","threshold":6000,"minimum_rounds":50,"direction":"gte","earned":false},{"id":"acc65","name":"Unnatural","desc":"Hold 65%+ accuracy across at least 100 races.","cat":"Accuracy","rarity":"legendary","glyph":"65","scope":"lifetime","metric_key":"accuracy_bp","threshold":6500,"minimum_rounds":100,"direction":"gte","earned":false},{"id":"streak2","name":"Back To Back","desc":"Win 2 races consecutively.","cat":"Streaks","rarity":"common","glyph":"Ⅱ","scope":"lifetime","metric_key":"best_streak","threshold":2,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"streak3","name":"Hot Hand","desc":"Win 3 races consecutively.","cat":"Streaks","rarity":"common","glyph":"Ⅲ","scope":"lifetime","metric_key":"best_streak","threshold":3,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"streak5","name":"On Fire","desc":"Win 5 races consecutively.","cat":"Streaks","rarity":"rare","glyph":"Ⅴ","scope":"lifetime","metric_key":"best_streak","threshold":5,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"streak7","name":"Seven Deep","desc":"Win 7 races consecutively.","cat":"Streaks","rarity":"epic","glyph":"Ⅶ","scope":"lifetime","metric_key":"best_streak","threshold":7,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"streak10","name":"Untouched","desc":"Win 10 races consecutively.","cat":"Streaks","rarity":"legendary","glyph":"Ⅹ","scope":"lifetime","metric_key":"best_streak","threshold":10,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"green","name":"Above Water","desc":"Reach positive lifetime net flow.","cat":"Flow","rarity":"common","glyph":"+","scope":"lifetime","metric_key":"net_pnl_minor","threshold":1,"minimum_rounds":1,"direction":"gte","earned":false},{"id":"net10k","name":"Current +10K","desc":"Reach +₦10,000 lifetime net flow.","cat":"Flow","rarity":"rare","glyph":"₦","scope":"lifetime","metric_key":"net_pnl_minor","threshold":1000000,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"net50k","name":"Current +50K","desc":"Reach +₦50,000 lifetime net flow.","cat":"Flow","rarity":"epic","glyph":"₦","scope":"lifetime","metric_key":"net_pnl_minor","threshold":5000000,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"net100k","name":"Six Figures","desc":"Reach +₦100,000 lifetime net flow.","cat":"Flow","rarity":"legendary","glyph":"₦","scope":"lifetime","metric_key":"net_pnl_minor","threshold":10000000,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"scale1","name":"Conviction","desc":"Add to an existing position before entry closes.","cat":"Scaling","rarity":"common","glyph":"↗","scope":"lifetime","metric_key":"scale_ins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"scale5","name":"Build The Position","desc":"Record 5 scale-ins across your races.","cat":"Scaling","rarity":"rare","glyph":"↗","scope":"lifetime","metric_key":"scale_ins","threshold":5,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"scale25","name":"Layered","desc":"Record 25 scale-ins.","cat":"Scaling","rarity":"epic","glyph":"≋","scope":"lifetime","metric_key":"scale_ins","threshold":25,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"days3","name":"Return Current","desc":"Play on 3 distinct days.","cat":"Endurance","rarity":"common","glyph":"☰","scope":"lifetime","metric_key":"active_days","threshold":3,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"days7","name":"A Week In","desc":"Play on 7 distinct days.","cat":"Endurance","rarity":"rare","glyph":"7D","scope":"lifetime","metric_key":"active_days","threshold":7,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"days15","name":"Regular","desc":"Play on 15 distinct days.","cat":"Endurance","rarity":"epic","glyph":"15D","scope":"lifetime","metric_key":"active_days","threshold":15,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"days30","name":"Resident","desc":"Play on 30 distinct days.","cat":"Endurance","rarity":"legendary","glyph":"30D","scope":"lifetime","metric_key":"active_days","threshold":30,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"higher_first","name":"Upstream","desc":"Win your first HIGHER call.","cat":"Flow","rarity":"common","glyph":"▲","scope":"lifetime","metric_key":"higher_wins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"lower_first","name":"Downstream","desc":"Win your first LOWER call.","cat":"Flow","rarity":"common","glyph":"▼","scope":"lifetime","metric_key":"lower_wins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"both_day","name":"Two Directions","desc":"Win HIGHER and LOWER on the same day.","cat":"Flow","rarity":"rare","glyph":"↕","scope":"lifetime","metric_key":"both_direction_win_days","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"all_durations","name":"Every Distance","desc":"Win a 1m, 5m and 15m race.","cat":"Flow","rarity":"rare","glyph":"1·5·15","scope":"lifetime","metric_key":"distinct_winning_durations","threshold":3,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"contra40","name":"Against The Crowd","desc":"Win while your side holds less than 40% of the pool.","cat":"Flow","rarity":"rare","glyph":"40","scope":"lifetime","metric_key":"contrarian40_wins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"contra25","name":"Against The Current","desc":"Win while your side holds less than 25% of the pool.","cat":"Flow","rarity":"epic","glyph":"25","scope":"lifetime","metric_key":"contrarian25_wins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"contra10","name":"Alone In The Water","desc":"Win while your side holds less than 10% of the pool.","cat":"Flow","rarity":"legendary","glyph":"10","scope":"lifetime","metric_key":"contrarian10_wins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"photo1","name":"Photo Finish","desc":"Win by a tiny finishing-price margin.","cat":"Accuracy","rarity":"rare","glyph":"·","scope":"lifetime","metric_key":"photo_finish_wins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"photo5","name":"Five Fine Margins","desc":"Collect five Photo Finish wins.","cat":"Accuracy","rarity":"epic","glyph":"···","scope":"lifetime","metric_key":"photo_finish_wins","threshold":5,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"late1","name":"Last Call","desc":"Enter during the final permitted entry window and win.","cat":"Flow","rarity":"rare","glyph":"⌛","scope":"lifetime","metric_key":"late_entry_wins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"early1","name":"First In","desc":"Enter near the opening of a pool and win.","cat":"Flow","rarity":"common","glyph":"◷","scope":"lifetime","metric_key":"early_entry_wins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"scale_win","name":"Double Down Without Doubling","desc":"Scale into a position and win the race.","cat":"Scaling","rarity":"rare","glyph":"↗▲","scope":"lifetime","metric_key":"scaled_wins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"scale3_win","name":"Three Layers","desc":"Add to the same position at least twice and win.","cat":"Scaling","rarity":"epic","glyph":"≋▲","scope":"lifetime","metric_key":"multi_scaled_wins","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"tie5","name":"Still Water","desc":"Take part in five exact-price ties.","cat":"Origins","rarity":"epic","glyph":"=5","scope":"lifetime","metric_key":"ties","threshold":5,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"season_join","name":"First Current","desc":"Complete a race in Season 01.","cat":"Season","rarity":"seasonal","glyph":"I","scope":"season","metric_key":"season_rounds","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"season50","name":"Half The Field","desc":"Finish a season in the top 50%.","cat":"Season","rarity":"seasonal","glyph":"50%","scope":"season","metric_key":"season_final_percentile_bp","threshold":5000,"minimum_rounds":0,"direction":"lte","earned":false},{"id":"season25","name":"Quarter Current","desc":"Finish a season in the top 25%.","cat":"Season","rarity":"seasonal","glyph":"25%","scope":"season","metric_key":"season_final_percentile_bp","threshold":2500,"minimum_rounds":0,"direction":"lte","earned":false},{"id":"season10","name":"Top Current","desc":"Finish a season in the top 10%.","cat":"Season","rarity":"seasonal","glyph":"10%","scope":"season","metric_key":"season_final_percentile_bp","threshold":1000,"minimum_rounds":0,"direction":"lte","earned":false},{"id":"season5","name":"Five Percent","desc":"Finish a season in the top 5%.","cat":"Season","rarity":"seasonal","glyph":"5%","scope":"season","metric_key":"season_final_percentile_bp","threshold":500,"minimum_rounds":0,"direction":"lte","earned":false},{"id":"season1","name":"One Percent","desc":"Finish a season in the top 1%.","cat":"Season","rarity":"seasonal","glyph":"1%","scope":"season","metric_key":"season_final_percentile_bp","threshold":100,"minimum_rounds":0,"direction":"lte","earned":false},{"id":"season100","name":"The Hundred","desc":"Finish a season inside the top 100.","cat":"Season","rarity":"seasonal","glyph":"#100","scope":"season","metric_key":"season_final_rank","threshold":100,"minimum_rounds":0,"direction":"lte","earned":false},{"id":"season10rank","name":"The Ten","desc":"Finish a season inside the top 10.","cat":"Season","rarity":"seasonal","glyph":"#10","scope":"season","metric_key":"season_final_rank","threshold":10,"minimum_rounds":0,"direction":"lte","earned":false},{"id":"podium","name":"Podium","desc":"Finish a season in the top three.","cat":"Season","rarity":"seasonal","glyph":"Ⅲ","scope":"season","metric_key":"season_final_rank","threshold":3,"minimum_rounds":0,"direction":"lte","earned":false},{"id":"champ","name":"Champion","desc":"Finish a season ranked #1.","cat":"Season","rarity":"legendary","glyph":"Ⅰ","scope":"season","metric_key":"season_final_rank","threshold":1,"minimum_rounds":0,"direction":"lte","earned":false},{"id":"ref1","name":"First Invite","desc":"Bring your first genuinely active referred player.","cat":"Social","rarity":"common","glyph":"+1","scope":"lifetime","metric_key":"qualified_referrals","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"ref5","name":"Flow Builder","desc":"Bring 5 active referred players.","cat":"Social","rarity":"rare","glyph":"+5","scope":"lifetime","metric_key":"qualified_referrals","threshold":5,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"ref25","name":"Crowd Puller","desc":"Bring 25 active referred players.","cat":"Social","rarity":"epic","glyph":"+25","scope":"lifetime","metric_key":"qualified_referrals","threshold":25,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"ref100","name":"The Network","desc":"Bring 100 active referred players.","cat":"Social","rarity":"legendary","glyph":"+100","scope":"lifetime","metric_key":"qualified_referrals","threshold":100,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"share1","name":"Leave A Mark","desc":"Share your first TH3FLOW result card.","cat":"Social","rarity":"common","glyph":"↗","scope":"lifetime","metric_key":"social_shares","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"city10","name":"Home Current","desc":"Finish a week inside your city top 10.","cat":"Social","rarity":"epic","glyph":"⌂","scope":"lifetime","metric_key":"weekly_city_top10","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false},{"id":"global100","name":"Visible","desc":"Finish a week inside the global top 100.","cat":"Social","rarity":"epic","glyph":"◎","scope":"lifetime","metric_key":"weekly_global_top100","threshold":1,"minimum_rounds":0,"direction":"gte","earned":false}];
let data={
  session:null,
  stats:{rounds:0,wins:0,losses:0,ties:0,net_pnl_minor:0,best_streak:0},
  metrics:{},
  xp:0,
  level:1,
  trophy_count:0,
  achievements:fallbackAchievements,
  season:null,
  referral:null
};
let currentFilter='all';

const money=n=>{const x=Number(n||0)/100;return (x<0?'-':'')+'₦'+Math.abs(x).toLocaleString('en-NG',{maximumFractionDigits:2,minimumFractionDigits:0})};
const pct=n=>`${(Number(n||0)/100).toFixed(Number(n||0)%100?2:0)}%`;
const safeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),1700)}

function randomId(){return globalThis.crypto?.randomUUID?.()||('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)}))}
async function captureReferral(){
  const q=new URLSearchParams(location.search),code=(q.get('ref')||'').trim().toUpperCase();
  if(!code)return;
  const key='th3flow_ref_visit_'+code;
  let visitToken=null;
  try{visitToken=localStorage.getItem(key);if(!visitToken){visitToken=randomId();localStorage.setItem(key,visitToken)}localStorage.setItem(REF_STORE,JSON.stringify({code,captured_at:Date.now(),visit_token:visitToken}))}catch{}
  if(sb&&visitToken){
    await sb.rpc('record_referral_visit',{p_code:code,p_visit_token:visitToken,p_landing_path:location.pathname,p_utm_source:q.get('utm_source'),p_utm_medium:q.get('utm_medium'),p_utm_campaign:q.get('utm_campaign')});
  }
}

function progressFor(a){
  const earned=!!a.earned;
  let current=Number(a.progress_value ?? data.metrics?.[a.metric_key] ?? 0);
  let target=Number(a.threshold||1);
  if(a.id==='season_join'&&data.season) current=Number(data.season.rounds||0);
  if(a.direction==='lte'){
    if(earned)return [target,target,100];
    return [current||0,target,0];
  }
  const p=earned?100:Math.min(100,Math.max(0,current/Math.max(1,target)*100));
  return [current,target,p];
}

function card(a){
  const earned=!!a.earned;
  const [v,t,p]=progressFor(a);
  const progressText=earned?'Complete':a.direction==='lte'?(v?`Current · ${Number(v).toLocaleString()}`:'Season placement'):`${Math.min(Number(v)||0,Number(t)||1).toLocaleString()} / ${(Number(t)||1).toLocaleString()}`;
  return `<article class="trophy ${safeText(a.rarity)} ${earned?'':'locked'}">
    <div class="glyph">${safeText(a.glyph)}</div>
    <div class="rarity">${safeText(a.rarity)} · ${safeText(a.cat)}</div>
    ${earned?'<div class="earned">earned</div>':''}
    <h3>${safeText(a.name)}</h3>
    <p>${safeText(a.desc)}</p>
    <div class="progress"><div class="progressline"><i style="width:${p}%"></i></div><small>${safeText(progressText)}</small></div>
  </article>`;
}

function renderGrid(f='all'){
  $('#trophyGrid').innerHTML=(data.achievements||[]).filter(a=>f==='all'||a.cat===f).map(card).join('');
}

function achievementById(id){return (data.achievements||[]).find(a=>a.id===id)||fallbackAchievements.find(a=>a.id===id)}

function renderPreview(){
  const ids=['season_join','season50','season10','season1','podium','champ'];
  $('#seasonPreview').innerHTML=ids.map(id=>achievementById(id)).filter(Boolean).map(card).join('');
}

function renderSeason(){
  const s=data.season;
  const section=$('#seasonView .sectionhead');
  if(!s){
    $('#seasonScore').textContent='0';$('#seasonLevel').textContent='01';$('#seasonDays').textContent='—';
    renderPreview();return;
  }
  if(section){
    const h=section.querySelector('h2'); if(h)h.textContent=s.name||'Season 01';
    const right=section.querySelector(':scope > p'); if(right)right.textContent=(s.status||'draft').toUpperCase()+' · non-cash competition';
  }
  const sn=$('.seasonname');
  if(sn)sn.innerHTML=`<em>${safeText((s.slug||'season').replace('-',' ').toUpperCase())}</em>${safeText(s.name||'THE FIRST CURRENT')}`;
  $('#seasonScore').textContent=Number(s.score||0).toLocaleString();
  $('#seasonLevel').textContent=String(Number(s.current_level||1)).padStart(2,'0');
  $('#seasonDays').textContent=Number(s.active_days||0)||'—';
  const rankBox=$('.rankring b'); if(rankBox)rankBox.textContent=s.rank?`#${Number(s.rank).toLocaleString()}`:'—';
  const rankSub=$$('.rankring span')[1]; if(rankSub)rankSub.textContent=s.field_size?`${Number(s.field_size).toLocaleString()} players`:(s.status==='draft'?'Not started':'Launch season');

  const track=$('#seasonTrack');
  if(track&&Array.isArray(s.rewards)&&s.rewards.length){
    track.innerHTML=s.rewards.map(r=>{
      const gate=r.level_required!=null?String(r.level_required).padStart(2,'0'):'#'+r.rank_max;
      return `<div class="reward ${r.unlocked?'':'lockedreward'}"><div class="num">${safeText(gate)}</div><div><h4>${safeText(r.name)}</h4><p>${safeText(r.description)}</p></div><div class="type">${r.unlocked?'Unlocked':safeText(r.reward_type.replaceAll('_',' '))}</div></div>`;
    }).join('');
  }
  renderPreview();
}

function renderRefs(){
  const ids=['ref1','ref5','ref25','ref100'];
  $('#refPreview').innerHTML=ids.map(id=>achievementById(id)).filter(Boolean).map(card).join('');
  const r=data.referral||{};
  $('#refEarnings').textContent=money(r.payable_balance_minor||0);
  $('#refClicks').textContent=Number(r.unique_clicks||0).toLocaleString();
  $('#refInvites').textContent=Number(r.total_referrals||0).toLocaleString();
  $('#refActive').textContent=Number(r.qualified_referrals||0).toLocaleString();
  $('#refTier').textContent=r.tier_name||'Referral';
  $('#refSignupConv').textContent=pct(r.signup_conversion_bp||0);
  $('#refQualConv').textContent=pct(r.qualified_conversion_bp||0);
  $('#refFees').textContent=money(r.attributed_platform_fee_minor||0);
  $('#refLifetime').textContent=money(r.lifetime_commission_minor||0);
  $('#pendingPayout').textContent=`Pending payout · ${money(r.pending_payout_minor||0)}`;
  $('#payoutMinimum').textContent=`Minimum payout · ${money(r.min_payout_minor||0)}`;
  $('#termsVersion').textContent=r.terms_version||'—';

  const link=r.code?`${location.origin}/play/?ref=${encodeURIComponent(r.code)}`:'Sign in to generate your referral link';
  $('#refLink').value=link;

  const tiers=$('.tiers');
  if(tiers&&Array.isArray(r.tiers)&&r.tiers.length){
    tiers.innerHTML=r.tiers.map(t=>`<div class="tier"><b>${safeText(t.display_name)}</b><p>${Number(t.min_qualified_referrals)===0?'Every approved participant begins here.':`Unlocks at ${Number(t.min_qualified_referrals).toLocaleString()} qualified referrals.`}</p><span>${(Number(t.commission_bps)/100).toFixed(0)}%</span></div>`).join('');
  }

  const next=$('#nextTier');
  if(next){
    if(r.next_tier){const need=Math.max(0,Number(r.next_tier.min_qualified_referrals||0)-Number(r.qualified_referrals||0));next.textContent=`${need} more active referral${need===1?'':'s'} to ${r.next_tier.display_name} · ${(Number(r.next_tier.commission_bps||0)/100).toFixed(0)}% public rate.`}
    else next.textContent='Highest public tier reached. Bespoke creator rates can be assigned separately.';
  }

  const joined=!!r.terms_accepted;
  $('#affiliateJoin').style.display=data.session&&!joined?'grid':'none';
  $('#affiliateJoined').style.display=data.session&&joined?'block':'none';
  if(joined){
    $('#affStatus').textContent=`${r.tier_name||'Affiliate'} · terms accepted`;
    $('#affRateText').textContent=`Effective rate ${(Number(r.commission_bps||0)/100).toFixed(0)}% · ${r.rate_source==='custom'?'bespoke creator rate':'automatic tier rate'} · lifetime referral commission.${r.commissions_enabled?' Commission accrual is live.':' Pre-launch attribution is live; commission accrual is not switched on yet.'}`;
  }

  const recent=$('#recentRefs');
  if(recent){
    const rows=Array.isArray(r.recent_referrals)?r.recent_referrals:[];
    recent.innerHTML=rows.length?`<div class="refrow head"><span>Referral</span><span>Status</span><span>TH3FLOW fees</span><span>Your commission</span></div>`+rows.map(x=>`<div class="refrow"><b>${safeText(x.player_ref)}</b><span class="${x.qualified?'good':''}">${x.qualified?'Active':'Signed up'}</span><span>${money(x.platform_fee_minor||0)}</span><span>${money(x.commission_minor||0)}</span></div>`).join(''):'<div class="empty">No referrals yet. Your link is ready when you are.</div>';
  }

  const note=$('.cashnote');
  if(note)note.textContent=r.commissions_enabled
    ? `Your effective rate is ${(Number(r.commission_bps||0)/100).toFixed(0)}% of the actual eligible TH3FLOW fees generated by your permanently attributed referred players. There is no commission expiry.`
    : 'Referral visits and attribution can be tracked before launch. Cash commission accrual remains off until TH3FLOW deliberately activates the programme.';

  const payout=$('#requestPayout');
  if(payout){const enough=Number(r.payable_balance_minor||0)>=Number(r.min_payout_minor||0)&&Number(r.min_payout_minor||0)>0;payout.disabled=!data.session;payout.textContent=enough?'Request payout':'Balance below payout minimum';payout.title=enough?'Request affiliate payout':`Minimum payout is ${money(r.min_payout_minor||0)} · available ${money(r.payable_balance_minor||0)}`;}
}
function render(){
  const s=data.stats||{}, m=data.metrics||{};
  const ach=data.achievements||[];
  const earned=ach.filter(a=>a.earned);
  const xp=Number(data.xp||0),level=Number(data.level||1),inLevel=xp%500;
  $('#level').textContent=String(level).padStart(2,'0');
  $('#xpLabel').textContent=xp.toLocaleString()+' XP';
  $('#xpNext').textContent=`Next level · ${(level*500).toLocaleString()} XP`;
  $('#xpBar').style.width=(inLevel/5)+'%';
  $('#stRounds').textContent=Number(s.rounds||0).toLocaleString();
  $('#stAccuracy').textContent=Number(m.accuracy_bp||0)?pct(m.accuracy_bp):'—';
  $('#stNet').textContent=money(s.net_pnl_minor);
  $('#stStreak').textContent=s.best_streak||0;
  $('#stTies').textContent=s.ties||0;
  $('#stTrophies').textContent=Number(data.trophy_count ?? earned.length);
  $('#earnedCount').textContent=earned.length;
  $('#totalCount').textContent=ach.length;
  $('#identityLine').textContent=data.session?(data.session.user.email||'Signed in'):(live?'Sign in to reveal your record':'Demo cabinet');
  renderGrid(currentFilter);renderSeason();renderRefs();
}

async function claimPendingReferral(){
  if(!sb||!data.session)return;
  let pending=null;
  try{pending=JSON.parse(localStorage.getItem(REF_STORE)||'null')}catch{}
  if(!pending?.code)return;
  if(!pending.captured_at||Date.now()-Number(pending.captured_at)>8*24*60*60*1000){localStorage.removeItem(REF_STORE);return}
  const call=pending.visit_token?'claim_referral_with_visit':'claim_referral';
  const args=pending.visit_token?{p_code:pending.code,p_visit_token:pending.visit_token}:{p_code:pending.code};
  const {data:claimed,error}=await sb.rpc(call,args);
  if(!error){
    localStorage.removeItem(REF_STORE);
    if(claimed?.status==='attributed')toast('Referral connected');
    return;
  }
  const msg=String(error.message||'');
  if(/already|yourself|first race|expired|not found/i.test(msg))localStorage.removeItem(REF_STORE);
}

function demo(){
  data.stats={rounds:37,wins:21,losses:15,ties:1,net_pnl_minor:1823400,best_streak:4};
  data.metrics={rounds:37,wins:21,losses:15,ties:1,best_streak:4,net_pnl_minor:1823400,accuracy_bp:5833,active_days:9,scale_ins:5,higher_wins:11,lower_wins:10,both_direction_win_days:2,distinct_winning_durations:3,contrarian40_wins:1,contrarian25_wins:0,contrarian10_wins:0,photo_finish_wins:2,late_entry_wins:1,early_entry_wins:2,scaled_wins:2,multi_scaled_wins:0,qualified_referrals:3,social_shares:1};
  data.achievements=fallbackAchievements.map(a=>({...a,earned:a.direction==='gte'&&Number(data.metrics[a.metric_key]||0)>=Number(a.threshold)&&Number(data.metrics.rounds||0)>=Number(a.minimum_rounds||0),progress_value:Number(data.metrics[a.metric_key]||0)}));
  data.trophy_count=data.achievements.filter(a=>a.earned).length;
  data.xp=2140;data.level=5;
  data.season={slug:'season-01',name:'THE FIRST CURRENT',status:'draft',score:0,current_level:1,active_days:0,rank:null,field_size:0,rewards:[]};
  data.referral={code:'TDEMO123',unique_clicks:42,clicks:57,total_referrals:8,qualified_referrals:3,signup_conversion_bp:1905,qualified_conversion_bp:3750,tier_name:'Referral',commission_bps:1000,payable_balance_minor:0,pending_payout_minor:0,attributed_platform_fee_minor:0,lifetime_commission_minor:0,commissions_enabled:false,commission_window_days:null,commission_lifetime:true,min_payout_minor:100000,terms_version:'2026-09-11-lifetime',terms_accepted:false,recent_referrals:[],tiers:[
    {display_name:'Referral',min_qualified_referrals:0,commission_bps:1000},
    {display_name:'Scout',min_qualified_referrals:5,commission_bps:1500},
    {display_name:'Partner',min_qualified_referrals:25,commission_bps:2000},
    {display_name:'Syndicate',min_qualified_referrals:100,commission_bps:2500}
  ]};
}

async function load(){
  await captureReferral();
  if(!sb){demo();render();return}
  const {data:{session}}=await sb.auth.getSession();
  data.session=session;
  if(!session){
    const {data:catalog}=await sb.rpc('get_achievement_catalog');
    if(Array.isArray(catalog))data.achievements=catalog.map(a=>({id:a.code,name:a.name,desc:a.description,cat:a.category,rarity:a.rarity,glyph:a.glyph,scope:a.scope,metric_key:a.metric_key,threshold:a.threshold,minimum_rounds:a.minimum_rounds,direction:a.direction,earned:false,progress_value:0}));
    render();return;
  }
  await claimPendingReferral();
  const {data:payload,error}=await sb.rpc('get_my_cabinet');
  if(error){console.error(error);toast('Cabinet backend unavailable');render();return}
  data.stats=payload.stats||data.stats;
  data.metrics=payload.metrics||{};
  data.xp=payload.xp||0;
  data.level=payload.level||1;
  data.trophy_count=payload.trophy_count||0;
  data.achievements=(payload.achievements||[]).map(a=>({...a,id:a.id,name:a.name,desc:a.desc,cat:a.cat,earned:!!a.earned}));
  data.season=payload.season||null;
  data.referral=payload.referral||null;
  render();
}

$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.toggle('on',x===b));$$('.view').forEach(v=>v.classList.toggle('on',v.id===b.dataset.view+'View'))});
function selectInitialView(){const v=new URLSearchParams(location.search).get('view');if(!v)return;const b=$(`.tab[data-view="${CSS.escape(v)}"]`);if(b)b.click()}
$$('.filter').forEach(b=>b.onclick=()=>{currentFilter=b.dataset.filter;$$('.filter').forEach(x=>x.classList.toggle('on',x===b));renderGrid(currentFilter)});

$('#copyRef').onclick=async()=>{
  const v=$('#refLink').value;
  if(!data.referral?.code)return toast('Sign in first');
  try{await navigator.clipboard.writeText(v);toast('Referral link copied')}catch{toast('Copy failed')}
};
$('#joinAffiliate').onclick=async()=>{
  if(!sb||!data.session)return toast('Sign in first');
  if(!$('#affTerms').checked)return toast('Accept the affiliate terms first');
  const {error}=await sb.rpc('join_affiliate_program',{p_public_name:$('#affPublicName').value.trim()||null,p_channel_name:$('#affChannel').value.trim()||null,p_channel_url:$('#affChannelUrl').value.trim()||null});
  if(error)return toast(error.message||'Could not join affiliate programme');
  toast('Affiliate programme joined');await load();
};
$('#requestPayout').onclick=async()=>{
  if(!sb||!data.session)return toast('Sign in first');
  const amount=Math.round(Number($('#payoutAmount').value||0)*100),rail=$('#payoutRail').value,details=$('#payoutDestination').value.trim();
  if(!amount||amount<Number(data.referral?.min_payout_minor||0))return toast(`Minimum payout is ${money(data.referral?.min_payout_minor||0)}`);
  if(!details)return toast('Add payout destination details');
  const key='aff-payout-'+randomId();
  const {data:res,error}=await sb.rpc('request_affiliate_payout',{p_amount_minor:amount,p_rail:rail,p_destination:{details},p_idempotency_key:key});
  if(error)return toast(error.message||'Could not request payout');
  toast('Payout request created');$('#payoutAmount').value='';$('#payoutDestination').value='';await load();
};
$('#accountBtn').onclick=()=>{if(data.session&&sb){sb.auth.signOut().then(()=>location.reload())}else location.href='../play/'};
if(sb)sb.auth.onAuthStateChange(()=>load());
load().then(selectInitialView);
})();
