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

export function useExport() {
  const { project } = useProjectStore();

  const prepareExportData = useCallback((): ExportProject | null => {
    if (!project) return null;

    return {
      name: project.name,
      scenes: project.scenes.map((scene) => ({
        name: scene.name,
        slugline: scene.slugline,
        panels: scene.panels.map((panel) => ({
          number: panel.number,
          description: panel.description,
          dialogue: panel.dialogue,
          shot_type: panel.shotType,
          duration: panel.duration,
          image_data: panel.imageData,
          svg_data: panel.svgData,
        })),
      })),
    };
  }, [project]);

  const exportPDF = useCallback(async () => {
    const data = prepareExportData();
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
    const data = prepareExportData();
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
    const data = prepareExportData();
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
    const data = prepareExportData();
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
