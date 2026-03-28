import {
  ViewPlugin,
  Decoration,
  EditorView,
  WidgetType,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// Badge decoration types
export type BadgeType = 'TITLE' | 'ACT' | 'SLUG' | 'SCENE' | 'NOTE' | 'GENRE' | 'MOOD';

// Badge configuration - elegant styling with distinct colors per type
const BADGE_CONFIG: Record<BadgeType, { text: string; bgColor: string; textColor: string; borderColor: string }> = {
  TITLE: { text: 'TITLE', bgColor: 'color-mix(in srgb, var(--gold) 12%, transparent)', textColor: 'var(--gold2)', borderColor: 'color-mix(in srgb, var(--gold) 30%, transparent)' },
  ACT: { text: 'ACT', bgColor: 'color-mix(in srgb, var(--purple) 12%, transparent)', textColor: 'var(--purple)', borderColor: 'color-mix(in srgb, var(--purple) 30%, transparent)' },
  SLUG: { text: 'SLUG', bgColor: 'color-mix(in srgb, var(--blue) 12%, transparent)', textColor: 'var(--blue)', borderColor: 'color-mix(in srgb, var(--blue) 30%, transparent)' },
  SCENE: { text: 'SCENE', bgColor: 'color-mix(in srgb, var(--green) 12%, transparent)', textColor: 'var(--green)', borderColor: 'color-mix(in srgb, var(--green) 30%, transparent)' },
  NOTE: { text: 'NOTE', bgColor: 'color-mix(in srgb, var(--text3) 12%, transparent)', textColor: 'var(--text2)', borderColor: 'color-mix(in srgb, var(--text3) 30%, transparent)' },
  GENRE: { text: 'GENRE', bgColor: 'color-mix(in srgb, var(--accent) 15%, transparent)', textColor: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)' },
  MOOD: { text: 'MOOD', bgColor: 'color-mix(in srgb, var(--accent) 8%, transparent)', textColor: 'color-mix(in srgb, var(--accent) 90%, white)', borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' },
};

// Detect if a line is a slugline (INT./EXT. pattern after ###)
function isSlugline(text: string): boolean {
  const sluglinePattern = /^(INT|EXT)\.\s*.+\s*[-—]\s*.+$/i;
  return sluglinePattern.test(text.trim());
}

// Detect metadata tags (@genre:, @mood: patterns)
function getMetadataType(text: string): 'GENRE' | 'MOOD' | null {
  const trimmed = text.trim().toLowerCase();
  if (trimmed.startsWith('@genre:')) return 'GENRE';
  if (trimmed.startsWith('@mood:')) return 'MOOD';
  return null;
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
    // Only set badge-specific colors via inline style - base styles in CSS
    span.style.color = config.textColor;
    span.style.background = config.bgColor;
    span.style.borderColor = config.borderColor;
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
          } else {
            // Check for metadata tags (@genre:, @mood:)
            const metadataType = getMetadataType(lineText);
            if (metadataType) {
              builder.add(
                line.from,
                line.from,
                Decoration.widget({
                  widget: new BadgeWidget(metadataType),
                  side: 1,
                })
              );
            }
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
        } else {
          // Check for metadata tags
          badgeType = getMetadataType(lineText);
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
