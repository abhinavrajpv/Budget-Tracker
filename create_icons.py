import zlib
import struct
import math

def make_png(width, height, get_pixel):
    # PNG signature
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc
    
    # IDAT chunk (image data)
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # filter byte 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel(x, y, width, height)
            raw_data.extend([r, g, b, a])
            
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc
    
    # IEND chunk
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    png += struct.pack('>I', 0) + b'IEND' + iend_crc
    return bytes(png)

def draw_zenith_icon(x, y, width, height):
    # Rounded rect background
    # Gradient from #6366f1 (99, 102, 241) to #8b5cf6 (139, 92, 246)
    ratio = (x + y) / (width + height)
    r = int(99 + (139 - 99) * ratio)
    g = int(102 + (92 - 102) * ratio)
    b = int(241 + (246 - 241) * ratio)
    
    # Checkmark logic (scaled to width, height)
    # Checkmark points: p1(0.28, 0.52), p2(0.44, 0.68), p3(0.72, 0.36)
    # Distance to line segment
    def dist_to_segment(px, py, x1, y1, x2, y2):
        dx, dy = x2 - x1, y2 - y1
        if dx == 0 and dy == 0:
            return math.hypot(px - x1, py - y1)
        t = ((px - x1) * dx + (py - y1) * dy) / (dx*dx + dy*dy)
        t = max(0.0, min(1.0, t))
        return math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
    
    nx = x / width
    ny = y / height
    
    d1 = dist_to_segment(nx, ny, 0.28, 0.52, 0.44, 0.68)
    d2 = dist_to_segment(nx, ny, 0.44, 0.68, 0.72, 0.36)
    d = min(d1, d2)
    
    stroke_radius = 0.052
    if d < stroke_radius:
        # Checkmark white color with anti-aliasing
        edge = stroke_radius - d
        if edge < 0.01:
            alpha = edge / 0.01
            return (int(r + (255 - r) * alpha), int(g + (255 - g) * alpha), int(b + (255 - b) * alpha), 255)
        return (255, 255, 255, 255)
        
    return (r, g, b, 255)

for size in [192, 512]:
    png_data = make_png(size, size, draw_zenith_icon)
    filename = f'icon-{size}.png'
    with open(filename, 'wb') as f:
        f.write(png_data)
    print(f'Wrote {filename} ({len(png_data)} bytes)')
