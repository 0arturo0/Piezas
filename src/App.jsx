import { useState, useEffect, useRef } from "react";

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (ms) => {
const h  = Math.floor(ms / 3600000);
const m  = Math.floor((ms % 3600000) / 60000);
const s  = Math.floor((ms % 60000) / 1000);
const cs = Math.floor((ms % 1000) / 10);
if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(cs).padStart(2,"0")}`;
};
const fmtShort = (ms) => {
if (!ms) return "—";
const m  = Math.floor(ms / 60000);
const s  = Math.floor((ms % 60000) / 1000);
const cs = Math.floor((ms % 1000) / 10);
return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(cs).padStart(2,"0")}`;
};
const mean = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
const uid  = () => Math.random().toString(36).slice(2,9);

const calcPPH    = (ms, oee) => ms ? (3600000/ms)*(oee/100) : 0;
const calcOutput = (ms, oee, h) => ms ? Math.floor(calcPPH(ms,oee)*h) : 0;

// ── Palette ────────────────────────────────────────────────────────────────
const APPLE_COLORS = [
{ name:"Azul",   val:"#007AFF" },
{ name:"Verde",  val:"#34C759" },
{ name:"Rojo",   val:"#FF3B30" },
{ name:"Naranja",val:"#FF9500" },
{ name:"Morado", val:"#AF52DE" },
{ name:"Rosa",   val:"#FF2D55" },
{ name:"Cian",   val:"#5AC8FA" },
{ name:"Amarillo",val:"#FFCC00"},
];
const STATION_COLORS = ["#007AFF","#34C759","#FF9500","#AF52DE","#FF2D55","#5AC8FA","#FF3B30","#FFCC00"];

// ── Seed data ──────────────────────────────────────────────────────────────
const L1 = uid(), L2 = uid();
const INIT_LINES = [
{ id:L1, name:"Línea A", color:"#007AFF", oee:85, hours:8, order:0 },
{ id:L2, name:"Línea B", color:"#34C759", oee:78, hours:8, order:1 },
];
const INIT_STATIONS = [
{ id:uid(), name:"EST-01", lineId:L1, laps:[], color:"#007AFF", order:0 },
{ id:uid(), name:"EST-02", lineId:L1, laps:[], color:"#34C759", order:1 },
{ id:uid(), name:"EST-03", lineId:L2, laps:[], color:"#FF9500", order:0 },
];

// ── Tokens ─────────────────────────────────────────────────────────────────
const T = {
bg:         "#F2F2F7",
card:       "rgba(255,255,255,0.80)",
cardSolid:  "#FFFFFF",
separator:  "rgba(60,60,67,0.12)",
label:      "#3C3C43",
secondary:  "rgba(60,60,67,0.60)",
tertiary:   "rgba(60,60,67,0.30)",
fill:       "rgba(120,120,128,0.16)",
fillSec:    "rgba(120,120,128,0.12)",
blue:       "#007AFF",
green:      "#34C759",
red:        "#FF3B30",
orange:     "#FF9500",
purple:     "#AF52DE",
yellow:     "#FFCC00",
font:       "-apple-system, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
};

// ── Reusable micro-components ──────────────────────────────────────────────
const Card = ({children, style={}}) => (
  <div style={{
    background: T.card,
    borderRadius: 16,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    overflow: "hidden",
    ...style,
  }}>{children}</div>
);

const SectionHeader = ({title, action, onAction}) => (
  <div style={{
    display:"flex", justifyContent:"space-between", alignItems:"baseline",
    padding:"18px 20px 6px",
  }}>
    <span style={{fontSize:13,fontWeight:600,color:T.secondary,letterSpacing:0.2,textTransform:"uppercase"}}>
      {title}
    </span>
    {action && (
      <button onClick={onAction} style={{
        background:"none",border:"none",color:T.blue,fontSize:15,fontWeight:500,
        cursor:"pointer",padding:0,fontFamily:T.font,
      }}>{action}</button>
    )}
  </div>
);

const Row = ({left, right, sep=true, onPress, destructive=false}) => (
  <div onClick={onPress} style={{
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"11px 16px", cursor:onPress?"pointer":"default",
    borderBottom: sep ? `1px solid ${T.separator}` : "none",
    background: onPress?"transparent":undefined,
    transition:"background 0.15s",
  }}
    onMouseDown={e=>onPress&&(e.currentTarget.style.background=T.fill)}
    onMouseUp={e=>onPress&&(e.currentTarget.style.background="transparent")}
    onTouchStart={e=>onPress&&(e.currentTarget.style.background=T.fill)}
    onTouchEnd={e=>onPress&&(e.currentTarget.style.background="transparent")}
  >
    <span style={{fontSize:17,color:destructive?T.red:T.label,fontWeight:400}}>{left}</span>
    <div style={{display:"flex",alignItems:"center",gap:6,color:T.secondary}}>
      {right}
      {onPress && <span style={{fontSize:11,color:T.tertiary}}>›</span>}
    </div>
  </div>
);

const Pill = ({label, active, color, onClick}) => (
<button onClick={onClick} style={{
padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer",
background: active ? color : T.fill,
color: active ? "#fff" : T.label,
fontSize:14, fontWeight:500, fontFamily:T.font,
transition:"all 0.18s",
flexShrink:0,
}}>{label}</button>
);

const NumStepper = ({value, onChange, min=0, max=100, step=1, unit=""}) => (
  <div style={{display:"flex",alignItems:"center",gap:10}}>
    <button onClick={()=>onChange(Math.max(min,value-step))} style={{
      width:32,height:32,borderRadius:16,border:"none",background:T.fill,
      color:T.label,fontSize:20,lineHeight:1,cursor:"pointer",fontFamily:T.font,
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>−</button>
    <span style={{fontSize:17,fontWeight:600,color:T.label,minWidth:48,textAlign:"center"}}>
      {value}{unit}
    </span>
    <button onClick={()=>onChange(Math.min(max,value+step))} style={{
      width:32,height:32,borderRadius:16,border:"none",background:T.fill,
      color:T.label,fontSize:20,lineHeight:1,cursor:"pointer",fontFamily:T.font,
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>+</button>
  </div>
);

// ── Gauge ring (SVG) ───────────────────────────────────────────────────────
const Ring = ({pct, color, size=60, stroke=5}) => {
const r = (size-stroke*2)/2;
const circ = 2*Math.PI*r;
const dash = (pct/100)*circ;
return (
<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
<circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.fill} strokeWidth={stroke}/>
<circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
style={{transition:"stroke-dasharray 0.5s ease"}}/>
</svg>
);
};

// ── Modal sheet (bottom) ───────────────────────────────────────────────────
const Sheet = ({open, onClose, title, children}) => {
if (!open) return null;
return (
<div style={{
position:"fixed",inset:0,zIndex:200,
background:"rgba(0,0,0,0.35)",
backdropFilter:"blur(6px)",
display:"flex",alignItems:"flex-end",
}} onClick={onClose}>
<div onClick={e=>e.stopPropagation()} style={{
background:T.cardSolid,borderRadius:"20px 20px 0 0",
width:"100%",maxWidth:500,margin:"0 auto",
paddingBottom:34,maxHeight:"85vh",overflowY:"auto",
}}>
<div style={{
width:36,height:4,borderRadius:2,background:T.tertiary,
margin:"10px auto 0",
}}/>
<div style={{
display:"flex",alignItems:"center",justifyContent:"space-between",
padding:"14px 20px 10px",borderBottom:`1px solid ${T.separator}`,
}}>
<span style={{fontSize:17,fontWeight:600,color:T.label}}>{title}</span>
<button onClick={onClose} style={{
background:T.fill,border:"none",color:T.secondary,
width:28,height:28,borderRadius:14,fontSize:14,cursor:"pointer",
display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.font,
}}>✕</button>
</div>
{children}
</div>
</div>
);
};

// ══════════════════════════════════════════════════════════════════════════
export default function App() {
const [view,   setView]   = useState("Cronómetro");
const [lines,  setLines]  = useState(INIT_LINES);
const [stations,setStations]=useState(INIT_STATIONS);

// timer
const [activeSt, setActiveSt] = useState(null);
const [running,  setRunning]  = useState(false);
const [elapsed,  setElapsed]  = useState(0);
const [startTs,  setStartTs]  = useState(null);
const [lapTs,    setLapTs]    = useState(null);
const [curLap,   setCurLap]   = useState(0);
const iRef = useRef(null);

// sheets
const [sheetLine,    setSheetLine]    = useState(null);
const [sheetAddLine, setSheetAddLine] = useState(false);
const [sheetAddSt,   setSheetAddSt]   = useState(null);
const [sheetEditSt,  setSheetEditSt]  = useState(null);
const [sheetEditLn,  setSheetEditLn]  = useState(null);
const [newName,      setNewName]      = useState("");
const [newLineName,  setNewLineName]  = useState("");
const [newLineColor, setNewLineColor] = useState(APPLE_COLORS[0].val);
const [newLineOee,   setNewLineOee]   = useState(85);
const [newLineHrs,   setNewLineHrs]   = useState(8);

// ── Timer ────────────────────────────────────────────────────────────────
useEffect(()=>{
if(running){
iRef.current=setInterval(()=>{
setElapsed(Date.now()-startTs);
setCurLap(Date.now()-lapTs);
},50);
} else clearInterval(iRef.current);
return ()=>clearInterval(iRef.current);
},[running,startTs,lapTs]);

const tStart=()=>{
const n=Date.now();
setStartTs(n-elapsed); setLapTs(n-curLap); setRunning(true);
};
const tPause=()=>setRunning(false);
const tReset=()=>{setRunning(false);setElapsed(0);setCurLap(0);setStartTs(null);setLapTs(null);};
const tLap=()=>{
if(!activeSt||!running) return;
const t=curLap;
setStations(s=>s.map(x=>x.id===activeSt?{...x,laps:[...x.laps,{id:uid(),time:t,ts:new Date().toLocaleTimeString()}]}:x));
setLapTs(Date.now()); setCurLap(0);
};

// ── Line ops ─────────────────────────────────────────────────────────────
const addLine=()=>{
if(!newLineName.trim()) return;
setLines(l=>[...l,{id:uid(),name:newLineName.trim(),color:newLineColor,oee:newLineOee,hours:newLineHrs,order:l.length}]);
setSheetAddLine(false); setNewLineName(""); setNewLineColor(APPLE_COLORS[0].val); setNewLineOee(85); setNewLineHrs(8);
};
const updateLine=(id,field,val)=>setLines(l=>l.map(x=>x.id===id?{...x,[field]:val}:x));
const deleteLine=(id)=>{setLines(l=>l.filter(x=>x.id!==id));setStations(s=>s.filter(x=>x.lineId!==id));};
const reorderLine=(id,dir)=>setLines(prev=>{
const sorted=[...prev].sort((a,b)=>a.order-b.order);
const i=sorted.findIndex(x=>x.id===id), ni=i+dir;
if(ni<0||ni>=sorted.length) return prev;
const sid=sorted[ni].id;
return prev.map(x=>x.id===id?{...x,order:sorted[ni].order}:x.id===sid?{...x,order:sorted[i].order}:x);
});

// ── Station ops ──────────────────────────────────────────────────────────
const addStation=(lineId)=>{
if(!newName.trim()) return;
const peers=stations.filter(s=>s.lineId===lineId);
const col=STATION_COLORS[stations.length%STATION_COLORS.length];
setStations(s=>[...s,{id:uid(),name:newName.trim(),lineId,laps:[],color:col,order:peers.length}]);
setSheetAddSt(null); setNewName("");
};
const updateStation=(id,field,val)=>setStations(s=>s.map(x=>x.id===id?{...x,[field]:val}:x));
const deleteStation=(id)=>{setStations(s=>s.filter(x=>x.id!==id));if(activeSt===id)setActiveSt(null);};
const clearLaps=(id)=>setStations(s=>s.map(x=>x.id===id?{...x,laps:[]}:x));
const reorderSt=(id,dir)=>setStations(prev=>{
const st=prev.find(x=>x.id===id);
const peers=prev.filter(x=>x.lineId===st.lineId).sort((a,b)=>a.order-b.order);
const i=peers.findIndex(x=>x.id===id), ni=i+dir;
if(ni<0||ni>=peers.length) return prev;
const sid=peers[ni].id;
return prev.map(x=>x.id===id?{...x,order:peers[ni].order}:x.id===sid?{...x,order:peers[i].order}:x);
});
const moveStToLine=(id,lineId)=>setStations(s=>s.map(x=>x.id===id?{...x,lineId,order:s.filter(y=>y.lineId===lineId).length}:x));

// ── Derived ───────────────────────────────────────────────────────────────
const sortedLines   = [...lines].sort((a,b)=>a.order-b.order);
const stOf          = (lid)=>[...stations].filter(s=>s.lineId===lid).sort((a,b)=>a.order-b.order);
const lineOf        = (lid)=>lines.find(l=>l.id===lid);
const activeStObj   = stations.find(s=>s.id===activeSt);
const editingLine   = lines.find(l=>l.id===sheetEditLn);
const editingStObj  = stations.find(s=>s.id===sheetEditSt);
const oeeLineSheet  = lines.find(l=>l.id===sheetLine);

// ══════════════════════════════════════════════════════════════════════════
// CRONÓMETRO
// ══════════════════════════════════════════════════════════════════════════
const renderCrono = () => {
const laps   = activeStObj?.laps ?? [];
const line   = activeStObj ? lineOf(activeStObj.lineId) : null;
const avgT   = mean(laps.map(l=>l.time));
const minT   = laps.length ? Math.min(...laps.map(l=>l.time)) : 0;
const maxT   = laps.length ? Math.max(...laps.map(l=>l.time)) : 0;
const oee    = line?.oee ?? 0;
const hours  = line?.hours ?? 8;
const pph    = calcPPH(avgT, oee);
const outT   = calcOutput(avgT, oee, hours);
const ac     = activeStObj?.color ?? T.blue;

return (
  <div className="view-container">
    {/* ── Big clock ── */}
    <div style={{
      background:T.cardSolid, margin:"16px 16px 0", borderRadius:22,
      padding:"28px 20px 22px", textAlign:"center",
      boxShadow:"0 2px 16px rgba(0,0,0,0.08)",
    }}>
      <div style={{
        fontSize:72, fontWeight:200, letterSpacing:-3,
        color:running ? ac : T.label, lineHeight:1,
        fontVariantNumeric:"tabular-nums",
        transition:"color 0.3s",
      }}>{fmt(elapsed)}</div>

      {activeStObj && (
        <div style={{marginTop:6,color:T.secondary,fontSize:17,fontWeight:400}}>
          Vuelta actual &nbsp;
          <span style={{color:ac,fontWeight:600}}>{fmtShort(curLap)}</span>
        </div>
      )}

      {activeStObj && laps.length>0 && (
        <div style={{
          display:"flex",gap:10,justifyContent:"center",marginTop:14,
        }}>
          {[
            {v:pph.toFixed(1), l:"pz/hora",  c:ac},
            {v:outT,           l:"pz/turno",  c:T.green},
          ].map(({v,l,c})=>(
            <div key={l} style={{
              background:T.fill, borderRadius:14,
              padding:"8px 18px", textAlign:"center",
            }}>
              <div style={{fontSize:22,fontWeight:600,color:c}}>{v}</div>
              <div style={{fontSize:12,color:T.secondary,marginTop:1}}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {!activeStObj && (
        <div style={{marginTop:12,color:T.tertiary,fontSize:15}}>
          Selecciona una estación abajo
        </div>
      )}
    </div>

    {/* ── Station pills by line ── */}
    <SectionHeader title="Estación activa"/>
    <div style={{paddingLeft:16,paddingRight:16,display:"flex",flexDirection:"column",gap:10}}>
      {sortedLines.map(line=>{
        const sts=stOf(line.id);
        if(!sts.length) return null;
        return (
          <div key={line.id}>
            <div style={{
              fontSize:12,fontWeight:600,color:line.color,
              letterSpacing:0.3,marginBottom:6,paddingLeft:2,
            }}>
              {line.name}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {sts.map(s=>(
                <Pill key={s.id} label={s.name}
                  active={activeSt===s.id} color={s.color}
                  onClick={()=>setActiveSt(s.id)}/>
              ))}
            </div>
          </div>
        );
      })}
      {stations.length===0&&(
        <div style={{color:T.secondary,fontSize:15,padding:"8px 4px"}}>
          Crea estaciones en la pestaña Estaciones
        </div>
      )}
    </div>

    {/* ── Controls ── */}
    <div style={{
      display:"flex",gap:12,padding:"20px 16px 0",
    }}>
      <button onClick={tReset} style={{
        flex:1,height:52,borderRadius:14,border:"none",
        background:T.fill,color:T.label,
        fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:T.font,
      }}>Reiniciar</button>

      <button onClick={running?tPause:tStart} style={{
        flex:2,height:52,borderRadius:14,border:"none",
        background:running?T.red:T.blue,color:"#fff",
        fontSize:17,fontWeight:600,cursor:"pointer",fontFamily:T.font,
        boxShadow:running?`0 4px 18px ${T.red}55`:`0 4px 18px ${T.blue}55`,
        transition:"all 0.2s",
      }}>{running?"Pausar":elapsed>0?"Continuar":"Iniciar"}</button>

      <button onClick={tLap} disabled={!activeSt||!running} style={{
        flex:1,height:52,borderRadius:14,border:"none",
        background:(!activeSt||!running)?"transparent":T.fill,
        color:(!activeSt||!running)?T.tertiary:ac,
        fontSize:16,fontWeight:600,cursor:(!activeSt||!running)?"default":"pointer",
        fontFamily:T.font,
        border:`2px solid ${(!activeSt||!running)?T.fill:ac}`,
        transition:"all 0.2s",
      }}>Vuelta</button>
    </div>

    {/* ── Lap stats ── */}
    {laps.length>0&&(
      <>
        <div style={{
          display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",
          gap:8,padding:"14px 16px 0",
        }}>
          {[
            {l:"Ciclo prom.",v:fmtShort(avgT),c:ac},
            {l:"Mínimo",v:fmtShort(minT),c:T.green},
            {l:"Máximo",v:fmtShort(maxT),c:T.red},
            {l:"Vueltas",v:laps.length,c:T.label},
          ].map(({l,v,c})=>(
            <div key={l} style={{
              background:T.cardSolid,borderRadius:12,padding:"10px 6px",
              textAlign:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <div style={{fontSize:13,fontWeight:600,color:c}}>{v}</div>
              <div style={{fontSize:10,color:T.secondary,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>

        <SectionHeader title={`Registro · ${activeStObj?.name}`}
          action="Limpiar" onAction={()=>clearLaps(activeSt)}/>
        <Card style={{margin:"0 16px"}}>
          {[...laps].reverse().map((lap,i)=>{
            const n=laps.length-i;
            const isMin=laps.length>1&&lap.time===minT;
            const isMax=laps.length>1&&lap.time===maxT;
            return (
              <div key={lap.id} style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"11px 16px",
                borderBottom:i<laps.length-1?`1px solid ${T.separator}`:"none",
              }}>
                <span style={{fontSize:15,color:T.secondary,width:30}}>#{n}</span>
                <span style={{fontSize:17,fontWeight:500,color:T.label,fontVariantNumeric:"tabular-nums"}}>
                  {fmtShort(lap.time)}
                </span>
                <span style={{fontSize:14,color:T.orange,fontWeight:500}}>
                  {(3600000/lap.time).toFixed(1)} pz/h
                </span>
                <span style={{
                  fontSize:12,fontWeight:600,
                  color:isMin?T.green:isMax?T.red:T.secondary,
                  width:36,textAlign:"right",
                }}>
                  {isMin?"▼ MIN":isMax?"▲ MÁX":lap.ts}
                </span>
              </div>
            );
          })}
        </Card>
      </>
    )}
  </div>
);
};

// ══════════════════════════════════════════════════════════════════════════
// ESTACIONES
// ══════════════════════════════════════════════════════════════════════════
const renderEstaciones = () => (
<div className="view-container">
{sortedLines.map((line,li)=>{
const sts=stOf(line.id);
return (
<div key={line.id}>
<SectionHeader title={line.name}
action="+ Estación" onAction={()=>{setSheetAddSt(line.id);setNewName("");}}/>

        {/* Line config card */}
        <Card style={{margin:"0 16px 4px"}}>
          <div style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"12px 16px",borderBottom:`1px solid ${T.separator}`,
          }}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:12,height:12,borderRadius:6,background:line.color}}/>
              <span style={{fontSize:17,fontWeight:500,color:T.label}}>{line.name}</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>reorderLine(line.id,-1)} disabled={li===0}
                style={{background:T.fill,border:"none",borderRadius:8,width:30,height:30,
                  color:li===0?T.tertiary:T.label,fontSize:14,cursor:li===0?"default":"pointer",fontFamily:T.font}}>↑</button>
              <button onClick={()=>reorderLine(line.id,1)} disabled={li===sortedLines.length-1}
                style={{background:T.fill,border:"none",borderRadius:8,width:30,height:30,
                  color:li===sortedLines.length-1?T.tertiary:T.label,fontSize:14,
                  cursor:li===sortedLines.length-1?"default":"pointer",fontFamily:T.font}}>↓</button>
              <button onClick={()=>{setSheetEditLn(line.id);setNewLineName(line.name);}}
                style={{background:T.fill,border:"none",borderRadius:8,padding:"0 10px",height:30,
                  color:T.blue,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Editar</button>
              <button onClick={()=>deleteLine(line.id)}
                style={{background:"none",border:"none",color:T.red,fontSize:13,
                  fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Eliminar</button>
            </div>
          </div>
          {/* OEE + Horas */}
          <div style={{padding:"14px 16px"}}>
            <div style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              marginBottom:14,
            }}>
              <div>
                <div style={{fontSize:13,color:T.secondary,marginBottom:2}}>OEE de línea</div>
                <div style={{fontSize:28,fontWeight:600,color:line.color}}>{line.oee}%</div>
              </div>
              <Ring pct={line.oee} color={line.color} size={56} stroke={5}/>
            </div>
            <input type="range" min="0" max="100" value={line.oee}
              onChange={e=>updateLine(line.id,"oee",parseInt(e.target.value))}
              style={{width:"100%",accentColor:line.color,marginBottom:14}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:13,color:T.secondary}}>Horas por turno</div>
              <NumStepper value={line.hours} min={1} max={24}
                onChange={v=>updateLine(line.id,"hours",v)} unit="h"/>
            </div>
          </div>
        </Card>

        {/* Stations */}
        {sts.length>0&&(
          <Card style={{margin:"4px 16px 0"}}>
            {sts.map((s,si)=>{
              const avgT=mean(s.laps.map(l=>l.time));
              const pph=calcPPH(avgT,line.oee);
              const out=calcOutput(avgT,line.oee,line.hours);
              return (
                <div key={s.id} style={{borderBottom:si<sts.length-1?`1px solid ${T.separator}`:"none"}}>
                  <div style={{
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"10px 16px",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:9,height:9,borderRadius:"50%",background:s.color}}/>
                      <span style={{fontSize:16,fontWeight:500,color:T.label}}>{s.name}</span>
                      <span style={{fontSize:13,color:T.secondary}}>{s.laps.length} muestras</span>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>reorderSt(s.id,-1)} disabled={si===0}
                        style={{background:T.fill,border:"none",borderRadius:7,width:26,height:26,
                          color:si===0?T.tertiary:T.label,cursor:si===0?"default":"pointer",fontFamily:T.font}}>↑</button>
                      <button onClick={()=>reorderSt(s.id,1)} disabled={si===sts.length-1}
                        style={{background:T.fill,border:"none",borderRadius:7,width:26,height:26,
                          color:si===sts.length-1?T.tertiary:T.label,
                          cursor:si===sts.length-1?"default":"pointer",fontFamily:T.font}}>↓</button>
                      <button onClick={()=>{setSheetEditSt(s.id);setNewName(s.name);}}
                        style={{background:T.fill,border:"none",borderRadius:7,padding:"0 8px",height:26,
                          color:T.blue,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>✎</button>
                      <button onClick={()=>deleteStation(s.id)}
                        style={{background:"none",border:"none",color:T.red,fontSize:12,
                          fontWeight:600,cursor:"pointer",fontFamily:T.font}}>✕</button>
                    </div>
                  </div>
                  {/* Mini stats */}
                  <div style={{display:"flex",gap:0,padding:"0 16px 10px"}}>
                    {[
                      {l:"T. ciclo",v:fmtShort(avgT),c:s.color},
                      {l:"pz/hora",v:pph>0?pph.toFixed(1):"—",c:T.orange},
                      {l:"pz/turno",v:out||"—",c:T.green},
                    ].map(({l,v,c},idx)=>(
                      <div key={l} style={{
                        flex:1,textAlign:"center",
                        borderLeft:idx>0?`1px solid ${T.separator}`:"none",
                        padding:"4px 0",
                      }}>
                        <div style={{fontSize:15,fontWeight:600,color:c}}>{v}</div>
                        <div style={{fontSize:11,color:T.secondary}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Move to line */}
                  {sortedLines.filter(l=>l.id!==s.lineId).length>0&&(
                    <div style={{display:"flex",gap:6,padding:"0 16px 10px",alignItems:"center"}}>
                      <span style={{fontSize:12,color:T.secondary}}>Mover a:</span>
                      {sortedLines.filter(l=>l.id!==s.lineId).map(l=>(
                        <button key={l.id} onClick={()=>moveStToLine(s.id,l.id)} style={{
                          padding:"3px 10px",borderRadius:10,border:`1.5px solid ${l.color}`,
                          background:"transparent",color:l.color,fontSize:12,
                          fontWeight:600,cursor:"pointer",fontFamily:T.font,
                        }}>{l.name}</button>
                      ))}
                      {s.laps.length>0&&(
                        <button onClick={()=>clearLaps(s.id)} style={{
                          marginLeft:"auto",padding:"3px 10px",borderRadius:10,
                          border:"none",background:T.fill,color:T.red,
                          fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,
                        }}>⌫ Limpiar</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        )}
        {sts.length===0&&(
          <div style={{margin:"4px 16px",color:T.secondary,fontSize:15,padding:"14px 16px",
            background:T.card,borderRadius:14,textAlign:"center"}}>
            Sin estaciones — toca "+ Estación"
          </div>
        )}
      </div>
    );
  })}

  <div style={{margin:"16px 16px 0"}}>
    <button onClick={()=>setSheetAddLine(true)} style={{
      width:"100%",padding:"14px",borderRadius:14,
      border:`1.5px dashed ${T.tertiary}`,background:"transparent",
      color:T.blue,fontSize:16,fontWeight:500,cursor:"pointer",fontFamily:T.font,
    }}>+ Nueva línea de producción</button>
  </div>
</div>
);

// ══════════════════════════════════════════════════════════════════════════
// OEE
// ══════════════════════════════════════════════════════════════════════════
const renderOEE = () => (
<div className="view-container">
<SectionHeader title="Análisis por línea"/>
<div style={{padding:"0 16px",fontSize:13,color:T.secondary,marginBottom:8}}>
OEE y horas se configuran por línea. La salida usa el cuello de botella como limitante.
</div>

  {sortedLines.map(line=>{
    const sts=stOf(line.id);
    const stWithData=sts.filter(s=>s.laps.length>0);
    const bottleneck=stWithData.reduce((b,s)=>{
      const a=mean(s.laps.map(l=>l.time));
      return(!b||a>mean(b.laps.map(l=>l.time)))?s:b;
    },null);
    const bnAvg=bottleneck?mean(bottleneck.laps.map(l=>l.time)):0;
    const linePPH=calcPPH(bnAvg,line.oee);
    const lineOut=calcOutput(bnAvg,line.oee,line.hours);

    return (
      <div key={line.id}>
        <Card style={{margin:"0 16px 4px",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
          <div style={{
            padding:"14px 16px",
            borderBottom:`1px solid ${T.separator}`,
            display:"flex",alignItems:"center",justifyContent:"space-between",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:12,height:12,borderRadius:6,background:line.color}}/>
              <span style={{fontSize:18,fontWeight:600,color:T.label}}>{line.name}</span>
            </div>
            <button onClick={()=>setSheetLine(line.id)} style={{
              background:T.fill,border:"none",borderRadius:10,
              padding:"5px 12px",color:T.blue,fontSize:14,fontWeight:600,
              cursor:"pointer",fontFamily:T.font,
            }}>Editar OEE</button>
          </div>

          <div style={{display:"flex",gap:0,padding:"14px 16px",borderBottom:`1px solid ${T.separator}`}}>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:12}}>
              <Ring pct={line.oee} color={line.color} size={52} stroke={5}/>
              <div>
                <div style={{fontSize:11,color:T.secondary}}>OEE</div>
                <div style={{fontSize:26,fontWeight:700,color:line.color,lineHeight:1}}>{line.oee}%</div>
              </div>
            </div>
            <div style={{width:1,background:T.separator}}/>
            <div style={{flex:1,textAlign:"center",padding:"0 10px"}}>
              <div style={{fontSize:11,color:T.secondary}}>Horas turno</div>
              <div style={{fontSize:26,fontWeight:700,color:T.label,lineHeight:1.1}}>{line.hours}h</div>
            </div>
            <div style={{width:1,background:T.separator}}/>
            <div style={{flex:1,textAlign:"center",padding:"0 10px"}}>
              <div style={{fontSize:11,color:T.secondary}}>Estaciones</div>
              <div style={{fontSize:26,fontWeight:700,color:T.label,lineHeight:1.1}}>{sts.length}</div>
            </div>
          </div>

          {stWithData.length>0?(
            <>
              <div style={{display:"flex",gap:0,padding:"12px 0"}}>
                {[
                  {l:"Ritmo de línea",v:`${linePPH.toFixed(1)} pz/h`,c:line.color,big:true},
                  {l:`Salida / turno (${line.hours}h)`,v:`${lineOut} pzas`,c:T.green,big:true},
                ].map(({l,v,c,big},idx)=>(
                  <div key={l} style={{
                    flex:1,textAlign:"center",padding:"4px 12px",
                    borderLeft:idx>0?`1px solid ${T.separator}`:"none",
                  }}>
                    <div style={{fontSize:big?22:17,fontWeight:700,color:c}}>{v}</div>
                    <div style={{fontSize:12,color:T.secondary,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              {bottleneck&&stWithData.length>1&&(
                <div style={{
                  margin:"0 16px 14px",padding:"9px 12px",borderRadius:12,
                  background:`${T.red}10`,border:`1px solid ${T.red}30`,
                  display:"flex",alignItems:"center",gap:8,
                }}>
                  <span style={{fontSize:16}}>⚠️</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:T.red}}>Cuello de botella</div>
                    <div style={{fontSize:12,color:T.secondary}}>{bottleneck.name} · {fmtShort(bnAvg)} / ciclo</div>
                  </div>
                </div>
              )}
            </>
          ):(
            <div style={{padding:"14px 16px",color:T.secondary,fontSize:14,textAlign:"center"}}>
              Sin datos — registra vueltas en el Cronómetro
            </div>
          )}
        </Card>

        {stWithData.length>0&&(
          <>
            <SectionHeader title={`Detalle · ${line.name}`}/>
            <Card style={{margin:"0 16px 12px"}}>
              {sts.map((s,si)=>{
                const laps=s.laps;
                const avgT=mean(laps.map(l=>l.time));
                const minT=laps.length?Math.min(...laps.map(l=>l.time)):0;
                const pph_avg=calcPPH(avgT,line.oee);
                const pph_min=calcPPH(minT,line.oee);
                const out_avg=calcOutput(avgT,line.oee,line.hours);
                const out_min=calcOutput(minT,line.oee,line.hours);
                const teo_pph=avgT?3600000/avgT:0;
                const teo_out=avgT?Math.floor(teo_pph*line.hours):0;
                const isBN=bottleneck?.id===s.id&&stWithData.length>1;

                return (
                  <div key={s.id} style={{
                    borderBottom:si<sts.length-1?`1px solid ${T.separator}`:"none",
                    padding:"14px 16px",
                    background:isBN?`${T.red}05`:"transparent",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:s.color}}/>
                      <span style={{fontSize:16,fontWeight:600,color:T.label}}>{s.name}</span>
                      {isBN&&<span style={{
                        fontSize:11,fontWeight:600,color:T.red,
                        background:`${T.red}15`,padding:"2px 8px",borderRadius:8,
                      }}>Cuello</span>}
                      <span style={{fontSize:13,color:T.secondary,marginLeft:"auto"}}>
                        {laps.length} muestras
                      </span>
                    </div>

                    {laps.length>0?(
                      <>
                        <div style={{
                          background:T.fill,borderRadius:14,
                          padding:"12px 14px",marginBottom:10,
                          display:"flex",justifyContent:"space-between",alignItems:"center",
                        }}>
                          <div>
                            <div style={{fontSize:11,color:T.secondary,marginBottom:2}}>
                              Pzas / hora · OEE {line.oee}%
                            </div>
                            <div style={{fontSize:34,fontWeight:700,color:s.color,lineHeight:1}}>
                              {pph_avg.toFixed(2)}
                            </div>
                            <div style={{fontSize:12,color:T.secondary,marginTop:2}}>
                              con tiempo promedio
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:11,color:T.secondary}}>Teórico</div>
                            <div style={{fontSize:18,fontWeight:600,color:T.tertiary}}>
                              {teo_pph.toFixed(1)}
                            </div>
                            <div style={{fontSize:11,color:T.secondary}}>sin OEE</div>
                            {minT>0&&minT!==avgT&&(
                              <div style={{marginTop:6}}>
                                <div style={{fontSize:11,color:T.green}}>Con t. óptimo</div>
                                <div style={{fontSize:16,fontWeight:700,color:T.green}}>
                                  {pph_min.toFixed(2)} pz/h
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                          {[
                            {l:`Salida/turno (${line.hours}h)`,v:`${out_avg} pzas`,c:T.green},
                            {l:"Teórico/turno",v:`${teo_out} pzas`,c:T.secondary},
                          ].map(({l,v,c})=>(
                            <div key={l} style={{
                              background:T.fill,borderRadius:12,
                              padding:"10px 12px",textAlign:"center",
                            }}>
                              <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
                              <div style={{fontSize:11,color:T.secondary,marginTop:2}}>{l}</div>
                            </div>
                          ))}
                        </div>
                        {minT>0&&minT!==avgT&&(
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                            {[
                              {l:"Salida óptima/turno",v:`${out_min} pzas`,c:T.green},
                              {l:"Pzas recuperables",v:`+${out_min-out_avg}`,c:T.orange},
                            ].map(({l,v,c})=>(
                              <div key={l} style={{
                                background:T.fill,borderRadius:12,
                                padding:"10px 12px",textAlign:"center",
                              }}>
                                <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
                                <div style={{fontSize:11,color:T.secondary,marginTop:2}}>{l}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                          {[
                            {l:"Eficiencia",v:`${line.oee}%`,c:s.color},
                            {l:"Pérdida",v:`${(100-line.oee).toFixed(1)}%`,c:T.red},
                            {l:"Pzas perdidas",v:teo_out-out_avg,c:T.red},
                          ].map(({l,v,c})=>(
                            <div key={l} style={{
                              background:T.fill,borderRadius:10,
                              padding:"8px 4px",textAlign:"center",
                            }}>
                              <div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div>
                              <div style={{fontSize:10,color:T.secondary,marginTop:1}}>{l}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    ):(
                      <div style={{color:T.secondary,fontSize:14,textAlign:"center",padding:"10px 0"}}>Sin datos</div>
                    )}
                  </div>
                );
              })}
            </Card>
          </>
        )}
      </div>
    );
  })}

  {lines.length===0&&(
    <div style={{textAlign:"center",padding:"40px 20px",color:T.secondary,fontSize:16}}>
      Crea líneas de producción en Estaciones
    </div>
  )}
</div>
);

// ══════════════════════════════════════════════════════════════════════════
// BOTTOM TAB BAR
// ══════════════════════════════════════════════════════════════════════════
const TABS = [
{ id:"Cronómetro", icon:"⏱", label:"Cronómetro" },
{ id:"Estaciones", icon:"🏭", label:"Estaciones" },
{ id:"OEE",        icon:"📊", label:"OEE" },
];

// ══════════════════════════════════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════════════════════════════════
return (
<div className="app-layout" style={{
background:T.bg, color:T.label, fontFamily:T.font
}}>
<style>{`*{box-sizing:border-box;-webkit-tap-highlight-color:transparent} ::-webkit-scrollbar{display:none} input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:${T.fill}} input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:11px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.18)} input[type=text]{font-family:${T.font}} @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

  {/* ── Tab bar ── */}
  <div className="tab-bar-container" style={{
    background:"rgba(242,242,247,0.92)",
    backdropFilter:"blur(20px)",
    WebkitBackdropFilter:"blur(20px)",
    borderTop:`1px solid ${T.separator}`,
  }}>
    {TABS.map(tab=>(
      <button key={tab.id} className="tab-bar-btn" onClick={()=>setView(tab.id)} style={{
        border:"none",background:"transparent",
        cursor:"pointer",fontFamily:T.font,
      }}>
        <span className="tab-icon" style={{filter:view===tab.id?"none":"grayscale(1) opacity(0.5)"}}>{tab.icon}</span>
        <span className="tab-label" style={{
          fontWeight:500,
          color:view===tab.id?T.blue:T.secondary,
        }}>{tab.label}</span>
      </button>
    ))}
  </div>

  <div className="main-column">
    {/* ── Nav bar ── */}
    <div className="nav-bar-container" style={{
      background:"rgba(242,242,247,0.88)",
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      borderBottom:`1px solid ${T.separator}`,
    }}>
      <div style={{fontSize:22,fontWeight:700,color:T.label,letterSpacing:-0.5}}>
        TimeTrack IE
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {activeStObj&&(
          <span style={{
            fontSize:13,fontWeight:500,
            background:activeStObj.color,color:"#fff",
            padding:"3px 10px",borderRadius:10,
          }}>{activeStObj.name}</span>
        )}
        {running&&(
          <div style={{
            width:8,height:8,borderRadius:"50%",background:T.green,
            boxShadow:`0 0 0 3px ${T.green}30`,
            animation:"pulse 1.2s infinite",
          }}/>
        )}
      </div>
    </div>

    {/* ── Scroll body ── */}
    <div className="scroll-body-container">
      {view==="Cronómetro"&&renderCrono()}
      {view==="Estaciones"&&renderEstaciones()}
      {view==="OEE"&&renderOEE()}
    </div>
  </div>

  {/* ════ SHEETS ════ */}

  {/* Edit Line Name */}
  <Sheet open={!!sheetEditLn} onClose={()=>setSheetEditLn(null)} title="Editar línea">
    {editingLine&&(
      <div style={{padding:"20px 20px 10px"}}>
        <div style={{fontSize:13,color:T.secondary,marginBottom:6}}>Nombre</div>
        <input
          style={{
            width:"100%",padding:"12px 14px",borderRadius:12,
            border:`1.5px solid ${T.separator}`,background:T.cardSolid,
            fontSize:17,color:T.label,fontFamily:T.font,outline:"none",
          }}
          value={newLineName}
          onChange={e=>setNewLineName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&(updateLine(sheetEditLn,"name",newLineName),setSheetEditLn(null))}
        />
        <div style={{fontSize:13,color:T.secondary,marginTop:14,marginBottom:8}}>Color</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {APPLE_COLORS.map(c=>(
            <button key={c.val} onClick={()=>updateLine(sheetEditLn,"color",c.val)} style={{
              width:36,height:36,borderRadius:18,border:"none",background:c.val,
              cursor:"pointer",
              outline:editingLine.color===c.val?`3px solid ${c.val}`:"3px solid transparent",
              outlineOffset:2,
              boxShadow:editingLine.color===c.val?"0 0 0 2px #fff inset":"none",
            }}/>
          ))}
        </div>
        <button onClick={()=>{updateLine(sheetEditLn,"name",newLineName);setSheetEditLn(null);}} style={{
          width:"100%",marginTop:20,padding:"14px",borderRadius:14,
          border:"none",background:T.blue,color:"#fff",
          fontSize:17,fontWeight:600,cursor:"pointer",fontFamily:T.font,
        }}>Guardar</button>
      </div>
    )}
  </Sheet>

  {/* Edit Station Name + Color */}
  <Sheet open={!!sheetEditSt} onClose={()=>setSheetEditSt(null)} title="Editar estación">
    {editingStObj&&(
      <div style={{padding:"20px 20px 10px"}}>
        <div style={{fontSize:13,color:T.secondary,marginBottom:6}}>Nombre</div>
        <input
          style={{
            width:"100%",padding:"12px 14px",borderRadius:12,
            border:`1.5px solid ${T.separator}`,background:T.cardSolid,
            fontSize:17,color:T.label,fontFamily:T.font,outline:"none",
          }}
          value={newName} onChange={e=>setNewName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&(updateStation(sheetEditSt,"name",newName),setSheetEditSt(null))}
        />
        <div style={{fontSize:13,color:T.secondary,marginTop:14,marginBottom:8}}>Color</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {APPLE_COLORS.map(c=>(
            <button key={c.val} onClick={()=>updateStation(sheetEditSt,"color",c.val)} style={{
              width:36,height:36,borderRadius:18,border:"none",background:c.val,
              cursor:"pointer",
              outline:editingStObj.color===c.val?`3px solid ${c.val}`:"3px solid transparent",
              outlineOffset:2,
              boxShadow:editingStObj.color===c.val?"0 0 0 2px #fff inset":"none",
            }}/>
          ))}
        </div>
        <button onClick={()=>{updateStation(sheetEditSt,"name",newName);setSheetEditSt(null);}} style={{
          width:"100%",marginTop:20,padding:"14px",borderRadius:14,
          border:"none",background:T.blue,color:"#fff",
          fontSize:17,fontWeight:600,cursor:"pointer",fontFamily:T.font,
        }}>Guardar</button>
      </div>
    )}
  </Sheet>

  {/* Add Station */}
  <Sheet open={!!sheetAddSt} onClose={()=>setSheetAddSt(null)}
    title={`Nueva estación · ${lines.find(l=>l.id===sheetAddSt)?.name||""}`}>
    <div style={{padding:"20px 20px 10px"}}>
      <div style={{fontSize:13,color:T.secondary,marginBottom:6}}>Nombre de estación</div>
      <input
        style={{
          width:"100%",padding:"12px 14px",borderRadius:12,
          border:`1.5px solid ${T.separator}`,background:T.cardSolid,
          fontSize:17,color:T.label,fontFamily:T.font,outline:"none",
        }}
        placeholder="Ej. EST-04, Troquelado, Pintura..."
        value={newName} onChange={e=>setNewName(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&addStation(sheetAddSt)}
        autoFocus
      />
      <button onClick={()=>addStation(sheetAddSt)} style={{
        width:"100%",marginTop:16,padding:"14px",borderRadius:14,
        border:"none",background:T.blue,color:"#fff",
        fontSize:17,fontWeight:600,cursor:"pointer",fontFamily:T.font,
      }}>Agregar estación</button>
    </div>
  </Sheet>

  {/* Add Line */}
  <Sheet open={sheetAddLine} onClose={()=>setSheetAddLine(false)} title="Nueva línea de producción">
    <div style={{padding:"20px 20px 10px"}}>
      <div style={{fontSize:13,color:T.secondary,marginBottom:6}}>Nombre</div>
      <input
        style={{
          width:"100%",padding:"12px 14px",borderRadius:12,
          border:`1.5px solid ${T.separator}`,background:T.cardSolid,
          fontSize:17,color:T.label,fontFamily:T.font,outline:"none",
        }}
        placeholder="Ej. Línea C, Ensamble, Soldadura..."
        value={newLineName} onChange={e=>setNewLineName(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&addLine()}
        autoFocus
      />
      <div style={{fontSize:13,color:T.secondary,marginTop:14,marginBottom:8}}>Color de línea</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
        {APPLE_COLORS.map(c=>(
          <button key={c.val} onClick={()=>setNewLineColor(c.val)} style={{
            width:36,height:36,borderRadius:18,border:"none",background:c.val,
            cursor:"pointer",
            outline:newLineColor===c.val?`3px solid ${c.val}`:"3px solid transparent",
            outlineOffset:2,
            boxShadow:newLineColor===c.val?"0 0 0 2px #fff inset":"none",
          }}/>
        ))}
      </div>
      <div style={{background:T.fill,borderRadius:14,padding:"14px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div>
            <div style={{fontSize:13,color:T.secondary,marginBottom:2}}>OEE inicial</div>
            <div style={{fontSize:28,fontWeight:700,color:newLineColor}}>{newLineOee}%</div>
          </div>
          <Ring pct={newLineOee} color={newLineColor} size={52} stroke={5}/>
        </div>
        <input type="range" min="0" max="100" value={newLineOee}
          onChange={e=>setNewLineOee(parseInt(e.target.value))}
          style={{width:"100%",accentColor:newLineColor,marginBottom:14}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:13,color:T.secondary}}>Horas por turno</div>
          <NumStepper value={newLineHrs} min={1} max={24}
            onChange={setNewLineHrs} unit="h"/>
        </div>
      </div>
      <button onClick={addLine} style={{
        width:"100%",padding:"14px",borderRadius:14,
        border:"none",background:T.blue,color:"#fff",
        fontSize:17,fontWeight:600,cursor:"pointer",fontFamily:T.font,
      }}>Crear línea</button>
    </div>
  </Sheet>

  {/* Edit Line OEE (from OEE tab) */}
  <Sheet open={!!sheetLine} onClose={()=>setSheetLine(null)}
    title={`OEE · ${oeeLineSheet?.name||""}`}>
    {oeeLineSheet&&(
      <div style={{padding:"20px 20px 10px"}}>
        <div style={{background:T.fill,borderRadius:14,padding:"16px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{fontSize:13,color:T.secondary,marginBottom:2}}>OEE</div>
              <div style={{fontSize:36,fontWeight:700,color:oeeLineSheet.color,lineHeight:1}}>
                {oeeLineSheet.oee}%
              </div>
            </div>
            <Ring pct={oeeLineSheet.oee} color={oeeLineSheet.color} size={64} stroke={6}/>
          </div>
          <input type="range" min="0" max="100" value={oeeLineSheet.oee}
            onChange={e=>updateLine(sheetLine,"oee",parseInt(e.target.value))}
            style={{width:"100%",accentColor:oeeLineSheet.color,marginBottom:16}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:15,color:T.label,fontWeight:500}}>Horas por turno</div>
            <NumStepper value={oeeLineSheet.hours} min={1} max={24}
              onChange={v=>updateLine(sheetLine,"hours",v)} unit="h"/>
          </div>
        </div>
        <div style={{
          background:T.fill,borderRadius:12,padding:"12px 14px",
          display:"flex",justifyContent:"space-between",
        }}>
          <div style={{fontSize:13,color:T.secondary}}>Pérdida OEE</div>
          <div style={{fontSize:13,fontWeight:600,color:T.red}}>
            {(100-oeeLineSheet.oee).toFixed(1)}%
          </div>
        </div>
        <button onClick={()=>setSheetLine(null)} style={{
          width:"100%",marginTop:16,padding:"14px",borderRadius:14,
          border:"none",background:T.blue,color:"#fff",
          fontSize:17,fontWeight:600,cursor:"pointer",fontFamily:T.font,
        }}>Listo</button>
      </div>
    )}
  </Sheet>


</div>
);
}