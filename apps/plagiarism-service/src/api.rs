use crate::comparison_orchestrator::{ProjectComparisonReport, compare_normalized_projects};
use crate::project_processor::{NormalizedProject, process_project_folder};
use actix_web::web::{Data, Json};
use actix_web::{HttpResponse, Responder};
use apistos::{ApiComponent, api_operation};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use crate::s3;
use crate::project_processor::get_project_submission_paths;

#[derive(Clone)]
pub struct AppState {
    pub extract_base_path: PathBuf,
}

#[derive(Deserialize, Serialize, JsonSchema, ApiComponent)]
pub struct BodyRequest {
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "promotionId")]
    pub promotion_id: String,
}

#[derive(Serialize, Deserialize, JsonSchema, ApiComponent, Clone)]
pub struct ApiFileComparisonDetail {
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(rename = "fileRelativePath")]
    pub file_relative_path: PathBuf,
    #[serde(rename = "fileSizeBytes")]
    pub file_size_bytes: usize,
    #[serde(rename = "linesOfCode")]
    pub lines_of_code: usize,
    #[serde(rename = "mossScore")]
    pub moss_score: f64,
    #[serde(rename = "rabinKarpScore")]
    pub rabin_karp_score: f64,
    #[serde(rename = "combinedScore")]
    pub combined_score: f64,
    pub flags: Vec<String>,
}

#[derive(Serialize, Deserialize, JsonSchema, ApiComponent, Clone)]
pub struct ApiMatchDetail {
    #[serde(rename = "matchedFolder")]
    pub matched_folder: String,
    #[serde(rename = "overallMatchPercentage")]
    pub overall_match_percentage: f64,
    #[serde(rename = "combinedScore")]
    pub combined_score: f64,
    pub flags: Vec<String>,
    #[serde(rename = "fileComparisons")]
    pub file_comparisons: Vec<ApiFileComparisonDetail>,
}

#[derive(Serialize, Deserialize, JsonSchema, ApiComponent, Clone)]
pub struct ApiFolderResultReport {
    #[serde(rename = "folderName")]
    pub folder_name: String,
    #[serde(rename = "sha1")]
    pub sha1: Option<String>,
    #[serde(rename = "plagiarismPercentage")]
    pub plagiarism_percentage: f64,
    pub matches: Vec<ApiMatchDetail>,
}

#[derive(Serialize, Deserialize, JsonSchema, ApiComponent)]
pub struct ComprehensivePlagiarismResponse {
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "promotionId")]
    pub promotion_id: String,
    #[serde(rename = "folderResults")]
    pub folder_results: Vec<ApiFolderResultReport>,
}

#[derive(Serialize, Deserialize, JsonSchema, ApiComponent, Clone)]
pub struct ApiPlagiarismMatch {
    #[serde(rename = "matchedFolder")]
    pub matched_folder: String,
    #[serde(rename = "matchPercentage")]
    pub match_percentage: f64,
}

#[derive(Serialize, Deserialize, JsonSchema, ApiComponent, Clone)]
pub struct ApiFolderResult {
    #[serde(rename = "folderName")]
    pub folder_name: String,
    #[serde(rename = "sha1")]
    pub sha1: Option<String>,
    #[serde(rename = "overallPlagiarismPercentage")]
    pub overall_plagiarism_percentage: f64,
    pub matches: Vec<ApiPlagiarismMatch>,
}

#[derive(Serialize, Deserialize, JsonSchema, ApiComponent)]
pub struct FinalPlagiarismCheckResponse {
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "promotionId")]
    pub promotion_id: String,
    #[serde(rename = "analysisResults")]
    pub analysis_results: Vec<ApiFolderResult>,
}

#[derive(Serialize, Deserialize, JsonSchema, ApiComponent)]
pub struct TempPlagiarismCheckResponse {
    pub status: String,
    #[serde(rename = "processedSubmissionCount")]
    pub processed_submission_count: usize,
    #[serde(rename = "comparisonPairsProcessed")]
    pub comparison_pairs_processed: usize,
    #[serde(rename = "processedProjectIds")]
    pub processed_project_ids: Vec<String>,
}

fn calculate_combined_score(moss_score: f64, rabin_karp_score: f64) -> f64 {
    // Weight the scores - adjust weights as needed
    const MOSS_WEIGHT: f64 = 0.6;
    const RABIN_KARP_WEIGHT: f64 = 0.4;

    (moss_score * MOSS_WEIGHT + rabin_karp_score * RABIN_KARP_WEIGHT)
        / (MOSS_WEIGHT + RABIN_KARP_WEIGHT)
}

fn generate_file_flags(moss_score: f64, rabin_karp_score: f64) -> Vec<String> {
    let mut flags = Vec::new();

    // High similarity flags
    if moss_score > 80.0 || rabin_karp_score > 80.0 {
        flags.push("HIGH_SIMILARITY".to_string());
    }

    // Significant similarity flags
    if moss_score > 50.0 || rabin_karp_score > 50.0 {
        flags.push("SIGNIFICANT_SIMILARITY".to_string());
    }

    // Algorithm-specific flags
    if moss_score > 70.0 {
        flags.push("HIGH_MOSS_MATCH".to_string());
    }
    if rabin_karp_score > 70.0 {
        flags.push("HIGH_RABIN_KARP_MATCH".to_string());
    }

    flags
}

fn generate_overall_flags(moss_score: f64, rabin_karp_score: f64) -> Vec<String> {
    let mut flags = Vec::new();

    // High overall similarity
    if moss_score > 80.0 && rabin_karp_score > 80.0 {
        flags.push("VERY_HIGH_SIMILARITY".to_string());
    } else if moss_score > 70.0 || rabin_karp_score > 70.0 {
        flags.push("HIGH_SIMILARITY".to_string());
    }

    // Algorithm-specific flags
    if moss_score > 60.0 {
        flags.push("SIGNIFICANT_MOSS_MATCH".to_string());
    }
    if rabin_karp_score > 60.0 {
        flags.push("SIGNIFICANT_RABIN_KARP_MATCH".to_string());
    }

    flags
}

#[api_operation(summary = "Downloads, processes, and compares project submissions for plagiarism.")]
pub async fn checks_projects(body: Json<BodyRequest>, app_state: Data<AppState>) -> impl Responder {
    println!(
        "Received plagiarism check request for Project ID: {}, Promotion ID: {}",
        body.project_id, body.promotion_id
    );

    // --- 1. S3 Fetch and Extraction ---
    let s3_directory_prefix = format!(
        "project-{}/promo-{}/step-999/",
        body.project_id, body.promotion_id
    );
    let base_extract_target_dir = &app_state.extract_base_path;
    println!(
        "Using base extract directory: {:?}",
        base_extract_target_dir
    );

    let s3_file_keys = match s3::list_files_in_directory(&s3_directory_prefix).await {
        Ok(keys) => keys,
        Err(e) => {
            eprintln!(
                "Error listing S3 files for prefix '{}': {}",
                s3_directory_prefix, e
            );
            return HttpResponse::InternalServerError().json(ComprehensivePlagiarismResponse {
                project_id: body.project_id.clone(),
                promotion_id: body.promotion_id.clone(),
                folder_results: vec![],
            });
        }
    };

    let zip_file_keys: Vec<&String> = s3_file_keys
        .iter()
        .filter(|k| k.ends_with(".zip"))
        .collect();
    println!(
        "Found {} S3 files, {} are zips under prefix '{}'.",
        s3_file_keys.len(),
        zip_file_keys.len(),
        s3_directory_prefix
    );

    if zip_file_keys.is_empty() {
        println!("No zip files found in S3 directory for processing.");
        return HttpResponse::Ok().json(ComprehensivePlagiarismResponse {
            project_id: body.project_id.clone(),
            promotion_id: body.promotion_id.clone(),
            folder_results: vec![],
        });
    }

    let mut extracted_submission_details: Vec<(PathBuf, String)> = Vec::new();

    for s3_zip_key in zip_file_keys {
        let zip_file_name_on_s3 = std::path::Path::new(s3_zip_key)
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("unknown_s3_zip_name.zip");

        let submission_id = zip_file_name_on_s3.replace(".zip", "");
        let extract_to_path = base_extract_target_dir.join(&submission_id);

        println!(
            "Processing S3 zip: {} to {}",
            s3_zip_key,
            extract_to_path.display()
        );

        // Cleanup existing directory if it exists
        if extract_to_path.exists() {
            if let Err(e) = std::fs::remove_dir_all(&extract_to_path) {
                eprintln!(
                    "Warning: Failed to remove existing directory {}: {}",
                    extract_to_path.display(),
                    e
                );
            }
        }
        if let Err(e) = std::fs::create_dir_all(&extract_to_path) {
            eprintln!(
                "Failed to create extraction directory {}: {}. Skipping this zip.",
                extract_to_path.display(),
                e
            );
            continue;
        }

        match s3::get_file_from_s3(s3_zip_key).await {
            Ok(zip_data) => {
                let reader = std::io::Cursor::new(zip_data);
                match zip::ZipArchive::new(reader) {
                    Ok(mut archive) => {
                        if let Err(e) = archive.extract(&extract_to_path) {
                            eprintln!(
                                "Failed to extract zip archive {} to {}: {}",
                                s3_zip_key,
                                extract_to_path.display(),
                                e
                            );
                            continue;
                        }
                        println!(
                            "Successfully extracted {} to {}",
                            s3_zip_key,
                            extract_to_path.display()
                        );
                        extracted_submission_details.push((extract_to_path, submission_id));
                    }
                    Err(e) => {
                        eprintln!(
                            "Failed to read zip archive from S3 key {}: {}",
                            s3_zip_key, e
                        );
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to download S3 key {}: {}", s3_zip_key, e);
            }
        }
    }

    if extracted_submission_details.is_empty() {
        println!("No submissions were successfully downloaded and extracted for analysis.");
        return HttpResponse::Ok().json(ComprehensivePlagiarismResponse {
            project_id: body.project_id.clone(),
            promotion_id: body.promotion_id.clone(),
            folder_results: vec![],
        });
    }

    // --- 2. Process Each Extracted Project Folder ---
    let mut normalized_projects: Vec<NormalizedProject> = Vec::new();
    for (folder_path, submission_id) in &extracted_submission_details {
        match process_project_folder(folder_path, submission_id) {
            Ok(norm_proj) => {
                println!(
                    "Processed local folder: {}. Files: {}. Concat available: {}",
                    norm_proj.project_id,
                    norm_proj.files.len(),
                    norm_proj.concatenated_source_code.is_some()
                );
                normalized_projects.push(norm_proj);
            }
            Err(e) => {
                eprintln!(
                    "Error processing project folder '{}': {:?}. Skipping.",
                    folder_path.display(),
                    e
                );
            }
        }
    }

    if normalized_projects.len() < 2 {
        println!(
            "Not enough projects successfully processed for comparison (need at least 2, got {}).",
            normalized_projects.len()
        );
        let mut folder_results_for_single: Vec<ApiFolderResultReport> = Vec::new();
        for np in normalized_projects {
            folder_results_for_single.push(ApiFolderResultReport {
                folder_name: np.project_id,
                sha1: np.concatenated_source_hash,
                plagiarism_percentage: 0.0,
                matches: vec![],
            });
        }
        return HttpResponse::Ok().json(ComprehensivePlagiarismResponse {
            project_id: body.project_id.clone(),
            promotion_id: body.promotion_id.clone(),
            folder_results: folder_results_for_single,
        });
    }

    // --- 3. Pairwise Project Comparisons ---
    let mut comparison_reports: Vec<ProjectComparisonReport> = Vec::new();
    for i in 0..normalized_projects.len() {
        for j in (i + 1)..normalized_projects.len() {
            let proj_a = &normalized_projects[i];
            let proj_b = &normalized_projects[j];
            println!(
                "Comparing project '{}' with project '{}'",
                proj_a.project_id, proj_b.project_id
            );

            let comparison_results = compare_normalized_projects(proj_a, proj_b);
            println!(
                "  -> Found {} file-to-file comparison results.",
                comparison_results.file_to_file_comparisons.len()
            );
            comparison_reports.push(comparison_results);
        }
    }
    println!(
        "Completed {} pairwise project comparisons.",
        comparison_reports.len()
    );

    // --- 4. Aggregate and Format Final API Response ---
    let mut final_folder_results_map: HashMap<String, ApiFolderResultReport> = HashMap::new();

    for np in &normalized_projects {
        final_folder_results_map.insert(
            np.project_id.clone(),
            ApiFolderResultReport {
                folder_name: np.project_id.clone(),
                sha1: np.concatenated_source_hash.clone(),
                plagiarism_percentage: 0.0,
                matches: Vec::new(),
            },
        );
    }

    for report in comparison_reports {
        let overall_moss_score = report
            .whole_project_moss_result
            .as_ref()
            .map_or(0.0, |r| r.score * 100.0);
        let overall_rk_score = report
            .whole_project_rabin_karp_result
            .as_ref()
            .map_or(0.0, |r| r.similarity_score * 100.0);
        let pair_overall_combined_score =
            calculate_combined_score(overall_moss_score, overall_rk_score);
        let pair_overall_flags = generate_overall_flags(overall_moss_score, overall_rk_score);

        // Transform FileComparisonResults to ApiFileComparisonDetail
        let mut api_file_details_for_pair: Vec<ApiFileComparisonDetail> = Vec::new();
        for enriched_file_comp in &report.file_to_file_comparisons {
            let moss_score = enriched_file_comp
                .moss_result
                .as_ref()
                .map_or(0.0, |r| r.score * 100.0);
            let rk_score = enriched_file_comp
                .rabin_karp_result
                .as_ref()
                .map_or(0.0, |r| r.similarity_score * 100.0);
            let combined = calculate_combined_score(moss_score, rk_score);
            let flags = generate_file_flags(moss_score, rk_score);

            api_file_details_for_pair.push(ApiFileComparisonDetail {
                file_name: enriched_file_comp
                    .file1_path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into_owned(),
                file_relative_path: enriched_file_comp.file1_path.clone(),
                file_size_bytes: enriched_file_comp.size_bytes_a,
                lines_of_code: enriched_file_comp.lines_a,
                moss_score,
                rabin_karp_score: rk_score,
                combined_score: combined,
                flags,
            });
        }

        // Update result for project1_id
        if let Some(folder_res_a) = final_folder_results_map.get_mut(&report.project1_id) {
            folder_res_a.matches.push(ApiMatchDetail {
                matched_folder: report.project2_id.clone(),
                overall_match_percentage: pair_overall_combined_score,
                combined_score: pair_overall_combined_score,
                flags: pair_overall_flags.clone(),
                file_comparisons: api_file_details_for_pair.clone(),
            });
            if pair_overall_combined_score > folder_res_a.plagiarism_percentage {
                folder_res_a.plagiarism_percentage = pair_overall_combined_score;
            }
        }

        // Update result for project2_id
        if let Some(folder_res_b) = final_folder_results_map.get_mut(&report.project2_id) {
            folder_res_b.matches.push(ApiMatchDetail {
                matched_folder: report.project1_id.clone(),
                overall_match_percentage: pair_overall_combined_score,
                combined_score: pair_overall_combined_score,
                flags: pair_overall_flags,
                file_comparisons: api_file_details_for_pair,
            });
            if pair_overall_combined_score > folder_res_b.plagiarism_percentage {
                folder_res_b.plagiarism_percentage = pair_overall_combined_score;
            }
        }
    }

    let mut analysis_results_vec: Vec<ApiFolderResultReport> =
        final_folder_results_map.into_values().collect();
    analysis_results_vec.sort_by(|a, b| a.folder_name.cmp(&b.folder_name));

    let final_api_response = ComprehensivePlagiarismResponse {
        project_id: body.project_id.clone(),
        promotion_id: body.promotion_id.clone(),
        folder_results: analysis_results_vec,
    };

    // --- 5. Cleanup extracted folders ---
    for (path_to_clean, _submission_id) in extracted_submission_details {
        if let Err(e) = std::fs::remove_dir_all(&path_to_clean) {
            eprintln!(
                "Failed to cleanup extracted folder {}: {}",
                path_to_clean.display(),
                e
            );
        } else {
            println!("Cleaned up extracted folder: {}", path_to_clean.display());
        }
    }

    HttpResponse::Ok().json(final_api_response)
}
