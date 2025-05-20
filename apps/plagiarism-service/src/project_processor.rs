use rustc_hash::{FxHashMap, FxHashSet};
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SourceLanguage {
    Rust,
    Python,
    Text,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedFile {
    pub relative_path: PathBuf,
    pub content: String,
    pub language: SourceLanguage,
    pub sha1_hash: String,
    pub char_length: usize,
    pub line_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NormalizedProject {
    pub project_id: String,
    pub files: FxHashMap<PathBuf, ProcessedFile>,
    pub concatenated_source_code: Option<String>,
    pub concatenated_source_hash: Option<String>,
}

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

fn calculate_file_sha1(content: &str) -> String {
    let mut hasher = Sha1::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn detect_language(path: &Path) -> SourceLanguage {
    match path.extension().and_then(|ext| ext.to_str()) {
        Some("rs") => SourceLanguage::Rust,
        Some("py") => SourceLanguage::Python,
        Some("txt") => SourceLanguage::Text,
        Some("c") => SourceLanguage::Text,
        _ => SourceLanguage::Unknown,
    }
}

pub fn build_blacklist(project_path: &Path) -> io::Result<FxHashSet<String>> {
    let mut blacklist: FxHashSet<String> = FxHashSet::from_iter([
        String::from("target/"),
        String::from("node_modules/"),
        String::from("dist/"),
        String::from("build/"),
        String::from(".next/"),
        String::from(".git/"),
        String::from(".svn/"),
        String::from(".hg/"),
        String::from(".idea/"),
        String::from(".vscode/"),
        String::from(".vscode\\"),
        String::from(".exe"),
        String::from(".DS_Store"),
        String::from(".dll"),
        String::from(".lock"),
        String::from(".log"),
        String::from(".zip"),
        String::from(".md"),
        String::from(".github/"),
        String::from(".github\\"),
        String::from("LICENSE"),
    ]);

    let gitignore_path = project_path.join(".gitignore");
    if gitignore_path.exists() {
        let gitignore_content = fs::read_to_string(gitignore_path)?;
        for line in gitignore_content.lines() {
            let trimmed_line = line.trim();
            if !trimmed_line.is_empty()
                && !trimmed_line.starts_with('#')
                && !trimmed_line.contains("*")
                && !trimmed_line.contains("!")
            {
                blacklist.insert(trimmed_line.to_string());
            }
        }
    }

    println!("Blacklisted files/folders: {:?}", blacklist);
    Ok(blacklist)
}

pub fn process_project_folder(
    project_path: &Path,
    project_id_str: &str,
) -> Result<NormalizedProject, ProjectProcessorError> {
    let mut files_map = FxHashMap::default();
    let mut source_files_for_concatenation: Vec<(PathBuf, String)> = Vec::new();

    let blacklist = build_blacklist(project_path)?;

    for entry in walkdir::WalkDir::new(project_path).into_iter() {
        let entry = entry?;
        let path = entry.path();
        let path_str = path.to_string_lossy();

        let is_blacklisted = blacklist.iter().any(|item| path_str.contains(item));

        if is_blacklisted {
            println!("Skipping blacklisted: {:?}", path);
            continue;
        }

        if path.is_file() {
            let mut relative_path = match path.strip_prefix(project_path) {
                Ok(p) => p.to_path_buf(),
                Err(_) => continue,
            };

            if let Some(first_comp) = relative_path.components().next() {
                if let Some(first_comp_str) = first_comp.as_os_str().to_str() {
                    if first_comp_str == project_id_str {
                        relative_path = relative_path
                            .strip_prefix(first_comp_str)
                            .unwrap_or(&relative_path)
                            .to_path_buf();
                    }
                }
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
                        SourceLanguage::Text => {
                            if path.extension().and_then(|ext| ext.to_str()) == Some("c") {
                                source_files_for_concatenation.push((relative_path, content));
                            }
                        }
                        _ => {}
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use std::io::Write;
    use std::path::PathBuf;
    use tempfile::tempdir;

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
            let mut file1 = File::create(&file1_path).unwrap();

            file1.write_all(b"Hello\nWorld\nTest\n").unwrap();
        }

        let src_dir = project_path.join("src");
        fs::create_dir_all(&src_dir).unwrap();
        let file2_path = src_dir.join("empty.py");
        {
            File::create(&file2_path).unwrap();
        }

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
}
