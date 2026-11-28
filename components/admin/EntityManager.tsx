"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Archive, ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Copy, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { Catalog, Entity, EntityMap, Status } from "@/types/domain";
import { Heading, Notice, StatusBadge } from "./Parts";
import { EntityEditor } from "./EntityEditor";
import { failure, mutate } from "@/features/admin/client";
import { money, searchable, formatDate } from "@/features/admin/format";

const nouns: Record<Entity,{title:string;new:string;one:string;description:string}> = {
  products:{title:'Cardápio',new:'Novo produto',one:'produto',description:'Preços, fotografias e disponibilidade dos itens da casa.'},
  categories:{title:'Categorias',new:'Nova categoria',one:'categoria',description:'Organize o cardápio na sequência que seus clientes devem encontrar.'},
  events:{title:'Eventos',new:'Novo evento',one:'evento',description:'Publique a programação confirmada e mantenha o histórico da casa.'},
  promotions:{title:'Promoções',new:'Nova promoção',one:'promoção',description:'Ofertas com preço e vigência definidos. A exibição termina automaticamente.'},
  gallery:{title:'Galeria',new:'Nova fotografia',one:'fotografia',description:'Fotografias autorizadas, descrições e links de publicações do Instagram.'},
};
function title(item:EntityMap[Entity]) {return 'name' in item ? item.name : 'title' in item ? item.title : item.image.alt;}

export function EntityManager({entity,catalog}: {entity:Entity;catalog:Catalog}) {
  const router = useRouter();
  const [query,setQuery] = useState('');
  const [status,setStatus] = useState('all');
  const [page,setPage] = useState(1);
  const [editing,setEditing] = useState<EntityMap[Entity] | null>(null);
  const [open,setOpen] = useState(false);
  const [dirty,setDirty] = useState(false);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const info = nouns[entity];
  const records:EntityMap[Entity][] = catalog[entity];
  const matching = records.filter(item => (status === 'all' || item.status === status) && searchable(title(item)).includes(searchable(query)))
    .sort((a,b) => a.position-b.position || title(a).localeCompare(title(b),'pt-BR'));
  const pages = Math.max(1,Math.ceil(matching.length/12));
  const current = Math.min(page,pages);
  const rows = matching.slice((current-1)*12,current*12);
  function close(next:boolean) {if (!next && dirty && !confirm('Descartar as alterações deste cadastro?')) return;setOpen(next);if (!next) setDirty(false);}
  function edit(item:EntityMap[Entity] | null) {setEditing(item);setDirty(false);setOpen(true);setError('');setMessage('');}
  async function action(url:string,method:'POST'|'PATCH'|'DELETE',body?:unknown,success='Cadastro atualizado.') {
    setBusy(true);setError('');setMessage('');
    try {await mutate(url,method,body);setMessage(success);router.refresh();}
    catch(cause) {setError(failure(cause));} finally {setBusy(false);}
  }
  function duplicate(item:EntityMap[Entity]) {
    const copy:Record<string,unknown>={...item};delete copy.id;copy.status='draft';
    if ('name' in item) copy.name=`${item.name} (cópia)`;
    if ('title' in item) copy.title=`${item.title} (cópia)`;
    if ('slug' in item) copy.slug=`${item.slug.slice(0,70)}-copia-${crypto.randomUUID().slice(0,8)}`;
    void action(`/api/admin/${entity}`,'POST',copy,'Cópia criada como rascunho.');
  }
  const availableCategories = entity !== 'products' || catalog.categories.length > 0;
  const availableProducts = entity !== 'promotions' || catalog.products.length > 0;
  return <>
    <Heading title={info.title} description={info.description} action={<button className="adm-btn" onClick={() => edit(null)} disabled={!availableCategories || !availableProducts}><Plus size={17}/>{info.new}</button>}/>
    {catalog.demo && <p className="adm-demo-note">Ambiente de demonstração. Os exemplos e suas alterações ficam no banco de apresentação.</p>}
    {!availableCategories && <p className="adm-flash">Cadastre uma categoria para começar a adicionar produtos.</p>}
    {!availableProducts && <p className="adm-flash">Cadastre um produto para criar a primeira promoção.</p>}
    <Notice text={message}/><Notice text={error} error/>
    <div className="adm-surface">
      <div className="adm-toolbar"><label className="adm-search"><Search size={17}/><span className="adm-sr-only">Pesquisar cadastros</span><input type="search" placeholder={`Pesquisar ${info.title.toLowerCase()}`} value={query} onChange={event => {setQuery(event.target.value);setPage(1);}}/></label>
        <label className="adm-filter"><span className="adm-sr-only">Filtrar por publicação</span><select value={status} onChange={event => {setStatus(event.target.value);setPage(1);}}><option value="all">Todas as publicações</option><option value="published">Publicados</option><option value="draft">Rascunhos</option><option value="archived">Arquivados</option></select></label>
      </div>
      {rows.length ? <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>{entity === 'gallery' ? 'Fotografia' : 'Nome'}</th><th>Informações</th><th>Publicação</th>{entity==='products' && <th>Disponibilidade</th>}<th>Ordem</th><th><span className="adm-sr-only">Ações</span></th></tr></thead>
        <tbody>{rows.map(item => {
          const photo='image' in item ? item.image : null;
          return <tr key={item.id}><td><div className="adm-record-title">{photo && <Image src={photo.src} alt="" width={52} height={52} unoptimized/>}<button className="adm-record-name" onClick={() => edit(item)}>{title(item)}</button></div></td>
            <td><div className="adm-record-details">{'price_cents' in item && <strong>{money(item.price_cents)}</strong>}{'category_id' in item && <small>{catalog.categories.find(c=>c.id===item.category_id)?.name}</small>}
              {'starts_at' in item && <small>{formatDate(item.starts_at,true)}{'ends_at' in item && item.ends_at && <><br/>até {formatDate(item.ends_at,true)}</>}</small>}
              {entity==='categories' && <span>{catalog.products.filter(p=>p.category_id===item.id).length} produtos</span>}
              {'category' in item && <span>{item.category}</span>}{photo?.illustrative && <small>Imagem ilustrativa</small>}</div></td>
            <td><StatusBadge status={item.status as Status}/></td>
            {'available' in item && <td><button className={`adm-availability ${item.available ? 'available' : ''}`} aria-label={`Disponibilidade de ${item.name}`} aria-pressed={item.available} disabled={busy}
              onClick={() => void action(`/api/admin/${entity}/${item.id}`,'PATCH',{available:!item.available})}>{item.available ? <Check size={14}/> : <X size={14}/>} {item.available ? 'Disponível' : 'Indisponível'}</button></td>}
            <td><div className="adm-order-controls"><button className="adm-icon-button" disabled={busy || item.position===0} aria-label={`Subir ${title(item)}`} onClick={() => void action(`/api/admin/${entity}/${item.id}`,'PATCH',{position:Math.max(0,item.position-1)})}><ArrowUp size={14}/></button><span>{item.position}</span><button className="adm-icon-button" disabled={busy} aria-label={`Descer ${title(item)}`} onClick={() => void action(`/api/admin/${entity}/${item.id}`,'PATCH',{position:item.position+1})}><ArrowDown size={14}/></button></div></td>
            <td><div className="adm-table-actions"><button className="adm-icon-button" aria-label={`Editar ${title(item)}`} onClick={() => edit(item)}><Pencil size={16}/></button>
              {entity==='products' && <button className="adm-icon-button" disabled={busy} aria-label={`Duplicar ${title(item)}`} onClick={() => duplicate(item)}><Copy size={16}/></button>}
              {item.status!=='archived' && <button className="adm-icon-button" disabled={busy} aria-label={`Arquivar ${title(item)}`} onClick={() => {if(confirm(`Arquivar “${title(item)}” e retirá-lo das páginas públicas?`)) void action(`/api/admin/${entity}/${item.id}`,'PATCH',{status:'archived'});}}><Archive size={16}/></button>}
              <button className="adm-icon-button danger" disabled={busy} aria-label={`Excluir ${title(item)}`} onClick={() => {if(confirm(`Excluir definitivamente “${title(item)}”? Esta ação não pode ser desfeita.`)) void action(`/api/admin/${entity}/${item.id}`,'DELETE',undefined,'Cadastro excluído.');}}><Trash2 size={16}/></button></div></td></tr>;
        })}</tbody></table></div> : <div className="adm-empty"><h2>{query || status!=='all' ? 'Nenhum resultado para estes filtros' : `Sua primeira ${entity==='products' ? 'seleção de produtos' : info.one} começa aqui`}</h2><p>{query || status!=='all' ? 'Ajuste a pesquisa ou o status de publicação.' : 'Adicione conteúdo confirmado e escolha quando ele aparecerá no site.'}</p></div>}
      <div className="adm-pagination"><span>{matching.length} {matching.length===1 ? 'cadastro' : 'cadastros'}</span><div><button className="adm-icon-button" disabled={current<=1} onClick={()=>setPage(current-1)} aria-label="Página anterior"><ChevronLeft size={17}/></button><span>{current} de {pages}</span><button className="adm-icon-button" disabled={current>=pages} onClick={()=>setPage(current+1)} aria-label="Próxima página"><ChevronRight size={17}/></button></div></div>
    </div>
    <Dialog.Root open={open} onOpenChange={close}><Dialog.Portal><Dialog.Overlay className="adm-overlay"/><Dialog.Content className="adm-dialog" onPointerDownOutside={event=>event.preventDefault()}>
      <div className="adm-dialog-heading"><div><Dialog.Title>{editing ? `Editar ${info.one}` : info.new}</Dialog.Title><Dialog.Description>Revise as informações e a publicação antes de salvar.</Dialog.Description></div><Dialog.Close className="adm-icon-button" aria-label="Fechar edição"><X size={21}/></Dialog.Close></div>
      <EntityEditor entity={entity} item={editing} catalog={catalog} onDirty={setDirty} onSaved={()=>{setOpen(false);setDirty(false);setMessage('Cadastro salvo.');router.refresh();}}/>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </>;
}
