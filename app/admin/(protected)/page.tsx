import Link from 'next/link';
import { ArrowRight, CalendarDays, Camera, ChefHat, QrCode, Settings, CircleCheck, CircleAlert } from 'lucide-react';
import { Heading } from '@/components/admin/Parts';
import { panelCatalog } from '@/features/admin/data';
import { listMetrics } from '@/services/store';
import { dateInput, instantInSaoPaulo, nextDate } from '@/features/admin/format';

export default async function Dashboard(){
  const catalog=await panelCatalog();const {products,categories,events,promotions,settings,demo}=catalog;
  const now=new Date().getTime();const today=dateInput(new Date()).slice(0,10);
  const metrics=settings.analytics_enabled ? await listMetrics(instantInSaoPaulo(`${nextDate(today,-29)}T00:00`),instantInSaoPaulo(`${nextDate(today)}T00:00`)) : [];
  const live=products.filter(p=>p.status==='published');
  const unavailable=products.filter(p=>!p.available && p.status!=='archived').length;
  const upcoming=events.filter(event=>event.status==='published' && Date.parse(event.ends_at || event.starts_at)>=now);
  const activePromotions=promotions.filter(p=>p.status==='published' && Date.parse(p.starts_at)<=now && Date.parse(p.ends_at)>now);
  const checks=[
    {label:'Cardápio publicado',ready:live.length>0,href:'/admin/cardapio'},
    {label:'Horários confirmados',ready:settings.hours.length>0,href:'/admin/configuracoes'},
    {label:'Localização validada',ready:Boolean(settings.maps_url),href:'/admin/configuracoes'},
    {label:'Logo oficial cadastrada',ready:Boolean(settings.logo),href:'/admin/configuracoes'},
  ];
  return <>
    <Heading title="A casa, em dia." description="Um olhar sobre o cardápio e as informações que chegam aos seus clientes." action={<Link className="adm-btn" href="/admin/cardapio">Gerenciar cardápio <ArrowRight size={17}/></Link>}/>
    {demo && <div className="adm-demo-note">Você está na demonstração comercial. Explore os exemplos, edite e use as configurações para recomeçar.</div>}
    <section className="adm-stat-grid" aria-label="Resumo do conteúdo">{[
      {title:'Produtos cadastrados',value:products.length,note:`${live.length} ${live.length===1?'publicado':'publicados'}`,href:'/admin/cardapio'},
      {title:'Produtos disponíveis',value:products.filter(p=>p.available && p.status!=='archived').length,note:`${unavailable} ${unavailable===1?'indisponível':'indisponíveis'}`,href:'/admin/cardapio'},
      {title:'Categorias ativas',value:categories.filter(c=>c.status==='published').length,note:'Organização do cardápio',href:'/admin/categorias'},
      {title:'Eventos futuros',value:upcoming.length,note:`${activePromotions.length} promoções vigentes`,href:'/admin/eventos'},
    ].map(item=><Link href={item.href} key={item.title} className="adm-stat"><span>{item.title}</span><strong>{item.value}</strong><small>{item.note}</small><ArrowRight size={17}/></Link>)}</section>
    <div className="adm-dashboard-grid"><section className="adm-surface adm-dashboard-panel"><div className="adm-section-heading"><h2>O que vamos atualizar?</h2><span>Rotina da casa</span></div>
      <div className="adm-quick-links">{[
        {title:'Cardápio e preços',description:'Edite itens ou ajuste a disponibilidade.',href:'/admin/cardapio',Icon:ChefHat},
        {title:'Próximos encontros',description:'Cadastre a programação confirmada.',href:'/admin/eventos',Icon:CalendarDays},
        {title:'Novas fotografias',description:'Atualize os registros da casa.',href:'/admin/galeria',Icon:Camera},
        {title:'QR Code nas mesas',description:'Prepare os materiais para impressão.',href:'/admin/qr-code',Icon:QrCode},
      ].map(({Icon,...item})=><Link href={item.href} key={item.href}><span className="adm-quick-icon"><Icon size={22}/></span><span><strong>{item.title}</strong><small>{item.description}</small></span><ArrowRight size={17}/></Link>)}</div>
    </section><section className="adm-surface adm-dashboard-panel"><div className="adm-section-heading"><h2>Informações da casa</h2><Settings size={18}/></div><div className="adm-readiness">{checks.map(check=><Link href={check.href} key={check.label}>{check.ready?<CircleCheck size={19}/>:<CircleAlert size={19}/>}<span>{check.label}</span><small>{check.ready?'Preenchido':'A conferir'}</small></Link>)}</div><p className="adm-hint">Mantenha os dados confirmados com o responsável pelo estabelecimento.</p></section></div>
    <section className="adm-surface adm-dashboard-panel"><div className="adm-section-heading"><div><h2>Interesse pelo restaurante</h2><p>Últimos 30 dias · horário de Brasília</p></div><Link className="adm-text-button" href="/admin/metricas">Ver métricas <ArrowRight size={16}/></Link></div>
      {settings.analytics_enabled?<div className="adm-metric-overview">{[{kind:'menu',label:'Visualizações do cardápio'},{kind:'contact',label:'Cliques em contato'},{kind:'qr',label:'Acessos por QR Code'},{kind:'directions',label:'Cliques em como chegar'}].map(item=><div key={item.kind}><strong>{metrics.filter(m=>m.kind===item.kind).length}</strong><span>{item.label}</span></div>)}</div>:<p className="adm-hint">As métricas opcionais estão desativadas. A ativação pode ser feita nas configurações após autorização do restaurante.</p>}
    </section>
  </>;
}
