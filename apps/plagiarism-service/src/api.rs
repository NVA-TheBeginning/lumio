use actix_web::Error;
use actix_web::web::Json;
use apistos::actix::CreatedJson;
use apistos::{ApiComponent, api_operation};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct BodyRequest {
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "promotionId")]
    pub promotion_id: String,
}

#[derive(Serialize, Deserialize, JsonSchema, ApiComponent)]
pub struct Response {
    #[serde(rename = "id")]
    pub id: Uuid,
    #[serde(rename = "projectId")]
    pub project_id: String,
    #[serde(rename = "promotionId")]
    pub promotion_id: String,
}

#[api_operation(summary = "Checks for plagiarism for a given project and promotion")]
pub(crate) async fn checks_projects(
    body: Json<BodyRequest>,
) -> Result<CreatedJson<Response>, Error> {
    let id = Uuid::new_v4();
    let response = Response {
        id,
        project_id: body.project_id.clone(),
        promotion_id: body.promotion_id.clone(),
    };

    Ok(CreatedJson(response))
}
