use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::command;
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportPanel {
    pub number: i32,
    pub description: String,
    pub dialogue: String,
    pub shot_type: Option<String>,
    pub duration: String,
    pub image_data: Option<String>,
    pub svg_data: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportScene {
    pub name: String,
    pub slugline: String,
    pub panels: Vec<ExportPanel>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportProject {
    pub name: String,
    pub scenes: Vec<ExportScene>,
}

/// Export project as PDF
#[command]
pub async fn export_pdf(path: String, project: ExportProject) -> Result<(), String> {
    use printpdf::*;

    let path = PathBuf::from(&path);

    // Create PDF document (A4 landscape)
    let (doc, page1, layer1) =
        PdfDocument::new(&project.name, Mm(297.0), Mm(210.0), "Layer 1");
    let current_layer = doc.get_page(page1).get_layer(layer1);

    // Load font (using built-in)
    let font = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e| e.to_string())?;

    // Title
    current_layer.use_text(&project.name, 24.0, Mm(20.0), Mm(190.0), &font);

    let mut y_pos = 170.0;

    for scene in &project.scenes {
        // Scene header
        current_layer.use_text(
            format!("{} - {}", scene.name, scene.slugline),
            14.0,
            Mm(20.0),
            Mm(y_pos),
            &font,
        );
        y_pos -= 10.0;

        for panel in &scene.panels {
            // Panel number and shot type
            let shot_str = panel.shot_type.as_deref().unwrap_or("N/A");
            current_layer.use_text(
                format!("Panel {} [{}] ({})", panel.number, shot_str, panel.duration),
                10.0,
                Mm(25.0),
                Mm(y_pos),
                &font,
            );
            y_pos -= 6.0;

            // Description (truncate if too long)
            let desc = if panel.description.len() > 80 {
                format!("{}...", &panel.description.chars().take(77).collect::<String>())
            } else {
                panel.description.clone()
            };
            if !desc.is_empty() {
                current_layer.use_text(desc, 9.0, Mm(30.0), Mm(y_pos), &font);
                y_pos -= 5.0;
            }

            // Dialogue
            if !panel.dialogue.is_empty() {
                let dialogue = if panel.dialogue.len() > 60 {
                    format!("\"{}...\"", &panel.dialogue.chars().take(57).collect::<String>())
                } else {
                    format!("\"{}\"", panel.dialogue)
                };
                current_layer.use_text(dialogue, 8.0, Mm(30.0), Mm(y_pos), &font);
                y_pos -= 5.0;
            }

            // Visual content indicator
            if panel.image_data.is_some() {
                current_layer.use_text("(Panel includes visual image)", 8.0, Mm(30.0), Mm(y_pos), &font);
                y_pos -= 5.0;
            } else if panel.svg_data.is_some() {
                current_layer.use_text("(Panel includes SVG graphic)", 8.0, Mm(30.0), Mm(y_pos), &font);
                y_pos -= 5.0;
            }

            y_pos -= 5.0;

            // New page if needed
            if y_pos < 20.0 {
                let (new_page, new_layer) = doc.add_page(Mm(297.0), Mm(210.0), "Layer 1");
                let _layer = doc.get_page(new_page).get_layer(new_layer);
                y_pos = 190.0;
            }
        }

        y_pos -= 10.0;
    }

    // Save PDF
    let file = File::create(&path).map_err(|e| e.to_string())?;
    doc.save(&mut std::io::BufWriter::new(file)).map_err(|e| e.to_string())?;

    Ok(())
}

/// Export project as a ZIP of images
#[command]
pub async fn export_images(path: String, project: ExportProject) -> Result<(), String> {
    use zip::write::SimpleFileOptions;
    use zip::ZipWriter;

    let path = PathBuf::from(&path);
    let file = File::create(&path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    for scene in &project.scenes {
        let scene_name = sanitize_filename(&scene.name);

        for panel in &scene.panels {
            if let Some(ref image_data) = panel.image_data {
                // Decode base64 image
                let image_bytes = decode_base64_image(image_data)?;

                // Determine extension
                let ext = detect_image_format(&image_bytes);

                // Add to ZIP
                let filename = format!(
                    "{}/panel_{:03}.{}",
                    scene_name, panel.number, ext
                );
                zip.start_file(&filename, options).map_err(|e| e.to_string())?;
                zip.write_all(&image_bytes).map_err(|e| e.to_string())?;
            }
        }
    }

    zip.finish().map_err(|e| e.to_string())?;

    Ok(())
}

/// Export as Final Cut Pro XML
#[command]
pub async fn export_fcp_xml(path: String, project: ExportProject) -> Result<(), String> {
    let path = PathBuf::from(&path);

    // Basic FCP XML structure
    let xml = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
    <resources>
        <format id="r1" name="FFVideoFormat1080p24" frameDuration="1/24s" width="1920" height="1080"/>
    </resources>
    <library>
        <event name="{}">
            <project name="{}">
                <sequence duration="{}s" format="r1">
                    <spine>
{}
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>"#,
        project.name,
        project.name,
        calculate_total_duration(&project),
        generate_fcp_clips(&project)
    );

    fs::write(&path, xml).map_err(|e| e.to_string())?;

    Ok(())
}

/// Export as Adobe Premiere XML (xmeml 4.0 format)
#[command]
pub async fn export_premiere_xml(path: String, project: ExportProject) -> Result<(), String> {
    let path = PathBuf::from(&path);

    // Generate xmeml 4.0 compatible XML
    let xml = generate_xmeml(&project);

    fs::write(&path, xml).map_err(|e| e.to_string())?;

    Ok(())
}

fn generate_xmeml(project: &ExportProject) -> String {
    let mut clips_xml = String::new();

    for (scene_idx, scene) in project.scenes.iter().enumerate() {
        let scene_index = scene_idx + 1;
        clips_xml.push_str(&format!(
            r#"        <sequence id="scene_{}" name="{}" duration="{}s" timebase="24">
            <rate>
                <timebase>24</timebase>
                <ntsc>FALSE</ntsc>
            </rate>
            <media>
                <video>
                    <track>
"#,
            scene_index,
            escape_xml(&scene.name),
            calculate_total_duration_for_scenes(&project.scenes[..=scene_idx])
        ));

        let mut time_position = 0.0;
        for panel in &scene.panels {
            let duration = parse_duration(&panel.duration);
            clips_xml.push_str(&format!(
                r#"                        <clipitem id="clip_{}_{}">
                            <name>Panel {}</name>
                            <duration>{}</duration>
                            <rate>
                                <timebase>24</timebase>
                                <ntsc>FALSE</ntsc>
                            </rate>
                            <start>{}</start>
                            <end>{}</end>
                            <in>{}</in>
                            <out>{}</out>
                            <file id="file_{}_{}">
                                <name>{}</name>
                                <pathurl>file://localhost/panels/panel_{}_{}.png</pathurl>
                                <rate>
                                    <timebase>24</timebase>
                                    <ntsc>FALSE</ntsc>
                                </rate>
                            </file>
                        </clipitem>
"#,
                scene_index,
                panel.number,
                panel.number,
                duration,
                time_position,
                time_position + duration,
                time_position,
                time_position + duration,
                scene_index,
                panel.number,
                escape_xml(&format!("Panel {} - {}", panel.number, panel.description.chars().take(30).collect::<String>())),
                scene_index,
                panel.number
            ));
            time_position += duration;
        }

        clips_xml.push_str(
            r#"                    </track>
                </video>
            </media>
        </sequence>
"#,
        );
    }

    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml SYSTEM "http://www.adobe.com/premiere/projection.dtd">
<xmeml version="4">
    <project>
        <name>{}</name>
        <children>
{}
        </children>
    </project>
</xmeml>"#,
        escape_xml(&project.name),
        clips_xml
    )
}

fn calculate_total_duration_for_scenes(scenes: &[ExportScene]) -> f64 {
    let mut total = 0.0;
    for scene in scenes {
        for panel in &scene.panels {
            total += parse_duration(&panel.duration);
        }
    }
    total
}

// Helper functions

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect()
}

fn decode_base64_image(data: &str) -> Result<Vec<u8>, String> {
    // Remove data URL prefix if present
    let data = if let Some(idx) = data.find(",") {
        &data[idx + 1..]
    } else {
        data
    };

    general_purpose::STANDARD.decode(data).map_err(|e| format!("Failed to decode base64: {}", e))
}

fn detect_image_format(bytes: &[u8]) -> &str {
    if bytes.len() < 4 {
        return "bin";
    }

    // PNG magic bytes
    if bytes[0..4] == [0x89, 0x50, 0x4E, 0x47] {
        return "png";
    }
    // JPEG magic bytes
    if bytes[0..2] == [0xFF, 0xD8] {
        return "jpg";
    }
    // GIF magic bytes
    if bytes[0..4] == [0x47, 0x49, 0x46, 0x38] {
        return "gif";
    }
    // WebP magic bytes
    if bytes.len() > 11 && bytes[8..12] == [0x57, 0x45, 0x42, 0x50] {
        return "webp";
    }

    "bin"
}

fn parse_duration(duration: &str) -> f64 {
    // Parse duration like "3s", "2.5s", "100ms"
    let duration = duration.trim();
    if duration.ends_with('s') {
        duration[..duration.len() - 1]
            .parse::<f64>()
            .unwrap_or(3.0)
    } else if duration.ends_with("ms") {
        duration[..duration.len() - 2]
            .parse::<f64>()
            .unwrap_or(3000.0)
            / 1000.0
    } else {
        3.0
    }
}

fn calculate_total_duration(project: &ExportProject) -> f64 {
    let mut total = 0.0;
    for scene in &project.scenes {
        for panel in &scene.panels {
            total += parse_duration(&panel.duration);
        }
    }
    total
}

fn generate_fcp_clips(project: &ExportProject) -> String {
    let mut clips = String::new();
    let mut offset = 0.0;

    for scene in &project.scenes {
        for panel in &scene.panels {
            let duration = parse_duration(&panel.duration);
            clips.push_str(&format!(
                r#"                        <clip name="Panel {} - {}" offset="{}s" duration="{}s">
                            <note>{}</note>
                        </clip>
"#,
                panel.number,
                scene.name,
                offset,
                duration,
                escape_xml(&panel.description)
            ));
            offset += duration;
        }
    }

    clips
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}
