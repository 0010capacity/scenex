import {
  ViewPlugin,
  Decoration,
  EditorView,
  WidgetType,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// Badge decoration types
export type BadgeType = 'TITLE' | 'ACT' | 'SLUG' | 'SCENE' | 'NOTE';

// Badge configuration - minimalist gray styling
const BADGE_CONFIG: Record<BadgeType, { text: string; bgColor: string; textColor: string; borderColor: string }> = {
  TITLE: { text: 'TITLE', bgColor: 'var(--bg3)', textColor: 'var(--text2)', borderColor: 'var(--border)' },
  ACT: { text: 'ACT', bgColor: 'var(--bg3)', textColor: 'var(--text2)', borderColor: 'var(--border)' },
  SLUG: { text: 'SLUG', bgColor: 'var(--bg3)', textColor: 'var(--text2)', borderColor: 'var(--border)' },
  SCENE: { text: 'SCENE', bgColor: 'var(--bg3)', textColor: 'var(--text2)', borderColor: 'var(--border)' },
  NOTE: { text: 'NOTE', bgColor: 'var(--bg3)', textColor: 'var(--text2)', borderColor: 'var(--border)' },
};

// Detect if a line is a slugline (INT./EXT. pattern after ###)
function isSlugline(text: string): boolean {
  const sluglinePattern = /^(INT|EXT)\.\s*.+\s*[-—]\s*.+$/i;
  return sluglinePattern.test(text.trim());
}

// Info passed when badge is clicked
export interface BadgeClickInfo {
  badgeType: BadgeType;
  lineText: string;
  lineFrom: number;
  lineTo: number;
  lineNumber: number;
}

// Badge widget for inline rendering
class BadgeWidget extends WidgetType {
  constructor(readonly badgeType: BadgeType) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    const config = BADGE_CONFIG[this.badgeType];
    span.textContent = config.text;
    span.className = 'cm-badge';
    span.dataset.badgeType = this.badgeType;
    span.style.cssText = `
      font-family: var(--sans);
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: ${config.textColor};
      background: ${config.bgColor};
      border: 1px solid ${config.borderColor};
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 10px;
      margin-right: 8px;
      cursor: pointer;
      user-select: none;
      display: inline-block;
      line-height: 1.4;
      vertical-align: middle;
    `;
    return span;
  }

  eq(other: BadgeWidget): boolean {
    return other.badgeType === this.badgeType;
  }

  ignoreEvent(): boolean {
    return false; // Allow click events
  }
}

// Create badge extension with optional click callback
export function createScenarioBadgeExtension(onBadgeClick?: (info: BadgeClickInfo) => void) {
  return ViewPlugin.fromClass(
    class {
      decorations: any;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: any) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView): any {
        const builder = new RangeSetBuilder();
        const doc = view.state.doc;

        for (let i = 1; i <= doc.lines; i++) {
          const line = doc.line(i);
          const lineText = line.text;

          // Check for heading markers
          if (lineText.startsWith('# ')) {
            // Title: # heading
            builder.add(
              line.from,
              line.from,
              Decoration.widget({
                widget: new BadgeWidget('TITLE'),
                side: 1,
              })
            );
          } else if (lineText.startsWith('## ')) {
            // Act: ## heading
            builder.add(
              line.from,
              line.from,
              Decoration.widget({
                widget: new BadgeWidget('ACT'),
                side: 1,
              })
            );
          } else if (lineText.startsWith('### ')) {
            // Scene or Slugline
            const contentAfterHeading = lineText.slice(4).trim();
            if (isSlugline(contentAfterHeading)) {
              builder.add(
                line.from,
                line.from,
                Decoration.widget({
                  widget: new BadgeWidget('SLUG'),
                  side: 1,
                })
              );
            } else {
              builder.add(
                line.from,
                line.from,
                Decoration.widget({
                  widget: new BadgeWidget('SCENE'),
                  side: 1,
                })
              );
            }
          } else if (lineText.startsWith('> ')) {
            // Note: > text
            builder.add(
              line.from,
              line.from,
              Decoration.widget({
                widget: new BadgeWidget('NOTE'),
                side: 1,
              })
            );
          }
        }

        return builder.finish();
      }

      // Helper to get badge info at position
      getBadgeAtPos(view: EditorView, pos: number): BadgeClickInfo | null {
        const doc = view.state.doc;
        const line = doc.lineAt(pos);
        const lineText = line.text;

        // Determine badge type based on line content
        let badgeType: BadgeType | null = null;
        if (lineText.startsWith('# ')) {
          badgeType = 'TITLE';
        } else if (lineText.startsWith('## ')) {
          badgeType = 'ACT';
        } else if (lineText.startsWith('### ')) {
          const contentAfterHeading = lineText.slice(4).trim();
          badgeType = isSlugline(contentAfterHeading) ? 'SLUG' : 'SCENE';
        } else if (lineText.startsWith('> ')) {
          badgeType = 'NOTE';
        }

        if (!badgeType) return null;

        return {
          badgeType,
          lineText,
          lineFrom: line.from,
          lineTo: line.to,
          lineNumber: line.number,
        };
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        click: function (this: any, e: MouseEvent, view: EditorView) {
          if (!onBadgeClick) return false;

          const target = e.target as HTMLElement;
          if (!target.classList.contains('cm-badge')) return false;

          const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
          if (pos === null) return false;

          const badgeInfo = this.getBadgeAtPos(view, pos);
          if (badgeInfo) {
            onBadgeClick(badgeInfo);
            return true;
          }
          return false;
        },
      },
    }
  );
}

// Default export for backward compatibility (no click handler)
export const scenarioBadgeExtension = createScenarioBadgeExtension();
