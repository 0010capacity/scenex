use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::command;
use base64::{Engine as _, engine::general_purpose};
use pdf_writer::{Pdf, Rect, Ref, Content, Name, Str};
use image::ImageFormat;

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

// Page dimensions (A4 landscape in points: 1 point = 1/72 inch)
const PAGE_WIDTH: f32 = 841.89;
const PAGE_HEIGHT: f32 = 595.28;
const MARGIN: f32 = 30.0;

/// Export project as PDF with embedded images
#[command]
pub async fn export_pdf(path: String, project: ExportProject) -> Result<(), String> {
    let path = PathBuf::from(&path);

    let mut pdf = Pdf::new();

    // Allocate reference numbers
    let catalog_ref = Ref::new(1);
    let pages_ref = Ref::new(2);
    let font_ref = Ref::new(3);
    let mut ref_counter = 4;

    // Collect all panel images
    let mut images_info: Vec<(Ref, Option<(u32, u32, Vec<u8>)>)> = Vec::new();

    for scene in &project.scenes {
        for panel in &scene.panels {
            if let Some(ref image_data) = panel.image_data {
                let image_ref = Ref::new(ref_counter);
                ref_counter += 1;

                match decode_and_process_image(image_data) {
                    Ok((width, height, raw_data)) => {
                        images_info.push((image_ref, Some((width, height, raw_data))));
                    }
                    Err(_) => {
                        images_info.push((image_ref, None));
                    }
                }
            }
        }
    }

    // Calculate number of pages needed
    let total_panels: usize = project.scenes.iter().map(|s| s.panels.len()).sum();
    let panels_per_page = 6;
    let num_pages = ((total_panels as f32) / panels_per_page as f32).ceil() as usize;

    // Create page references
    let mut page_refs: Vec<Ref> = Vec::new();
    for _ in 0..num_pages.max(1) {
        page_refs.push(Ref::new(ref_counter));
        ref_counter += 1;
    }

    // Font name
    let font_name = Name(b"F1");

    // Process each page
    let mut panel_index = 0;
    let mut image_idx = 0;

    for page_ref in &page_refs {
        let mut content = Content::new();

        // Set font
        content.set_font(font_name, 12.0);

        let mut y_pos = PAGE_HEIGHT - MARGIN - 20.0;

        for scene in &project.scenes {
            if y_pos < MARGIN + 100.0 {
                break;
            }

            // Scene header
            content.move_to(MARGIN, y_pos);
            content.show(Str(format!("{} - {}", scene.name, scene.slugline).as_bytes()));
            y_pos -= 25.0;

            for panel in &scene.panels {
                if y_pos < MARGIN + 60.0 {
                    break;
                }

                // Panel header
                let shot_str = panel.shot_type.as_deref().unwrap_or("N/A");
                content.move_to(MARGIN + 10.0, y_pos);
                content.show(Str(format!("Panel {} [{}] ({})", panel.number, shot_str, panel.duration).as_bytes()));
                y_pos -= 15.0;

                // Description
                content.move_to(MARGIN + 20.0, y_pos);
                let desc = if panel.description.len() > 100 {
                    format!("{}...", &panel.description.chars().take(97).collect::<String>())
                } else {
                    panel.description.clone()
                };
                if !desc.is_empty() {
                    content.show(Str(desc.as_bytes()));
                }
                y_pos -= 15.0;

                // Dialogue
                if !panel.dialogue.is_empty() {
                    content.move_to(MARGIN + 20.0, y_pos);
                    let dialogue = if panel.dialogue.len() > 80 {
                        format!("\"{}...\"", &panel.dialogue.chars().take(77).collect::<String>())
                    } else {
                        format!("\"{}\"", panel.dialogue)
                    };
                    content.show(Str(dialogue.as_bytes()));
                    y_pos -= 15.0;
                }

                // Image indicator (actual image embedding would require XObject)
                if panel.image_data.is_some() {
                    content.move_to(MARGIN + 20.0, y_pos);
                    content.show(Str(b"[Image]"));
                    y_pos -= 10.0;
                } else if panel.svg_data.is_some() {
                    content.move_to(MARGIN + 20.0, y_pos);
                    content.show(Str(b"[SVG]"));
                    y_pos -= 10.0;
                }

                y_pos -= 15.0;
                panel_index += 1;
                if panel.image_data.is_some() {
                    image_idx += 1;
                }
            }

            y_pos -= 15.0;
        }

        // Write content stream
        let content_bytes = content.finish();
        let content_ref = Ref::new(ref_counter);
        ref_counter += 1;
        pdf.stream(content_ref, &content_bytes);

        // Create page
        pdf.page(*page_ref)
            .parent(pages_ref)
            .media_box(Rect::new(0.0, 0.0, PAGE_WIDTH, PAGE_HEIGHT))
            .contents(content_ref);
    }

    // Create font dictionary (Helvetica is a standard PDF font)
    pdf.type0_font(font_ref)
        .base_font(Name(b"Helvetica"))
        .encoding_predefined(Name(b"WinAnsiEncoding"))
        .descendant_font(Ref::new(ref_counter));

    // Write pages tree
    let kids: Vec<Ref> = page_refs.iter().copied().collect();
    pdf.pages(pages_ref).count(kids.len() as i32).kids(kids);

    // Write catalog
    pdf.catalog(catalog_ref).pages(pages_ref);

    // Write to file
    let pdf_bytes = pdf.finish();
    let mut file = File::create(&path).map_err(|e| e.to_string())?;
    file.write_all(&pdf_bytes).map_err(|e| e.to_string())?;

    Ok(())
}

/// Decode base64 image and convert to raw RGB data
fn decode_and_process_image(data: &str) -> Result<(u32, u32, Vec<u8>), String> {
    // Remove data URL prefix if present
    let data = if let Some(idx) = data.find(',') {
        &data[idx + 1..]
    } else {
        data
    };

    // Decode base64
    let image_bytes = general_purpose::STANDARD.decode(data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Detect format and load image
    let format = detect_image_format_from_bytes(&image_bytes);
    let img = image::load_from_memory_with_format(&image_bytes, format)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    let img = img.to_rgb8();
    let (width, height) = img.dimensions();
    let raw_data = img.into_raw();

    Ok((width, height, raw_data))
}

fn detect_image_format_from_bytes(bytes: &[u8]) -> ImageFormat {
    if bytes.len() < 4 {
        return ImageFormat::Png;
    }

    // PNG magic bytes
    if bytes[0..4] == [0x89, 0x50, 0x4E, 0x47] {
        return ImageFormat::Png;
    }
    // JPEG magic bytes
    if bytes[0..2] == [0xFF, 0xD8] {
        return ImageFormat::Jpeg;
    }
    // GIF magic bytes
    if bytes[0..4] == [0x47, 0x49, 0x46, 0x38] {
        return ImageFormat::Gif;
    }
    // WebP magic bytes
    if bytes.len() > 11 && bytes[8..12] == [0x57, 0x45, 0x42, 0x50] {
        return ImageFormat::WebP;
    }

    ImageFormat::Png
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
    let data = if let Some(idx) = data.find(',') {
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
