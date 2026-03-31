'use client'
import { useState, useEffect, useCallback } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

// ── 型定義
interface CaRow { sales:number; decided:number; meetings:number; active:number; zuba?:number; cl?:number; focusCount?:number; interviewSet?:number }
interface WeekData { overall:{ca:CaRow[]}; cs:{ca:CaRow[]}; csl:{ca:CaRow[]}; focusData:any[]; pjData:any[] }
interface HistoryRow { week_key:string; payload?:WeekData; ca?:CaRow[] }

interface PjCard {
  id: number;
  name: string; owner: string; started: string; total: number;
  decided: number; sales: number; meetings: number; progress: number;
  status: 'on'|'at'|'off';
  done: string; issue: string; next: string;
}

interface Topic { id:number; title:string; body:string; color:string; tags:string[] }

const SC_CA = ["清野","茨木","菊地","福田","大西","南原"]
const CS_CA = ["中村","大城","小谷","喜多"]
const WEEKS_LABEL = ["2/W3","2/W4","3/W1","3/W2","3/W3","3/W4"]

const sum = (rows:CaRow[], f:keyof CaRow) => rows.reduce((s,r)=>s+(Number(r[f])||0),0)
const pct = (a:number,b:number) => b>0 ? (a/b*100).toFixed(1)+'%' : '—'
const avg = (a:number,b:number) => b>0 ? (a/b).toFixed(1) : '—'

function calcKpi(rows:CaRow[]) {
  const sales=sum(rows,'sales'), decided=sum(rows,'decided')
  const meetings=sum(rows,'meetings'), active=sum(rows,'active')
  const zuba=sum(rows,'zuba'), cl=sum(rows,'cl')
  const focusCount=sum(rows,'focusCount'), interviewSet=sum(rows,'interviewSet')
  return { sales, decided, meetings, active, zuba, cl, focusCount, interviewSet,
    decidedRate: pct(decided,active), avgPrice: avg(sales,decided) }
}

function getCurrentWeek() {
  const d=new Date(), y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0')
  const fd=new Date(y,d.getMonth(),1).getDay(), w=Math.ceil((d.getDate()+fd)/7)
  return `${y}/${m}/${w}W`
}
function labelToKey(l:string){ return l.replace(/\//g,'_') }

// ── KPIカード
function KpiCard({label,value,unit,sub,delta,color,progress}:{label:string;value:string|number;unit:string;sub:string;delta?:string;deltaUp?:boolean;color:string;progress:number}) {
  const isUp = delta?.startsWith('↑')
  const isDn = delta?.startsWith('↓')
  return (
    <div style={{background:'#fff',border:'1px solid #e5e5e5',borderRadius:10,padding:18,position:'relative',overflow:'hidden',transition:'box-shadow .2s'}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:color,borderRadius:'10px 10px 0 0'}} />
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
        <div style={{width:36,height:36,borderRadius:9,background:color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>
          {label==='決定数'?'✓':label==='売上'?'¥':label==='面談数'?'👥':label==='稼働数'?'⚡':label==='ズバ確定'?'▶':label==='CL見込み'?'◎':label==='決定率'?'%':'→'}
        </div>
        {delta && <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:isUp?'#eaf5ea':isDn?'#fce9e9':'#f3f2f2',color:isUp?'#2e844a':isDn?'#ba0517':'#706e6b'}}>{delta}</span>}
      </div>
      <div style={{fontSize:10,fontWeight:600,color:'#706e6b',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{label}</div>
      <div style={{fontSize:28,fontWeight:700,color:label==='ズバ確定'?'#032d60':label==='CL見込み'?'#1c3326':'#1d1d1f',lineHeight:1,letterSpacing:'-1px',marginBottom:6}}>
        {value}<span style={{fontSize:13,fontWeight:400,color:'#706e6b',marginLeft:2}}>{unit}</span>
      </div>
      <div style={{fontSize:11,color:'#706e6b',marginBottom:10}}>{sub}</div>
      <div style={{height:3,background:'#f3f2f2',borderRadius:999,overflow:'hidden'}}>
        <div style={{height:3,width:`${Math.min(progress,100)}%`,background:color,borderRadius:999,transition:'width .6s'}} />
      </div>
    </div>
  )
}

// ── チーム比較バー
function TeamBar({label,scVal,csVal,scMax,csMax,scLabel,csLabel}:{label:string;scVal:number;csVal:number;scMax:number;csMax:number;scLabel:string;csLabel:string}) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',color:'#706e6b',marginBottom:7}}>{label}</div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
        <span style={{width:28,fontSize:12,fontWeight:700,color:'#0176d3'}}>SC</span>
        <div style={{flex:1,background:'#f3f2f2',borderRadius:999,height:10,overflow:'hidden'}}>
          <div style={{height:10,width:`${scMax>0?scVal/scMax*100:0}%`,background:'linear-gradient(90deg,#1b96ff,#0176d3)',borderRadius:999,transition:'width .8s'}} />
        </div>
        <span style={{width:56,textAlign:'right',fontSize:12,fontWeight:700,color:'#1d1d1f'}}>{scLabel}</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{width:28,fontSize:12,fontWeight:700,color:'#2e844a'}}>CS</span>
        <div style={{flex:1,background:'#f3f2f2',borderRadius:999,height:10,overflow:'hidden'}}>
          <div style={{height:10,width:`${csMax>0?csVal/csMax*100:0}%`,background:'linear-gradient(90deg,#3dba4e,#2e844a)',borderRadius:999,transition:'width .8s'}} />
        </div>
        <span style={{width:56,textAlign:'right',fontSize:12,fontWeight:700,color:'#1d1d1f'}}>{csLabel}</span>
      </div>
    </div>
  )
}

// ── CAランキング行
function RankRow({rank,name,team,val,max,color}:{rank:number;name:string;team:string;val:number;max:number;color:string}) {
  const medals = ['#fef3c7','#f1f5f9','#fde8cc']
  const medalText = ['#92400e','#475569','#b45309']
  const initial = name[0]
  const avBg = team==='SC'?'#e8f4fd':'#eaf5ea'
  const avColor = team==='SC'?'#0176d3':'#2e844a'
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid #f3f2f2'}}>
      <div style={{width:24,height:24,borderRadius:'50%',background:rank<=3?medals[rank-1]:'#f3f2f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:rank<=3?medalText[rank-1]:'#706e6b',flexShrink:0}}>{rank}</div>
      <div style={{width:32,height:32,borderRadius:'50%',background:avBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:avColor,flexShrink:0}}>{initial}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:'#1d1d1f',display:'flex',alignItems:'center',gap:5}}>
          {name}
          <span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:999,background:team==='SC'?'#e8f4fd':'#eaf5ea',color:team==='SC'?'#0176d3':'#2e844a'}}>{team}</span>
        </div>
        <div style={{marginTop:4,background:'#f3f2f2',borderRadius:999,height:4,overflow:'hidden'}}>
          <div style={{height:4,width:`${max>0?val/max*100:0}%`,background:color,borderRadius:999}} />
        </div>
      </div>
      <span style={{fontSize:14,fontWeight:800,color:'#1d1d1f',whiteSpace:'nowrap'}}>{val}件</span>
    </div>
  )
}

// ── 週次対比テーブル
function WeekTable({history,caNames,segment}:{history:HistoryRow[];caNames:readonly string[];segment:'sc'|'cs'}) {
  const rows = [...history].reverse()
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead>
          <tr>
            {['週','決定数','売上','面談数','稼働数','決定率','前週比'].map(h=>(
              <th key={h} style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',color:'#706e6b',padding:'8px 12px',textAlign:'left',background:'#f3f2f2',borderBottom:'1px solid #e5e5e5'}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>{
            const caRows = segment==='sc' ? (r.payload?.overall?.ca||[]) : (r.payload?.cs?.ca||[])
            const kpi = calcKpi(caRows)
            const prevKpi = i>0 ? calcKpi(segment==='sc'?(rows[i-1].payload?.overall?.ca||[]):(rows[i-1].payload?.cs?.ca||[])) : null
            const diff = prevKpi ? kpi.decided - prevKpi.decided : null
            const isLast = i===rows.length-1
            return (
              <tr key={r.week_key} style={{background:isLast?(segment==='sc'?'#f0f7ff':'#f0fff4'):'transparent'}}>
                <td style={{padding:'10px 12px',borderBottom:'1px solid #f3f2f2',fontWeight:isLast?700:400}}>{r.week_key.replace(/_/g,'/')}</td>
                <td style={{padding:'10px 12px',borderBottom:'1px solid #f3f2f2',fontFamily:'DM Mono,monospace',fontWeight:isLast?700:600}}>{kpi.decided}</td>
                <td style={{padding:'10px 12px',borderBottom:'1px solid #f3f2f2',fontFamily:'DM Mono,monospace',fontWeight:isLast?700:600}}>{kpi.sales}万</td>
                <td style={{padding:'10px 12px',borderBottom:'1px solid #f3f2f2',fontFamily:'DM Mono,monospace',fontWeight:isLast?700:600}}>{kpi.meetings}</td>
                <td style={{padding:'10px 12px',borderBottom:'1px solid #f3f2f2',fontFamily:'DM Mono,monospace',fontWeight:isLast?700:600}}>{kpi.active}</td>
                <td style={{padding:'10px 12px',borderBottom:'1px solid #f3f2f2',fontFamily:'DM Mono,monospace',fontWeight:isLast?700:600}}>{kpi.decidedRate}</td>
                <td style={{padding:'10px 12px',borderBottom:'1px solid #f3f2f2',fontFamily:'DM Mono,monospace',fontWeight:700,color:diff===null?'#706e6b':diff>0?'#2e844a':diff<0?'#ba0517':'#706e6b'}}>
                  {diff===null?'—':diff>0?`↑ +${diff}`:diff<0?`↓ ${diff}`:'→ 0'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── トピックカード
function TopicCard({topic,onDelete}:{topic:Topic;onDelete:()=>void}) {
  const borderColor = {blue:'#0176d3',green:'#2e844a',orange:'#ea780e',purple:'#7a288a',red:'#ba0517'}[topic.color]||'#0176d3'
  const TAG_STYLE:Record<string,{bg:string;color:string}> = {
    issue:{bg:'#fce9e9',color:'#ba0517'}, action:{bg:'#e8f4fd',color:'#0176d3'},
    win:{bg:'#eaf5ea',color:'#2e844a'}, info:{bg:'#f3f2f2',color:'#706e6b'}
  }
  const TAG_LABEL:Record<string,string> = {issue:'課題',action:'要対策',win:'成果あり',info:'情報共有'}
  return (
    <div style={{background:'#fff',border:'1px solid #e5e5e5',borderLeft:`3px solid ${borderColor}`,borderRadius:10,padding:'18px 20px',position:'relative'}}>
      <button onClick={onDelete} style={{position:'absolute',top:12,right:12,width:22,height:22,borderRadius:'50%',border:'none',background:'transparent',cursor:'pointer',color:'#b0adab',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
      <div style={{fontSize:10,fontWeight:800,fontFamily:'DM Mono,monospace',color:'#b0adab',marginBottom:8}}>TOPIC {String(topic.id).padStart(2,'0')}</div>
      <div style={{fontSize:14,fontWeight:700,color:'#1d1d1f',marginBottom:8,lineHeight:1.4}}>{topic.title}</div>
      {topic.body && <div style={{fontSize:12,color:'#706e6b',lineHeight:1.65,marginBottom:10}}>{topic.body}</div>}
      <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
        {topic.tags.map(t=>(
          <span key={t} style={{fontSize:10,fontWeight:600,padding:'3px 9px',borderRadius:999,...TAG_STYLE[t]}}>{TAG_LABEL[t]}</span>
        ))}
      </div>
    </div>
  )
}

// ── トピック追加フォーム
function TopicForm({num,onSave,onCancel}:{num:number;onSave:(t:Topic)=>void;onCancel:()=>void}) {
  const [title,setTitle]=useState('')
  const [body,setBody]=useState('')
  const [color,setColor]=useState('blue')
  const [tags,setTags]=useState<string[]>([])
  const COLORS=[{k:'blue',c:'#0176d3'},{k:'green',c:'#2e844a'},{k:'orange',c:'#ea780e'},{k:'purple',c:'#7a288a'},{k:'red',c:'#ba0517'}]
  const TAGS=[{k:'issue',l:'課題'},{k:'action',l:'要対策'},{k:'win',l:'成果あり'},{k:'info',l:'情報共有'}]
  const tagStyle = (k:string, active:boolean) => {
    const m:{[k:string]:{bg:string;color:string}} = {issue:{bg:'#fce9e9',color:'#ba0517'},action:{bg:'#e8f4fd',color:'#0176d3'},win:{bg:'#eaf5ea',color:'#2e844a'},info:{bg:'#f3f2f2',color:'#706e6b'}}
    return active ? m[k] : {bg:'#fff',color:'#706e6b'}
  }
  return (
    <div style={{background:'#fafaf9',border:'1px solid #e5e5e5',borderLeft:'3px solid #0176d3',borderRadius:10,padding:'18px 20px'}}>
      <div style={{fontSize:10,fontWeight:800,fontFamily:'DM Mono,monospace',color:'#b0adab',marginBottom:12}}>TOPIC {String(num).padStart(2,'0')}</div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#706e6b',display:'block',marginBottom:4}}>タイトル</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="トピックのタイトルを入力..." autoFocus
          style={{width:'100%',fontSize:13,padding:'8px 10px',border:'1px solid #e5e5e5',borderRadius:7,background:'#fff',color:'#1d1d1f',outline:'none',fontFamily:'DM Sans,sans-serif'}} />
      </div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#706e6b',display:'block',marginBottom:4}}>内容</label>
        <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="詳細・背景・状況を入力..." rows={3}
          style={{width:'100%',fontSize:13,padding:'8px 10px',border:'1px solid #e5e5e5',borderRadius:7,background:'#fff',color:'#1d1d1f',outline:'none',resize:'none',lineHeight:1.55,fontFamily:'DM Sans,sans-serif'}} />
      </div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#706e6b',display:'block',marginBottom:6}}>カラー</label>
        <div style={{display:'flex',gap:6}}>
          {COLORS.map(c=>(
            <div key={c.k} onClick={()=>setColor(c.k)} style={{width:18,height:18,borderRadius:'50%',background:c.c,cursor:'pointer',border:`2px solid ${color===c.k?'#1d1d1f':'transparent'}`,transition:'border-color .15s'}} />
          ))}
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#706e6b',display:'block',marginBottom:6}}>タグ</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {TAGS.map(t=>{
            const active=tags.includes(t.k)
            const s=tagStyle(t.k,active)
            return <button key={t.k} onClick={()=>setTags(active?tags.filter(x=>x!==t.k):[...tags,t.k])}
              style={{fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:999,border:`1.5px solid ${active?'transparent':'#e5e5e5'}`,background:s.bg,color:s.color,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>{t.l}</button>
          })}
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
        <button onClick={onCancel} style={{fontSize:12,fontWeight:600,padding:'7px 16px',borderRadius:7,border:'1px solid #e5e5e5',background:'#fff',color:'#706e6b',cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>キャンセル</button>
        <button onClick={()=>onSave({id:num,title:title||'（無題）',body,color,tags})}
          style={{fontSize:12,fontWeight:700,padding:'7px 18px',borderRadius:7,border:'none',background:'#0176d3',color:'#fff',cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>追加する</button>
      </div>
    </div>
  )
}

// ── チャート共通設定
const chartOpts = (y2=false):any => ({
  responsive:true, maintainAspectRatio:false,
  plugins:{legend:{display:false}},
  scales:{
    x:{ticks:{font:{size:9},color:'#888'},grid:{color:'rgba(0,0,0,0.04)'}},
    y:{display:true,position:'left',ticks:{font:{size:9},color:'#888'},grid:{color:'rgba(0,0,0,0.04)'}},
    ...(y2?{y1:{display:true,position:'right',ticks:{font:{size:9},color:'#2e844a'},grid:{drawOnChartArea:false}}}:{})
  }
})

// ── メインコンポーネント
export default function Dashboard() {
  const [tab, setTab] = useState(0)
  const [week, setWeek] = useState(getCurrentWeek())
  const [scData, setScData] = useState<WeekData|null>(null)
  const [csData, setCsData] = useState<WeekData|null>(null)
  const [scHistory, setScHistory] = useState<HistoryRow[]>([])
  const [csHistory, setCsHistory] = useState<HistoryRow[]>([])
  const [adCostSC, setAdCostSC] = useState('')
  const [adCostCS, setAdCostCS] = useState('')
  const [unitSC, setUnitSC] = useState('')
  const [unitCS, setUnitCS] = useState('')
  const [topics, setTopics] = useState<Topic[]>([
    {id:1,title:'ハイプレミア候補者の離脱率が上昇傾向',body:'先月比で最終面接後の辞退率が12%→19%に上昇。競合他社のオファー条件が主因と推察。',color:'red',tags:['issue','action']},
    {id:2,title:'SC 新規候補者 DB 拡充施策の進捗',body:'LinkedInアウトバウンド施策を先週開始。初週は120名にリーチ、返信率8.3%。',color:'blue',tags:['win','info']},
    {id:3,title:'CS 介護・福祉領域の求人数が増加',body:'3月に入り施設長クラスの求人が前月比+30%増。CS チームのポジション充足に追い風。',color:'green',tags:['win','info']},
    {id:4,title:'AI 面接フィードバックツールの試験運用開始',body:'ai-interview ツールを SC 清野・茨木で試験利用開始。精度と利用継続率を来週レビュー。',color:'orange',tags:['action']},
  ])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async() => {
    setLoading(true)
    const wk = labelToKey(week)
    try {
      const [scR, csR, scHR, csHR] = await Promise.all([
        fetch(`/api/sc-data?week=${wk}`).then(r=>r.json()),
        fetch(`/api/cs-data?week=${wk}`).then(r=>r.json()),
        fetch('/api/sc-history').then(r=>r.json()),
        fetch('/api/cs-history').then(r=>r.json()),
      ])
      if(scR.payload) setScData(scR.payload)
      if(csR.payload) setCsData(csR.payload)
      if(scHR.rows) setScHistory(scHR.rows.reverse())
      if(csHR.rows) setCsHistory(csHR.rows.reverse())
    } catch(e){ console.error(e) }
    setLoading(false)
  },[week])

  useEffect(()=>{ loadAll() },[loadAll])

  // ── KPI集計
  const scRows = scHistory.length > 0 ? scHistory[scHistory.length - 1].ca || [] : []
  const csRows = csHistory.length > 0 ? csHistory[csHistory.length - 1].ca || [] : []
  const scKpi = calcKpi(scRows)
  const csKpi = calcKpi(csRows)
  const totalDecided = scKpi.decided + csKpi.decided
  const totalSales = scKpi.sales + csKpi.sales
  const totalMeetings = scKpi.meetings + csKpi.meetings
  const totalActive = scKpi.active + csKpi.active
  const totalZuba = scKpi.zuba + csKpi.zuba
  const totalCl = scKpi.cl + csKpi.cl

  // ── トレンドデータ
  const scTrendLabels = scHistory.map(r=>r.week_key.replace(/_/g,'/').slice(-4))
  const scDecided = scHistory.map(r=>calcKpi(r.payload?.overall?.ca||[]).decided)
  const scSales = scHistory.map(r=>calcKpi(r.payload?.overall?.ca||[]).sales/100)
  const csTrendLabels = csHistory.map(r=>r.week_key.replace(/_/g,'/').slice(-4))
  const csDecided = csHistory.map(r=>calcKpi(r.payload?.cs?.ca||[]).decided)
  const csSales = csHistory.map(r=>calcKpi(r.payload?.cs?.ca||[]).sales/100)

  // 先週比
  const prevScKpi = scHistory.length>=2 ? calcKpi(scHistory[scHistory.length-2]?.payload?.overall?.ca||[]) : null
  const prevCsKpi = csHistory.length>=2 ? calcKpi(csHistory[csHistory.length-2]?.payload?.cs?.ca||[]) : null
  const scDelta = (prevScKpi && scKpi.decided!==undefined) ? scKpi.decided-prevScKpi.decided : 0
  const csDelta = (prevCsKpi && csKpi.decided!==undefined) ? csKpi.decided-prevCsKpi.decided : 0

  // ── CAランキング（合算）
  const allCa = [
    ...SC_CA.map((name,i)=>({name,team:'SC',decided:scRows[i]?.decided||0})),
    ...CS_CA.map((name,i)=>({name,team:'CS',decided:csRows[i]?.decided||0})),
  ].sort((a,b)=>b.decided-a.decided)
  const maxDecided = allCa[0]?.decided || 1

  const TAB_COLORS = ['#0176d3','#1b96ff','#2e844a','#7a288a','#ea780e']
  const TAB_LABELS = ['全体サマリー','SC 振り返り','CS 振り返り','PJ 振り返り','その他トピックス']

  const card = (children:React.ReactNode, style?:React.CSSProperties) => (
    <div style={{background:'#fff',border:'1px solid #e5e5e5',borderRadius:10,padding:20,...style}}>{children}</div>
  )
  const cardHd = (title:string, badge?:string) => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
      <span style={{fontSize:13,fontWeight:600,color:'#1d1d1f'}}>{title}</span>
      {badge && <span style={{fontSize:10,fontWeight:600,padding:'3px 9px',borderRadius:999,border:'1px solid #e5e5e5',color:'#706e6b'}}>{badge}</span>}
    </div>
  )
  const secHd = (label:string) => (
    <div style={{fontSize:11,fontWeight:600,color:'#706e6b',letterSpacing:'0.08em',textTransform:'uppercase' as const,marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
      {label}<div style={{flex:1,height:1,background:'#e5e5e5'}} />
    </div>
  )

  return (
    <div style={{fontFamily:'DM Sans,sans-serif',background:'#f3f2f2',minHeight:'100vh'}}>
      {/* TOP BAR */}
      <div style={{background:'#fff',borderBottom:'1px solid #e5e5e5',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#0176d3,#032d60)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📊</div>
          <span style={{fontSize:15,fontWeight:600,color:'#1d1d1f',letterSpacing:'-.3px'}}>営業 MTG サマリー</span>
          <span style={{color:'#b0adab',margin:'0 2px'}}>/</span>
          <span style={{fontSize:13,color:'#706e6b'}}>{week}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <select value={week} onChange={e=>setWeek(e.target.value)}
            style={{fontSize:12,padding:'5px 10px',border:'1px solid #e5e5e5',borderRadius:7,background:'#fafaf9',color:'#1d1d1f',outline:'none',fontFamily:'DM Sans,sans-serif'}}>
            {Array.from({length:8},(_,i)=>{
              const d=new Date(); d.setDate(d.getDate()-i*7)
              const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0')
              const fd=new Date(y,d.getMonth(),1).getDay(),w=Math.ceil((d.getDate()+fd)/7)
              const lbl=`${y}/${m}/${w}W`
              return <option key={lbl} value={lbl}>{lbl}</option>
            })}
          </select>
          <span style={{fontSize:11,fontWeight:500,padding:'4px 12px',borderRadius:999,border:'1px solid #a3d9a5',color:'#2e844a',background:'#eaf5ea'}}>● ライブデータ</span>
        </div>
      </div>

      {/* TABS */}
      <div style={{background:'#fff',borderBottom:'1px solid #e5e5e5',display:'flex',padding:'0 28px',gap:0,overflowX:'auto'}}>
        {TAB_LABELS.map((label,i)=>(
          <button key={i} onClick={()=>setTab(i)}
            style={{padding:'14px 20px',fontSize:13,fontWeight:tab===i?600:500,color:tab===i?TAB_COLORS[i]:'#706e6b',border:'none',background:'none',cursor:'pointer',borderBottom:`2px solid ${tab===i?TAB_COLORS[i]:'transparent'}`,display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap',fontFamily:'DM Sans,sans-serif',transition:'all .15s'}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:TAB_COLORS[i],flexShrink:0}} />
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{textAlign:'center',padding:40,color:'#706e6b',fontSize:13}}>データを読み込み中...</div>
      )}

      {/* ═══ TAB 0: 全体サマリー ═══ */}
      {!loading && tab===0 && (
        <div style={{padding:'24px 28px',maxWidth:1280,margin:'0 auto'}}>
          {secHd('全体 KPI ― SC + CS 合算')}
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,minmax(0,1fr))',gap:12,marginBottom:20}}>
            <KpiCard label="決定数" value={totalDecided} unit="件" sub={`SC ${scKpi.decided} / CS ${csKpi.decided}`} delta={scDelta+csDelta>0?`↑ ${scDelta+csDelta}`:scDelta+csDelta<0?`↓ ${scDelta+csDelta}`:'→ 0'} color="#0176d3" progress={totalDecided/20*100} />
            <KpiCard label="売上" value={totalSales} unit="万" sub={`SC ${scKpi.sales} / CS ${csKpi.sales}`} color="#2e844a" progress={totalSales/1500*100} />
            <KpiCard label="面談数" value={totalMeetings} unit="件" sub={`SC ${scKpi.meetings} / CS ${csKpi.meetings}`} color="#7a288a" progress={totalMeetings/80*100} />
            <KpiCard label="稼働数" value={totalActive} unit="名" sub={`SC ${scKpi.active} / CS ${csKpi.active}`} color="#ea780e" progress={totalActive/40*100} />
            <KpiCard label="ズバ確定" value={totalZuba} unit="万" sub={`SC ${scKpi.zuba} / CS ${csKpi.zuba}`} color="#032d60" progress={totalZuba/800*100} />
            <KpiCard label="CL見込み" value={totalCl} unit="万" sub={`SC ${scKpi.cl} / CS ${csKpi.cl}`} color="#1c3326" progress={totalCl/500*100} />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                {card(<>
                  {cardHd('SC vs CS チーム比較','今週実績')}
                  <TeamBar label="決定数" scVal={scKpi.decided} csVal={csKpi.decided} scMax={Math.max(scKpi.decided,csKpi.decided)||1} csMax={Math.max(scKpi.decided,csKpi.decided)||1} scLabel={`${scKpi.decided}件`} csLabel={`${csKpi.decided}件`} />
                  <TeamBar label="売上（万）" scVal={scKpi.sales} csVal={csKpi.sales} scMax={Math.max(scKpi.sales,csKpi.sales)||1} csMax={Math.max(scKpi.sales,csKpi.sales)||1} scLabel={`${scKpi.sales}万`} csLabel={`${csKpi.sales}万`} />
                  <TeamBar label="面談数" scVal={scKpi.meetings} csVal={csKpi.meetings} scMax={Math.max(scKpi.meetings,csKpi.meetings)||1} csMax={Math.max(scKpi.meetings,csKpi.meetings)||1} scLabel={`${scKpi.meetings}件`} csLabel={`${csKpi.meetings}件`} />
                </>)}
                {card(<>
                  {cardHd('週次トレンド','決定数・売上')}
                  <div style={{height:180}}>
                    <Line data={{labels:scTrendLabels,datasets:[
                      {label:'SC決定',data:scDecided,borderColor:'#0176d3',backgroundColor:'rgba(1,118,211,0.08)',tension:0.45,pointRadius:3,fill:true,yAxisID:'y'},
                      {label:'CS決定',data:csDecided,borderColor:'#2e844a',backgroundColor:'rgba(46,132,74,0.0)',tension:0.45,pointRadius:3,borderDash:[5,3],yAxisID:'y'},
                    ]}} options={chartOpts()} />
                  </div>
                </>)}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                {card(<>
                  {cardHd('ズバ / CL パイプライン')}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                    <div style={{background:'#e8f4fd',border:'1px solid #aacbf0',borderRadius:8,padding:'14px 16px'}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'#0176d3',marginBottom:8}}>ズバ確定</div>
                      <div style={{fontSize:30,fontWeight:800,color:'#032d60',letterSpacing:'-1.5px'}}>{totalZuba}<span style={{fontSize:14,fontWeight:500}}>万</span></div>
                      <div style={{fontSize:11,color:'#0176d3',marginTop:4}}>SC {scKpi.zuba} / CS {csKpi.zuba}</div>
                    </div>
                    <div style={{background:'#eaf5ea',border:'1px solid #a3d9a5',borderRadius:8,padding:'14px 16px'}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',color:'#2e844a',marginBottom:8}}>CL見込み</div>
                      <div style={{fontSize:30,fontWeight:800,color:'#1c3326',letterSpacing:'-1.5px'}}>{totalCl}<span style={{fontSize:14,fontWeight:500}}>万</span></div>
                      <div style={{fontSize:11,color:'#2e844a',marginTop:4}}>SC {scKpi.cl} / CS {csKpi.cl}</div>
                    </div>
                  </div>
                  <div style={{height:100}}>
                    <Bar data={{labels:['ズバSC','ズバCS','CLSC','CLCS'],datasets:[{data:[scKpi.zuba,csKpi.zuba,scKpi.cl,csKpi.cl],backgroundColor:['#1b96ff','#5bc0f8','#3dba4e','#91db8b'],borderRadius:5}]}} options={chartOpts()} />
                  </div>
                </>)}
                {card(<>
                  {cardHd('広告費・面談単価','手動入力')}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                    {[['SC 広告費（万）',adCostSC,setAdCostSC],['CS 広告費（万）',adCostCS,setAdCostCS]].map(([l,v,s]:any)=>(
                      <div key={l}><label style={{fontSize:10,fontWeight:600,color:'#706e6b',textTransform:'uppercase',letterSpacing:'.04em',display:'block',marginBottom:4}}>{l}</label>
                      <input type="number" value={v} onChange={e=>s(e.target.value)} style={{width:'100%',fontSize:13,fontWeight:600,padding:'8px 10px',border:'1px solid #e5e5e5',borderRadius:7,background:'#fafaf9',color:'#1d1d1f',outline:'none',fontFamily:'DM Mono,monospace'}} /></div>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                    {[['SC 面談単価（万）',unitSC,setUnitSC],['CS 面談単価（万）',unitCS,setUnitCS]].map(([l,v,s]:any)=>(
                      <div key={l}><label style={{fontSize:10,fontWeight:600,color:'#706e6b',textTransform:'uppercase',letterSpacing:'.04em',display:'block',marginBottom:4}}>{l}</label>
                      <input type="number" value={v} onChange={e=>s(e.target.value)} style={{width:'100%',fontSize:13,fontWeight:600,padding:'8px 10px',border:'1px solid #e5e5e5',borderRadius:7,background:'#fafaf9',color:'#1d1d1f',outline:'none',fontFamily:'DM Mono,monospace'}} /></div>
                    ))}
                  </div>
                  <div style={{height:80}}>
                    <Bar data={{labels:['広告費SC','広告費CS','単価SC','単価CS'],datasets:[{data:[Number(adCostSC)||0,Number(adCostCS)||0,Number(unitSC)||0,Number(unitCS)||0],backgroundColor:['#0176d3','#0176d3','#ea780e','#ea780e'],borderRadius:5}]}} options={chartOpts()} />
                  </div>
                </>)}
              </div>
            </div>

            {card(<>
              {cardHd('CA 別ランキング','決定数順')}
              {allCa.map((ca,i)=>(
                <RankRow key={ca.name} rank={i+1} name={ca.name} team={ca.team} val={ca.decided} max={maxDecided} color={ca.team==='SC'?'#0176d3':'#2e844a'} />
              ))}
            </>)}
          </div>
        </div>
      )}

      {/* ═══ TAB 1: SC振り返り ═══ */}
      {!loading && tab===1 && (
        <div style={{padding:'24px 28px',maxWidth:1280,margin:'0 auto'}}>
          {secHd('SC チーム KPI ― 今週実績')}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:12,marginBottom:20}}>
            <KpiCard label="決定数" value={scKpi.decided} unit="件" sub={`先週 ${prevScKpi?.decided??'—'}件`} delta={scDelta>0?`↑ ${scDelta}`:scDelta<0?`↓ ${scDelta}`:'→ 0'} color="#0176d3" progress={scKpi.decided/15*100} />
            <KpiCard label="売上" value={scKpi.sales} unit="万" sub={`先週 ${prevScKpi?.sales??'—'}万`} color="#2e844a" progress={scKpi.sales/800*100} />
            <KpiCard label="面談数" value={scKpi.meetings} unit="件" sub={`先週 ${prevScKpi?.meetings??'—'}件`} color="#7a288a" progress={scKpi.meetings/50*100} />
            <KpiCard label="稼働数" value={scKpi.active} unit="名" sub={`先週 ${prevScKpi?.active??'—'}名`} color="#ea780e" progress={scKpi.active/25*100} />
            <KpiCard label="決定率" value={scKpi.decidedRate.replace('%','')} unit="%" sub="稼働数ベース" color="#032d60" progress={parseFloat(scKpi.decidedRate)||0} />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                {card(<>
                  {cardHd('週次推移','SC 過去6週')}
                  <div style={{height:170}}>
                    <Line data={{labels:scTrendLabels,datasets:[
                      {label:'決定数',data:scDecided,borderColor:'#0176d3',backgroundColor:'rgba(1,118,211,0.08)',tension:0.45,pointRadius:3,fill:true,yAxisID:'y'},
                      {label:'売上(百万)',data:scSales,borderColor:'#1b96ff',tension:0.45,pointRadius:3,borderDash:[5,3],yAxisID:'y1'},
                    ]}} options={chartOpts(true)} />
                  </div>
                </>)}
                {card(<>
                  {cardHd('面談数 / 稼働数','SC 過去6週')}
                  <div style={{height:170}}>
                    <Line data={{labels:scTrendLabels,datasets:[
                      {label:'面談数',data:scHistory.map(r=>calcKpi(r.payload?.overall?.ca||[]).meetings),borderColor:'#7a288a',tension:0.45,pointRadius:3,yAxisID:'y'},
                      {label:'稼働数',data:scHistory.map(r=>calcKpi(r.payload?.overall?.ca||[]).active),borderColor:'#ea780e',tension:0.45,pointRadius:3,borderDash:[5,3],yAxisID:'y1'},
                    ]}} options={chartOpts(true)} />
                  </div>
                </>)}
              </div>
              {card(<>
                {cardHd('週次対比テーブル','SC チーム')}
                <WeekTable history={scHistory} caNames={SC_CA} segment="sc" />
              </>)}
            </div>
            {card(<>
              {cardHd('CA 別実績（SC）')}
              {SC_CA.map((name,i)=>(
                <RankRow key={name} rank={i+1} name={name} team="SC" val={scRows[i]?.decided||0} max={Math.max(...scRows.map(r=>r?.decided||0))||1} color="#0176d3" />
              ))}
            </>)}
          </div>
        </div>
      )}

      {/* ═══ TAB 2: CS振り返り ═══ */}
      {!loading && tab===2 && (
        <div style={{padding:'24px 28px',maxWidth:1280,margin:'0 auto'}}>
          {secHd('CS チーム KPI ― 今週実績')}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:12,marginBottom:20}}>
            <KpiCard label="決定数" value={csKpi.decided} unit="件" sub={`先週 ${prevCsKpi?.decided??'—'}件`} delta={csDelta>0?`↑ ${csDelta}`:csDelta<0?`↓ ${csDelta}`:'→ 0'} color="#2e844a" progress={csKpi.decided/10*100} />
            <KpiCard label="売上" value={csKpi.sales} unit="万" sub={`先週 ${prevCsKpi?.sales??'—'}万`} color="#0176d3" progress={csKpi.sales/500*100} />
            <KpiCard label="面談数" value={csKpi.meetings} unit="件" sub={`先週 ${prevCsKpi?.meetings??'—'}件`} color="#7a288a" progress={csKpi.meetings/30*100} />
            <KpiCard label="稼働数" value={csKpi.active} unit="名" sub={`先週 ${prevCsKpi?.active??'—'}名`} color="#ea780e" progress={csKpi.active/15*100} />
            <KpiCard label="決定率" value={csKpi.decidedRate.replace('%','')} unit="%" sub="稼働数ベース" color="#1c3326" progress={parseFloat(csKpi.decidedRate)||0} />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                {card(<>
                  {cardHd('週次推移','CS 過去6週')}
                  <div style={{height:170}}>
                    <Line data={{labels:csTrendLabels,datasets:[
                      {label:'決定数',data:csDecided,borderColor:'#2e844a',backgroundColor:'rgba(46,132,74,0.08)',tension:0.45,pointRadius:3,fill:true,yAxisID:'y'},
                      {label:'売上(百万)',data:csSales,borderColor:'#3dba4e',tension:0.45,pointRadius:3,borderDash:[5,3],yAxisID:'y1'},
                    ]}} options={chartOpts(true)} />
                  </div>
                </>)}
                {card(<>
                  {cardHd('面談数 / 稼働数','CS 過去6週')}
                  <div style={{height:170}}>
                    <Line data={{labels:csTrendLabels,datasets:[
                      {label:'面談数',data:csHistory.map(r=>calcKpi(r.payload?.cs?.ca||[]).meetings),borderColor:'#7a288a',tension:0.45,pointRadius:3,yAxisID:'y'},
                      {label:'稼働数',data:csHistory.map(r=>calcKpi(r.payload?.cs?.ca||[]).active),borderColor:'#ea780e',tension:0.45,pointRadius:3,borderDash:[5,3],yAxisID:'y1'},
                    ]}} options={chartOpts(true)} />
                  </div>
                </>)}
              </div>
              {card(<>
                {cardHd('週次対比テーブル','CS チーム')}
                <WeekTable history={csHistory} caNames={CS_CA} segment="cs" />
              </>)}
            </div>
            {card(<>
              {cardHd('CA 別実績（CS）')}
              {CS_CA.map((name,i)=>(
                <RankRow key={name} rank={i+1} name={name} team="CS" val={csRows[i]?.decided||0} max={Math.max(...csRows.map(r=>r?.decided||0))||1} color="#2e844a" />
              ))}
            </>)}
          </div>
        </div>
      )}

      {/* ═══ TAB 3: PJ振り返り ═══ */}
      {!loading && tab===3 && (
        <div style={{padding:'24px 28px',maxWidth:1280,margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <div>
              <div style={{fontSize:20,fontWeight:800,letterSpacing:'-.5px'}}>PJ 振り返り</div>
              <div style={{fontSize:12,color:'#706e6b',marginTop:3}}>{latestScWeek} ― 全プロジェクト</div>
            </div>
            <button onClick={()=>{ setPjForm({name:'',owner:'',started:'',total:1,decided:0,sales:0,meetings:0,progress:0,status:'on',done:'',issue:'',next:''}); setShowPjForm(true); }}
              style={{fontSize:12,fontWeight:700,padding:'8px 18px',borderRadius:8,border:'none',background:'#0176d3',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
              ＋ PJを追加
            </button>
          </div>

          {/* 新規追加フォーム */}
          {showPjForm && (
            <div style={{background:'#fff',border:'2px solid #0176d3',borderRadius:10,padding:'20px',marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0176d3',marginBottom:14}}>🆕 新規PJ追加</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                {([['PJ名・企業名',pjForm.name||'','name'],['担当CA',pjForm.owner||'','owner'],['開始日',pjForm.started||'','started']] as [string,string,string][]).map(([l,v,k])=>(
                  <div key={k} style={{gridColumn:k==='name'?'span 2':'auto'}}>
                    <label style={{fontSize:10,fontWeight:600,color:'#706e6b',textTransform:'uppercase',display:'block',marginBottom:3}}>{l}</label>
                    <input value={v} onChange={e=>setPjForm(p=>({...p,[k]:e.target.value}))}
                      style={{width:'100%',fontSize:13,padding:'7px 10px',border:'1px solid #e5e5e5',borderRadius:7,outline:'none',fontFamily:'sans-serif'}} />
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:10}}>
                {([['目標人数',pjForm.total||1,'total','number'],['決定数',pjForm.decided||0,'decided','number'],['売上(万)',pjForm.sales||0,'sales','number'],['完了率%',pjForm.progress||0,'progress','number']] as [string,number,string,string][]).map(([l,v,k,t])=>(
                  <div key={k}>
                    <label style={{fontSize:10,fontWeight:600,color:'#706e6b',textTransform:'uppercase',display:'block',marginBottom:3}}>{l}</label>
                    <input type={t} value={v} onChange={e=>setPjForm(p=>({...p,[k]:Number(e.target.value)}))}
                      style={{width:'100%',fontSize:13,padding:'7px 10px',border:'1px solid #e5e5e5',borderRadius:7,outline:'none'}} />
                  </div>
                ))}
              </div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:10,fontWeight:600,color:'#706e6b',textTransform:'uppercase',display:'block',marginBottom:3}}>ステータス</label>
                <select value={pjForm.status||'on'} onChange={e=>setPjForm(p=>({...p,status:e.target.value as 'on'|'at'|'off'}))}
                  style={{fontSize:13,padding:'7px 10px',border:'1px solid #e5e5e5',borderRadius:7,outline:'none',background:'#fff'}}>
                  <option value="on">● 順調</option><option value="at">● 要注意</option><option value="off">● 遅延</option>
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
                {([['📋 実施したこと',pjForm.done||'','done'],['⚠️ 課題',pjForm.issue||'','issue'],['💡 ネクストアクション',pjForm.next||'','next']] as [string,string,string][]).map(([l,v,k])=>(
                  <div key={k}>
                    <label style={{fontSize:10,fontWeight:600,color:'#706e6b',textTransform:'uppercase',display:'block',marginBottom:3}}>{l}</label>
                    <textarea value={v} onChange={e=>setPjForm(p=>({...p,[k]:e.target.value}))} rows={3}
                      style={{width:'100%',fontSize:12,padding:'7px 10px',border:'1px solid #e5e5e5',borderRadius:7,resize:'none',outline:'none',fontFamily:'sans-serif',lineHeight:1.5}} />
                  </div>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                <button onClick={()=>setShowPjForm(false)} style={{fontSize:12,fontWeight:600,padding:'7px 16px',borderRadius:7,border:'1px solid #e5e5e5',background:'#fff',color:'#706e6b',cursor:'pointer'}}>キャンセル</button>
                <button onClick={()=>{
                  const newId = pjCards.length > 0 ? Math.max(...pjCards.map(p=>p.id))+1 : 1;
                  setPjCards(p=>[...p,{...pjForm as PjCard, id:newId}]);
                  setShowPjForm(false);
                }} style={{fontSize:12,fontWeight:700,padding:'7px 18px',borderRadius:7,border:'none',background:'#0176d3',color:'#fff',cursor:'pointer'}}>追加する</button>
              </div>
            </div>
          )}

          {/* サマリーバー */}
          <div style={{background:'linear-gradient(135deg,#032d60,#0176d3 60%,#1b96ff)',borderRadius:14,padding:'22px 28px',marginBottom:20,display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:0}}>
            {[
              ['PJ総数',`${pjCards.length}`,'SC/CS合計'],
              ['今週決定',`${pjCards.reduce((s,p)=>s+p.decided,0)}`,`${pjCards.filter(p=>p.status==='on').length}件順調`],
              ['累計売上',`${pjCards.reduce((s,p)=>s+p.sales,0)}万`,'全PJ合算'],
              ['要注意',`${pjCards.filter(p=>p.status==='at').length}件`,'要フォロー'],
              ['平均完了率',pjCards.length>0?`${Math.round(pjCards.reduce((s,p)=>s+p.progress,0)/pjCards.length)}%`:'—%','全PJ平均'],
            ].map(([l,v,s],i)=>(
              <div key={l} style={{borderLeft:i>0?'1px solid rgba(255,255,255,.15)':'none',paddingLeft:i>0?24:0}}>
                <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em',color:'rgba(255,255,255,.6)',marginBottom:5}}>{l}</div>
                <div style={{fontSize:28,fontWeight:800,color:'#fff',letterSpacing:'-1px',lineHeight:1}}>{v}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.6)',marginTop:3}}>{s}</div>
              </div>
            ))}
          </div>

          {/* PJカード一覧 */}
          {pjCards.length === 0 && !showPjForm && (
            <div style={{textAlign:'center',padding:60,color:'#706e6b',background:'#fff',borderRadius:10,border:'1px solid #e5e5e5'}}>
              <div style={{fontSize:32,marginBottom:12}}>📋</div>
              <div style={{fontWeight:600,marginBottom:6}}>PJがまだありません</div>
              <div style={{fontSize:12}}>「＋ PJを追加」ボタンから追加できます</div>
            </div>
          )}
          {pjCards.map((pj)=>(
            <div key={pj.id} style={{background:'#fff',border:'1px solid #e5e5e5',borderRadius:10,overflow:'hidden',marginBottom:14}}>
              <div style={{padding:'16px 20px',borderBottom:'1px solid #e5e5e5',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'#1d1d1f'}}>{pj.name}</div>
                  <div style={{fontSize:11,color:'#706e6b',marginTop:3}}>担当: {pj.owner}　開始: {pj.started}　目標: {pj.total}名採用</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:999,textTransform:'uppercase',background:pj.status==='on'?'#eaf5ea':pj.status==='at'?'#fef0e1':'#fce9e9',color:pj.status==='on'?'#2e844a':pj.status==='at'?'#ea780e':'#ba0517'}}>
                    {pj.status==='on'?'● 順調':pj.status==='at'?'● 要注意':'● 遅延'}
                  </span>
                  <button onClick={()=>{ setPjEditId(pjEditId===pj.id?null:pj.id); setPjForm({...pj}); }}
                    style={{fontSize:11,fontWeight:600,padding:'5px 12px',borderRadius:7,border:'1px solid #e5e5e5',background:pjEditId===pj.id?'#0176d3':'#fafaf9',color:pjEditId===pj.id?'#fff':'#706e6b',cursor:'pointer'}}>
                    {pjEditId===pj.id?'保存':'編集'}
                  </button>
                  <button onClick={()=>{ if(pjEditId===pj.id){ setPjCards(p=>p.map(x=>x.id===pj.id?{...pjForm as PjCard,id:pj.id}:x)); setPjEditId(null); } else { setPjCards(p=>p.filter(x=>x.id!==pj.id)); }}}
                    style={{fontSize:11,padding:'5px 10px',borderRadius:7,border:'1px solid #fce9e9',background:'#fce9e9',color:'#ba0517',cursor:'pointer'}}>
                    {pjEditId===pj.id?'確定':'削除'}
                  </button>
                </div>
              </div>
              {pjEditId===pj.id ? (
                <div style={{padding:'16px 20px',borderBottom:'1px solid #e5e5e5'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                    {([['PJ名',pjForm.name||'','name'],['担当CA',pjForm.owner||'','owner'],['開始日',pjForm.started||'','started']] as [string,string,string][]).map(([l,v,k])=>(
                      <div key={k} style={{gridColumn:k==='name'?'span 2':'auto'}}>
                        <label style={{fontSize:10,fontWeight:600,color:'#706e6b',textTransform:'uppercase',display:'block',marginBottom:3}}>{l}</label>
                        <input value={v} onChange={e=>setPjForm(p=>({...p,[k]:e.target.value}))}
                          style={{width:'100%',fontSize:13,padding:'7px 10px',border:'1px solid #e5e5e5',borderRadius:7,outline:'none'}} />
                      </div>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:10}}>
                    {([['目標',pjForm.total||1,'total'],['決定',pjForm.decided||0,'decided'],['売上(万)',pjForm.sales||0,'sales'],['完了%',pjForm.progress||0,'progress']] as [string,number,string][]).map(([l,v,k])=>(
                      <div key={k}>
                        <label style={{fontSize:10,fontWeight:600,color:'#706e6b',textTransform:'uppercase',display:'block',marginBottom:3}}>{l}</label>
                        <input type="number" value={v} onChange={e=>setPjForm(p=>({...p,[k]:Number(e.target.value)}))}
                          style={{width:'100%',fontSize:13,padding:'7px 10px',border:'1px solid #e5e5e5',borderRadius:7,outline:'none'}} />
                      </div>
                    ))}
                  </div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:10,fontWeight:600,color:'#706e6b',textTransform:'uppercase',display:'block',marginBottom:3}}>ステータス</label>
                    <select value={pjForm.status||'on'} onChange={e=>setPjForm(p=>({...p,status:e.target.value as 'on'|'at'|'off'}))}
                      style={{fontSize:13,padding:'7px 10px',border:'1px solid #e5e5e5',borderRadius:7,outline:'none',background:'#fff'}}>
                      <option value="on">● 順調</option><option value="at">● 要注意</option><option value="off">● 遅延</option>
                    </select>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                    {([['📋 実施したこと',pjForm.done||'','done'],['⚠️ 課題',pjForm.issue||'','issue'],['💡 ネクストアクション',pjForm.next||'','next']] as [string,string,string][]).map(([l,v,k])=>(
                      <div key={k}>
                        <label style={{fontSize:10,fontWeight:600,color:'#706e6b',textTransform:'uppercase',display:'block',marginBottom:3}}>{l}</label>
                        <textarea value={v} onChange={e=>setPjForm(p=>({...p,[k]:e.target.value}))} rows={3}
                          style={{width:'100%',fontSize:12,padding:'7px 10px',border:'1px solid #e5e5e5',borderRadius:7,resize:'none',outline:'none',fontFamily:'sans-serif',lineHeight:1.5}} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:'1px solid #e5e5e5'}}>
                  {[['決定数',`${pj.decided}/${pj.total}名`,pj.status==='on'?'#0176d3':'#ea780e'],['累計売上',`${pj.sales}万`,'#2e844a'],['面談数(今週)',`${pj.meetings}件`,'#1d1d1f'],['完了率',`${pj.progress}%`,pj.status==='on'?'#0176d3':'#ea780e']].map(([l,v,c],j)=>(
                    <div key={String(l)} style={{padding:'14px 16px',borderRight:j<3?'1px solid #e5e5e5':'none'}}>
                      <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',color:'#706e6b',marginBottom:4}}>{l}</div>
                      <div style={{fontSize:20,fontWeight:800,letterSpacing:'-.5px',color:c as string}}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
              {pjEditId!==pj.id && (
                <div style={{padding:'16px 20px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                  {([['📋 実施したこと',pj.done],['⚠️ 課題',pj.issue],['💡 ネクストアクション',pj.next]] as [string,string][]).map(([l,v])=>(
                    <div key={l}>
                      <label style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#706e6b',display:'block',marginBottom:5}}>{l}</label>
                      <p style={{fontSize:12,color:'#1d1d1f',lineHeight:1.5}}>{v}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}


      {/* ═══ TAB 4: その他トピックス ═══ */}
      {!loading && tab===4 && (
        <div style={{padding:'24px 28px',maxWidth:1280,margin:'0 auto'}}>
          <div style={{background:'linear-gradient(135deg,#032d60,#0176d3)',borderRadius:14,padding:'32px 36px',marginBottom:20,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)'}} />
            <div style={{position:'relative'}}>
              <h2 style={{fontSize:22,fontWeight:800,color:'#fff',letterSpacing:'-.5px',marginBottom:6}}>その他トピックス</h2>
              <p style={{fontSize:13,color:'rgba(255,255,255,.7)'}}>{week} ― 共有事項・課題・ネクストアクション</p>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {topics.map(t=>(
                <TopicCard key={t.id} topic={t} onDelete={()=>setTopics(topics.filter(x=>x.id!==t.id))} />
              ))}
              {showForm && (
                <TopicForm
                  num={topics.length+1}
                  onSave={t=>{ setTopics([...topics,t]); setShowForm(false) }}
                  onCancel={()=>setShowForm(false)}
                />
              )}
              <button onClick={()=>setShowForm(true)}
                style={{width:'100%',padding:14,border:'1.5px dashed #e5e5e5',borderRadius:10,background:'transparent',color:'#706e6b',fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:'DM Sans,sans-serif',transition:'all .15s'}}>
                + トピックを追加
              </button>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{background:'#fff',border:'1px solid #e5e5e5',borderTop:'3px solid #0176d3',borderRadius:10,padding:20}}>
                <div style={{fontSize:14,fontWeight:800,color:'#1d1d1f',marginBottom:16}}>ネクストアクション</div>
                {[
                  {n:1,text:'△△HD PJ：再サーチ候補者10名追加・面談設定',owner:'茨木 ／ 来週金曜'},
                  {n:2,text:'離脱候補者の辞退理由ヒアリング＆対策案まとめ',owner:'中川 ／ 来週水曜'},
                  {n:3,text:'LinkedIn施策の週次レポートを全体共有',owner:'清野 ／ 来週月曜'},
                  {n:4,text:'ai-interview ツール精度レビューMTG設定',owner:'中川 ／ 来週木曜'},
                ].map(a=>(
                  <div key={a.n} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'12px 14px',borderRadius:8,background:'#f3f2f2',border:'1px solid #e5e5e5',marginBottom:8}}>
                    <div style={{width:20,height:20,borderRadius:'50%',background:'#0176d3',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,flexShrink:0,marginTop:1}}>{a.n}</div>
                    <div>
                      <div style={{fontSize:12,lineHeight:1.5,color:'#1d1d1f'}}>{a.text}</div>
                      <div style={{fontSize:10,fontWeight:600,color:'#0176d3',marginTop:3}}>担当: {a.owner}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
