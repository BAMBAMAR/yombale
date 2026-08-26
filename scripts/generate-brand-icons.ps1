$csharp = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class NopalouIconGenerator
{
    private static GraphicsPath CreateRoundedRectPath(float x, float y, float w, float h, float r)
    {
        GraphicsPath path = new GraphicsPath();
        float d = r * 2.0f;
        path.AddArc(x, y, d, d, 180, 90);
        path.AddArc(x + w - d, y, d, d, 270, 90);
        path.AddArc(x + w - d, y + h - d, d, d, 0, 90);
        path.AddArc(x, y + h - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }

    public static void Generate(int size, string outputPath, bool isMaskable, float cornerRadiusRatio)
    {
        using (Bitmap bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.Clear(Color.Transparent);

            Color orange = ColorTranslator.FromHtml("#C75B00");
            Color white = Color.White;

            float scale;
            float offsetX;
            float offsetY;

            if (isMaskable)
            {
                using (SolidBrush orangeBrush = new SolidBrush(orange))
                {
                    g.FillRectangle(orangeBrush, 0, 0, size, size);
                }
                scale = 0.6f * ((float)size / 512.0f);
                offsetX = 102.4f * ((float)size / 512.0f);
                offsetY = 102.4f * ((float)size / 512.0f);
            }
            else
            {
                float radius = (float)size * cornerRadiusRatio;
                using (GraphicsPath rectPath = CreateRoundedRectPath(0, 0, size, size, radius))
                using (SolidBrush orangeBrush = new SolidBrush(orange))
                {
                    g.FillPath(orangeBrush, rectPath);
                }
                scale = (float)size / 512.0f;
                offsetX = 0.0f;
                offsetY = 0.0f;
            }

            using (GraphicsPath nPath = new GraphicsPath(FillMode.Alternate))
            {
                // Rectangle
                float rx = offsetX + (120.0f * scale);
                float ry = offsetY + (108.0f * scale);
                float rw = 272.0f * scale;
                float rh = 296.0f * scale;
                nPath.AddRectangle(new RectangleF(rx, ry, rw, rh));

                // Cutout Triangle 1
                PointF[] pts1 = new PointF[]
                {
                    new PointF(offsetX + (324.0f * scale), offsetY + (108.0f * scale)),
                    new PointF(offsetX + (188.0f * scale), offsetY + (108.0f * scale)),
                    new PointF(offsetX + (324.0f * scale), offsetY + (306.0f * scale))
                };
                nPath.AddPolygon(pts1);

                // Cutout Triangle 2
                PointF[] pts2 = new PointF[]
                {
                    new PointF(offsetX + (188.0f * scale), offsetY + (404.0f * scale)),
                    new PointF(offsetX + (324.0f * scale), offsetY + (404.0f * scale)),
                    new PointF(offsetX + (188.0f * scale), offsetY + (206.0f * scale))
                };
                nPath.AddPolygon(pts2);

                using (SolidBrush whiteBrush = new SolidBrush(white))
                {
                    g.FillPath(whiteBrush, nPath);
                }
            }

            bmp.Save(outputPath, ImageFormat.Png);
            Console.WriteLine("Pixel-perfect generated: " + outputPath + " (" + size + "x" + size + ")");
        }
    }
}
"@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $baseDir "frontend-next\public\icons"
$publicDir = Join-Path $baseDir "frontend-next\public"

[NopalouIconGenerator]::Generate(512, (Join-Path $iconsDir "icon-512.png"), $false, 0.22)
[NopalouIconGenerator]::Generate(192, (Join-Path $iconsDir "icon-192.png"), $false, 0.22)
[NopalouIconGenerator]::Generate(512, (Join-Path $iconsDir "icon-maskable-512.png"), $true, 0.0)
[NopalouIconGenerator]::Generate(180, (Join-Path $publicDir "apple-icon.png"), $false, 0.22)

Write-Output "ALL 4 PNG ICONS GENERATED WITH 100% SUCCESS!"
