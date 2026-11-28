"use client";
import { useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import type { Settings } from '@/types/domain';
import { Field, Notice } from './Parts';
import { PhotoField } from './PhotoField';
import { failure, mutate, useUnsavedChanges } from '@/features/admin/client';
import { dateInput, instantInSaoPaulo } from '@/features/admin/format';

const weekdays = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
export function SettingsForm({settings,demo}:{settings:Settings;demo:boolean}) {
  const router=useRouter();
  const {register,control,setValue,reset,handleSubmit,formState:{isDirty,isSubmitting}} = useForm<Settings>({defaultValues:{...settings,announcement_until:dateInput(settings.announcement_until)}});
  const hours=useFieldArray({control,name:'hours'});
  const specials=useFieldArray({control,name:'special_hours'});
  const values=useWatch({control});
  const [error,setError]=useState('');const [message,setMessage]=useState('');const [resetting,setResetting]=useState(false);
  useUnsavedChanges(isDirty);
  async function save(data:Settings) {
    setError('');setMessage('');
    try {
      const value={...data,announcement_until:data.announcement_until ? instantInSaoPaulo(data.announcement_until) : null};
      await mutate('/api/admin/settings','PUT',value);reset(data);setMessage('Configurações salvas.');router.refresh();
    } catch(cause) {setError(failure(cause));}
  }
  async function resetDemo() {
    if(!confirm('Restaurar todos os exemplos da demonstração? As alterações feitas neste ambiente serão descartadas.')) return;
    setResetting(true);setError('');setMessage('');
    try{await mutate('/api/admin/reset','POST');location.reload();} catch(cause){setError(failure(cause));setResetting(false);}
  }
  return <form className="adm-settings" onSubmit={handleSubmit(save)}>
    <section className="adm-surface adm-settings-section"><div className="adm-settings-caption"><h2>Identidade da casa</h2><p>A marca e os textos que os clientes encontram no site.</p></div><div className="adm-settings-fields">
      <div className="adm-form-grid"><Field label="Nome comercial" wide><input {...register('name')} required maxLength={150}/></Field>
        <Field label="Cor principal"><input {...register('primary_color')} type="color"/></Field><Field label="Cor de destaque"><input {...register('accent_color')} type="color"/></Field>
        <Field label="Texto sobre o restaurante" wide><textarea {...register('about')} rows={5} maxLength={6000}/></Field>
        <Field label="CNPJ"><input {...register('cnpj')} maxLength={18}/></Field><label className="adm-check"><input type="checkbox" {...register('show_cnpj')}/> Autorizar exibição do CNPJ</label>
      </div><PhotoField label="Logo oficial" value={values.logo ? {src:values.logo,alt:'Logo do restaurante',illustrative:false}:null} onChange={photo=>setValue('logo',photo?.src || '',{shouldDirty:true})}/>
    </div></section>
    <section className="adm-surface adm-settings-section"><div className="adm-settings-caption"><h2>Contato e localização</h2><p>Confira os canais e o ponto exato com o responsável pelo estabelecimento.</p></div><div className="adm-settings-fields adm-form-grid">
      <Field label="Telefone comercial"><input {...register('phone')} type="tel" required maxLength={24}/></Field>
      <Field label="WhatsApp" hint="Inclua DDD. Ative após confirmar a titularidade e o serviço."><input {...register('whatsapp')} type="tel" maxLength={24}/></Field>
      <label className="adm-check adm-wide"><input type="checkbox" {...register('whatsapp_confirmed')}/> Confirmei que este número pertence à casa e recebe WhatsApp</label>
      <Field label="Perfil do Instagram" wide><input {...register('instagram')} type="url" maxLength={500}/></Field>
      <Field label="Rua e número" wide><input {...register('street')} required maxLength={220}/></Field><Field label="Bairro"><input {...register('district')} required maxLength={120}/></Field>
      <Field label="Cidade"><input {...register('city')} required maxLength={120}/></Field><Field label="Estado"><input {...register('state')} required minLength={2} maxLength={2} pattern="[A-Z]{2}"/></Field>
      <Field label="CEP"><input {...register('postal_code')} maxLength={9}/></Field><Field label="Ponto de referência" wide><input {...register('reference')} maxLength={300}/></Field>
      <Field label="Link confirmado do Google Maps" wide hint="Deixe vazio até validar a localização. O site usará uma pesquisa pelo endereço divulgado."><input {...register('maps_url')} type="url" maxLength={500}/></Field>
    </div></section>
    <section className="adm-surface adm-settings-section"><div className="adm-settings-caption"><h2>Funcionamento</h2><p>Cadastre somente horários confirmados. Todos os horários são de Brasília.</p></div><div className="adm-settings-fields">
      <h3>Horários semanais</h3>{hours.fields.length===0 && <p className="adm-hint">Os clientes serão orientados a consultar os horários com a equipe.</p>}
      {hours.fields.map((field,index)=><div className="adm-hours-row" key={field.id}>
        <Field label={`Dia ${index+1}`}><select {...register(`hours.${index}.day`,{valueAsNumber:true})}>{weekdays.map((day,i)=><option value={i} key={day}>{day}</option>)}</select></Field>
        <Field label="Abre"><input type="time" {...register(`hours.${index}.opens`)} required/></Field><Field label="Fecha"><input type="time" {...register(`hours.${index}.closes`)} required/></Field>
        <button type="button" className="adm-icon-button danger" onClick={()=>hours.remove(index)} aria-label={`Remover horário ${index+1}`}><Trash2 size={17}/></button>
      </div>)}<button type="button" className="adm-btn secondary" onClick={()=>hours.append({day:5,opens:'',closes:''})} disabled={hours.fields.length>=35}><Plus size={16}/>Adicionar horário</button>
      <h3>Feriados e datas especiais</h3><p className="adm-hint">Preencha a data e o aviso. Para indicar fechamento, deixe os dois horários vazios.</p>
      {specials.fields.map((field,index)=><div className="adm-special-row" key={field.id}>
        <Field label="Data"><input type="date" required {...register(`special_hours.${index}.date`)}/></Field><Field label="Aviso"><input required maxLength={160} {...register(`special_hours.${index}.label`)}/></Field>
        <Field label="Abre"><input type="time" {...register(`special_hours.${index}.opens`)}/></Field><Field label="Fecha"><input type="time" {...register(`special_hours.${index}.closes`)}/></Field>
        <button type="button" className="adm-icon-button danger" onClick={()=>specials.remove(index)} aria-label={`Remover data especial ${index+1}`}><Trash2 size={17}/></button>
      </div>)}<button type="button" className="adm-btn secondary" onClick={()=>specials.append({date:'',label:'',opens:'',closes:''})} disabled={specials.fields.length>=370}><Plus size={16}/>Adicionar data especial</button>
    </div></section>
    <section className="adm-surface adm-settings-section"><div className="adm-settings-caption"><h2>Avisos e descoberta</h2><p>Mensagens temporárias e apresentação nos mecanismos de pesquisa.</p></div><div className="adm-settings-fields adm-form-grid">
      <Field label="Aviso temporário" wide><textarea {...register('announcement')} rows={3} maxLength={700}/></Field>
      <Field label="Exibir aviso até" hint="Vazio mantém o aviso até você removê-lo."><input {...register('announcement_until')} type="datetime-local"/></Field>
      <Field label="Título para pesquisas" wide><input {...register('seo_title')} maxLength={180}/></Field>
      <Field label="Descrição para pesquisas" wide><textarea {...register('seo_description')} maxLength={350} rows={3}/></Field>
    </div></section>
    <section className="adm-surface adm-settings-section"><div className="adm-settings-caption"><h2>Recursos do site</h2><p>Ative os serviços após confirmar a operação com o restaurante.</p></div><div className="adm-settings-fields adm-feature-flags">
      <label className="adm-feature"><input type="checkbox" {...register('orders_enabled')}/><span><strong>Pedidos pelo WhatsApp</strong><small>Exige WhatsApp confirmado. O cliente revisa a sacola antes de encaminhar.</small></span></label>
      <label className="adm-feature"><input type="checkbox" {...register('pickup_enabled')}/><span><strong>Retirada no local</strong><small>Indique apenas quando a modalidade estiver disponível.</small></span></label>
      <label className="adm-feature"><input type="checkbox" {...register('delivery_enabled')}/><span><strong>Entrega</strong><small>As condições e o atendimento são combinados com a equipe.</small></span></label>
      <label className="adm-feature"><input type="checkbox" {...register('reservations_enabled')}/><span><strong>Solicitações de reserva</strong><small>Os pedidos entram como pendentes e dependem de resposta da casa.</small></span></label>
      <label className="adm-feature"><input type="checkbox" {...register('analytics_enabled')}/><span><strong>Métricas de utilização autorizadas</strong><small>As medições opcionais também dependem do consentimento do visitante.</small></span></label>
      <label className="adm-feature"><input type="checkbox" {...register('maintenance')}/><span><strong>Modo de manutenção</strong><small>Apresenta um aviso público enquanto você prepara o conteúdo.</small></span></label>
      {demo && <p className="adm-demo-note">A demonstração mantém pedidos e reservas reais bloqueados.</p>}
    </div></section>
    <Notice text={error} error/><Notice text={message}/>
    <div className="adm-settings-save"><span>{isDirty ? 'Você tem alterações para salvar.' : 'Configurações atualizadas.'}</span><button className="adm-btn" type="submit" disabled={isSubmitting}><Save size={17}/>{isSubmitting?'Salvando…':'Salvar configurações'}</button></div>
    {demo && <section className="adm-surface adm-reset"><div><h2>Recomeçar a demonstração</h2><p>Restaure o cardápio e os demais exemplos para uma nova apresentação.</p></div><button className="adm-btn secondary" type="button" onClick={()=>void resetDemo()} disabled={resetting}><RotateCcw size={17}/>{resetting?'Restaurando…':'Redefinir demonstração'}</button></section>}
  </form>;
}
