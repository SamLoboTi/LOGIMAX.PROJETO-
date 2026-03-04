import { useState, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Calendar,
  Clock,
  Phone,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  TrendingUp,
  AlertTriangle,
  Users,
  Target,
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Save,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Agendamento, AuditoriaAgendamento } from "@/types/database";
import GlobalNotifications from "@/components/GlobalNotifications";
import { DiagnosticoAgendamentoModal } from "@/components/DiagnosticoAgendamentoModal";
import { formatDateBR, formatTimeBR } from "@/lib/utils";
import { buscarAgendersAtivosParaSelecao } from "@/services/agendersService";

interface HorarioAgrupadoProps {
  horario: string;
  agendamentos: any[];
  onConfirmar: (agendamento: any) => void;
  onRemarcar: (agendamento: any) => void;
  onDadosInvalidos: (id: string) => void;
}

function HorarioAgrupado({ horario, agendamentos, onConfirmar, onRemarcar, onDadosInvalidos }: HorarioAgrupadoProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatarHorario = (h: string) => {
    // Formatar horário de "14:00:00" para "14:00"
    return h.slice(0, 5);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg cursor-pointer border border-border transition-colors">
          <div className="flex items-center gap-3">
            {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">{formatarHorario(horario)}</span>
          </div>
          <Badge variant="secondary" className="text-sm">
            {agendamentos.length} reunião{agendamentos.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3 ml-4 border-l-2 border-primary/30 pl-4">
        {agendamentos.map((agendamento) => (
          <Card key={agendamento.id} className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{agendamento.nome_loja}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateBR(agendamento.data_reuniao)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {agendamento.tipo_agendamento === 'trafego_pago' && (
                    <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 text-[10px]">🔥 TP</Badge>
                  )}
                  {agendamento.tipo_agendamento === '99food' && (
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px]">🍔 99F</Badge>
                  )}
                  <Badge variant="outline">{agendamento.nicho}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{agendamento.nome_dono}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{agendamento.telefone}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onConfirmar(agendamento)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => onRemarcar(agendamento)}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Remarcar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDadosInvalidos(agendamento.id)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Componente para agrupar agendamentos por data e depois por horário
interface DataAgrupadaProps {
  data: string;
  agendamentos: any[];
  onConfirmar: (agendamento: any) => void;
  onRemarcar: (agendamento: any) => void;
  onDadosInvalidos: (id: string) => void;
}

function DataAgrupada({ data, agendamentos, onConfirmar, onRemarcar, onDadosInvalidos }: DataAgrupadaProps) {
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
          <HorarioAgrupado
            key={horario}
            horario={horario}
            agendamentos={agrupadorPorHorario[horario]}
            onConfirmar={onConfirmar}
            onRemarcar={onRemarcar}
            onDadosInvalidos={onDadosInvalidos}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Componente para agrupar agendamentos não auditados por horário
interface HorarioAgrupadoNaoAuditadosProps {
  horario: string;
  agendamentos: any[];
  onConfirmar: (agendamento: any) => void;
  onRemarcar: (agendamento: any) => void;
  onSemResposta: (id: string) => void;
}

function HorarioAgrupadoNaoAuditados({ horario, agendamentos, onConfirmar, onRemarcar, onSemResposta }: HorarioAgrupadoNaoAuditadosProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatarHorario = (h: string) => h.slice(0, 5);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg cursor-pointer border border-border transition-colors">
          <div className="flex items-center gap-3">
            {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <Clock className="h-5 w-5 text-warning" />
            <span className="text-lg font-bold">{formatarHorario(horario)}</span>
          </div>
          <Badge variant="secondary" className="text-sm">
            {agendamentos.length} reunião{agendamentos.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3 ml-4 border-l-2 border-warning/30 pl-4">
        {agendamentos.map((agendamento) => (
          <Card key={agendamento.id} className="border-l-4 border-l-warning">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{agendamento.nome_loja}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateBR(agendamento.data_reuniao)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {agendamento.tipo_agendamento === 'trafego_pago' && (
                    <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 text-[10px]">🔥 TP</Badge>
                  )}
                  {agendamento.tipo_agendamento === '99food' && (
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px]">🍔 99F</Badge>
                  )}
                  <Badge variant="secondary">Não auditado</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{agendamento.nome_dono}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{agendamento.telefone}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onConfirmar(agendamento)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Reunião Feita
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => onRemarcar(agendamento)}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reagendado
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSemResposta(agendamento.id)}
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Componente para agrupar agendamentos não auditados por data
interface DataAgrupadaNaoAuditadosProps {
  data: string;
  agendamentos: any[];
  onConfirmar: (agendamento: any) => void;
  onRemarcar: (agendamento: any) => void;
  onSemResposta: (id: string) => void;
}

function DataAgrupadaNaoAuditados({ data, agendamentos, onConfirmar, onRemarcar, onSemResposta }: DataAgrupadaNaoAuditadosProps) {
  const [isOpen, setIsOpen] = useState(false);

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
        <div className="flex items-center justify-between p-3 bg-warning/10 hover:bg-warning/20 rounded-lg cursor-pointer border border-warning/30 transition-colors">
          <div className="flex items-center gap-3">
            {isOpen ? <ChevronDown className="h-5 w-5 text-warning" /> : <ChevronRight className="h-5 w-5 text-warning" />}
            <Calendar className="h-5 w-5 text-warning" />
            <span className="text-lg font-bold text-warning">{formatDateBR(data)}</span>
          </div>
          <Badge className="text-sm bg-warning text-warning-foreground">
            {agendamentos.length} reunião{agendamentos.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 ml-4 border-l-2 border-warning/50 pl-4">
        {horariosOrdenados.map(horario => (
          <HorarioAgrupadoNaoAuditados
            key={horario}
            horario={horario}
            agendamentos={agrupadorPorHorario[horario]}
            onConfirmar={onConfirmar}
            onRemarcar={onRemarcar}
            onSemResposta={onSemResposta}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

const auditoriaSchema = z.object({
  agendamento_id: z.string().min(1, "Agendamento é obrigatório"),
  reuniao_aconteceu: z.boolean().optional(),
  reagendou_para: z.string().optional(),
  proprietario_nao_quis: z.boolean().optional(),
  dados_invalidos: z.boolean().optional(),
  closer_id: z.string().optional(),
  horario_inicio_auditoria: z.string().optional(),
  observacoes: z.string().optional(),
  link_meet: z.string().url("Link inválido").optional().or(z.literal(""))
});

const reagendamentoSchema = z.object({
  data_reuniao_nova: z.string().min(1, "Data é obrigatória"),
  horario_reuniao_nova: z.string().min(1, "Horário é obrigatório"),
  motivo_reagendamento: z.string().optional()
});

type AuditoriaForm = z.infer<typeof auditoriaSchema>;

export default function AuditoriaDashboard() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<string>("");
  const [modalAuditoriaOpen, setModalAuditoriaOpen] = useState(false);
  const [modalLinkMeetOpen, setModalLinkMeetOpen] = useState(false);
  const [modalRemarcarOpen, setModalRemarcarOpen] = useState(false);
  const [agendamentoParaConfirmar, setAgendamentoParaConfirmar] = useState<any>(null);
  const [agendamentoParaRemarcar, setAgendamentoParaRemarcar] = useState<any>(null);
  const [linkMeet, setLinkMeet] = useState("");
  const [dataReagendamento, setDataReagendamento] = useState("");
  const [horarioReagendamento, setHorarioReagendamento] = useState("");
  const [motivoReagendamento, setMotivoReagendamento] = useState("");
  const [editandoAgendamento, setEditandoAgendamento] = useState<string | null>(null);
  const [dadosEditados, setDadosEditados] = useState<any>({});

  // Estado para edição no modal de confirmação
  const [editandoModalConfirmar, setEditandoModalConfirmar] = useState(false);
  const [dadosEditadosConfirmar, setDadosEditadosConfirmar] = useState<any>({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Estado para reagendamento no modal de confirmação
  const [reagendandoModalConfirmar, setReagendandoModalConfirmar] = useState(false);
  const [novaDataConfirmar, setNovaDataConfirmar] = useState("");
  const [novoHorarioConfirmar, setNovoHorarioConfirmar] = useState("");
  const [motivoReagendamentoConfirmar, setMotivoReagendamentoConfirmar] = useState("");
  const [salvandoReagendamento, setSalvandoReagendamento] = useState(false);

  // Estado para conferência obrigatória no reagendamento
  const [conferenciaRemarcar, setConferenciaRemarcar] = useState({
    nomeLoja: false,
    contato: false,
    dataHorario: false,
    observacoes: false
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modais para os cards de agendamentos
  const [modalParaAuditarOpen, setModalParaAuditarOpen] = useState(false);
  const [modalNaoAuditadosOpen, setModalNaoAuditadosOpen] = useState(false);

  // Filtros de Data e Horário
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroHorarioInicio, setFiltroHorarioInicio] = useState("");
  const [filtroHorarioFim, setFiltroHorarioFim] = useState("");

  // Novos filtros de busca
  const [filtroNomeLoja, setFiltroNomeLoja] = useState("");
  const [filtroNomeDono, setFiltroNomeDono] = useState("");
  const [filtroTelefone, setFiltroTelefone] = useState("");
  const [filtroCnpj, setFiltroCnpj] = useState("");
  const [filtroAgender, setFiltroAgender] = useState("todos");
  const [filtroNaoAuditados, setFiltroNaoAuditados] = useState("");
  const [tipoAgendamentoAtivo, setTipoAgendamentoAtivo] = useState<'normal' | 'trafego_pago' | '99food'>('normal');
  const [showDiagnosticoModal, setShowDiagnosticoModal] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AuditoriaForm>({
    resolver: zodResolver(auditoriaSchema)
  });

  // Buscar role do usuário atual para controle de permissões
  const { data: currentUserRole } = useQuery({
    queryKey: ['current-user-role-auditoria'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar role do usuário:', error);
        return null;
      }
      return data?.role || null;
    }
  });

  // Verifica se é supervisor de auditoria (Letícia)
  const isSupervisorAuditoria = currentUserRole === 'supervisor_auditoria';

  // (hojeQueryStr removido — classificação temporal delegada ao banco via bucket_temporal)

  // Query única via view_painel_auditoria com auditorias via embedded relation
  const { data: agendamentosPendentes, isLoading, error: queryError } = useQuery({
    queryKey: ['painel-auditoria-view'],
    queryFn: async () => {
      console.log('Buscando agendamentos via view_painel_auditoria...');

      const { data, error } = await supabase
        .from('view_painel_auditoria')
        .select(`
          *,
          auditorias_agendamentos(
            *,
            auditor:users!auditor_id(nome),
            closer:users!closer_id(nome)
          )
        `)
        .order('data_reuniao', { ascending: true });

      if (error) { console.error('Erro view_painel_auditoria:', error); throw error; }

      const resultado = (data || []).map((a: any) => ({
        ...a,
        agender: { nome: a.agender_nome }
      }));

      console.log('Agendamentos via view:', resultado.length);
      return resultado as any[];
    },
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true
  });

  // Helper para invalidar a query unificada
  const invalidarAgendamentos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['painel-auditoria-view'] });
  }, [queryClient]);

  // Buscar lista de agenders para filtro
  const { data: agendersDisponiveis } = useQuery({
    queryKey: ['agenders-lista-filtro-auditoria-v2'],
    queryFn: buscarAgendersAtivosParaSelecao,
    staleTime: 60000
  });

  // Buscar closers disponíveis
  const { data: closers } = useQuery({
    queryKey: ['closers-disponiveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, nome, role')
        .in('role', ['time_closer', 'supervisor_closer', 'admin', 'socio'])
        .order('nome');

      if (error) {
        console.error("Erro ao buscar closers:", error);
        throw error;
      }
      return data;
    },
    staleTime: 60000 // Cache por 1 minuto (closers não mudam frequentemente)
  });

  // Buscar auditorias realizadas hoje
  const { data: auditoriasHoje } = useQuery({
    queryKey: ['auditorias-hoje'],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('auditorias_agendamentos')
        .select(`
          *,
          agendamento:agendamentos(id, nome_loja, telefone, nome_dono),
          auditor:users!auditor_id(nome),
          closer:users!closer_id(nome)
        `)
        .gte('created_at', hoje)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any;
    },
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true
  });

  // Ordenar tudo por data/horario para exibição consistente
  const agendamentosNaoAuditadosOrdenados = useMemo(() => {
    const base = agendamentosPendentes || [];
    return [...base].sort((a, b) => {
      const dataA = `${a.data_reuniao || '9999-12-31'} ${a.horario_reuniao || '00:00'}`;
      const dataB = `${b.data_reuniao || '9999-12-31'} ${b.horario_reuniao || '00:00'}`;
      return dataA.localeCompare(dataB);
    });
  }, [agendamentosPendentes]);

  // Divisão de abas usando bucket_temporal calculado pelo banco (sem ambiguidade de timezone)
  const { agendamentosParaAuditar, agendamentosNaoAuditadosPassados } = useMemo(() => {
    const paraAuditar = agendamentosNaoAuditadosOrdenados.filter(
      (a) => a.bucket_temporal === 'futuro' || a.bucket_temporal === 'hoje' || a.bucket_temporal === 'sem_data'
    );
    const passados = agendamentosNaoAuditadosOrdenados.filter(
      (a) => a.bucket_temporal === 'passado'
    );
    return { agendamentosParaAuditar: paraAuditar, agendamentosNaoAuditadosPassados: passados };
  }, [agendamentosNaoAuditadosOrdenados]);

  // Função de filtro memoizada
  const aplicarFiltros = useCallback((lista: any[]) => lista.filter(a => {
    if (filtroDataInicio && a.data_reuniao < filtroDataInicio) return false;
    if (filtroDataFim && a.data_reuniao > filtroDataFim) return false;

    if (filtroHorarioInicio || filtroHorarioFim) {
      const horarioAgendamento = a.horario_reuniao?.slice(0, 5) || "00:00";
      if (filtroHorarioInicio && horarioAgendamento < filtroHorarioInicio) return false;
      if (filtroHorarioFim && horarioAgendamento > filtroHorarioFim) return false;
    }

    if (filtroNomeLoja && !a.nome_loja?.toLowerCase().includes(filtroNomeLoja.toLowerCase())) return false;
    if (filtroNomeDono && !a.nome_dono?.toLowerCase().includes(filtroNomeDono.toLowerCase())) return false;
    if (filtroTelefone && !a.telefone?.includes(filtroTelefone)) return false;
    if (filtroCnpj && !a.cnpj?.includes(filtroCnpj)) return false;
    if (filtroAgender !== "todos" && a.agender_id !== filtroAgender) return false;

    return true;
  }), [filtroDataInicio, filtroDataFim, filtroHorarioInicio, filtroHorarioFim, filtroNomeLoja, filtroNomeDono, filtroTelefone, filtroCnpj, filtroAgender]);

  const agendamentosNaoAuditados = useMemo(() => aplicarFiltros(agendamentosNaoAuditadosOrdenados), [aplicarFiltros, agendamentosNaoAuditadosOrdenados]);
  const agendamentosParaAuditarFiltrados = useMemo(() => aplicarFiltros(agendamentosParaAuditar), [aplicarFiltros, agendamentosParaAuditar]);
  const agendamentosPassadosFiltrados = useMemo(() => aplicarFiltros(agendamentosNaoAuditadosPassados), [aplicarFiltros, agendamentosNaoAuditadosPassados]);

  const { agendamentosAuditados, reunioesConfirmadas, taxaConfirmacao, reagendamentos, dadosInvalidos } = useMemo(() => {
    const auditados = agendamentosPendentes?.filter(a =>
      a.auditorias_agendamentos && a.auditorias_agendamentos.length > 0
    ) || [];

    const confirmadas = auditados.filter(a =>
      a.auditorias_agendamentos?.[0]?.reuniao_aconteceu
    ).length;

    const taxa = auditados.length > 0 ?
      (confirmadas / auditados.length) * 100 : 0;

    const reag = auditados.filter(a =>
      a.auditorias_agendamentos?.[0]?.reagendou_para
    ).length;

    const invalidos = auditados.filter(a =>
      a.auditorias_agendamentos?.[0]?.dados_invalidos
    ).length;

    return {
      agendamentosAuditados: auditados,
      reunioesConfirmadas: confirmadas,
      taxaConfirmacao: taxa,
      reagendamentos: reag,
      dadosInvalidos: invalidos
    };
  }, [agendamentosPendentes]);

  const onSubmit = async (data: AuditoriaForm) => {
    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const auditoriaData = {
        agendamento_id: data.agendamento_id,
        auditor_id: user.user.id,
        reuniao_aconteceu: data.reuniao_aconteceu || false,
        reagendou_para: data.reagendou_para ? new Date(data.reagendou_para).toISOString() : null,
        proprietario_nao_quis: data.proprietario_nao_quis || false,
        dados_invalidos: data.dados_invalidos || false,
        closer_id: data.closer_id || null,
        horario_inicio_auditoria: data.horario_inicio_auditoria || null,
        observacoes: data.observacoes || null,
        link_meet: data.link_meet || null
      };

      const { error } = await supabase
        .from('auditorias_agendamentos')
        .insert([auditoriaData]);

      if (error) throw error;

      // Atualizar status do agendamento
      // Se dados inválidos → 'cancelado'
      // Se tem closer atribuído → 'em_atendimento_closer' 
      // Se reunião aconteceu (marcado pelo auditor) → 'reuniao_manual' (supervisor vê na aba Reuniões Manuais)
      // Se não tem closer → 'auditado' (aguardando supervisor atribuir)
      let novoStatus = 'auditado';
      if (data.dados_invalidos) {
        novoStatus = 'cancelado';
      } else if (data.closer_id) {
        novoStatus = 'em_atendimento_closer';
      } else if (data.reuniao_aconteceu) {
        // Reunião marcada como realizada pelo auditor → vai para aba "Reuniões Manuais" do supervisor
        novoStatus = 'reuniao_manual';
      }

      await supabase
        .from('agendamentos')
        .update({ status: novoStatus })
        .eq('id', data.agendamento_id);

      const mensagemSucesso = novoStatus === 'reuniao_manual'
        ? "Reunião confirmada - aguardando supervisor atribuir closer"
        : novoStatus === 'em_atendimento_closer'
          ? "Auditoria registrada - closer atribuído"
          : "Auditoria registrada com sucesso";

      toast({
        title: "Sucesso!",
        description: mensagemSucesso
      });

      reset();
      setModalAuditoriaOpen(false);
      invalidarAgendamentos();
      queryClient.invalidateQueries({ queryKey: ['auditorias-hoje'] });
      queryClient.invalidateQueries({ queryKey: ['reunioes-manuais'] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbrirModalConfirmar = (agendamento: any) => {
    setAgendamentoParaConfirmar(agendamento);
    setLinkMeet("");
    setEditandoModalConfirmar(false);
    setDadosEditadosConfirmar({});
    setReagendandoModalConfirmar(false);
    setNovaDataConfirmar("");
    setNovoHorarioConfirmar("");
    setMotivoReagendamentoConfirmar("");
    setModalLinkMeetOpen(true);
  };

  // Salvar reagendamento do modal de confirmação
  const handleSalvarReagendamentoConfirmar = async () => {
    if (!agendamentoParaConfirmar?.id || !novaDataConfirmar || !novoHorarioConfirmar) {
      toast({
        title: "Atenção",
        description: "Preencha a nova data e horário",
        variant: "destructive"
      });
      return;
    }

    setSalvandoReagendamento(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Registrar reagendamento (não-bloqueante)
      console.log('[Confirmar-Remarcar] agendamento_id:', agendamentoParaConfirmar.id);
      const { error: reagendamentoError } = await supabase
        .from('agendamentos_remarcados')
        .insert([{
          agendamento_id: agendamentoParaConfirmar.id,
          data_reuniao_anterior: agendamentoParaConfirmar.data_reuniao,
          data_reuniao_nova: novaDataConfirmar,
          horario_reuniao_anterior: agendamentoParaConfirmar.horario_reuniao,
          horario_reuniao_nova: novoHorarioConfirmar,
          motivo_reagendamento: motivoReagendamentoConfirmar || 'Cliente não pode participar',
          remarcado_por: user.user.id
        }]);

      if (reagendamentoError) {
        console.warn('[Confirmar-Remarcar] Erro ao registrar histórico (não-bloqueante):', reagendamentoError.message);
      }

      // Atualizar agendamento com nova data/horário
      const { error: updateError } = await supabase
        .from('agendamentos')
        .update({
          data_reuniao: novaDataConfirmar,
          horario_reuniao: novoHorarioConfirmar,
          status: 'agendado'
        })
        .eq('id', agendamentoParaConfirmar.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso!",
        description: "Agendamento remarcado com sucesso"
      });

      setModalLinkMeetOpen(false);
      setAgendamentoParaConfirmar(null);
      setReagendandoModalConfirmar(false);
      setNovaDataConfirmar("");
      setNovoHorarioConfirmar("");
      setMotivoReagendamentoConfirmar("");

      invalidarAgendamentos();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSalvandoReagendamento(false);
    }
  };

  // Iniciar modo de edição no modal de confirmação
  const handleIniciarEdicaoConfirmar = () => {
    setDadosEditadosConfirmar({
      nome_loja: agendamentoParaConfirmar?.nome_loja || '',
      nome_dono: agendamentoParaConfirmar?.nome_dono || '',
      telefone: agendamentoParaConfirmar?.telefone || '',
      link_ifood: agendamentoParaConfirmar?.link_ifood || '',
      link_google: agendamentoParaConfirmar?.link_google || '',
      cnpj: agendamentoParaConfirmar?.cnpj || '',
      nicho: agendamentoParaConfirmar?.nicho || ''
    });
    setEditandoModalConfirmar(true);
  };

  // Salvar edições do modal de confirmação
  const handleSalvarEdicaoConfirmar = async () => {
    if (!agendamentoParaConfirmar?.id) return;

    setSalvandoEdicao(true);
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({
          nome_loja: dadosEditadosConfirmar.nome_loja?.trim(),
          nome_dono: dadosEditadosConfirmar.nome_dono?.trim(),
          telefone: dadosEditadosConfirmar.telefone?.trim(),
          link_ifood: dadosEditadosConfirmar.link_ifood?.trim() || null,
          link_google: dadosEditadosConfirmar.link_google?.trim() || null,
          cnpj: dadosEditadosConfirmar.cnpj?.trim() || null,
          nicho: dadosEditadosConfirmar.nicho?.trim()
        })
        .eq('id', agendamentoParaConfirmar.id);

      if (error) throw error;

      // Atualizar estado local
      setAgendamentoParaConfirmar({
        ...agendamentoParaConfirmar,
        ...dadosEditadosConfirmar
      });

      setEditandoModalConfirmar(false);
      setDadosEditadosConfirmar({});

      toast({
        title: "Sucesso!",
        description: "Dados atualizados com sucesso"
      });

      invalidarAgendamentos();
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

  const handleConfirmarComLink = async () => {
    if (!linkMeet.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, insira o link do Google Meet",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // IMPORTANTE: Link confirmado NÃO significa reunião realizada
      // reuniao_aconteceu: false - a reunião ainda não foi realizada, apenas auditada com link
      // Status: 'auditado' - aguarda supervisor atribuir closer
      const { error } = await supabase
        .from('auditorias_agendamentos')
        .insert([{
          agendamento_id: agendamentoParaConfirmar?.id,
          auditor_id: user.user.id,
          reuniao_aconteceu: false, // Reunião ainda não aconteceu - apenas link confirmado
          link_meet: linkMeet,
          observacoes: 'Reunião auditada com link do Meet - aguardando atribuição de closer'
        }]);

      if (error) throw error;

      // Status 'auditado' - reunião aparece em "Auditados sem Closer" para supervisor atribuir
      const { error: updateError } = await supabase
        .from('agendamentos')
        .update({ status: 'auditado' })
        .eq('id', agendamentoParaConfirmar?.id);

      if (updateError) {
        console.error('Erro ao atualizar status para auditado:', updateError);
        throw updateError;
      }

      toast({
        title: "Reunião Auditada!",
        description: "Aguardando supervisor atribuir closer"
      });

      setModalLinkMeetOpen(false);
      setLinkMeet("");
      setAgendamentoParaConfirmar(null);
      invalidarAgendamentos();
      queryClient.invalidateQueries({ queryKey: ['auditorias-hoje'] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Marcar status direto (sem_resposta, sem_closer, etc.)
  const handleMarcarStatus = async (agendamentoId: string, status: string, motivo: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Criar registro de auditoria
      const { error: auditoriaError } = await supabase
        .from('auditorias_agendamentos')
        .insert([{
          agendamento_id: agendamentoId,
          auditor_id: user.user.id,
          reuniao_aconteceu: false,
          observacoes: motivo
        }]);

      if (auditoriaError) throw auditoriaError;

      // Atualizar status do agendamento diretamente
      const { error: statusError } = await supabase
        .from('agendamentos')
        .update({ status })
        .eq('id', agendamentoId);

      if (statusError) throw statusError;

      toast({
        title: "Sucesso!",
        description: `Agendamento marcado como: ${motivo}`
      });

      invalidarAgendamentos();
      queryClient.invalidateQueries({ queryKey: ['auditorias-hoje'] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Enviar para reagendamento
  const handleEnviarReagendamento = async (agendamentoId: string, motivo: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Criar registro de reagendamento
      const { error: reagendamentoError } = await supabase
        .from('reagendamentos')
        .insert([{
          agendamento_id: agendamentoId,
          motivo: motivo,
          observacoes: `Enviado pela auditoria por: ${motivo}`,
          responsavel_reagendamento_id: null,
          status: 'pendente'
        }]);

      if (reagendamentoError) throw reagendamentoError;

      // Atualizar status do agendamento
      const { error: statusError } = await supabase
        .from('agendamentos')
        .update({ status: 'em_reagendamento' })
        .eq('id', agendamentoId);

      if (statusError) throw statusError;

      toast({
        title: "Sucesso!",
        description: "Agendamento enviado para o time de reagendamento"
      });

      invalidarAgendamentos();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Marcar como "Já é Cliente" - loja já existe na base
  const handleMarcarJaECliente = async (agendamentoId: string, telefone: string, nomeLoja: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Verificar se já existe uma loja com esse telefone na base
      const { data: lojaExistente } = await supabase
        .from('lojas')
        .select('id, nome, codigo')
        .or(`telefone_comercial.eq.${telefone},telefone_pessoal.eq.${telefone}`)
        .limit(1);

      // Criar registro de auditoria marcando como cliente existente
      const { error: auditoriaError } = await supabase
        .from('auditorias_agendamentos')
        .insert([{
          agendamento_id: agendamentoId,
          auditor_id: user.user.id,
          reuniao_aconteceu: false,
          observacoes: lojaExistente && lojaExistente.length > 0
            ? `Já é cliente - Loja encontrada: ${lojaExistente[0].nome} (${lojaExistente[0].codigo})`
            : `Marcado como cliente existente pelo auditor`
        }]);

      if (auditoriaError) throw auditoriaError;

      // Atualizar status do agendamento para "ja_cliente" para evitar duplicidade
      const { error: statusError } = await supabase
        .from('agendamentos')
        .update({ status: 'ja_cliente' })
        .eq('id', agendamentoId);

      if (statusError) throw statusError;

      toast({
        title: "Sucesso!",
        description: lojaExistente && lojaExistente.length > 0
          ? `Agendamento marcado como cliente existente: ${lojaExistente[0].nome}`
          : "Agendamento marcado como cliente existente"
      });

      invalidarAgendamentos();
      queryClient.invalidateQueries({ queryKey: ['auditorias-hoje'] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAuditoriaRapida = async (agendamentoId: string, reuniaoAconteceu: boolean) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from('auditorias_agendamentos')
        .insert([{
          agendamento_id: agendamentoId,
          auditor_id: user.user.id,
          reuniao_aconteceu: reuniaoAconteceu,
          observacoes: `Auditoria rápida - ${reuniaoAconteceu ? 'Confirmada' : 'Não aconteceu'}`
        }]);

      if (error) throw error;

      // Se reunião aconteceu → 'reuniao_manual' (supervisor vê na aba Reuniões Manuais para atribuir closer)
      // Se não aconteceu → 'auditado' (aguardando reavaliação)
      const novoStatus = reuniaoAconteceu ? 'reuniao_manual' : 'auditado';
      await supabase
        .from('agendamentos')
        .update({ status: novoStatus })
        .eq('id', agendamentoId);

      toast({
        title: "Sucesso!",
        description: reuniaoAconteceu
          ? 'Reunião confirmada - aguardando supervisor atribuir closer'
          : 'Marcada como não realizada'
      });

      invalidarAgendamentos();
      queryClient.invalidateQueries({ queryKey: ['auditorias-hoje'] });
      queryClient.invalidateQueries({ queryKey: ['reunioes-manuais'] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Abrir modal de reagendamento com conferência obrigatória
  const handleAbrirModalRemarcar = (agendamento: any) => {
    setAgendamentoParaRemarcar(agendamento);
    setDataReagendamento("");
    setHorarioReagendamento("");
    setMotivoReagendamento("");
    setConferenciaRemarcar({
      nomeLoja: false,
      contato: false,
      dataHorario: false,
      observacoes: false
    });
    setModalRemarcarOpen(true);
  };

  // Verificar se todas as conferências foram feitas
  const todasConferenciasFeitas = () => {
    return conferenciaRemarcar.nomeLoja &&
      conferenciaRemarcar.contato &&
      conferenciaRemarcar.dataHorario;
  };

  const handleRemarcarAgendamento = async () => {
    if (!agendamentoParaRemarcar || !dataReagendamento || !horarioReagendamento) {
      toast({
        title: "Atenção",
        description: "Preencha a nova data e horário",
        variant: "destructive"
      });
      return;
    }

    if (!todasConferenciasFeitas()) {
      toast({
        title: "Conferência Obrigatória",
        description: "Você deve conferir todas as informações antes de reagendar",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      // Inserir registro no banco de reagendamentos (não-bloqueante)
      console.log('[Remarcar] agendamento_id:', agendamentoParaRemarcar.id);
      const { error: reagendError } = await supabase
        .from('agendamentos_remarcados')
        .insert([{
          agendamento_id: agendamentoParaRemarcar.id,
          data_reuniao_anterior: agendamentoParaRemarcar.data_reuniao,
          horario_reuniao_anterior: agendamentoParaRemarcar.horario_reuniao,
          data_reuniao_nova: dataReagendamento,
          horario_reuniao_nova: horarioReagendamento,
          motivo_reagendamento: motivoReagendamento || 'Cliente solicitou reagendamento',
          remarcado_por: user.user.id,
          auditoria_id: agendamentoParaRemarcar.auditorias_agendamentos?.[0]?.id
        }]);

      if (reagendError) {
        console.warn('[Remarcar] Erro ao registrar histórico (não-bloqueante):', reagendError.message);
      }

      // Remover registros de auditoria antigos para que o agendamento volte "limpo" para a fila
      const { error: deleteAuditoriaError } = await supabase
        .from('auditorias_agendamentos')
        .delete()
        .eq('agendamento_id', agendamentoParaRemarcar.id);

      if (deleteAuditoriaError) {
        console.warn('[Remarcar] Erro ao limpar auditorias antigas (não-bloqueante):', deleteAuditoriaError.message);
      }

      // Atualizar o agendamento com nova data/horário
      // Status volta para 'agendado' para que retorne ao fluxo normal sem auditoria
      const { error: updateError } = await supabase
        .from('agendamentos')
        .update({
          data_reuniao: dataReagendamento,
          horario_reuniao: horarioReagendamento,
          status: 'agendado'
        })
        .eq('id', agendamentoParaRemarcar.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso!",
        description: "Agendamento remarcado com nova data/horário e retornado ao fluxo"
      });

      setModalRemarcarOpen(false);
      setAgendamentoParaRemarcar(null);
      setDataReagendamento("");
      setHorarioReagendamento("");
      setMotivoReagendamento("");
      setConferenciaRemarcar({
        nomeLoja: false,
        contato: false,
        dataHorario: false,
        observacoes: false
      });
      invalidarAgendamentos();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleIniciarEdicao = (agendamento: any) => {
    setEditandoAgendamento(agendamento.id);
    setDadosEditados({
      nome_dono: agendamento.nome_dono,
      nome_loja: agendamento.nome_loja,
      telefone: agendamento.telefone,
      nicho: agendamento.nicho,
      data_reuniao: agendamento.data_reuniao,
      horario_reuniao: agendamento.horario_reuniao,
      link_google: agendamento.link_google || '',
      link_ifood: agendamento.link_ifood || ''
    });
  };

  const handleSalvarEdicao = async (agendamentoId: string) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update(dadosEditados)
        .eq('id', agendamentoId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Agendamento atualizado com sucesso"
      });

      setEditandoAgendamento(null);
      setDadosEditados({});
      invalidarAgendamentos();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCancelarEdicao = () => {
    setEditandoAgendamento(null);
    setDadosEditados({});
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

      // Buscar em agendamentos
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('id, nome_loja, nome_dono, telefone, status, created_at')
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

  const getStatusBadge = (agendamento: Agendamento) => {
    if (!agendamento.auditorias_agendamentos || agendamento.auditorias_agendamentos.length === 0) {
      return <Badge variant="outline">Pendente</Badge>;
    }

    const auditoria = agendamento.auditorias_agendamentos[0];
    if (auditoria.reuniao_aconteceu) {
      return <Badge variant="default">Confirmada</Badge>;
    }
    if (auditoria.dados_invalidos) {
      return <Badge variant="destructive">Dados Inválidos</Badge>;
    }
    if (auditoria.reagendou_para) {
      return <Badge variant="secondary">Reagendado</Badge>;
    }
    return <Badge variant="outline">Auditado</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-destructive">
            <p className="font-bold">Erro ao carregar agendamentos</p>
            <p className="text-sm">{queryError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <GlobalNotifications />
      </div>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1 className="text-responsive-title">Dashboard de Auditoria</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Controle de qualidade e confirmação de reuniões</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowDiagnosticoModal(true)}>
            <Search className="h-4 w-4 mr-2" />
            Localizar
          </Button>
        </div>

        {/* Dados Principais do Setor */}
        <div className="cards-grid-4">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Pendentes</p>
              <p className="text-xl sm:text-2xl font-bold text-warning">{agendamentosNaoAuditados.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Confirmadas</p>
              <p className="text-xl sm:text-2xl font-bold text-success">{reunioesConfirmadas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Taxa</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{taxaConfirmacao.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Reagendamentos</p>
              <p className="text-xl sm:text-2xl font-bold text-info">{reagendamentos}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="normal" onValueChange={(v) => { if (v === 'normal' || v === 'trafego_pago' || v === '99food') setTipoAgendamentoAtivo(v); }} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="w-full flex gap-1 h-auto p-1 bg-muted min-w-max sm:min-w-0">
              <TabsTrigger value="normal" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
                Normal ({agendamentosNaoAuditados.filter(a => (a.tipo_agendamento || 'normal') === 'normal').length})
              </TabsTrigger>
              <TabsTrigger value="trafego_pago" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
                🔥 Tráfego Pago ({agendamentosNaoAuditados.filter(a => a.tipo_agendamento === 'trafego_pago').length})
              </TabsTrigger>
              <TabsTrigger value="99food" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 text-green-500 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                🍔 99Food ({agendamentosNaoAuditados.filter(a => a.tipo_agendamento === '99food').length})
              </TabsTrigger>
              <TabsTrigger value="auditados" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Auditados ({auditoriasHoje?.length || 0})</TabsTrigger>
              <TabsTrigger value="ferramentas" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Ferramentas</TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Normal */}
          <TabsContent value="normal" className="space-y-6">
            {(() => {
              const paraAuditarNormal = agendamentosParaAuditarFiltrados.filter(a => (a.tipo_agendamento || 'normal') === 'normal');
              const passadosNormal = agendamentosPassadosFiltrados.filter(a => (a.tipo_agendamento || 'normal') === 'normal');
              return (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-primary hover:border-l-primary/80"
                      onClick={() => setModalParaAuditarOpen(true)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Clock className="h-5 w-5 text-primary" />
                          Para Auditar
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-primary">{paraAuditarNormal.length}</p>
                        <p className="text-sm text-muted-foreground mt-1">Reuniões de hoje e futuras para conferir</p>
                      </CardContent>
                    </Card>
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-warning hover:border-l-warning/80"
                      onClick={() => setModalNaoAuditadosOpen(true)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <AlertTriangle className="h-5 w-5 text-warning" />
                          Não Auditados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-warning">{passadosNormal.length}</p>
                        <p className="text-sm text-muted-foreground mt-1">Reuniões que já passaram sem auditoria</p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* Tab Tráfego Pago */}
          <TabsContent value="trafego_pago" className="space-y-6">
            {(() => {
              const paraAuditarTP = agendamentosParaAuditarFiltrados.filter(a => a.tipo_agendamento === 'trafego_pago');
              const passadosTP = agendamentosPassadosFiltrados.filter(a => a.tipo_agendamento === 'trafego_pago');
              return (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-orange-500 hover:border-l-orange-400"
                      onClick={() => setModalParaAuditarOpen(true)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Clock className="h-5 w-5 text-orange-500" />
                          Para Auditar (Tráfego Pago)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-orange-500">{paraAuditarTP.length}</p>
                        <p className="text-sm text-muted-foreground mt-1">Reuniões de tráfego pago agendadas</p>
                      </CardContent>
                    </Card>
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-warning hover:border-l-warning/80"
                      onClick={() => setModalNaoAuditadosOpen(true)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <AlertTriangle className="h-5 w-5 text-warning" />
                          Não Auditados (Tráfego Pago)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-warning">{passadosTP.length}</p>
                        <p className="text-sm text-muted-foreground mt-1">Reuniões de tráfego pago sem auditoria</p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* Tab 99Food */}
          <TabsContent value="99food" className="space-y-6">
            {(() => {
              const paraAuditar99 = agendamentosParaAuditarFiltrados.filter(a => a.tipo_agendamento === '99food');
              const passados99 = agendamentosPassadosFiltrados.filter(a => a.tipo_agendamento === '99food');
              return (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-green-500 hover:border-l-green-400"
                      onClick={() => setModalParaAuditarOpen(true)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Clock className="h-5 w-5 text-green-500" />
                          Para Auditar (99Food)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-green-500">{paraAuditar99.length}</p>
                        <p className="text-sm text-muted-foreground mt-1">Reuniões de 99Food agendadas</p>
                      </CardContent>
                    </Card>
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-warning hover:border-l-warning/80"
                      onClick={() => setModalNaoAuditadosOpen(true)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <AlertTriangle className="h-5 w-5 text-warning" />
                          Não Auditados (99Food)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-warning">{passados99.length}</p>
                        <p className="text-sm text-muted-foreground mt-1">Reuniões de 99Food sem auditoria</p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          <Dialog open={modalParaAuditarOpen} onOpenChange={setModalParaAuditarOpen}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Para Auditar {tipoAgendamentoAtivo === 'trafego_pago' ? '(Tráfego Pago)' : tipoAgendamentoAtivo === '99food' ? '(99Food)' : '(Normal)'} ({agendamentosParaAuditarFiltrados.filter(a => tipoAgendamentoAtivo === 'trafego_pago' ? a.tipo_agendamento === 'trafego_pago' : tipoAgendamentoAtivo === '99food' ? a.tipo_agendamento === '99food' : (a.tipo_agendamento || 'normal') === 'normal').length})
                </DialogTitle>
              </DialogHeader>

              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Buscar por Loja</label>
                  <Input
                    placeholder="Nome da loja..."
                    value={filtroNomeLoja}
                    onChange={(e) => setFiltroNomeLoja(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Filtrar por Agender</label>
                  <Select value={filtroAgender} onValueChange={setFiltroAgender}>
                    <SelectTrigger className="w-full sm:w-[200px]">
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

              <div className="space-y-4">
                {(() => {
                  const listaFiltradaPorTipo = agendamentosParaAuditarFiltrados.filter(a => tipoAgendamentoAtivo === 'trafego_pago' ? a.tipo_agendamento === 'trafego_pago' : tipoAgendamentoAtivo === '99food' ? a.tipo_agendamento === '99food' : (a.tipo_agendamento || 'normal') === 'normal');
                  const agrupadosPorData = listaFiltradaPorTipo.reduce((acc, ag) => {
                    const data = ag.data_reuniao || '1970-01-01';
                    if (!acc[data]) acc[data] = [];
                    acc[data].push(ag);
                    return acc;
                  }, {} as Record<string, typeof agendamentosParaAuditarFiltrados>);

                  const datasOrdenadas = Object.keys(agrupadosPorData).sort();

                  return datasOrdenadas.map(data => (
                    <DataAgrupada
                      key={data}
                      data={data}
                      agendamentos={agrupadosPorData[data]}
                      onConfirmar={(agendamento) => {
                        setModalParaAuditarOpen(false);
                        handleAbrirModalConfirmar(agendamento);
                      }}
                      onRemarcar={(ag) => {
                        setModalParaAuditarOpen(false);
                        handleAbrirModalRemarcar(ag);
                      }}
                      onDadosInvalidos={(id) => {
                        handleEnviarReagendamento(id, "Dados inválidos");
                      }}
                    />
                  ));
                })()}

                {agendamentosParaAuditarFiltrados.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                    <p className="text-muted-foreground">Nenhum agendamento pendente para auditar.</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={modalNaoAuditadosOpen} onOpenChange={setModalNaoAuditadosOpen}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Não Auditados {tipoAgendamentoAtivo === 'trafego_pago' ? '(Tráfego Pago)' : tipoAgendamentoAtivo === '99food' ? '(99Food)' : '(Normal)'}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome da loja, dono ou telefone..."
                      value={filtroNaoAuditados}
                      onChange={(e) => setFiltroNaoAuditados(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Select value={filtroAgender} onValueChange={setFiltroAgender}>
                    <SelectTrigger className="w-full sm:w-[250px]">
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

              <div className="space-y-4">
                {(() => {
                  let listaFiltradaPorTipo = agendamentosPassadosFiltrados.filter(a => tipoAgendamentoAtivo === 'trafego_pago' ? a.tipo_agendamento === 'trafego_pago' : tipoAgendamentoAtivo === '99food' ? a.tipo_agendamento === '99food' : (a.tipo_agendamento || 'normal') === 'normal');

                  if (filtroNaoAuditados.trim()) {
                    const termo = filtroNaoAuditados.toLowerCase();
                    listaFiltradaPorTipo = listaFiltradaPorTipo.filter(a =>
                      (a.nome_loja || '').toLowerCase().includes(termo) ||
                      (a.nome_dono || '').toLowerCase().includes(termo) ||
                      (a.telefone || '').toLowerCase().includes(termo)
                    );
                  }

                  const agrupadosPorData = listaFiltradaPorTipo.reduce((acc, ag) => {
                    const data = ag.data_reuniao || '1970-01-01';
                    if (!acc[data]) acc[data] = [];
                    acc[data].push(ag);
                    return acc;
                  }, {} as Record<string, typeof agendamentosPassadosFiltrados>);

                  const datasOrdenadas = Object.keys(agrupadosPorData).sort();

                  return datasOrdenadas.map(data => (
                    <DataAgrupadaNaoAuditados
                      key={data}
                      data={data}
                      agendamentos={agrupadosPorData[data]}
                      onConfirmar={(agendamento) => {
                        setModalNaoAuditadosOpen(false);
                        handleAbrirModalConfirmar(agendamento);
                      }}
                      onRemarcar={(ag) => {
                        setModalNaoAuditadosOpen(false);
                        handleAbrirModalRemarcar(ag);
                      }}
                      onSemResposta={(id) => handleMarcarStatus(id, "sem_resposta", "Sem resposta do cliente")}
                    />
                  ));
                })()}

                {agendamentosPassadosFiltrados.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                    <p className="text-muted-foreground">Todos os agendamentos foram auditados!</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <TabsContent value="auditados" className="space-y-6">
            <h2 className="text-xl font-semibold">Auditorias Realizadas Hoje</h2>

            <div className="grid gap-4">
              {auditoriasHoje?.map((auditoria) => (
                <Card key={auditoria.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{auditoria.agendamento?.nome_loja}</h3>
                          <Badge variant={auditoria.reuniao_aconteceu ? "default" : "secondary"}>
                            {auditoria.reuniao_aconteceu ? "Confirmada" : "Não realizada"}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Auditor: {auditoria.auditor?.nome}</span>
                          </div>
                          {auditoria.closer && (
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              <span>Closer: {auditoria.closer.nome}</span>
                            </div>
                          )}
                          {auditoria.reagendou_para && (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-4 w-4" />
                              <span>Reagendado para: {formatDateBR(auditoria.reagendou_para)}</span>
                            </div>
                          )}
                          {auditoria.observacoes && (
                            <div className="flex items-start gap-2 mt-2">
                              <FileText className="h-4 w-4 mt-0.5" />
                              <span className="italic">{auditoria.observacoes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {formatTimeBR(auditoria.created_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!auditoriasHoje || auditoriasHoje.length === 0) && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma auditoria hoje</h3>
                    <p className="text-muted-foreground">Ainda não foram realizadas auditorias hoje.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ferramentas" className="space-y-6">
            <h2 className="text-xl font-semibold">Ferramentas de Auditoria</h2>

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
                    {searchResults.map((resultado, index) => (
                      <Card key={index} className={resultado.tipo === 'cliente_ativo' ? 'border-destructive' : 'border-muted'}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {resultado.nome || resultado.nome_loja}
                                </h4>
                                <Badge variant={resultado.tipo === 'cliente_ativo' ? 'destructive' : 'secondary'}>
                                  {resultado.tipo === 'cliente_ativo' ? '⚠️ Cliente Ativo' : '📋 Histórico'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                <strong>Proprietário:</strong> {resultado.nome_dono}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Telefone:</strong> {resultado.telefone_comercial || resultado.telefone_pessoal || resultado.telefone}
                              </p>
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
                            {resultado.tipo === 'cliente_ativo' && (
                              <AlertTriangle className="h-6 w-6 text-destructive" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Relatório de Performance</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Analise a performance dos agendadores e taxa de confirmação
                  </p>
                  <Button variant="outline" className="w-full">
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 text-info" />
                  <h3 className="font-semibold mb-2">Reagendamentos em Massa</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Reagende múltiplas reuniões que não aconteceram
                  </p>
                  <Button variant="outline" className="w-full">
                    Reagendar
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-warning" />
                  <h3 className="font-semibold mb-2">Alertas de Qualidade</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure alertas para dados inválidos e padrões suspeitos
                  </p>
                  <Button variant="outline" className="w-full">
                    Configurar
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas Detalhadas */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Detalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-destructive">{dadosInvalidos}</p>
                    <p className="text-sm text-muted-foreground">Dados Inválidos</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-warning">{reagendamentos}</p>
                    <p className="text-sm text-muted-foreground">Reagendamentos</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {agendamentosAuditados.length > 0 ?
                        ((agendamentosAuditados.length - dadosInvalidos) / agendamentosAuditados.length * 100).toFixed(1)
                        : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Qualidade dos Dados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal para Link do Google Meet */}
        <Dialog open={modalLinkMeetOpen} onOpenChange={(open) => {
          if (!open) {
            setEditandoModalConfirmar(false);
            setDadosEditadosConfirmar({});
          }
          setModalLinkMeetOpen(open);
        }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirmar Reunião</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Dados da Loja para Auditoria */}
              {agendamentoParaConfirmar && (
                <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    {editandoModalConfirmar ? (
                      <>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={dadosEditadosConfirmar.nome_loja || ''}
                            onChange={(e) => setDadosEditadosConfirmar(prev => ({ ...prev, nome_loja: e.target.value }))}
                            placeholder="Nome da loja"
                            className="font-bold"
                          />
                          <Input
                            value={dadosEditadosConfirmar.nome_dono || ''}
                            onChange={(e) => setDadosEditadosConfirmar(prev => ({ ...prev, nome_dono: e.target.value }))}
                            placeholder="Nome do proprietário"
                            className="text-sm"
                          />
                        </div>
                        <Input
                          value={dadosEditadosConfirmar.nicho || ''}
                          onChange={(e) => setDadosEditadosConfirmar(prev => ({ ...prev, nicho: e.target.value }))}
                          placeholder="Nicho"
                          className="w-32"
                        />
                      </>
                    ) : (
                      <>
                        <div>
                          <h3 className="font-bold text-lg">{agendamentoParaConfirmar.nome_loja}</h3>
                          <p className="text-sm text-muted-foreground">
                            Proprietário: {agendamentoParaConfirmar.nome_dono}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{agendamentoParaConfirmar.nicho}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleIniciarEdicaoConfirmar}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {editandoModalConfirmar ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            value={dadosEditadosConfirmar.telefone || ''}
                            onChange={(e) => setDadosEditadosConfirmar(prev => ({ ...prev, telefone: e.target.value }))}
                            placeholder="Telefone"
                            className="flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          <Input
                            value={dadosEditadosConfirmar.link_ifood || ''}
                            onChange={(e) => setDadosEditadosConfirmar(prev => ({ ...prev, link_ifood: e.target.value }))}
                            placeholder="Link iFood"
                            className="flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <Input
                            value={dadosEditadosConfirmar.link_google || ''}
                            onChange={(e) => setDadosEditadosConfirmar(prev => ({ ...prev, link_google: e.target.value }))}
                            placeholder="Link Google Maps"
                            className="flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            value={dadosEditadosConfirmar.cnpj || ''}
                            onChange={(e) => setDadosEditadosConfirmar(prev => ({ ...prev, cnpj: e.target.value }))}
                            placeholder="CNPJ"
                            className="flex-1"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditandoModalConfirmar(false);
                              setDadosEditadosConfirmar({});
                            }}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSalvarEdicaoConfirmar}
                            disabled={salvandoEdicao}
                            className="flex-1"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {salvandoEdicao ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`https://wa.me/55${agendamentoParaConfirmar.telefone?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {agendamentoParaConfirmar.telefone}
                          </a>
                        </div>

                        {agendamentoParaConfirmar.link_ifood && (
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-orange-500" />
                            <a
                              href={agendamentoParaConfirmar.link_ifood}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate max-w-[280px]"
                            >
                              Link iFood
                            </a>
                          </div>
                        )}

                        {agendamentoParaConfirmar.link_google && (
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-blue-500" />
                            <a
                              href={agendamentoParaConfirmar.link_google}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate max-w-[280px]"
                            >
                              Link Google Maps
                            </a>
                          </div>
                        )}

                        {agendamentoParaConfirmar.cnpj && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>CNPJ: {agendamentoParaConfirmar.cnpj}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDateBR(agendamentoParaConfirmar.data_reuniao)} às {agendamentoParaConfirmar.horario_reuniao?.slice(0, 5)}
                          </span>
                        </div>

                        {agendamentoParaConfirmar.agender?.nome && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Agender: {agendamentoParaConfirmar.agender.nome}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Seção de Reagendamento */}
              {reagendandoModalConfirmar ? (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-warning">
                    <RefreshCw className="h-4 w-4" />
                    Reagendar Reunião
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="motivo_reagendamento">Motivo do Reagendamento</Label>
                      <Textarea
                        id="motivo_reagendamento"
                        value={motivoReagendamentoConfirmar}
                        onChange={(e) => setMotivoReagendamentoConfirmar(e.target.value)}
                        placeholder="Ex: Cliente não pode participar no horário agendado..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="nova_data">Nova Data *</Label>
                        <Input
                          id="nova_data"
                          type="date"
                          value={novaDataConfirmar}
                          onChange={(e) => setNovaDataConfirmar(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="novo_horario">Novo Horário *</Label>
                        <Input
                          id="novo_horario"
                          type="time"
                          value={novoHorarioConfirmar}
                          onChange={(e) => setNovoHorarioConfirmar(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReagendandoModalConfirmar(false);
                        setNovaDataConfirmar("");
                        setNovoHorarioConfirmar("");
                        setMotivoReagendamentoConfirmar("");
                      }}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSalvarReagendamentoConfirmar}
                      disabled={salvandoReagendamento || !novaDataConfirmar || !novoHorarioConfirmar}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {salvandoReagendamento ? 'Salvando...' : 'Confirmar Reagendamento'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="link_meet">Link do Google Meet *</Label>
                    <Input
                      id="link_meet"
                      type="url"
                      value={linkMeet}
                      onChange={(e) => setLinkMeet(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (linkMeet.trim()) {
                            handleConfirmarComLink();
                          }
                        }
                      }}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Insira o link da reunião para o supervisor alocar o closer
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReagendandoModalConfirmar(true)}
                      disabled={editandoModalConfirmar}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reagendar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setModalLinkMeetOpen(false);
                        setLinkMeet("");
                        setAgendamentoParaConfirmar(null);
                        setEditandoModalConfirmar(false);
                        setDadosEditadosConfirmar({});
                        setReagendandoModalConfirmar(false);
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleConfirmarComLink}
                      className="flex-1"
                      disabled={editandoModalConfirmar}
                    >
                      Confirmar Reunião
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Remarcar Agendamento - Com Conferência Obrigatória */}
        <Dialog open={modalRemarcarOpen} onOpenChange={(open) => {
          if (!open) {
            setConferenciaRemarcar({
              nomeLoja: false,
              contato: false,
              dataHorario: false,
              observacoes: false
            });
            setAgendamentoParaRemarcar(null);
            setDataReagendamento("");
            setHorarioReagendamento("");
            setMotivoReagendamento("");
          }
          setModalRemarcarOpen(open);
        }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Remarcar Agendamento
              </DialogTitle>
            </DialogHeader>

            {agendamentoParaRemarcar ? (
              <div className="space-y-4">
                {/* Informações Atuais da Reunião */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold text-lg">{agendamentoParaRemarcar.nome_loja}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Data atual: {formatDateBR(agendamentoParaRemarcar.data_reuniao)} às {agendamentoParaRemarcar.horario_reuniao}
                  </p>
                </div>

                {/* Seção de Conferência Obrigatória */}
                <div className="border border-warning/50 bg-warning/5 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    Conferência Obrigatória - Verifique antes de remarcar
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Marque cada item após confirmar que as informações estão corretas:
                  </p>

                  {/* Checkbox: Nome da Loja */}
                  <div className="flex items-start gap-3 p-3 bg-background border rounded-lg">
                    <Checkbox
                      id="conf-nome-loja"
                      checked={conferenciaRemarcar.nomeLoja}
                      onCheckedChange={(checked) => setConferenciaRemarcar(prev => ({
                        ...prev,
                        nomeLoja: checked === true
                      }))}
                    />
                    <div className="flex-1">
                      <Label htmlFor="conf-nome-loja" className="text-sm font-medium cursor-pointer">
                        ✓ Nome da Loja está correto
                      </Label>
                      <p className="text-sm text-foreground font-semibold mt-1">
                        {agendamentoParaRemarcar.nome_loja}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Proprietário: {agendamentoParaRemarcar.nome_dono}
                      </p>
                    </div>
                  </div>

                  {/* Checkbox: Contato */}
                  <div className="flex items-start gap-3 p-3 bg-background border rounded-lg">
                    <Checkbox
                      id="conf-contato"
                      checked={conferenciaRemarcar.contato}
                      onCheckedChange={(checked) => setConferenciaRemarcar(prev => ({
                        ...prev,
                        contato: checked === true
                      }))}
                    />
                    <div className="flex-1">
                      <Label htmlFor="conf-contato" className="text-sm font-medium cursor-pointer">
                        ✓ Contato está correto
                      </Label>
                      <p className="text-sm text-foreground font-semibold mt-1 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {agendamentoParaRemarcar.telefone}
                      </p>
                    </div>
                  </div>

                  {/* Checkbox: Data e Horário */}
                  <div className="flex items-start gap-3 p-3 bg-background border rounded-lg">
                    <Checkbox
                      id="conf-data-horario"
                      checked={conferenciaRemarcar.dataHorario}
                      onCheckedChange={(checked) => setConferenciaRemarcar(prev => ({
                        ...prev,
                        dataHorario: checked === true
                      }))}
                    />
                    <div className="flex-1">
                      <Label htmlFor="conf-data-horario" className="text-sm font-medium cursor-pointer">
                        ✓ Data e Horário atuais conferidos
                      </Label>
                      <p className="text-sm text-foreground font-semibold mt-1 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDateBR(agendamentoParaRemarcar.data_reuniao)}
                        <Clock className="h-3 w-3 ml-2" />
                        {agendamentoParaRemarcar.horario_reuniao}
                      </p>
                    </div>
                  </div>

                  {/* Indicador de progresso */}
                  <div className="flex items-center gap-2 text-sm pt-2">
                    {todasConferenciasFeitas() ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Conferência completa - Pode prosseguir
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Marque todos os itens acima para continuar
                      </span>
                    )}
                  </div>
                </div>

                {/* Novos dados de reagendamento - só habilita após conferência */}
                <div className={`border-t pt-4 space-y-3 ${!todasConferenciasFeitas() ? 'opacity-50' : ''}`}>
                  <h4 className="font-semibold text-sm">Nova Data e Horário</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="data_reagendamento">Nova Data *</Label>
                      <Input
                        id="data_reagendamento"
                        type="date"
                        value={dataReagendamento}
                        onChange={(e) => setDataReagendamento(e.target.value)}
                        className="mt-1"
                        disabled={!todasConferenciasFeitas()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="horario_reagendamento">Novo Horário *</Label>
                      <Input
                        id="horario_reagendamento"
                        type="time"
                        value={horarioReagendamento}
                        onChange={(e) => setHorarioReagendamento(e.target.value)}
                        className="mt-1"
                        disabled={!todasConferenciasFeitas()}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="motivo_reagendamento">Motivo do Reagendamento</Label>
                    <Textarea
                      id="motivo_reagendamento"
                      value={motivoReagendamento}
                      onChange={(e) => setMotivoReagendamento(e.target.value)}
                      placeholder="Por que está sendo remarcado?"
                      rows={2}
                      className="mt-1"
                      disabled={!todasConferenciasFeitas()}
                    />
                  </div>
                </div>

                {/* Aviso sobre o fluxo */}
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg text-sm">
                  <p className="text-blue-700 dark:text-blue-300">
                    <strong>Após remarcar:</strong> A reunião será encaminhada para a <strong>Supervisão de Auditoria (Letícia)</strong>,
                    onde será definido o closer responsável.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setModalRemarcarOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRemarcarAgendamento}
                    className="flex-1"
                    disabled={!todasConferenciasFeitas() || !dataReagendamento || !horarioReagendamento}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Remarcar e Encaminhar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Carregando informações do agendamento...
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <DiagnosticoAgendamentoModal
        open={showDiagnosticoModal}
        onOpenChange={setShowDiagnosticoModal}
      />
    </div>
  );
}