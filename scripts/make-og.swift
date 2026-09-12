// Renders public/og.png — the 1200x630 link preview image.
//
//   swift scripts/make-og.swift public/og.png
//
// Needs the Typocasual Forest fonts installed (Epilogue, Lora, Atkinson
// Hyperlegible Mono). Falls back to system fonts if they are missing, so this
// still produces a usable image on a machine without them.

import AppKit
import CoreGraphics
import Foundation

let W = 1200
let H = 630

let outPath = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "public/og.png"

// ── Colour helpers ─────────────────────────────────────────────────────

func rgb(_ hex: UInt32, _ alpha: CGFloat = 1) -> CGColor {
    CGColor(
        red: CGFloat((hex >> 16) & 0xff) / 255,
        green: CGFloat((hex >> 8) & 0xff) / 255,
        blue: CGFloat(hex & 0xff) / 255,
        alpha: alpha
    )
}

let ENV_0: UInt32 = 0x091510
let ENV_1: UInt32 = 0x0d1a12
let BONE: UInt32 = 0xe7eee7
let BONE_DIM: UInt32 = 0xa6b8aa
let MOSS_LIT: UInt32 = 0x7d9c4a
let MOSS_MID: UInt32 = 0x47632e
let MOSS_DEEP: UInt32 = 0x25391a
let MOSS_BRIGHT: UInt32 = 0xbdd88c
let MOONLIGHT: UInt32 = 0xe6d58f
let SQUIGGLE: UInt32 = 0xff382c
let SLAB: UInt32 = 0x132a23

// ── Font resolution ────────────────────────────────────────────────────

let fm = NSFontManager.shared

func resolve(_ families: [String], size: CGFloat, weight: Int, traits: NSFontTraitMask = []) -> NSFont {
    for family in families {
        if let f = fm.font(withFamily: family, traits: traits, weight: weight, size: size) {
            return f
        }
    }
    return NSFont.systemFont(ofSize: size, weight: weight >= 9 ? .black : .regular)
}

let fWordmark = resolve(["Epilogue"], size: 132, weight: 14)
let fKicker   = resolve(["Atkinson Hyperlegible Mono VF", "Atkinson Hyperlegible Mono", "Menlo"], size: 17, weight: 6)
let fTagline  = resolve(["Lora"], size: 34, weight: 5, traits: .italicFontMask)
let fMeta     = resolve(["Atkinson Hyperlegible Mono VF", "Atkinson Hyperlegible Mono", "Menlo"], size: 15, weight: 5)

FileHandle.standardError.write("fonts: wordmark=\(fWordmark.fontName) kicker=\(fKicker.fontName) tagline=\(fTagline.fontName)\n".data(using: .utf8)!)

// ── Context ────────────────────────────────────────────────────────────

guard let ctx = CGContext(
    data: nil, width: W, height: H,
    bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
) else {
    FileHandle.standardError.write("could not create context\n".data(using: .utf8)!)
    exit(1)
}

NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)

// Seeded noise so repeat runs are byte-identical.
var seed: UInt64 = 0x9e3779b97f4a7c15
func rand() -> CGFloat {
    seed = seed &* 6364136223846793005 &+ 1442695040888963407
    return CGFloat((seed >> 33) % 100_000) / 100_000
}

// ── Background ─────────────────────────────────────────────────────────

let bg = CGGradient(
    colorsSpace: CGColorSpaceCreateDeviceRGB(),
    colors: [rgb(ENV_0), rgb(ENV_1)] as CFArray,
    locations: [0, 1]
)!
ctx.drawLinearGradient(bg, start: CGPoint(x: 0, y: H), end: CGPoint(x: 0, y: 0), options: [])

// The contact sheet itself, faint, behind everything.
let cols = 6, rows = 3
let tileW = CGFloat(W) / CGFloat(cols)
let tileH = CGFloat(H) / CGFloat(rows)
ctx.setAlpha(0.5)
for c in 0..<cols {
    for r in 0..<rows {
        let x = CGFloat(c) * tileW, y = CGFloat(r) * tileH
        let tone = 0.06 + rand() * 0.10
        ctx.setFillColor(rgb(SLAB, tone + 0.35))
        ctx.fill(CGRect(x: x + 1, y: y + 1, width: tileW - 2, height: tileH - 2))

        // A lit edge on some tiles so it reads as architecture, not a checkerboard.
        if rand() > 0.45 {
            ctx.setFillColor(rgb(0xb4b1a6, 0.05 + rand() * 0.05))
            ctx.fill(CGRect(x: x + 12, y: y + tileH * 0.42, width: tileW * 0.55, height: 3))
        }
    }
}
ctx.setAlpha(1)

// Scrim so the type always reads over the sheet.
let scrim = CGGradient(
    colorsSpace: CGColorSpaceCreateDeviceRGB(),
    colors: [rgb(ENV_1, 0.30), rgb(ENV_1, 0.86), rgb(ENV_1, 0.97)] as CFArray,
    locations: [0, 0.55, 1]
)!
ctx.drawLinearGradient(scrim, start: CGPoint(x: 0, y: H), end: CGPoint(x: 0, y: 0), options: [])

// Dappled light from the top.
let dapple = CGGradient(
    colorsSpace: CGColorSpaceCreateDeviceRGB(),
    colors: [rgb(MOONLIGHT, 0.16), rgb(MOONLIGHT, 0)] as CFArray,
    locations: [0, 1]
)!
ctx.drawRadialGradient(
    dapple,
    startCenter: CGPoint(x: 300, y: H), startRadius: 0,
    endCenter: CGPoint(x: 300, y: H), endRadius: 620,
    options: []
)

// ── Text helpers ───────────────────────────────────────────────────────

func draw(_ text: String, font: NSFont, color: CGColor, x: CGFloat, y: CGFloat) -> CGRect {
    let attrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: NSColor(cgColor: color)!,
    ]
    let s = text as NSString
    s.draw(at: NSPoint(x: x, y: y), withAttributes: attrs)
    let size = s.size(withAttributes: attrs)
    return CGRect(x: x, y: y, width: size.width, height: size.height)
}

let pad: CGFloat = 68

// Kicker
_ = draw("CONTACT SHEET  ·  TWENTY FRAMES", font: fKicker, color: rgb(MOSS_LIT), x: pad, y: 512)

// Wordmark
let mark = draw("typocasual", font: fWordmark, color: rgb(BONE), x: pad - 6, y: 322)

// The red squiggle: the word is a permanent spelling error.
let squiggleY = mark.minY - 16
let squiggle = CGMutablePath()
let step: CGFloat = 26
var sx = pad - 4
squiggle.move(to: CGPoint(x: sx, y: squiggleY))
let endX = min(mark.maxX + 6, CGFloat(W) - pad)
while sx < endX {
    squiggle.addCurve(
        to: CGPoint(x: sx + step, y: squiggleY),
        control1: CGPoint(x: sx + step * 0.3, y: squiggleY + 11),
        control2: CGPoint(x: sx + step * 0.7, y: squiggleY - 11)
    )
    sx += step
}
ctx.setStrokeColor(rgb(SQUIGGLE))
ctx.setLineWidth(6)
ctx.setLineCap(.round)
ctx.setLineJoin(.round)
ctx.addPath(squiggle)
ctx.strokePath()

// Tagline
_ = draw("a structure, left out in the weather", font: fTagline, color: rgb(MOONLIGHT), x: pad, y: 232)

// Footer meta
_ = draw("PLATES · TYPE · CARDS", font: fMeta, color: rgb(BONE_DIM), x: pad, y: 150)

// ── Moss bank along the bottom ─────────────────────────────────────────

func bankPath(amplitude: CGFloat, base: CGFloat) -> CGPath {
    let p = CGMutablePath()
    p.move(to: CGPoint(x: -20, y: -20))
    p.addLine(to: CGPoint(x: -20, y: base))
    let segments = 7
    let segW = (CGFloat(W) + 40) / CGFloat(segments)
    var x: CGFloat = -20
    for i in 0..<segments {
        let nx = x + segW
        let lift = base + (i % 2 == 0 ? amplitude : -amplitude * 0.55) + rand() * amplitude * 0.4
        p.addCurve(
            to: CGPoint(x: nx, y: base + (i % 2 == 0 ? amplitude * 0.4 : -amplitude * 0.3)),
            control1: CGPoint(x: x + segW * 0.3, y: lift),
            control2: CGPoint(x: x + segW * 0.7, y: lift - amplitude * 0.5)
        )
        x = nx
    }
    p.addLine(to: CGPoint(x: CGFloat(W) + 20, y: -20))
    p.closeSubpath()
    return p
}

// A thin moss edge along the bottom joint. Moss belongs in the seams, not
// across the page, so this stays small on purpose.
ctx.setFillColor(rgb(MOSS_DEEP, 0.85))
ctx.addPath(bankPath(amplitude: 9, base: 26))
ctx.fillPath()

ctx.setFillColor(rgb(MOSS_MID, 0.7))
ctx.addPath(bankPath(amplitude: 6, base: 13))
ctx.fillPath()

// A few clumps so the edge is not a clean sine wave.
for _ in 0..<14 {
    let r = 2 + rand() * 5
    let cx = rand() * CGFloat(W)
    let cy = 6 + rand() * 20
    ctx.setFillColor(rgb(rand() > 0.5 ? MOSS_MID : MOSS_DEEP, 0.5 + rand() * 0.4))
    ctx.fillEllipse(in: CGRect(x: cx, y: cy, width: r * 2, height: r * 1.35))
}

// ── Grain ──────────────────────────────────────────────────────────────

let nw = 300, nh = 158
var noise = [UInt8](repeating: 0, count: nw * nh * 4)
for i in 0..<(nw * nh) {
    let v = UInt8(rand() * 255)
    noise[i * 4 + 0] = v
    noise[i * 4 + 1] = v
    noise[i * 4 + 2] = v
    noise[i * 4 + 3] = 255
}
if let noiseCtx = CGContext(
    data: &noise, width: nw, height: nh,
    bitsPerComponent: 8, bytesPerRow: nw * 4,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
), let noiseImg = noiseCtx.makeImage() {
    ctx.saveGState()
    ctx.setBlendMode(.overlay)
    ctx.setAlpha(0.16)
    ctx.interpolationQuality = .none
    ctx.draw(noiseImg, in: CGRect(x: 0, y: 0, width: CGFloat(W), height: CGFloat(H)))
    ctx.restoreGState()
}

// ── Write ──────────────────────────────────────────────────────────────

guard let image = ctx.makeImage() else {
    FileHandle.standardError.write("could not render image\n".data(using: .utf8)!)
    exit(1)
}

let url = URL(fileURLWithPath: outPath)
let rep = NSBitmapImageRep(cgImage: image)

// Grain defeats PNG compression - a JPEG of the same image is roughly a fifth
// the size, which matters because some platforms refuse large preview cards.
let isJPEG = url.pathExtension.lowercased() == "jpg" || url.pathExtension.lowercased() == "jpeg"
let encoded = isJPEG
    ? rep.representation(using: .jpeg, properties: [.compressionFactor: 0.88])
    : rep.representation(using: .png, properties: [:])

guard let data = encoded else {
    FileHandle.standardError.write("could not encode image\n".data(using: .utf8)!)
    exit(1)
}
try data.write(to: url)

FileHandle.standardError.write(
    "wrote \(outPath) — \(W)x\(H), \(data.count) bytes \(isJPEG ? "jpeg" : "png")\n"
        .data(using: .utf8)!
)
