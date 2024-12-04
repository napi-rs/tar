/* auto-generated by NAPI-RS */
/* eslint-disable */
export declare class Archive {
  /** Create a new archive with the underlying path. */
  constructor(input: string | Buffer)
  entries(): Entries
  /**
   * Unpacks the contents tarball into the specified `dst`.
   *
   * This function will iterate over the entire contents of this tarball,
   * extracting each file in turn to the location specified by the entry's
   * path name.
   *
   * This operation is relatively sensitive in that it will not write files
   * outside of the path specified by `dst`. Files in the archive which have
   * a '..' in their path are skipped during the unpacking process.
   */
  unpack(to: string): void
  /**
   * Set the mask of the permission bits when unpacking this entry.
   *
   * The mask will be inverted when applying against a mode, similar to how
   * `umask` works on Unix. In logical notation it looks like:
   *
   * ```text
   * new_mode = old_mode & (~mask)
   * ```
   *
   * The mask is 0 by default and is currently only implemented on Unix.
   */
  setMask(mask: number): void
  /**
   * Indicate whether extended file attributes (xattrs on Unix) are preserved
   * when unpacking this archive.
   *
   * This flag is disabled by default and is currently only implemented on
   * Unix using xattr support. This may eventually be implemented for
   * Windows, however, if other archive implementations are found which do
   * this as well.
   */
  setUnpackXattrs(unpackXattrs: boolean): void
  /**
   * Indicate whether extended permissions (like suid on Unix) are preserved
   * when unpacking this entry.
   *
   * This flag is disabled by default and is currently only implemented on
   * Unix.
   */
  setPreservePermissions(preservePermissions: boolean): void
  /**
   * Indicate whether numeric ownership ids (like uid and gid on Unix)
   * are preserved when unpacking this entry.
   *
   * This flag is disabled by default and is currently only implemented on
   * Unix.
   */
  setPreserveOwnerships(preserveOwnerships: boolean): void
  /** Indicate whether files and symlinks should be overwritten on extraction. */
  setOverwrite(overwrite: boolean): void
  /**
   * Indicate whether access time information is preserved when unpacking
   * this entry.
   *
   * This flag is enabled by default.
   */
  setPreserveMtime(preserveMtime: boolean): void
  /**
   * Ignore zeroed headers, which would otherwise indicate to the archive that it has no more
   * entries.
   *
   * This can be used in case multiple tar archives have been concatenated together.
   */
  setIgnoreZeros(ignoreZeros: boolean): void
}

export declare class Entries {
  [Symbol.iterator](): Iterator<Entry, void, void>
}

export declare class Entry {
  /**
   * Returns the path name for this entry.
   *
   * This method may fail if the pathname is not valid Unicode and this is
   * called on a Windows platform.
   *
   * Note that this function will convert any `\` characters to directory
   * separators, and it will not always return the same value as
   * `self.header().path()` as some archive formats have support for longer
   * path names described in separate entries.
   *
   * It is recommended to use this method instead of inspecting the `header`
   * directly to ensure that various archive formats are handled correctly.
   */
  path(): string | null
  header(): ReadonlyHeader
}

export declare class Header {
  /** Returns a view into this header as a byte array. */
  asBytes(): Buffer
  /**
   * Returns the size of entry's data this header represents.
   *
   * This is different from `Header::size` for sparse files, which have
   * some longer `size()` but shorter `entry_size()`. The `entry_size()`
   * listed here should be the number of bytes in the archive this header
   * describes.
   *
   * May return an error if the field is corrupted.
   */
  entrySize(): bigint
  /**
   * Returns the file size this header represents.
   *
   * May return an error if the field is corrupted.
   */
  size(): bigint
  /** Encodes the `size` argument into the size field of this header. */
  setSize(size: number | bigint): void
  /**
   * Returns the raw path name stored in this header.
   *
   * This method may fail if the pathname is not valid Unicode and this is
   * called on a Windows platform.
   *
   * Note that this function will convert any `\` characters to directory
   * separators.
   */
  path(): string
  /**
   * Sets the path name for this header.
   *
   * This function will set the pathname listed in this header, encoding it
   * in the appropriate format. May fail if the path is too long or if the
   * path specified is not Unicode and this is a Windows platform. Will
   * strip out any "." path component, which signifies the current directory.
   *
   * Note: This function does not support names over 100 bytes, or paths
   * over 255 bytes, even for formats that support longer names. Instead,
   * use `Builder` methods to insert a long-name extension at the same time
   * as the file content.
   */
  setPath(path: string): void
  /**
   * Returns the link name stored in this header as a byte array, if any.
   *
   * This function is guaranteed to succeed, but you may wish to call the
   * `link_name` method to convert to a `Path`.
   *
   * Note that this function will convert any `\` characters to directory
   * separators.
   */
  linkName(): string | null
  /**
   * Sets the link name for this header.
   *
   * This function will set the linkname listed in this header, encoding it
   * in the appropriate format. May fail if the link name is too long or if
   * the path specified is not Unicode and this is a Windows platform. Will
   * strip out any "." path component, which signifies the current directory.
   *
   * To use GNU long link names, prefer instead [`crate::Builder::append_link`].
   */
  setLinkName(linkName: string): void
  /**
   * Sets the link name for this header without any transformation.
   *
   * This function is like [`Self::set_link_name`] but accepts an arbitrary byte array.
   * Hence it will not perform any canonicalization, such as replacing duplicate `//` with `/`.
   */
  setLinkNameLiteral(linkName: string): void
  /**
   * Returns the mode bits for this file
   *
   * May return an error if the field is corrupted.
   */
  mode(): number
  /** Encodes the `mode` provided into this header. */
  setMode(mode: number): void
  /**
   * Returns the value of the owner's user ID field
   *
   * May return an error if the field is corrupted.
   */
  uid(): bigint
  /** Encodes the `uid` provided into this header. */
  setUid(uid: bigint): void
  /** Returns the value of the group's user ID field */
  gid(): bigint
  /** Encodes the `gid` provided into this header. */
  setGid(gid: bigint): void
  /** Returns the last modification time in Unix time format */
  mtime(): bigint
  /**
   * Encodes the `mtime` provided into this header.
   *
   * Note that this time is typically a number of seconds passed since
   * January 1, 1970.
   */
  setTime(mtime: bigint): void
  /**
   * Return the user name of the owner of this file.
   *
   * A return value of `Ok(Some(..))` indicates that the user name was
   * present and was valid utf-8, `Ok(None)` indicates that the user name is
   * not present in this archive format, and `Err` indicates that the user
   * name was present but was not valid utf-8.
   */
  username(): string | null
  /**
   * Sets the username inside this header.
   *
   * This function will return an error if this header format cannot encode a
   * user name or the name is too long.
   */
  setUsername(username: string): void
  /**
   * Return the group name of the owner of this file.
   *
   * A return value of `Ok(Some(..))` indicates that the group name was
   * present and was valid utf-8, `Ok(None)` indicates that the group name is
   * not present in this archive format, and `Err` indicates that the group
   * name was present but was not valid utf-8.
   */
  groupname(): string | null
  /**
   * Sets the group name inside this header.
   *
   * This function will return an error if this header format cannot encode a
   * group name or the name is too long.
   */
  setGroupname(groupname: string): void
  /**
   * Returns the device major number, if present.
   *
   * This field may not be present in all archives, and it may not be
   * correctly formed in all archives. `Ok(Some(..))` means it was present
   * and correctly decoded, `Ok(None)` indicates that this header format does
   * not include the device major number, and `Err` indicates that it was
   * present and failed to decode.
   */
  deviceMajor(): number | null
  /**
   * Encodes the value `major` into the dev_major field of this header.
   *
   * This function will return an error if this header format cannot encode a
   * major device number.
   */
  setDeviceMajor(deviceMajor: number): void
  /**
   * Returns the device minor number, if present.
   *
   * This field may not be present in all archives, and it may not be
   * correctly formed in all archives. `Ok(Some(..))` means it was present
   * and correctly decoded, `Ok(None)` indicates that this header format does
   * not include the device minor number, and `Err` indicates that it was
   * present and failed to decode.
   */
  deviceMinor(): number | null
  /**
   * Encodes the value `minor` into the dev_minor field of this header.
   *
   * This function will return an error if this header format cannot encode a
   * minor device number.
   */
  setDeviceMinor(deviceMinor: number): void
  /** Returns the type of file described by this header. */
  entryType(): EntryType
  /** Sets the type of file that will be described by this header. */
  setEntryType(entryType: EntryType): void
  /**
   * Returns the checksum field of this header.
   *
   * May return an error if the field is corrupted.
   */
  cksum(): number
  /**
   * Sets the checksum field of this header based on the current fields in
   * this header.
   */
  setCksum(): void
}

export declare class ReadonlyHeader {
  /** Returns a view into this header as a byte array. */
  asBytes(): Buffer
  /**
   * Returns the size of entry's data this header represents.
   *
   * This is different from `Header::size` for sparse files, which have
   * some longer `size()` but shorter `entry_size()`. The `entry_size()`
   * listed here should be the number of bytes in the archive this header
   * describes.
   *
   * May return an error if the field is corrupted.
   */
  entrySize(): bigint
  /**
   * Returns the file size this header represents.
   *
   * May return an error if the field is corrupted.
   */
  size(): bigint
  /**
   * Returns the raw path name stored in this header.
   *
   * This method may fail if the pathname is not valid Unicode and this is
   * called on a Windows platform.
   *
   * Note that this function will convert any `\` characters to directory
   * separators.
   */
  path(): string
  /**
   * Returns the link name stored in this header as a byte array, if any.
   *
   * This function is guaranteed to succeed, but you may wish to call the
   * `link_name` method to convert to a `Path`.
   *
   * Note that this function will convert any `\` characters to directory
   * separators.
   */
  linkName(): string | null
  /**
   * Returns the mode bits for this file
   *
   * May return an error if the field is corrupted.
   */
  mode(): number
  /**
   * Returns the value of the owner's user ID field
   *
   * May return an error if the field is corrupted.
   */
  uid(): bigint
  /** Returns the value of the group's user ID field */
  gid(): bigint
  /** Returns the last modification time in Unix time format */
  mtime(): bigint
  /**
   * Return the user name of the owner of this file.
   *
   * A return value of `Ok(Some(..))` indicates that the user name was
   * present and was valid utf-8, `Ok(None)` indicates that the user name is
   * not present in this archive format, and `Err` indicates that the user
   * name was present but was not valid utf-8.
   */
  username(): string | null
  /**
   * Return the group name of the owner of this file.
   *
   * A return value of `Ok(Some(..))` indicates that the group name was
   * present and was valid utf-8, `Ok(None)` indicates that the group name is
   * not present in this archive format, and `Err` indicates that the group
   * name was present but was not valid utf-8.
   */
  groupname(): string | null
  /**
   * Returns the device major number, if present.
   *
   * This field may not be present in all archives, and it may not be
   * correctly formed in all archives. `Ok(Some(..))` means it was present
   * and correctly decoded, `Ok(None)` indicates that this header format does
   * not include the device major number, and `Err` indicates that it was
   * present and failed to decode.
   */
  deviceMajor(): number | null
  /**
   * Returns the device minor number, if present.
   *
   * This field may not be present in all archives, and it may not be
   * correctly formed in all archives. `Ok(Some(..))` means it was present
   * and correctly decoded, `Ok(None)` indicates that this header format does
   * not include the device minor number, and `Err` indicates that it was
   * present and failed to decode.
   */
  deviceMinor(): number | null
  /** Returns the type of file described by this header. */
  entryType(): EntryType
  /**
   * Returns the checksum field of this header.
   *
   * May return an error if the field is corrupted.
   */
  cksum(): number
}

/**
 * See [https://en.wikipedia.org/wiki/Tar_%28computing%29#UStar_format](https://en.wikipedia.org/wiki/Tar_%28computing%29#UStar_format)
 * Indicate for the type of file described by a header.
 *
 * Each `Header` has an `entry_type` method returning an instance of this type
 * which can be used to inspect what the header is describing.
 *
 * A non-exhaustive enum representing the possible entry types
 */
export declare const enum EntryType {
  /** Regular file */
  Regular = 0,
  /** Hard link */
  Link = 1,
  /** Symbolic link */
  Symlink = 2,
  /** Character device */
  Char = 3,
  /** Block device */
  Block = 4,
  /** Directory */
  Directory = 5,
  /** Named pipe (fifo) */
  Fifo = 6,
  /** Implementation-defined 'high-performance' type, treated as regular file */
  Continuous = 7,
  /** GNU extension - long file name */
  GNULongName = 8,
  /** GNU extension - long link name (link target) */
  GNULongLink = 9,
  /** GNU extension - sparse file */
  GNUSparse = 10,
  /** Global extended header */
  XGlobalHeader = 11,
  /** Extended Header */
  XHeader = 12
}
