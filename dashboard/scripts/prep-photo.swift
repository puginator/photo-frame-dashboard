// Makes the frame's copies of one photo with macOS ImageIO: a 1280 px and a 400 px JPEG (long
// edge), rotated upright, with no metadata (so no GPS). Reads HEIC, JPEG, PNG.
// Usage: swift scripts/prep-photo.swift <input> <big.jpg> <thumb.jpg>
// Prints "<YYYY-MM-DD> <l|p>": the date taken (EXIF, else a YYYY-MM-DD at the start of the file
// name, else the file's modified date) and landscape/portrait.
import Foundation
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count == 4, let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil) else {
  FileHandle.standardError.write("cannot read \(args.count > 1 ? args[1] : "(no file)")\n".data(using: .utf8)!)
  exit(1)
}

func write(_ maxEdge: Int, _ path: String) -> CGImage {
  let opts: [CFString: Any] = [
    kCGImageSourceCreateThumbnailFromImageAlways: true,
    kCGImageSourceCreateThumbnailWithTransform: true, // apply EXIF rotation
    kCGImageSourceThumbnailMaxPixelSize: maxEdge,
  ]
  let img = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary)!
  let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, UTType.jpeg.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, img, [kCGImageDestinationLossyCompressionQuality: 0.82] as CFDictionary)
  CGImageDestinationFinalize(dest)
  return img
}
let big = write(1280, args[2])
_ = write(400, args[3])

let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any] ?? [:]
let exif = props[kCGImagePropertyExifDictionary] as? [CFString: Any]
var date = ""
if let taken = exif?[kCGImagePropertyExifDateTimeOriginal] as? String, taken.count >= 10 { // "2024:05:19 14:03:22"
  date = String(taken.prefix(10)).replacingOccurrences(of: ":", with: "-")
}
let file = URL(fileURLWithPath: args[1]).lastPathComponent
if date.isEmpty, let r = file.range(of: #"^\d{4}-\d{2}-\d{2}"#, options: .regularExpression) { date = String(file[r]) }
if date.isEmpty {
  let mod = (try? FileManager.default.attributesOfItem(atPath: args[1])[.modificationDate] as? Date) ?? Date()
  let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
  date = f.string(from: mod)
}
print(date, big.width >= big.height ? "l" : "p")
