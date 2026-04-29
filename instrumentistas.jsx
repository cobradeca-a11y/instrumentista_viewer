import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://ehjnepbxelqyqspgdwii.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoam5lcGJ4ZWxxeXFzcGdkd2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzgxNjYsImV4cCI6MjA5MzA1NDE2Nn0.U4ysFz93srI_bWmDZ76hsBRTILRT86gNrk5Ibt0X1l0";
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/scores`;

async function fetchSongs() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/songs?select=id,title,composer,key,key_root,key_mode,meter,bpm,difficulty,tags,storage_path&published=eq.true&order=title`,
    { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
  );
  return res.json();
}

async function fetchScore(storagePath) {
  const name = storagePath.replace('scores/', '');
  const res = await fetch(`${STORAGE_BASE}/${name}`);
  return res.json();
}

// ─── HARMONIC ENGINE ──────────────────────────────────────────────────────────
const MAJOR_INTERVALS = [0,2,4,5,7,9,11];
const NOTE_MAP = {'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11};
const DEGREE_DATA = [
  {degree:'I',   label:'Repouso',   color:'#16A34A'},
  {degree:'II',  label:'Preparo',   color:'#2563EB'},
  {degree:'III', label:'Coloração', color:'#0891B2'},
  {degree:'IV',  label:'Preparo',   color:'#2563EB'},
  {degree:'V',   label:'Tensão',    color:'#DC2626'},
  {degree:'VI',  label:'Relativa',  color:'#059669'},
  {degree:'VII', label:'Tensão',    color:'#DC2626'},
];
const FN_DESC = {
  'Repouso':   'A música chegou. Sensação de estabilidade e conclusão.',
  'Tensão':    'A música quer continuar. Cria expectativa de resolução.',
  'Preparo':   'A música se afasta da tônica antes de resolver.',
  'Relativa':  'Coloração entre repouso e melancolia.',
  'Coloração': 'Cor harmônica suave. Zona de estabilidade.',
  'Empréstimo':'Acorde de outro modo. Cria colorido especial.',
  'Cromatismo':'Movimento cromático por semitom.',
};
const TYPE_NAMES = {
  maj:'Acorde Maior',m:'Acorde Menor',dom7:'Dominante com Sétima',
  m7:'Menor com Sétima',Maj7:'Sétima Maior',dim:'Diminuto',
  half_dim:'Meio-Diminuto',sus4:'Suspenso (4ª)',sus2:'Suspenso (2ª)',
  dom9:'Nona de Dominante',add9:'Adicionada de Nona',
};

function parseRoot(s){const m=s.match(/^([A-G][b#]?)/);return m?m[1]:null;}
function getChordType(s){
  const r=s.replace(/^[A-G][b#]?/,'');
  if(r.match(/m(7|aj)?b5|ø/))return'half_dim';
  if(r.match(/dim|°/))return'dim';
  if(r.match(/^m7/))return'm7';
  if(r.match(/^m/))return'm';
  if(r.match(/Maj7|maj7|M7/))return'Maj7';
  if(r.match(/^7/))return'dom7';
  if(r.match(/sus4/))return'sus4';
  if(r.match(/sus2/))return'sus2';
  if(r.match(/^9/))return'dom9';
  return'maj';
}
function getHF(symbol,keyRoot){
  const root=parseRoot(symbol);
  if(!root||!keyRoot)return null;
  const interval=((NOTE_MAP[root]??0)-(NOTE_MAP[keyRoot]??0)+12)%12;
  const idx=MAJOR_INTERVALS.indexOf(interval);
  if(idx===-1){
    if(interval===10)return{degree:'bVII',label:'Empréstimo',color:'#8B5CF6'};
    if(interval===8) return{degree:'bVI', label:'Empréstimo',color:'#8B5CF6'};
    if(interval===3) return{degree:'bIII',label:'Empréstimo',color:'#8B5CF6'};
    return{degree:'?',label:'Cromatismo',color:'#6B7280'};
  }
  return DEGREE_DATA[idx];
}

// ─── CHORD DIAGRAMS ───────────────────────────────────────────────────────────
const DIAGRAMS={
  'C':[-1,3,2,0,1,0],'D':[-1,-1,0,2,3,2],'E':[0,2,2,1,0,0],
  'G':[3,2,0,0,0,3],'A':[-1,0,2,2,2,0],'F':[1,1,2,3,3,1],
  'Am':[-1,0,2,2,1,0],'Em':[0,2,2,0,0,0],'Dm':[-1,-1,0,2,3,1],
  'Bm':[-1,2,4,4,3,2],'G7':[3,2,0,0,0,1],'C7':[-1,3,2,3,1,0],
  'D7':[-1,-1,0,2,1,2],'A7':[-1,0,2,0,2,0],'E7':[0,2,0,1,0,0],
  'Cm':[-1,3,5,5,4,3],'Fm':[1,1,3,3,2,1],'Bb':[-1,1,3,3,3,1],
  'Ab':[4,4,6,6,6,4],'Eb':[-1,-1,5,3,4,3],
  'Am7':[-1,0,2,0,1,0],'Em7':[0,2,2,0,3,0],'Dm7':[-1,-1,0,2,1,1],
};
const BARRE={'F':1,'Bm':2,'Cm':3,'Fm':1,'Bb':1,'Ab':4};

function ChordDiagram({symbol,compact=false}){
  const root=parseRoot(symbol);
  const frets=DIAGRAMS[symbol]||DIAGRAMS[root];
  if(!frets)return null;
  const barre=BARRE[symbol]||0;
  const valid=frets.filter(f=>f>0);
  const dMin=barre>0?barre:Math.max(1,Math.min(...valid.filter(f=>f>0)));
  const sw=compact?26:36,sh=compact?24:32,pad=compact?10:14,dotR=compact?5:7;
  const W=5*sw+pad*2,H=4*sh+pad*2+18;
  return(
    <svg width={W} height={H} style={{display:'block'}}>
      {dMin<=1?<rect x={pad} y={pad+16} width={5*sw} height={3} fill="#1A1712"/>
               :<text x={pad-4} y={pad+22} textAnchor="end" fontSize={compact?8:10} fill="#8A8278">{dMin}fr</text>}
      {Array.from({length:6},(_,i)=><line key={i} x1={pad+i*sw} y1={pad+16} x2={pad+i*sw} y2={pad+16+4*sh} stroke="#C0B8A8" strokeWidth={1}/>)}
      {Array.from({length:5},(_,i)=><line key={i} x1={pad} y1={pad+16+i*sh} x2={pad+5*sw} y2={pad+16+i*sh} stroke="#D0C8B8" strokeWidth={1}/>)}
      {frets.map((f,i)=>{
        const x=pad+(5-i)*sw;
        if(f===-1)return<text key={i} x={x} y={pad+12} textAnchor="middle" fontSize={compact?9:12} fill="#9A9288">×</text>;
        if(f===0) return<text key={i} x={x} y={pad+12} textAnchor="middle" fontSize={compact?9:12} fill="#5A9A6A">○</text>;
        return null;
      })}
      {barre>0&&<rect x={pad} y={pad+16+(barre-dMin)*sh+sh*0.2} width={5*sw} height={sh*0.6} rx={dotR} fill="#2A2520" opacity={0.85}/>}
      {frets.map((f,i)=>{
        if(f<=0||(barre>0&&f===barre))return null;
        return<circle key={i} cx={pad+(5-i)*sw} cy={pad+16+(f-dMin)*sh+sh/2} r={dotR} fill="#2A2520"/>;
      })}
      <text x={W/2} y={H-2} textAnchor="middle" fontSize={compact?9:11} fill="#8A8278" fontFamily="Georgia">{symbol}</text>
    </svg>
  );
}

// ─── CADENCES ─────────────────────────────────────────────────────────────────
const CAD_PATTERNS=[
  {from:'V',to:'I',   type:'Autêntica',    desc:'Tensão resolve no Repouso — a cadência mais forte'},
  {from:'IV',to:'I',  type:'Plagal',       desc:'IV → I — o "Amém" da harmonia'},
  {from:'V',to:'VI',  type:'Interrompida', desc:'V → VI — surpresa: vai para a relativa'},
  {from:'I',to:'V',   type:'Suspensiva',   desc:'I → V — abre tensão, pede continuação'},
  {from:'bVII',to:'I',type:'Modal bVII→I', desc:'Empréstimo modal resolve na tônica'},
];
function detectCadences(sections,keyRoot){
  const found=[];
  sections?.forEach(sec=>sec.lines?.forEach(line=>{
    const chords=line.filter(t=>t.chord).map(t=>({symbol:t.chord,fn:getHF(t.chord,keyRoot)}));
    for(let i=0;i<chords.length-1;i++){
      const a=chords[i],b=chords[i+1];
      if(!a.fn||!b.fn)continue;
      for(const p of CAD_PATTERNS){
        if(a.fn.degree===p.from&&b.fn.degree===p.to&&!found.find(f=>f.type===p.type)){
          found.push({...p,from:a.symbol,to:b.symbol});
        }
      }
    }
  }));
  return found;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css=`
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#FAF8F3;--surface:#FFF;--border:#E8E0D0;--border2:#D0C8B8;--text:#1A1712;--text2:#4A4540;--text3:#8A8278;--accent:#C87800;--ap-bg:#FFFBF0;--ap-c:#C87800;--ap-b:#F0D080;--in-bg:#F0F4FF;--in-c:#1A4A8A;--in-b:#A0B8E0;--pr-bg:#F5F0FF;--pr-c:#5A2080;--pr-b:#C0A0E0}
body{background:var(--bg);font-family:'Crimson Pro',Georgia,serif;color:var(--text);-webkit-font-smoothing:antialiased}
.app{min-height:100vh;display:flex;flex-direction:column}
.nav{background:var(--text);color:#E8E0D0;padding:0 20px;height:52px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:100;border-bottom:2px solid #3A3528}
.nav-logo{font-family:'Libre Baskerville',serif;font-size:18px;font-weight:700;color:var(--accent);letter-spacing:.5px;cursor:pointer}
.nav-sep{flex:1}
.nav-btn{background:none;border:1px solid #4A4538;color:#C0B8A8;padding:4px 12px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:13px;transition:all .15s}
.nav-btn:hover{background:#3A3528;color:var(--accent);border-color:var(--accent)}
.level-bar{display:flex;background:var(--text);border-bottom:2px solid #2A2520}
.level-btn{flex:1;padding:10px 8px;border:none;background:none;color:#6A6258;font-family:'Libre Baskerville',serif;font-size:13px;cursor:pointer;transition:all .2s;border-bottom:3px solid transparent;text-align:center;line-height:1.2}
.level-btn span{display:block;font-size:10px;color:#4A4538;margin-top:1px;font-family:'Crimson Pro',serif;text-transform:uppercase;letter-spacing:.5px}
.level-btn.active{color:#E8E0D0;border-bottom-color:var(--accent)}
.level-btn.active span{color:var(--accent)}
.library{max-width:680px;margin:0 auto;padding:32px 20px}
.lib-title{font-family:'Libre Baskerville',serif;font-size:28px;margin-bottom:6px}
.lib-sub{font-size:16px;color:var(--text3);margin-bottom:28px;font-style:italic}
.song-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:18px 20px;margin-bottom:12px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:16px}
.song-card:hover{border-color:var(--accent);box-shadow:0 2px 12px rgba(200,120,0,.12);transform:translateY(-1px)}
.song-icon{width:44px;height:44px;background:var(--ap-bg);border:1px solid var(--ap-b);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.song-info{flex:1;min-width:0}
.song-title{font-family:'Libre Baskerville',serif;font-size:17px;font-weight:700}
.song-meta-line{font-size:13px;color:var(--text3);margin-top:2px}
.song-tags{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
.tag{font-size:11px;padding:2px 8px;border-radius:20px;background:var(--border);color:var(--text2);font-family:'Crimson Pro',serif}
.tag.key{background:var(--ap-bg);color:var(--ap-c);border:1px solid var(--ap-b)}
.diff-dots{display:flex;gap:3px;align-items:center}
.diff-dot{width:7px;height:7px;border-radius:50%;background:var(--border2)}
.diff-dot.on{background:var(--accent)}
.viewer{max-width:720px;margin:0 auto;padding:24px 20px 80px}
.song-header{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:20px 22px;margin-bottom:20px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.song-header-title{font-family:'Libre Baskerville',serif;font-size:22px;font-weight:700}
.song-header-composer{font-size:14px;color:var(--text3);margin-top:3px;font-style:italic}
.song-header-meta{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.meta-pill{font-size:13px;padding:3px 10px;border-radius:20px;border:1px solid var(--border2);color:var(--text2);background:var(--bg)}
.back-btn{background:none;border:1px solid var(--border2);color:var(--text3);padding:6px 14px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:13px;transition:all .15s;white-space:nowrap;flex-shrink:0}
.back-btn:hover{color:var(--text);border-color:var(--text2)}
.info-panel{border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:14px;line-height:1.6}
.info-panel h4{font-family:'Libre Baskerville',serif;font-size:14px;margin-bottom:6px}
.info-panel.ap{background:var(--ap-bg);border:1px solid var(--ap-b);color:#7A4800}
.info-panel.in{background:var(--in-bg);border:1px solid var(--in-b);color:#1A3A6A}
.info-panel.pr{background:var(--pr-bg);border:1px solid var(--pr-b);color:#3A1060}
.form-map{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px}
.form-pill{font-size:12px;padding:4px 12px;border-radius:20px;border:1px solid var(--border2);color:var(--text2);background:var(--surface);font-family:'Crimson Pro',serif;cursor:pointer;transition:all .15s}
.form-pill:hover{border-color:var(--accent);color:var(--accent)}
.form-pill.active{background:var(--accent);color:white;border-color:var(--accent)}
.form-pill.lbl{background:none;border:none;color:var(--text3);font-size:11px;padding:4px 0;cursor:default}
.analysis-panel{background:var(--pr-bg);border:1px solid var(--pr-b);border-radius:8px;padding:14px 16px;margin-bottom:16px}
.analysis-title{font-family:'Libre Baskerville',serif;font-size:14px;color:var(--pr-c);margin-bottom:10px;font-weight:700}
.cad-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.cad-chord{font-family:'Libre Baskerville',serif;font-weight:700;color:var(--accent);font-size:14px}
.cad-type{font-size:12px;padding:2px 8px;border-radius:10px;background:var(--pr-b);color:var(--pr-c);font-family:'Crimson Pro',serif}
.cad-desc{font-size:12px;color:var(--text3)}
.beat-ruler{display:flex;padding:6px 14px;background:#F5F2EA;border:1px solid var(--border);border-radius:6px;margin-bottom:14px}
.beat-cell{flex:1;text-align:center;font-size:11px;color:var(--text3);font-family:'Crimson Pro',serif;border-right:1px solid var(--border);padding:2px 0}
.beat-cell:last-child{border-right:none}
.beat-cell.strong{color:var(--text2);font-weight:600}
.section-block{margin-bottom:28px}
.section-label{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--text3);font-family:'Crimson Pro',serif;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.lyric-line{display:flex;flex-wrap:wrap;align-items:flex-end;gap:0;margin-bottom:14px;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:8px;min-height:72px}
.lyric-line.instr{min-height:56px;align-items:center;gap:20px;flex-wrap:wrap}
.token{display:flex;flex-direction:column;align-items:center;margin-right:2px;margin-bottom:4px}
.t-fn{font-size:9px;text-transform:uppercase;letter-spacing:.5px;padding:1px 5px;border-radius:10px;font-family:'Crimson Pro',serif;font-weight:600;margin-bottom:2px;min-height:14px;white-space:nowrap}
.t-deg{font-size:11px;font-weight:700;font-family:'Libre Baskerville',serif;margin-bottom:2px;min-height:16px}
.t-chord{font-family:'Libre Baskerville',serif;font-size:15px;font-weight:700;line-height:1;margin-bottom:4px;min-height:18px;cursor:pointer;padding:0 2px;border-radius:3px;transition:opacity .15s}
.t-chord:hover{opacity:.7}
.t-syl{font-size:18px;color:var(--text);line-height:1;white-space:nowrap;padding:0 1px}
.t-syl.strong{font-weight:600}
.t-space{width:5px}
.instr-tok{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer}
.instr-sym{font-family:'Libre Baskerville',serif;font-size:18px;font-weight:700;color:var(--accent)}
.popup-overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:20px}
.popup{background:var(--surface);border:1px solid var(--border2);border-radius:14px;padding:24px;max-width:320px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.2)}
.popup-sym{font-family:'Libre Baskerville',serif;font-size:32px;font-weight:700;color:var(--accent);margin-bottom:4px}
.popup-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--text3);margin-bottom:4px;font-family:'Crimson Pro',serif}
.popup-fn{font-size:14px;margin-bottom:14px;padding:4px 12px;border-radius:20px;display:inline-block;font-family:'Crimson Pro',serif}
.popup-diagram{display:flex;justify-content:center;margin:14px 0}
.popup-note{font-size:13px;color:var(--text3);margin-top:6px;line-height:1.5}
.popup-close{width:100%;padding:10px;background:var(--text);color:#E8E0D0;border:none;border-radius:8px;font-family:inherit;font-size:15px;cursor:pointer;margin-top:12px;transition:background .15s}
.popup-close:hover{background:#2A2520}
.loading{display:flex;align-items:center;justify-content:center;height:200px;color:var(--text3);font-size:16px;font-style:italic}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.anim{animation:fadeIn .25s ease}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
`;

// ─── CHORD POPUP ──────────────────────────────────────────────────────────────
function ChordPopup({symbol,keyRoot,level,onClose}){
  const fn=getHF(symbol,keyRoot);
  const type=getChordType(symbol);
  return(
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup anim" onClick={e=>e.stopPropagation()}>
        <div className="popup-sym">{symbol}</div>
        <div className="popup-lbl">Tipo</div>
        <div style={{fontSize:15,color:'var(--text2)',marginBottom:14}}>{TYPE_NAMES[type]||type}</div>
        {fn&&<>
          <div className="popup-lbl">Função harmônica</div>
          <div className="popup-fn" style={{background:fn.color+'20',color:fn.color,border:`1px solid ${fn.color}40`}}>
            {fn.degree} — {fn.label}
          </div>
          <div className="popup-note">{FN_DESC[fn.label]||''}</div>
          {level>=2&&keyRoot&&<div className="popup-note"><strong>Grau {fn.degree}</strong> na tonalidade de {keyRoot}</div>}
        </>}
        <div className="popup-diagram"><ChordDiagram symbol={symbol}/></div>
        <button className="popup-close" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

// ─── TOKEN ────────────────────────────────────────────────────────────────────
function Token({token,keyRoot,level,onChordClick}){
  const fn=token.chord?getHF(token.chord,keyRoot):null;
  const hasDash=token.text?.endsWith('-');
  const text=token.text?.replace(/[-]$/,'').replace(/^"/,'')||'';
  return(
    <div className="token">
      {level===1&&(fn
        ?<div className="t-fn" style={{background:fn.color+'18',color:fn.color,border:`1px solid ${fn.color}30`}}>{fn.label}</div>
        :<div className="t-fn"/>
      )}
      {level>=2&&<div className="t-deg" style={{color:fn?fn.color:'transparent'}}>{fn?fn.degree:'·'}</div>}
      <div className="t-chord" style={{color:token.chord?'var(--accent)':'transparent',minHeight:18}}
           onClick={token.chord?()=>onChordClick(token.chord):undefined}>
        {token.chord||'·'}
      </div>
      {text
        ?<div className={`t-syl${token.chord?' strong':''}`}>{text}{hasDash&&<span style={{color:'var(--border2)'}}>-</span>}</div>
        :<div className="t-space"/>
      }
    </div>
  );
}

// ─── LYRIC LINE ───────────────────────────────────────────────────────────────
function LyricLine({tokens,isInstr,keyRoot,level,onChordClick}){
  if(isInstr){
    const ct=tokens.filter(t=>t.chord);
    return(
      <div className="lyric-line instr">
        {ct.length===0
          ?<span style={{color:'var(--text3)',fontSize:14,fontStyle:'italic'}}>seção instrumental</span>
          :ct.map((t,i)=>{
            const fn=getHF(t.chord,keyRoot);
            return(
              <div key={i} className="instr-tok" onClick={()=>onChordClick(t.chord)}>
                <div className="instr-sym">{t.chord}</div>
                {level>=2&&fn&&<div className="t-fn" style={{background:fn.color+'18',color:fn.color,border:`1px solid ${fn.color}30`}}>{fn.degree}</div>}
                <ChordDiagram symbol={t.chord} compact/>
              </div>
            );
          })
        }
      </div>
    );
  }
  return(
    <div className="lyric-line">
      {tokens.map((t,i)=><Token key={i} token={t} keyRoot={keyRoot} level={level} onChordClick={onChordClick}/>)}
    </div>
  );
}

// ─── VIEWER ───────────────────────────────────────────────────────────────────
function Viewer({songMeta,level,onBack}){
  const [score,setScore]=useState(null);
  const [loading,setLoading]=useState(true);
  const [popup,setPopup]=useState(null);
  const [activeSec,setActiveSec]=useState(null);

  useEffect(()=>{
    setLoading(true);
    fetchScore(songMeta.storage_path)
      .then(d=>{setScore(d);setLoading(false);})
      .catch(()=>setLoading(false));
  },[songMeta.id]);

  const lClass=['','ap','in','pr'][level];
  const lLabel=['','Aprendiz','Intermediário','Profissional'][level];
  const lColor=['','var(--ap-c)','var(--in-c)','var(--pr-c)'][level];
  const TIPS={
    1:{title:'🎵 Modo Aprendiz',text:'Toque em qualquer acorde para ver o diagrama e entender sua função. Observe os rótulos: Repouso, Tensão, Preparo.'},
    2:{title:'🎼 Modo Intermediário',text:'Os graus harmônicos (I, IV, V...) estão indicados. Use o mapa formal para navegar entre as seções.'},
    3:{title:'🎓 Modo Profissional',text:'Análise harmônica completa com cadências detectadas. Observe funções, cadências e empréstimos modais.'},
  };

  const sections=score?.sections||[];
  const cadences=level===3?detectCadences(sections,songMeta.key_root):[];
  const visible=activeSec?sections.filter(s=>s.id===activeSec||s.label===activeSec):sections;

  if(loading)return<div className="loading">Carregando partitura…</div>;
  if(!score) return<div className="loading">Erro ao carregar. Verifique o Storage.</div>;

  return(
    <div className="viewer anim">
      {popup&&<ChordPopup symbol={popup} keyRoot={songMeta.key_root} level={level} onClose={()=>setPopup(null)}/>}
      <div className="song-header">
        <div>
          <div className="song-header-title">{score.title||songMeta.title}</div>
          <div className="song-header-composer">{score.composer||songMeta.composer}</div>
          <div className="song-header-meta">
            <span className="meta-pill" style={{color:lColor,borderColor:lColor+'60',background:lColor+'10'}}>{lLabel}</span>
            <span className="meta-pill tag key">{songMeta.key}</span>
            <span className="meta-pill">{songMeta.meter}</span>
            {songMeta.bpm&&<span className="meta-pill">♩ = {songMeta.bpm}</span>}
          </div>
        </div>
        <button className="back-btn" onClick={onBack}>← Biblioteca</button>
      </div>

      <div className={`info-panel ${lClass}`}>
        <h4>{TIPS[level].title}</h4>{TIPS[level].text}
      </div>

      {level>=2&&sections.length>1&&(
        <div className="form-map">
          <span className="form-pill lbl">FORMA:</span>
          <div className={`form-pill${!activeSec?' active':''}`} onClick={()=>setActiveSec(null)}>Tudo</div>
          {sections.map((s,i)=>(
            <div key={i} className={`form-pill${activeSec===s.id?' active':''}`} onClick={()=>setActiveSec(activeSec===s.id?null:s.id)}>{s.label}</div>
          ))}
        </div>
      )}

      {level===3&&cadences.length>0&&(
        <div className="analysis-panel">
          <div className="analysis-title">Cadências detectadas</div>
          {cadences.map((c,i)=>(
            <div key={i} className="cad-row">
              <span className="cad-chord">{c.from}</span>
              <span style={{color:'var(--text3)'}}>→</span>
              <span className="cad-chord">{c.to}</span>
              <span className="cad-type">{c.type}</span>
              <span className="cad-desc">{c.desc}</span>
            </div>
          ))}
        </div>
      )}

      {visible.map((sec,si)=>{
        const isInstr=sec.lines?.every(l=>l.every(t=>!t.text||t.text===''));
        return(
          <div key={si} className="section-block">
            <div className="section-label">{sec.label}</div>
            {level>=2&&!isInstr&&(
              <div className="beat-ruler">
                {(songMeta.meter==='4/4'?['1 — forte','2 — fraco','3 — meio','4 — fraco']:['1 — forte','2 — fraco','3 — fraco'])
                  .map((b,i)=><div key={i} className={`beat-cell${(i===0||(i===2&&songMeta.meter==='4/4'))?' strong':''}`}>{b}</div>)}
              </div>
            )}
            {sec.lines?.map((line,li)=>(
              <LyricLine key={li} tokens={line} isInstr={isInstr} keyRoot={songMeta.key_root} level={level} onChordClick={setPopup}/>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── LIBRARY ──────────────────────────────────────────────────────────────────
function Library({onSelect}){
  const [songs,setSongs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('');

  useEffect(()=>{
    fetchSongs()
      .then(d=>{setSongs(Array.isArray(d)?d:[]);setLoading(false);})
      .catch(()=>setLoading(false));
  },[]);

  const filtered=songs.filter(s=>
    !filter||s.title.toLowerCase().includes(filter.toLowerCase())||
    s.composer?.toLowerCase().includes(filter.toLowerCase())||
    s.key?.toLowerCase().includes(filter.toLowerCase())||
    s.tags?.some(t=>t.toLowerCase().includes(filter.toLowerCase()))
  );

  return(
    <div className="library anim">
      <div className="lib-title">Biblioteca de Louvores</div>
      <div className="lib-sub">Escolha um louvor para estudar</div>
      {songs.length>4&&(
        <input placeholder="Buscar por título, tonalidade ou estilo…" value={filter} onChange={e=>setFilter(e.target.value)}
          style={{width:'100%',padding:'10px 14px',border:'1px solid var(--border2)',borderRadius:8,fontFamily:'inherit',fontSize:15,background:'var(--surface)',color:'var(--text)',marginBottom:20,outline:'none'}}/>
      )}
      {loading&&<div className="loading">Carregando biblioteca…</div>}
      {filtered.map(song=>(
        <div key={song.id} className="song-card" onClick={()=>onSelect(song)}>
          <div className="song-icon">🎵</div>
          <div className="song-info">
            <div className="song-title">{song.title}</div>
            <div className="song-meta-line">{song.composer}</div>
            <div className="song-tags">
              <span className="tag key">{song.key}</span>
              <span className="tag">{song.meter}</span>
              {song.tags?.map((t,i)=><span key={i} className="tag">{t}</span>)}
              <span className="tag" style={{marginLeft:'auto'}}>
                <span className="diff-dots">{[1,2,3].map(d=><span key={d} className={`diff-dot${d<=(song.difficulty||1)?' on':''}`}/>)}</span>
              </span>
            </div>
          </div>
        </div>
      ))}
      {!loading&&filtered.length===0&&(
        <div style={{textAlign:'center',color:'var(--text3)',fontSize:16,padding:'40px 0',fontStyle:'italic'}}>Nenhum louvor encontrado.</div>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App(){
  const [view,setView]=useState('library');
  const [selected,setSelected]=useState(null);
  const [level,setLevel]=useState(1);
  const openSong=useCallback(s=>{setSelected(s);setView('viewer');},[]);
  const goLib=useCallback(()=>{setView('library');setSelected(null);},[]);
  return(
    <><style>{css}</style>
    <div className="app">
      <nav className="nav">
        <span className="nav-logo" onClick={goLib}>INSTRUMENTISTAS</span>
        <span className="nav-sep"/>
        {view==='viewer'&&<button className="nav-btn" onClick={goLib}>Biblioteca</button>}
      </nav>
      {view==='viewer'&&selected&&(
        <div className="level-bar">
          {[1,2,3].map(l=>(
            <button key={l} className={`level-btn${level===l?' active':''}`} onClick={()=>setLevel(l)}>
              {['Aprendiz','Intermediário','Profissional'][l-1]}
              <span>Nível {l}</span>
            </button>
          ))}
        </div>
      )}
      {view==='library'&&<Library onSelect={openSong}/>}
      {view==='viewer'&&selected&&<Viewer key={`${selected.id}-${level}`} songMeta={selected} level={level} onBack={goLib}/>}
    </div></>
  );
}
