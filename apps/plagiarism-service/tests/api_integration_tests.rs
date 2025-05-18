use actix_web::{App, test, web, web::Data};
use plagiarism_service::api::{
    AppState, BodyRequest, ComprehensivePlagiarismResponse, checks_projects,
};
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use tempfile::tempdir;

fn setup_extract_dir_for_test(
    base_path_for_service: &Path,
    sub_dir_to_create_projects_in: &str,
    create_all_projects: bool,
) {
    let extract_dir_for_projects = base_path_for_service.join(sub_dir_to_create_projects_in);
    fs::create_dir_all(&extract_dir_for_projects).unwrap();

    let proj1_dir = extract_dir_for_projects.join("997-250514223200");
    fs::create_dir_all(&proj1_dir).unwrap();
    let mut file1 = File::create(proj1_dir.join("main.c")).unwrap();
    writeln!(file1, "#include <stdio.h>\n\nint main() {{\n    printf(\"Hello, student1\\n\");\n    return 0;\n}}").unwrap();

    if create_all_projects {
        let proj2_dir = extract_dir_for_projects.join("998-250514223200");
        fs::create_dir_all(&proj2_dir).unwrap();
        let mut file2 = File::create(proj2_dir.join("main.c")).unwrap();
        writeln!(file2, "#include <stdio.h>\n\nint main() {{\n    printf(\"Hello, student2\\n\");\n    return 0;\n}}").unwrap();

        let proj3_dir = extract_dir_for_projects.join("999-250514223200");
        fs::create_dir_all(&proj3_dir).unwrap();
        let mut file3 = File::create(proj3_dir.join("main.c")).unwrap();
        writeln!(file3, "#include <stdio.h>\n\nint main() {{\n    printf(\"Hello, student2\\n\");\n    return 0;\n}}").unwrap();
    }
}

#[actix_web::test]
async fn test_checks_projects_api_with_comparisons() {
    let temp_project_root = tempdir().unwrap();
    let specific_extract_path_for_this_test =
        temp_project_root.path().join("test_specific_extract_multi");
    setup_extract_dir_for_test(&specific_extract_path_for_this_test, "", true);

    let app_state = Data::new(AppState {
        extract_base_path: specific_extract_path_for_this_test.clone(),
    });

    let app = test::init_service(
        App::new()
            .app_data(app_state.clone())
            .service(web::resource("/plagiarism/checks").route(web::post().to(checks_projects))),
    )
    .await;

    let req_body = BodyRequest {
        project_id: "999".to_string(),
        promotion_id: "999".to_string(),
    };

    let req = test::TestRequest::post()
        .uri("/plagiarism/checks")
        .set_json(&req_body)
        .to_request();
    let resp: ComprehensivePlagiarismResponse = test::call_and_read_body_json(&app, req).await;

    assert_eq!(resp.project_id, "999");
    assert_eq!(resp.promotion_id, "999");
    assert_eq!(resp.folder_results.len(), 3);

    for result in &resp.folder_results {
        assert_eq!(
            result.matches.len(),
            2,
            "Each project should have 2 matches"
        );
    }

    let project_ids: Vec<&str> = resp
        .folder_results
        .iter()
        .map(|r| r.folder_name.as_str())
        .collect();
    assert!(project_ids.contains(&"997-250514223200"));
    assert!(project_ids.contains(&"998-250514223200"));
    assert!(project_ids.contains(&"999-250514223200"));
}

#[actix_web::test]
async fn test_checks_projects_api_full_response_format_and_content() {
    let temp_project_root = tempdir().unwrap();
    let specific_extract_path = temp_project_root.path().join("final_resp_extract");

    // Create project 997
    let proj_a_path = specific_extract_path.join("997-250514223200");
    fs::create_dir_all(&proj_a_path).unwrap();
    let mut file_a1 = File::create(proj_a_path.join("main.c")).unwrap();
    writeln!(file_a1, "#include <stdio.h>\n\nint main() {{\n    printf(\"Hello, student1\\n\");\n    return 0;\n}}").unwrap();

    // Create project 998
    let proj_b_path = specific_extract_path.join("998-250514223200");
    fs::create_dir_all(&proj_b_path).unwrap();
    let mut file_b1 = File::create(proj_b_path.join("main.c")).unwrap();
    writeln!(file_b1, "#include <stdio.h>\n\nint main() {{\n    printf(\"Hello, student2\\n\");\n    return 0;\n}}").unwrap();

    // Create project 999 with the actual content
    let proj_c_path = specific_extract_path.join("999-250514223200");
    fs::create_dir_all(&proj_c_path).unwrap();
    let mut file_c1 = File::create(proj_c_path.join("main.c")).unwrap();
    writeln!(file_c1, "// main.c\n#include <stdio.h>\n\n// Exercise 1: Sum of Two Numbers\nvoid sum_two_numbers() {{\n    int a, b;\n    printf(\"Enter two numbers: \");\n    scanf(\"%%d %%d\", &a, &b);\n    printf(\"Sum: %%d\\n\", a + b);\n}}\n\n// Exercise 2: Check Even or Odd\nvoid even_or_odd() {{\n    int n;\n    printf(\"Enter a number: \");\n    scanf(\"%%d\", &n);\n    if (n %% 2 == 0)\n        printf(\"Even number\\n\");\n    else\n        printf(\"Odd number\\n\");\n}}\n\n// Exercise 3: Factorial Calculation\nvoid factorial() {{\n    int n, fact = 1;\n    printf(\"Enter a non-negative integer: \");\n    scanf(\"%%d\", &n);\n    for (int i = 1; i <= n; ++i)\n        fact *= i;\n    printf(\"Factorial: %%d\\n\", fact);\n}}\n\nint main() {{\n    sum_two_numbers();\n    even_or_odd();\n    factorial();\n    return 0;\n}}").unwrap();

    let app_state = Data::new(AppState {
        extract_base_path: specific_extract_path.clone(),
    });

    let app = test::init_service(
        App::new()
            .app_data(app_state.clone())
            .service(web::resource("/plagiarism/checks").route(web::post().to(checks_projects))),
    )
    .await;

    let req_body = BodyRequest {
        project_id: "999".to_string(),
        promotion_id: "999".to_string(),
    };

    let req = test::TestRequest::post()
        .uri("/plagiarism/checks")
        .set_json(&req_body)
        .to_request();
    let resp: ComprehensivePlagiarismResponse = test::call_and_read_body_json(&app, req).await;

    assert_eq!(resp.project_id, "999");
    assert_eq!(resp.promotion_id, "999");
    assert_eq!(resp.folder_results.len(), 3);

    // Verify project 997 results
    let result_a = resp
        .folder_results
        .iter()
        .find(|r| r.folder_name == "997-250514223200")
        .unwrap();
    assert_eq!(
        result_a.sha1,
        Some("61aaeea29884718dc6791e17f7eb444ae8b64751".to_string())
    );
    assert_eq!(result_a.plagiarism_percentage, 11.76385729345836);

    let match_a_to_b = result_a
        .matches
        .iter()
        .find(|m| m.matched_folder == "998-250514223200")
        .unwrap();
    assert_eq!(match_a_to_b.overall_match_percentage, 11.76385729345836);
    assert_eq!(match_a_to_b.combined_score, 11.76385729345836);
    assert!(match_a_to_b.flags.is_empty());

    let match_a_to_c = result_a
        .matches
        .iter()
        .find(|m| m.matched_folder == "999-250514223200")
        .unwrap();
    assert_eq!(match_a_to_c.overall_match_percentage, 11.76385729345836);
    assert_eq!(match_a_to_c.combined_score, 11.76385729345836);
    assert!(match_a_to_c.flags.is_empty());

    // Verify project 998 results
    let result_b = resp
        .folder_results
        .iter()
        .find(|r| r.folder_name == "998-250514223200")
        .unwrap();
    assert_eq!(
        result_b.sha1,
        Some("045efefb7cc504c04a162b351e44ece15bcb0122".to_string())
    );
    assert_eq!(result_b.plagiarism_percentage, 100.0);

    let match_b_to_a = result_b
        .matches
        .iter()
        .find(|m| m.matched_folder == "997-250514223200")
        .unwrap();
    assert_eq!(match_b_to_a.overall_match_percentage, 11.76385729345836);
    assert_eq!(match_b_to_a.combined_score, 11.76385729345836);
    assert!(match_b_to_a.flags.is_empty());

    let match_b_to_c = result_b
        .matches
        .iter()
        .find(|m| m.matched_folder == "999-250514223200")
        .unwrap();
    assert_eq!(match_b_to_c.overall_match_percentage, 100.0);
    assert_eq!(match_b_to_c.combined_score, 100.0);
    assert!(
        match_b_to_c
            .flags
            .contains(&"VERY_HIGH_SIMILARITY".to_string())
    );
    assert!(
        match_b_to_c
            .flags
            .contains(&"SIGNIFICANT_MOSS_MATCH".to_string())
    );
    assert!(
        match_b_to_c
            .flags
            .contains(&"SIGNIFICANT_RABIN_KARP_MATCH".to_string())
    );

    // Verify project 999 results
    let result_c = resp
        .folder_results
        .iter()
        .find(|r| r.folder_name == "999-250514223200")
        .unwrap();
    assert_eq!(
        result_c.sha1,
        Some("045efefb7cc504c04a162b351e44ece15bcb0122".to_string())
    );
    assert_eq!(result_c.plagiarism_percentage, 100.0);

    let match_c_to_a = result_c
        .matches
        .iter()
        .find(|m| m.matched_folder == "997-250514223200")
        .unwrap();
    assert_eq!(match_c_to_a.overall_match_percentage, 11.76385729345836);
    assert_eq!(match_c_to_a.combined_score, 11.76385729345836);
    assert!(match_c_to_a.flags.is_empty());

    let match_c_to_b = result_c
        .matches
        .iter()
        .find(|m| m.matched_folder == "998-250514223200")
        .unwrap();
    assert_eq!(match_c_to_b.overall_match_percentage, 100.0);
    assert_eq!(match_c_to_b.combined_score, 100.0);
    assert!(
        match_c_to_b
            .flags
            .contains(&"VERY_HIGH_SIMILARITY".to_string())
    );
    assert!(
        match_c_to_b
            .flags
            .contains(&"SIGNIFICANT_MOSS_MATCH".to_string())
    );
    assert!(
        match_c_to_b
            .flags
            .contains(&"SIGNIFICANT_RABIN_KARP_MATCH".to_string())
    );
}
