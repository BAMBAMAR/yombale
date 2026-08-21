import struct
import zlib
import os
import math

def create_png(width, height, rgba_data):
    signature = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    raw_lines = bytearray()
    row_bytes = width * 4
    for y in range(height):
        raw_lines.append(0)  # filter type 0
        raw_lines.extend(rgba_data[y * row_bytes : (y + 1) * row_bytes])
    
    compressed = zlib.compress(bytes(raw_lines), level=9)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    iend_crc = zlib.crc32(b'IEND')
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return signature + ihdr + idat + iend

def get_n_spans_for_y(y_512):
    """
    Returns list of (x_start, x_end) ranges in 512-space where N is solid white.
    d="M120 108h272v296H120Z M324 108H188l136 198Z M188 404h136L188 206Z"
    """
    if y_512 < 108 or y_512 > 404:
        return []
    
    m_inv = 136.0 / 198.0  # ~0.68686868
    
    # Left bar: [120, 188]
    # Right bar: [324, 392]
    # Diagonal: between 188 and 324, x is in [188 + (y - 206)*m_inv, 188 + (y - 108)*m_inv]
    diag_left = 188.0 + (y_512 - 206.0) * m_inv
    diag_right = 188.0 + (y_512 - 108.0) * m_inv
    
    # Clamp diagonal to [188, 324]
    d_l = max(188.0, min(324.0, diag_left))
    d_r = max(188.0, min(324.0, diag_right))
    
    if d_l < d_r:
        # Merge overlapping intervals: [120, 188], [d_l, d_r], [324, 392]
        # Since d_l connects smoothly to left bar when y <= 206 and to right bar when y >= 306
        intervals = []
        cur_l, cur_r = 120.0, 188.0
        if d_l <= cur_r:
            cur_r = max(cur_r, d_r)
        else:
            intervals.append((cur_l, cur_r))
            cur_l, cur_r = d_l, d_r
            
        if 324.0 <= cur_r:
            cur_r = max(cur_r, 392.0)
            intervals.append((cur_l, cur_r))
        else:
            intervals.append((cur_l, cur_r))
            intervals.append((324.0, 392.0))
        return intervals
    else:
        return [(120.0, 188.0), (324.0, 392.0)]

def render_icon(target_size, mode='standard'):
    """
    Renders the icon with 2x sub-pixel horizontal/vertical sampling for smooth anti-aliased edges.
    """
    bg_orange = (199, 91, 0, 255)
    bg_navy = (28, 43, 74, 255)
    white = (255, 255, 255, 255)
    transparent = (0, 0, 0, 0)
    
    rx = (112.0 / 512.0) * target_size
    
    out_rgba = bytearray(target_size * target_size * 4)
    
    # 2x2 subpixel offsets
    sub_offsets = [0.25, 0.75]
    
    for ty in range(target_size):
        row_offset = ty * target_size * 4
        for tx in range(target_size):
            r_sum, g_sum, b_sum, a_sum = 0, 0, 0, 0
            
            for sy in sub_offsets:
                py = ty + sy
                for sx in sub_offsets:
                    px = tx + sx
                    
                    # Background mask check (rounded rectangle)
                    in_bg = True
                    if mode in ('standard', 'dark'):
                        # Check corner curves
                        if px < rx and py < rx:
                            in_bg = ((px - rx)**2 + (py - rx)**2) <= rx*rx
                        elif px > (target_size - rx) and py < rx:
                            in_bg = ((px - (target_size - rx))**2 + (py - rx)**2) <= rx*rx
                        elif px < rx and py > (target_size - rx):
                            in_bg = ((px - rx)**2 + (py - (target_size - rx))**2) <= rx*rx
                        elif px > (target_size - rx) and py > (target_size - rx):
                            in_bg = ((px - (target_size - rx))**2 + (py - (target_size - rx))**2) <= rx*rx
                            
                    if not in_bg and mode != 'maskable':
                        r, g, b, a = transparent
                    else:
                        # Convert (px, py) to 512 space
                        if mode == 'maskable':
                            # N scaled to 60% and centered (safe zone W3C)
                            n_x = ((px / target_size) * 512.0 - 102.4) / 0.6
                            n_y = ((py / target_size) * 512.0 - 102.4) / 0.6
                        else:
                            n_x = (px / target_size) * 512.0
                            n_y = (py / target_size) * 512.0
                            
                        # Check if inside N
                        in_n = False
                        spans = get_n_spans_for_y(n_y)
                        for s_l, s_r in spans:
                            if s_l <= n_x <= s_r:
                                in_n = True
                                break
                                
                        if in_n:
                            r, g, b, a = white
                        elif mode == 'transparent':
                            r, g, b, a = transparent
                        elif mode == 'dark':
                            r, g, b, a = bg_navy
                        else:
                            r, g, b, a = bg_orange
                            
                    r_sum += r
                    g_sum += g
                    b_sum += b
                    a_sum += a
                    
            idx = row_offset + tx * 4
            out_rgba[idx] = r_sum >> 2
            out_rgba[idx + 1] = g_sum >> 2
            out_rgba[idx + 2] = b_sum >> 2
            out_rgba[idx + 3] = a_sum >> 2
            
    return create_png(target_size, target_size, out_rgba)

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    icons_dir = os.path.join(root, 'frontend-next', 'public', 'icons')
    app_dir = os.path.join(root, 'frontend-next', 'src', 'app')
    
    os.makedirs(icons_dir, exist_ok=True)
    
    print("Generating PNG icons...")
    
    # 1. icon-512.png
    print(" - Rendering icon-512.png (512x512)...")
    data_512 = render_icon(512, 'standard')
    with open(os.path.join(icons_dir, 'icon-512.png'), 'wb') as f:
        f.write(data_512)
        
    # 2. icon-192.png
    print(" - Rendering icon-192.png (192x192)...")
    data_192 = render_icon(192, 'standard')
    with open(os.path.join(icons_dir, 'icon-192.png'), 'wb') as f:
        f.write(data_192)
        
    # 3. icon-maskable-512.png
    print(" - Rendering icon-maskable-512.png (512x512, safe zone centered)...")
    data_maskable = render_icon(512, 'maskable')
    with open(os.path.join(icons_dir, 'icon-maskable-512.png'), 'wb') as f:
        f.write(data_maskable)
        
    # 4. logo-mark-transparent.png
    print(" - Rendering logo-mark-transparent.png (512x512)...")
    data_trans = render_icon(512, 'transparent')
    with open(os.path.join(icons_dir, 'logo-mark-transparent.png'), 'wb') as f:
        f.write(data_trans)
        
    # 5. apple-icon.png
    print(" - Rendering apple-icon.png (180x180)...")
    data_apple = render_icon(180, 'standard')
    with open(os.path.join(app_dir, 'apple-icon.png'), 'wb') as f:
        f.write(data_apple)
        
    print("All PNG icons generated successfully!")

if __name__ == '__main__':
    main()
