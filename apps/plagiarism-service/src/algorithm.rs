use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use std::collections::HashMap;
use std::collections::HashSet;
use std::collections::hash_map::DefaultHasher;
use std::fmt;
use std::fs;
use std::hash::{Hash, Hasher};
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

pub fn tokenize(text: &str) -> Vec<String> {
    text.to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|s| !s.is_empty())
        .map(String::from)
        .collect()
}

pub fn generate_token_kgrams(tokens: &[String], k_val: usize) -> Vec<Vec<String>> {
    if k_val == 0 || tokens.len() < k_val {
        return Vec::new();
    }
    tokens
        .windows(k_val)
        .map(|window_slice| window_slice.to_vec())
        .collect()
}

pub fn hash_token_kgram(token_kgram: &[String]) -> u64 {
    let mut hasher = DefaultHasher::new();

    token_kgram.hash(&mut hasher);
    hasher.finish()
}

pub fn winnow_hashes(
    hashes_with_indices: &[(u64, usize)],
    window_size: usize,
) -> HashSet<(u64, usize)> {
    let mut selected_fingerprints = HashSet::new();

    if window_size == 0 || hashes_with_indices.is_empty() {
        return selected_fingerprints;
    }

    if hashes_with_indices.len() < window_size {
        if let Some(min_entry) = hashes_with_indices
            .iter()
            .min_by(|a, b| a.0.cmp(&b.0).then_with(|| b.1.cmp(&a.1)))
        {
            selected_fingerprints.insert(*min_entry);
        }
        return selected_fingerprints;
    }

    for i in 0..=(hashes_with_indices.len() - window_size) {
        let current_window = &hashes_with_indices[i..i + window_size];

        if let Some(min_in_window) = current_window
            .iter()
            .min_by(|a, b| a.0.cmp(&b.0).then_with(|| b.1.cmp(&a.1)))
        {
            selected_fingerprints.insert(*min_in_window);
        }
    }
    selected_fingerprints
}

pub fn calculate_jaccard_index(
    set_a: &HashSet<(u64, usize)>,
    set_b: &HashSet<(u64, usize)>,
) -> f64 {
    if set_a.is_empty() && set_b.is_empty() {
        return 1.0;
    }

    let intersection_size = set_a.intersection(set_b).count();
    let union_size = set_a.union(set_b).count();

    if union_size == 0 {
        return 1.0;
    }

    intersection_size as f64 / union_size as f64
}

fn calculate_directory_sha1(dir_path: &Path) -> Result<String, AlgorithmError> {
    let mut hasher = Sha1::new();

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

    #[test]
    fn test_moss_tokenize_empty_string() {
        assert_eq!(tokenize(""), Vec::<String>::new());
    }

    #[test]
    fn test_moss_tokenize_simple_sentence() {
        let text = "Hello world";
        let expected = vec!["hello".to_string(), "world".to_string()];
        assert_eq!(tokenize(text), expected);
    }

    #[test]
    fn test_moss_tokenize_with_punctuation_and_mixed_case() {
        let text = "First, a Sentence; then ANOTHeR one.";
        let expected = vec![
            "first".to_string(),
            "a".to_string(),
            "sentence".to_string(),
            "then".to_string(),
            "another".to_string(),
            "one".to_string(),
        ];
        assert_eq!(tokenize(text), expected);
    }

    #[test]
    fn test_moss_tokenize_with_numbers_and_underscores() {
        let text = "Var1able_names l1k3 th1s_are_c0mm0n_2";
        let expected = vec![
            "var1able".to_string(),
            "names".to_string(),
            "l1k3".to_string(),
            "th1s".to_string(),
            "are".to_string(),
            "c0mm0n".to_string(),
            "2".to_string(),
        ];
        assert_eq!(tokenize(text), expected);
    }

    #[test]
    fn test_moss_tokenize_string_with_only_delimiters() {
        let text = " \t\n,.;!?---\t_";
        assert_eq!(tokenize(text), Vec::<String>::new());
    }

    #[test]
    fn test_moss_tokenize_leading_and_trailing_delimiters() {
        let text = "---word---";
        let expected = vec!["word".to_string()];
        assert_eq!(tokenize(text), expected);
    }

    #[test]
    fn test_moss_generate_token_kgrams_empty_tokens() {
        let tokens: Vec<String> = vec![];
        assert_eq!(generate_token_kgrams(&tokens, 3), Vec::<Vec<String>>::new());
    }

    #[test]
    fn test_moss_generate_token_kgrams_k_is_zero() {
        let tokens = vec!["a".to_string(), "b".to_string(), "c".to_string()];

        assert_eq!(generate_token_kgrams(&tokens, 0), Vec::<Vec<String>>::new());
    }

    #[test]
    fn test_moss_generate_token_kgrams_k_greater_than_tokens_length() {
        let tokens = vec!["a".to_string(), "b".to_string()];
        assert_eq!(generate_token_kgrams(&tokens, 3), Vec::<Vec<String>>::new());
    }

    #[test]
    fn test_moss_generate_token_kgrams_simple_case() {
        let tokens = vec![
            "the".to_string(),
            "quick".to_string(),
            "brown".to_string(),
            "fox".to_string(),
            "jumps".to_string(),
        ];
        let k_val = 3;
        let expected = vec![
            vec!["the".to_string(), "quick".to_string(), "brown".to_string()],
            vec!["quick".to_string(), "brown".to_string(), "fox".to_string()],
            vec!["brown".to_string(), "fox".to_string(), "jumps".to_string()],
        ];
        assert_eq!(generate_token_kgrams(&tokens, k_val), expected);
    }

    #[test]
    fn test_moss_generate_token_kgrams_k_equals_tokens_length() {
        let tokens = vec!["one".to_string(), "two".to_string(), "three".to_string()];
        let k_val = 3;
        let expected = vec![vec![
            "one".to_string(),
            "two".to_string(),
            "three".to_string(),
        ]];
        assert_eq!(generate_token_kgrams(&tokens, k_val), expected);
    }

    #[test]
    fn test_moss_generate_token_kgrams_k_is_one() {
        let tokens = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let k_val = 1;
        let expected = vec![
            vec!["a".to_string()],
            vec!["b".to_string()],
            vec!["c".to_string()],
        ];
        assert_eq!(generate_token_kgrams(&tokens, k_val), expected);
    }

    #[test]
    fn test_moss_hash_token_kgram_empty() {
        let empty_kgram: Vec<String> = vec![];
        let expected_hash = {
            let mut hasher = DefaultHasher::new();
            empty_kgram.hash(&mut hasher);
            hasher.finish()
        };
        assert_eq!(hash_token_kgram(&empty_kgram), expected_hash);
    }

    #[test]
    fn test_moss_hash_token_kgram_single_token() {
        let kgram = vec!["hello".to_string()];
        let expected_hash = {
            let mut hasher = DefaultHasher::new();
            kgram.hash(&mut hasher);
            hasher.finish()
        };
        assert_eq!(hash_token_kgram(&kgram), expected_hash);
    }

    #[test]
    fn test_moss_hash_token_kgram_multiple_tokens() {
        let kgram = vec!["the".to_string(), "quick".to_string(), "brown".to_string()];
        let expected_hash = {
            let mut hasher = DefaultHasher::new();
            kgram.hash(&mut hasher);
            hasher.finish()
        };
        assert_eq!(hash_token_kgram(&kgram), expected_hash);
    }

    #[test]
    fn test_moss_hash_token_kgram_consistency() {
        let kgram1 = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let kgram2 = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        assert_eq!(hash_token_kgram(&kgram1), hash_token_kgram(&kgram2));
    }

    #[test]
    fn test_moss_hash_token_kgram_difference() {
        let kgram1 = vec!["a".to_string(), "b".to_string(), "c".to_string()];
        let kgram2 = vec!["a".to_string(), "b".to_string(), "d".to_string()];
        let kgram3 = vec!["x".to_string(), "y".to_string(), "z".to_string()];

        let hash1 = hash_token_kgram(&kgram1);
        let hash2 = hash_token_kgram(&kgram2);
        let hash3 = hash_token_kgram(&kgram3);

        assert_ne!(
            hash1, hash2,
            "Hashes for kgrams differing by one token should differ"
        );
        assert_ne!(
            hash1, hash3,
            "Hashes for completely different kgrams should differ"
        );
    }

    #[test]
    fn test_moss_winnow_empty_hashes() {
        let hashes: Vec<(u64, usize)> = vec![];
        assert_eq!(winnow_hashes(&hashes, 4), HashSet::new());
    }

    #[test]
    fn test_moss_winnow_window_size_zero() {
        let hashes = vec![(10, 0), (20, 1), (5, 2), (30, 3)];

        assert_eq!(winnow_hashes(&hashes, 0), HashSet::new());
    }

    #[test]
    fn test_moss_winnow_hashes_less_than_window_size() {
        let hashes = vec![(10, 0), (20, 1), (5, 2)];
        let mut expected = HashSet::new();
        expected.insert((5, 2));
        assert_eq!(winnow_hashes(&hashes, 4), expected);

        let hashes_single = vec![(100, 0)];
        let mut expected_single = HashSet::new();
        expected_single.insert((100, 0));
        assert_eq!(winnow_hashes(&hashes_single, 4), expected_single);
    }

    #[test]
    fn test_moss_winnow_simple_case_no_ties() {
        let hashes = vec![
            (77, 0),
            (74, 1),
            (42, 2),
            (17, 3),
            (98, 4),
            (12, 5),
            (12, 6),
            (42, 7),
            (5, 8),
            (69, 9),
        ];
        let w = 4;
        let expected_fingerprints = [(17, 3), (12, 5), (12, 6), (5, 8)]
            .iter()
            .cloned()
            .collect::<HashSet<_>>();
        assert_eq!(winnow_hashes(&hashes, w), expected_fingerprints);
    }

    #[test]
    fn test_moss_winnow_all_same_hash() {
        let hashes = vec![(5, 0), (5, 1), (5, 2), (5, 3), (5, 4)];
        let w = 3;

        let mut expected = HashSet::new();
        expected.insert((5, 2));
        expected.insert((5, 3));
        expected.insert((5, 4));
        assert_eq!(winnow_hashes(&hashes, w), expected);
    }

    #[test]
    fn test_moss_jaccard_index_empty_sets() {
        let set_a: HashSet<(u64, usize)> = HashSet::new();
        let set_b: HashSet<(u64, usize)> = HashSet::new();

        assert_eq!(calculate_jaccard_index(&set_a, &set_b), 1.0);
    }

    #[test]
    fn test_moss_jaccard_index_one_set_empty() {
        let set_a: HashSet<(u64, usize)> = [(10, 0), (20, 1)].iter().cloned().collect();
        let set_b: HashSet<(u64, usize)> = HashSet::new();

        assert_eq!(calculate_jaccard_index(&set_a, &set_b), 0.0);
        assert_eq!(calculate_jaccard_index(&set_b, &set_a), 0.0);
    }

    #[test]
    fn test_moss_jaccard_index_identical_sets() {
        let set_a: HashSet<(u64, usize)> = [(10, 0), (20, 1), (30, 2)].iter().cloned().collect();
        let set_b = set_a.clone();

        assert_eq!(calculate_jaccard_index(&set_a, &set_b), 1.0);
    }

    #[test]
    fn test_moss_jaccard_index_no_overlap() {
        let set_a: HashSet<(u64, usize)> = [(10, 0), (20, 1)].iter().cloned().collect();
        let set_b: HashSet<(u64, usize)> = [(30, 2), (40, 3)].iter().cloned().collect();

        assert_eq!(calculate_jaccard_index(&set_a, &set_b), 0.0);
    }

    #[test]
    fn test_moss_jaccard_index_partial_overlap() {
        let set_a: HashSet<(u64, usize)> = [(10, 0), (20, 1), (30, 2), (40, 3)]
            .iter()
            .cloned()
            .collect();
        let set_b: HashSet<(u64, usize)> = [(30, 2), (40, 3), (50, 4), (60, 5), (70, 6)]
            .iter()
            .cloned()
            .collect();

        let expected = 2.0 / 7.0;
        assert!((calculate_jaccard_index(&set_a, &set_b) - expected).abs() < 1e-9);
    }
}
