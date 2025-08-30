import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileText, 
  Share2, 
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  exportToPDF, 
  exportToCSV, 
  exportToJSON, 
  generateShareableLink,
  copyToClipboard,
  type ExportOptions 
} from '@/lib/export-utils';
import { type MatchData, type TeamStatistics } from '@/lib/export-utils';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  data: MatchData[];
  statistics: TeamStatistics | null;
  homeTeam: string;
  awayTeam: string;
  className?: string;
  disabled?: boolean;
}

type ExportFormat = 'pdf' | 'csv' | 'json';

interface ExportState {
  isExporting: boolean;
  format: ExportFormat;
  includeMetadata: boolean;
  includeCharts: boolean;
  title: string;
  author: string;
  shareableLink: string;
  showShareableLink: boolean;
}

export function ExportDialog({
  data,
  statistics,
  homeTeam,
  awayTeam,
  className,
  disabled = false,
}: ExportDialogProps) {
  const { toast } = useToast();
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    format: 'pdf',
    includeMetadata: true,
    includeCharts: true,
    title: `${homeTeam} vs ${awayTeam} - Statistics Report`,
    author: '',
    shareableLink: '',
    showShareableLink: false,
  });

  const updateState = (updates: Partial<ExportState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleExport = async () => {
    if (data.length === 0 && !statistics) {
      toast({
        title: 'No Data to Export',
        description: 'Please search for match data before exporting.',
        variant: 'destructive',
      });
      return;
    }

    updateState({ isExporting: true });

    try {
      const options: ExportOptions = {
        format: state.format,
        includeMetadata: state.includeMetadata,
        includeCharts: state.includeCharts,
        title: state.title || `${homeTeam} vs ${awayTeam} - Statistics Report`,
        author: state.author || 'Football Stats User',
      };

      switch (state.format) {
        case 'pdf':
          await exportToPDF(data, statistics, options);
          break;
        case 'csv':
          exportToCSV(data, statistics, options);
          break;
        case 'json':
          exportToJSON(data, statistics, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${state.format}`);
      }

      toast({
        title: 'Export Successful',
        description: `Your ${state.format.toUpperCase()} file has been downloaded.`,
        duration: 3000,
      });

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      updateState({ isExporting: false });
    }
  };

  const handleGenerateShareableLink = () => {
    try {
      const link = generateShareableLink(homeTeam, awayTeam, {
        format: state.format,
        includeMetadata: state.includeMetadata,
        includeCharts: state.includeCharts,
      });
      
      updateState({ 
        shareableLink: link, 
        showShareableLink: true 
      });

      toast({
        title: 'Shareable Link Generated',
        description: 'You can now copy and share this link with others.',
      });
    } catch (error) {
      toast({
        title: 'Failed to Generate Link',
        description: 'Unable to generate shareable link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(state.shareableLink);
      toast({
        title: 'Link Copied',
        description: 'Shareable link has been copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Unable to copy link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const getFormatDescription = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return 'Professional report with tables and statistics';
      case 'csv':
        return 'Spreadsheet-compatible data format';
      case 'json':
        return 'Raw data in JSON format for developers';
      default:
        return '';
    }
  };

  const hasData = data.length > 0 || statistics !== null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn('gap-2', className)}
          disabled={disabled}
          aria-label="Open export options"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Export your match statistics and data in various formats, or generate a shareable link.
          </DialogDescription>
        </DialogHeader>

        {!hasData && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              No data available to export. Please search for match data first.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={state.format}
              onValueChange={(value: ExportFormat) => updateState({ format: value })}
            >
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center justify-between w-full">
                    <span>PDF Report</span>
                    <Badge variant="secondary" className="ml-2">Recommended</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getFormatDescription(state.format)}
            </p>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <Label>Export Options</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="include-metadata" className="text-sm font-normal">
                  Include Metadata
                </Label>
                <p className="text-xs text-muted-foreground">
                  Add generation date, author, and data source information
                </p>
              </div>
              <Switch
                id="include-metadata"
                checked={state.includeMetadata}
                onCheckedChange={(checked) => updateState({ includeMetadata: checked })}
              />
            </div>

            {state.format === 'pdf' && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="include-charts" className="text-sm font-normal">
                    Include Charts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Add visual charts and graphs to the PDF report
                  </p>
                </div>
                <Switch
                  id="include-charts"
                  checked={state.includeCharts}
                  onCheckedChange={(checked) => updateState({ includeCharts: checked })}
                />
              </div>
            )}
          </div>

          {/* Metadata */}
          {state.includeMetadata && (
            <div className="space-y-4">
              <Separator />
              <Label>Report Metadata</Label>
              
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm">
                  Report Title
                </Label>
                <Input
                  id="title"
                  value={state.title}
                  onChange={(e) => updateState({ title: e.target.value })}
                  placeholder="Enter report title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="text-sm">
                  Author (Optional)
                </Label>
                <Input
                  id="author"
                  value={state.author}
                  onChange={(e) => updateState({ author: e.target.value })}
                  placeholder="Enter author name"
                />
              </div>
            </div>
          )}

          {/* Shareable Link */}
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <Label>Shareable Link</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateShareableLink}
                className="gap-2"
              >
                <Share2 className="h-3 w-3" />
                Generate Link
              </Button>
            </div>

            {state.showShareableLink && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={state.shareableLink}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link to let others view the same search results
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => updateState({ showShareableLink: false })}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={state.isExporting || !hasData}
            className="gap-2"
          >
            {state.isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {state.format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}