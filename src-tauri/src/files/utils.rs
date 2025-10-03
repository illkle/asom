use chrono::offset::Utc;
use chrono::DateTime;

use super::read_save::FileReadMode;
use std::fs::{self, File};
use std::io::{self, BufRead, BufReader};
use std::path::{Path, PathBuf};

pub fn get_file_modified_time(path_absolute: &Path) -> Result<i64, String> {
    match fs::metadata(path_absolute) {
        Ok(meta) => match meta.modified() {
            Ok(tt) => {
                let time = Into::<DateTime<Utc>>::into(tt);

                Ok(time.timestamp_millis())
            }
            Err(e) => Err(e.to_string()),
        },
        Err(e) => Err(e.to_string()),
    }
}

pub struct FileContent {
    pub front_matter: String,
    pub content: String,
}

pub fn get_file_content(path_absolute: &Path, read_mode: &FileReadMode) -> io::Result<FileContent> {
    let file = File::open(path_absolute)?;
    let reader = BufReader::new(file);

    let mut front_matter = String::new();
    let mut content = String::new();

    let mut inside_front_matter = false;
    let mut frontmatter_found = false;

    for line in reader.lines() {
        // TODO: handle cases with no frontmatter better
        let line = line?;

        match (line.trim() == "---", inside_front_matter, frontmatter_found) {
            // Found frontmatter start
            (true, false, false) => {
                inside_front_matter = true;
                content = "".to_string();
            }
            // Inside
            (false, true, _) => {
                front_matter.push_str(&line);
                front_matter.push('\n');
            }
            // Found end
            (true, true, _) => {
                inside_front_matter = false;
                frontmatter_found = true;
                match read_mode {
                    FileReadMode::OnlyMeta => {
                        return Ok(FileContent {
                            front_matter,
                            content,
                        })
                    }
                    FileReadMode::FullFile => (),
                }
            }
            // Anything after frontmatter
            (_, _, true) => {
                content.push_str(&line);
                content.push('\n');
            }
            // Ignore anything before frontmatter
            (false, false, false) => (),
        }
    }

    Ok(FileContent {
        front_matter,
        content,
    })
}

pub fn get_unique_path(path: impl AsRef<Path>) -> PathBuf {
    let path = path.as_ref();

    if !path.exists() {
        return path.to_path_buf();
    }

    let parent = path.parent().unwrap_or_else(|| Path::new(""));
    let file_name = path.file_name().unwrap().to_string_lossy();

    let (stem, extension) = match path.extension() {
        Some(ext) => {
            let ext_str = ext.to_string_lossy();
            let stem = &file_name[..file_name.len() - ext_str.len() - 1];
            (stem, Some(ext_str))
        }
        None => (file_name.as_ref(), None),
    };

    for i in 1.. {
        let new_name = match extension {
            Some(ref ext) => format!("{}({}).{}", stem, i, ext),
            None => format!("{}({})", stem, i),
        };

        let new_path = parent.join(new_name);
        if !new_path.exists() {
            return new_path;
        }
    }

    unreachable!()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use tempfile::tempdir;

    /** get_unique_path */
    #[test]
    fn test_nonexistent_file() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("test.txt");
        assert_eq!(get_unique_path(&path), path);
    }

    #[test]
    fn test_existing_file() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("test.txt");
        File::create(&path).unwrap();

        let result = get_unique_path(&path);
        assert_eq!(result, dir.path().join("test(1).txt"));
    }

    #[test]
    fn test_multiple_existing_files() {
        let dir = tempdir().unwrap();
        File::create(dir.path().join("test.txt")).unwrap();
        File::create(dir.path().join("test(1).txt")).unwrap();
        File::create(dir.path().join("test(2).txt")).unwrap();

        let result = get_unique_path(dir.path().join("test.txt"));
        assert_eq!(result, dir.path().join("test(3).txt"));
    }
}
