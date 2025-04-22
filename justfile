# Install required development tools
install-tools:
    curl -L --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash
    cargo binstall -y cargo-watch cargo-nextest

# Format code using rustfmt
format DIR="./apps/plagiarism-service":
    cd {{DIR}} && cargo fmt --all

# Run clippy on all targets
clippy DIR="./apps/plagiarism-service":
    cd {{DIR}} && cargo clippy --all-targets --all-features --fix --allow-dirty --allow-staged -- -D warnings

# Run tests
test DIR="./apps/plagiarism-service":
    cd {{DIR}} && cargo nextest run

# Run All
check: 
    just format && just clippy && just test

# Default recipe
default:
    @just --list
