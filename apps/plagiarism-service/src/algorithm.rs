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
    pub match_frequency: f64,
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

const RK_RADIX: u64 = 256;
const RK_PRIME_Q: u64 = 101;

pub fn calculate_kgram_hash(kgram: &[u8], radix: u64, prime: u64) -> u64 {
    if kgram.is_empty() {
        return 0;
    }
    let mut hash_value: u64 = 0;
    for &byte_val in kgram {
        hash_value = (hash_value * radix + u64::from(byte_val)) % prime;
    }
    hash_value
}

pub fn calculate_h_multiplier(k_length: usize, radix: u64, prime: u64) -> u64 {
    if k_length == 0 {
        return 0;
    }
    if k_length == 1 {
        return 1;
    }
    let mut h_mult: u64 = 1;
    for _ in 0..(k_length - 1) {
        h_mult = (h_mult * radix) % prime;
    }
    h_mult
}

pub fn recalculate_hash(
    old_hash: u64,
    old_byte: u8,
    new_byte: u8,
    h_multiplier: u64,
    radix: u64,
    prime: u64,
) -> u64 {
    let mut new_hash = old_hash;
    new_hash = (new_hash + prime - (u64::from(old_byte) * h_multiplier) % prime) % prime;
    new_hash = (new_hash * radix + u64::from(new_byte)) % prime;
    new_hash
}

pub fn rabin_karp_search(text: &[u8], pattern: &[u8], radix: u64, prime: u64) -> Vec<usize> {
    let m = pattern.len();
    let n = text.len();
    let mut matches = Vec::new();

    if m == 0 || n == 0 || m > n {
        return matches;
    }

    let h_multiplier = calculate_h_multiplier(m, radix, prime);
    let pattern_hash = calculate_kgram_hash(pattern, radix, prime);
    let mut current_text_hash = calculate_kgram_hash(&text[0..m], radix, prime);

    for i in 0..=(n - m) {
        if pattern_hash == current_text_hash && &text[i..i + m] == pattern {
            matches.push(i);
        }

        if i < n - m {
            current_text_hash = recalculate_hash(
                current_text_hash,
                text[i],
                text[i + m],
                h_multiplier,
                radix,
                prime,
            );
        }
    }
    matches
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

fn compare_frequencies(freq1: &HashMap<char, usize>, freq2: &HashMap<char, usize>) -> f64 {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_kgram_hash_empty() {
        assert_eq!(calculate_kgram_hash(&[], RK_RADIX, RK_PRIME_Q), 0);
    }

    #[test]
    fn test_calculate_kgram_hash_single_char() {
        assert_eq!(calculate_kgram_hash(b"A", RK_RADIX, RK_PRIME_Q), 65);
    }

    #[test]
    fn test_calculate_kgram_hash_simple_string() {
        assert_eq!(calculate_kgram_hash(b"AB", RK_RADIX, RK_PRIME_Q), 41);
        assert_eq!(calculate_kgram_hash(b"ABC", RK_RADIX, RK_PRIME_Q), 59);
    }

    #[test]
    fn test_calculate_kgram_hash_with_prime_larger_than_char_value() {
        const TEST_PRIME: u64 = 257;
        assert_eq!(calculate_kgram_hash(b"a", RK_RADIX, TEST_PRIME), 97);
        assert_eq!(calculate_kgram_hash(b"ab", RK_RADIX, TEST_PRIME), 1);
    }

    #[test]
    fn test_calculate_h_multiplier_k_zero() {
        assert_eq!(calculate_h_multiplier(0, RK_RADIX, RK_PRIME_Q), 0);
    }

    #[test]
    fn test_calculate_h_multiplier_k_one() {
        assert_eq!(calculate_h_multiplier(1, RK_RADIX, RK_PRIME_Q), 1);
    }

    #[test]
    fn test_calculate_h_multiplier_k_greater_than_one() {
        assert_eq!(calculate_h_multiplier(3, RK_RADIX, RK_PRIME_Q), 88);
        assert_eq!(calculate_h_multiplier(2, RK_RADIX, RK_PRIME_Q), 54);
    }

    #[test]
    fn test_recalculate_hash_simple() {
        let initial_kgram = b"ABC";
        let old_hash = calculate_kgram_hash(initial_kgram, RK_RADIX, RK_PRIME_Q);
        assert_eq!(old_hash, 59, "Pre-condition: H(ABC) should be 59");

        let old_byte = b'A';
        let new_byte = b'D';
        let k_length = initial_kgram.len();
        let h_multiplier = calculate_h_multiplier(k_length, RK_RADIX, RK_PRIME_Q);
        assert_eq!(
            h_multiplier, 88,
            "Pre-condition: h_multiplier for k=3 should be 88"
        );

        let recalculated_hash = recalculate_hash(
            old_hash,
            old_byte,
            new_byte,
            h_multiplier,
            RK_RADIX,
            RK_PRIME_Q,
        );

        let expected_hash_bcd = calculate_kgram_hash(b"BCD", RK_RADIX, RK_PRIME_Q);
        assert_eq!(expected_hash_bcd, 0, "Verification: H(BCD) should be 0");
        assert_eq!(recalculated_hash, expected_hash_bcd);
    }

    #[test]
    fn test_rabin_karp_search_empty_text() {
        assert_eq!(
            rabin_karp_search(&[] as &[u8], b"A" as &[u8], RK_RADIX, RK_PRIME_Q),
            vec![] as Vec<usize>
        );
    }

    #[test]
    fn test_rabin_karp_search_empty_pattern() {
        assert_eq!(
            rabin_karp_search(b"ABC" as &[u8], &[] as &[u8], RK_RADIX, RK_PRIME_Q),
            vec![] as Vec<usize>
        );
    }

    #[test]
    fn test_rabin_karp_search_pattern_longer_than_text() {
        assert_eq!(
            rabin_karp_search(b"AB" as &[u8], b"ABC" as &[u8], RK_RADIX, RK_PRIME_Q),
            vec![] as Vec<usize>
        );
    }

    #[test]
    fn test_rabin_karp_search_no_match() {
        assert_eq!(
            rabin_karp_search(b"ABCD" as &[u8], b"XY" as &[u8], RK_RADIX, RK_PRIME_Q),
            vec![] as Vec<usize>
        );
    }

    #[test]
    fn test_rabin_karp_search_single_match_start() {
        assert_eq!(
            rabin_karp_search(b"ABCD" as &[u8], b"AB" as &[u8], RK_RADIX, RK_PRIME_Q),
            vec![0usize]
        );
    }

    #[test]
    fn test_rabin_karp_search_single_match_end() {
        assert_eq!(
            rabin_karp_search(b"ABCD" as &[u8], b"CD" as &[u8], RK_RADIX, RK_PRIME_Q),
            vec![2usize]
        );
    }

    #[test]
    fn test_rabin_karp_search_single_match_middle() {
        assert_eq!(
            rabin_karp_search(b"ABCD" as &[u8], b"BC" as &[u8], RK_RADIX, RK_PRIME_Q),
            vec![1usize]
        );
    }

    #[test]
    fn test_rabin_karp_search_multiple_matches() {
        assert_eq!(
            rabin_karp_search(b"ABABA" as &[u8], b"AB" as &[u8], RK_RADIX, RK_PRIME_Q),
            vec![0usize, 2usize]
        );
    }

    #[test]
    fn test_rabin_karp_search_multiple_matches_overlapping() {
        assert_eq!(
            calculate_kgram_hash(b"AAA" as &[u8], RK_RADIX, RK_PRIME_Q),
            3,
            "Pre-check hash of AAA"
        );
        assert_eq!(
            rabin_karp_search(b"AAAAA" as &[u8], b"AAA" as &[u8], RK_RADIX, RK_PRIME_Q),
            vec![0usize, 1usize, 2usize]
        );
    }

    #[test]
    fn test_rabin_karp_search_pattern_is_text() {
        assert_eq!(
            rabin_karp_search(b"ABC" as &[u8], b"ABC" as &[u8], RK_RADIX, RK_PRIME_Q),
            vec![0usize]
        );
    }

    #[test]
    fn test_rabin_karp_search_with_different_prime() {
        const TEST_PRIME_SEARCH: u64 = 257;
        let text: &[u8] = b"ababcab";
        let pattern: &[u8] = b"ab";
        assert_eq!(
            rabin_karp_search(text, pattern, RK_RADIX, TEST_PRIME_SEARCH),
            vec![0usize, 2usize, 5usize]
        );

        let text2: &[u8] = b"testthispattern";
        let pattern2: &[u8] = b"pattern";
        assert_eq!(
            rabin_karp_search(text2, pattern2, RK_RADIX, TEST_PRIME_SEARCH),
            vec![8usize]
        );
    }
}
