use actix_web::web::{Data, Json};
use actix_web::{HttpResponse, Responder};
use apistos::{ApiComponent, api_operation};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

use crate::comparison_orchestrator::compare_normalized_projects;
use crate::project_processor::{get_project_submission_paths, process_project_folder};

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

#[api_operation(summary = "Processes submissions and performs pairwise comparisons.")]
pub async fn checks_projects(body: Json<BodyRequest>, app_state: Data<AppState>) -> impl Responder {
    println!(
        "Received plagiarism check request for Project ID: {}, Promotion ID: {}",
        body.project_id, body.promotion_id
    );

    let base_extract_dir = &app_state.extract_base_path;
    println!("Using base extract directory: {:?}", base_extract_dir);

    let submission_paths = match get_project_submission_paths(
        base_extract_dir,
        &body.project_id,
        &body.promotion_id,
    ) {
        Ok(paths) => paths,
        Err(e) => {
            println!("Error getting project submission paths: {}", e);
            return HttpResponse::InternalServerError().json(FinalPlagiarismCheckResponse {
                project_id: body.project_id.clone(),
                promotion_id: body.promotion_id.clone(),
                analysis_results: Vec::new(),
            });
        }
    };

    println!(
        "Found {} submission entries to process.",
        submission_paths.len()
    );

    let mut normalized_projects = Vec::new();
    for (path, project_id) in submission_paths {
        println!("Processing submission: {} (path: {:?})", project_id, path);
        match process_project_folder(&path, &project_id) {
            Ok(normalized_project) => {
                println!(
                    "Successfully processed submission '{}'. Files found: {}. Concatenated source available: {}",
                    project_id,
                    normalized_project.files.len(),
                    normalized_project.concatenated_source_code.is_some()
                );
                normalized_projects.push(normalized_project);
            }
            Err(e) => {
                println!("Error processing submission {}: {:?}", project_id, e);
            }
        }
    }

    println!(
        "Total normalized projects ready for comparison: {}",
        normalized_projects.len()
    );

    let mut comparison_reports = Vec::new();
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

    let mut final_results_map: HashMap<String, ApiFolderResult> = HashMap::new();
    for np in &normalized_projects {
        final_results_map.insert(
            np.project_id.clone(),
            ApiFolderResult {
                folder_name: np.project_id.clone(),
                sha1: np.concatenated_source_hash.clone(),
                overall_plagiarism_percentage: 0.0,
                matches: Vec::new(),
            },
        );
    }

    for report in comparison_reports {
        let pair_match_percentage = report
            .whole_project_moss_result
            .as_ref()
            .map_or(0.0, |moss_res| moss_res.score * 100.0);

        if let Some(folder_res_a) = final_results_map.get_mut(&report.project1_id) {
            folder_res_a.matches.push(ApiPlagiarismMatch {
                matched_folder: report.project2_id.clone(),
                match_percentage: pair_match_percentage,
            });
            if pair_match_percentage > folder_res_a.overall_plagiarism_percentage {
                folder_res_a.overall_plagiarism_percentage = pair_match_percentage;
            }
        }

        if let Some(folder_res_b) = final_results_map.get_mut(&report.project2_id) {
            folder_res_b.matches.push(ApiPlagiarismMatch {
                matched_folder: report.project1_id.clone(),
                match_percentage: pair_match_percentage,
            });
            if pair_match_percentage > folder_res_b.overall_plagiarism_percentage {
                folder_res_b.overall_plagiarism_percentage = pair_match_percentage;
            }
        }
    }

    let mut analysis_results_vec: Vec<ApiFolderResult> = final_results_map.into_values().collect();
    analysis_results_vec.sort_by(|a, b| a.folder_name.cmp(&b.folder_name));

    let final_response = FinalPlagiarismCheckResponse {
        project_id: body.project_id.clone(),
        promotion_id: body.promotion_id.clone(),
        analysis_results: analysis_results_vec,
    };

    HttpResponse::Ok().json(final_response)
}
