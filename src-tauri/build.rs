fn main() {
    #[allow(unused_mut)]
    let mut attributes = tauri_build::Attributes::new();

    /* This is needed for tests to run correctly on Windows. */
    #[cfg(windows)]
    {
        attributes = attributes
            .windows_attributes(tauri_build::WindowsAttributes::new_without_app_manifest());
    }

    tauri_build::try_build(attributes).expect("failed to run tauri-build");

    #[cfg(windows)]
    {
        let target_os = std::env::var("CARGO_CFG_TARGET_OS");
        let target_env = std::env::var("CARGO_CFG_TARGET_ENV");
        if Ok("windows") == target_os.as_deref() && Ok("msvc") == target_env.as_deref() {
            add_manifest();
        }
    }
}

/* This is needed for tests to run correctly on Windows. */
#[cfg(windows)]
fn add_manifest() {
    static WINDOWS_MANIFEST_FILE: &str = ".build/windows-manifest.xml";

    let mut manifest = std::env::current_dir().unwrap();
    manifest.push(WINDOWS_MANIFEST_FILE);

    println!("cargo:rerun-if-changed={}", WINDOWS_MANIFEST_FILE);
    // Embed the Windows application manifest file.
    println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
    println!(
        "cargo:rustc-link-arg=/MANIFESTINPUT:{}",
        manifest.to_str().unwrap()
    );
    // Turn linker warnings into errors.
    println!("cargo:rustc-link-arg=/WX");
}
