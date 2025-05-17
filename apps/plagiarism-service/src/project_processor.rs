use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1}; // Added for calculate_file_sha1
use std::collections::HashMap;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

// Basic SourceLanguage enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SourceLanguage {
    Rust,
    Python,
    Text,
    Unknown,
}

// ProcessedFile struct with char_length and line_count
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedFile {
    pub relative_path: PathBuf,
    pub content: String,
    pub language: SourceLanguage,
    pub sha1_hash: String,
    pub char_length: usize,
    pub line_count: usize,
}

// Basic NormalizedProject struct
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NormalizedProject {
    pub project_id: String,
    pub files: HashMap<PathBuf, ProcessedFile>,
    pub concatenated_source_code: Option<String>,
    pub concatenated_source_hash: Option<String>,
}

// Basic Error type for process_project_folder
#[derive(Debug)]
pub enum ProjectProcessorError {
    IoError(()),
    WalkDirError(()),
}

impl From<io::Error> for ProjectProcessorError {
    fn from(_err: io::Error) -> Self {
        ProjectProcessorError::IoError(())
    }
}

impl From<walkdir::Error> for ProjectProcessorError {
    fn from(_err: walkdir::Error) -> Self {
        ProjectProcessorError::WalkDirError(())
    }
}

// Placeholder for calculate_file_sha1
fn calculate_file_sha1(content: &str) -> String {
    let mut hasher = Sha1::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

// detect_language placeholder
fn detect_language(path: &Path) -> SourceLanguage {
    match path.extension().and_then(|ext| ext.to_str()) {
        Some("rs") => SourceLanguage::Rust,
        Some("py") => SourceLanguage::Python,
        Some("txt") => SourceLanguage::Text,
        _ => SourceLanguage::Unknown,
    }
}

pub fn process_project_folder(
    project_path: &Path,
    project_id_str: &str,
) -> Result<NormalizedProject, ProjectProcessorError> {
    let mut files_map = HashMap::new();
    let mut source_files_for_concatenation: Vec<(PathBuf, String)> = Vec::new();

    for entry in walkdir::WalkDir::new(project_path).into_iter() {
        let entry = entry?;
        let path = entry.path();
        if path.is_file() {
            let relative_path = match path.strip_prefix(project_path) {
                Ok(p) => p.to_path_buf(),
                Err(_) => continue,
            };

            // Basic ignore for common VCS and build directories
            if relative_path.components().any(|comp| {
                let s = comp.as_os_str();
                s == ".git" || s == "target" || s == ".svn" || s == ".hg"
            }) {
                continue;
            }

            let language = detect_language(path);

            match fs::read_to_string(path) {
                Ok(content) => {
                    let sha1_hash = calculate_file_sha1(&content);
                    let char_length = content.chars().count();
                    let line_count = content.lines().count();

                    let processed_file = ProcessedFile {
                        relative_path: relative_path.clone(),
                        content: content.clone(),
                        language: language.clone(),
                        sha1_hash,
                        char_length,
                        line_count,
                    };
                    files_map.insert(relative_path.clone(), processed_file);

                    match language {
                        SourceLanguage::Rust | SourceLanguage::Python => {
                            source_files_for_concatenation.push((relative_path, content));
                        }
                        _ => {
                            // Skip Text and Unknown files for concatenation
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Warning: Failed to read file {:?}: {}. Skipping.", path, e);
                }
            }
        }
    }

    let (final_concatenated_code, final_concatenated_hash) =
        if !source_files_for_concatenation.is_empty() {
            source_files_for_concatenation.sort_by(|a, b| a.0.cmp(&b.0));

            let concatenated_string = source_files_for_concatenation
                .into_iter()
                .map(|(_path, content)| content)
                .collect::<Vec<String>>()
                .join("\n\n---FILE_SEPARATOR---\n\n");

            let hash = calculate_file_sha1(&concatenated_string);
            (Some(concatenated_string), Some(hash))
        } else {
            (None, None)
        };

    Ok(NormalizedProject {
        project_id: project_id_str.to_string(),
        files: files_map,
        concatenated_source_code: final_concatenated_code,
        concatenated_source_hash: final_concatenated_hash,
    })
}

pub fn get_project_submission_paths(
    base_extract_dir: &Path,
    _project_id: &str, // Not directly used for filtering if base_extract_dir is assumed to be pre-filtered
    _promotion_id: &str, // Same as above
) -> io::Result<Vec<(PathBuf, String)>> {
    let mut submission_paths = Vec::new();

    if !base_extract_dir.exists() || !base_extract_dir.is_dir() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!(
                "Base extraction directory not found or not a directory: {}",
                base_extract_dir.display()
            ),
        ));
    }

    for entry_result in fs::read_dir(base_extract_dir)? {
        let entry = entry_result?;
        let path = entry.path();

        if path.is_dir() {
            // Assuming every subdirectory directly under base_extract_dir is a submission folder
            if let Some(folder_name_osstr) = path.file_name() {
                if let Some(folder_name_str) = folder_name_osstr.to_str() {
                    submission_paths.push((path.clone(), folder_name_str.to_string()));
                } else {
                    // Folder name is not valid UTF-8, decide how to handle: skip, error, or use lossy conversion
                    eprintln!(
                        "Warning: Skipping directory with non-UTF-8 name: {:?}",
                        path.display()
                    );
                }
            }
        }
    }
    Ok(submission_paths)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use std::io::Write;
    use std::path::PathBuf;
    use tempfile::tempdir; // Explicit import for clarity

    fn setup_test_project(base_dir_name: &str) -> (tempfile::TempDir, PathBuf) {
        let dir = tempdir().unwrap();
        let project_path = dir.path().join(base_dir_name);
        fs::create_dir_all(&project_path).unwrap();
        (dir, project_path)
    }

    #[test]
    fn test_process_project_folder_populates_file_lengths() {
        let (_temp_dir, project_path) = setup_test_project("project_with_lengths");

        let file1_path = project_path.join("file1.txt");
        {
            // Scope for file1
            let mut file1 = File::create(&file1_path).unwrap();
            // Use write_all with explicit bytes to ensure content is exactly "Hello\nWorld\nTest\n"
            file1.write_all(b"Hello\nWorld\nTest\n").unwrap();
        } // file1 is dropped, flushed, and closed here

        let src_dir = project_path.join("src");
        fs::create_dir_all(&src_dir).unwrap();
        let file2_path = src_dir.join("empty.py");
        {
            // Scope for file2
            File::create(&file2_path).unwrap();
        } // empty.py file is also closed

        let normalized_project = process_project_folder(&project_path, "proj_lengths").unwrap();

        let processed_file1 = normalized_project
            .files
            .get(&PathBuf::from("file1.txt"))
            .expect("file1.txt should be processed");
        assert_eq!(
            processed_file1.char_length, 17,
            "Character count for file1.txt should be 17"
        );
        assert_eq!(
            processed_file1.line_count, 3,
            "Line count for file1.txt should be 3 based on observed .lines() behavior"
        );

        let processed_file2 = normalized_project
            .files
            .get(&PathBuf::from("src/empty.py"))
            .expect("src/empty.py should be processed");
        assert_eq!(
            processed_file2.char_length, 0,
            "Character count for empty.py should be 0"
        );
        assert_eq!(
            processed_file2.line_count, 0,
            "Line count for empty.py should be 0"
        );
    }

    #[test]
    fn test_get_project_submission_paths_finds_subdirectories() {
        let base_temp_dir = tempdir().unwrap();
        let extract_path = base_temp_dir.path(); // Use the root of tempdir as base_extract_dir

        // Create some submission folders
        let sub1_path = extract_path.join("student_submission_1");
        fs::create_dir(&sub1_path).unwrap();
        let sub2_path = extract_path.join("another_student_proj");
        fs::create_dir(&sub2_path).unwrap();
        let sub3_path = extract_path.join("12345_project");
        fs::create_dir(&sub3_path).unwrap();

        // Create a file in the base, should be ignored
        File::create(extract_path.join("some_file.txt")).unwrap();

        let result_paths =
            get_project_submission_paths(extract_path, "test_proj", "test_promo").unwrap();

        // Collect the found folder names into a set
        let found_names: std::collections::HashSet<_> =
            result_paths.iter().map(|(_, name)| name.as_str()).collect();
        let expected_names: std::collections::HashSet<_> = [
            "student_submission_1",
            "another_student_proj",
            "12345_project",
        ]
        .iter()
        .cloned()
        .collect();

        assert_eq!(
            found_names, expected_names,
            "Should find exactly the expected submission folders"
        );
        assert_eq!(result_paths.len(), 3, "Should find 3 submission folders");
    }

    #[test]
    fn test_get_project_submission_paths_empty_dir() {
        let base_temp_dir = tempdir().unwrap();
        let extract_path = base_temp_dir.path();

        let result_paths =
            get_project_submission_paths(extract_path, "test_proj", "test_promo").unwrap();
        assert_eq!(
            result_paths.len(),
            0,
            "Should find 0 folders in an empty directory"
        );
    }

    #[test]
    fn test_get_project_submission_paths_non_existent_dir() {
        let non_existent_path = Path::new("./this_path_surely_does_not_exist_12345");
        let result = get_project_submission_paths(non_existent_path, "test_proj", "test_promo");
        assert!(
            result.is_err(),
            "Should return an error for a non-existent base directory"
        );
    }
}
