// src/comparison_orchestrator.rs
use crate::algorithm::{
    MossResult as MossComparisonResult,
    compare_documents_moss_like as algorithm_compare_documents_moss_like,
};
use crate::project_processor::NormalizedProject;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileComparisonResult {
    pub file1_path: PathBuf,
    pub moss_result: Option<MossComparisonResult>,
    pub rabin_karp_result: Option<RabinKarpComparisonResult>, // Placeholder struct
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectComparisonReport {
    pub project1_id: String,
    pub project2_id: String,
    pub file_to_file_comparisons: Vec<FileComparisonResult>,
    pub whole_project_moss_result: Option<MossComparisonResult>,
    pub whole_project_rabin_karp_result: Option<RabinKarpComparisonResult>, // Placeholder struct
}

// --- Placeholder for RabinKarpComparisonResult ---
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RabinKarpComparisonResult {
    pub similarity_score: f64,
    // Add other relevant fields based on your actual Rabin-Karp logic
    pub kgrams_doc1_found: usize,
    pub total_kgrams_doc1: usize,
}

// --- Placeholder for compare_documents_rabin_karp ---
#[allow(unused_variables)]
pub fn compare_documents_rabin_karp(
    doc1_content: &str,
    doc2_content: &str,
    k_char: usize,
) -> RabinKarpComparisonResult {
    // In a real implementation, this would perform Rabin-Karp comparison
    // For now, returning a default/mock result
    println!(
        "Placeholder: compare_documents_rabin_karp called for k_char: {}",
        k_char
    );
    RabinKarpComparisonResult {
        similarity_score: 0.0, // Default placeholder value
        kgrams_doc1_found: 0,
        total_kgrams_doc1: 0,
    }
}

// --- Actual Thresholds ---
const MIN_CHAR_LENGTH_FOR_COMPARISON: usize = 50;
const MIN_LINE_COUNT_FOR_COMPARISON: usize = 3;
const MAX_LENGTH_RATIO_DIFFERENCE: f64 = 10.0;

// --- Default Algorithm Parameters ---
const DEFAULT_MOSS_K_TOKEN: usize = 4;
const DEFAULT_MOSS_WINDOW_SIZE: usize = 5;
const DEFAULT_RABIN_KARP_K_CHAR: usize = 25;

pub fn compare_normalized_projects(
    project_a: &NormalizedProject,
    project_b: &NormalizedProject,
    // Optional: Pass thresholds and algo params as arguments for more flexibility
    // min_chars: usize, min_lines: usize, max_ratio: f64,
    // moss_k: usize, moss_w: usize, rk_k: usize,
) -> ProjectComparisonReport {
    let mut file_comparisons = Vec::new();

    for (relative_path_a, file_a) in &project_a.files {
        if let Some(file_b) = project_b.files.get(relative_path_a) {
            if file_a.char_length < MIN_CHAR_LENGTH_FOR_COMPARISON
                || file_b.char_length < MIN_CHAR_LENGTH_FOR_COMPARISON
                || file_a.line_count < MIN_LINE_COUNT_FOR_COMPARISON
                || file_b.line_count < MIN_LINE_COUNT_FOR_COMPARISON
            {
                continue;
            }

            let len_a = file_a.char_length as f64;
            let len_b = file_b.char_length as f64;
            if len_a > 0.0 && len_b > 0.0 {
                let ratio = if len_a > len_b {
                    len_a / len_b
                } else {
                    len_b / len_a
                };
                if ratio > MAX_LENGTH_RATIO_DIFFERENCE {
                    continue;
                }
            }

            let moss_res = compare_documents_moss_like(&file_a.content, &file_b.content);
            let rk_res = compare_documents_rabin_karp(
                &file_a.content,
                &file_b.content,
                DEFAULT_RABIN_KARP_K_CHAR,
            );

            file_comparisons.push(FileComparisonResult {
                file1_path: relative_path_a.clone(),
                moss_result: Some(moss_res),
                rabin_karp_result: Some(rk_res),
            });
        }
    }

    let mut whole_project_moss_res: Option<MossComparisonResult> = None;
    let mut whole_project_rk_res: Option<RabinKarpComparisonResult> = None;

    if let (Some(src_a), Some(src_b)) = (
        &project_a.concatenated_source_code,
        &project_b.concatenated_source_code,
    ) {
        println!(
            "DEBUG: Concatenated A (len {}): [{}]",
            src_a.chars().count(),
            src_a
        );
        println!(
            "DEBUG: Concatenated B (len {}): [{}]",
            src_b.chars().count(),
            src_b
        );

        if src_a.chars().count() >= MIN_CHAR_LENGTH_FOR_COMPARISON
            && src_b.chars().count() >= MIN_CHAR_LENGTH_FOR_COMPARISON
        {
            println!(
                "DEBUG: Concatenated strings passed length check for whole project comparison."
            );
            whole_project_moss_res = Some(compare_documents_moss_like(src_a, src_b));
            whole_project_rk_res = Some(compare_documents_rabin_karp(
                src_a,
                src_b,
                DEFAULT_RABIN_KARP_K_CHAR,
            ));
        } else {
            println!(
                "DEBUG: Concatenated strings SKIPPED length check. A_len: {}, B_len: {}, Min_len: {}",
                src_a.chars().count(),
                src_b.chars().count(),
                MIN_CHAR_LENGTH_FOR_COMPARISON
            );
        }
    }

    ProjectComparisonReport {
        project1_id: project_a.project_id.clone(),
        project2_id: project_b.project_id.clone(),
        file_to_file_comparisons: file_comparisons,
        whole_project_moss_result: whole_project_moss_res,
        whole_project_rabin_karp_result: whole_project_rk_res,
    }
}

pub fn compare_documents_moss_like(doc1: &str, doc2: &str) -> MossComparisonResult {
    algorithm_compare_documents_moss_like(doc1, doc2)
}

#[cfg(test)]
mod project_comparison_logic_tests {
    // Imports structs and functions from the parent module
    use crate::project_processor::{NormalizedProject, ProcessedFile, SourceLanguage};
    use std::collections::HashMap;
    use std::path::PathBuf;

    // --- Thresholds for these specific tests ---
    const TEST_MIN_CHARS: usize = 20;
    const TEST_MIN_LINES: usize = 2;
    const TEST_MAX_RATIO: f64 = 5.0;

    // --- Mocking Utilities ---
    fn mock_file(path_str: &str, content: &str) -> (PathBuf, ProcessedFile) {
        let p = PathBuf::from(path_str);
        (
            p.clone(),
            ProcessedFile {
                relative_path: p,
                content: content.to_string(),
                language: SourceLanguage::Text, // Default for mock
                sha1_hash: "mock".to_string(),
                char_length: content.chars().count(),
                // Consistent line counting: empty string has 0 lines, otherwise count based on .lines()
                line_count: if content.is_empty() {
                    0
                } else {
                    content.lines().count()
                },
            },
        )
    }

    // Simplified version of the comparison orchestrator for testing skipping logic.
    // It returns a list of relative paths of files that were *selected* for comparison.
    fn get_selected_files_for_comparison(
        project_a: &NormalizedProject,
        project_b: &NormalizedProject,
    ) -> Vec<PathBuf> {
        let mut selected_for_comparison = Vec::new();

        for (path_a, file_a) in &project_a.files {
            if let Some(file_b) = project_b.files.get(path_a) {
                // Apply skipping logic using TEST constants
                if file_a.char_length < TEST_MIN_CHARS
                    || file_b.char_length < TEST_MIN_CHARS
                    || file_a.line_count < TEST_MIN_LINES
                    || file_b.line_count < TEST_MIN_LINES
                {
                    continue;
                }

                let len_a = file_a.char_length as f64;
                let len_b = file_b.char_length as f64;
                if len_a > 0.0 && len_b > 0.0 {
                    let ratio = if len_a > len_b {
                        len_a / len_b
                    } else {
                        len_b / len_a
                    };
                    if ratio > TEST_MAX_RATIO {
                        continue;
                    }
                }
                selected_for_comparison.push(path_a.clone());
            }
        }
        selected_for_comparison
    }

    #[test]
    fn test_skips_if_file_a_too_small_chars() {
        let mut files_a: HashMap<PathBuf, ProcessedFile> = HashMap::new();
        let (path_a, file_obj_a) = mock_file("file.txt", "small");
        files_a.insert(path_a, file_obj_a);
        let mut files_b: HashMap<PathBuf, ProcessedFile> = HashMap::new();
        let (path_b, file_obj_b) = mock_file("file.txt", "long enough content now\nand two lines");
        files_b.insert(path_b, file_obj_b);

        let proj_a = NormalizedProject {
            project_id: "A".into(),
            files: files_a,
            concatenated_source_code: None,
            concatenated_source_hash: None,
        };
        let proj_b = NormalizedProject {
            project_id: "B".into(),
            files: files_b,
            concatenated_source_code: None,
            concatenated_source_hash: None,
        };

        let selected = get_selected_files_for_comparison(&proj_a, &proj_b);
        assert!(
            selected.is_empty(),
            "Should skip if file_a char_length is too small"
        );
    }

    #[test]
    fn test_skips_if_file_b_too_small_lines() {
        let mut files_a: HashMap<PathBuf, ProcessedFile> = HashMap::new();
        let (path_a, file_obj_a) = mock_file("file.txt", "long enough content now\nand two lines");
        files_a.insert(path_a, file_obj_a);
        let mut files_b: HashMap<PathBuf, ProcessedFile> = HashMap::new();
        let (path_b, file_obj_b) = mock_file("file.txt", "long enough but 1 line");
        files_b.insert(path_b, file_obj_b);

        let proj_a = NormalizedProject {
            project_id: "A".into(),
            files: files_a,
            concatenated_source_code: None,
            concatenated_source_hash: None,
        };
        let proj_b = NormalizedProject {
            project_id: "B".into(),
            files: files_b,
            concatenated_source_code: None,
            concatenated_source_hash: None,
        };

        let selected = get_selected_files_for_comparison(&proj_a, &proj_b);
        assert!(
            selected.is_empty(),
            "Should skip if file_b line_count is too small"
        );
    }

    #[test]
    fn test_skips_if_disparate_length_ratio() {
        let content_short = "This content is just fine for min length and lines.\nLine 2 here.";
        let char_count_long =
            (content_short.chars().count() as f64 * (TEST_MAX_RATIO + 1.0)) as usize;
        let content_long = "L".repeat(char_count_long);

        let mut files_a: HashMap<PathBuf, ProcessedFile> = HashMap::new();
        let (path_a, file_obj_a) = mock_file("file.txt", content_short);
        files_a.insert(path_a, file_obj_a);
        let mut files_b: HashMap<PathBuf, ProcessedFile> = HashMap::new();
        let (path_b, file_obj_b) = mock_file("file.txt", &content_long);
        files_b.insert(path_b, file_obj_b);

        let proj_a = NormalizedProject {
            project_id: "A".into(),
            files: files_a,
            concatenated_source_code: None,
            concatenated_source_hash: None,
        };
        let proj_b = NormalizedProject {
            project_id: "B".into(),
            files: files_b,
            concatenated_source_code: None,
            concatenated_source_hash: None,
        };

        let selected = get_selected_files_for_comparison(&proj_a, &proj_b);
        assert!(
            selected.is_empty(),
            "Should skip due to disparate length ratio"
        );
    }

    #[test]
    fn test_compares_if_lengths_are_valid_and_similar_ratio() {
        let content1 = "This is document one, suitable for comparison.\nIt has multiple lines.";
        let content2 = "This is document two, also suitable for comparison.\nAlso has many lines.";

        let mut files_a: HashMap<PathBuf, ProcessedFile> = HashMap::new();
        let (path_a1, file_obj_a1) = mock_file("file.txt", content1);
        files_a.insert(path_a1, file_obj_a1);
        let mut files_b: HashMap<PathBuf, ProcessedFile> = HashMap::new();
        let (path_b1, file_obj_b1) = mock_file("file.txt", content2);
        files_b.insert(path_b1, file_obj_b1);

        let proj_a = NormalizedProject {
            project_id: "A".into(),
            files: files_a,
            concatenated_source_code: None,
            concatenated_source_hash: None,
        };
        let proj_b = NormalizedProject {
            project_id: "B".into(),
            files: files_b,
            concatenated_source_code: None,
            concatenated_source_hash: None,
        };

        let selected = get_selected_files_for_comparison(&proj_a, &proj_b);
        assert_eq!(selected.len(), 1);
        assert_eq!(selected[0], PathBuf::from("file.txt"));
    }

    #[test]
    fn test_compares_multiple_valid_files_and_skips_one() {
        let mut files_a: HashMap<PathBuf, ProcessedFile> = HashMap::new();
        let (p_va1, f_va1) = mock_file("valid1.txt", "Content for valid1 in A.\nLine2.");
        files_a.insert(p_va1, f_va1);
        let (p_tsa, f_tsa) = mock_file("too_small.txt", "SmallA");
        files_a.insert(p_tsa, f_tsa);
        let (p_va2, f_va2) = mock_file("valid2.txt", "Content for valid2 in A.\nLine2.");
        files_a.insert(p_va2, f_va2);

        let mut files_b: HashMap<PathBuf, ProcessedFile> = HashMap::new();
        let (p_vb1, f_vb1) = mock_file("valid1.txt", "Content for valid1 in B.\nLine2.");
        files_b.insert(p_vb1, f_vb1);
        let (p_tsb, f_tsb) = mock_file(
            "too_small.txt",
            "Content for too_small in B, but A's version is too small.\nLine2.",
        );
        files_b.insert(p_tsb, f_tsb);
        let (p_vb2, f_vb2) = mock_file("valid2.txt", "Content for valid2 in B.\nLine2.");
        files_b.insert(p_vb2, f_vb2);
        let (p_ob, f_ob) = mock_file("only_in_b.txt", "This file only exists in B.\nLine2.");
        files_b.insert(p_ob, f_ob);

        let proj_a = NormalizedProject {
            project_id: "A".into(),
            files: files_a,
            concatenated_source_code: None,
            concatenated_source_hash: None,
        };
        let proj_b = NormalizedProject {
            project_id: "B".into(),
            files: files_b,
            concatenated_source_code: None,
            concatenated_source_hash: None,
        };

        let mut selected = get_selected_files_for_comparison(&proj_a, &proj_b);
        selected.sort();

        assert_eq!(
            selected.len(),
            2,
            "Expected 2 files to be selected for comparison"
        );
        assert_eq!(selected[0], PathBuf::from("valid1.txt"));
        assert_eq!(selected[1], PathBuf::from("valid2.txt"));
    }
}
