import zlib
import struct
import math

def make_png(width, height, get_pixel):
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc
    
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0
        for x in range(width):
            r, g, b, a = get_pixel(x, y, width, height)
            raw_data.extend([r, g, b, a])
            
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc
    
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    png += struct.pack('>I', 0) + b'IEND' + iend_crc
    return bytes(png)

def clamp(v, low=0, high=255):
    return max(low, min(high, int(v)))

def draw_vault_icon(x, y, width, height):
    # Normalized coordinates 0.0 to 1.0
    nx = (x + 0.5) / width
    ny = (y + 0.5) / height

    # Background squircle
    corner_r = 0.22
    dx = max(0.0, abs(nx - 0.5) - (0.5 - corner_r))
    dy = max(0.0, abs(ny - 0.5) - (0.5 - corner_r))
    dist_corner = math.hypot(dx, dy)
    
    if dist_corner > corner_r:
        return 0, 0, 0, 0  # transparent outside squircle

    # Background gradient: Dark Slate Navy #0b1329 -> #060913
    diag = (nx + ny) * 0.5
    bg_r = 11 + (6 - 11) * diag
    bg_g = 19 + (9 - 19) * diag
    bg_b = 41 + (19 - 41) * diag

    # Subtle radial glow centered at (0.5, 0.45)
    cx, cy = 0.5, 0.46
    dist_center = math.hypot(nx - cx, ny - cy)
    glow = max(0.0, 1.0 - dist_center / 0.45)
    glow_factor = glow * glow * 0.35
    bg_r = bg_r * (1 - glow_factor) + 16 * glow_factor
    bg_g = bg_g * (1 - glow_factor) + 185 * glow_factor
    bg_b = bg_b * (1 - glow_factor) + 129 * glow_factor

    # Shield outline shape
    # Top edge from (0.28, 0.22) to (0.72, 0.22)
    # Bottom point at (0.5, 0.80)
    sx = abs(nx - 0.5) # symmetry
    sy = ny
    
    # Distance to shield boundary
    # Approximation of shield boundary
    in_shield = False
    if 0.18 <= sy <= 0.78:
        max_w = 0.26 if sy < 0.42 else 0.26 * (1.0 - ((sy - 0.42) / 0.36) ** 1.3)
        if sx <= max_w:
            in_shield = True

    # Outer Shield boundary ring
    if in_shield:
        bg_r = 24 + 10 * diag
        bg_g = 32 + 15 * diag
        bg_b = 56 + 20 * diag

    # Shield border glow
    if 0.18 <= sy <= 0.78:
        max_w = 0.26 if sy < 0.42 else 0.26 * (1.0 - ((sy - 0.42) / 0.36) ** 1.3)
        dist_edge = abs(sx - max_w)
        if dist_edge < 0.025:
            edge_t = 1.0 - (dist_edge / 0.025)
            # Emerald & Cyan shield border
            bg_r = bg_r * (1 - edge_t) + 16 * edge_t
            bg_g = bg_g * (1 - edge_t) + 185 * edge_t
            bg_b = bg_b * (1 - edge_t) + 230 * edge_t

    # Central Vault Dial / Coin Circle
    dial_r = math.hypot(nx - 0.5, ny - 0.46)
    if dial_r <= 0.15:
        # Inner dark dial
        bg_r = 15
        bg_g = 23
        bg_b = 42

    if 0.13 <= dial_r <= 0.15:
        # Ring border in bright emerald #10b981
        ring_t = 1.0 - abs(dial_r - 0.14) / 0.01
        bg_r = bg_r * (1 - ring_t) + 16 * ring_t
        bg_g = bg_g * (1 - ring_t) + 185 * ring_t
        bg_b = bg_b * (1 - ring_t) + 129 * ring_t

    # Currency Arrow / Growth Icon in Center
    # Arrow stem from (0.5, 0.40) to (0.5, 0.52)
    # Arrow head at (0.5, 0.38)
    if abs(nx - 0.5) < 0.018 and 0.40 <= ny <= 0.52:
        bg_r, bg_g, bg_b = 255, 255, 255
    # Arrow heads
    head_d = abs(nx - 0.5) + (ny - 0.39)
    if 0.38 <= ny <= 0.44 and abs(nx - 0.5) <= (ny - 0.38) * 1.4:
        bg_r, bg_g, bg_b = 16, 220, 150

    # Shield lock tick mark at bottom of shield (0.5, 0.68)
    lock_r = math.hypot(nx - 0.5, ny - 0.67)
    if lock_r <= 0.035:
        bg_r, bg_g, bg_b = 16, 185, 129

    return clamp(bg_r), clamp(bg_g), clamp(bg_b), 255

print("Generating icon-192.png...")
png_192 = make_png(192, 192, draw_vault_icon)
with open("icon-192.png", "wb") as f:
    f.write(png_192)

print("Generating icon-512.png...")
png_512 = make_png(512, 512, draw_vault_icon)
with open("icon-512.png", "wb") as f:
    f.write(png_512)

print("Icons generated successfully!")
