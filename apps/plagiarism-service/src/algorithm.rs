use rustc_hash::FxHashSet;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::collections::hash_map::DefaultHasher;
use std::fmt;
use std::hash::{Hash, Hasher};
use std::io;

#[derive(Debug)]
pub enum AlgorithmError {
    Io(io::Error),
}

impl fmt::Display for AlgorithmError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AlgorithmError::Io(err) => write!(f, "I/O error: {}", err),
        }
    }
}

impl From<io::Error> for AlgorithmError {
    fn from(err: io::Error) -> AlgorithmError {
        AlgorithmError::Io(err)
    }
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

pub fn generate_byte_kgrams(bytes: &[u8], k: usize) -> FxHashSet<(u64, usize)> {
    bytes
        .windows(k)
        .enumerate()
        .map(|(i, window)| {
            let mut hasher = DefaultHasher::new();
            window.hash(&mut hasher);
            (hasher.finish(), i)
        })
        .collect()
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
    set_a: &FxHashSet<(u64, usize)>,
    set_b: &FxHashSet<(u64, usize)>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MossResult {
    pub score: f64,
    pub fingerprints_matched: usize,
    pub fingerprints_doc1: usize,
    pub fingerprints_doc2: usize,
}

pub fn compare_documents_moss_like(doc1: &str, doc2: &str) -> MossResult {
    let tokens1 = tokenize(doc1);
    let tokens2 = tokenize(doc2);

    let k = 4;
    let w = 5;
    let kgrams1 = generate_token_kgrams(&tokens1, k);
    let kgrams2 = generate_token_kgrams(&tokens2, k);

    if kgrams1.is_empty() && kgrams2.is_empty() {
        // If both documents are empty (or result in no k-grams), they are considered identical.
        return MossResult {
            score: 1.0, // Jaccard index is 1.0 for two empty sets by some definitions
            fingerprints_matched: 0,
            fingerprints_doc1: 0,
            fingerprints_doc2: 0,
        };
    }

    if kgrams1.is_empty() || kgrams2.is_empty() {
        // If one document is empty (or results in no k-grams) and the other is not,
        // they have no similarity.
        return MossResult {
            score: 0.0,
            fingerprints_matched: 0,
            fingerprints_doc1: kgrams1.len(), // Will be 0 if kgrams1 is empty
            fingerprints_doc2: kgrams2.len(), // Will be 0 if kgrams2 is empty
        };
    }

    let hashes1: Vec<(u64, usize)> = kgrams1
        .iter()
        .enumerate()
        .map(|(i, kgram)| (hash_token_kgram(kgram), i))
        .collect();
    let hashes2: Vec<(u64, usize)> = kgrams2
        .iter()
        .enumerate()
        .map(|(i, kgram)| (hash_token_kgram(kgram), i))
        .collect();

    let fingerprints1 = winnow_hashes(&hashes1, w);
    let fingerprints2 = winnow_hashes(&hashes2, w);

    let hash_set1: HashSet<u64> = fingerprints1.iter().map(|&(hash, _)| hash).collect();
    let hash_set2: HashSet<u64> = fingerprints2.iter().map(|&(hash, _)| hash).collect();

    let intersection_size = hash_set1.intersection(&hash_set2).count();
    let union_size = hash_set1.union(&hash_set2).count();

    let score = if union_size == 0 {
        // This case should ideally be covered by the empty kgrams checks above.
        // If both sets of fingerprints are empty, but kgrams were not, implies k > 0 but w made them empty.
        // If kgrams were initially non-empty, but winnowing resulted in empty fingerprint sets for both,
        // and union_size is 0, it means both docs produced 0 fingerprints.
        // This implies they are effectively empty for comparison purposes after winnowing.
        // If they both result in zero fingerprints, they could be considered identical (score 1.0)
        // or completely different (score 0.0) depending on interpretation.
        // Given tests expect 1.0 for empty inputs and 0.0 for one empty, zero fingerprints post-winnowing for both
        // should imply that nothing meaningful could be extracted, so score should be 0.0 unless kgrams were *also* empty.
        // Let's stick to 0.0 if union_size is 0 but kgrams were not empty, as it means no common fingerprints.
        if hash_set1.is_empty() && hash_set2.is_empty() {
            1.0 // If both fingerprint sets are empty, treat as identical.
        } else {
            0.0 // Should not happen if union_size is 0 and sets are not both empty.
        }
    } else {
        intersection_size as f64 / union_size as f64
    };

    MossResult {
        score,
        fingerprints_matched: intersection_size,
        fingerprints_doc1: hash_set1.len(),
        fingerprints_doc2: hash_set2.len(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rustc_hash::FxHashSet;

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
        let set_a: FxHashSet<(u64, usize)> = FxHashSet::default();
        let set_b: FxHashSet<(u64, usize)> = FxHashSet::default();

        assert_eq!(calculate_jaccard_index(&set_a, &set_b), 1.0);
    }

    #[test]
    fn test_moss_jaccard_index_one_set_empty() {
        let mut set_a: FxHashSet<(u64, usize)> = FxHashSet::default();
        set_a.insert((10, 0));
        set_a.insert((20, 1));
        let set_b: FxHashSet<(u64, usize)> = FxHashSet::default();

        assert_eq!(calculate_jaccard_index(&set_a, &set_b), 0.0);
        assert_eq!(calculate_jaccard_index(&set_b, &set_a), 0.0);
    }

    #[test]
    fn test_moss_jaccard_index_identical_sets() {
        let mut set_a: FxHashSet<(u64, usize)> = FxHashSet::default();
        set_a.insert((10, 0));
        set_a.insert((20, 1));
        set_a.insert((30, 2));
        let set_b = set_a.clone();

        assert_eq!(calculate_jaccard_index(&set_a, &set_b), 1.0);
    }

    #[test]
    fn test_moss_jaccard_index_no_overlap() {
        let mut set_a: FxHashSet<(u64, usize)> = FxHashSet::default();
        set_a.insert((10, 0));
        set_a.insert((20, 1));
        let mut set_b: FxHashSet<(u64, usize)> = FxHashSet::default();
        set_b.insert((30, 2));
        set_b.insert((40, 3));

        assert_eq!(calculate_jaccard_index(&set_a, &set_b), 0.0);
    }

    #[test]
    fn test_moss_jaccard_index_partial_overlap() {
        let mut set_a: FxHashSet<(u64, usize)> = FxHashSet::default();
        set_a.insert((10, 0));
        set_a.insert((20, 1));
        set_a.insert((30, 2));
        set_a.insert((40, 3));
        let mut set_b: FxHashSet<(u64, usize)> = FxHashSet::default();
        set_b.insert((30, 2));
        set_b.insert((40, 3));
        set_b.insert((50, 4));
        set_b.insert((60, 5));
        set_b.insert((70, 6));

        let expected = 2.0 / 7.0;
        assert!((calculate_jaccard_index(&set_a, &set_b) - expected).abs() < 1e-9);
    }

    #[test]
    fn test_compare_documents_moss_like_identical_simple() {
        let doc1 = "The quick brown fox jumps over the lazy dog.";
        let doc2 = "The quick brown fox jumps over the lazy dog.";
        let _k = 4;
        let _w = 5;
        let result = compare_documents_moss_like(doc1, doc2);
        assert_eq!(result.score, 1.0);
        assert!(result.fingerprints_doc1 > 0);
        assert_eq!(result.fingerprints_doc1, result.fingerprints_doc2);
        assert_eq!(result.fingerprints_matched, result.fingerprints_doc1);
    }

    #[test]
    fn test_compare_documents_moss_like_completely_different_simple() {
        let doc1 = "Hello world, this is document one.";
        let doc2 = "Another document, completely unrelated content here.";
        let _k = 4;
        let _w = 5;
        let result = compare_documents_moss_like(doc1, doc2);
        assert!(
            result.score < 1.0,
            "Expected very low score for different docs, got {}",
            result.score
        );
        assert!(result.fingerprints_doc1 > 0);
        assert!(result.fingerprints_doc2 > 0);

        assert!((result.fingerprints_matched as f64) < (result.fingerprints_doc1 as f64 * 0.5));
        assert!((result.fingerprints_matched as f64) < (result.fingerprints_doc2 as f64 * 0.5));
    }

    #[test]
    fn test_compare_documents_moss_like_one_empty() {
        let doc1 = "This document has enough content for kgrams.";
        let doc2 = "";
        let _k = 4;
        let _w = 5;
        let result1 = compare_documents_moss_like(doc1, doc2);
        assert_eq!(result1.score, 0.0);
        assert!(
            result1.fingerprints_doc1 > 0,
            "Doc1 should have fingerprints"
        );
        assert_eq!(result1.fingerprints_doc2, 0);
        assert_eq!(result1.fingerprints_matched, 0);

        let result2 = compare_documents_moss_like(doc2, doc1);
        assert_eq!(result2.score, 0.0);
        assert_eq!(result2.fingerprints_doc1, 0);
        assert!(
            result2.fingerprints_doc2 > 0,
            "Doc2 (originally doc1) should have fingerprints"
        );
        assert_eq!(result2.fingerprints_matched, 0);
    }

    #[test]
    fn test_compare_documents_moss_like_both_empty() {
        let doc1 = "";
        let doc2 = "";
        let _k = 4;
        let _w = 5;
        let result = compare_documents_moss_like(doc1, doc2);
        assert_eq!(result.score, 1.0);
        assert_eq!(result.fingerprints_doc1, 0);
        assert_eq!(result.fingerprints_doc2, 0);
        assert_eq!(result.fingerprints_matched, 0);
    }

    #[test]
    fn test_compare_documents_moss_like_small_content_less_than_k() {
        let doc1 = "hi";
        let doc2 = "hi";
        let _k = 4;
        let _w = 5;
        let result = compare_documents_moss_like(doc1, doc2);

        assert_eq!(result.score, 1.0);
        assert_eq!(result.fingerprints_doc1, 0);
        assert_eq!(result.fingerprints_doc2, 0);
        assert_eq!(result.fingerprints_matched, 0);

        let doc3 = "bye";
        let result2 = compare_documents_moss_like(doc1, doc3);
        assert_eq!(result2.score, 1.0);
        assert_eq!(result2.fingerprints_doc1, 0);
        assert_eq!(result2.fingerprints_doc2, 0);
        assert_eq!(result2.fingerprints_matched, 0);
    }

    #[test]
    fn test_compare_documents_moss_like_content_just_k() {
        let doc1 = "word word word word";
        let doc2 = "word word word word";
        let _k = 4;
        let _w = 1;
        let result = compare_documents_moss_like(doc1, doc2);
        assert_eq!(result.score, 1.0);
        assert_eq!(
            result.fingerprints_doc1, 1,
            "Should have 1 fingerprint for doc1"
        );
        assert_eq!(
            result.fingerprints_doc2, 1,
            "Should have 1 fingerprint for doc2"
        );
        assert_eq!(result.fingerprints_matched, 1);

        let doc3 = "diff diff diff diff";
        let result2 = compare_documents_moss_like(doc1, doc3);
        assert_eq!(result2.score, 0.0);
        assert_eq!(result2.fingerprints_doc1, 1);
        assert_eq!(result2.fingerprints_doc2, 1);
        assert_eq!(result2.fingerprints_matched, 0);
    }

    #[test]
    fn test_debug_specific_concatenated_strings() {
        let doc1 = "fn main() { println!(\"Hello, world!\"); }";
        let doc2 = "fn main() { println!(\"Hello, world!\"); }";
        let result = compare_documents_moss_like(doc1, doc2);
        assert_eq!(result.score, 1.0);
    }
}
