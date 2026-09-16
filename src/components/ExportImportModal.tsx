import React, { useState } from 'react';
import { MatchData } from '../types';
import { Download, FileCode, Check, X, Copy } from 'lucide-react';

interface ExportImportModalProps {
  match: MatchData;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * DVW Exporter V2 - Organizado con estructura Data Volley
 * Genera el archivo DVW a partir exclusivamente de datos reales de currentMatch.
 */
export function generateDVWV2(currentMatch: MatchData): string {
  if (!currentMatch) return '';

  const lines: string[] = [];

  // [3MATCH]
  lines.push('[3MATCH]');
  lines.push(`Date;${currentMatch.date || ''}`);
  lines.push(`Competition;${currentMatch.competition || ''}`);
  lines.push(`Title;${currentMatch.title || ''}`);
  lines.push(`Category;${currentMatch.category || ''}`);
  lines.push(`Venue;${currentMatch.venue || ''}`);
  lines.push(`CurrentSet;${currentMatch.currentSet || 1}`);
  if (currentMatch.winner) {
    lines.push(`Winner;${currentMatch.winner}`);
  }
  // Sets y marcador
  const setsData = (currentMatch.sets || [])
    .map((s) => `${s.setNumber};${s.scoreHome};${s.scoreAway};${s.winner || ''}`)
    .join('|');
  lines.push(`Sets;${setsData}`);
  // Rotaciones
  lines.push(`RotationHome;${(currentMatch.homeRotation || []).join(';')}`);
  lines.push(`RotationAway;${(currentMatch.awayRotation || []).join(';')}`);
  if (currentMatch.server) {
    lines.push(`Server;${currentMatch.server.team};${currentMatch.server.playerNum}`);
  }

  // [3TEAMS]
  lines.push('[3TEAMS]');
  lines.push(`HOME;${currentMatch.homeTeamName || ''}`);
  lines.push(`AWAY;${currentMatch.awayTeamName || ''}`);

  // [3PLAYERS-H]
  lines.push('[3PLAYERS-H]');
  (currentMatch.homePlayers || []).forEach((p) => {
    lines.push(`${p.number};${p.name};${p.position};${p.starter ? '1' : '0'}`);
  });

  // [3PLAYERS-V]
  lines.push('[3PLAYERS-V]');
  (currentMatch.awayPlayers || []).forEach((p) => {
    lines.push(`${p.number};${p.name};${p.position};${p.starter ? '1' : '0'}`);
  });

  // [3SCOUT]
  lines.push('[3SCOUT]');
  (currentMatch.actions || []).forEach((a) => {
    const rotH = (a.rotationHome || []).join('');
    const rotA = (a.rotationAway || []).join('');
    lines.push(`${a.rawCode};${a.setNumber};${a.scoreHome};${a.scoreAway};${rotH};${rotA};${a.timestamp}`);
  });

  return lines.join('\n') + '\n';
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ match, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate .dvw header and action lines
  const generateDVWContent = () => {
    let dvw = `[301HEADER]\n`;
    dvw += `1;${match.date};;${match.homeTeamName};${match.awayTeamName};;;\n`;
    dvw += `[302TEAMS]\n`;
    dvw += `HOME;${match.homeTeamName}\n`;
    dvw += `AWAY;${match.awayTeamName}\n`;
    dvw += `[303PLAYERS-HOME]\n`;
    match.homePlayers.forEach((p) => {
      dvw += `${p.number};${p.name};${p.position}\n`;
    });
    dvw += `[303PLAYERS-AWAY]\n`;
    match.awayPlayers.forEach((p) => {
      dvw += `${p.number};${p.name};${p.position}\n`;
    });
    dvw += `[304SCOUT-SCORES]\n`;
    match.actions.forEach((a) => {
      dvw += `${a.rawCode};${a.setNumber};${a.scoreHome};${a.scoreAway};${a.timestamp}\n`;
    });
    return dvw;
  };

  const dvwText = generateDVWContent();

  const handleCopyDVW = () => {
    navigator.clipboard.writeText(dvwText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDVW = () => {
    const blob = new Blob([dvwText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${match.homeTeamName}_vs_${match.awayTeamName}.dvw`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 text-white space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg border-b border-slate-800 pb-3">
          <FileCode className="w-6 h-6" /> Exportación de Partido a Formato Estándar (.DVW)
        </div>

        <p className="text-xs text-slate-300">
          Este código es compatible con visores y softwares federativos oficiales (.dvw). Puedes copiarlo o descargarlo.
        </p>

        {/* DVW Code Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 max-h-64 overflow-y-auto whitespace-pre">
          {dvwText}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleCopyDVW}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar Texto'}
          </button>

          <button
            onClick={handleDownloadDVW}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-lg"
          >
            <Download className="w-4 h-4" /> Descargar Archivo .DVW
          </button>
        </div>
      </div>
    </div>
  );
};
