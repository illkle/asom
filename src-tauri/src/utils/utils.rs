use std::{fs, path::Path};

pub fn is_inside(a: &Path, b: &Path) -> std::io::Result<bool> {
    // Canonicalize both to resolve symlinks, relative components, etc.
    let a = fs::canonicalize(a)?;
    let b = fs::canonicalize(b)?;
    Ok(a.starts_with(&b))
}
