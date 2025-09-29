use chrono::offset::Utc;
use chrono::DateTime;

use std::fs::{self, File};
use std::io::{self, BufRead, BufReader};
use std::path::Path;

use super::read_save::FileReadMode;

pub fn get_file_modified_time(path_absolute: &Path) -> Result<String, String> {
    match fs::metadata(path_absolute) {
        Ok(meta) => match meta.modified() {
            Ok(tt) => {
                let time = Into::<DateTime<Utc>>::into(tt);

                Ok(time.to_rfc3339())
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
