use actix_web::middleware::Logger;
use actix_web::{App, HttpServer};
use api::checks_projects;
use apistos::SwaggerUIConfig;
use apistos::app::{BuildConfig, OpenApiWrapper};
use apistos::info::Info;
use apistos::server::Server;
use apistos::spec::Spec;
use apistos::web::{post, resource, scope};
use std::error::Error;
use std::net::Ipv4Addr;

mod api;

#[actix_web::main]
async fn main() -> Result<(), impl Error> {
    HttpServer::new(move || {
    let spec = Spec {
      info: Info {
        title: "A well documented API".to_string(),
        description: Some(
          "This is an API documented using Apistos,\na wonderful new tool to document your actix API !".to_string(),
        ),
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
          scope("/checks")
            .service(resource("").route(post().to(checks_projects)))
        ),
      )
      .build_with(
        "/openapi.json",
        BuildConfig::default()
          .with(SwaggerUIConfig::new(&"/ui")),
      )
  })
  .bind((Ipv4Addr::UNSPECIFIED, 3008))?
  .run()
  .await
}
