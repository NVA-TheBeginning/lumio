use crate::algorithm::{
    MossResult as MossComparisonResult, calculate_jaccard_index,
    compare_documents_moss_like as algorithm_compare_documents_moss_like, generate_byte_kgrams,
};
use crate::project_processor::NormalizedProject;
use crate::project_processor::build_blacklist;
use rustc_hash::FxHashSet;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileComparisonResult {
    pub file1_path: PathBuf,
    pub file2_path: PathBuf,

    pub moss_result: Option<MossComparisonResult>,
    pub rabin_karp_result: Option<RabinKarpComparisonResult>,
    pub size_bytes_a: usize,
    pub lines_a: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectComparisonReport {
    pub project1_id: String,
    pub project2_id: String,
    pub file_to_file_comparisons: Vec<FileComparisonResult>,
    pub whole_project_moss_result: Option<MossComparisonResult>,
    pub whole_project_rabin_karp_result: Option<RabinKarpComparisonResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RabinKarpComparisonResult {
    pub similarity_score: f64,
    pub kgrams_doc1_found: usize,
    pub total_kgrams_doc1: usize,
}

pub fn compare_documents_rabin_karp(
    doc1_content: &str,
    doc2_content: &str,
    k_char: usize,
) -> RabinKarpComparisonResult {
    let doc1_bytes = doc1_content.as_bytes();
    let doc2_bytes = doc2_content.as_bytes();

    if doc1_bytes.is_empty() || doc2_bytes.is_empty() || k_char == 0 {
        return RabinKarpComparisonResult::default();
    }

    let doc1_kgrams = generate_byte_kgrams(doc1_bytes, k_char);
    let doc2_kgrams = generate_byte_kgrams(doc2_bytes, k_char);

    let total_kgrams_doc1 = doc1_kgrams.len();
    let similarity_score = calculate_jaccard_index(&doc1_kgrams, &doc2_kgrams);

    let intersection_size = doc1_kgrams.intersection(&doc2_kgrams).count();

    RabinKarpComparisonResult {
        similarity_score,
        kgrams_doc1_found: intersection_size,
        total_kgrams_doc1,
    }
}
pub const MIN_CHAR_LENGTH_FOR_COMPARISON: usize = 20;
const MIN_LINE_COUNT_FOR_COMPARISON: usize = 3;
const MAX_LENGTH_RATIO_DIFFERENCE: f64 = 10.0;

const DEFAULT_RABIN_KARP_K_CHAR: usize = 25;

pub fn compare_normalized_projects(
    project_a: &NormalizedProject,
    project_b: &NormalizedProject,
) -> ProjectComparisonReport {
    let mut file_comparisons = Vec::new();
    let mut processed_files = FxHashSet::default();

    let blacklisted_files =
        build_blacklist(project_a.files.keys().next().unwrap().parent().unwrap()).unwrap();

    for (path_a, file_a) in &project_a.files {
        let path_a_str = path_a.to_string_lossy();

        if blacklisted_files.contains(&path_a_str.to_string()) {
            continue;
        }

        if processed_files.contains(path_a) {
            continue;
        }

        let mut best_match_score = 0.0;
        let mut best_match_result = None;

        for (path_b, file_b) in &project_b.files {
            if file_a.relative_path.extension() != file_b.relative_path.extension() {
                continue;
            }

            let path_b_str = path_b.to_string_lossy();

            if blacklisted_files.contains(&path_b_str.to_string()) {
                continue;
            }

            if file_a.char_length < MIN_CHAR_LENGTH_FOR_COMPARISON
                || file_b.char_length < MIN_CHAR_LENGTH_FOR_COMPARISON
                || file_a.line_count < MIN_LINE_COUNT_FOR_COMPARISON
                || file_b.line_count < MIN_LINE_COUNT_FOR_COMPARISON
            {
                continue;
            }

            let length_ratio = file_a.char_length as f64 / file_b.char_length as f64;
            if !(1.0 / MAX_LENGTH_RATIO_DIFFERENCE..=MAX_LENGTH_RATIO_DIFFERENCE)
                .contains(&length_ratio)
            {
                continue;
            }

            let moss_result = Some(algorithm_compare_documents_moss_like(
                &file_a.content,
                &file_b.content,
            ));

            let rabin_karp_result = Some(compare_documents_rabin_karp(
                &file_a.content,
                &file_b.content,
                DEFAULT_RABIN_KARP_K_CHAR,
            ));

            let moss_score = moss_result.as_ref().map_or(0.0, |r| r.score);
            let rk_score = rabin_karp_result
                .as_ref()
                .map_or(0.0, |r| r.similarity_score);
            let combined_score = (moss_score * 0.6 + rk_score * 0.4) / 1.0;

            if combined_score > 0.8 {
                processed_files.insert(path_a.clone());
                processed_files.insert(path_b.clone());
                println!(
                    "Found high match ({:.2}%) between {} and {}",
                    combined_score * 100.0,
                    path_a_str,
                    path_b_str
                );
            }

            if combined_score > best_match_score {
                best_match_score = combined_score;
                best_match_result = Some(FileComparisonResult {
                    file1_path: path_a.clone(),
                    file2_path: path_b.clone(),
                    moss_result,
                    rabin_karp_result,
                    size_bytes_a: file_a.char_length,
                    lines_a: file_a.line_count,
                });
            }
        }

        if let Some(best_result) = best_match_result {
            file_comparisons.push(best_result);
        }
    }

    let (whole_project_moss_result, whole_project_rabin_karp_result) = match (
        &project_a.concatenated_source_code,
        &project_b.concatenated_source_code,
    ) {
        (Some(src_a), Some(src_b))
            if src_a.chars().count() >= MIN_CHAR_LENGTH_FOR_COMPARISON
                && src_b.chars().count() >= MIN_CHAR_LENGTH_FOR_COMPARISON =>
        {
            (
                Some(algorithm_compare_documents_moss_like(src_a, src_b)),
                Some(compare_documents_rabin_karp(
                    src_a,
                    src_b,
                    DEFAULT_RABIN_KARP_K_CHAR,
                )),
            )
        }
        _ => (None, None),
    };

    ProjectComparisonReport {
        project1_id: project_a.project_id.clone(),
        project2_id: project_b.project_id.clone(),
        file_to_file_comparisons: file_comparisons,
        whole_project_moss_result,
        whole_project_rabin_karp_result,
    }
}

#[cfg(test)]
mod project_comparison_logic_tests {
    use crate::project_processor::{NormalizedProject, ProcessedFile, SourceLanguage};
    use rustc_hash::FxHashMap;
    use std::path::PathBuf;

    const TEST_MIN_CHARS: usize = 20;
    const TEST_MIN_LINES: usize = 2;
    const TEST_MAX_RATIO: f64 = 5.0;

    fn mock_file(path_str: &str, content: &str) -> (PathBuf, ProcessedFile) {
        let p = PathBuf::from(path_str);
        (
            p.clone(),
            ProcessedFile {
                relative_path: p,
                content: content.to_string(),
                language: SourceLanguage::Text,
                sha1_hash: "mock".to_string(),
                char_length: content.chars().count(),
                line_count: if content.is_empty() {
                    0
                } else {
                    content.lines().count()
                },
            },
        )
    }

    fn get_selected_files_for_comparison(
        project_a: &NormalizedProject,
        project_b: &NormalizedProject,
    ) -> Vec<PathBuf> {
        let mut selected_for_comparison = Vec::new();

        for (path_a, file_a) in &project_a.files {
            if let Some(file_b) = project_b.files.get(path_a) {
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
        let mut files_a: FxHashMap<PathBuf, ProcessedFile> = FxHashMap::default();
        let (path_a, file_obj_a) = mock_file("file.txt", "small");
        files_a.insert(path_a, file_obj_a);
        let mut files_b: FxHashMap<PathBuf, ProcessedFile> = FxHashMap::default();
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
        let mut files_a: FxHashMap<PathBuf, ProcessedFile> = FxHashMap::default();
        let (path_a, file_obj_a) = mock_file("file.txt", "long enough content now\nand two lines");
        files_a.insert(path_a, file_obj_a);
        let mut files_b: FxHashMap<PathBuf, ProcessedFile> = FxHashMap::default();
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

        let mut files_a: FxHashMap<PathBuf, ProcessedFile> = FxHashMap::default();
        let (path_a, file_obj_a) = mock_file("file.txt", content_short);
        files_a.insert(path_a, file_obj_a);
        let mut files_b: FxHashMap<PathBuf, ProcessedFile> = FxHashMap::default();
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

        let mut files_a: FxHashMap<PathBuf, ProcessedFile> = FxHashMap::default();
        let (path_a1, file_obj_a1) = mock_file("file.txt", content1);
        files_a.insert(path_a1, file_obj_a1);
        let mut files_b: FxHashMap<PathBuf, ProcessedFile> = FxHashMap::default();
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
        let mut files_a: FxHashMap<PathBuf, ProcessedFile> = FxHashMap::default();
        let (p_va1, f_va1) = mock_file("valid1.txt", "Content for valid1 in A.\nLine2.");
        files_a.insert(p_va1, f_va1);
        let (p_tsa, f_tsa) = mock_file("too_small.txt", "SmallA");
        files_a.insert(p_tsa, f_tsa);
        let (p_va2, f_va2) = mock_file("valid2.txt", "Content for valid2 in A.\nLine2.");
        files_a.insert(p_va2, f_va2);

        let mut files_b: FxHashMap<PathBuf, ProcessedFile> = FxHashMap::default();
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
