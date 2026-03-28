//! Prompt templates for AI generation.
//!
//! ## Structure
//!
//! ```
//! prompts/
//! ├── SKILL.md                          # Skill definition (metadata)
//! ├── svg_panel.md                      # SVG panel generation prompt
//! ├── batch_panels.md                  # Batch panel generation prompt
//! ├── script_lines.md                  # Script line generation prompt
//! ├── description_enhance.md           # Description enhancement prompt
//! └── references/                       # Reference documents
//!     ├── shot-types.md
//!     ├── svg-specs.md
//!     ├── duration.md
//!     └── script-format.md
//! ```
//!
//! ## Version
//!
//! Prompts are versioned as a whole. Set `SCENEX_PROMPT_VERSION` to switch.
//! Currently only version 1 exists.
//!
//! ## Prompt Design Principles
//!
//! - Role: Short, 1-2 sentences
//! - Task: Clear and specific
//! - Reference: External docs for depth
//! - Output: Strict format requirements
//! - No examples unless necessary for edge cases
//! - No verbose anti-patterns

use std::env;

/// Prompt version for future A/B testing
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum PromptVersion {
    V1,
}

impl Default for PromptVersion {
    fn default() -> Self {
        match env::var("SCENEX_PROMPT_VERSION").as_deref() {
            Ok("1") | Ok("v1") => PromptVersion::V1,
            _ => PromptVersion::V1,
        }
    }
}

/// SVG Panel Generation Prompt
pub mod svg_panel {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/svg_panel.md"),
        }
    }

    pub fn build(description: &str, shot_type: Option<&str>, mood_tags: &[String]) -> String {
        let mood = if mood_tags.is_empty() {
            "neutral".to_string()
        } else {
            mood_tags.join(", ")
        };

        let shot = shot_type.unwrap_or("medium shot (MS)");

        template()
            .replace("{{description}}", description)
            .replace("{{shot_type}}", shot)
            .replace("{{mood}}", &mood)
    }
}

/// Batch Panel Generation Prompt
pub mod batch_panels {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/batch_panels.md"),
        }
    }

    pub fn build(
        description: &str,
        shot_hint: Option<&str>,
        mood_tags: &[String],
        count: usize,
    ) -> String {
        let mood = if mood_tags.is_empty() {
            "neutral".to_string()
        } else {
            mood_tags.join(", ")
        };

        let hint = shot_hint.unwrap_or("varied");

        template()
            .replace("{{description}}", description)
            .replace("{{shot_hint}}", hint)
            .replace("{{mood}}", &mood)
            .replace("{{count}}", &count.to_string())
    }
}

/// Script Lines Generation Prompt
pub mod script_lines {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/script_lines.md"),
        }
    }

    pub fn build(slugline: &str) -> String {
        template().replace("{{slugline}}", slugline)
    }
}

/// Description Enhancement Prompt
pub mod description_enhance {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/description_enhance.md"),
        }
    }

    pub fn build(description: &str) -> String {
        template().replace("{{description}}", description)
    }
}

/// Scenario Generation Prompt
pub mod scenario_generate {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/scenario_generate.md"),
        }
    }

    pub fn build(concept: &str, genre: Option<&str>, mood: Option<&str>) -> String {
        template()
            .replace("{{concept}}", concept)
            .replace("{{genre}}", genre.unwrap_or("unspecified"))
            .replace("{{mood}}", mood.unwrap_or("neutral"))
    }
}

/// Scenario Polish Prompt
pub mod scenario_polish {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/scenario_polish.md"),
        }
    }

    pub fn build(scenario_json: &str) -> String {
        template().replace("{{scenario_json}}", scenario_json)
    }
}

/// Scenario Expand Prompt
pub mod scenario_expand {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/scenario_expand.md"),
        }
    }

    pub fn build(scenario_json: &str, target_size: &str) -> String {
        template()
            .replace("{{scenario_json}}", scenario_json)
            .replace("{{target_size}}", target_size)
    }
}

/// Scenario Condense Prompt
pub mod scenario_condense {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/scenario_condense.md"),
        }
    }

    pub fn build(scenario_json: &str, target_length: &str) -> String {
        template()
            .replace("{{scenario_json}}", scenario_json)
            .replace("{{target_length}}", target_length)
    }
}

/// Scenario to Storyboard Prompt
pub mod scenario_to_storyboard {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/scenario_to_storyboard.md"),
        }
    }

    pub fn build(scenario_json: &str, panel_count: usize, distribution: &str) -> String {
        template()
            .replace("{{scenario_json}}", scenario_json)
            .replace("{{panel_count}}", &panel_count.to_string())
            .replace("{{distribution}}", distribution)
    }
}

/// Scenario to Script Prompt
pub mod scenario_to_script {
    use super::*;

    pub fn _template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/scenario_to_script.md"),
        }
    }

    pub fn _build(scene_json: &str) -> String {
        _template().replace("{{scene_json}}", scene_json)
    }
}

/// Panel Regeneration Prompt
pub mod regenerate_panel {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/regenerate_panel.md"),
        }
    }

    pub fn build(
        previous_svg: &str,
        previous_description: &str,
        user_feedback: &str,
        scene_context: Option<&str>,
    ) -> String {
        template()
            .replace("{{previous_svg}}", previous_svg)
            .replace("{{previous_description}}", previous_description)
            .replace("{{user_feedback}}", user_feedback)
            .replace("{{scene_context}}", scene_context.unwrap_or("No additional context"))
    }
}

/// Panel Compare Prompt
pub mod panel_compare {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/panel_compare.md"),
        }
    }

    pub fn build(version_a: &str, desc_a: &str, version_b: &str, desc_b: &str) -> String {
        template()
            .replace("{{version_a}}", version_a)
            .replace("{{desc_a}}", desc_a)
            .replace("{{version_b}}", version_b)
            .replace("{{desc_b}}", desc_b)
    }
}

/// Scenario Compare Prompt
pub mod scenario_compare {
    use super::*;

    pub fn template() -> &'static str {
        match PromptVersion::default() {
            PromptVersion::V1 => include_str!("../../prompts/scenario_compare.md"),
        }
    }

    pub fn build(version_a: &str, version_b: &str) -> String {
        template()
            .replace("{{version_a}}", version_a)
            .replace("{{version_b}}", version_b)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_svg_has_viewbox() {
        let prompt = svg_panel::template();
        assert!(prompt.contains("viewBox=\"0 0 640 360\""));
    }

    #[test]
    fn test_svg_has_shot_types() {
        let prompt = svg_panel::template();
        assert!(prompt.contains("EWS"));
        assert!(prompt.contains("WS"));
        assert!(prompt.contains("CU"));
    }

    #[test]
    fn test_batch_has_shot_types() {
        let prompt = batch_panels::template();
        assert!(prompt.contains("EWS"));
        assert!(prompt.contains("shot_type"));
    }

    #[test]
    fn test_script_has_format() {
        let prompt = script_lines::template();
        assert!(prompt.contains("line_type"));
        assert!(prompt.contains("character"));
    }

    #[test]
    fn test_description_has_examples() {
        let prompt = description_enhance::template();
        assert!(prompt.contains("Before") && prompt.contains("After"));
    }

    #[test]
    fn test_svg_build_replaces_placeholders() {
        let result = svg_panel::build("test desc", Some("CU"), &["emotional".to_string()]);
        assert!(result.contains("test desc"));
        assert!(result.contains("CU"));
        assert!(result.contains("emotional"));
    }

    #[test]
    fn test_batch_build_replaces_count() {
        let result = batch_panels::build("desc", None, &[], 6);
        assert!(result.contains("6"));
        assert!(result.contains("varied"));
    }

    #[test]
    fn test_script_build_replaces_slugline() {
        let result = script_lines::build("INT. COFFEE SHOP - DAY");
        assert!(result.contains("INT. COFFEE SHOP - DAY"));
    }

    #[test]
    fn test_description_build_replaces() {
        let result = description_enhance::build("a person walks");
        assert!(result.contains("a person walks"));
    }
}
