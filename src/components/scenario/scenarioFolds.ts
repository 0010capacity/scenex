import { EditorView } from '@codemirror/view';
import {
  foldGutter,
  foldEffect,
  unfoldEffect,
  codeFolding,
} from '@codemirror/language';

// Custom fold gutter extension for scenario editor
export const scenarioFoldGutter = foldGutter({
  openText: '▼',
  closedText: '▶',
  markerDOM(open) {
    const span = document.createElement('span');
    span.textContent = open ? '▼' : '▶';
    span.style.cssText = `
      font-size: 8px;
      color: var(--text2);
      cursor: pointer;
      padding: 0 2px;
      user-select: none;
      line-height: 1;
    `;
    return span;
  },
});

// Auto-fold ## and ### headings on initialization
export function scenarioFolds() {
  return [
    scenarioFoldGutter,
    foldEffect.of,
    unfoldEffect.of,
    codeFolding(),
    // Auto-fold ## and ### headings on initial load
    EditorView.updateListener.of((update) => {
      if (update.docChanged && update.state.doc.lines > 0) {
        // Check if this is initial load by checking first line
        const firstLine = update.state.doc.line(1).text;
        if (firstLine.startsWith('# ') || firstLine.startsWith('## ') || firstLine.startsWith('### ')) {
          // Auto-fold ## and ### headings on initial load
          const effects: any[] = [];
          for (let i = 1; i <= update.state.doc.lines; i++) {
            const line = update.state.doc.line(i);
            const lineText = line.text;
            if (lineText.startsWith('## ') || lineText.startsWith('### ')) {
              // Find the range to fold (until next heading)
              let endLine = update.state.doc.lines;
              for (let j = i + 1; j <= update.state.doc.lines; j++) {
                const nextLineText = update.state.doc.line(j).text;
                if (
                  nextLineText.startsWith('# ') ||
                  nextLineText.startsWith('## ') ||
                  nextLineText.startsWith('### ')
                ) {
                  endLine = j - 1;
                  break;
                }
              }
              if (endLine > i) {
                const from = line.to + 1;
                const to = update.state.doc.line(endLine).to;
                if (from < to) {
                  effects.push(foldEffect.of({ from, to }));
                }
              }
            }
          }
          if (effects.length > 0) {
            update.view.dispatch(...effects);
          }
        }
      }
    }),
  ];
}
