use dotenvy::dotenv;
use s3::bucket::Bucket;
use s3::creds::Credentials;
use s3::region::Region;
use std::env;

#[derive(Debug, Clone)]
pub struct S3Config {
    pub bucket_name: String,
    pub region: Region,
    pub credentials: Credentials,
}

impl S3Config {
    pub fn from_env() -> Result<Self, String> {
        dotenv().ok();

        let bucket_name = env::var("S3_BUCKET_NAME")
            .map_err(|e| format!("S3_BUCKET_NAME environment variable error: {}", e))?;

        let region_str =
            env::var("REGION").map_err(|e| format!("REGION environment variable error: {}", e))?;

        let region = region_str
            .parse::<Region>()
            .map_err(|e| format!("Failed to parse REGION: {}", e))?;

        let access_key = env::var("ACCESS_KEY_ID")
            .map_err(|e| format!("ACCESS_KEY_ID environment variable error: {}", e))?;

        let secret_access_key = env::var("SECRET_ACCESS_KEY")
            .map_err(|e| format!("SECRET_ACCESS_KEY environment variable error: {}", e))?;

        let credentials = Credentials::new(
            Some(&access_key),
            Some(&secret_access_key),
            None,
            None,
            None,
        )
        .map_err(|e| format!("Failed to create credentials: {}", e))?;

        Ok(Self {
            bucket_name: bucket_name,
            region,
            credentials,
        })
    }

    pub fn new(bucket_name: String, region: Region, credentials: Credentials) -> Self {
        Self {
            bucket_name: bucket_name,
            region,
            credentials,
        }
    }
}

pub async fn get_file_from_s3(config: &S3Config, key: &str) -> Result<Vec<u8>, String> {
    let bucket = Bucket::new(
        &config.bucket_name,
        config.region.clone(),
        config.credentials.clone(),
    )
    .map_err(|e| format!("Failed to create S3 bucket client: {}", e))?;

    let response = bucket.get_object(key).await.map_err(|e| {
        format!(
            "Failed to get object '{}' from bucket '{}': {}",
            key, config.bucket_name, e
        )
    })?;

    Ok(response.bytes().to_vec())
}
