import { panelCatalog } from '@/features/admin/data';
import { Heading } from '@/components/admin/Parts';
import { SettingsForm } from '@/components/admin/SettingsForm';
export default async function SettingsPage(){const {settings,demo}=await panelCatalog();return <><Heading title="Configurações" description="As informações da casa, os canais de contato e os recursos disponíveis."/><SettingsForm settings={settings} demo={demo}/></>;}
