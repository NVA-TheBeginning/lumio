use algorithm::run_plagiarism_check;
use std::error::Error;
use std::fs::File;
use std::io::Write;
use std::path::Path;
mod algorithm;

fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().ok();

    println!("Running plagiarism algorithm directly...");

    let test_extract_dir = Path::new("./extract/");

    let mock_project_id = "test-project".to_string();
    let mock_promotion_id = "test-promotion".to_string();

    match run_plagiarism_check(mock_project_id, mock_promotion_id, &test_extract_dir) {
        Ok(response) => {
            println!("Algorithm finished successfully.");

            match serde_json::to_string_pretty(&response) {
                Ok(json_output) => {
                    let output_filename = "plagiarism_results.json";
                    println!("Writing plagiarism check results to {}...", output_filename);

                    match File::create(output_filename) {
                        Ok(mut file) => {
                            if let Err(e) = file.write_all(json_output.as_bytes()) {
                                eprintln!(
                                    "Failed to write JSON to file {}: {}",
                                    output_filename, e
                                );
                            } else {
                                println!("Successfully wrote JSON to {}", output_filename);
                            }
                        }
                        Err(e) => {
                            eprintln!("Failed to create output file {}: {}", output_filename, e);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to serialize response to JSON: {}", e);
                }
            }
        }
        Err(e) => {
            eprintln!("Plagiarism algorithm failed: {}", e);
        }
    }

    Ok(())
}

/*
use actix_web::middleware::Logger;
use actix_web::{App, HttpServer};
use api::checks_projects;
use apistos::SwaggerUIConfig;
use apistos::app::{BuildConfig, OpenApiWrapper};
use apistos::info::Info;
use apistos::server::Server;
use apistos::spec::Spec;
use apistos::web::{post, resource, scope};
use std::net::Ipv4Addr;

#[actix_web::main]
async fn main() -> Result<(), impl Error> {
    dotenvy::dotenv().ok();
    HttpServer::new(move || {
        let spec = Spec {
            info: Info {
                title: "Plagiarism service".to_string(),
                ..Default::default()
            },
            servers: vec![Server {
                url: "/api/v3".to_string(),
                ..Default::default()
            }],
            ..Default::default()
        };

        App::new()
            .document(spec)
            .wrap(Logger::default())
            .service(
                scope("/pagiarism").service(
                    scope("/checks").service(resource("").route(post().to(checks_projects))),
                ),
            )
            .build_with(
                "/openapi.json",
                BuildConfig::default().with(SwaggerUIConfig::new(&"/ui")),
            )
    })
    .bind((Ipv4Addr::UNSPECIFIED, 3008))?
    .run()
    .await
}
*/
