import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { Mail, Search, Eye, Filter, TrendingUp, Clock, CheckCircle, XCircle, Play, RefreshCw } from 'lucide-react';
import DOMPurify from 'dompurify';

interface EmailLog {
  id: string;
  emailType: string;
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
  sentAt: string;
  createdAt: string;
}

interface EmailStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

const EMAIL_TYPES = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'pending_reminder', label: 'Recordatorio', color: 'bg-orange-100 text-orange-800' },
  { value: 'paid', label: 'Pagado', color: 'bg-green-100 text-green-800' },
  { value: 'delivered', label: 'Entregado', color: 'bg-blue-100 text-blue-800' },
  { value: 'picked_up', label: 'Retirado', color: 'bg-purple-100 text-purple-800' },
  { value: 'on_route', label: 'En Ruta', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'completed', label: 'Finalizado', color: 'bg-gray-100 text-gray-800' }
];

export default function EmailsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedPreviewType, setSelectedPreviewType] = useState('pending');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<{subject: string; htmlContent: string} | null>(null);

  // Fetch email logs
  const { data: emailLogsData, isLoading: emailLogsLoading } = useQuery({
    queryKey: ['/api/admin/email-logs'],
    enabled: true
  });

  // Fetch email statistics
  const { data: emailStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/email-stats'],
    enabled: true
  });

  // Fetch available email types
  const { data: emailTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['/api/admin/email-types'],
    enabled: true
  });

  // Fetch email preview (only when needed)
  const { data: previewResponse, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: [`/api/admin/email-preview/${selectedPreviewType}`],
    enabled: false // Only fetch when explicitly requested
  });

  const emailLogs: EmailLog[] = (emailLogsData as any)?.logs || [];
  const stats: EmailStats = (emailStats as any) || {
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    byType: {},
    byStatus: {}
  };

  // Filter emails based on search and filters
  const filteredEmails = emailLogs.filter(email => {
    const matchesSearch = !searchQuery || 
      email.toEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || email.emailType === typeFilter;
    const matchesStatus = statusFilter === 'all' || email.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getEmailTypeInfo = (type: string) => {
    return EMAIL_TYPES.find(t => t.value === type) || { 
      value: type, 
      label: type, 
      color: 'bg-gray-100 text-gray-800' 
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewEmailContent = (email: EmailLog) => {
    setSelectedEmail(email);
    setShowEmailDialog(true);
  };

  const handlePreviewEmail = async () => {
    try {
      const result = await refetchPreview();
      if (result.data) {
        const data = result.data as any;
        setPreviewData({
          subject: data.subject,
          htmlContent: data.htmlContent
        });
        setShowPreviewDialog(true);
      }
    } catch (error) {
      console.error('Error loading preview:', error);
    }
  };

  const getTypeColor = (color: string) => {
    const colors: Record<string, string> = {
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800'
    };
    return colors[color] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Emails</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          <span>Sistema de correos automáticos</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Todos los emails</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Enviados hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exitosos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.byStatus.sent || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.byStatus.failed || 0} fallidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Vista Previa de Templates
          </CardTitle>
          <CardDescription>
            Previsualiza cómo se ven los emails antes de ser enviados a los clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="preview-type">Tipo de Email</Label>
              <Select value={selectedPreviewType} onValueChange={setSelectedPreviewType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {(emailTypes as any)?.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  )) || [
                    <SelectItem key="pendiente" value="pendiente">📋 Pendiente</SelectItem>,
                    <SelectItem key="pending_reminder" value="pending_reminder">⏰ Recordatorio</SelectItem>,
                    <SelectItem key="pagado" value="pagado">✅ Pagado</SelectItem>,
                    <SelectItem key="en_ruta" value="en_ruta">🚚 En Ruta</SelectItem>,
                    <SelectItem key="entregada" value="entregada">📦 Entregada</SelectItem>,
                    <SelectItem key="retirada" value="retirada">✅ Retirada</SelectItem>,
                    <SelectItem key="finalizada" value="finalizada">🎉 Finalizada</SelectItem>
                  ]}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handlePreviewEmail}
              disabled={previewLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {previewLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Ver Vista Previa
            </Button>
          </div>
          
          {emailTypes && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(emailTypes as any).map((type: any) => (
                <div 
                  key={type.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPreviewType === type.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPreviewType(type.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{type.icon}</span>
                    <Badge className={getTypeColor(type.color)}>
                      {type.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por email, nombre o asunto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="type">Tipo de Email</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {EMAIL_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="failed">Fallidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emails Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Emails ({filteredEmails.length})</CardTitle>
          <CardDescription>Lista de todos los correos enviados por el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {emailLogsLoading ? (
            <div className="text-center py-8">Cargando emails...</div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' 
                ? "No se encontraron emails con los filtros aplicados" 
                : "No hay emails registrados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destinatario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asunto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmails.map((email) => {
                    const typeInfo = getEmailTypeInfo(email.emailType);
                    
                    return (
                      <tr key={email.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {email.toName || email.toEmail}
                            </div>
                            {email.toName && (
                              <div className="text-sm text-gray-500">{email.toEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={typeInfo.color}>
                            {typeInfo.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {email.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {email.status === 'sent' ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">Enviado</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-red-600">
                                <XCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">Fallido</span>
                              </div>
                            )}
                          </div>
                          {email.errorMessage && (
                            <div className="text-xs text-red-500 mt-1 max-w-xs truncate">
                              {email.errorMessage}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(email.sentAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewEmailContent(email)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Content Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contenido del Email</DialogTitle>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-4">
              {/* Email Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="font-semibold">Para:</Label>
                  <p className="text-sm">{selectedEmail.toName ? `${selectedEmail.toName} (${selectedEmail.toEmail})` : selectedEmail.toEmail}</p>
                </div>
                <div>
                  <Label className="font-semibold">Tipo:</Label>
                  <Badge className={getEmailTypeInfo(selectedEmail.emailType).color + " ml-2"}>
                    {getEmailTypeInfo(selectedEmail.emailType).label}
                  </Badge>
                </div>
                <div>
                  <Label className="font-semibold">Asunto:</Label>
                  <p className="text-sm">{selectedEmail.subject}</p>
                </div>
                <div>
                  <Label className="font-semibold">Fecha:</Label>
                  <p className="text-sm">{formatDate(selectedEmail.sentAt)}</p>
                </div>
                <div>
                  <Label className="font-semibold">Estado:</Label>
                  <div className="flex items-center mt-1">
                    {selectedEmail.status === 'sent' ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Enviado exitosamente</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Error al enviar</span>
                      </div>
                    )}
                  </div>
                  {selectedEmail.errorMessage && (
                    <p className="text-xs text-red-500 mt-1">{selectedEmail.errorMessage}</p>
                  )}
                </div>
              </div>

              {/* Email HTML Content */}
              <div>
                <Label className="font-semibold">Contenido HTML:</Label>
                <div 
                  className="mt-2 border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.htmlContent) }}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa del Template</DialogTitle>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-4">
              {/* Preview Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <Label className="font-semibold text-blue-800">Previsualización con datos de ejemplo</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Tipo:</Label>
                    <Badge className="ml-2">
                      {(emailTypes as any)?.find((t: any) => t.id === selectedPreviewType)?.icon} {(emailTypes as any)?.find((t: any) => t.id === selectedPreviewType)?.label}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-semibold">Cliente ejemplo:</Label>
                    <span className="text-sm ml-2">María González</span>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <Label className="font-semibold">Asunto:</Label>
                    <p className="text-sm font-mono bg-white p-2 rounded border mt-1">{previewData.subject}</p>
                  </div>
                </div>
              </div>

              {/* Preview HTML Content */}
              <div>
                <Label className="font-semibold">Contenido del Email:</Label>
                <div 
                  className="mt-2 border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewData.htmlContent) }}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}