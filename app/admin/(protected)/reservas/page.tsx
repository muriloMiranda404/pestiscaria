import { panelCatalog } from '@/features/admin/data';
import { listReservations } from '@/services/store';
import { Heading } from '@/components/admin/Parts';
import { Reservations } from '@/components/admin/Reservations';
export default async function ReservationsPage(){const catalog=await panelCatalog();const records=await listReservations();return <><Heading title="Reservas" description="Analise os pedidos recebidos e registre a resposta da equipe."/>{!catalog.settings.reservations_enabled&&<p className="adm-demo-note">As solicitações pelo site estão desativadas. Ative o serviço nas configurações após confirmação do restaurante.</p>}<Reservations records={records}/></>;}
