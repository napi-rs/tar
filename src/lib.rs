#![deny(clippy::all)]

use std::fs::File;

use napi::bindgen_prelude::{Env, Reference};
use napi_derive::napi;

mod entry;

#[napi]
pub struct Archive {
  inner: tar::Archive<File>,
}

#[napi]
impl Archive {
  #[napi(constructor)]
  /// Create a new archive with the underlying path.
  pub fn new(path: String) -> napi::Result<Self> {
    let file = File::open(path)?;
    let inner = tar::Archive::new(file);
    Ok(Self { inner })
  }

  #[napi]
  pub fn entries(
    &mut self,
    this: Reference<Archive>,
    env: Env,
  ) -> napi::Result<crate::entry::Entries> {
    let entries = this.share_with(env, |archive| Ok(archive.inner.entries()?))?;

    Ok(crate::entry::Entries { inner: entries })
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
}
