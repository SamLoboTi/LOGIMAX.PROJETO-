import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  AlertCircle,
  Store,
  Clock,
  RotateCcw,
  MessageSquareWarning,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  buscarChecklistCompleto,
  buscarProgressoEstrategia,
  marcarItemConcluido,
  enviarParaSupervisor,
  getStatusLabel,
  getStatusColor,
  SecaoChecklist,
  ProgressoItem,
  EstrategiaInicialGoogle
} from '@/services/estrategiaInicialGoogleService';

interface EstrategiaInicialGoogleChecklistProps {
  estrategia: EstrategiaInicialGoogle;
  onUpdate?: () => void;
}

export function EstrategiaInicialGoogleChecklist({
  estrategia,
  onUpdate
}: EstrategiaInicialGoogleChecklistProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cardMinimizado, setCardMinimizado] = useState(estrategia.status !== 'em_revisao');
  const [secoesAbertas, setSecoesAbertas] = useState<Record<string, boolean>>({});
  const [enviandoSupervisor, setEnviandoSupervisor] = useState(false);
  const [dialogEnviar, setDialogEnviar] = useState(false);
  const [observacoesGestor, setObservacoesGestor] = useState(estrategia.observacoes_gestor || '');
  const [justificativaItensNaoMarcados, setJustificativaItensNaoMarcados] = useState(
    estrategia.justificativa_itens_nao_marcados || ''
  );

  // Buscar checklist completo
  const { data: secoes = [] } = useQuery({
    queryKey: ['checklist-google-secoes'],
    queryFn: buscarChecklistCompleto
  });

  // Buscar progresso
  const { data: progresso = [], refetch: refetchProgresso } = useQuery({
    queryKey: ['estrategia-google-progresso', estrategia.id],
    queryFn: () => buscarProgressoEstrategia(estrategia.id)
  });

  // Realtime para progresso
  useEffect(() => {
    const channel = supabase
      .channel(`estrategia-progresso-${estrategia.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'estrategia_inicial_google_progresso',
          filter: `estrategia_id=eq.${estrategia.id}`
        },
        () => {
          refetchProgresso();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [estrategia.id, refetchProgresso]);

  // Iniciar seções abertas
  useEffect(() => {
    const abertas: Record<string, boolean> = {};
    secoes.forEach(secao => {
      abertas[secao.id] = true;
    });
    setSecoesAbertas(abertas);
  }, [secoes]);

  // Calcular progresso geral - separando obrigatórios de opcionais
  const {
    totalItens,
    itensConcluidos,
    percentualConcluido,
    itensObrigatorios,
    itensObrigatoriosConcluidos,
    itensObrigatoriosNaoMarcados,
    itensOpcionaisNaoMarcados,
  } = useMemo(() => {
    const todosItens = secoes.flatMap((s) => s.itens);
    const total = todosItens.length;
    const concluidos = progresso.filter((p) => p.concluido_gestor).length;

    const obrigatorios = todosItens.filter((i) => i.obrigatorio);
    const obrigatoriosConcluidos = obrigatorios.filter(
      (i) => progresso.find((p) => p.item_id === i.id)?.concluido_gestor
    ).length;

    const obrigatoriosNaoMarcados = todosItens.filter(
      (i) => i.obrigatorio && !progresso.find((p) => p.item_id === i.id)?.concluido_gestor
    );

    const opcionaisNaoMarcados = todosItens.filter(
      (i) => !i.obrigatorio && !progresso.find((p) => p.item_id === i.id)?.concluido_gestor
    );

    return {
      totalItens: total,
      itensConcluidos: concluidos,
      percentualConcluido: total > 0 ? (concluidos / total) * 100 : 0,
      itensObrigatorios: obrigatorios.length,
      itensObrigatoriosConcluidos: obrigatoriosConcluidos,
      itensObrigatoriosNaoMarcados: obrigatoriosNaoMarcados,
      itensOpcionaisNaoMarcados: opcionaisNaoMarcados,
    };
  }, [secoes, progresso]);

  const todosObrigatoriosConcluidos = itensObrigatoriosConcluidos === itensObrigatorios && itensObrigatorios > 0;
  const temItensObrigatoriosNaoMarcados = itensObrigatoriosNaoMarcados.length > 0;
  const temItensOpcionaisNaoMarcados = itensOpcionaisNaoMarcados.length > 0;

  // Itens obrigatórios pendentes poderão ser enviados, mas serão sinalizados ao supervisor.
  // Justificativa passa a ser OPCIONAL (não bloqueia envio).
  const precisaJustificativa = false;

  const podeEnviar = estrategia.status === 'em_execucao' || estrategia.status === 'em_revisao';
  const podeEditar = estrategia.status === 'em_execucao' || estrategia.status === 'em_revisao';

  // Marcar/desmarcar item
  const handleMarcarItem = async (itemId: string, concluido: boolean) => {
    if (!user?.id || !podeEditar) return;

    try {
      await marcarItemConcluido(estrategia.id, itemId, concluido, user.id);
      await refetchProgresso();
    } catch (error: any) {
      console.error('Erro ao marcar item:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  // Enviar para supervisor
  const handleEnviarSupervisor = async () => {
    const justificativaManual = justificativaItensNaoMarcados.trim() || null;

    // Se houver itens pendentes, o envio é permitido, mas isso será sinalizado ao supervisor.
    const justificativaAutomaticaObrigatorios = temItensObrigatoriosNaoMarcados
      ? `Itens obrigatórios pendentes (não marcados pelo gestor):\n${itensObrigatoriosNaoMarcados
        .map((i) => `- ${i.titulo}`)
        .join('\n')}`
      : null;

    const justificativaAutomaticaOpcionais = temItensOpcionaisNaoMarcados
      ? `Itens opcionais pendentes (não marcados pelo gestor):\n${itensOpcionaisNaoMarcados
        .map((i) => `- ${i.titulo}`)
        .join('\n')}`
      : null;

    const justificativaFinal = [
      justificativaManual,
      justificativaAutomaticaObrigatorios,
      justificativaAutomaticaOpcionais,
    ]
      .filter(Boolean)
      .join('\n\n') || undefined;

    setEnviandoSupervisor(true);
    try {
      await enviarParaSupervisor(estrategia.id, observacoesGestor, justificativaFinal);

      if (temItensObrigatoriosNaoMarcados || temItensOpcionaisNaoMarcados) {
        toast.success('Enviado com pendências (sinalizado ao supervisor)');
      } else {
        toast.success('Estratégia enviada para validação do supervisor!');
      }

      queryClient.invalidateQueries({ queryKey: ['estrategias-google'] });
      queryClient.invalidateQueries({ queryKey: ['todas-estrategias-google'] });
      queryClient.invalidateQueries({ queryKey: ['minhas-estrategias-google'] });
      queryClient.invalidateQueries({ queryKey: ['estrategias-google-supervisor'] });
      queryClient.invalidateQueries({ queryKey: ['progresso-estrategia'] });
      onUpdate?.();
      setDialogEnviar(false);
    } catch (error: any) {
      console.error('Erro ao enviar:', error);
      toast.error('Erro ao enviar para supervisor');
    } finally {
      setEnviandoSupervisor(false);
    }
  };

  const getItemProgresso = (itemId: string): ProgressoItem | undefined => {
    return progresso.find(p => p.item_id === itemId);
  };

  return (
    <Card className={`border-2 ${estrategia.status === 'em_revisao' ? 'border-amber-400 shadow-md' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle>{estrategia.loja?.nome}</CardTitle>
            </div>
            <CardDescription>
              {estrategia.loja?.codigo} • {estrategia.loja?.cidade}/{estrategia.loja?.estado}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {estrategia.status === 'em_revisao' && (
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-400 font-semibold">
                Devolvida
              </Badge>
            )}
            <Badge className={getStatusColor(estrategia.status)}>
              {getStatusLabel(estrategia.status)}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCardMinimizado(!cardMinimizado)}
              className="h-8 w-8"
              title={cardMinimizado ? 'Expandir' : 'Minimizar'}
            >
              {cardMinimizado ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso do Checklist</span>
            <span className="font-medium">
              {itensConcluidos}/{totalItens} itens ({percentualConcluido.toFixed(0)}%)
            </span>
          </div>
          <Progress value={percentualConcluido} className="h-2" />
        </div>

        {/* Data de início - sempre visível */}
        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Iniciada em {format(new Date(estrategia.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>

        {/* Observação do supervisor visível mesmo minimizado */}
        {cardMinimizado && estrategia.status === 'em_revisao' && estrategia.observacoes_supervisor && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <MessageSquareWarning className="h-4 w-4" />
              <span className="text-sm font-medium">Observação do Supervisor:</span>
            </div>
            <p className="text-sm text-amber-900 whitespace-pre-wrap line-clamp-2">
              {estrategia.observacoes_supervisor}
            </p>
          </div>
        )}
      </CardHeader>

      {/* Conteúdo expandível */}
      {!cardMinimizado && (
        <>
          {/* Banner de devolução - destacado quando em revisão */}
          {estrategia.status === 'em_revisao' && (
            <div className="mx-6 mb-4 p-4 bg-amber-50 border-2 border-amber-400 rounded-lg shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <RotateCcw className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-semibold text-amber-800">
                      Estratégia Devolvida para Revisão
                    </p>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                      Ação Necessária
                    </Badge>
                  </div>
                  {estrategia.observacoes_supervisor ? (
                    <div className="mt-2 p-3 bg-white rounded border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-700 mb-1">
                        <MessageSquareWarning className="h-4 w-4" />
                        <span className="text-sm font-medium">Observação do Supervisor:</span>
                      </div>
                      <p className="text-sm text-amber-900 whitespace-pre-wrap">
                        {estrategia.observacoes_supervisor}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700">
                      O supervisor solicitou revisão desta estratégia. Verifique os itens e encaminhe novamente.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <CardContent className="space-y-4">
            {/* Seções e itens */}
            {secoes.map(secao => (
              <Collapsible
                key={secao.id}
                open={secoesAbertas[secao.id]}
                onOpenChange={(open) => setSecoesAbertas(prev => ({ ...prev, [secao.id]: open }))}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                    <span className="font-medium">{secao.titulo}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {secao.itens.filter(i => getItemProgresso(i.id)?.concluido_gestor).length}/{secao.itens.length}
                      </span>
                      {secoesAbertas[secao.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-2 mt-2">
                  {secao.itens.map(item => {
                    const itemProgresso = getItemProgresso(item.id);
                    const concluido = itemProgresso?.concluido_gestor || false;
                    const devolvido = itemProgresso?.observacao_devolucao;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${concluido ? 'bg-green-50 border-green-200' :
                          devolvido ? 'bg-orange-50 border-orange-200' :
                            'bg-muted/30 border-border'
                          }`}
                      >
                        <Checkbox
                          checked={concluido}
                          onCheckedChange={(checked) => handleMarcarItem(item.id, checked as boolean)}
                          disabled={!podeEditar}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${concluido ? 'line-through text-muted-foreground' : ''}`}>
                              {item.titulo}
                            </p>
                            {!item.obrigatorio && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-muted/50">
                                Opcional
                              </Badge>
                            )}
                          </div>
                          {item.descricao && (
                            <p className="text-xs text-muted-foreground">{item.descricao}</p>
                          )}
                          {devolvido && (
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ {devolvido}
                            </p>
                          )}
                        </div>
                        {concluido && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ))}

            {/* Campo de justificativa (opcional) */}
            {podeEditar && (temItensOpcionaisNaoMarcados || temItensObrigatoriosNaoMarcados) && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-700">
                      Existem itens pendentes no checklist
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se quiser, deixe uma justificativa/observação para contextualizar o supervisor.
                    </p>
                  </div>
                </div>
                <Textarea
                  placeholder="Justificativa/observação (opcional)"
                  value={justificativaItensNaoMarcados}
                  onChange={(e) => setJustificativaItensNaoMarcados(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Botão de enviar para supervisor */}
            {podeEditar && (
              <div className="pt-4 border-t">
                <Button
                  onClick={() => setDialogEnviar(true)}
                  disabled={!podeEnviar}
                  className="w-full"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Encaminhar para Supervisor
                </Button>
                {(temItensObrigatoriosNaoMarcados || temItensOpcionaisNaoMarcados) && (
                  <p className="text-xs text-amber-600 text-center mt-2">
                    Há itens pendentes — você pode encaminhar mesmo assim (será sinalizado ao supervisor).
                  </p>
                )}
              </div>
            )}

            {/* Status concluída */}
            {estrategia.status === 'concluida' && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Estratégia Inicial Concluída</span>
                </div>
                {estrategia.data_conclusao && (
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Concluída em {format(new Date(estrategia.data_conclusao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            )}

            {/* Status aguardando validação */}
            {estrategia.status === 'aguardando_validacao' && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-center gap-2 text-yellow-600">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Aguardando Validação do Supervisor</span>
                </div>
              </div>
            )}
          </CardContent>
        </>
      )}

      {/* Dialog de confirmação */}
      <AlertDialog open={dialogEnviar} onOpenChange={setDialogEnviar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar para Supervisor</AlertDialogTitle>
            <AlertDialogDescription>
              Ao confirmar, a estrategia sera enviada para validacao do supervisor Google.
              O campo de observacoes e obrigatorio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Textarea
              placeholder="Observações para o supervisor (obrigatório)"
              value={observacoesGestor}
              onChange={(e) => setObservacoesGestor(e.target.value)}
              rows={3}
              className={!observacoesGestor.trim() ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {!observacoesGestor.trim() && (
              <p className="text-xs text-destructive">Preencha as observações antes de enviar.</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviandoSupervisor}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEnviarSupervisor}
              disabled={enviandoSupervisor || !observacoesGestor.trim()}
            >
              {enviandoSupervisor && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
