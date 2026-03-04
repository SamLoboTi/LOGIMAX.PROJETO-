import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import BaseAgendamentos from "@/components/BaseAgendamentos";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Eye,
  Award,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Pencil,
  Save,
  UserMinus,
  RotateCcw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDateBR, parseDateString } from "@/lib/utils";
import { buscarAgendersAtivosParaSelecao } from "@/services/agendersService";
// Componente para agrupar agendamentos por horário (Supervisor)
interface HorarioAgrupadoSupervisorProps {
  horario: string;
  agendamentos: any[];
  renderItem: (agendamento: any) => ReactNode;
}

function HorarioAgrupadoSupervisor({ horario, agendamentos, renderItem }: HorarioAgrupadoSupervisorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatarHorario = (h: string) => h.slice(0, 5);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted rounded-lg cursor-pointer border border-border transition-colors">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium">{formatarHorario(horario)}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {agendamentos.length} reunião{agendamentos.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 ml-4 border-l-2 border-primary/30 pl-3">
        {agendamentos.map((ag) => renderItem(ag))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Componente para agrupar por data e depois por horário (Supervisor)
interface DataAgrupadaSupervisorProps {
  data: string;
  agendamentos: any[];
  renderItem: (agendamento: any) => ReactNode;
}

function DataAgrupadaSupervisor({ data, agendamentos, renderItem }: DataAgrupadaSupervisorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Agrupar por horário dentro da data
  const agrupadorPorHorario = agendamentos.reduce((acc, ag) => {
    const horario = ag.horario_reuniao || '00:00:00';
    if (!acc[horario]) acc[horario] = [];
    acc[horario].push(ag);
    return acc;
  }, {} as Record<string, typeof agendamentos>);

  const horariosOrdenados = Object.keys(agrupadorPorHorario).sort();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-primary/10 hover:bg-primary/20 rounded-lg cursor-pointer border border-primary/30 transition-colors">
          <div className="flex items-center gap-3">
            {isOpen ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-primary" />}
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-primary">{formatDateBR(data)}</span>
          </div>
          <Badge className="text-sm bg-primary text-primary-foreground">
            {agendamentos.length} reunião{agendamentos.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 ml-4 border-l-2 border-primary/50 pl-4">
        {horariosOrdenados.map(horario => (
          <HorarioAgrupadoSupervisor
            key={horario}
            horario={horario}
            agendamentos={agrupadorPorHorario[horario]}
            renderItem={renderItem}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface AuditorMetrics {
  auditor_id: string;
  auditor_nome: string;
  total_auditorias: number;
  reunioes_confirmadas: number;
  taxa_confirmacao: number;
  reagendamentos: number;
  dados_invalidos: number;
}

interface CloserQueueItem {
  closer_id: string;
  closer_nome: string;
  agendamentos_ativos: number;
  ultima_atribuicao: string | null;
}

export default function SupervisorAuditoriaDashboard() {
  const [selectedCloser, setSelectedCloser] = useState<string>("");
  const [selectedAgendamento, setSelectedAgendamento] = useState<string>("");
  const [modalFilaOpen, setModalFilaOpen] = useState(false);
  const [modalReagendamentosOpen, setModalReagendamentosOpen] = useState(false);
  const [modalSemCloserOpen, setModalSemCloserOpen] = useState(false);
  const [modalSemContatoOpen, setModalSemContatoOpen] = useState(false);
  const [filtroSemContato, setFiltroSemContato] = useState("");
  const [modalTpReagendamentosOpen, setModalTpReagendamentosOpen] = useState(false);
  const [modalTpSemCloserOpen, setModalTpSemCloserOpen] = useState(false);
  const [modalTpSemContatoOpen, setModalTpSemContatoOpen] = useState(false);
  const [modal99ReagendamentosOpen, setModal99ReagendamentosOpen] = useState(false);
  const [modal99SemCloserOpen, setModal99SemCloserOpen] = useState(false);
  const [modal99SemContatoOpen, setModal99SemContatoOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [migratingAgendamentoId, setMigratingAgendamentoId] = useState<string | null>(null);

  // Estados para reagendar sem contato
  const [reagendandoSemContatoId, setReagendandoSemContatoId] = useState<string | null>(null);
  const [reagendarDados, setReagendarDados] = useState<{ agender_id: string; data_reuniao: string; horario_reuniao: string }>({ agender_id: '', data_reuniao: '', horario_reuniao: '' });
  const [salvandoReagendarSemContato, setSalvandoReagendarSemContato] = useState(false);

  // Estados para edição de agendamentos
  const [editandoAgendamento, setEditandoAgendamento] = useState<string | null>(null);
  const [dadosEditados, setDadosEditados] = useState<any>({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [editandoCloser, setEditandoCloser] = useState<string | null>(null);
  const [novoCloserSelecionado, setNovoCloserSelecionado] = useState<string>("");
  const [removendoCloser, setRemovendoCloser] = useState(false);

  // Estados para paginação e filtros
  const [paginaReagendamento, setPaginaReagendamento] = useState(1);
  const [paginaAguardando, setPaginaAguardando] = useState(1);
  const [paginaComCloser, setPaginaComCloser] = useState(1);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [filtroNomeLoja, setFiltroNomeLoja] = useState("");
  const [filtroNomeLojaAtribuidos, setFiltroNomeLojaAtribuidos] = useState("");
  const [filtroReunioesManuais, setFiltroReunioesManuais] = useState("");
  const [filtroCategoriaAtribuidos, setFiltroCategoriaAtribuidos] = useState<string>("todos");
  const [filtroAgender, setFiltroAgender] = useState<string>("todos");
  const [filtroAgenderAtribuidos, setFiltroAgenderAtribuidos] = useState<string>("todos");
  const ITENS_POR_PAGINA = 10;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar métricas do time de auditores - OTIMIZADO (query única)
  const { data: timeMetrics, isLoading: loadingTeam } = useQuery({
    queryKey: ['time-auditores-metrics'],
    queryFn: async () => {
      // Buscar auditores e suas auditorias em uma única query
      const { data: auditores, error: auditoresError } = await supabase
        .from('users')
        .select(`
          id, 
          nome, 
          email,
          auditorias_agendamentos(reuniao_aconteceu, reagendou_para, dados_invalidos)
        `)
        .or('role.eq.time_auditoria,role.eq.supervisor_auditoria');

      if (auditoresError) throw auditoresError;

      // Processar métricas localmente (sem queries adicionais)
      return (auditores || []).map((auditor: any) => {
        const auditorias = auditor.auditorias_agendamentos || [];
        const reunioesConfirmadas = auditorias.filter((a: any) => a.reuniao_aconteceu).length;
        const reagendamentos = auditorias.filter((a: any) => a.reagendou_para).length;
        const dadosInvalidos = auditorias.filter((a: any) => a.dados_invalidos).length;
        const taxaConfirmacao = auditorias.length > 0
          ? (reunioesConfirmadas / auditorias.length) * 100
          : 0;

        return {
          auditor_id: auditor.id,
          auditor_nome: auditor.nome,
          total_auditorias: auditorias.length,
          reunioes_confirmadas: reunioesConfirmadas,
          taxa_confirmacao: taxaConfirmacao,
          reagendamentos: reagendamentos,
          dados_invalidos: dadosInvalidos
        } as AuditorMetrics;
      });
    },
    staleTime: 30000 // Cache por 30 segundos
  });

  // Buscar fila de closers disponíveis
  // Regra: mostrar apenas usuários ATIVOS que tenham role de closer (primário OU secundário)
  const { data: closersQueue } = useQuery({
    queryKey: ['closers-queue'],
    queryFn: async () => {
      // 1) Pegar IDs de usuários com role secundário de closer
      const { data: closerRoleRows, error: rolesError } = await supabase
        .from('user_roles_multiple')
        .select('user_id, role')
        .in('role', ['time_closer', 'supervisor_closer']);

      if (rolesError) {
        console.error('❌ Erro ao buscar roles de closer:', rolesError);
        throw rolesError;
      }

      const idsFromSecondaryRoles = (closerRoleRows || []).map((r: any) => r.user_id);

      // 2) Pegar IDs de usuários cujo role primário já é de closer
      const { data: primaryClosers, error: primaryError } = await supabase
        .from('users')
        .select('id')
        .in('role', ['time_closer', 'supervisor_closer'])
        .eq('ativo', true);

      if (primaryError) {
        console.error('❌ Erro ao buscar closers primários:', primaryError);
        throw primaryError;
      }

      const idsFromPrimaryRoles = (primaryClosers || []).map((u: any) => u.id);

      // 3) Unificar IDs e buscar dados do usuário (apenas ativos)
      const closerIds = Array.from(new Set([...idsFromSecondaryRoles, ...idsFromPrimaryRoles]));
      if (closerIds.length === 0) return [];

      const { data: closersRaw, error: usersError } = await supabase
        .from('users')
        .select('id, nome, role')
        .in('id', closerIds)
        .eq('ativo', true)
        .order('nome');

      if (usersError) {
        console.error('❌ Erro ao buscar dados dos closers:', usersError);
        throw usersError;
      }

      // Regra extra: não listar usuários com role primário admin/socio na fila de closers
      // EXCETO se eles têm role secundário de closer (ex: sócios que também atuam como closer)
      const idsComRoleSecundarioCloser = new Set(idsFromSecondaryRoles);
      const closers = (closersRaw || []).filter((u: any) =>
        !['admin', 'socio'].includes(u.role) || idsComRoleSecundarioCloser.has(u.id)
      );
      if (closers.length === 0) return [];

      const activeCloserIds = closers.map((c: any) => c.id);

      // 4) Buscar contagem de agendamentos ativos por closer
      const { data: agendamentosAtivos } = await supabase
        .from('auditorias_agendamentos')
        .select('closer_id, created_at, agendamentos!inner(status)')
        .in('closer_id', activeCloserIds)
        .eq('agendamentos.status', 'em_atendimento_closer');

      const contagemPorCloser = (agendamentosAtivos || []).reduce(
        (acc: Record<string, { count: number; ultima: string | null }>, item: any) => {
          if (!acc[item.closer_id]) {
            acc[item.closer_id] = { count: 0, ultima: null };
          }
          acc[item.closer_id].count++;
          if (!acc[item.closer_id].ultima || item.created_at > acc[item.closer_id].ultima) {
            acc[item.closer_id].ultima = item.created_at;
          }
          return acc;
        },
        {}
      );

      const queue: CloserQueueItem[] = closers.map((closer: any) => ({
        closer_id: closer.id,
        closer_nome: closer.nome,
        agendamentos_ativos: contagemPorCloser[closer.id]?.count || 0,
        ultima_atribuicao: contagemPorCloser[closer.id]?.ultima || null,
      }));

      return queue.sort((a, b) => a.agendamentos_ativos - b.agendamentos_ativos);
    },
    staleTime: 15000,
  });

  // Buscar lista de agenders para filtro
  const { data: agendersDisponiveis } = useQuery({
    queryKey: ['agenders-lista-filtro-v2'],
    queryFn: buscarAgendersAtivosParaSelecao,
    staleTime: 60000
  });

  // Buscar agendamentos pendentes de closer - OTIMIZADO com cache
  const { data: agendamentosPendentes, error: pendentesError } = useQuery({
    queryKey: ['agendamentos-sem-closer'],
    queryFn: async () => {
      console.log('🔍 Buscando agendamentos pendentes de closer...');

      // Query única com OR para buscar ambos os tipos
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          agender:users!agender_id(id, nome),
          auditorias_agendamentos(closer_id, reuniao_aconteceu, link_meet, created_at)
        `)
        .or('status.eq.auditado,status.eq.aguardando_closer,status.eq.em_reagendamento')
        .order('data_reuniao', { ascending: true })
        .order('created_at', { referencedTable: 'auditorias_agendamentos', ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
        throw error;
      }

      // Filtrar localmente: auditados sem closer OU em reagendamento
      // IMPORTANTE: [0] agora é sempre o registro mais recente (ordenado por created_at DESC)
      const filtrados = (data || []).filter((a: any) => {
        if (a.status === 'auditado') {
          const auditoria = a.auditorias_agendamentos?.[0];
          return auditoria && auditoria.link_meet && !auditoria.closer_id;
        }
        // Reagendamentos e aguardando closer: incluir todos
        return a.status === 'aguardando_closer' || a.status === 'em_reagendamento';
      });

      // Ordenar por data (timezone-safe)
      const ordenados = filtrados.sort((a: any, b: any) => {
        const da = parseDateString(a.data_reuniao)?.getTime() ?? 0;
        const db = parseDateString(b.data_reuniao)?.getTime() ?? 0;
        return da - db;
      });

      console.log('✅ Agendamentos pendentes encontrados:', ordenados.length);

      return ordenados;
    },
    staleTime: 10000 // Cache por 10 segundos
  });

  // Buscar reuniões manuais (já realizadas, aguardando atribuição de closer)
  const { data: reunioesManuais } = useQuery({
    queryKey: ['reunioes-manuais'],
    queryFn: async () => {
      console.log('🔍 Buscando reuniões manuais...');

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          auditorias_agendamentos(closer_id, reuniao_aconteceu, link_meet, created_at)
        `)
        .eq('status', 'reuniao_manual')
        .order('data_reuniao', { ascending: false })
        .order('created_at', { referencedTable: 'auditorias_agendamentos', ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar reuniões manuais:', error);
        throw error;
      }

      // Filtrar apenas as que não tem closer atribuído
      const semCloser = (data || []).filter((a: any) => {
        const auditoria = a.auditorias_agendamentos?.[0];
        return !auditoria?.closer_id;
      });

      console.log('✅ Reuniões manuais encontradas:', semCloser.length);
      return semCloser;
    },
    staleTime: 10000
  });

  // Buscar agendamentos com closer atribuído - OTIMIZADO (sem N+1)
  const { data: agendamentosComCloser } = useQuery({
    queryKey: ['agendamentos-com-closer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          agender:users!agender_id(id, nome),
          auditorias_agendamentos!inner(
            id,
            closer_id,
            reuniao_aconteceu,
            link_meet,
            created_at,
            auditor:users!auditor_id(nome),
            closer:users!closer_id(nome)
          )
        `)
        .eq('status', 'em_atendimento_closer')
        .not('auditorias_agendamentos.closer_id', 'is', null)
        .order('data_reuniao', { ascending: true })
        .order('created_at', { referencedTable: 'auditorias_agendamentos', ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar agendamentos com closer:', error);
        throw error;
      }

      // Mapear dados sem queries adicionais
      return (data || []).map((agendamento: any) => ({
        ...agendamento,
        closer_nome: agendamento.auditorias_agendamentos?.[0]?.closer?.nome || 'N/A'
      }));
    },
    staleTime: 15000
  });

  // Buscar agendamentos sem contato (sem_resposta)
  const { data: agendamentosSemContato } = useQuery({
    queryKey: ['agendamentos-sem-contato'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          agender:users!agender_id(id, nome)
        `)
        .eq('status', 'sem_resposta')
        .order('data_reuniao', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar agendamentos sem contato:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 15000
  });

  // Debug logs removidos para produção

  // Filtrar por nome da loja, categoria e agender
  const filtrarAgendamentos = (lista: any[]) => {
    return lista.filter((a: any) => {
      const matchNome = !filtroNomeLoja || a.nome_loja?.toLowerCase().includes(filtroNomeLoja.toLowerCase());
      const matchCategoria = filtroCategoria === "todos" || a.nicho === filtroCategoria;
      const matchAgender = filtroAgender === "todos" || a.agender_id === filtroAgender || a.agender?.id === filtroAgender;
      return matchNome && matchCategoria && matchAgender;
    });
  };

  // Obter categorias únicas dos agendamentos
  const categoriasUnicas = [...new Set((agendamentosPendentes || []).map((a: any) => a.nicho).filter(Boolean))];

  // Filtrar por tipo de agendamento (normal vs trafego_pago vs 99food)
  const pendentesNormais = (agendamentosPendentes || []).filter((a: any) => a.tipo_agendamento !== 'trafego_pago' && a.tipo_agendamento !== '99food');
  const pendentesTrafegoPago = (agendamentosPendentes || []).filter((a: any) => a.tipo_agendamento === 'trafego_pago');
  const pendentes99Food = (agendamentosPendentes || []).filter((a: any) => a.tipo_agendamento === '99food');

  const agendamentosReagendamento = filtrarAgendamentos(
    pendentesNormais.filter((a: any) => a.status === 'em_reagendamento')
  );

  const agendamentosAguardandoCloser = filtrarAgendamentos(
    pendentesNormais.filter((a: any) => a.status !== 'em_reagendamento')
  );

  const agendamentosComCloserFiltrados = filtrarAgendamentos(agendamentosComCloser || []);

  // Tráfego Pago - dados filtrados
  const tpReagendamento = filtrarAgendamentos(
    pendentesTrafegoPago.filter((a: any) => a.status === 'em_reagendamento')
  );
  const tpAguardandoCloser = filtrarAgendamentos(
    pendentesTrafegoPago.filter((a: any) => a.status !== 'em_reagendamento')
  );
  const tpComCloser = filtrarAgendamentos(
    (agendamentosComCloser || []).filter((a: any) => a.tipo_agendamento === 'trafego_pago')
  );
  const tpSemContato = (agendamentosSemContato || []).filter((a: any) => a.tipo_agendamento === 'trafego_pago');

  // 99Food - dados filtrados
  const nfReagendamento = filtrarAgendamentos(
    pendentes99Food.filter((a: any) => a.status === 'em_reagendamento')
  );
  const nfAguardandoCloser = filtrarAgendamentos(
    pendentes99Food.filter((a: any) => a.status !== 'em_reagendamento')
  );
  const nfComCloser = filtrarAgendamentos(
    (agendamentosComCloser || []).filter((a: any) => a.tipo_agendamento === '99food')
  );
  const nfSemContato = (agendamentosSemContato || []).filter((a: any) => a.tipo_agendamento === '99food');

  // Também filtrar normais para sem contato
  const semContatoNormais = (agendamentosSemContato || []).filter((a: any) => a.tipo_agendamento !== 'trafego_pago' && a.tipo_agendamento !== '99food');

  // Filtrar agendamentos com closer usando filtros dedicados da aba "Atribuídos"
  const agendamentosComCloserFiltradosAtribuidos = (agendamentosComCloser || []).filter((a: any) => {
    const matchNome = !filtroNomeLojaAtribuidos || a.nome_loja?.toLowerCase().includes(filtroNomeLojaAtribuidos.toLowerCase());
    const matchCategoria = filtroCategoriaAtribuidos === "todos" || a.nicho === filtroCategoriaAtribuidos;
    const matchAgender = filtroAgenderAtribuidos === "todos" || a.agender_id === filtroAgenderAtribuidos;
    return matchNome && matchCategoria && matchAgender;
  });

  // Paginação
  const paginarLista = (lista: any[], pagina: number) => {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA;
    return lista.slice(inicio, inicio + ITENS_POR_PAGINA);
  };

  const totalPaginasReagendamento = Math.ceil(agendamentosReagendamento.length / ITENS_POR_PAGINA);
  const totalPaginasAguardando = Math.ceil(agendamentosAguardandoCloser.length / ITENS_POR_PAGINA);
  const totalPaginasComCloser = Math.ceil(agendamentosComCloserFiltrados.length / ITENS_POR_PAGINA);

  // Funções de edição de agendamentos
  const iniciarEdicao = (agendamento: any) => {
    setDadosEditados({
      nome_loja: agendamento.nome_loja || '',
      nome_dono: agendamento.nome_dono || '',
      telefone: agendamento.telefone || '',
      link_ifood: agendamento.link_ifood || '',
      link_google: agendamento.link_google || '',
      cnpj: agendamento.cnpj || '',
      nicho: agendamento.nicho || '',
      data_reuniao: agendamento.data_reuniao || '',
      horario_reuniao: agendamento.horario_reuniao || '',
      status: agendamento.status || '',
      closer_id: agendamento.auditorias_agendamentos?.[0]?.closer_id || null,
      closer_nome: agendamento.auditorias_agendamentos?.[0]?.closer?.nome || agendamento.closer_nome || null
    });
    setEditandoAgendamento(agendamento.id);
    setNovoCloserSelecionado(agendamento.auditorias_agendamentos?.[0]?.closer_id || '');
  };

  const salvarEdicao = async () => {
    if (!editandoAgendamento) return;

    setSalvandoEdicao(true);
    try {
      // Atualizar dados do agendamento
      const { error } = await supabase
        .from('agendamentos')
        .update({
          nome_loja: dadosEditados.nome_loja?.trim(),
          nome_dono: dadosEditados.nome_dono?.trim(),
          telefone: dadosEditados.telefone?.trim(),
          link_ifood: dadosEditados.link_ifood?.trim() || null,
          link_google: dadosEditados.link_google?.trim() || null,
          cnpj: dadosEditados.cnpj?.trim() || null,
          nicho: dadosEditados.nicho?.trim(),
          data_reuniao: dadosEditados.data_reuniao?.trim() || null,
          horario_reuniao: dadosEditados.horario_reuniao?.trim() || null,
          status: dadosEditados.status
        })
        .eq('id', editandoAgendamento);

      if (error) throw error;

      // Se houve mudança de closer
      const closerAtual = dadosEditados.closer_id || null;
      const novoCloser = novoCloserSelecionado === 'nenhum' ? null : (novoCloserSelecionado || null);

      if (novoCloser !== closerAtual) {
        const { data: existingAuditorias } = await supabase
          .from('auditorias_agendamentos')
          .select('id')
          .eq('agendamento_id', editandoAgendamento)
          .order('created_at', { ascending: false })
          .limit(1);
        const existingAuditoria = existingAuditorias?.[0] || null;

        if (existingAuditoria) {
          await supabase
            .from('auditorias_agendamentos')
            .update({ closer_id: novoCloser })
            .eq('id', existingAuditoria.id);
        }
      }

      toast({
        title: "Sucesso!",
        description: "Dados atualizados com sucesso"
      });

      // Invalidar queries para atualizar listas
      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-closer'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-com-closer'] });
      queryClient.invalidateQueries({ queryKey: ['reunioes-manuais'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-contato'] });
      queryClient.invalidateQueries({ queryKey: ['closers-queue'] });

      setEditandoAgendamento(null);
      setDadosEditados({});
      setNovoCloserSelecionado('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Função para remover closer (Supervisão de Auditoria)
  const removerCloser = async (agendamentoId: string) => {
    setRemovendoCloser(true);
    try {
      // Remover closer da auditoria
      const { error: auditoriaError } = await supabase
        .from('auditorias_agendamentos')
        .update({ closer_id: null })
        .eq('agendamento_id', agendamentoId);

      if (auditoriaError) throw auditoriaError;

      // Voltar status para aguardando_closer
      const { error: agendamentoError } = await supabase
        .from('agendamentos')
        .update({ status: 'aguardando_closer' })
        .eq('id', agendamentoId);

      if (agendamentoError) throw agendamentoError;

      toast({
        title: "Sucesso!",
        description: "Closer removido. Reunião voltou para 'Aguardando Closer'."
      });

      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-closer'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-com-closer'] });
      queryClient.invalidateQueries({ queryKey: ['closers-queue'] });

      setEditandoAgendamento(null);
      setDadosEditados({});
    } catch (error: any) {
      toast({
        title: "Erro ao remover closer",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRemovendoCloser(false);
    }
  };

  // Função para marcar como reagendada (Supervisão de Auditoria)
  const marcarReagendada = async () => {
    if (!editandoAgendamento) return;

    setSalvandoEdicao(true);
    try {
      // Limpar auditorias antigas para o agendamento voltar limpo ao fluxo
      await supabase
        .from('auditorias_agendamentos')
        .delete()
        .eq('agendamento_id', editandoAgendamento);

      // Atualizar agendamento com nova data e resetar status para 'agendado'
      // para que retorne ao painel dos auditores (view_painel_auditoria filtra status='agendado')
      const { error } = await supabase
        .from('agendamentos')
        .update({
          status: 'agendado',
          data_reuniao: dadosEditados.data_reuniao || null,
          horario_reuniao: dadosEditados.horario_reuniao || null
        })
        .eq('id', editandoAgendamento);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Nova data definida. Agendamento retornou ao painel de auditoria."
      });

      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-closer'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-com-closer'] });
      queryClient.invalidateQueries({ queryKey: ['painel-auditoria-view'] });

      setEditandoAgendamento(null);
      setDadosEditados({});
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const cancelarEdicao = () => {
    setEditandoAgendamento(null);
    setDadosEditados({});
    setNovoCloserSelecionado('');
  };

  // Função para reagendar um agendamento sem contato com novo agender
  const reagendarSemContato = async (agendamentoId: string) => {
    if (!reagendarDados.agender_id || !reagendarDados.data_reuniao || !reagendarDados.horario_reuniao) {
      toast({ title: "Preencha todos os campos", description: "Agender, data e horário são obrigatórios.", variant: "destructive" });
      return;
    }
    setSalvandoReagendarSemContato(true);
    try {
      // Atualizar o agendamento: novo agender, nova data/horário, status volta para agendado
      const { error } = await supabase
        .from('agendamentos')
        .update({
          agender_id: reagendarDados.agender_id,
          data_reuniao: reagendarDados.data_reuniao,
          horario_reuniao: reagendarDados.horario_reuniao + ':00',
          status: 'agendado',
          data_agendamento: new Date().toISOString().split('T')[0],
        })
        .eq('id', agendamentoId);

      if (error) throw error;

      // Limpar auditorias antigas para reiniciar o fluxo
      await supabase
        .from('auditorias_agendamentos')
        .delete()
        .eq('agendamento_id', agendamentoId);

      toast({ title: "Reagendado!", description: "O agendamento voltou para a fila como novo agendamento." });

      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-contato'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-closer'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-com-closer'] });

      setReagendandoSemContatoId(null);
      setReagendarDados({ agender_id: '', data_reuniao: '', horario_reuniao: '' });
    } catch (err) {
      console.error('Erro ao reagendar sem contato:', err);
      toast({ title: "Erro", description: "Não foi possível reagendar.", variant: "destructive" });
    } finally {
      setSalvandoReagendarSemContato(false);
    }
  };

  const renderAgendamentoPendente = (
    agendamento: any,
    opts?: { badge?: ReactNode }
  ) => {
    return (
      <div key={agendamento.id} className="flex items-center justify-between gap-3 p-2 bg-background rounded">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{agendamento.nome_loja}</p>
            {opts?.badge}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDateBR(agendamento.data_reuniao)} às {agendamento.horario_reuniao}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              iniciarEdicao(agendamento);
            }}
            title="Editar agendamento"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Select
            value={selectedCloser && selectedAgendamento === agendamento.id ? selectedCloser : ""}
            onValueChange={(value) => {
              setSelectedCloser(value);
              setSelectedAgendamento(agendamento.id);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecionar closer" />
            </SelectTrigger>
            <SelectContent>
              {closersQueue
                ?.filter((closer) => closer.closer_id && closer.closer_id.trim() !== '')
                .map((closer) => (
                  <SelectItem key={closer.closer_id} value={closer.closer_id}>
                    {closer.closer_nome} ({closer.agendamentos_ativos})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!selectedCloser || selectedAgendamento !== agendamento.id}
            onClick={atribuirCloser}
          >
            Atribuir
          </Button>
        </div>
      </div>
    );
  };

  const atribuirCloser = async () => {
    if (!selectedCloser || !selectedAgendamento) {
      toast({
        title: "Erro",
        description: "Selecione um agendamento e um closer",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[ATRIBUIR CLOSER] Iniciando atribuição:', { selectedCloser, selectedAgendamento });

      // Buscar usuário atual para auditor_id
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      // Verificar se já existe uma auditoria para este agendamento
      const { data: existingAuditorias, error: checkError } = await supabase
        .from('auditorias_agendamentos')
        .select('id')
        .eq('agendamento_id', selectedAgendamento)
        .order('created_at', { ascending: false })
        .limit(1);
      const existingAuditoria = existingAuditorias?.[0] || null;

      if (checkError) {
        console.error('[ATRIBUIR CLOSER] Erro ao verificar auditoria:', checkError);
        throw checkError;
      }

      // Sempre inserir novo registro de auditoria com closer_id
      // (RLS não possui policy de UPDATE para esta tabela)
      console.log('[ATRIBUIR CLOSER] Criando registro de auditoria com closer');
      const { error: insertError } = await supabase
        .from('auditorias_agendamentos')
        .insert({
          agendamento_id: selectedAgendamento,
          auditor_id: currentUserId,
          closer_id: selectedCloser,
          reuniao_aconteceu: true,
          ...(existingAuditoria ? {} : {}),
        });

      if (insertError) {
        console.error('[ATRIBUIR CLOSER] Erro ao criar auditoria:', insertError);
        throw insertError;
      }

      // Atualizar status do agendamento para "em_atendimento_closer"
      console.log('[ATRIBUIR CLOSER] Atualizando status do agendamento para em_atendimento_closer');
      const { error: agendamentoError } = await supabase
        .from('agendamentos')
        .update({ status: 'em_atendimento_closer' })
        .eq('id', selectedAgendamento);

      if (agendamentoError) {
        console.error('[ATRIBUIR CLOSER] Erro ao atualizar agendamento:', agendamentoError);
        throw agendamentoError;
      }

      console.log('[ATRIBUIR CLOSER] Atribuição concluída com sucesso!');
      toast({
        title: "Sucesso!",
        description: "Closer atribuído ao agendamento"
      });

      setModalFilaOpen(false);
      setSelectedCloser("");
      setSelectedAgendamento("");
      queryClient.invalidateQueries({ queryKey: ['closers-queue'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-closer'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-com-closer'] });
    } catch (error: any) {
      console.error('[ATRIBUIR CLOSER] Erro geral:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Atribuir closer em reunião manual (já aconteceu)
  const atribuirCloserManual = async () => {
    if (!selectedCloser || !selectedAgendamento) {
      toast({
        title: "Erro",
        description: "Selecione um agendamento e um closer",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('[ATRIBUIR CLOSER MANUAL] Iniciando atribuição:', { selectedCloser, selectedAgendamento });

      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      // Verificar se já existe auditoria
      const { data: existingAuditorias, error: checkError } = await supabase
        .from('auditorias_agendamentos')
        .select('id')
        .eq('agendamento_id', selectedAgendamento)
        .order('created_at', { ascending: false })
        .limit(1);
      const existingAuditoria = existingAuditorias?.[0] || null;

      if (checkError) throw checkError;

      // Sempre inserir novo registro (RLS não possui policy de UPDATE)
      console.log('[ATRIBUIR CLOSER MANUAL] Criando registro com closer');
      const { error: insertError } = await supabase
        .from('auditorias_agendamentos')
        .insert({
          agendamento_id: selectedAgendamento,
          auditor_id: currentUserId,
          closer_id: selectedCloser,
          reuniao_aconteceu: true
        });

      if (insertError) throw insertError;

      // Status para "reuniao_manual_atribuida" para ir ao painel do closer
      const { error: agendamentoError } = await supabase
        .from('agendamentos')
        .update({ status: 'reuniao_manual_atribuida' })
        .eq('id', selectedAgendamento);

      if (agendamentoError) throw agendamentoError;

      toast({
        title: "Sucesso!",
        description: "Closer atribuído à reunião manual"
      });

      setSelectedCloser("");
      setSelectedAgendamento("");
      queryClient.invalidateQueries({ queryKey: ['reunioes-manuais'] });
      queryClient.invalidateQueries({ queryKey: ['closers-queue'] });
    } catch (error: any) {
      console.error('[ATRIBUIR CLOSER MANUAL] Erro:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const reatribuirCloser = async (agendamentoId: string, novoCloserId: string) => {
    try {
      // Atualizar auditoria com novo closer_id
      const { error: auditoriaError } = await supabase
        .from('auditorias_agendamentos')
        .update({ closer_id: novoCloserId })
        .eq('agendamento_id', agendamentoId);

      if (auditoriaError) throw auditoriaError;

      toast({
        title: "Sucesso!",
        description: "Closer reatribuído com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ['closers-queue'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-closer'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-com-closer'] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Função para buscar na base de dados
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Atenção",
        description: "Digite um termo para buscar",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      console.log('[BUSCA] Iniciando busca para:', searchTerm);
      const searchValue = searchTerm.trim();

      // Buscar em lojas existentes
      const { data: lojas, error: lojasError } = await supabase
        .from('lojas')
        .select('id, nome, codigo, nome_dono, telefone_comercial, telefone_pessoal, status, cidade')
        .eq('status', 'ativa')
        .or(`nome.ilike.%${searchValue}%,nome_dono.ilike.%${searchValue}%,codigo.ilike.%${searchValue}%,telefone_comercial.ilike.%${searchValue}%,telefone_pessoal.ilike.%${searchValue}%`)
        .limit(10);

      if (lojasError) {
        console.error('[BUSCA] Erro ao buscar lojas:', lojasError);
      }

      // Buscar em agendamentos (inclui auditoria para permitir migração quando já marcado como "reunião aconteceu")
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('id, nome_loja, nome_dono, telefone, status, created_at, auditorias_agendamentos(reuniao_aconteceu, link_meet)')
        .or(`nome_loja.ilike.%${searchValue}%,nome_dono.ilike.%${searchValue}%,telefone.ilike.%${searchValue}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (agendamentosError) {
        console.error('[BUSCA] Erro ao buscar agendamentos:', agendamentosError);
      }

      // Processar resultados
      const clientesAtivos = (lojas || []).map(loja => ({
        ...loja,
        tipo: 'cliente_ativo'
      }));

      const agendamentosProcessados = (agendamentos || []).map(agendamento => ({
        ...agendamento,
        tipo: 'historico_agendamento'
      }));

      const results = [...clientesAtivos, ...agendamentosProcessados];
      setSearchResults(results);

      if (results.length === 0) {
        toast({
          title: "Nenhum resultado encontrado",
          description: "Não foram encontrados registros para este termo de busca.",
        });
      } else {
        toast({
          title: "Resultados encontrados",
          description: `Encontrados ${results.length} resultado(s).`,
        });
      }
    } catch (error: any) {
      console.error('[BUSCA] Erro:', error);
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const migrarParaReuniaoManual = async (agendamentoId: string) => {
    setMigratingAgendamentoId(agendamentoId);
    try {
      const { data, error } = await supabase.functions.invoke('migrar-reuniao-manual', {
        body: { agendamentoId },
      });

      if (error) throw error;

      toast({
        title: "Migrado!",
        description: `Agendamento movido para Reuniões Manuais: ${data?.agendamento?.nome_loja ?? ''}`,
      });

      // Atualizar listas
      queryClient.invalidateQueries({ queryKey: ['reunioes-manuais'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-closer'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-com-closer'] });
    } catch (err: any) {
      toast({
        title: "Erro ao migrar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setMigratingAgendamentoId(null);
    }
  };

  // Calcular totais do time
  const totaisTime = timeMetrics ? {
    totalAuditoriasTime: timeMetrics.reduce((sum, m) => sum + m.total_auditorias, 0),
    totalConfirmadasTime: timeMetrics.reduce((sum, m) => sum + m.reunioes_confirmadas, 0),
    confirmacaoMediaTime: timeMetrics.length > 0
      ? timeMetrics.reduce((sum, m) => sum + m.taxa_confirmacao, 0) / timeMetrics.length
      : 0
  } : null;

  const getProximoCloser = () => {
    if (!closersQueue || closersQueue.length === 0) return null;
    return closersQueue[0]; // Primeiro da fila (menor carga)
  };

  if (loadingTeam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="dashboard">
              DASHBOARD ({(agendamentosReagendamento?.length || 0) + (agendamentosAguardandoCloser?.length || 0)})
            </TabsTrigger>
            <TabsTrigger value="reunioes-manuais">
              Reuniões Manuais ({reunioesManuais?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="time">Visão do Time</TabsTrigger>
            <TabsTrigger value="atribuidos">
              Atribuídos ({agendamentosComCloserFiltrados?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="trafego-pago" className="text-orange-500 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              🔥 Tráfego Pago ({(tpReagendamento.length) + (tpAguardandoCloser.length) + (tpComCloser.length)})
            </TabsTrigger>
            <TabsTrigger value="99food" className="text-green-500 data-[state=active]:bg-green-500 data-[state=active]:text-white">
              🍔 99Food ({(nfReagendamento.length) + (nfAguardandoCloser.length) + (nfComCloser.length)})
            </TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="base-agendamentos">Base de Agendamentos</TabsTrigger>
          </TabsList>

          {/* Tab DASHBOARD - Principal */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Supervisor de Auditoria</h2>
              <p className="text-muted-foreground">Gerencie agendamentos e atribuição de closers</p>
            </div>

            {/* Alertas */}
            {(!closersQueue || closersQueue.length === 0) && (
              <Card className="border-2 border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Nenhum Closer Cadastrado no Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground">
                    Não há closers disponíveis para atribuição. É necessário cadastrar usuários com role
                    <Badge variant="outline" className="mx-1">time_closer</Badge> ou
                    <Badge variant="outline" className="mx-1">supervisor_closer</Badge>
                    antes de atribuir agendamentos.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cards de Agendamentos Pendentes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card Reagendamentos */}
              <Card
                className="cursor-pointer hover:border-warning/50 transition-colors border-2"
                onClick={() => setModalReagendamentosOpen(true)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <RefreshCw className="h-5 w-5 text-warning" />
                      Reagendamentos
                    </CardTitle>
                    <Badge
                      variant={agendamentosReagendamento.length > 0 ? "outline" : "secondary"}
                      className={agendamentosReagendamento.length > 0 ? "border-warning text-warning text-lg px-3 py-1" : "text-lg px-3 py-1"}
                    >
                      {agendamentosReagendamento.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Agendamentos que foram reagendados e aguardam atribuição de closer
                  </p>
                  <Button variant="outline" className="w-full mt-4">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Lista Completa
                  </Button>
                </CardContent>
              </Card>

              {/* Card Auditados sem Closer */}
              <Card
                className="cursor-pointer hover:border-primary/50 transition-colors border-2"
                onClick={() => setModalSemCloserOpen(true)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-primary" />
                      Auditados sem Closer
                    </CardTitle>
                    <Badge
                      variant={agendamentosAguardandoCloser.length > 0 ? "outline" : "secondary"}
                      className={agendamentosAguardandoCloser.length > 0 ? "border-primary text-primary text-lg px-3 py-1" : "text-lg px-3 py-1"}
                    >
                      {agendamentosAguardandoCloser.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Agendamentos já auditados que precisam de um closer atribuído
                  </p>
                  <Button variant="outline" className="w-full mt-4">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Lista Completa
                  </Button>
                </CardContent>
              </Card>

              {/* Card Sem Contato */}
              <Card
                className="cursor-pointer hover:border-destructive/50 transition-colors border-2"
                onClick={() => setModalSemContatoOpen(true)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <XCircle className="h-5 w-5 text-destructive" />
                      Sem Contato
                    </CardTitle>
                    <Badge
                      variant={(semContatoNormais?.length || 0) > 0 ? "outline" : "secondary"}
                      className={(semContatoNormais?.length || 0) > 0 ? "border-destructive text-destructive text-lg px-3 py-1" : "text-lg px-3 py-1"}
                    >
                      {semContatoNormais?.length || 0}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Agendamentos onde não conseguimos contato com o cliente
                  </p>
                  <Button variant="outline" className="w-full mt-4">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Lista Completa
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab TRÁFEGO PAGO */}
          <TabsContent value="trafego-pago" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                🔥 Tráfego Pago
              </h2>
              <p className="text-muted-foreground">Agendamentos de tráfego pago — fluxo direto Agender → Auditoria → Closer</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card Reagendamentos TP */}
              <Card className="cursor-pointer hover:border-orange-500/50 transition-colors border-2 border-orange-500/20" onClick={() => setModalTpReagendamentosOpen(true)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <RefreshCw className="h-5 w-5 text-orange-500" />
                      Reagendamentos
                    </CardTitle>
                    <Badge variant="outline" className="border-orange-500 text-orange-500 text-lg px-3 py-1">
                      {tpReagendamento.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Reagendamentos de tráfego pago aguardando closer</p>
                  <Button variant="outline" className="w-full mt-4"><Eye className="h-4 w-4 mr-2" />Ver Lista Completa</Button>
                </CardContent>
              </Card>

              {/* Card Auditados sem Closer TP */}
              <Card className="cursor-pointer hover:border-orange-500/50 transition-colors border-2 border-orange-500/20" onClick={() => setModalTpSemCloserOpen(true)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-orange-500" />
                      Auditados sem Closer
                    </CardTitle>
                    <Badge variant="outline" className="border-orange-500 text-orange-500 text-lg px-3 py-1">
                      {tpAguardandoCloser.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Agendamentos TP auditados aguardando closer</p>
                  <Button variant="outline" className="w-full mt-4"><Eye className="h-4 w-4 mr-2" />Ver Lista Completa</Button>
                </CardContent>
              </Card>

              {/* Card Sem Contato TP */}
              <Card className="cursor-pointer hover:border-orange-500/50 transition-colors border-2 border-orange-500/20" onClick={() => setModalTpSemContatoOpen(true)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <XCircle className="h-5 w-5 text-orange-500" />
                      Sem Contato
                    </CardTitle>
                    <Badge variant="outline" className="border-orange-500 text-orange-500 text-lg px-3 py-1">
                      {tpSemContato.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Tráfego pago sem contato com o cliente</p>
                  <Button variant="outline" className="w-full mt-4"><Eye className="h-4 w-4 mr-2" />Ver Lista Completa</Button>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de atribuídos TP */}
            {tpComCloser.length > 0 && (
              <Card className="border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-500" />
                    Atribuídos — Tráfego Pago ({tpComCloser.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loja</TableHead>
                        <TableHead>Data Reunião</TableHead>
                        <TableHead>Closer</TableHead>
                        <TableHead>Telefone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tpComCloser.map((ag: any) => (
                        <TableRow key={ag.id}>
                          <TableCell className="font-medium">
                            {ag.nome_loja}
                            <Badge className="ml-2 bg-orange-500 text-white text-[10px]">TP</Badge>
                          </TableCell>
                          <TableCell>{formatDateBR(ag.data_reuniao)}</TableCell>
                          <TableCell>{ag.closer_nome || 'N/A'}</TableCell>
                          <TableCell>{ag.telefone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 99FOOD */}
          <TabsContent value="99food" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                🍔 99Food
              </h2>
              <p className="text-muted-foreground">Agendamentos de 99Food — fluxo direto Agender → Auditoria → Closer</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card Reagendamentos 99F */}
              <Card className="cursor-pointer hover:border-green-500/50 transition-colors border-2 border-green-500/20" onClick={() => setModal99ReagendamentosOpen(true)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <RefreshCw className="h-5 w-5 text-green-500" />
                      Reagendamentos
                    </CardTitle>
                    <Badge variant="outline" className="border-green-500 text-green-500 text-lg px-3 py-1">
                      {nfReagendamento.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Reagendamentos de 99Food aguardando closer</p>
                  <Button variant="outline" className="w-full mt-4"><Eye className="h-4 w-4 mr-2" />Ver Lista Completa</Button>
                </CardContent>
              </Card>

              {/* Card Auditados sem Closer 99F */}
              <Card className="cursor-pointer hover:border-green-500/50 transition-colors border-2 border-green-500/20" onClick={() => setModal99SemCloserOpen(true)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-green-500" />
                      Auditados sem Closer
                    </CardTitle>
                    <Badge variant="outline" className="border-green-500 text-green-500 text-lg px-3 py-1">
                      {nfAguardandoCloser.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Agendamentos 99Food auditados aguardando closer</p>
                  <Button variant="outline" className="w-full mt-4"><Eye className="h-4 w-4 mr-2" />Ver Lista Completa</Button>
                </CardContent>
              </Card>

              {/* Card Sem Contato 99F */}
              <Card className="cursor-pointer hover:border-green-500/50 transition-colors border-2 border-green-500/20" onClick={() => setModal99SemContatoOpen(true)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <XCircle className="h-5 w-5 text-green-500" />
                      Sem Contato
                    </CardTitle>
                    <Badge variant="outline" className="border-green-500 text-green-500 text-lg px-3 py-1">
                      {nfSemContato.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">99Food sem contato com o cliente</p>
                  <Button variant="outline" className="w-full mt-4"><Eye className="h-4 w-4 mr-2" />Ver Lista Completa</Button>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de atribuídos 99F */}
            {nfComCloser.length > 0 && (
              <Card className="border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    Atribuídos — 99Food ({nfComCloser.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loja</TableHead>
                        <TableHead>Data Reunião</TableHead>
                        <TableHead>Closer</TableHead>
                        <TableHead>Telefone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nfComCloser.map((ag: any) => (
                        <TableRow key={ag.id}>
                          <TableCell className="font-medium">
                            {ag.nome_loja}
                            <Badge className="ml-2 bg-green-500 text-white text-[10px]">99F</Badge>
                          </TableCell>
                          <TableCell>{formatDateBR(ag.data_reuniao)}</TableCell>
                          <TableCell>{ag.closer_nome || 'N/A'}</TableCell>
                          <TableCell>{ag.telefone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reunioes-manuais" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Reuniões Manuais</h2>
              <p className="text-muted-foreground">Reuniões que já aconteceram e precisam ter o closer atribuído</p>
            </div>

            {/* Campo de Busca */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome da loja, proprietário ou telefone..."
                value={filtroReunioesManuais}
                onChange={(e) => setFiltroReunioesManuais(e.target.value)}
                className="pl-10"
              />
              {filtroReunioesManuais && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setFiltroReunioesManuais("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {(() => {
              // Filtrar reuniões manuais baseado na busca
              const reunioesFiltradas = (reunioesManuais || []).filter((ag: any) => {
                if (!filtroReunioesManuais.trim()) return true;
                const termo = filtroReunioesManuais.toLowerCase();
                return (
                  ag.nome_loja?.toLowerCase().includes(termo) ||
                  ag.nome_dono?.toLowerCase().includes(termo) ||
                  ag.telefone?.toLowerCase().includes(termo)
                );
              });

              return reunioesFiltradas.length > 0 ? (
                <div className="grid gap-4">
                  {reunioesFiltradas.map((agendamento: any) => {
                    const linkMeet = agendamento.auditorias_agendamentos?.[0]?.link_meet;

                    return (
                      <Card key={agendamento.id} className="border-2 border-warning/30 hover:border-warning/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-lg">{agendamento.nome_loja}</h3>
                                <Badge variant="outline" className="border-warning text-warning">
                                  Reunião Manual
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground mb-3">
                                <span>📅 {formatDateBR(agendamento.data_reuniao)}</span>
                                <span>🕐 {agendamento.horario_reuniao}</span>
                                <span>👤 {agendamento.nome_dono}</span>
                                <span>📞 {agendamento.telefone}</span>
                              </div>
                              {linkMeet && (
                                <div className="text-sm">
                                  <span className="font-medium">Link usado:</span>{' '}
                                  <a href={linkMeet} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {linkMeet.length > 50 ? `${linkMeet.slice(0, 50)}...` : linkMeet}
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => iniciarEdicao(agendamento)}
                                title="Editar agendamento"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Select
                                value={selectedCloser && selectedAgendamento === agendamento.id ? selectedCloser : ""}
                                onValueChange={(value) => {
                                  setSelectedCloser(value);
                                  setSelectedAgendamento(agendamento.id);
                                }}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Selecionar closer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {closersQueue
                                    ?.filter((closer) => closer.closer_id && closer.closer_id.trim() !== '')
                                    .map((closer) => (
                                      <SelectItem key={closer.closer_id} value={closer.closer_id}>
                                        {closer.closer_nome} ({closer.agendamentos_ativos})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                disabled={!selectedCloser || selectedAgendamento !== agendamento.id}
                                onClick={atribuirCloserManual}
                              >
                                Atribuir
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                    <p className="text-lg font-semibold">
                      {filtroReunioesManuais ? 'Nenhum resultado encontrado' : 'Nenhuma reunião manual pendente'}
                    </p>
                    <p className="text-muted-foreground">
                      {filtroReunioesManuais
                        ? 'Tente buscar por outro termo'
                        : 'Todas as reuniões manuais já foram atribuídas'}
                    </p>
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>

          {/* Tab Visão do Time */}
          <TabsContent value="time" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Visão do Time</h2>
              <p className="text-muted-foreground">Acompanhe o desempenho do time de auditoria e carga dos closers</p>
            </div>

            {/* Métricas Consolidadas */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Desempenho Total do Time de Auditoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Auditorias Totais</p>
                    <p className="text-3xl font-bold text-primary">{totaisTime?.totalAuditoriasTime || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Reuniões Confirmadas</p>
                    <p className="text-3xl font-bold text-success">{totaisTime?.totalConfirmadasTime || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Taxa Confirmação Média</p>
                    <p className="text-3xl font-bold text-primary">{totaisTime?.confirmacaoMediaTime.toFixed(1) || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Carga dos Closers */}
            <Card>
              <CardHeader>
                <CardTitle>Carga dos Closers - Distribuição de Trabalho</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Closers ordenados por menor carga de trabalho (recomenda-se atribuir ao primeiro)
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Posição</TableHead>
                        <TableHead>Closer</TableHead>
                        <TableHead className="text-center">Agendamentos Ativos</TableHead>
                        <TableHead className="text-center">Última Atribuição</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closersQueue?.map((closer, index) => (
                        <TableRow key={closer.closer_id}>
                          <TableCell className="font-bold text-lg">
                            {index === 0 ? (
                              <Badge className="bg-success">1º</Badge>
                            ) : (
                              `${index + 1}º`
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{closer.closer_nome}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={closer.agendamentos_ativos === 0 ? "outline" : "secondary"}>
                              {closer.agendamentos_ativos}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {closer.ultima_atribuicao
                              ? new Date(closer.ultima_atribuicao).toLocaleDateString('pt-BR')
                              : 'Nunca'}
                          </TableCell>
                          <TableCell className="text-center">
                            {index === 0 ? (
                              <Badge className="bg-success/20 text-success border-success/30">
                                <Target className="h-3 w-3 mr-1" />
                                Próximo
                              </Badge>
                            ) : closer.agendamentos_ativos < 3 ? (
                              <Badge variant="outline" className="text-muted-foreground">
                                Disponível
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-warning text-warning">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Carga Alta
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Próximo Closer da Fila */}
            {getProximoCloser() && (
              <Card className="border-2 border-success/30 bg-gradient-to-br from-success/5 to-success/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <Target className="h-5 w-5" />
                    Próximo da Fila: {getProximoCloser()?.closer_nome}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground">Agendamentos ativos</p>
                      <p className="text-2xl font-bold">{getProximoCloser()?.agendamentos_ativos}</p>
                    </div>
                    <Button
                      size="lg"
                      onClick={() => setModalFilaOpen(true)}
                      className="bg-success hover:bg-success/90"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Atribuir Agendamento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </TabsContent>

          {/* Modal Reagendamentos */}
          <Dialog open={modalReagendamentosOpen} onOpenChange={setModalReagendamentosOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-warning" />
                  Reagendamentos ({agendamentosReagendamento.length})
                </DialogTitle>
              </DialogHeader>

              {/* Filtros no Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar por nome da loja</label>
                  <Input
                    placeholder="Digite o nome da loja..."
                    value={filtroNomeLoja}
                    onChange={(e) => {
                      setFiltroNomeLoja(e.target.value);
                      setPaginaReagendamento(1);
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria/Nicho</label>
                  <Select
                    value={filtroCategoria}
                    onValueChange={(value) => {
                      setFiltroCategoria(value);
                      setPaginaReagendamento(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as categorias</SelectItem>
                      {categoriasUnicas.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Agender</label>
                  <Select
                    value={filtroAgender}
                    onValueChange={(value) => {
                      setFiltroAgender(value);
                      setPaginaReagendamento(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os agenders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os agenders</SelectItem>
                      {agendersDisponiveis?.map((agender) => (
                        <SelectItem key={agender.id} value={agender.id}>{agender.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {agendamentosReagendamento.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    // Agrupar por data
                    const agrupadosPorData = agendamentosReagendamento.reduce((acc: Record<string, any[]>, ag: any) => {
                      const data = ag.data_reuniao || '1970-01-01';
                      if (!acc[data]) acc[data] = [];
                      acc[data].push(ag);
                      return acc;
                    }, {});

                    const datasOrdenadas = Object.keys(agrupadosPorData).sort((a, b) => b.localeCompare(a));

                    return datasOrdenadas.map(data => (
                      <DataAgrupadaSupervisor
                        key={data}
                        data={data}
                        agendamentos={agrupadosPorData[data]}
                        renderItem={(agendamento) => renderAgendamentoPendente(agendamento, {
                          badge: (
                            <Badge
                              variant="outline"
                              className="border-warning text-warning"
                            >
                              Reagendado
                            </Badge>
                          )
                        })}
                      />
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhum reagendamento aguardando atribuição
                </p>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal Auditados sem Closer */}
          <Dialog open={modalSemCloserOpen} onOpenChange={setModalSemCloserOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Auditados sem Closer ({agendamentosAguardandoCloser.length})
                </DialogTitle>
              </DialogHeader>

              {/* Filtros no Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar por nome da loja</label>
                  <Input
                    placeholder="Digite o nome da loja..."
                    value={filtroNomeLoja}
                    onChange={(e) => {
                      setFiltroNomeLoja(e.target.value);
                      setPaginaAguardando(1);
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria/Nicho</label>
                  <Select
                    value={filtroCategoria}
                    onValueChange={(value) => {
                      setFiltroCategoria(value);
                      setPaginaAguardando(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as categorias</SelectItem>
                      {categoriasUnicas.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Agender</label>
                  <Select
                    value={filtroAgender}
                    onValueChange={(value) => {
                      setFiltroAgender(value);
                      setPaginaAguardando(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os agenders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os agenders</SelectItem>
                      {agendersDisponiveis?.map((agender) => (
                        <SelectItem key={agender.id} value={agender.id}>{agender.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {agendamentosAguardandoCloser.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    // Agrupar por data
                    const agrupadosPorData = agendamentosAguardandoCloser.reduce((acc: Record<string, any[]>, ag: any) => {
                      const data = ag.data_reuniao || '1970-01-01';
                      if (!acc[data]) acc[data] = [];
                      acc[data].push(ag);
                      return acc;
                    }, {});

                    const datasOrdenadas = Object.keys(agrupadosPorData).sort((a, b) => b.localeCompare(a));

                    return datasOrdenadas.map(data => (
                      <DataAgrupadaSupervisor
                        key={data}
                        data={data}
                        agendamentos={agrupadosPorData[data]}
                        renderItem={(agendamento) => renderAgendamentoPendente(agendamento)}
                      />
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhum agendamento aguardando closer
                </p>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal Sem Contato */}
          <Dialog open={modalSemContatoOpen} onOpenChange={setModalSemContatoOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  Agendamentos Sem Contato ({agendamentosSemContato?.length || 0})
                </DialogTitle>
              </DialogHeader>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome da loja, dono ou telefone..."
                  value={filtroSemContato}
                  onChange={(e) => setFiltroSemContato(e.target.value)}
                  className="pl-9"
                />
              </div>

              {agendamentosSemContato && agendamentosSemContato.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const filtrados = filtroSemContato.trim()
                      ? agendamentosSemContato.filter((ag: any) => {
                        const termo = filtroSemContato.toLowerCase();
                        return (
                          (ag.nome_loja || '').toLowerCase().includes(termo) ||
                          (ag.nome_dono || '').toLowerCase().includes(termo) ||
                          (ag.telefone || '').toLowerCase().includes(termo)
                        );
                      })
                      : agendamentosSemContato;
                    // Agrupar por data
                    const agrupadosPorData = filtrados.reduce((acc: Record<string, any[]>, ag: any) => {
                      const data = ag.data_reuniao || '1970-01-01';
                      if (!acc[data]) acc[data] = [];
                      acc[data].push(ag);
                      return acc;
                    }, {});

                    const datasOrdenadas = Object.keys(agrupadosPorData).sort((a, b) => b.localeCompare(a));

                    return datasOrdenadas.map(data => (
                      <DataAgrupadaSupervisor
                        key={data}
                        data={data}
                        agendamentos={agrupadosPorData[data]}
                        renderItem={(agendamento) => (
                          <Card key={agendamento.id} className="border border-destructive/30 hover:border-destructive/50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold">{agendamento.nome_loja}</h3>
                                    <Badge variant="outline" className="border-destructive text-destructive">
                                      Sem Contato
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                    <span>👤 {agendamento.nome_dono}</span>
                                    <span>📞 {agendamento.telefone}</span>
                                    <span>📍 {agendamento.escritorio}</span>
                                    <span>🏷️ {agendamento.nicho}</span>
                                  </div>
                                  {agendamento.agender && (
                                    <div className="mt-2 text-sm">
                                      <Badge variant="secondary">Agender: {agendamento.agender.nome}</Badge>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => iniciarEdicao(agendamento)}
                                    title="Editar agendamento"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-primary text-primary"
                                    onClick={() => {
                                      setReagendandoSemContatoId(agendamento.id);
                                      setReagendarDados({ agender_id: agendamento.agender_id || '', data_reuniao: '', horario_reuniao: '' });
                                    }}
                                    title="Reagendar"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Formulário inline de reagendamento */}
                              {reagendandoSemContatoId === agendamento.id && (
                                <div className="mt-3 p-3 border border-primary/30 rounded-lg bg-primary/5 space-y-3">
                                  <p className="text-sm font-medium">Reagendar este cliente</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Agender</Label>
                                      <Select value={reagendarDados.agender_id} onValueChange={(v) => setReagendarDados(prev => ({ ...prev, agender_id: v }))}>
                                        <SelectTrigger className="h-9">
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" className="z-[200]">
                                          {agendersDisponiveis?.map((ag: any) => (
                                            <SelectItem key={ag.id} value={ag.id}>{ag.nome}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Data</Label>
                                      <Input type="date" className="h-9" value={reagendarDados.data_reuniao} onChange={(e) => setReagendarDados(prev => ({ ...prev, data_reuniao: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Horário</Label>
                                      <Input type="time" className="h-9" value={reagendarDados.horario_reuniao} onChange={(e) => setReagendarDados(prev => ({ ...prev, horario_reuniao: e.target.value }))} />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" onClick={() => setReagendandoSemContatoId(null)}>Cancelar</Button>
                                    <Button size="sm" onClick={() => reagendarSemContato(agendamento.id)} disabled={salvandoReagendarSemContato}>
                                      {salvandoReagendarSemContato ? 'Salvando...' : 'Confirmar Reagendamento'}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      />
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhum agendamento sem contato
                </p>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal TP Reagendamentos */}
          <Dialog open={modalTpReagendamentosOpen} onOpenChange={setModalTpReagendamentosOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-orange-500" />
                  🔥 Reagendamentos — Tráfego Pago ({tpReagendamento.length})
                </DialogTitle>
              </DialogHeader>

              {tpReagendamento.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const agrupadosPorData = tpReagendamento.reduce((acc: Record<string, any[]>, ag: any) => {
                      const data = ag.data_reuniao || '1970-01-01';
                      if (!acc[data]) acc[data] = [];
                      acc[data].push(ag);
                      return acc;
                    }, {});
                    const datasOrdenadas = Object.keys(agrupadosPorData).sort((a, b) => b.localeCompare(a));
                    return datasOrdenadas.map(data => (
                      <DataAgrupadaSupervisor
                        key={data}
                        data={data}
                        agendamentos={agrupadosPorData[data]}
                        renderItem={(agendamento) => renderAgendamentoPendente(agendamento, {
                          badge: <Badge className="bg-orange-500 text-white text-[10px]">🔥 TP</Badge>
                        })}
                      />
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum reagendamento de tráfego pago</p>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal TP Auditados sem Closer */}
          <Dialog open={modalTpSemCloserOpen} onOpenChange={setModalTpSemCloserOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  🔥 Auditados sem Closer — Tráfego Pago ({tpAguardandoCloser.length})
                </DialogTitle>
              </DialogHeader>

              {tpAguardandoCloser.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const agrupadosPorData = tpAguardandoCloser.reduce((acc: Record<string, any[]>, ag: any) => {
                      const data = ag.data_reuniao || '1970-01-01';
                      if (!acc[data]) acc[data] = [];
                      acc[data].push(ag);
                      return acc;
                    }, {});
                    const datasOrdenadas = Object.keys(agrupadosPorData).sort((a, b) => b.localeCompare(a));
                    return datasOrdenadas.map(data => (
                      <DataAgrupadaSupervisor
                        key={data}
                        data={data}
                        agendamentos={agrupadosPorData[data]}
                        renderItem={(agendamento) => renderAgendamentoPendente(agendamento, {
                          badge: <Badge className="bg-orange-500 text-white text-[10px]">🔥 TP</Badge>
                        })}
                      />
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum agendamento TP aguardando closer</p>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal TP Sem Contato */}
          <Dialog open={modalTpSemContatoOpen} onOpenChange={setModalTpSemContatoOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-orange-500" />
                  🔥 Sem Contato — Tráfego Pago ({tpSemContato.length})
                </DialogTitle>
              </DialogHeader>

              {tpSemContato.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const agrupadosPorData = tpSemContato.reduce((acc: Record<string, any[]>, ag: any) => {
                      const data = ag.data_reuniao || '1970-01-01';
                      if (!acc[data]) acc[data] = [];
                      acc[data].push(ag);
                      return acc;
                    }, {});
                    const datasOrdenadas = Object.keys(agrupadosPorData).sort((a, b) => b.localeCompare(a));
                    return datasOrdenadas.map(data => (
                      <DataAgrupadaSupervisor
                        key={data}
                        data={data}
                        agendamentos={agrupadosPorData[data]}
                        renderItem={(agendamento) => (
                          <Card key={agendamento.id} className="border border-orange-500/30 hover:border-orange-500/50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold">{agendamento.nome_loja}</h3>
                                    <Badge className="bg-orange-500 text-white text-[10px]">🔥 TP</Badge>
                                    <Badge variant="outline" className="border-destructive text-destructive">Sem Contato</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                    <span>👤 {agendamento.nome_dono}</span>
                                    <span>📞 {agendamento.telefone}</span>
                                    <span>📍 {agendamento.escritorio}</span>
                                    <span>🏷️ {agendamento.nicho}</span>
                                  </div>
                                  {agendamento.agender && (
                                    <div className="mt-2 text-sm">
                                      <Badge variant="secondary">Agender: {agendamento.agender.nome}</Badge>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => iniciarEdicao(agendamento)} title="Editar agendamento">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-primary text-primary"
                                    onClick={() => {
                                      setReagendandoSemContatoId(agendamento.id);
                                      setReagendarDados({ agender_id: agendamento.agender_id || '', data_reuniao: '', horario_reuniao: '' });
                                    }}
                                    title="Reagendar"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {reagendandoSemContatoId === agendamento.id && (
                                <div className="mt-3 p-3 border border-primary/30 rounded-lg bg-primary/5 space-y-3">
                                  <p className="text-sm font-medium">Reagendar este cliente</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Agender</Label>
                                      <Select value={reagendarDados.agender_id} onValueChange={(v) => setReagendarDados(prev => ({ ...prev, agender_id: v }))}>
                                        <SelectTrigger className="h-9">
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" className="z-[200]">
                                          {agendersDisponiveis?.map((ag: any) => (
                                            <SelectItem key={ag.id} value={ag.id}>{ag.nome}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Data</Label>
                                      <Input type="date" className="h-9" value={reagendarDados.data_reuniao} onChange={(e) => setReagendarDados(prev => ({ ...prev, data_reuniao: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Horário</Label>
                                      <Input type="time" className="h-9" value={reagendarDados.horario_reuniao} onChange={(e) => setReagendarDados(prev => ({ ...prev, horario_reuniao: e.target.value }))} />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" onClick={() => setReagendandoSemContatoId(null)}>Cancelar</Button>
                                    <Button size="sm" onClick={() => reagendarSemContato(agendamento.id)} disabled={salvandoReagendarSemContato}>
                                      {salvandoReagendarSemContato ? 'Salvando...' : 'Confirmar Reagendamento'}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      />
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum agendamento TP sem contato</p>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal 99Food Reagendamentos */}
          <Dialog open={modal99ReagendamentosOpen} onOpenChange={setModal99ReagendamentosOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-green-500" />
                  🍔 Reagendamentos — 99Food ({nfReagendamento.length})
                </DialogTitle>
              </DialogHeader>
              {nfReagendamento.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const agrupadosPorData = nfReagendamento.reduce((acc: Record<string, any[]>, ag: any) => {
                      const data = ag.data_reuniao || '1970-01-01';
                      if (!acc[data]) acc[data] = [];
                      acc[data].push(ag);
                      return acc;
                    }, {});
                    const datasOrdenadas = Object.keys(agrupadosPorData).sort((a, b) => b.localeCompare(a));
                    return datasOrdenadas.map(data => (
                      <DataAgrupadaSupervisor
                        key={data}
                        data={data}
                        agendamentos={agrupadosPorData[data]}
                        renderItem={(agendamento) => renderAgendamentoPendente(agendamento, {
                          badge: <Badge className="bg-green-500 text-white text-[10px]">🍔 99F</Badge>
                        })}
                      />
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum reagendamento 99Food</p>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal 99Food Auditados sem Closer */}
          <Dialog open={modal99SemCloserOpen} onOpenChange={setModal99SemCloserOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  🍔 Auditados sem Closer — 99Food ({nfAguardandoCloser.length})
                </DialogTitle>
              </DialogHeader>
              {nfAguardandoCloser.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const agrupadosPorData = nfAguardandoCloser.reduce((acc: Record<string, any[]>, ag: any) => {
                      const data = ag.data_reuniao || '1970-01-01';
                      if (!acc[data]) acc[data] = [];
                      acc[data].push(ag);
                      return acc;
                    }, {});
                    const datasOrdenadas = Object.keys(agrupadosPorData).sort((a, b) => b.localeCompare(a));
                    return datasOrdenadas.map(data => (
                      <DataAgrupadaSupervisor
                        key={data}
                        data={data}
                        agendamentos={agrupadosPorData[data]}
                        renderItem={(agendamento) => renderAgendamentoPendente(agendamento, {
                          badge: <Badge className="bg-green-500 text-white text-[10px]">🍔 99F</Badge>
                        })}
                      />
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum agendamento 99Food aguardando closer</p>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal 99Food Sem Contato */}
          <Dialog open={modal99SemContatoOpen} onOpenChange={setModal99SemContatoOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-green-500" />
                  🍔 Sem Contato — 99Food ({nfSemContato.length})
                </DialogTitle>
              </DialogHeader>
              {nfSemContato.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const agrupadosPorData = nfSemContato.reduce((acc: Record<string, any[]>, ag: any) => {
                      const data = ag.data_reuniao || '1970-01-01';
                      if (!acc[data]) acc[data] = [];
                      acc[data].push(ag);
                      return acc;
                    }, {});
                    const datasOrdenadas = Object.keys(agrupadosPorData).sort((a, b) => b.localeCompare(a));
                    return datasOrdenadas.map(data => (
                      <DataAgrupadaSupervisor
                        key={data}
                        data={data}
                        agendamentos={agrupadosPorData[data]}
                        renderItem={(agendamento) => (
                          <Card key={agendamento.id} className="border border-green-500/30 hover:border-green-500/50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold">{agendamento.nome_loja}</h3>
                                    <Badge className="bg-green-500 text-white text-[10px]">🍔 99F</Badge>
                                    <Badge variant="outline" className="border-destructive text-destructive">Sem Contato</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                    <span>👤 {agendamento.nome_dono}</span>
                                    <span>📞 {agendamento.telefone}</span>
                                    <span>📍 {agendamento.escritorio}</span>
                                    <span>🏷️ {agendamento.nicho}</span>
                                  </div>
                                  {agendamento.agender && (
                                    <div className="mt-2 text-sm">
                                      <Badge variant="secondary">Agender: {agendamento.agender.nome}</Badge>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => iniciarEdicao(agendamento)} title="Editar agendamento">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-primary text-primary"
                                    onClick={() => {
                                      setReagendandoSemContatoId(agendamento.id);
                                      setReagendarDados({ agender_id: agendamento.agender_id || '', data_reuniao: '', horario_reuniao: '' });
                                    }}
                                    title="Reagendar"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {reagendandoSemContatoId === agendamento.id && (
                                <div className="mt-3 p-3 border border-primary/30 rounded-lg bg-primary/5 space-y-3">
                                  <p className="text-sm font-medium">Reagendar este cliente</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Agender</Label>
                                      <Select value={reagendarDados.agender_id} onValueChange={(v) => setReagendarDados(prev => ({ ...prev, agender_id: v }))}>
                                        <SelectTrigger className="h-9">
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" className="z-[200]">
                                          {agendersDisponiveis?.map((ag: any) => (
                                            <SelectItem key={ag.id} value={ag.id}>{ag.nome}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Data</Label>
                                      <Input type="date" className="h-9" value={reagendarDados.data_reuniao} onChange={(e) => setReagendarDados(prev => ({ ...prev, data_reuniao: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Horário</Label>
                                      <Input type="time" className="h-9" value={reagendarDados.horario_reuniao} onChange={(e) => setReagendarDados(prev => ({ ...prev, horario_reuniao: e.target.value }))} />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" onClick={() => setReagendandoSemContatoId(null)}>Cancelar</Button>
                                    <Button size="sm" onClick={() => reagendarSemContato(agendamento.id)} disabled={salvandoReagendarSemContato}>
                                      {salvandoReagendarSemContato ? 'Salvando...' : 'Confirmar Reagendamento'}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      />
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum agendamento 99Food sem contato</p>
              )}
            </DialogContent>
          </Dialog>

          <TabsContent value="performance" className="space-y-6">
            {/* Ranking Visual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Ranking de Auditores - Conversão em Reuniões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {timeMetrics?.sort((a, b) => b.reunioes_confirmadas - a.reunioes_confirmadas).map((metrics, index) => {
                    const performanceBoa = metrics.taxa_confirmacao >= 70;
                    const performanceMedia = metrics.taxa_confirmacao >= 50 && metrics.taxa_confirmacao < 70;

                    return (
                      <Card key={metrics.auditor_id} className={index === 0 ? "border-primary border-2" : ""}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-lg">{metrics.auditor_nome}</span>
                            {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Métricas Principais */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground">Auditorias</p>
                              <p className="text-2xl font-bold">{metrics.total_auditorias}</p>
                            </div>
                            <div className="text-center p-3 bg-success/10 rounded-lg">
                              <p className="text-sm text-muted-foreground">Reuniões Feitas</p>
                              <p className="text-2xl font-bold text-success">{metrics.reunioes_confirmadas}</p>
                            </div>
                          </div>

                          {/* Taxa de Confirmação com Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Taxa de Conversão</span>
                              <span className="font-semibold">{metrics.taxa_confirmacao.toFixed(1)}%</span>
                            </div>
                            <Progress value={metrics.taxa_confirmacao} className="h-2" />
                          </div>

                          {/* Status e Badge */}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="space-y-1">
                              {metrics.reagendamentos > 0 && (
                                <div className="flex items-center gap-1 text-sm">
                                  <RefreshCw className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">{metrics.reagendamentos} reagendados</span>
                                </div>
                              )}
                              {metrics.dados_invalidos > 0 && (
                                <div className="flex items-center gap-1 text-sm text-destructive">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>{metrics.dados_invalidos} inválidos</span>
                                </div>
                              )}
                            </div>
                            <Badge
                              variant={performanceBoa ? "default" : performanceMedia ? "secondary" : "destructive"}
                              className={performanceBoa ? "bg-success" : ""}
                            >
                              {performanceBoa ? "🔥 Top" : performanceMedia ? "✓ Bom" : "⚠️ Atenção"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento Completo</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Auditor</TableHead>
                      <TableHead className="text-center">Total Auditorias</TableHead>
                      <TableHead className="text-center">Reuniões Confirmadas</TableHead>
                      <TableHead className="text-center">Taxa Conversão</TableHead>
                      <TableHead className="text-center">Reagendamentos</TableHead>
                      <TableHead className="text-center">Dados Inválidos</TableHead>
                      <TableHead className="text-center">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeMetrics?.sort((a, b) => b.reunioes_confirmadas - a.reunioes_confirmadas).map((metrics, index) => {
                      const performanceBoa = metrics.taxa_confirmacao >= 70;
                      const performanceMedia = metrics.taxa_confirmacao >= 50 && metrics.taxa_confirmacao < 70;

                      return (
                        <TableRow key={metrics.auditor_id}>
                          <TableCell className="font-medium">
                            {index === 0 && <Award className="h-4 w-4 inline mr-1 text-yellow-500" />}
                            {metrics.auditor_nome}
                          </TableCell>
                          <TableCell className="text-center">{metrics.total_auditorias}</TableCell>
                          <TableCell className="text-center font-semibold text-success">{metrics.reunioes_confirmadas}</TableCell>
                          <TableCell className="text-center">
                            <span className={performanceBoa ? "text-success font-semibold" : performanceMedia ? "text-warning" : "text-destructive"}>
                              {metrics.taxa_confirmacao.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{metrics.reagendamentos}</TableCell>
                          <TableCell className="text-center text-destructive">{metrics.dados_invalidos}</TableCell>
                          <TableCell className="text-center">
                            {performanceBoa ? (
                              <Badge className="bg-success/20 text-success border-success/30">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Excelente
                              </Badge>
                            ) : performanceMedia ? (
                              <Badge variant="outline" className="border-warning text-warning">
                                Bom
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                Precisa Melhorar
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Atribuídos */}
          <TabsContent value="atribuidos" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Agendamentos Atribuídos</h2>
              <p className="text-muted-foreground">Agendamentos com closer atribuído em atendimento</p>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar por nome da loja</label>
                <Input
                  placeholder="Digite o nome da loja..."
                  value={filtroNomeLojaAtribuidos}
                  onChange={(e) => setFiltroNomeLojaAtribuidos(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria/Nicho</label>
                <Select
                  value={filtroCategoriaAtribuidos}
                  onValueChange={setFiltroCategoriaAtribuidos}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[200]">
                    <SelectItem value="todos">Todas as categorias</SelectItem>
                    {[...new Set((agendamentosComCloser || []).map((a: any) => a.nicho).filter(Boolean))].map((cat) => (
                      <SelectItem key={cat as string} value={cat as string}>{cat as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Agender</label>
                <Select
                  value={filtroAgenderAtribuidos}
                  onValueChange={setFiltroAgenderAtribuidos}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os agenders" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[200]">
                    <SelectItem value="todos">Todos os agenders</SelectItem>
                    {agendersDisponiveis?.map((agender) => (
                      <SelectItem key={agender.id} value={agender.id}>{agender.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {agendamentosComCloserFiltradosAtribuidos && agendamentosComCloserFiltradosAtribuidos.length > 0 ? (
              <div className="grid gap-4">
                {agendamentosComCloserFiltradosAtribuidos.map((agendamento: any) => (
                  <Card key={agendamento.id} className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">{agendamento.nome_loja}</h3>
                            <Badge variant="outline" className="border-primary text-primary">
                              Em Atendimento
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground mb-3">
                            <span>📅 {formatDateBR(agendamento.data_reuniao)}</span>
                            <span>🕐 {agendamento.horario_reuniao}</span>
                            <span>👤 {agendamento.nome_dono}</span>
                            <span>📞 {agendamento.telefone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">
                              Closer: {agendamento.closer_nome}
                            </Badge>
                            <Badge variant="outline">{agendamento.nicho}</Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => iniciarEdicao(agendamento)}
                          title="Editar agendamento"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">Nenhum agendamento atribuído</p>
                  <p className="text-muted-foreground">
                    Não há agendamentos com closer em atendimento no momento
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Base de Agendamentos */}
          <TabsContent value="base-agendamentos" className="space-y-6">
            {/* Ferramenta de Busca */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Buscar na Base de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite nome da loja, proprietário ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>

                {/* Resultados da Busca */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h3 className="font-semibold">Resultados da Busca ({searchResults.length})</h3>
                    {searchResults.map((resultado, index) => {
                      // Mapear status para labels legíveis
                      const statusLabels: Record<string, { label: string; color: string }> = {
                        'sem_resposta': { label: 'Sem Resposta', color: 'text-warning' },
                        'em_reagendamento': { label: 'Em Reagendamento', color: 'text-warning' },
                        'agendado': { label: 'Agendado', color: 'text-primary' },
                        'auditado': { label: 'Auditado', color: 'text-success' },
                        'reuniao_manual': { label: 'Reunião Manual', color: 'text-warning' },
                        'aguardando_closer': { label: 'Aguardando Closer', color: 'text-primary' },
                        'em_atendimento_closer': { label: 'Em Atendimento', color: 'text-success' },
                        'reuniao_feita': { label: 'Reunião Feita', color: 'text-success' },
                        'cancelado': { label: 'Cancelado', color: 'text-destructive' },
                        'lead_perdido': { label: 'Lead Perdido', color: 'text-destructive' },
                      };

                      const statusInfo = statusLabels[resultado.status] || { label: resultado.status, color: 'text-muted-foreground' };

                      // Status que podem ser reagendados/editados
                      const statusEditaveis = ['sem_resposta', 'em_reagendamento', 'agendado', 'auditado', 'reuniao_manual', 'aguardando_closer'];
                      const podeEditar = resultado.tipo === 'historico_agendamento' && statusEditaveis.includes(resultado.status);

                      return (
                        <Card key={index} className={resultado.tipo === 'cliente_ativo' ? 'border-destructive' : 'border-muted hover:border-primary/50 transition-colors'}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold">
                                    {resultado.nome || resultado.nome_loja}
                                  </h4>
                                  <Badge variant={resultado.tipo === 'cliente_ativo' ? 'destructive' : 'secondary'}>
                                    {resultado.tipo === 'cliente_ativo' ? '⚠️ Cliente Ativo' : '📋 Histórico'}
                                  </Badge>
                                  {resultado.tipo === 'historico_agendamento' && resultado.status && (
                                    <Badge variant="outline" className={statusInfo.color}>
                                      {statusInfo.label}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  <strong>Proprietário:</strong> {resultado.nome_dono}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <strong>Telefone:</strong> {resultado.telefone_comercial || resultado.telefone_pessoal || resultado.telefone}
                                </p>

                                {resultado.data_reuniao && (
                                  <p className="text-sm text-muted-foreground">
                                    <strong>Data Reunião:</strong> {formatDateBR(resultado.data_reuniao)} às {resultado.horario_reuniao || '--:--'}
                                  </p>
                                )}

                                {resultado.codigo && (
                                  <p className="text-sm text-muted-foreground">
                                    <strong>Código:</strong> {resultado.codigo}
                                  </p>
                                )}
                                {resultado.cidade && (
                                  <p className="text-sm text-muted-foreground">
                                    <strong>Cidade:</strong> {resultado.cidade}
                                  </p>
                                )}
                                {resultado.status_processamento && (
                                  <p className="text-sm text-muted-foreground">
                                    <strong>Status:</strong> {resultado.status_processamento}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                {resultado.tipo === 'cliente_ativo' && (
                                  <AlertTriangle className="h-6 w-6 text-destructive" />
                                )}

                                {/* Botão Editar/Reagendar para status editáveis */}
                                {podeEditar && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => iniciarEdicao(resultado)}
                                    className="whitespace-nowrap"
                                  >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Editar/Reagendar
                                  </Button>
                                )}

                                {resultado.tipo === 'historico_agendamento' &&
                                  resultado.status === 'agendado' &&
                                  (resultado.auditorias_agendamentos?.[0]?.reuniao_aconteceu === true) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={migratingAgendamentoId === resultado.id}
                                      onClick={() => migrarParaReuniaoManual(resultado.id)}
                                    >
                                      {migratingAgendamentoId === resultado.id ? (
                                        <>
                                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                          Migrando...
                                        </>
                                      ) : (
                                        "Migrar p/ Reuniões Manuais"
                                      )}
                                    </Button>
                                  )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <BaseAgendamentos />
          </TabsContent>
        </Tabs>

        {/* Modal Atribuir Closer */}
        <Dialog open={modalFilaOpen} onOpenChange={setModalFilaOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Atribuir Closer ao Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Seleção de Agendamento */}
              <div>
                <label className="text-base font-semibold">Selecione o Agendamento</label>
                <Select value={selectedAgendamento} onValueChange={setSelectedAgendamento}>
                  <SelectTrigger className="bg-background mt-2">
                    <SelectValue placeholder="Selecione o agendamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-[100]" position="popper" sideOffset={5}>
                    {agendamentosPendentes && agendamentosPendentes.length > 0 ? (
                      agendamentosPendentes.filter(ag => ag.id && ag.id.trim() !== '').map((agendamento) => (
                        <SelectItem key={agendamento.id} value={agendamento.id}>
                          {agendamento.nome_loja} - {formatDateBR(agendamento.data_reuniao)}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">Nenhum agendamento pendente</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Detalhes do Agendamento Selecionado */}
              {selectedAgendamento && agendamentosPendentes && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                  <h4 className="font-semibold text-lg">Dados do Cliente</h4>
                  {(() => {
                    const agendamento = agendamentosPendentes.find(a => a.id === selectedAgendamento);
                    if (!agendamento) return null;

                    return (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Loja</p>
                            <p className="font-semibold text-lg">{agendamento.nome_loja}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Proprietário</p>
                            <p className="font-medium">{agendamento.nome_dono}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Telefone</p>
                            <p className="font-medium">{agendamento.telefone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Nicho</p>
                            <Badge>{agendamento.nicho}</Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Data da Reunião</p>
                            <p className="font-medium">
                              {formatDateBR(agendamento.data_reuniao)} às {agendamento.horario_reuniao}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Escritório</p>
                            <Badge variant="secondary">{agendamento.escritorio}</Badge>
                          </div>
                          {(agendamento.link_google || agendamento.link_ifood) && (
                            <div className="flex gap-2 pt-2">
                              {agendamento.link_google && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(agendamento.link_google, '_blank')}
                                >
                                  🔗 Google
                                </Button>
                              )}
                              {agendamento.link_ifood && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(agendamento.link_ifood, '_blank')}
                                >
                                  🔗 iFood
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Seleção de Closer */}
              <div>
                <label className="text-base font-semibold">Selecione o Closer</label>
                <Select value={selectedCloser} onValueChange={setSelectedCloser}>
                  <SelectTrigger className="bg-background mt-2">
                    <SelectValue placeholder="Selecione o closer" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-[100]" position="popper" sideOffset={5}>
                    {closersQueue && closersQueue.length > 0 ? (
                      closersQueue.filter(closer => closer.closer_id && closer.closer_id.trim() !== '').map((closer, index) => (
                        <SelectItem key={closer.closer_id} value={closer.closer_id}>
                          {index === 0 && "⭐ "}{closer.closer_nome} - {closer.agendamentos_ativos} agendamentos ativos
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">Nenhum closer disponível</div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {closersQueue && closersQueue.length > 0 ? (
                    <>⭐ Recomendado: {getProximoCloser()?.closer_nome} (menor carga de trabalho)</>
                  ) : (
                    "Nenhum closer disponível no momento"
                  )}
                </p>
              </div>

              <Button
                onClick={atribuirCloser}
                className="w-full"
                disabled={!selectedAgendamento || !selectedCloser}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Confirmar Atribuição
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição de Agendamento (Supervisão de Auditoria) */}
        <Dialog open={!!editandoAgendamento} onOpenChange={(open) => !open && cancelarEdicao()}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Editar Agendamento (Supervisão de Auditoria)
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Você tem permissão total para editar reuniões, mesmo após auditadas.
              </p>
            </DialogHeader>

            {/* Informações do Closer atual */}
            {dadosEditados.closer_nome && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Closer Atual: <strong className="text-primary">{dadosEditados.closer_nome}</strong></span>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removerCloser(editandoAgendamento!)}
                    disabled={removendoCloser}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    {removendoCloser ? 'Removendo...' : 'Remover Closer'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ao remover o closer, a reunião voltará para "Aguardando definição de closer".
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome-loja">Nome da Loja</Label>
                <Input
                  id="edit-nome-loja"
                  value={dadosEditados.nome_loja || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, nome_loja: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-nome-dono">Nome do Dono</Label>
                <Input
                  id="edit-nome-dono"
                  value={dadosEditados.nome_dono || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, nome_dono: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  value={dadosEditados.telefone || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, telefone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-nicho">Nicho</Label>
                <Input
                  id="edit-nicho"
                  value={dadosEditados.nicho || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, nicho: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cnpj">CNPJ</Label>
                <Input
                  id="edit-cnpj"
                  value={dadosEditados.cnpj || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, cnpj: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={dadosEditados.status || ''}
                  onValueChange={(value) => setDadosEditados({ ...dadosEditados, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[200]">
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="auditado">Auditado</SelectItem>
                    <SelectItem value="aguardando_closer">Aguardando Closer</SelectItem>
                    <SelectItem value="em_reagendamento">Em Reagendamento</SelectItem>
                    <SelectItem value="em_atendimento_closer">Em Atendimento Closer</SelectItem>
                    <SelectItem value="vendido">Vendido</SelectItem>
                    <SelectItem value="nao_vendido">Não Vendido</SelectItem>
                    <SelectItem value="sem_resposta">Sem Resposta</SelectItem>
                    <SelectItem value="reuniao_manual">Reunião Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-data-reuniao">Data da Reunião</Label>
                <Input
                  id="edit-data-reuniao"
                  type="date"
                  value={dadosEditados.data_reuniao || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, data_reuniao: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-horario-reuniao">Horário da Reunião</Label>
                <Input
                  id="edit-horario-reuniao"
                  type="time"
                  value={dadosEditados.horario_reuniao?.slice(0, 5) || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, horario_reuniao: e.target.value + ':00' })}
                />
              </div>

              {/* Alterar Closer */}
              <div className="space-y-2 md:col-span-2">
                <Label>Alterar Closer</Label>
                <Select value={novoCloserSelecionado} onValueChange={setNovoCloserSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um closer (opcional)" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[200]">
                    <SelectItem value="nenhum">Nenhum (remover closer)</SelectItem>
                    {closersQueue?.map((closer) => (
                      <SelectItem key={closer.closer_id} value={closer.closer_id}>
                        {closer.closer_nome} ({closer.agendamentos_ativos} ativos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-link-ifood">Link iFood</Label>
                <Input
                  id="edit-link-ifood"
                  value={dadosEditados.link_ifood || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, link_ifood: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-link-google">Link Google</Label>
                <Input
                  id="edit-link-google"
                  value={dadosEditados.link_google || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, link_google: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Ações especiais */}
            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium mb-3">Ações Rápidas (Supervisão)</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                  onClick={marcarReagendada}
                  disabled={salvandoEdicao}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Marcar como Reagendada
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ao marcar como reagendada, a reunião voltará para definição de closer com a nova data/horário.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={cancelarEdicao}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button onClick={salvarEdicao} disabled={salvandoEdicao}>
                <Save className="h-4 w-4 mr-1" />
                {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
