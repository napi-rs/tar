#![deny(clippy::all)]

use std::{
  fs::File,
  io::{BufReader, Cursor, Read},
};

use mimalloc::MiMalloc;
use napi::{
  bindgen_prelude::{Either4, Env, Reference},
  Either, JsBuffer,
};
use napi_derive::napi;

use crate::entry::Entries;

mod entry;
mod header;

#[global_allocator]
static GLOBAL: MiMalloc = MiMalloc;

pub struct ArchiveSource {
  inner: Either4<
    File,
    Cursor<Vec<u8>>,
    flate2::read::GzDecoder<FileOrBuffer>,
    bzip2::read::BzDecoder<FileOrBuffer>,
  >,
}

enum FileOrBuffer {
  File(File),
  Buffer(Cursor<Vec<u8>>),
}

impl Read for FileOrBuffer {
  fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
    match self {
      Self::File(file) => file.read(buf),
      Self::Buffer(buffer) => buffer.read(buf),
    }
  }
}

impl ArchiveSource {
  fn from_node_input(input: Either<String, JsBuffer>) -> Result<Self, napi::Error> {
    match input {
      Either::A(path) => match infer::get_from_path(&path)?.map(|s| s.extension()) {
        Some("tar") => {
          let file = File::open(&path)?;
          Ok(Self {
            inner: Either4::A(file),
          })
        }
        Some("bz2") => {
          let file = File::open(&path)?;
          let bz2 = bzip2::read::BzDecoder::new(FileOrBuffer::File(file));
          Ok(Self {
            inner: Either4::D(bz2),
          })
        }
        Some("xz") => {
          let mut file = BufReader::new(File::open(&path)?);
          let mut output = Vec::new();
          lzma_rs::xz_decompress(&mut file, &mut output).map_err(anyhow::Error::from)?;
          Ok(Self {
            inner: Either4::B(Cursor::new(output)),
          })
        }
        Some("gz") => {
          let file = File::open(&path)?;
          Ok(Self {
            inner: Either4::C(flate2::read::GzDecoder::new(FileOrBuffer::File(file))),
          })
        }
        _ => Err(napi::Error::new(
          napi::Status::InvalidArg,
          format!("Unsupported file type for {}", path),
        )),
      },
      Either::B(buffer) => {
        let value = buffer.into_value()?;
        match infer::get(value.as_ref()).map(|s| s.extension()) {
          Some("tar") => Ok(Self {
            inner: Either4::B(Cursor::new(value.to_vec())),
          }),
          Some("bz2") => {
            let bz2 =
              bzip2::read::BzDecoder::new(FileOrBuffer::Buffer(Cursor::new(value.to_vec())));
            Ok(Self {
              inner: Either4::D(bz2),
            })
          }
          Some("xz") => {
            let mut input = value.as_ref();
            let mut output = Vec::new();
            lzma_rs::xz_decompress(&mut input, &mut output).map_err(anyhow::Error::from)?;
            Ok(Self {
              inner: Either4::B(Cursor::new(output)),
            })
          }
          Some("gz") => Ok(Self {
            inner: Either4::C(flate2::read::GzDecoder::new(FileOrBuffer::Buffer(
              Cursor::new(value.to_vec()),
            ))),
          }),
          _ => Err(napi::Error::new(
            napi::Status::InvalidArg,
            "Unsupported file type for input ",
          )),
        }
      }
    }
  }
}

impl Read for ArchiveSource {
  fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
    match &mut self.inner {
      Either4::A(file) => file.read(buf),
      Either4::B(buffer) => buffer.read(buf),
      Either4::C(gz) => gz.read(buf),
      Either4::D(bz2) => bz2.read(buf),
    }
  }
}

#[napi]
pub struct Archive {
  inner: tar::Archive<ArchiveSource>,
}

#[napi]
impl Archive {
  #[napi(constructor)]
  /// Create a new archive with the underlying path.
  pub fn new(input: Either<String, JsBuffer>) -> napi::Result<Self> {
    Ok(Self {
      inner: tar::Archive::new(ArchiveSource::from_node_input(input)?),
    })
  }

  #[napi]
  pub fn entries(&mut self, this: Reference<Archive>, env: Env) -> napi::Result<Entries> {
    let entries = this.share_with(env, |archive| Ok(archive.inner.entries()?))?;

    Ok(Entries { inner: entries })
  }

  #[napi]
  /// Unpacks the contents tarball into the specified `dst`.
  ///
  /// This function will iterate over the entire contents of this tarball,
  /// extracting each file in turn to the location specified by the entry's
  /// path name.
  ///
  /// This operation is relatively sensitive in that it will not write files
  /// outside of the path specified by `dst`. Files in the archive which have
  /// a '..' in their path are skipped during the unpacking process.
  pub fn unpack(&mut self, to: String) -> napi::Result<()> {
    self.inner.unpack(to)?;
    Ok(())
  }

  #[napi]
  /// Set the mask of the permission bits when unpacking this entry.
  ///
  /// The mask will be inverted when applying against a mode, similar to how
  /// `umask` works on Unix. In logical notation it looks like:
  ///
  /// ```text
  /// new_mode = old_mode & (~mask)
  /// ```
  ///
  /// The mask is 0 by default and is currently only implemented on Unix.
  pub fn set_mask(&mut self, mask: u32) {
    self.inner.set_mask(mask);
  }

  #[napi]
  /// Indicate whether extended file attributes (xattrs on Unix) are preserved
  /// when unpacking this archive.
  ///
  /// This flag is disabled by default and is currently only implemented on
  /// Unix using xattr support. This may eventually be implemented for
  /// Windows, however, if other archive implementations are found which do
  /// this as well.
  pub fn set_unpack_xattrs(&mut self, unpack_xattrs: bool) {
    self.inner.set_unpack_xattrs(unpack_xattrs);
  }

  #[napi]
  /// Indicate whether extended permissions (like suid on Unix) are preserved
  /// when unpacking this entry.
  ///
  /// This flag is disabled by default and is currently only implemented on
  /// Unix.
  pub fn set_preserve_permissions(&mut self, preserve_permissions: bool) {
    self.inner.set_preserve_permissions(preserve_permissions);
  }

  #[napi]
  /// Indicate whether numeric ownership ids (like uid and gid on Unix)
  /// are preserved when unpacking this entry.
  ///
  /// This flag is disabled by default and is currently only implemented on
  /// Unix.
  pub fn set_preserve_ownerships(&mut self, preserve_ownerships: bool) {
    self.inner.set_preserve_ownerships(preserve_ownerships);
  }

  #[napi]
  /// Indicate whether files and symlinks should be overwritten on extraction.
  pub fn set_overwrite(&mut self, overwrite: bool) {
    self.inner.set_overwrite(overwrite);
  }

  #[napi]
  /// Indicate whether access time information is preserved when unpacking
  /// this entry.
  ///
  /// This flag is enabled by default.
  pub fn set_preserve_mtime(&mut self, preserve_mtime: bool) {
    self.inner.set_preserve_mtime(preserve_mtime);
  }

  #[napi]
  /// Ignore zeroed headers, which would otherwise indicate to the archive that it has no more
  /// entries.
  ///
  /// This can be used in case multiple tar archives have been concatenated together.
  pub fn set_ignore_zeros(&mut self, ignore_zeros: bool) {
    self.inner.set_ignore_zeros(ignore_zeros);
  }
}
