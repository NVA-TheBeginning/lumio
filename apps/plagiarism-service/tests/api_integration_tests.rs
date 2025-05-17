use actix_web::{App, test, web, web::Data};
use plagiarism_service::api::{
    AppState, BodyRequest, FinalPlagiarismCheckResponse, checks_projects,
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

    let proj1_dir = extract_dir_for_projects.join("student1_projA");
    fs::create_dir_all(&proj1_dir).unwrap();
    let mut file1 = File::create(proj1_dir.join("main.rs")).unwrap();
    writeln!(file1, "fn main() {{ println!(\"Hello, student1\"); }}").unwrap();

    if create_all_projects {
        let proj2_dir = extract_dir_for_projects.join("student2_projB");
        fs::create_dir_all(&proj2_dir).unwrap();
        let mut file2 = File::create(proj2_dir.join("app.py")).unwrap();
        writeln!(file2, "print('Hello, student2')").unwrap();
        File::create(proj2_dir.join("empty.txt")).unwrap();

        let proj3_dir = extract_dir_for_projects.join("student3_empty");
        fs::create_dir_all(&proj3_dir).unwrap();
    }
}

fn setup_single_project_extract_dir(
    base_path_for_service: &Path,
    sub_dir_to_create_projects_in: &str,
) {
    let extract_dir_for_projects = base_path_for_service.join(sub_dir_to_create_projects_in);
    fs::create_dir_all(&extract_dir_for_projects).unwrap();

    let proj1_dir = extract_dir_for_projects.join("student_single");
    fs::create_dir_all(&proj1_dir).unwrap();
    let mut file1 = File::create(proj1_dir.join("main.rs")).unwrap();
    writeln!(
        file1,
        "fn main() {{ println!(\"Hello, single student\"); }}"
    )
    .unwrap();
}

#[actix_web::test]
async fn test_checks_projects_api_less_than_two_projects() {
    let temp_project_root = tempdir().unwrap();
    let specific_extract_path_for_this_test =
        temp_project_root.path().join("test_specific_extract");
    setup_single_project_extract_dir(&specific_extract_path_for_this_test, "");

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
        project_id: "test_single_proj".to_string(),
        promotion_id: "test_single_promo".to_string(),
    };

    let req = test::TestRequest::post()
        .uri("/plagiarism/checks")
        .set_json(&req_body)
        .to_request();
    let resp: FinalPlagiarismCheckResponse = test::call_and_read_body_json(&app, req).await;

    assert_eq!(resp.project_id, "test_single_proj");
    assert_eq!(resp.promotion_id, "test_single_promo");
    assert_eq!(resp.analysis_results.len(), 1);

    let result = &resp.analysis_results[0];
    assert_eq!(result.folder_name, "student_single");
    assert!(result.matches.is_empty());
    assert_eq!(result.overall_plagiarism_percentage, 0.0);
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
        project_id: "multi_proj".to_string(),
        promotion_id: "multi_promo".to_string(),
    };

    let req = test::TestRequest::post()
        .uri("/plagiarism/checks")
        .set_json(&req_body)
        .to_request();
    let resp: FinalPlagiarismCheckResponse = test::call_and_read_body_json(&app, req).await;

    assert_eq!(resp.project_id, "multi_proj");
    assert_eq!(resp.promotion_id, "multi_promo");
    assert_eq!(resp.analysis_results.len(), 3);

    for result in &resp.analysis_results {
        assert_eq!(
            result.matches.len(),
            2,
            "Each project should have 2 matches"
        );
    }

    let project_ids: Vec<&str> = resp
        .analysis_results
        .iter()
        .map(|r| r.folder_name.as_str())
        .collect();
    assert!(project_ids.contains(&"student1_projA"));
    assert!(project_ids.contains(&"student2_projB"));
    assert!(project_ids.contains(&"student3_empty"));
}

#[actix_web::test]
async fn test_checks_projects_api_full_response_format_and_content() {
    let temp_project_root = tempdir().unwrap();
    let specific_extract_path = temp_project_root.path().join("final_resp_extract");

    let proj_a_path = specific_extract_path.join("student_A");
    fs::create_dir_all(&proj_a_path).unwrap();
    let mut file_a1 = File::create(proj_a_path.join("main.py")).unwrap();
    let content_common = "def func1():\n  print('common part')\n  for i in range(10):\n    print(i)\ndef func2():\n  print('another common part')\n  value=i*2\n  return value\n#end\n";
    writeln!(file_a1, "{}", content_common.replace("common", "unique_A")).unwrap();

    let proj_b_path = specific_extract_path.join("student_B");
    fs::create_dir_all(&proj_b_path).unwrap();
    let mut file_b1 = File::create(proj_b_path.join("main.py")).unwrap();
    writeln!(
        file_b1,
        "{}",
        content_common.replace("common", "slightly_different_B")
    )
    .unwrap();

    let proj_c_path = specific_extract_path.join("student_C");
    fs::create_dir_all(&proj_c_path).unwrap();
    let mut file_c1 = File::create(proj_c_path.join("main.py")).unwrap();
    writeln!(file_c1, "print('completely different content')\nprint('ensure it is long enough to pass checks')\nprint('line3')\nprint('line4')").unwrap();

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
        project_id: "final_proj".to_string(),
        promotion_id: "final_promo".to_string(),
    };

    let req = test::TestRequest::post()
        .uri("/plagiarism/checks")
        .set_json(&req_body)
        .to_request();
    let resp: FinalPlagiarismCheckResponse = test::call_and_read_body_json(&app, req).await;

    assert_eq!(resp.project_id, "final_proj");
    assert_eq!(resp.promotion_id, "final_promo");
    assert_eq!(resp.analysis_results.len(), 3);

    let result_a = resp
        .analysis_results
        .iter()
        .find(|r| r.folder_name == "student_A")
        .unwrap();
    let result_b = resp
        .analysis_results
        .iter()
        .find(|r| r.folder_name == "student_B")
        .unwrap();
    let result_c = resp
        .analysis_results
        .iter()
        .find(|r| r.folder_name == "student_C")
        .unwrap();

    let match_a_to_b = result_a
        .matches
        .iter()
        .find(|m| m.matched_folder == "student_B")
        .unwrap();
    assert!(
        match_a_to_b.match_percentage > 70.0,
        "Expected high MOSS match between A and B, got {}",
        match_a_to_b.match_percentage
    );
    assert_eq!(
        result_a.overall_plagiarism_percentage,
        match_a_to_b.match_percentage
    );

    let match_b_to_a = result_b
        .matches
        .iter()
        .find(|m| m.matched_folder == "student_A")
        .unwrap();
    assert_eq!(match_b_to_a.match_percentage, match_a_to_b.match_percentage);
    assert_eq!(
        result_b.overall_plagiarism_percentage,
        match_b_to_a.match_percentage
    );

    let match_c_to_a = result_c
        .matches
        .iter()
        .find(|m| m.matched_folder == "student_A")
        .unwrap();
    assert!(
        match_c_to_a.match_percentage < 30.0,
        "Expected low MOSS match between C and A, got {}",
        match_c_to_a.match_percentage
    );
    assert!(result_c.overall_plagiarism_percentage < 30.0);

    assert!(result_a.sha1.is_some());
    assert!(result_b.sha1.is_some());
    assert!(result_c.sha1.is_some());
}
