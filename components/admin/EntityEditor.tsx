"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Eye, Plus, Save, Trash2 } from "lucide-react";
import type { Catalog, Entity, EntityMap } from "@/types/domain";
import { Field, Notice } from "./Parts";
import { PhotoField } from "./PhotoField";
import { editorPayload, editorValues, type EditorValues } from "@/features/admin/editor-values";
import { failure, mutate, useUnsavedChanges } from "@/features/admin/client";
import { makeSlug } from "@/features/admin/format";

export function EntityEditor({entity, item, catalog, onSaved, onDirty}: {
  entity: Entity; item: EntityMap[Entity] | null; catalog: Catalog; onSaved: () => void; onDirty: (dirty: boolean) => void;
}) {
  const {register, handleSubmit, setValue, control, formState:{isDirty, isSubmitting, errors}} = useForm<EditorValues>({defaultValues:editorValues(entity, item, catalog)});
  const variants = useFieldArray({control, name:"variants"});
  const addons = useFieldArray({control, name:"addons"});
  const values = useWatch({ control }) as EditorValues;
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  useUnsavedChanges(isDirty);
  useEffect(() => {onDirty(isDirty);}, [isDirty, onDirty]);
  const products = entity === 'products';
  const events = entity === 'events';
  const promotions = entity === 'promotions';
  const gallery = entity === 'gallery';
  const categories = entity === 'categories';
  async function save(value: EditorValues) {
    setError("");
    try {
      const payload = editorPayload(entity,value);
      await mutate(`/api/admin/${entity}${item ? `/${item.id}` : ""}`,item ? "PATCH" : "POST",payload);
      onDirty(false); onSaved();
    } catch (cause) {setError(failure(cause));}
  }
  return <form onSubmit={handleSubmit(save)} className="adm-editor">
    <div className="adm-form-grid">
      {!gallery && <Field label="Nome" wide><input {...register("name",{required:"Informe o nome.",maxLength:160})} autoFocus required maxLength={160}
        onBlur={() => {if (!values.slug && values.name) setValue("slug", makeSlug(values.name), {shouldDirty:true});}}/></Field>}
      {(products || events || categories) && <Field label="Endereço da página" hint="Use palavras separadas por hífens, como porcao-da-casa."><input {...register("slug")} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} placeholder="gerado-a-partir-do-nome"/></Field>}
      <Field label="Publicação"><select {...register("status")}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></Field>
      <Field label="Ordem de exibição" hint="Números menores aparecem primeiro."><input {...register("position",{valueAsNumber:true})} type="number" required min="0" max="1000000"/></Field>
      {products && <Field label="Categoria"><select {...register("category_id",{required:true})} required><option value="">Selecione</option>{catalog.categories.map(category => <option key={category.id} value={category.id}>{category.name}{category.status !== 'published' ? ' (não publicada)' : ''}</option>)}</select></Field>}
      {promotions && <Field label="Produto"><select {...register("product_id",{required:true})} required><option value="">Selecione</option>{catalog.products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field>}
      {(products || events || promotions) && <Field label={promotions ? "Preço promocional (R$)" : events ? "Entrada (R$)" : "Preço (R$)"} hint={promotions ? undefined : "Deixe vazio para informar preço a consultar. Use 0 para gratuito."}><input {...register("price")} inputMode="decimal" placeholder="0,00" required={promotions}/></Field>}
      {(products || events) && <Field label="Descrição" wide><textarea {...register("description")} rows={4} maxLength={products ? 4000 : 6000}/></Field>}
      {(products || events || promotions) && <div className="adm-wide adm-checkboxes">
        {products && <label className="adm-check"><input type="checkbox" {...register("available")}/> Disponível para consumo</label>}
        <label className="adm-check"><input type="checkbox" {...register("featured")}/> Exibir em destaque na página inicial</label>
      </div>}
      {events && <Field label="Artista ou atração"><input {...register("artist")} maxLength={200}/></Field>}
      {(events || promotions) && <><Field label="Início (horário de Brasília)"><input {...register("starts_at")} type="datetime-local" required/></Field>
        <Field label="Término (horário de Brasília)"><input {...register("ends_at")} type="datetime-local" required={promotions}/></Field></>}
      {events && <Field label="Informações complementares" wide><textarea {...register("notes")} rows={3} maxLength={2000}/></Field>}
      {gallery && <><Field label="Categoria da fotografia"><input {...register("category")} maxLength={100} required placeholder="Ambiente, gastronomia, eventos…"/></Field>
        <Field label="Link da publicação no Instagram" hint="Opcional. Use somente publicações reais autorizadas."><input {...register("instagram_url")} type="url" maxLength={500} placeholder="https://www.instagram.com/p/…"/></Field></>}
    </div>
    {!categories && <PhotoField value={values.image} required={gallery} onChange={value => setValue("image", value,{shouldDirty:true})}/>}
    {products && <>
      <details className="adm-details"><summary>Ingredientes e informações do produto</summary><p className="adm-hint">Preencha com as informações confirmadas pela equipe do restaurante.</p>
        <div className="adm-form-grid"><Field label="Ingredientes" wide><textarea {...register("ingredients")} rows={3} maxLength={2000}/></Field>
          <Field label="Alergênicos" wide><textarea {...register("allergens")} rows={2} maxLength={2000}/></Field>
          <Field label="Pessoas servidas"><input {...register("serves")} maxLength={120} placeholder="Quantidade informada pela casa"/></Field></div>
      </details>
      <details className="adm-details"><summary>Variações e adicionais</summary>
        <p className="adm-hint">As variações têm preço próprio. Os adicionais são somados ao item escolhido.</p>
        {([['variants', variants, 'Variações'], ['addons', addons, 'Adicionais']] as const).map(([key, fieldArray, label]) => <section className="adm-price-list" key={key}>
          <h3>{label}</h3>{fieldArray.fields.map((field,index) => <div className="adm-price-row" key={field.id}>
            <Field label={`Nome ${key === 'variants' ? 'da variação' : 'do adicional'} ${index+1}`}><input {...register(`${key}.${index}.name`)} required maxLength={100}/></Field>
            <Field label="Preço em reais"><input {...register(`${key}.${index}.price`)} required inputMode="decimal"/></Field>
            <button type="button" className="adm-icon-button danger" aria-label={`Remover ${label.toLowerCase()} ${index+1}`} onClick={() => fieldArray.remove(index)}><Trash2 size={17}/></button>
          </div>)}<button className="adm-btn secondary" type="button" disabled={fieldArray.fields.length >= 50} onClick={() => fieldArray.append({name:"",price:""})}><Plus size={15}/>Adicionar {key === 'variants' ? 'variação' : 'adicional'}</button>
        </section>)}
      </details>
      <details className="adm-details"><summary>Fotografias adicionais</summary>
        {values.images.map((photo,index) => <PhotoField key={index} value={photo} label={`Foto adicional ${index+1}`} onChange={newPhoto => setValue("images", newPhoto ? values.images.map((value,i) => i===index ? newPhoto : value) : values.images.filter((_,i) => i!==index), {shouldDirty:true})}/>)}
        {values.images.length < 20 && <PhotoField value={null} label="Adicionar outra foto" onChange={value => {if(value) setValue("images", [...values.images,value],{shouldDirty:true});}}/>}
      </details>
    </>}
    <button type="button" className="adm-text-button" onClick={() => setPreview(!preview)} aria-expanded={preview}><Eye size={17}/>{preview ? 'Fechar prévia' : 'Conferir prévia'}</button>
    {preview && <div className="adm-preview" aria-label="Prévia do cadastro">{values.image && <Image src={values.image.src} alt={values.image.alt || "Prévia"} width={480} height={280} unoptimized/>}
      <div><small>{values.status === 'published' ? 'Será publicado ao salvar' : 'Visível apenas no painel'}</small><h3>{values.name || values.image?.alt || 'Novo cadastro'}</h3>
      <p>{values.description}</p>{values.price && <strong>R$ {values.price}</strong>}{values.image?.illustrative && <small>Imagem ilustrativa</small>}</div></div>}
    <Notice text={error} error/>
    {Object.keys(errors).length > 0 && <p className="adm-field-error" role="alert">Confira os campos obrigatórios.</p>}
    <footer className="adm-editor-footer"><span>{isDirty ? 'Alterações pendentes' : 'Preencha e revise os dados'}</span><button type="submit" className="adm-btn" disabled={isSubmitting}><Save size={17}/>{isSubmitting ? 'Salvando…' : 'Salvar'}</button></footer>
  </form>;
}
