use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::command;
use base64::{Engine as _, engine::general_purpose};
use pdf_writer::{Pdf, Rect, Ref, Content, Name, Str, Filter, Finish};
use image::ImageFormat;

/// Compress raw RGB data using zlib/deflate for PDF FlateDecode filter
fn compress_deflate(data: &[u8]) -> Vec<u8> {
    use flate2::write::ZlibEncoder;
    use flate2::Compression;

    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(data).unwrap();
    encoder.finish().unwrap()
}

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

    // Image scaling parameters
    let max_image_w = PAGE_WIDTH - 2.0 * MARGIN - 40.0; // ~761 pts
    let max_image_h = 80.0; // Max height for images

    // Process each page
    for (page_idx, page_ref) in page_refs.iter().enumerate() {
        // Collect panels for this page
        let start_panel = page_idx * panels_per_page;
        let end_panel = start_panel + panels_per_page;

        // First pass: create image XObjects for this page
        // Store: (panel_idx, image_idx_on_page, ref, scaled_w, scaled_h)
        let mut page_images: Vec<(usize, usize, Ref, f32, f32)> = Vec::new();
        let mut panel_counter = 0;
        let mut image_idx_on_page = 0;

        for scene in &project.scenes {
            for panel in &scene.panels {
                if panel_counter >= start_panel && panel_counter < end_panel {
                    if let Some(ref image_data) = panel.image_data {
                        match decode_and_process_image(image_data) {
                            Ok((width, height, rgb_data)) => {
                                // Compress RGB data
                                let compressed = compress_deflate(&rgb_data);

                                // Create image XObject
                                let image_ref = Ref::new(ref_counter);
                                ref_counter += 1;

                                let mut image = pdf.image_xobject(image_ref, &compressed);
                                image.filter(Filter::FlateDecode);
                                image.width(width as i32);
                                image.height(height as i32);
                                image.color_space().device_rgb();
                                image.bits_per_component(8);
                                image.finish();

                                // Calculate scaled dimensions
                                let scale = (max_image_w / width as f32).min(max_image_h / height as f32).min(1.0);
                                let scaled_w = width as f32 * scale;
                                let scaled_h = height as f32 * scale;

                                page_images.push((panel_counter, image_idx_on_page, image_ref, scaled_w, scaled_h));
                                image_idx_on_page += 1;
                            }
                            Err(_) => {
                                // Decode failed, will show placeholder
                            }
                        }
                    }
                }
                panel_counter += 1;
            }
        }

        // Second pass: build content stream
        let mut content = Content::new();
        content.set_font(font_name, 12.0);

        let mut y_pos = PAGE_HEIGHT - MARGIN - 20.0;
        panel_counter = 0;

        for scene in &project.scenes {
            if y_pos < MARGIN + 100.0 {
                break;
            }

            // Scene header
            content.move_to(MARGIN, y_pos);
            content.show(Str(format!("{} - {}", scene.name, scene.slugline).as_bytes()));
            y_pos -= 25.0;

            for panel in &scene.panels {
                if y_pos < MARGIN + 100.0 {
                    break;
                }

                if panel_counter >= start_panel && panel_counter < end_panel {
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

                    // Image - find the XObject for this panel
                    if let Some((_, img_idx, _, scaled_w, scaled_h)) = page_images.iter().find(|(idx, _, _, _, _)| *idx == panel_counter) {
                        let img_x = MARGIN + 20.0;
                        let img_y = y_pos - scaled_h;
                        let img_name = format!("Im{}", img_idx);

                        content.save_state();
                        content.transform([*scaled_w, 0.0, 0.0, *scaled_h, img_x, img_y]);
                        content.x_object(Name(img_name.as_bytes()));
                        content.restore_state();

                        y_pos = img_y - 10.0;
                    } else if panel.image_data.is_some() {
                        // Fallback to placeholder if decode failed
                        content.move_to(MARGIN + 20.0, y_pos);
                        content.show(Str(b"[Image - decode failed]"));
                        y_pos -= 10.0;
                    } else if panel.svg_data.is_some() {
                        content.move_to(MARGIN + 20.0, y_pos);
                        content.show(Str(b"[SVG]"));
                        y_pos -= 10.0;
                    }

                    y_pos -= 15.0;
                }

                panel_counter += 1;
            }

            y_pos -= 15.0;
        }

        // Write content stream
        let content_bytes = content.finish();
        let content_ref = Ref::new(ref_counter);
        ref_counter += 1;
        pdf.stream(content_ref, &content_bytes);

        // Create page with resources
        let mut page = pdf.page(*page_ref);
        page.parent(pages_ref)
            .media_box(Rect::new(0.0, 0.0, PAGE_WIDTH, PAGE_HEIGHT))
            .contents(content_ref);

        // Register resources (font + image XObjects)
        {
            let mut resources = page.resources();
            // Font
            resources.fonts().pair(font_name, font_ref);
            // Image XObjects
            if !page_images.is_empty() {
                let mut xobjects = resources.x_objects();
                for (_, img_idx, img_ref, _, _) in &page_images {
                    let img_name = format!("Im{}", img_idx);
                    xobjects.pair(Name(img_name.as_bytes()), *img_ref);
                }
            }
        }

        page.finish();
    }

    // Create font dictionary (Helvetica is a standard Type1 PDF font)
    pdf.type1_font(font_ref).base_font(Name(b"Helvetica"));

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    // A small 10x10 red PNG image (base64 encoded) - valid PNG created with Python
    const RED_PNG_BASE64: &str = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR42mP4z8CABzGMSmNDALfKY53W1e90AAAAAElFTkSuQmCC";

    fn create_test_project() -> ExportProject {
        ExportProject {
            name: "Test Project".to_string(),
            scenes: vec![
                ExportScene {
                    name: "Scene 1".to_string(),
                    slugline: "INT. TEST - DAY".to_string(),
                    panels: vec![
                        ExportPanel {
                            number: 1,
                            description: "A test panel with an embedded image".to_string(),
                            dialogue: "This is test dialogue".to_string(),
                            shot_type: Some("Wide".to_string()),
                            duration: "3s".to_string(),
                            image_data: Some(format!("data:image/png;base64,{}", RED_PNG_BASE64)),
                            svg_data: None,
                        },
                        ExportPanel {
                            number: 2,
                            description: "Another panel without image".to_string(),
                            dialogue: "".to_string(),
                            shot_type: Some("Close-up".to_string()),
                            duration: "2s".to_string(),
                            image_data: None,
                            svg_data: None,
                        },
                    ],
                },
            ],
        }
    }

    #[test]
    fn test_decode_and_process_image() {
        let result = decode_and_process_image(&format!("data:image/png;base64,{}", RED_PNG_BASE64));
        assert!(result.is_ok(), "Failed to decode image: {:?}", result.err());

        let (width, height, data) = result.unwrap();
        assert_eq!(width, 10, "Image width should be 10");
        assert_eq!(height, 10, "Image height should be 10");
        assert_eq!(data.len(), 10 * 10 * 3, "RGB data should be width * height * 3");
    }

    #[test]
    fn test_compress_deflate() {
        let data = vec![0u8; 100]; // 100 zero bytes
        let compressed = compress_deflate(&data);
        assert!(!compressed.is_empty(), "Compressed data should not be empty");
        assert!(compressed.len() < data.len(), "Compressed data should be smaller than original for zeros");
    }

    #[test]
    fn test_export_pdf_with_images() {
        let project = create_test_project();
        let pdf_path = std::path::PathBuf::from("/tmp/test_export_images.pdf");

        // Run the export synchronously (blocking)
        let result = tokio_test::block_on(export_pdf(
            pdf_path.to_string_lossy().to_string(),
            project,
        ));

        assert!(result.is_ok(), "PDF export failed: {:?}", result.err());
        assert!(pdf_path.exists(), "PDF file was not created");

        // Read the PDF and verify it contains image data
        let pdf_bytes = fs::read(&pdf_path).expect("Failed to read PDF");
        let pdf_str = String::from_utf8_lossy(&pdf_bytes);

        // Print PDF content for debugging
        println!("\n--- PDF Structure Check ---");
        println!("PDF size: {} bytes", pdf_bytes.len());
        println!("Has PDF header: {}", pdf_str.contains("%PDF-"));
        println!("Has EOF marker: {}", pdf_str.contains("%EOF"));
        println!("Has FlateDecode: {}", pdf_str.contains("/FlateDecode"));
        println!("Has DeviceRGB: {}", pdf_str.contains("/DeviceRGB"));
        println!("Has Width: {}", pdf_str.contains("/Width"));
        println!("Has Height: {}", pdf_str.contains("/Height"));
        println!("Has XObject: {}", pdf_str.contains("/XObject"));
        println!("Has Im0: {}", pdf_str.contains("/Im0"));

        // Check for PDF structure
        assert!(pdf_str.contains("%PDF-"), "File should be a valid PDF");
        assert!(pdf_str.contains("%EOF"), "PDF should have EOF marker");

        // Check for image XObject (FlateDecode filter)
        assert!(pdf_str.contains("/FlateDecode"), "PDF should contain FlateDecode filter for images");

        // Check for image dimensions
        assert!(pdf_str.contains("/Width"), "PDF should contain image width");
        assert!(pdf_str.contains("/Height"), "PDF should contain image height");
        assert!(pdf_str.contains("/DeviceRGB"), "PDF should contain DeviceRGB colorspace");

        // Keep the file for manual inspection
        println!("\nPDF saved to: {} (MANUAL TEST TO VIEW)", pdf_path.display());
        println!("Run: open {}", pdf_path.display());

        // NOTE: Do NOT clean up - file is kept for manual verification
    }

    #[test]
    fn test_export_pdf_with_invalid_image() {
        let project = ExportProject {
            name: "Test Invalid Image".to_string(),
            scenes: vec![
                ExportScene {
                    name: "Scene 1".to_string(),
                    slugline: "INT. TEST - DAY".to_string(),
                    panels: vec![
                        ExportPanel {
                            number: 1,
                            description: "Panel with invalid image".to_string(),
                            dialogue: "".to_string(),
                            shot_type: None,
                            duration: "3s".to_string(),
                            image_data: Some("data:image/png;base64,INVALID_BASE64!!!".to_string()),
                            svg_data: None,
                        },
                    ],
                },
            ],
        };

        let temp_dir = std::env::temp_dir();
        let pdf_path = temp_dir.join("test_invalid_image.pdf");

        let result = tokio_test::block_on(export_pdf(
            pdf_path.to_string_lossy().to_string(),
            project,
        ));

        // Should still succeed but show placeholder
        assert!(result.is_ok(), "PDF export should succeed even with invalid image: {:?}", result.err());
        assert!(pdf_path.exists(), "PDF file was not created");

        // Clean up
        let _ = fs::remove_file(&pdf_path);
    }
}
