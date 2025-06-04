use actix_web::middleware::Logger;
use actix_web::{App, HttpServer, HttpResponse, Result as ActixResult};
use api::{AppState, checks_projects};
use apistos::SwaggerUIConfig;
use apistos::app::{BuildConfig, OpenApiWrapper};
use apistos::info::Info;
use apistos::server::Server;
use apistos::spec::Spec;
use apistos::web::{get, post, resource, scope};
use std::error::Error;
use std::net::Ipv4Addr;
use std::path::PathBuf;

mod algorithm;
mod api;
mod comparison_orchestrator;
mod project_processor;
mod s3;

async fn get_openapi_docs() -> ActixResult<HttpResponse> {
    let spec = Spec {
        info: Info {
            title: "Plagiarism service".to_string(),
            ..Default::default()
        },
        servers: vec![Server {
            url: "/".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    };

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .json(&spec))
}

#[actix_web::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().ok();

    let spec = Spec {
        info: Info {
            title: "Plagiarism service".to_string(),
            ..Default::default()
        },
        servers: vec![Server {
            url: "/".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    };

    let extract_path = PathBuf::from("./extract");
    println!("Starting plagiarism service on http://localhost:3008");
    println!("Available endpoints:");
    println!("  POST /plagiarism/checks - Run plagiarism check");
    println!("  GET /docs - OpenAPI specification (JSON)");
    println!("  GET /ui - Swagger UI");

    HttpServer::new(move || {
        App::new()
            .document(spec.clone())
            .wrap(Logger::default())
            .app_data(actix_web::web::Data::new(AppState {
                extract_base_path: extract_path.clone(),
            }))
            .service(
                scope("/plagiarism").service(
                    scope("/checks").service(resource("").route(post().to(checks_projects))),
                ),
            )
            .service(resource("/docs").route(get().to(get_openapi_docs)))
            .build_with(
                "/openapi.json",
                BuildConfig::default().with(SwaggerUIConfig::new(&"/ui")),
            )
    })
    .bind((Ipv4Addr::UNSPECIFIED, 3008))?
    .run()
    .await?;

    Ok(())
}
