"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { Reservation, ReservationStatus } from '@/types/domain';
import { Notice } from './Parts';
import { failure,mutate } from '@/features/admin/client';
import { formatDate,reservationLabels,searchable } from '@/features/admin/format';
export function Reservations({records}:{records:Reservation[]}){
  const router=useRouter();const [query,setQuery]=useState('');const [status,setStatus]=useState('all');const [page,setPage]=useState(1);
  const [busy,setBusy]=useState('');const [error,setError]=useState('');const [message,setMessage]=useState('');
  const found=records.filter(record=>(status==='all'||record.status===status)&&searchable(`${record.name} ${record.phone}`).includes(searchable(query))).sort((a,b)=>b.created_at.localeCompare(a.created_at));
  const pages=Math.max(1,Math.ceil(found.length/10));const current=Math.min(page,pages);
  async function change(record:Reservation,next:ReservationStatus){if(next===record.status)return;if(!confirm(`Alterar a solicitação de ${record.name} para “${reservationLabels[next]}”? Confirme também o retorno ao cliente pelo canal combinado.`))return;
    setBusy(record.id);setError('');setMessage('');try{await mutate(`/api/admin/reservations/${record.id}`,'PATCH',{status:next});setMessage('Status atualizado. A equipe deve comunicar a resposta ao cliente.');router.refresh();}catch(cause){setError(failure(cause));}finally{setBusy('');}}
  return <><Notice text={error} error/><Notice text={message}/><div className="adm-surface"><div className="adm-toolbar"><label className="adm-search"><Search size={17}/><span className="adm-sr-only">Buscar reserva</span><input value={query} type="search" placeholder="Nome ou telefone" onChange={event=>{setQuery(event.target.value);setPage(1);}}/></label><select aria-label="Filtrar reservas" value={status} onChange={event=>{setStatus(event.target.value);setPage(1);}}><option value="all">Todos os estados</option>{Object.entries(reservationLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div>
    <div className="adm-reservations">{found.length?found.slice((current-1)*10,current*10).map(record=><article key={record.id}><div><h2>{record.name}</h2><a href={`tel:${record.phone.replace(/[^\d+]/g,'')}`}>{record.phone}</a><p>{formatDate(`${record.date}T12:00:00Z`)} às {record.time} · {record.people} pessoas</p>{record.notes&&<p className="adm-reservation-notes">{record.notes}</p>}<small>Recebida em {formatDate(record.created_at,true)}</small></div><label className="adm-field"><span>Estado da solicitação</span><select value={record.status} disabled={busy===record.id} onChange={event=>void change(record,event.target.value as ReservationStatus)}>{Object.entries(reservationLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></article>):<div className="adm-empty"><h2>Nenhuma solicitação neste filtro</h2><p>As solicitações recebidas pelo site aparecerão aqui.</p></div>}</div>
    <div className="adm-pagination"><span>{found.length} solicitações</span><div><button className="adm-icon-button" disabled={current===1} aria-label="Página anterior" onClick={()=>setPage(current-1)}><ChevronLeft size={17}/></button><span>{current} de {pages}</span><button className="adm-icon-button" disabled={current===pages} aria-label="Próxima página" onClick={()=>setPage(current+1)}><ChevronRight size={17}/></button></div></div>
  </div></>;
}
