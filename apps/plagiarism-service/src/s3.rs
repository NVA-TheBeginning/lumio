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
    pub endpoint: String,
}

impl S3Config {
    pub fn from_env() -> Result<Self, String> {
        dotenv().ok();

        let endpoint =
            env::var("MINIO_ENDPOINT").map_err(|e| format!("MINIO_ENDPOINT not set: {e}"))?;
        let bucket_name =
            env::var("S3_BUCKET_NAME").map_err(|e| format!("S3_BUCKET_NAME not set: {e}"))?;
        let region_str = env::var("REGION").map_err(|e| format!("S3_REGION not set: {e}"))?;
        let region = region_str
            .parse::<Region>()
            .map_err(|e| format!("Failed to parse REGION: {e}"))?;

        let access_key_id =
            env::var("ACCESS_KEY_ID").map_err(|e| format!("ACCESS_KEY_ID not set: {e}"))?;

        let secret_access_key =
            env::var("SECRET_ACCESS_KEY").map_err(|e| format!("SECRET_ACCESS_KEY not set: {e}"))?;

        let credentials = Credentials::new(
            Some(&access_key_id),
            Some(&secret_access_key),
            None,
            None,
            None,
        )
        .map_err(|e| format!("Failed to create credentials: {e}"))?;

        Ok(Self {
            bucket_name,
            region,
            credentials,
            endpoint,
        })
    }
}

pub async fn get_file_from_s3(key: &str) -> Result<Vec<u8>, String> {
    let config = S3Config::from_env()?;

    let custom_region = Region::Custom {
        region: config.region.to_string(),
        endpoint: config.endpoint,
    };

    let bucket = Bucket::new(&config.bucket_name, custom_region, config.credentials)
        .map_err(|e| format!("Bucket initialization failed: {e}"))?;

    let bucket = bucket.with_path_style();

    let response = bucket.get_object(key).await.map_err(|e| {
        format!(
            "Failed to get object '{}' from bucket '{}': {}",
            key, config.bucket_name, e
        )
    })?;

    Ok(response.bytes().to_vec())
}

pub async fn list_files_in_directory(prefix: &str) -> Result<Vec<String>, String> {
    let config = S3Config::from_env()?;

    let custom_region = Region::Custom {
        region: config.region.to_string(),
        endpoint: config.endpoint,
    };

    let bucket = Bucket::new(&config.bucket_name, custom_region, config.credentials)
        .map_err(|e| format!("Bucket initialization failed: {e}"))?;

    let bucket = bucket.with_path_style();

    println!("Listing files in directory: {bucket:?}");

    let results = bucket
        .list(prefix.to_string(), None)
        .await
        .map_err(|e| format!("Failed to list objects with prefix '{prefix}': {e}"))?;

    let file_keys = results
        .into_iter()
        .flat_map(|result| result.contents)
        .map(|object| object.key)
        .collect();

    Ok(file_keys)
}
