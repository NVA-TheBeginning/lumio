use actix_web::Error;
use actix_web::web::Json;
use apistos::actix::CreatedJson;
use apistos::{ApiComponent, api_operation};
use rand::Rng;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::path::Path;

use crate::s3::{get_file_from_s3, list_files_in_directory};

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct BodyRequest {
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "promotionId")]
    pub promotion_id: String,
}

#[derive(Serialize, Deserialize, JsonSchema, ApiComponent)]
pub struct FolderPlagiarismResult {
    #[serde(rename = "folderName")]
    pub folder_name: String,
    #[serde(rename = "plagiarismPercentage")]
    pub plagiarism_percentage: f64,
}

#[derive(Serialize, Deserialize, JsonSchema, ApiComponent)]
pub struct PlagiarismCheckResponse {
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "promotionId")]
    pub promotion_id: String,
    #[serde(rename = "folderResults")]
    pub folder_results: Vec<FolderPlagiarismResult>,
}

#[api_operation(summary = "Checks for plagiarism for a given project and promotion")]
pub(crate) async fn checks_projects(
    body: Json<BodyRequest>,
) -> Result<CreatedJson<PlagiarismCheckResponse>, Error> {
    let s3_directory = format!(
        "project-{}/promo-{}/step-999/", // @TODO: Replace with actual step
        body.project_id, body.promotion_id
    );

    let base_extract_dir = Path::new("./extract");
    let mut extracted_dirs_to_clean = Vec::new();
    let mut extracted_folder_names = Vec::new();

    if let Err(e) = std::fs::create_dir_all(base_extract_dir) {
        println!("Failed to create base extraction directory: {}", e);
    }

    let files = match list_files_in_directory(&s3_directory).await {
        Ok(files) => {
            println!("Found {} files in {}", files.len(), s3_directory);
            files
        }
        Err(e) => {
            println!("Error listing files: {:?}", e);
            Vec::new()
        }
    };

    let zip_files: Vec<&String> = files.iter().filter(|f| f.ends_with(".zip")).collect();

    if zip_files.is_empty() {
        println!("No zip files found in directory");
    } else {
        println!("Found {} zip files", zip_files.len());

        for zip_file_key in zip_files {
            println!("Processing zip file: {}", zip_file_key);

            let zip_file_name = Path::new(zip_file_key)
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("unknown_zip");

            let folder_name = zip_file_name.replace(".zip", "");
            let extract_dir = base_extract_dir.join(&folder_name);

            if let Err(e) = std::fs::create_dir_all(&extract_dir) {
                println!(
                    "Failed to create extraction directory {}: {}",
                    extract_dir.display(),
                    e
                );
                continue;
            }
            extracted_dirs_to_clean.push(extract_dir.clone());
            extracted_folder_names.push(folder_name);

            let zip_data = match get_file_from_s3(zip_file_key).await {
                Ok(data) => data,
                Err(e) => {
                    println!("Failed to download zip file {}: {}", zip_file_key, e);
                    if let Err(e) = std::fs::remove_dir_all(&extract_dir) {
                        println!("Failed to clean up extraction directory: {}", e);
                    }
                    continue;
                }
            };

            let temp_zip_path = format!("./{}.zip", &zip_file_name);
            if let Err(e) = std::fs::write(&temp_zip_path, &zip_data) {
                println!("Failed to save temporary zip file: {}", e);
                if let Err(e) = std::fs::remove_dir_all(&extract_dir) {
                    println!("Failed to clean up extraction directory: {}", e);
                }
                continue;
            }

            let file = match std::fs::File::open(&temp_zip_path) {
                Ok(file) => file,
                Err(e) => {
                    println!("Failed to open saved zip: {}", e);
                    if let Err(e) = std::fs::remove_file(&temp_zip_path) {
                        println!("Failed to remove temporary zip file: {}", e);
                    }
                    if let Err(e) = std::fs::remove_dir_all(&extract_dir) {
                        println!("Failed to clean up extraction directory: {}", e);
                    }
                    continue;
                }
            };

            let mut archive = match zip::ZipArchive::new(file) {
                Ok(archive) => archive,
                Err(e) => {
                    println!("Failed to parse zip archive: {}", e);
                    if let Err(e) = std::fs::remove_file(&temp_zip_path) {
                        println!("Failed to remove temporary zip file: {}", e);
                    }
                    if let Err(e) = std::fs::remove_dir_all(&extract_dir) {
                        println!("Failed to clean up extraction directory: {}", e);
                    }
                    continue;
                }
            };

            for i in 0..archive.len() {
                let mut file = match archive.by_index(i) {
                    Ok(file) => file,
                    Err(e) => {
                        println!("Failed to get file from archive: {}", e);
                        continue;
                    }
                };
                let outpath = extract_dir.join(file.name());

                if file.name().ends_with('/') {
                    if let Err(e) = std::fs::create_dir_all(&outpath) {
                        println!("Failed to create directory {}: {}", outpath.display(), e);
                    }
                } else {
                    if let Some(p) = outpath.parent() {
                        if !p.exists() {
                            if let Err(e) = std::fs::create_dir_all(p) {
                                println!("Failed to create parent directory: {}", e);
                            }
                        }
                    }

                    let mut outfile = match std::fs::File::create(&outpath) {
                        Ok(file) => file,
                        Err(e) => {
                            println!("Failed to create file {}: {}", outpath.display(), e);
                            continue;
                        }
                    };

                    if let Err(e) = std::io::copy(&mut file, &mut outfile) {
                        println!("Failed to write file content: {}", e);
                    }
                }
            }

            println!(
                "Successfully extracted {} to {}",
                zip_file_key,
                extract_dir.display()
            );

            // Clean up the temporary zip file
            if let Err(e) = std::fs::remove_file(&temp_zip_path) {
                println!("Failed to remove temporary zip file: {}", e);
            }
        }
    }

    // MOCKING: Generate random plagiarism percentages for each extracted folder
    let mut rng = rand::rng();
    let folder_results: Vec<FolderPlagiarismResult> = extracted_folder_names
        .into_iter()
        .map(|folder_name| FolderPlagiarismResult {
            folder_name,
            plagiarism_percentage: rng.random_range(0.0..100.0),
        })
        .collect();

    for dir in extracted_dirs_to_clean {
        if let Err(e) = std::fs::remove_dir_all(&dir) {
            println!(
                "Failed to clean up extraction directory {}: {}",
                dir.display(),
                e
            );
        } else {
            println!("Cleaned up extraction directory: {}", dir.display());
        }
    }

    let response = PlagiarismCheckResponse {
        project_id: body.project_id.clone(),
        promotion_id: body.promotion_id.clone(),
        folder_results,
    };

    Ok(CreatedJson(response))
}
