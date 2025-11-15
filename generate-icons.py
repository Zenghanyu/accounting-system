#!/usr/bin/env python3
"""
快速生成PWA图标
需要安装PIL: pip install pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """创建一个简单的应用图标"""
    # 创建渐变背景
    image = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(image)

    # 绘制渐变背景（紫色到蓝色）
    for y in range(size):
        r = int(102 + (118 - 102) * y / size)
        g = int(126 + (75 - 126) * y / size)
        b = int(234 + (162 - 234) * y / size)
        draw.rectangle([(0, y), (size, y + 1)], fill=(r, g, b))

    # 添加圆角（可选）
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (size, size)], radius=size//8, fill=255)

    # 创建输出图像
    output = Image.new('RGBA', (size, size))
    output.paste(image, (0, 0))
    output.putalpha(mask)

    # 添加文字
    try:
        # 尝试使用中文字体
        font_size = size // 3
        font = ImageFont.truetype("msyh.ttc", font_size)  # 微软雅黑
    except:
        try:
            font = ImageFont.truetype("simhei.ttf", font_size)  # 黑体
        except:
            font = ImageFont.load_default()

    # 绘制"💰"或"哈记米"
    text = "💰"

    # 获取文本边界
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # 居中绘制
    x = (size - text_width) // 2
    y = (size - text_height) // 2

    # 创建新的绘图对象用于RGBA图像
    draw_rgba = ImageDraw.Draw(output)
    draw_rgba.text((x, y), text, fill='white', font=font)

    # 保存
    output.save(output_path, 'PNG')
    print(f"Created icon: {output_path} ({size}x{size})")

def main():
    """生成所有需要的图标"""
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # 生成192x192图标
    create_icon(192, os.path.join(script_dir, 'icon-192.png'))

    # 生成512x512图标
    create_icon(512, os.path.join(script_dir, 'icon-512.png'))

    print("\nIcons generated successfully!")
    print("\nNext steps:")
    print("1. Check the generated icon files")
    print("2. If needed, replace with professional designs")
    print("3. Run: git add icon-192.png icon-512.png")
    print("4. Run: git commit -m 'Add PWA icons'")
    print("5. Run: git push origin main")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("Error: Pillow library required")
        print("Run: pip install pillow")
        print("\nOr use online tool:")
        print("https://www.pwabuilder.com/imageGenerator")
