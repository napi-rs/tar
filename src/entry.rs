use std::io::Read;

use napi::{
  bindgen_prelude::{Env, Reference, SharedReference},
  iterator::Generator,
};
use napi_derive::napi;

use crate::header::ReadonlyHeader;
use crate::{Archive, ArchiveSource};

#[napi(iterator)]
pub struct Entries {
  pub(crate) inner: SharedReference<Archive, tar::Entries<'static, ArchiveSource>>,
}

#[napi]
impl Generator for Entries {
  type Yield = Entry;
  type Next = ();
  type Return = ();

  fn next(&mut self, _next: Option<()>) -> Option<Self::Yield> {
    let entry = self.inner.next()?.map(crate::entry::Entry::new).ok()?;
    Some(entry)
  }
}

#[napi]
pub struct Entry {
  inner: tar::Entry<'static, ArchiveSource>,
}

#[napi]
impl Entry {
  pub fn new(inner: tar::Entry<'static, ArchiveSource>) -> Self {
    Self { inner }
  }

  #[napi]
  /// Returns the path name for this entry.
  ///
  /// This method may fail if the pathname is not valid Unicode and this is
  /// called on a Windows platform.
  ///
  /// Note that this function will convert any `\` characters to directory
  /// separators, and it will not always return the same value as
  /// `self.header().path()` as some archive formats have support for longer
  /// path names described in separate entries.
  ///
  /// It is recommended to use this method instead of inspecting the `header`
  /// directly to ensure that various archive formats are handled correctly.
  pub fn path(&self) -> napi::Result<Option<String>> {
    Ok(self.inner.path()?.to_str().map(|s| s.to_owned()))
  }

  #[napi]
  pub fn header(&self, this: Reference<Entry>, env: Env) -> napi::Result<ReadonlyHeader> {
    Ok(ReadonlyHeader::new(
      this.share_with(env, |e| Ok(e.inner.header()))?,
    ))
  }

  #[napi]
  /// Read the entirety of this entry into a byte vector.
  ///
  /// This is equivalent to the functionality provided by `tar -x -O -f archive.tar filename`
  /// which extracts a single file and outputs its contents to stdout.
  ///
  /// This method will read the entire contents of this entry into memory.
  /// For large files, consider using streaming methods if memory usage is a concern.
  pub fn as_bytes(&mut self) -> napi::Result<napi::bindgen_prelude::Buffer> {
    let mut data = Vec::new();
    self.inner.read_to_end(&mut data)?;
    Ok(data.into())
  }
}
