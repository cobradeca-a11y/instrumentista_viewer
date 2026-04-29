import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SB_URL  = "https://ehjnepbxelqyqspgdwii.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoam5lcGJ4ZWxxeXFzcGdkd2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzgxNjYsImV4cCI6MjA5MzA1NDE2Nn0.U4ysFz93srI_bWmDZ76hsBRTILRT86gNrk5Ibt0X1l0";
const ST_BASE = `${SB_URL}/storage/v1/object/public/scores`;

const fetchSongs = () =>
  fetch(`${SB_URL}/rest/v1/songs?select=id,title,composer,key,key_root,key_mode,meter,bpm,difficulty,tags,storage_path&published=eq.true&order=title`,
    { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` }}).then(r => r.json());

const fetchScore = (path) =>
  fetch(`${ST_BASE}/${path.replace("scores/", "")}`).then(r => r.json());

// ─── MUSIC ENGINE ─────────────────────────────────────────────────────────────
const MAJOR_INT = [0,2,4,5,7,9,11];
const NOTE_MAP  = {C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
const NOTE_SH   = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

const DEG = [
  {d:"I",   fn:"Repouso",   c:"#22c55e", bg:"#052e16"},
  {d:"II",  fn:"Preparo",   c:"#60a5fa", bg:"#1e3a5f"},
  {d:"III", fn:"Coloração", c:"#22d3ee", bg:"#0c2a32"},
  {d:"IV",  fn:"Preparo",   c:"#60a5fa", bg:"#1e3a5f"},
  {d:"V",   fn:"Tensão",    c:"#f87171", bg:"#3b0a0a"},
  {d:"VI",  fn:"Relativa",  c:"#4ade80", bg:"#052e16"},
  {d:"VII", fn:"Tensão",    c:"#f87171", bg:"#3b0a0a"},
];

const FN_COL = {
  "Repouso":  {c:"#22c55e", bg:"#052e16"},
  "Tensão":   {c:"#f87171", bg:"#3b0a0a"},
  "Preparo":  {c:"#60a5fa", bg:"#1e3a5f"},
  "Relativa": {c:"#4ade80", bg:"#052e16"},
  "Coloração":{c:"#22d3ee", bg:"#0c2a32"},
  "Empréstimo":{c:"#c084fc",bg:"#2d1b4e"},
  "Cromático":{c:"#94a3b8", bg:"#1e293b"},
};

function parseRoot(s){ const m=s?.match(/^([A-G][b#]?)/); return m?m[1]:null; }

function getChordType(s){
  const r=s.replace(/^[A-G][b#]?/,"");
  if(r.match(/m(7|aj)?b5|ø/)) return "half_dim";
  if(r.match(/dim|°/))         return "dim";
  if(r.match(/^m7/))           return "m7";
  if(r.match(/^m/))            return "m";
  if(r.match(/Maj7|maj7|M7/)) return "Maj7";
  if(r.match(/^7/))            return "dom7";
  if(r.match(/sus[24]/))       return "sus";
  if(r.match(/^9/))            return "dom9";
  return "maj";
}

const TYPE_LBL = {
  maj:"Acorde Maior", m:"Acorde Menor", dom7:"Dominante c/ 7ª", m7:"Menor c/ 7ª",
  Maj7:"7ª Maior (Maj7)", dim:"Diminuto", half_dim:"Meio-Diminuto",
  sus:"Suspenso", dom9:"Nona Dom.",
};

function getHF(sym, kr){
  const r=parseRoot(sym);
  if(!r||!kr) return null;
  const iv=((NOTE_MAP[r]??0)-(NOTE_MAP[kr]??0)+12)%12;
  const i=MAJOR_INT.indexOf(iv);
  if(i===-1){
    if(iv===10) return {d:"bVII",fn:"Empréstimo",c:"#c084fc",bg:"#2d1b4e"};
    if(iv=== 8) return {d:"bVI", fn:"Empréstimo",c:"#c084fc",bg:"#2d1b4e"};
    if(iv=== 3) return {d:"bIII",fn:"Empréstimo",c:"#c084fc",bg:"#2d1b4e"};
    return {d:"?",fn:"Cromático",c:"#94a3b8",bg:"#1e293b"};
  }
  return DEG[i];
}

const CAD_PAT = [
  {f:"V",   t:"I",  type:"Autêntica",    desc:"V → I — Tensão resolve no Repouso. A cadência mais forte."},
  {f:"IV",  t:"I",  type:"Plagal",       desc:'IV → I — O "Amém" da harmonia. Muito presente nos louvores.'},
  {f:"V",   t:"VI", type:"Interrompida", desc:"V → VI — Surpresa: vai para a relativa em vez da tônica."},
  {f:"I",   t:"V",  type:"Suspensiva",   desc:"I → V — Abre tensão. Comum no fim de estrofes."},
  {f:"II",  t:"V",  type:"II→V",         desc:"II → V — Preparação da dominante. Progressão de quartas."},
  {f:"bVII",t:"I",  type:"Modal",        desc:"bVII → I — Empréstimo modal. Frequente no gospel."},
];

function detectCadences(sections, kr){
  const found=[];
  sections?.forEach(s=>s.lines?.forEach(l=>{
    const chs=l.filter(t=>t.chord).map(t=>({sym:t.chord,hf:getHF(t.chord,kr)}));
    for(let i=0;i<chs.length-1;i++){
      const a=chs[i],b=chs[i+1];
      if(!a.hf||!b.hf) continue;
      for(const p of CAD_PAT)
        if(a.hf.d===p.f&&b.hf.d===p.t&&!found.find(x=>x.type===p.type))
          found.push({...p,from:a.sym,to:b.sym});
    }
  }));
  return found;
}

// ─── DIAGRAMS ────────────────────────────────────────────────────────────────
const DIAG={
  C:[-1,3,2,0,1,0], D:[-1,-1,0,2,3,2], E:[0,2,2,1,0,0],
  G:[3,2,0,0,0,3],  A:[-1,0,2,2,2,0],  F:[1,1,2,3,3,1],
  Am:[-1,0,2,2,1,0],Em:[0,2,2,0,0,0],  Dm:[-1,-1,0,2,3,1],
  Bm:[-1,2,4,4,3,2],G7:[3,2,0,0,0,1],  C7:[-1,3,2,3,1,0],
  D7:[-1,-1,0,2,1,2],A7:[-1,0,2,0,2,0],E7:[0,2,0,1,0,0],
  Cm:[-1,3,5,5,4,3], Fm:[1,1,3,3,2,1], Bb:[-1,1,3,3,3,1],
  Ab:[4,4,6,6,6,4],  Eb:[-1,-1,5,3,4,3],Bb7:[-1,1,0,1,3,1],
  Am7:[-1,0,2,0,1,0],Em7:[0,2,2,0,3,0],Dm7:[-1,-1,0,2,1,1],
};
const BARRE={F:1,Bm:2,Cm:3,Fm:1,Bb:1,Ab:4};

function ChordSVG({symbol, size=36}){
  const root=parseRoot(symbol);
  const frets=DIAG[symbol]||DIAG[root];
  if(!frets) return(
    <div style={{width:size*3.5,height:size*3,display:"flex",alignItems:"center",
      justifyContent:"center",fontSize:11,color:"#64748b",fontStyle:"italic"}}>—</div>
  );
  const barre=BARRE[symbol]||0;
  const valid=frets.filter(f=>f>0);
  if(!valid.length) return null;
  const dMin=barre>0?barre:Math.max(1,Math.min(...valid));
  const sw=size*0.7,sh=size*0.62,pad=size*0.3,dotR=size*0.17;
  const W=5*sw+pad*2,H=4*sh+pad*2+18;
  return(
    <svg width={W} height={H} style={{display:"block"}}>
      {dMin<=1
        ?<rect x={pad} y={pad+16} width={5*sw} height={3} fill="#e2e8f0"/>
        :<text x={pad-4} y={pad+22} textAnchor="end" fontSize={9} fill="#64748b">{dMin}fr</text>}
      {[0,1,2,3,4,5].map(i=><line key={i} x1={pad+i*sw} y1={pad+16} x2={pad+i*sw} y2={pad+16+4*sh} stroke="#334155" strokeWidth={1.5}/>)}
      {[0,1,2,3,4].map(i=><line key={i} x1={pad} y1={pad+16+i*sh} x2={pad+5*sw} y2={pad+16+i*sh} stroke="#1e293b" strokeWidth={1}/>)}
      {frets.map((f,i)=>{
        const x=pad+(5-i)*sw;
        if(f===-1) return<text key={i} x={x} y={pad+12} textAnchor="middle" fontSize={11} fill="#475569">×</text>;
        if(f===0)  return<text key={i} x={x} y={pad+12} textAnchor="middle" fontSize={11} fill="#22c55e">○</text>;
        return null;
      })}
      {barre>0&&<rect x={pad} y={pad+16+(barre-dMin)*sh+sh*0.16} width={5*sw} height={sh*0.68} rx={dotR} fill="#f0b429" opacity={0.9}/>}
      {frets.map((f,i)=>{
        if(f<=0||(barre>0&&f===barre)) return null;
        return<circle key={i} cx={pad+(5-i)*sw} cy={pad+16+(f-dMin)*sh+sh/2} r={dotR} fill="#f0b429"/>;
      })}
      <text x={W/2} y={H-1} textAnchor="middle" fontSize={9} fill="#64748b" fontFamily="sans-serif">{symbol}</text>
    </svg>
  );
}

// ─── PIANO SVG ───────────────────────────────────────────────────────────────
const PIANO_INT={maj:[0,4,7],m:[0,3,7],dom7:[0,4,7,10],m7:[0,3,7,10],Maj7:[0,4,7,11],dim:[0,3,6],half_dim:[0,3,6,10],sus:[0,5,7],dom9:[0,4,7,10,14]};

function PianoSVG({symbol}){
  const root=parseRoot(symbol);
  const type=getChordType(symbol);
  const rN=NOTE_MAP[root]??0;
  const notes=(PIANO_INT[type]||[0,4,7]).map(i=>(rN+i)%12);
  const whites=[0,2,4,5,7,9,11];
  const W=180,H=70,kW=W/14;
  return(
    <svg width={W} height={H+14}>
      {[...Array(14)].map((_,i)=>{
        const n=whites[i%7];
        return<rect key={i} x={i*kW} y={0} width={kW-1} height={H}
          fill={notes.includes(n)?"#f0b429":"#1e293b"} stroke="#0f172a" strokeWidth={0.5} rx={2}/>;
      })}
      {[0,1,2,3,4,5,6].flatMap(wi=>{
        const bMap={0:1,1:3,3:6,4:8,5:10};
        const bn=bMap[wi%7];
        if(bn===undefined) return [];
        return[<rect key={`b${wi}`} x={wi*kW+kW*0.65} y={0} width={kW*0.6} height={H*0.6}
          fill={notes.includes(bn)?"#f0b429":"#0f172a"} rx={1}/>];
      })}
      <text x={W/2} y={H+12} textAnchor="middle" fontSize={9} fill="#64748b">
        {notes.map(n=>NOTE_SH[n]).join(" – ")}
      </text>
    </svg>
  );
}

// ─── METRONOME ───────────────────────────────────────────────────────────────
function Metronome({bpm=80, meter="4/4"}){
  const [beat,setBeat]=useState(-1);
  const [on,setOn]=useState(false);
  const ref=useRef();
  const beats=parseInt(meter)||4;
  useEffect(()=>{
    if(on){ ref.current=setInterval(()=>setBeat(b=>(b+1)%beats),60000/bpm); }
    else{ clearInterval(ref.current); setBeat(-1); }
    return()=>clearInterval(ref.current);
  },[on,bpm,beats]);
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20,padding:"24px 0"}}>
      <div style={{display:"flex",gap:12}}>
        {[...Array(beats)].map((_,i)=>(
          <div key={i} style={{
            width:48,height:48,borderRadius:"50%",
            background:on&&beat===i?(i===0?"#f0b429":"#fbbf24"):"#1e293b",
            border:`2px solid ${i===0?"#f0b429":"#334155"}`,
            transition:"background 0.06s",boxShadow:on&&beat===i?"0 0 16px #f0b42966":"none",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:15,fontWeight:700,color:on&&beat===i?"#0f172a":"#475569"
          }}>{i+1}</div>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <button onClick={()=>setOn(o=>!o)} style={{
          padding:"12px 36px",borderRadius:30,border:"none",
          background:on?"#ef4444":"#f0b429",color:"#0f172a",
          fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer",
          boxShadow:on?"0 0 20px #ef444466":"0 0 20px #f0b42966",
          transition:"all 0.2s"
        }}>{on?"⏹ Parar":"▶ Iniciar"}</button>
        <span style={{fontSize:14,color:"#94a3b8"}}>♩ = {bpm}</span>
      </div>
      <p style={{fontSize:12,color:"#475569",textAlign:"center",lineHeight:1.6,maxWidth:280}}>
        O ponto 1 é o tempo forte. Pratique sempre abaixo do tempo real antes de acelerar.
      </p>
    </div>
  );
}

// ─── HARMONIC FIELD ──────────────────────────────────────────────────────────
function buildField(kr, minor=false){
  const sc=minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];
  const tr=minor?["m","dim","maj","m","m","maj","maj"]:["maj","m","m","maj","maj","m","dim"];
  const fn=["Repouso","Preparo","Coloração","Preparo","Tensão","Relativa","Tensão"];
  const lb=["I","II","III","IV","V","VI","VII"];
  const rN=NOTE_MAP[kr]??0;
  return sc.map((iv,i)=>{
    const n=NOTE_SH[(rN+iv)%12];
    const t=tr[i];
    return{degree:lb[i],note:n,chord:t==="m"?n+"m":t==="dim"?n+"°":n,type:t,fn:fn[i]};
  });
}

function HarmonicField({kr, km, onChord}){
  const field=buildField(kr, km==="minor");
  return(
    <div>
      <p style={{fontSize:13,color:"#94a3b8",marginBottom:16,lineHeight:1.6}}>
        Os 7 acordes da tonalidade de <span style={{color:"#f0b429",fontWeight:700}}>{kr} {km==="minor"?"Menor":"Maior"}</span>.
        Clique para ver o diagrama.
      </p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {field.map((g,i)=>{
          const col=FN_COL[g.fn]||{c:"#94a3b8",bg:"#1e293b"};
          return(
            <div key={i} onClick={()=>onChord&&onChord(g.chord)}
              style={{cursor:"pointer",borderRadius:10,border:`1px solid ${col.c}30`,
                background:col.bg,padding:"12px 16px",textAlign:"center",minWidth:72,
                transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=col.c;e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=col.c+"30";e.currentTarget.style.transform="";}}
            >
              <div style={{fontSize:10,color:col.c,fontWeight:700,letterSpacing:"0.5px",marginBottom:4}}>{g.degree}</div>
              <div style={{fontSize:18,fontWeight:700,color:"#f0f4f8",fontFamily:"'Libre Baskerville',serif"}}>{g.chord}</div>
              <div style={{fontSize:10,color:col.c,marginTop:4}}>{g.fn}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MODAL SCALES ────────────────────────────────────────────────────────────
const MODES=[
  {name:"Jônico",   gr:"I",  iv:[0,2,4,5,7,9,11],c:"#22c55e",desc:"Escala maior. Luminoso, estável, alegre. Base do repertório de louvor."},
  {name:"Dórico",   gr:"II", iv:[0,2,3,5,7,9,10], c:"#60a5fa",desc:"Menor c/ 6ª maior. Som gospel/soul. Muito presente no louvor contemporâneo."},
  {name:"Frígio",   gr:"III",iv:[0,1,3,5,7,8,10], c:"#c084fc",desc:"Menor c/ 2ª menor. Dramático e intenso. Raro nos louvores, muito expressivo."},
  {name:"Lídio",    gr:"IV", iv:[0,2,4,6,7,9,11], c:"#f0b429",desc:"Maior c/ 4ª aumentada. Flutuante e etéreo. Presente em músicas de adoração."},
  {name:"Mixolídio",gr:"V",  iv:[0,2,4,5,7,9,10], c:"#fb923c",desc:"Maior c/ 7ª menor. Blues/rock gospel. Frequente nos louvores modernos."},
  {name:"Eólio",    gr:"VI", iv:[0,2,3,5,7,8,10], c:"#94a3b8",desc:"Menor natural. Base do menor clássico. Muitos louvores de adoração profunda."},
  {name:"Lócrio",   gr:"VII",iv:[0,1,3,5,7,8,10], c:"#f87171",desc:"Diminuto. Máxima instabilidade. Raramente usado como centro tonal."},
];

function ModalScales({kr}){
  const [sel,setSel]=useState(0);
  const m=MODES[sel];
  const rN=NOTE_MAP[kr]??0;
  const notes=m.iv.map(iv=>NOTE_SH[(rN+iv)%12]);
  return(
    <div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {MODES.map((md,i)=>(
          <button key={i} onClick={()=>setSel(i)} style={{
            padding:"6px 12px",borderRadius:20,border:`1px solid ${md.c}50`,
            background:sel===i?md.c+"22":"transparent",
            color:sel===i?md.c:"#64748b",
            fontFamily:"inherit",fontSize:12,cursor:"pointer",transition:"all 0.15s"
          }}>{md.gr} {md.name}</button>
        ))}
      </div>
      <div style={{background:m.c+"12",border:`1px solid ${m.c}30`,borderRadius:12,padding:18}}>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {notes.map((n,i)=>(
            <div key={i} style={{
              width:42,height:42,borderRadius:8,
              background:i===0?m.c+"30":"#0f172a",
              border:`1px solid ${i===0?m.c:m.c+"30"}`,
              color:i===0?m.c:"#94a3b8",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontWeight:700,fontSize:13,fontFamily:"'Libre Baskerville',serif"
            }}>{n}</div>
          ))}
        </div>
        <p style={{fontSize:13,color:"#94a3b8",lineHeight:1.6}}>
          <span style={{color:m.c,fontWeight:700}}>{m.name} de {kr}:</span> {m.desc}
        </p>
      </div>
    </div>
  );
}

// ─── RHYTHM TABLE ────────────────────────────────────────────────────────────
function RhythmTable({level}){
  const FIGS=[
    {name:"Semibreve",   beats:4,   sym:"𝅝",  desc:"1 compasso inteiro"},
    {name:"Mínima",      beats:2,   sym:"𝅗𝅥", desc:"½ compasso"},
    {name:"Semínima",    beats:1,   sym:"♩",  desc:"1 tempo (referência)"},
    {name:"Colcheia",    beats:0.5, sym:"♪",  desc:"½ tempo"},
    {name:"Semicolcheia",beats:0.25,sym:"𝅘𝅥𝅯",desc:"¼ tempo"},
  ];
  const vis=level===1?FIGS.slice(0,4):FIGS;
  return(
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead>
        <tr>
          {["Figura","Símbolo","Tempos","Equivalência"].map(h=>(
            <th key={h} style={{padding:"8px 12px",textAlign:"left",borderBottom:"1px solid #1e293b",
              color:"#475569",fontSize:11,textTransform:"uppercase",letterSpacing:"0.5px"}}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {vis.map((f,i)=>(
          <tr key={i} style={{borderBottom:"1px solid #0f172a"}}>
            <td style={{padding:"10px 12px",color:"#e2e8f0",fontWeight:600}}>{f.name}</td>
            <td style={{padding:"10px 12px",fontSize:20,textAlign:"center",color:"#f0b429"}}>{f.sym}</td>
            <td style={{padding:"10px 12px"}}>
              <div style={{display:"flex",gap:3}}>
                {[0,1,2,3].map(j=>(
                  <div key={j} style={{width:16,height:16,borderRadius:4,
                    background:j<f.beats?"#f0b429":"#1e293b",
                    opacity:j<f.beats&&j>=Math.floor(f.beats)?0.3:1}}/>
                ))}
              </div>
            </td>
            <td style={{padding:"10px 12px",color:"#64748b",fontSize:12}}>{f.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── CHORD POPUP ─────────────────────────────────────────────────────────────
function ChordPopup({symbol, kr, level, onClose}){
  const hf=getHF(symbol,kr);
  const type=getChordType(symbol);
  const col=hf?{c:hf.c,bg:hf.bg}:{c:"#94a3b8",bg:"#1e293b"};
  const [tab,setTab]=useState("violao");
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:400,
      background:"rgba(0,0,0,0.75)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#0f172a",border:"1px solid #1e293b",borderRadius:20,
        padding:28,maxWidth:380,width:"100%",
        boxShadow:"0 32px 80px rgba(0,0,0,0.6)",
        animation:"popIn 0.2s ease"
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:40,fontWeight:700,
              color:"#f0b429",lineHeight:1}}>{symbol}</div>
            <div style={{fontSize:13,color:"#64748b",marginTop:4}}>{TYPE_LBL[type]||type}</div>
          </div>
          {hf&&(
            <div style={{padding:"6px 14px",borderRadius:20,background:col.bg,
              color:col.c,fontSize:13,fontWeight:700,border:`1px solid ${col.c}40`}}>
              {hf.d} — {hf.fn}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:18}}>
          {["violao","piano"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1,padding:"8px",borderRadius:10,
              border:`1px solid ${tab===t?"#f0b429":"#1e293b"}`,
              background:tab===t?"#1e293b":"transparent",
              color:tab===t?"#f0b429":"#475569",
              fontFamily:"inherit",fontSize:13,cursor:"pointer"
            }}>{t==="violao"?"🎸 Violão":"🎹 Teclado"}</button>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 18px"}}>
          {tab==="violao"?<ChordSVG symbol={symbol} size={42}/>:<PianoSVG symbol={symbol}/>}
        </div>
        {hf&&(
          <div style={{background:col.bg,borderRadius:12,padding:14,fontSize:13,
            color:"#94a3b8",lineHeight:1.6,marginBottom:18,border:`1px solid ${col.c}20`}}>
            <span style={{color:col.c,fontWeight:700}}>{hf.fn}.</span>{" "}
            {hf.fn==="Repouso"&&"A música chegou. Sensação de estabilidade e conclusão."}
            {hf.fn==="Tensão"&&"A música quer continuar. Cria expectativa de resolução."}
            {hf.fn==="Preparo"&&"A música se afasta da tônica antes de resolver."}
            {hf.fn==="Relativa"&&"Coloração entre repouso e melancolia. Zona da tônica."}
            {hf.fn==="Coloração"&&"Cor harmônica suave. Zona de estabilidade."}
            {hf.fn==="Empréstimo"&&"Acorde de outro modo. Cria colorido especial."}
            {level>=2&&<><br/><span style={{color:"#64748b"}}>Grau {hf.d} em {kr}.</span></>}
          </div>
        )}
        <button onClick={onClose} style={{width:"100%",padding:"12px",
          background:"#1e293b",color:"#e2e8f0",border:"1px solid #334155",
          borderRadius:12,fontFamily:"inherit",fontSize:14,cursor:"pointer"}}>
          Fechar
        </button>
      </div>
    </div>
  );
}

// ─── TOKEN (Cifra Club style) ─────────────────────────────────────────────────
function Token({tok, kr, level, onChord}){
  const hf=tok.chord?getHF(tok.chord,kr):null;
  const col=hf?{c:hf.c,bg:hf.bg}:null;
  const hasDash=tok.text?.endsWith("-");
  const text=tok.text?.replace(/[-]$/,"").replace(/^"/,"")||"";
  return(
    <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",
      marginRight:4,marginBottom:8,verticalAlign:"bottom"}}>
      {/* function label — level 1 */}
      {level===1&&(
        <div style={{fontSize:8,textTransform:"uppercase",letterSpacing:"0.4px",
          padding:"1px 5px",borderRadius:8,marginBottom:2,minHeight:13,whiteSpace:"nowrap",
          fontWeight:700,background:col?col.bg:"transparent",color:col?col.c:"transparent",
          border:col?`1px solid ${col.c}20`:"1px solid transparent"}}>
          {hf?.fn||""}
        </div>
      )}
      {/* degree — level 2+ */}
      {level>=2&&(
        <div style={{fontSize:10,fontWeight:700,fontFamily:"monospace",minHeight:14,
          marginBottom:1,color:hf?col.c:"transparent",letterSpacing:"0.3px"}}>
          {hf?.d||"·"}
        </div>
      )}
      {/* chord */}
      <div onClick={tok.chord?()=>onChord(tok.chord):undefined} style={{
        fontFamily:"'Libre Baskerville',serif",fontSize:15,fontWeight:700,
        color:tok.chord?"#f0b429":"transparent",minHeight:20,lineHeight:1,
        marginBottom:5,cursor:tok.chord?"pointer":"default",
        padding:"1px 3px",borderRadius:4,
        transition:"color 0.15s, background 0.15s",
      }} onMouseEnter={e=>{if(tok.chord){e.currentTarget.style.background="#f0b42920";}}}
         onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
        {tok.chord||"·"}
      </div>
      {/* syllable */}
      {text?(
        <div style={{fontSize:17,color:"#e2e8f0",lineHeight:1,whiteSpace:"nowrap",
          fontWeight:tok.chord?600:400}}>
          {text}{hasDash&&<span style={{color:"#334155"}}>-</span>}
        </div>
      ):<div style={{width:6}}/>}
    </div>
  );
}

// ─── SECTION BADGE ───────────────────────────────────────────────────────────
const SEC_COLORS={
  "Introdução":{c:"#94a3b8",bg:"#1e293b"},
  "Intro":     {c:"#94a3b8",bg:"#1e293b"},
  "Verso 1":   {c:"#60a5fa",bg:"#1e3a5f"},
  "Verso 2":   {c:"#60a5fa",bg:"#1e3a5f"},
  "Verso":     {c:"#60a5fa",bg:"#1e3a5f"},
  "Pré-Refrão":{c:"#fb923c",bg:"#431407"},
  "Refrão":    {c:"#f0b429",bg:"#422006"},
  "Ponte":     {c:"#c084fc",bg:"#2d1b4e"},
  "Coda":      {c:"#22c55e",bg:"#052e16"},
  "Linear":    {c:"#94a3b8",bg:"#1e293b"},
};

// ─── CIFRA VIEW ──────────────────────────────────────────────────────────────
function CifraView({sections, kr, level, onChord, meter}){
  const beats=parseInt(meter)||4;
  const beatLbls=beats===4?["1","2","3","4"]:["1","2","3"];
  return(
    <div style={{padding:"4px 0"}}>
      {sections.map((sec,si)=>{
        const sc=SEC_COLORS[sec.label]||{c:"#94a3b8",bg:"#1e293b"};
        const isInstr=sec.lines?.every(l=>l.every(t=>!t.text||t.text===""));
        return(
          <div key={si} style={{marginBottom:28}}>
            {/* Section badge */}
            <div style={{display:"inline-flex",alignItems:"center",
              background:sc.bg,border:`1px solid ${sc.c}40`,
              borderRadius:6,padding:"3px 10px",marginBottom:14}}>
              <span style={{fontSize:12,fontWeight:700,color:sc.c,letterSpacing:"0.3px"}}>{sec.label}</span>
            </div>

            {isInstr?(
              /* Instrumental */
              <div style={{display:"flex",flexWrap:"wrap",gap:20,
                padding:"16px 20px",background:"#0f172a",borderRadius:10,
                border:"1px solid #1e293b",alignItems:"center",minHeight:64}}>
                {sec.lines?.flatMap(l=>l.filter(t=>t.chord)).length===0
                  ?<span style={{color:"#334155",fontStyle:"italic",fontSize:14}}>seção instrumental</span>
                  :sec.lines?.flatMap(l=>l.filter(t=>t.chord)).map((t,i)=>{
                    const hf=getHF(t.chord,kr);
                    const col=hf?{c:hf.c,bg:hf.bg}:{c:"#64748b",bg:"#1e293b"};
                    return(
                      <div key={i} onClick={()=>onChord(t.chord)}
                        style={{display:"flex",flexDirection:"column",alignItems:"center",
                          gap:6,cursor:"pointer"}}>
                        <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:18,
                          fontWeight:700,color:"#f0b429"}}>{t.chord}</div>
                        {level>=2&&hf&&(
                          <div style={{fontSize:9,padding:"1px 6px",borderRadius:8,
                            background:col.bg,color:col.c,fontWeight:700}}>{hf.d}</div>
                        )}
                        <ChordSVG symbol={t.chord} size={26}/>
                      </div>
                    );
                  })
                }
              </div>
            ):(
              /* Lyric lines */
              sec.lines?.map((line,li)=>(
                <div key={li} style={{marginBottom:10}}>
                  {level>=2&&(
                    <div style={{display:"flex",padding:"3px 0",marginBottom:2}}>
                      {beatLbls.map((b,i)=>(
                        <div key={i} style={{flex:1,fontSize:10,textAlign:"center",
                          color:i===0||i===2?"#475569":"#334155",fontFamily:"monospace",
                          fontWeight:i===0?"700":"400"}}>
                          {i===0?"▼":b}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{display:"flex",flexWrap:"wrap",alignItems:"flex-end",
                    padding:"12px 16px",background:"#0f172a",borderRadius:10,
                    border:"1px solid #1e293b",minHeight:70}}>
                    {line.map((t,i)=>(
                      <Token key={i} tok={t} kr={kr} level={level} onChord={onChord}/>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── PEDAGOGICAL PANEL ───────────────────────────────────────────────────────
function PedaPanel({mod, sections, kr, km, meter, bpm, level, onChord}){
  const cads=detectCadences(sections,kr);

  // Card wrapper
  const Card=({children,title,sub})=>(
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:14,
      padding:"20px 22px",marginBottom:16}}>
      {title&&<div style={{fontSize:15,fontWeight:700,color:"#e2e8f0",
        fontFamily:"'Libre Baskerville',serif",marginBottom:sub?4:16}}>{title}</div>}
      {sub&&<div style={{fontSize:13,color:"#64748b",marginBottom:16,lineHeight:1.6}}>{sub}</div>}
      {children}
    </div>
  );

  // Info row
  const InfoRow=({label,value,color="#f0b429"})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
      padding:"10px 0",borderBottom:"1px solid #1e293b"}}>
      <span style={{fontSize:13,color:"#64748b"}}>{label}</span>
      <span style={{fontSize:13,fontWeight:700,color}}>{value}</span>
    </div>
  );

  switch(mod){

    case "funcoes": return(
      <Card title="Funções Harmônicas"
        sub="Cada acorde tem uma função. Aprenda a sentir antes de memorizar os nomes.">
        {[
          {fn:"Repouso", d:"I",  desc:'A música "chegou". Estabilidade e conclusão.'},
          {fn:"Tensão",  d:"V",  desc:'A música "quer continuar". Suspensão e expectativa.'},
          {fn:"Preparo", d:"IV", desc:'Afastamento da tônica. Cria profundidade antes da cadência.'},
          {fn:"Relativa",d:"VI", desc:"Coloração suave entre repouso e melancolia."},
          {fn:"Empréstimo",d:"bVII",desc:"Acorde de outro modo. Colorido especial."},
        ].map((f,i)=>{
          const col=FN_COL[f.fn]||{c:"#94a3b8",bg:"#1e293b"};
          return(
            <div key={i} style={{display:"flex",gap:14,padding:"12px 0",
              borderBottom:"1px solid #0f172a",alignItems:"flex-start"}}>
              <div style={{padding:"4px 10px",borderRadius:8,background:col.bg,
                border:`1px solid ${col.c}30`,fontSize:11,fontWeight:700,
                color:col.c,whiteSpace:"nowrap",minWidth:48,textAlign:"center"}}>{f.d}</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:col.c,marginBottom:3}}>{f.fn}</div>
                <div style={{fontSize:13,color:"#64748b",lineHeight:1.5}}>{f.desc}</div>
              </div>
            </div>
          );
        })}
      </Card>
    );

    case "acordes": {
      const unique=[...new Set(sections.flatMap(s=>s.lines?.flatMap(l=>l.filter(t=>t.chord).map(t=>t.chord))||[]))];
      return(
        <Card title="Acordes desta música"
          sub="Toque em qualquer acorde para ver o diagrama completo.">
          <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
            {unique.map((ch,i)=>{
              const hf=getHF(ch,kr);
              const col=hf?{c:hf.c,bg:hf.bg}:{c:"#64748b",bg:"#1e293b"};
              return(
                <div key={i} onClick={()=>onChord(ch)}
                  style={{cursor:"pointer",background:"#1e293b",border:`1px solid #334155`,
                    borderRadius:12,padding:"14px 16px",textAlign:"center",minWidth:80,
                    transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#f0b429";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#334155";e.currentTarget.style.transform="";}}>
                  <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:18,
                    fontWeight:700,color:"#f0b429",marginBottom:8}}>{ch}</div>
                  <ChordSVG symbol={ch} size={30}/>
                  {hf&&<div style={{marginTop:8,fontSize:9,padding:"2px 8px",borderRadius:8,
                    background:col.bg,color:col.c,border:`1px solid ${col.c}20`,
                    display:"inline-block"}}>{hf.fn}</div>}
                </div>
              );
            })}
          </div>
        </Card>
      );
    }

    case "ritmo": return(
      <Card title="Figuras Rítmicas"
        sub={`Compasso ${meter} — a semínima (♩) vale 1 tempo. BPM: ${bpm||"—"}`}>
        <RhythmTable level={level}/>
        <div style={{marginTop:16,display:"flex",gap:6}}>
          {[...Array(parseInt(meter)||4)].map((_,i)=>(
            <div key={i} style={{flex:1,height:44,borderRadius:8,display:"flex",
              alignItems:"center",justifyContent:"center",
              background:i===0?"#f0b429"+"22":i===2&&(parseInt(meter)||4)===4?"#f0b429"+"12":"#1e293b",
              border:`1px solid ${i===0?"#f0b429"+"60":"#334155"}`,
              color:i===0?"#f0b429":"#475569",fontWeight:700,fontSize:14}}>
              {i+1}
            </div>
          ))}
        </div>
      </Card>
    );

    case "forma": return(
      <Card title="Forma Musical"
        sub="Mapa estrutural desta música. Identifique cada seção antes de tocar.">
        {sections.map((s,i)=>{
          const sc=SEC_COLORS[s.label]||{c:"#94a3b8",bg:"#1e293b"};
          const chords=[...new Set(s.lines?.flatMap(l=>l.filter(t=>t.chord).map(t=>t.chord))||[])];
          return(
            <div key={i} style={{padding:"12px 0",borderBottom:"1px solid #0f172a"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:sc.c}}/>
                <span style={{fontWeight:700,color:sc.c,fontSize:14}}>{s.label}</span>
                <span style={{fontSize:12,color:"#334155"}}>{chords.length} acorde(s)</span>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {chords.map((ch,j)=>(
                  <span key={j} style={{fontSize:12,padding:"2px 8px",borderRadius:6,
                    background:"#1e293b",border:"1px solid #334155",
                    fontFamily:"'Libre Baskerville',serif",color:"#e2e8f0",fontWeight:700}}>{ch}</span>
                ))}
              </div>
            </div>
          );
        })}
      </Card>
    );

    case "metro": return(
      <Card title="Metrônomo">
        <Metronome bpm={parseInt(bpm)||80} meter={meter}/>
      </Card>
    );

    case "campo": return(
      <Card title="Campo Harmônico"
        sub={`Os 7 acordes da tonalidade de ${kr} ${km==="minor"?"Menor":"Maior"}.`}>
        <HarmonicField kr={kr} km={km} onChord={onChord}/>
      </Card>
    );

    case "cadencias": return(
      <div>
        <Card title="Cadências detectadas nesta música"
          sub="Progressões harmônicas que criam pontos de chegada ou partida.">
          {cads.length===0
            ?<p style={{color:"#334155",fontStyle:"italic",fontSize:13}}>Nenhuma cadência detectada.</p>
            :cads.map((c,i)=>{
              const COL_MAP={Autêntica:"#22c55e",Plagal:"#60a5fa",Interrompida:"#c084fc",
                Suspensiva:"#f87171","II→V":"#22d3ee",Modal:"#c084fc"};
              const col=COL_MAP[c.type]||"#94a3b8";
              return(
                <div key={i} style={{padding:"12px 14px",borderRadius:10,
                  border:`1px solid ${col}30`,background:col+"0a",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'Libre Baskerville',serif",fontWeight:700,
                      color:"#f0b429",fontSize:16}}>{c.from}</span>
                    <span style={{color:"#334155",fontSize:18}}>→</span>
                    <span style={{fontFamily:"'Libre Baskerville',serif",fontWeight:700,
                      color:"#f0b429",fontSize:16}}>{c.to}</span>
                    <span style={{fontSize:11,padding:"2px 10px",borderRadius:20,
                      background:col+"22",color:col,border:`1px solid ${col}40`,fontWeight:700}}>{c.type}</span>
                  </div>
                  <p style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>{c.desc}</p>
                </div>
              );
            })
          }
        </Card>
        <Card title="Guia de cadências">
          {CAD_PAT.map((p,i)=>(
            <div key={i} style={{padding:"8px 0",borderBottom:"1px solid #0f172a",
              display:"flex",gap:10,fontSize:12}}>
              <span style={{color:"#f0b429",fontWeight:700,minWidth:80}}>{p.type}:</span>
              <span style={{color:"#64748b",lineHeight:1.5}}>{p.f}→{p.t} — {p.desc.split("—")[1]?.trim()||p.desc}</span>
            </div>
          ))}
        </Card>
      </div>
    );

    case "escala": return(
      <Card title="Escala e Graus"
        sub="Cada grau da escala origina um acorde do campo harmônico.">
        {(() => {
          const field=buildField(kr, km==="minor");
          const gn=["Tônica","2ª","3ª","4ª","5ª","6ª","7ª"];
          return(
            <div style={{display:"flex",gap:4}}>
              {field.map((g,i)=>{
                const col=FN_COL[g.fn]||{c:"#94a3b8",bg:"#1e293b"};
                return(
                  <div key={i} style={{flex:1,padding:"10px 4px",background:"#1e293b",
                    borderRadius:8,border:`1px solid ${col.c}20`,textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#475569",marginBottom:4}}>{gn[i]}</div>
                    <div style={{fontWeight:700,color:col.c,fontSize:14,
                      fontFamily:"'Libre Baskerville',serif"}}>{g.note}</div>
                    <div style={{fontSize:9,color:"#334155",marginTop:4}}>{g.degree}</div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Card>
    );

    case "analise": return(
      <div>
        <Card title="Análise Harmônica"
          sub="Todos os acordes com grau, função, sílaba e beat de entrada.">
          {sections.map((sec,si)=>{
            const chords=sec.lines?.flatMap(l=>l.filter(t=>t.chord))||[];
            if(!chords.length) return null;
            const sc=SEC_COLORS[sec.label]||{c:"#94a3b8",bg:"#1e293b"};
            return(
              <div key={si} style={{marginBottom:20}}>
                <div style={{display:"inline-flex",alignItems:"center",background:sc.bg,
                  border:`1px solid ${sc.c}40`,borderRadius:6,padding:"2px 10px",marginBottom:10}}>
                  <span style={{fontSize:11,fontWeight:700,color:sc.c}}>{sec.label}</span>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr>
                        {["Acorde","Grau","Função","Sílaba","Beat"].map(h=>(
                          <th key={h} style={{padding:"6px 10px",textAlign:"left",
                            borderBottom:"1px solid #1e293b",color:"#334155",
                            fontSize:10,textTransform:"uppercase"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chords.map((t,i)=>{
                        const hf=getHF(t.chord,kr);
                        const col=hf?{c:hf.c,bg:hf.bg}:{c:"#64748b",bg:"#1e293b"};
                        return(
                          <tr key={i} style={{borderBottom:"1px solid #0f172a"}}>
                            <td style={{padding:"7px 10px",fontFamily:"'Libre Baskerville',serif",
                              fontWeight:700,color:"#f0b429"}}>{t.chord}</td>
                            <td style={{padding:"7px 10px",fontWeight:700,color:col.c}}>{hf?.d||"?"}</td>
                            <td style={{padding:"7px 10px"}}>
                              <span style={{fontSize:10,padding:"2px 8px",borderRadius:8,
                                background:col.bg,color:col.c}}>{hf?.fn||"—"}</span>
                            </td>
                            <td style={{padding:"7px 10px",color:"#64748b"}}>{t.text||"—"}</td>
                            <td style={{padding:"7px 10px",color:"#334155"}}>{t.beat||"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    );

    case "modos": return(
      <Card title="Modos Eclesiásticos"
        sub="Escalas que nascem de cada grau da escala maior. Cada modo tem uma cor sonora distinta.">
        <ModalScales kr={kr}/>
      </Card>
    );

    case "vozes": return(
      <Card title="Condução de Vozes"
        sub="Ao trocar de acorde, mova cada nota o mínimo possível.">
        {(() => {
          const chords=[...new Set(sections.flatMap(s=>s.lines?.flatMap(l=>l.filter(t=>t.chord).map(t=>t.chord))||[]))].slice(0,8);
          return(
            <div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                {chords.map((ch,i)=>{
                  const hf=getHF(ch,kr);
                  const col=hf?{c:hf.c,bg:hf.bg}:{c:"#64748b",bg:"#1e293b"};
                  return(
                    <div key={i} style={{padding:"8px 14px",borderRadius:8,
                      background:col.bg,border:`1px solid ${col.c}30`,textAlign:"center"}}>
                      <div style={{fontSize:9,color:col.c,marginBottom:2}}>{hf?.d||"?"}</div>
                      <div style={{fontFamily:"'Libre Baskerville',serif",fontWeight:700,
                        color:"#f0f4f8"}}>{ch}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{background:"#1e293b",borderRadius:10,padding:14,fontSize:13,
                color:"#64748b",lineHeight:1.8,border:"1px solid #334155"}}>
                <span style={{color:"#e2e8f0",fontWeight:700}}>Exemplo — C → Am:</span><br/>
                C = Dó + <span style={{color:"#22c55e"}}>Mi + Sol</span><br/>
                Am = Lá + <span style={{color:"#22c55e"}}>Dó + Mi</span><br/>
                <span style={{color:"#22c55e"}}>Mi e Dó permanecem. Apenas Sol → Lá. Movimento mínimo.</span>
              </div>
            </div>
          );
        })()}
      </Card>
    );

    case "rearmoniz": return(
      <Card title="Reharmonização"
        sub="Substituição de trítono: qualquer dominante pode ser substituído pelo acorde a 6 semitons.">
        {(() => {
          const chords=[...new Set(sections.flatMap(s=>s.lines?.flatMap(l=>l.filter(t=>t.chord).map(t=>t.chord))||[]))].slice(0,7);
          return(
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>
                  {["Acorde","Função","Substituto","Efeito"].map(h=>(
                    <th key={h} style={{padding:"7px 10px",textAlign:"left",
                      borderBottom:"1px solid #1e293b",color:"#334155",
                      fontSize:10,textTransform:"uppercase"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chords.map((ch,i)=>{
                  const hf=getHF(ch,kr);
                  const t=getChordType(ch);
                  const r=parseRoot(ch);
                  const sub=t==="dom7"||t==="dom9"?NOTE_SH[((NOTE_MAP[r]??0)+6)%12]+"7":null;
                  const col=hf?{c:hf.c}:{c:"#64748b"};
                  return(
                    <tr key={i} style={{borderBottom:"1px solid #0f172a"}}>
                      <td style={{padding:"8px 10px",fontFamily:"'Libre Baskerville',serif",
                        fontWeight:700,color:"#f0b429"}}>{ch}</td>
                      <td style={{padding:"8px 10px",color:col.c,fontWeight:600}}>{hf?.fn||"—"}</td>
                      <td style={{padding:"8px 10px",fontFamily:"'Libre Baskerville',serif",
                        color:"#c084fc",fontWeight:700}}>{sub||"—"}</td>
                      <td style={{padding:"8px 10px",fontSize:11,color:"#475569"}}>
                        {sub?"Resolução cromática desc.":"Não aplicável"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        })()}
      </Card>
    );

    default: return null;
  }
}

// ─── MODULE DEFINITIONS ──────────────────────────────────────────────────────
const MODS={
  1:[
    {id:"cifra",  icon:"♪", label:"Cifra"},
    {id:"funcoes",icon:"🎯",label:"Funções Harm."},
    {id:"acordes",icon:"🖐",label:"Acordes"},
    {id:"ritmo",  icon:"🥁",label:"Ritmo"},
    {id:"forma",  icon:"🗺",label:"Forma"},
    {id:"metro",  icon:"⏱",label:"Metrônomo"},
  ],
  2:[
    {id:"cifra",    icon:"♪", label:"Cifra"},
    {id:"campo",    icon:"🧲",label:"Campo Harm."},
    {id:"cadencias",icon:"🔀",label:"Cadências"},
    {id:"escala",   icon:"📐",label:"Escala"},
    {id:"ritmo",    icon:"🥁",label:"Ritmo"},
    {id:"metro",    icon:"⏱",label:"Metrônomo"},
  ],
  3:[
    {id:"cifra",   icon:"♪", label:"Cifra"},
    {id:"analise", icon:"🔬",label:"Análise Harm."},
    {id:"modos",   icon:"🌀",label:"Modos"},
    {id:"vozes",   icon:"🎼",label:"Cond. Vozes"},
    {id:"rearmoniz",icon:"✏️",label:"Reharmoniz."},
    {id:"campo",   icon:"🧲",label:"Campo Harm."},
  ],
};

// ─── VIEWER ──────────────────────────────────────────────────────────────────
function Viewer({meta, level, onBack}){
  const [score,  setScore]  = useState(null);
  const [loading,setLoading]= useState(true);
  const [mod,    setMod]    = useState("cifra");
  const [popup,  setPopup]  = useState(null);

  useEffect(()=>{
    setLoading(true); setMod("cifra");
    fetchScore(meta.storage_path)
      .then(d=>{setScore(d);setLoading(false);})
      .catch(()=>setLoading(false));
  },[meta.id]);

  const mods=MODS[level]||MODS[1];
  const lC=["","#f0b429","#60a5fa","#c084fc"][level];
  const lLbl=["","Aprendiz","Intermediário","Profissional"][level];
  const secs=score?.sections||[];

  if(loading) return(
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
      color:"#475569",fontSize:16,fontStyle:"italic"}}>Carregando partitura…</div>
  );
  if(!score) return(
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
      color:"#ef4444",fontSize:15}}>Erro ao carregar. Verifique o Storage.</div>
  );

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {popup&&<ChordPopup symbol={popup} kr={meta.key_root} level={level} onClose={()=>setPopup(null)}/>}

      {/* Top bar */}
      <div style={{background:"#0f172a",borderBottom:"1px solid #1e293b",
        padding:"12px 20px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#94a3b8",
          fontSize:22,cursor:"pointer",lineHeight:1,padding:0}}>‹</button>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:18,fontWeight:700,
            color:"#f0b429"}}>{score.title||meta.title}</div>
          {meta.composer&&<div style={{fontSize:12,color:"#475569",marginTop:1}}>{meta.composer}</div>}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{fontSize:12,padding:"4px 12px",borderRadius:20,
            background:lC+"20",color:lC,border:`1px solid ${lC}40`,fontWeight:700}}>{lLbl}</div>
          <div style={{fontSize:12,padding:"4px 12px",borderRadius:20,
            background:"#1e293b",color:"#94a3b8",border:"1px solid #334155"}}>
            Tom: {meta.key}
          </div>
        </div>
      </div>

      {/* Module tabs */}
      <div style={{background:"#0f172a",borderBottom:"1px solid #1e293b",
        padding:"0 16px",display:"flex",gap:2,overflowX:"auto",flexShrink:0}}>
        {mods.map(m=>(
          <button key={m.id} onClick={()=>setMod(m.id)} style={{
            display:"flex",alignItems:"center",gap:6,padding:"12px 16px",
            border:"none",borderBottom:`2px solid ${mod===m.id?lC:"transparent"}`,
            background:"transparent",color:mod===m.id?lC:"#475569",
            fontFamily:"inherit",fontSize:13,cursor:"pointer",
            whiteSpace:"nowrap",transition:"all 0.15s",
            fontWeight:mod===m.id?700:400
          }}>
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 20px 80px"}}>
        {mod==="cifra"?(
          <CifraView sections={secs} kr={meta.key_root} level={level}
            onChord={setPopup} meter={meta.meter}/>
        ):(
          <PedaPanel mod={mod} sections={secs} kr={meta.key_root} km={meta.key_mode}
            meter={meta.meter} bpm={meta.bpm} level={level} onChord={setPopup}/>
        )}
      </div>
    </div>
  );
}

// ─── LIBRARY ─────────────────────────────────────────────────────────────────
function Library({onSelect, level, setLevel, progress}){
  const [songs,  setSongs]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [filter, setFilter] = useState("");

  useEffect(()=>{
    fetchSongs().then(d=>{setSongs(Array.isArray(d)?d:[]);setLoading(false);}).catch(()=>setLoading(false));
  },[]);

  const filtered=songs.filter(s=>!filter||
    s.title?.toLowerCase().includes(filter.toLowerCase())||
    s.key?.toLowerCase().includes(filter.toLowerCase())||
    s.tags?.some(t=>t.toLowerCase().includes(filter.toLowerCase()))
  );

  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 20px 80px"}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:24,fontWeight:700,
          color:"#e2e8f0",marginBottom:4}}>Biblioteca de Louvores</div>
        <div style={{fontSize:14,color:"#475569",marginBottom:20,fontStyle:"italic"}}>
          Escolha um louvor para estudar
        </div>
        <input placeholder="Buscar por título, tonalidade ou estilo…" value={filter}
          onChange={e=>setFilter(e.target.value)} style={{
            width:"100%",padding:"12px 16px",border:"1px solid #1e293b",borderRadius:10,
            fontFamily:"inherit",fontSize:14,background:"#0f172a",color:"#e2e8f0",
            marginBottom:20,outline:"none"
          }}/>
        {loading&&<div style={{color:"#334155",textAlign:"center",padding:"40px 0",fontStyle:"italic"}}>
          Carregando…
        </div>}
        {filtered.map(song=>(
          <div key={song.id} onClick={()=>onSelect(song)}
            style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,
              padding:"16px 18px",marginBottom:10,cursor:"pointer",
              display:"flex",alignItems:"center",gap:14,transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#f0b429";e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e293b";e.currentTarget.style.transform="";}}>
            <div style={{width:44,height:44,borderRadius:10,background:"#1e293b",
              border:"1px solid #334155",display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:20,flexShrink:0}}>🎵</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:16,
                fontWeight:700,color:"#e2e8f0"}}>{song.title}</div>
              {song.composer&&<div style={{fontSize:12,color:"#334155",marginTop:1}}>{song.composer}</div>}
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,
                  background:"#f0b429"+"20",color:"#f0b429",border:"1px solid #f0b429"+"40"}}>{song.key}</span>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,
                  background:"#1e293b",color:"#475569",border:"1px solid #334155"}}>{song.meter}</span>
                {song.tags?.map((t,i)=>(
                  <span key={i} style={{fontSize:11,padding:"2px 8px",borderRadius:20,
                    background:"#1e293b",color:"#475569",border:"1px solid #334155"}}>{t}</span>
                ))}
                <div style={{marginLeft:"auto",display:"flex",gap:3}}>
                  {[1,2,3].map(d=>(
                    <div key={d} style={{width:7,height:7,borderRadius:"50%",
                      background:d<=(song.difficulty||1)?"#f0b429":"#1e293b",
                      border:`1px solid ${d<=(song.difficulty||1)?"#f0b429":"#334155"}`}}/>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {!loading&&filtered.length===0&&(
          <div style={{textAlign:"center",color:"#334155",fontStyle:"italic",padding:"40px 0"}}>
            Nenhum louvor encontrado.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({view, setView, level, setLevel, progress}){
  const lC=["","#f0b429","#60a5fa","#c084fc"][level];
  const nav=[
    {id:"library", icon:"♪",  label:"Músicas"},
    {id:"progress",icon:"📊", label:"Progresso"},
  ];
  const lvls=[
    {l:1,label:"Aprendiz",    c:"#f0b429"},
    {l:2,label:"Intermediário",c:"#60a5fa"},
    {l:3,label:"Profissional", c:"#c084fc"},
  ];
  return(
    <div style={{width:80,background:"#070d17",borderRight:"1px solid #1e293b",
      display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 0",
      flexShrink:0,gap:4}}>
      {/* Logo */}
      <div style={{width:44,height:44,borderRadius:12,background:"#f0b429",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:20,marginBottom:12,fontWeight:700,color:"#0f172a"}}>𝄞</div>

      {nav.map(n=>(
        <button key={n.id} onClick={()=>setView(n.id)} style={{
          width:56,height:56,borderRadius:12,border:"none",
          background:view===n.id?"#1e293b":"transparent",
          color:view===n.id?"#e2e8f0":"#334155",
          cursor:"pointer",transition:"all 0.15s",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          gap:3,fontSize:20
        }}>
          <span>{n.icon}</span>
          <span style={{fontSize:9,fontFamily:"sans-serif"}}>{n.label}</span>
        </button>
      ))}

      <div style={{flex:1}}/>

      {/* Level selector */}
      <div style={{padding:"8px 0",borderTop:"1px solid #1e293b",width:"100%",
        display:"flex",flexDirection:"column",alignItems:"center",gap:4,paddingTop:12}}>
        {lvls.map(lv=>(
          <button key={lv.l} onClick={()=>setLevel(lv.l)} style={{
            width:48,height:48,borderRadius:10,border:`1px solid ${level===lv.l?lv.c+"60":"transparent"}`,
            background:level===lv.l?lv.c+"18":"transparent",
            color:level===lv.l?lv.c:"#334155",
            cursor:"pointer",fontSize:11,fontWeight:700,
            fontFamily:"sans-serif",transition:"all 0.15s",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2
          }}>
            <span style={{fontSize:14}}>{lv.l}</span>
            <span style={{fontSize:7,letterSpacing:"0px"}}>{lv.label.slice(0,3).toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* Progress ring */}
      <div style={{marginTop:12,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <svg width={44} height={44}>
          <circle cx={22} cy={22} r={18} fill="none" stroke="#1e293b" strokeWidth={4}/>
          <circle cx={22} cy={22} r={18} fill="none" stroke={lC} strokeWidth={4}
            strokeDasharray={`${2*Math.PI*18*progress/100} ${2*Math.PI*18}`}
            strokeLinecap="round" transform="rotate(-90 22 22)"/>
          <text x={22} y={27} textAnchor="middle" fontSize={10} fill={lC} fontWeight="700">{progress}%</text>
        </svg>
        <span style={{fontSize:9,color:"#334155",fontFamily:"sans-serif"}}>progresso</span>
      </div>
    </div>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;overflow:hidden}
body{background:#070d17;font-family:'Crimson Pro',Georgia,serif;color:#e2e8f0;-webkit-font-smoothing:antialiased}
@keyframes popIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
button{transition:all 0.15s}
`;

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [view,    setView]    = useState("library");
  const [song,    setSong]    = useState(null);
  const [level,   setLevel]   = useState(1);
  const [progress]            = useState(42);

  const openSong=useCallback(s=>{setSong(s);setView("viewer");},[]);
  const goLib   =useCallback(()=>{setView("library");setSong(null);},[]);

  const handleNav=(v)=>{
    if(v==="library") goLib();
    else setView(v);
  };

  return(
    <>
      <style>{CSS}</style>
      <div style={{height:"100%",display:"flex"}}>
        <Sidebar view={view==="viewer"?"library":view} setView={handleNav}
          level={level} setLevel={setLevel} progress={progress}/>

        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {view==="library"&&(
            <Library onSelect={openSong} level={level} setLevel={setLevel} progress={progress}/>
          )}
          {view==="viewer"&&song&&(
            <Viewer key={`${song.id}-${level}`} meta={song} level={level} onBack={goLib}/>
          )}
          {view==="progress"&&(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
              flexDirection:"column",gap:16}}>
              <div style={{fontSize:48}}>📊</div>
              <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:20,color:"#e2e8f0"}}>
                Progresso do Aluno
              </div>
              <div style={{fontSize:14,color:"#475569"}}>Em desenvolvimento</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
