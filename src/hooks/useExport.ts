import { useCallback } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from '@/stores/projectStore';

interface ExportPanel {
  number: number;
  description: string;
  dialogue: string;
  shot_type: string | null;
  duration: string;
  image_data: string | null;
  svg_data: string | null;
}

interface ExportScene {
  name: string;
  slugline: string;
  panels: ExportPanel[];
}

interface ExportProject {
  name: string;
  scenes: ExportScene[];
}

// Rasterize SVG to PNG using Canvas API
async function rasterizeSvgToPng(svgData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Use a fixed size for consistency (16:9 aspect ratio)
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error('Failed to load SVG image'));
    // Set the SVG as the image source
    img.src = svgData;
  });
}

export function useExport() {
  const { project } = useProjectStore();

  const prepareExportData = useCallback(async (): Promise<ExportProject | null> => {
    if (!project) return null;

    const scenes = await Promise.all(
      project.scenes.map(async (scene) => {
        const panels = await Promise.all(
          scene.panels.map(async (panel) => {
            let imageData = panel.imageData;
            let svgData = panel.svgData;

            // If panel has SVG but no image, rasterize SVG to PNG
            if (!imageData && svgData) {
              try {
                imageData = await rasterizeSvgToPng(svgData);
                svgData = null; // Clear SVG since we've converted it
              } catch (e) {
                console.warn('Failed to rasterize SVG panel:', panel.number, e);
                // Keep SVG data so it's not lost
              }
            }

            return {
              number: panel.number,
              description: panel.description,
              dialogue: panel.dialogue,
              shot_type: panel.shotType,
              duration: panel.duration,
              image_data: imageData,
              svg_data: svgData,
            };
          })
        );

        return {
          name: scene.name,
          slugline: scene.slugline,
          panels,
        };
      })
    );

    return {
      name: project.name,
      scenes,
    };
  }, [project]);

  const exportPDF = useCallback(async () => {
    const data = await prepareExportData();
    if (!data) return;

    try {
      const filePath = await save({
        defaultPath: `${project?.name || 'storyboard'}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });

      if (filePath) {
        await invoke('export_pdf', { path: filePath, project: data });
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      throw error;
    }
  }, [project, prepareExportData]);

  const exportImages = useCallback(async () => {
    const data = await prepareExportData();
    if (!data) return;

    try {
      const filePath = await save({
        defaultPath: `${project?.name || 'storyboard'}_images.zip`,
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
      });

      if (filePath) {
        await invoke('export_images', { path: filePath, project: data });
      }
    } catch (error) {
      console.error('Failed to export images:', error);
      throw error;
    }
  }, [project, prepareExportData]);

  const exportFCPXML = useCallback(async () => {
    const data = await prepareExportData();
    if (!data) return;

    try {
      const filePath = await save({
        defaultPath: `${project?.name || 'storyboard'}.fcpxml`,
        filters: [
          { name: 'Final Cut Pro XML', extensions: ['fcpxml'] },
          { name: 'XML', extensions: ['xml'] },
        ],
      });

      if (filePath) {
        await invoke('export_fcp_xml', { path: filePath, project: data });
      }
    } catch (error) {
      console.error('Failed to export FCP XML:', error);
      throw error;
    }
  }, [project, prepareExportData]);

  const exportPremiereXML = useCallback(async () => {
    const data = await prepareExportData();
    if (!data) return;

    try {
      const filePath = await save({
        defaultPath: `${project?.name || 'storyboard'}_premiere.xml`,
        filters: [{ name: 'XML', extensions: ['xml'] }],
      });

      if (filePath) {
        await invoke('export_premiere_xml', { path: filePath, project: data });
      }
    } catch (error) {
      console.error('Failed to export Premiere XML:', error);
      throw error;
    }
  }, [project, prepareExportData]);

  return {
    exportPDF,
    exportImages,
    exportFCPXML,
    exportPremiereXML,
  };
}
