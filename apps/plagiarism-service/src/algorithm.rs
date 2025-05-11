use rand::Rng;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use std::collections::HashMap;
use std::fmt;
use std::fs;
use std::io;
use std::path::Path;


#[derive(Debug)]
pub enum AlgorithmError {
    Io(io::Error),
    Sha1Error(String),
    DirectoryListing(String),
}

impl fmt::Display for AlgorithmError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AlgorithmError::Io(err) => write!(f, "I/O error: {}", err),
            AlgorithmError::Sha1Error(msg) => write!(f, "SHA1 hashing error: {}", msg),
            AlgorithmError::DirectoryListing(msg) => write!(f, "Directory listing error: {}", msg),
        }
    }
}

impl From<io::Error> for AlgorithmError {
    fn from(err: io::Error) -> AlgorithmError {
        AlgorithmError::Io(err)
    }
}

#[derive(Serialize, Deserialize, JsonSchema, Clone)]
pub struct FolderPlagiarismDetail {
    #[serde(rename = "folderName")]
    pub folder_name: String,
    #[serde(rename = "sha1")]
    pub sha1: String,
    #[serde(rename = "plagiarismPercentage")]
    pub plagiarism_percentage: f64,
    #[serde(rename = "matches")]
    pub matches: Vec<PlagiarismMatch>,
}

#[derive(Serialize, Deserialize, JsonSchema, Clone)]
pub struct PlagiarismMatch {
    #[serde(rename = "matchedFolder")]
    pub matched_folder: String,
    #[serde(rename = "matchPercentage")]
    pub match_percentage: f64,
    #[serde(rename = "matchFrequency")]
    pub match_frequency: f64
}

#[derive(Serialize, Deserialize, JsonSchema, Clone)]
pub struct PlagiarismAlgorithmResponse {
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "promotionId")]
    pub promotion_id: String,
    #[serde(rename = "folderResults")]
    pub folder_results: Vec<FolderPlagiarismDetail>,
}
fn calculate_directory_sha1(dir_path: &Path) -> Result<String, AlgorithmError> {
    let mut hasher = Sha1::new();

    // Walk the directory
    for entry in fs::read_dir(dir_path)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() {
            let mut file = fs::File::open(&path)?;
            io::copy(&mut file, &mut hasher)?;
        } else if path.is_dir() {
            let sub_hash = calculate_directory_sha1(&path)?;
            hasher.update(sub_hash.as_bytes());
        }
        // Note: We are intentionally not hashing directory names or file metadata directly,
        // only the content of files. You might adjust this based on your needs.
    }

    Ok(format!("{:x}", hasher.finalize()))
}

fn calculate_char_frequency(content: &str) -> HashMap<char, usize> {
    let mut frequency_map = HashMap::new();
    for ch in content.chars() {
        *frequency_map.entry(ch).or_insert(0) += 1;
    }
    frequency_map
}

fn compare_frequencies(
    freq1: &HashMap<char, usize>,
    freq2: &HashMap<char, usize>,
) -> f64 {
    let mut total = 0;
    let mut match_count = 0;

    for (ch, count1) in freq1 {
        total += count1;
        if let Some(count2) = freq2.get(ch) {
            match_count += count1.min(count2);
        }
    }

    if total == 0 {
        0.0
    } else {
        (match_count as f64 / total as f64) * 100.0
    }
}

pub fn run_plagiarism_check(
    project_id: String,
    promotion_id: String,
    base_extract_dir: &Path,
) -> Result<PlagiarismAlgorithmResponse, AlgorithmError> {
    let mut folder_details: Vec<FolderPlagiarismDetail> = Vec::new();
    let mut folder_frequencies: HashMap<String, HashMap<char, usize>> = HashMap::new();

    let entries = fs::read_dir(base_extract_dir).map_err(|e| {
        AlgorithmError::DirectoryListing(format!("Failed to read base extraction directory: {}", e))
    })?;

    for entry in entries {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            if let Some(folder_name) = path.file_name().and_then(|name| name.to_str()) {
                println!("Processing folder: {}", folder_name);
                match calculate_directory_sha1(&path) {
                    Ok(hash) => {
                        println!("SHA1 for {} is: {}", folder_name, hash);
                        let mut folder_content = String::new();

                        // Read all files in the folder to calculate character frequency
                        for file_entry in fs::read_dir(&path)? {
                            let file_entry = file_entry?;
                            if file_entry.path().is_file() {
                                if let Ok(content) = fs::read_to_string(file_entry.path()) {
                                    folder_content.push_str(&content);
                                }
                            }
                        }

                        let frequency = calculate_char_frequency(&folder_content);
                        folder_frequencies.insert(folder_name.to_string(), frequency);

                        folder_details.push(FolderPlagiarismDetail {
                            folder_name: folder_name.to_string(),
                            sha1: hash,
                            plagiarism_percentage: 0.0,
                            matches: Vec::new(),
                        });
                    }
                    Err(e) => {
                        println!("Failed to process folder {}: {}", folder_name, e);
                    }
                }
            }
        }
    }

    for i in 0..folder_details.len() {
        let current_folder_name = folder_details[i].folder_name.clone();
        let current_folder_sha1 = folder_details[i].sha1.clone();
        let current_frequency = folder_frequencies.get(&current_folder_name).unwrap();
        let mut matches = Vec::new();
        let mut total_match_percentage = 0.0;
        let mut match_count = 0;

        for j in 0..folder_details.len() {
            if i != j {
                let other_folder_name = folder_details[j].folder_name.clone();
                let other_folder_sha1 = folder_details[j].sha1.clone();
                let other_frequency = folder_frequencies.get(&other_folder_name).unwrap();

                // Compare SHA1 and frequencies
                let sha1_match_percentage = if current_folder_sha1 == other_folder_sha1 {
                    100.0
                } else {
                    0.0
                };

                let frequency_match_percentage =
                    compare_frequencies(current_frequency, other_frequency);

                let match_percentage = (sha1_match_percentage + frequency_match_percentage) / 2.0;

                if match_percentage > 0.0 {
                    matches.push(PlagiarismMatch {
                        matched_folder: other_folder_name.clone(),
                        match_percentage,
                        match_frequency: frequency_match_percentage,
                    });
                    total_match_percentage += match_percentage;
                    match_count += 1;
                }
            }
        }

        folder_details[i].matches = matches;

        folder_details[i].plagiarism_percentage = if match_count > 0 {
            total_match_percentage / match_count as f64
        } else {
            0.0
        };
    }

    Ok(PlagiarismAlgorithmResponse {
        project_id,
        promotion_id,
        folder_results: folder_details,
    })
}