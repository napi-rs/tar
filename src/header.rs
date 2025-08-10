use napi::{
  Either, Result,
  bindgen_prelude::{BigInt, Buffer, SharedReference},
};
use napi_derive::napi;

use crate::entry::Entry;

/// See [https://en.wikipedia.org/wiki/Tar_%28computing%29#UStar_format](https://en.wikipedia.org/wiki/Tar_%28computing%29#UStar_format)
/// Indicate for the type of file described by a header.
///
/// Each `Header` has an `entry_type` method returning an instance of this type
/// which can be used to inspect what the header is describing.
///
/// A non-exhaustive enum representing the possible entry types
#[napi]
pub enum EntryType {
  /// Regular file
  Regular,
  /// Hard link
  Link,
  /// Symbolic link
  Symlink,
  /// Character device
  Char,
  /// Block device
  Block,
  /// Directory
  Directory,
  /// Named pipe (fifo)
  Fifo,
  /// Implementation-defined 'high-performance' type, treated as regular file
  Continuous,
  /// GNU extension - long file name
  GNULongName,
  /// GNU extension - long link name (link target)
  GNULongLink,
  /// GNU extension - sparse file
  GNUSparse,
  /// Global extended header
  XGlobalHeader,
  /// Extended Header
  XHeader,
}

impl From<tar::EntryType> for EntryType {
  fn from(value: tar::EntryType) -> Self {
    match value {
      tar::EntryType::Regular => Self::Regular,
      tar::EntryType::Link => Self::Link,
      tar::EntryType::Symlink => Self::Symlink,
      tar::EntryType::Char => Self::Char,
      tar::EntryType::Block => Self::Block,
      tar::EntryType::Directory => Self::Directory,
      tar::EntryType::Fifo => Self::Fifo,
      tar::EntryType::Continuous => Self::Continuous,
      tar::EntryType::GNULongName => Self::GNULongName,
      tar::EntryType::GNULongLink => Self::GNULongLink,
      tar::EntryType::GNUSparse => Self::GNUSparse,
      tar::EntryType::XGlobalHeader => Self::XGlobalHeader,
      tar::EntryType::XHeader => Self::XHeader,
      _ => unreachable!(),
    }
  }
}

impl From<EntryType> for tar::EntryType {
  fn from(value: EntryType) -> Self {
    match value {
      EntryType::Regular => Self::Regular,
      EntryType::Link => Self::Link,
      EntryType::Symlink => Self::Symlink,
      EntryType::Char => Self::Char,
      EntryType::Block => Self::Block,
      EntryType::Directory => Self::Directory,
      EntryType::Fifo => Self::Fifo,
      EntryType::Continuous => Self::Continuous,
      EntryType::GNULongName => Self::GNULongName,
      EntryType::GNULongLink => Self::GNULongLink,
      EntryType::GNUSparse => Self::GNUSparse,
      EntryType::XGlobalHeader => Self::XGlobalHeader,
      EntryType::XHeader => Self::XHeader,
    }
  }
}

#[napi]
pub struct Header {
  inner: SharedReference<Entry, tar::Header>,
}

#[napi]
impl Header {
  pub fn new(inner: SharedReference<Entry, tar::Header>) -> Self {
    Self { inner }
  }

  #[napi]
  /// Returns a view into this header as a byte array.
  pub fn as_bytes(&self) -> Buffer {
    self.inner.as_bytes().to_vec().into()
  }

  #[napi]
  /// Returns the size of entry's data this header represents.
  ///
  /// This is different from `Header::size` for sparse files, which have
  /// some longer `size()` but shorter `entry_size()`. The `entry_size()`
  /// listed here should be the number of bytes in the archive this header
  /// describes.
  ///
  /// May return an error if the field is corrupted.
  pub fn entry_size(&self) -> Result<u64> {
    Ok(self.inner.entry_size()?)
  }

  #[napi]
  /// Returns the file size this header represents.
  ///
  /// May return an error if the field is corrupted.
  pub fn size(&self) -> Result<u64> {
    Ok(self.inner.size()?)
  }

  #[napi]
  /// Encodes the `size` argument into the size field of this header.
  pub fn set_size(&mut self, size: Either<u32, BigInt>) {
    let size = match size {
      Either::A(size) => size as u64,
      Either::B(size) => size.get_u64().1,
    };
    self.inner.set_size(size);
  }

  #[napi]
  /// Returns the raw path name stored in this header.
  ///
  /// This method may fail if the pathname is not valid Unicode and this is
  /// called on a Windows platform.
  ///
  /// Note that this function will convert any `\` characters to directory
  /// separators.
  pub fn path(&self) -> Result<String> {
    Ok(self.inner.path()?.to_string_lossy().to_string())
  }

  #[napi]
  /// Sets the path name for this header.
  ///
  /// This function will set the pathname listed in this header, encoding it
  /// in the appropriate format. May fail if the path is too long or if the
  /// path specified is not Unicode and this is a Windows platform. Will
  /// strip out any "." path component, which signifies the current directory.
  ///
  /// Note: This function does not support names over 100 bytes, or paths
  /// over 255 bytes, even for formats that support longer names. Instead,
  /// use `Builder` methods to insert a long-name extension at the same time
  /// as the file content.
  pub fn set_path(&mut self, path: String) -> Result<()> {
    self.inner.set_path(path)?;
    Ok(())
  }

  #[napi]
  /// Returns the link name stored in this header as a byte array, if any.
  ///
  /// This function is guaranteed to succeed, but you may wish to call the
  /// `link_name` method to convert to a `Path`.
  ///
  /// Note that this function will convert any `\` characters to directory
  /// separators.
  pub fn link_name(&self) -> Result<Option<String>> {
    Ok(
      self
        .inner
        .link_name()?
        .map(|l| l.to_string_lossy().to_string()),
    )
  }

  #[napi]
  /// Sets the link name for this header.
  ///
  /// This function will set the linkname listed in this header, encoding it
  /// in the appropriate format. May fail if the link name is too long or if
  /// the path specified is not Unicode and this is a Windows platform. Will
  /// strip out any "." path component, which signifies the current directory.
  ///
  /// To use GNU long link names, prefer instead [`crate::Builder::append_link`].
  pub fn set_link_name(&mut self, link_name: String) -> Result<()> {
    self.inner.set_link_name(link_name)?;
    Ok(())
  }

  #[napi]
  /// Sets the link name for this header without any transformation.
  ///
  /// This function is like [`Self::set_link_name`] but accepts an arbitrary byte array.
  /// Hence it will not perform any canonicalization, such as replacing duplicate `//` with `/`.
  pub fn set_link_name_literal(&mut self, link_name: String) -> Result<()> {
    self.inner.set_link_name_literal(link_name)?;
    Ok(())
  }

  #[napi]
  /// Returns the mode bits for this file
  ///
  /// May return an error if the field is corrupted.
  pub fn mode(&self) -> Result<u32> {
    Ok(self.inner.mode()?)
  }

  #[napi]
  /// Encodes the `mode` provided into this header.
  pub fn set_mode(&mut self, mode: u32) {
    self.inner.set_mode(mode);
  }

  #[napi]
  /// Returns the value of the owner's user ID field
  ///
  /// May return an error if the field is corrupted.
  pub fn uid(&self) -> Result<u64> {
    Ok(self.inner.uid()?)
  }

  #[napi]
  /// Encodes the `uid` provided into this header.
  pub fn set_uid(&mut self, uid: BigInt) {
    let (_, uid, _) = uid.get_u64();
    self.inner.set_uid(uid);
  }

  #[napi]
  /// Returns the value of the group's user ID field
  pub fn gid(&self) -> Result<u64> {
    Ok(self.inner.gid()?)
  }

  #[napi]
  /// Encodes the `gid` provided into this header.
  pub fn set_gid(&mut self, gid: BigInt) {
    let (_, gid, _) = gid.get_u64();
    self.inner.set_gid(gid);
  }

  #[napi]
  /// Returns the last modification time in Unix time format
  pub fn mtime(&self) -> Result<u64> {
    Ok(self.inner.mtime()?)
  }

  #[napi]
  /// Encodes the `mtime` provided into this header.
  ///
  /// Note that this time is typically a number of seconds passed since
  /// January 1, 1970.
  pub fn set_time(&mut self, mtime: BigInt) {
    let (_, mtime, _) = mtime.get_u64();
    self.inner.set_mtime(mtime);
  }

  #[napi]
  /// Return the user name of the owner of this file.
  ///
  /// A return value of `Ok(Some(..))` indicates that the user name was
  /// present and was valid utf-8, `Ok(None)` indicates that the user name is
  /// not present in this archive format, and `Err` indicates that the user
  /// name was present but was not valid utf-8.
  pub fn username(&self) -> Result<Option<String>> {
    Ok(
      self
        .inner
        .username()
        .map_err(anyhow::Error::from)?
        .map(|u| u.to_string()),
    )
  }

  #[napi]
  /// Sets the username inside this header.
  ///
  /// This function will return an error if this header format cannot encode a
  /// user name or the name is too long.
  pub fn set_username(&mut self, username: String) -> Result<()> {
    self.inner.set_username(&username)?;
    Ok(())
  }

  #[napi]
  /// Return the group name of the owner of this file.
  ///
  /// A return value of `Ok(Some(..))` indicates that the group name was
  /// present and was valid utf-8, `Ok(None)` indicates that the group name is
  /// not present in this archive format, and `Err` indicates that the group
  /// name was present but was not valid utf-8.
  pub fn groupname(&self) -> Result<Option<String>> {
    Ok(
      self
        .inner
        .groupname()
        .map_err(anyhow::Error::from)?
        .map(|g| g.to_string()),
    )
  }

  #[napi]
  /// Sets the group name inside this header.
  ///
  /// This function will return an error if this header format cannot encode a
  /// group name or the name is too long.
  pub fn set_groupname(&mut self, groupname: String) -> Result<()> {
    self.inner.set_groupname(&groupname)?;
    Ok(())
  }

  #[napi]
  /// Returns the device major number, if present.
  ///
  /// This field may not be present in all archives, and it may not be
  /// correctly formed in all archives. `Ok(Some(..))` means it was present
  /// and correctly decoded, `Ok(None)` indicates that this header format does
  /// not include the device major number, and `Err` indicates that it was
  /// present and failed to decode.
  pub fn device_major(&self) -> Result<Option<u32>> {
    Ok(self.inner.device_major()?)
  }

  #[napi]
  /// Encodes the value `major` into the dev_major field of this header.
  ///
  /// This function will return an error if this header format cannot encode a
  /// major device number.
  pub fn set_device_major(&mut self, device_major: u32) -> Result<()> {
    self.inner.set_device_major(device_major)?;
    Ok(())
  }

  #[napi]
  /// Returns the device minor number, if present.
  ///
  /// This field may not be present in all archives, and it may not be
  /// correctly formed in all archives. `Ok(Some(..))` means it was present
  /// and correctly decoded, `Ok(None)` indicates that this header format does
  /// not include the device minor number, and `Err` indicates that it was
  /// present and failed to decode.
  pub fn device_minor(&self) -> Result<Option<u32>> {
    Ok(self.inner.device_minor()?)
  }

  #[napi]
  /// Encodes the value `minor` into the dev_minor field of this header.
  ///
  /// This function will return an error if this header format cannot encode a
  /// minor device number.
  pub fn set_device_minor(&mut self, device_minor: u32) -> Result<()> {
    self.inner.set_device_minor(device_minor)?;
    Ok(())
  }

  #[napi]
  /// Returns the type of file described by this header.
  pub fn entry_type(&self) -> EntryType {
    self.inner.entry_type().into()
  }

  #[napi]
  /// Sets the type of file that will be described by this header.
  pub fn set_entry_type(&mut self, entry_type: EntryType) {
    self.inner.set_entry_type(entry_type.into());
  }

  #[napi]
  /// Returns the checksum field of this header.
  ///
  /// May return an error if the field is corrupted.
  pub fn cksum(&self) -> Result<u32> {
    Ok(self.inner.cksum()?)
  }

  #[napi]
  /// Sets the checksum field of this header based on the current fields in
  /// this header.
  pub fn set_cksum(&mut self) {
    self.inner.set_cksum();
  }
}

#[napi]
pub struct ReadonlyHeader {
  inner: SharedReference<Entry, &'static tar::Header>,
}

#[napi]
impl ReadonlyHeader {
  pub fn new(inner: SharedReference<Entry, &'static tar::Header>) -> Self {
    Self { inner }
  }

  #[napi]
  /// Returns a view into this header as a byte array.
  pub fn as_bytes(&self) -> Buffer {
    self.inner.as_bytes().to_vec().into()
  }

  #[napi]
  /// Returns the size of entry's data this header represents.
  ///
  /// This is different from `Header::size` for sparse files, which have
  /// some longer `size()` but shorter `entry_size()`. The `entry_size()`
  /// listed here should be the number of bytes in the archive this header
  /// describes.
  ///
  /// May return an error if the field is corrupted.
  pub fn entry_size(&self) -> Result<u64> {
    Ok(self.inner.entry_size()?)
  }

  #[napi]
  /// Returns the file size this header represents.
  ///
  /// May return an error if the field is corrupted.
  pub fn size(&self) -> Result<u64> {
    Ok(self.inner.size()?)
  }

  #[napi]
  /// Returns the raw path name stored in this header.
  ///
  /// This method may fail if the pathname is not valid Unicode and this is
  /// called on a Windows platform.
  ///
  /// Note that this function will convert any `\` characters to directory
  /// separators.
  pub fn path(&self) -> Result<String> {
    Ok(self.inner.path()?.to_string_lossy().to_string())
  }

  #[napi]
  /// Returns the link name stored in this header as a byte array, if any.
  ///
  /// This function is guaranteed to succeed, but you may wish to call the
  /// `link_name` method to convert to a `Path`.
  ///
  /// Note that this function will convert any `\` characters to directory
  /// separators.
  pub fn link_name(&self) -> Result<Option<String>> {
    Ok(
      self
        .inner
        .link_name()?
        .map(|l| l.to_string_lossy().to_string()),
    )
  }

  #[napi]
  /// Returns the mode bits for this file
  ///
  /// May return an error if the field is corrupted.
  pub fn mode(&self) -> Result<u32> {
    Ok(self.inner.mode()?)
  }

  #[napi]
  /// Returns the value of the owner's user ID field
  ///
  /// May return an error if the field is corrupted.
  pub fn uid(&self) -> Result<u64> {
    Ok(self.inner.uid()?)
  }

  #[napi]
  /// Returns the value of the group's user ID field
  pub fn gid(&self) -> Result<u64> {
    Ok(self.inner.gid()?)
  }

  #[napi]
  /// Returns the last modification time in Unix time format
  pub fn mtime(&self) -> Result<u64> {
    Ok(self.inner.mtime()?)
  }

  #[napi]
  /// Return the user name of the owner of this file.
  ///
  /// A return value of `Ok(Some(..))` indicates that the user name was
  /// present and was valid utf-8, `Ok(None)` indicates that the user name is
  /// not present in this archive format, and `Err` indicates that the user
  /// name was present but was not valid utf-8.
  pub fn username(&self) -> Result<Option<String>> {
    Ok(
      self
        .inner
        .username()
        .map_err(anyhow::Error::from)?
        .map(|u| u.to_string()),
    )
  }

  #[napi]
  /// Return the group name of the owner of this file.
  ///
  /// A return value of `Ok(Some(..))` indicates that the group name was
  /// present and was valid utf-8, `Ok(None)` indicates that the group name is
  /// not present in this archive format, and `Err` indicates that the group
  /// name was present but was not valid utf-8.
  pub fn groupname(&self) -> Result<Option<String>> {
    Ok(
      self
        .inner
        .groupname()
        .map_err(anyhow::Error::from)?
        .map(|g| g.to_string()),
    )
  }

  #[napi]
  /// Returns the device major number, if present.
  ///
  /// This field may not be present in all archives, and it may not be
  /// correctly formed in all archives. `Ok(Some(..))` means it was present
  /// and correctly decoded, `Ok(None)` indicates that this header format does
  /// not include the device major number, and `Err` indicates that it was
  /// present and failed to decode.
  pub fn device_major(&self) -> Result<Option<u32>> {
    Ok(self.inner.device_major()?)
  }

  #[napi]
  /// Returns the device minor number, if present.
  ///
  /// This field may not be present in all archives, and it may not be
  /// correctly formed in all archives. `Ok(Some(..))` means it was present
  /// and correctly decoded, `Ok(None)` indicates that this header format does
  /// not include the device minor number, and `Err` indicates that it was
  /// present and failed to decode.
  pub fn device_minor(&self) -> Result<Option<u32>> {
    Ok(self.inner.device_minor()?)
  }

  #[napi]
  /// Returns the type of file described by this header.
  pub fn entry_type(&self) -> EntryType {
    self.inner.entry_type().into()
  }

  #[napi]
  /// Returns the checksum field of this header.
  ///
  /// May return an error if the field is corrupted.
  pub fn cksum(&self) -> Result<u32> {
    Ok(self.inner.cksum()?)
  }
}
