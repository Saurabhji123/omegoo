#!/usr/bin/env python3
"""
Create a rounded favicon from logo512.png
"""

from PIL import Image, ImageDraw
import os

def create_rounded_favicon():
    try:
        # Load the logo
        logo_path = "frontend/public/logo512.png"
        output_path = "frontend/public/favicon-rounded.png"
        
        if not os.path.exists(logo_path):
            print(f"❌ Logo file not found: {logo_path}")
            return False
            
        # Open the logo
        img = Image.open(logo_path)
        print(f"📷 Loaded logo: {img.size}")
        
        # Convert to RGBA if needed
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Create multiple sizes for favicon
        sizes = [16, 32, 48, 64]
        
        for size in sizes:
            # Resize the image
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            
            # Create a mask for rounded corners
            mask = Image.new('L', (size, size), 0)
            draw = ImageDraw.Draw(mask)
            
            # Calculate radius (about 20% of size for nice rounded corners)
            radius = max(2, size // 8)  # Minimum radius of 2px
            
            # Draw rounded rectangle on mask
            draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=255)
            
            # Apply the mask
            output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            output.paste(resized, mask=mask)
            
            # Save the favicon
            output_file = f"frontend/public/favicon-{size}x{size}.png"
            output.save(output_file, format='PNG')
            print(f"✅ Created: {output_file}")
        
        # Also create a standard favicon.ico with multiple sizes
        # Convert largest size to ICO
        img_32 = Image.open("frontend/public/favicon-32x32.png")
        img_16 = Image.open("frontend/public/favicon-16x16.png")
        
        # Save as ICO with multiple sizes
        ico_path = "frontend/public/favicon-new.ico"
        img_32.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32)])
        print(f"✅ Created: {ico_path}")
        
        return True
        
    except ImportError:
        print("❌ PIL (Pillow) not installed. Install with: pip install Pillow")
        return False
    except Exception as e:
        print(f"❌ Error creating favicon: {e}")
        return False

if __name__ == "__main__":
    success = create_rounded_favicon()
    if success:
        print("\n🎉 Favicon creation completed!")
        print("Next steps:")
        print("1. Update index.html to use the new favicon files")
        print("2. Replace favicon.ico with favicon-new.ico if needed")
    else:
        print("\n❌ Favicon creation failed!")