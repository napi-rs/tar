use std::fs::File;

use napi::{bindgen_prelude::SharedReference, iterator::Generator};
use napi_derive::napi;

use crate::Archive;

#[napi(iterator)]
pub struct Entries {
  pub(crate) inner: SharedReference<Archive, tar::Entries<'static, File>>,
}

#[napi]
impl Generator for Entries {
  type Yield = Entry;
  type Next = ();
  type Return = ();

  fn next(&mut self, _next: Option<()>) -> Option<Self::Yield> {
    let entry = self
      .inner
      .next()?
      .map(|entry| crate::entry::Entry::new(entry))
      .ok()?;
    Some(entry)
  }
}

#[napi]
pub struct Entry {
  inner: tar::Entry<'static, File>,
}

#[napi]
impl Entry {
  pub fn new(inner: tar::Entry<'static, File>) -> Self {
    Self { inner }
  }

  #[napi]
  pub fn path(&self) -> napi::Result<Option<String>> {
    Ok(self.inner.path()?.to_str().map(|s| s.to_owned()))
  }
}
