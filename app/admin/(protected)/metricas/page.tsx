import Link from 'next/link';
import { Heading } from '@/components/admin/Parts';
import { panelCatalog } from '@/features/admin/data';
import { listMetrics } from '@/services/store';
import { dateInput, instantInSaoPaulo, nextDate } from '@/features/admin/format';
import type { Metric, MetricKind } from '@/types/domain';

function dateValid(value:unknown):value is string {return typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
function grouped(metrics:Metric[],kind:MetricKind,names:Map<string,string>){const rows=new Map<string,number>();for(const metric of metrics.filter(m=>m.kind===kind)){const name=names.get(metric.subject)||metric.subject||'Sem identificação';rows.set(name,(rows.get(name)||0)+1);}return [...rows].sort((a,b)=>b[1]-a[1]).slice(0,10);}
function Ranking({title,rows}:{title:string;rows:[string,number][]}){const max=rows[0]?.[1]||1;return <section className="adm-surface adm-dashboard-panel"><h2>{title}</h2>{rows.length?<ol className="adm-ranking">{rows.map(([label,count])=><li key={label}><div><span>{label}</span><strong>{count}</strong></div><progress value={count} max={max} aria-label={`${label}, ${count} acessos`}/></li>)}</ol>:<p className="adm-hint">Ainda não há registros neste período.</p>}</section>;}
export default async function MetricsPage({searchParams}:{searchParams:Promise<{from?:string;to?:string}>}){
  const catalog=await panelCatalog();const params=await searchParams;const today=dateInput(new Date()).slice(0,10);
  const from=dateValid(params.from)?params.from:nextDate(today,-29);const to=dateValid(params.to)?params.to:today;
  const invalid=from>to || Date.parse(to)-Date.parse(from)>366*86400000;
  const metrics=invalid?[]:await listMetrics(instantInSaoPaulo(`${from}T00:00`),instantInSaoPaulo(`${nextDate(to)}T00:00`));
  const productNames=new Map(catalog.products.flatMap(p=>[[p.id,p.name],[p.slug,p.name]]));const categoryNames=new Map(catalog.categories.flatMap(c=>[[c.id,c.name],[c.slug,c.name]]));
  const labels:Record<MetricKind,string>={menu:'Visualizações do cardápio',product:'Visualizações de produtos',category:'Consultas de categorias',contact:'Cliques em contato',directions:'Cliques em como chegar',qr:'Acessos por QR Code',reservation:'Solicitações de reserva'};
  return <><Heading title="Métricas" description="Acompanhe o interesse pelo cardápio e pelos canais da casa."/>
    {!catalog.settings.analytics_enabled&&<p className="adm-demo-note">A coleta opcional está desativada. Os registros anteriores continuam disponíveis para consulta.</p>}
    <div className="adm-surface adm-metrics-filters"><nav aria-label="Períodos das métricas">{[{label:'Hoje',days:0},{label:'Últimos 7 dias',days:6},{label:'Últimos 30 dias',days:29}].map(period=><Link className="adm-btn secondary" key={period.days} href={`/admin/metricas?from=${nextDate(today,-period.days)}&to=${today}`}>{period.label}</Link>)}</nav>
      <form className="adm-row" action="/admin/metricas"><label className="adm-field"><span>De</span><input name="from" type="date" defaultValue={from} required/></label><label className="adm-field"><span>Até</span><input name="to" type="date" defaultValue={to} required/></label><button className="adm-btn" type="submit">Aplicar período</button></form>
      <p className="adm-hint">Datas inclusivas, no horário de Brasília. Limite de 366 dias por consulta.</p></div>
    {invalid&&<p className="adm-flash error" role="alert">Escolha um período de até 366 dias, com a data inicial anterior ou igual à final.</p>}
    <section className="adm-stat-grid">{Object.entries(labels).map(([kind,label])=><div className="adm-stat" key={kind}><span>{label}</span><strong>{metrics.filter(metric=>metric.kind===kind).length}</strong></div>)}</section>
    <div className="adm-dashboard-grid"><Ranking title="Produtos mais consultados" rows={grouped(metrics,'product',productNames)}/><Ranking title="Categorias mais consultadas" rows={grouped(metrics,'category',categoryNames)}/></div>
    <div className="adm-dashboard-grid"><Ranking title="Origem dos QR Codes" rows={grouped(metrics,'qr',new Map())}/><Ranking title="Campanhas identificadas" rows={[...metrics.filter(m=>m.campaign).reduce((map,metric)=>map.set(metric.campaign,(map.get(metric.campaign)||0)+1),new Map<string,number>())].sort((a,b)=>b[1]-a[1]).slice(0,10)}/></div>
    <p className="adm-hint">Cada indicador conta os eventos registrados com consentimento. Cliques e visualizações medem interesse. O fechamento comercial depende do atendimento da equipe.</p>
  </>;
}
