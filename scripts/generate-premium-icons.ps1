$csharp = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class PremiumIconGen3
{
    private static GraphicsPath CreateSuperellipse(float cx, float cy, float rx, float ry, float n, int segments)
    {
        GraphicsPath path = new GraphicsPath();
        PointF[] points = new PointF[segments];
        for (int i = 0; i < segments; i++)
        {
            double t = 2.0 * Math.PI * i / segments;
            double cosT = Math.Cos(t);
            double sinT = Math.Sin(t);
            float x = cx + (float)(Math.Sign(cosT) * rx * Math.Pow(Math.Abs(cosT), 2.0 / n));
            float y = cy + (float)(Math.Sign(sinT) * ry * Math.Pow(Math.Abs(sinT), 2.0 / n));
            points[i] = new PointF(x, y);
        }
        path.AddPolygon(points);
        return path;
    }

    private static GraphicsPath BuildBrandN(float ox, float oy, float scale)
    {
        GraphicsPath nPath = new GraphicsPath(FillMode.Alternate);
        float rx = ox + 120f * scale;
        float ry = oy + 108f * scale;
        nPath.AddRectangle(new RectangleF(rx, ry, 272f * scale, 296f * scale));
        nPath.AddPolygon(new PointF[] {
            new PointF(ox + 324f * scale, oy + 108f * scale),
            new PointF(ox + 188f * scale, oy + 108f * scale),
            new PointF(ox + 324f * scale, oy + 306f * scale)
        });
        nPath.AddPolygon(new PointF[] {
            new PointF(ox + 188f * scale, oy + 404f * scale),
            new PointF(ox + 324f * scale, oy + 404f * scale),
            new PointF(ox + 188f * scale, oy + 206f * scale)
        });
        return nPath;
    }

    private static void FillWithBrandGradient(Graphics g, GraphicsPath path, float x, float y, float w, float h)
    {
        Color c1 = ColorTranslator.FromHtml("#FF7E22");
        Color c4 = ColorTranslator.FromHtml("#9E3C00");

        using (LinearGradientBrush grad = new LinearGradientBrush(
            new PointF(x, y), new PointF(x + w, y + h), c1, c4))
        {
            grad.WrapMode = WrapMode.TileFlipXY;
            ColorBlend cb = new ColorBlend();
            cb.Colors = new Color[] {
                ColorTranslator.FromHtml("#FF7E22"),
                ColorTranslator.FromHtml("#EA580C"),
                ColorTranslator.FromHtml("#C75B00"),
                ColorTranslator.FromHtml("#9E3C00")
            };
            cb.Positions = new float[] { 0f, 0.35f, 0.70f, 1f };
            grad.InterpolationColors = cb;

            if (path != null)
                g.FillPath(grad, path);
            else
                g.FillRectangle(grad, x, y, w, h);
        }
    }

    public static void Generate(int targetSize, string outputPath, string mode)
    {
        int rs = targetSize * 4;

        using (Bitmap renderBmp = new Bitmap(rs, rs, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(renderBmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;

            if (mode == "maskable")
            {
                // Full-bleed gradient
                FillWithBrandGradient(g, null, 0, 0, rs, rs);

                // Subtle top sheen for depth
                for (int row = 0; row < rs * 0.4; row++)
                {
                    float alpha = 25f * (1f - (float)row / (rs * 0.4f));
                    using (Pen p = new Pen(Color.FromArgb((int)alpha, 255, 255, 255)))
                        g.DrawLine(p, 0, row, rs, row);
                }

                // N in 60% safe zone
                float safeZone = rs * 0.60f;
                float safeOff = (rs - safeZone) / 2f;
                using (GraphicsPath nPath = BuildBrandN(safeOff, safeOff, safeZone / 512f))
                using (SolidBrush wb = new SolidBrush(Color.White))
                    g.FillPath(wb, nPath);
            }
            else if (mode == "apple")
            {
                FillWithBrandGradient(g, null, 0, 0, rs, rs);

                for (int row = 0; row < rs * 0.35; row++)
                {
                    float alpha = 20f * (1f - (float)row / (rs * 0.35f));
                    using (Pen p = new Pen(Color.FromArgb((int)alpha, 255, 255, 255)))
                        g.DrawLine(p, 0, row, rs, row);
                }

                float nArea = rs * 0.66f;
                float nOff = (rs - nArea) / 2f;
                using (GraphicsPath nPath = BuildBrandN(nOff, nOff, nArea / 512f))
                using (SolidBrush wb = new SolidBrush(Color.White))
                    g.FillPath(wb, nPath);
            }
            else
            {
                // Standalone: white bg + superellipse squircle
                g.Clear(Color.White);

                float pad = rs * 0.04f;
                float w = rs - pad * 2f;
                float cx = rs / 2f;
                float cy = rs / 2f;

                using (GraphicsPath squircle = CreateSuperellipse(cx, cy, w / 2f, w / 2f, 5.0f, 720))
                {
                    // Subtle drop shadow
                    using (GraphicsPath shadowP = CreateSuperellipse(
                        cx + rs * 0.002f, cy + rs * 0.004f,
                        w / 2f + rs * 0.003f, w / 2f + rs * 0.003f, 5.0f, 720))
                    using (PathGradientBrush sb = new PathGradientBrush(shadowP))
                    {
                        sb.CenterColor = Color.FromArgb(16, 0, 0, 0);
                        sb.SurroundColors = new Color[] { Color.FromArgb(0, 0, 0, 0) };
                        g.FillPath(sb, shadowP);
                    }

                    // Gradient fill
                    RectangleF b = squircle.GetBounds();
                    FillWithBrandGradient(g, squircle, b.X, b.Y, b.Width, b.Height);

                    // Top highlight (scanline approach to avoid LinearGradientBrush issues)
                    Region oldClip = g.Clip;
                    g.SetClip(squircle, CombineMode.Intersect);
                    for (int row = (int)b.Top; row < b.Top + b.Height * 0.35; row++)
                    {
                        float t = (row - b.Top) / (b.Height * 0.35f);
                        int alpha = (int)(25f * (1f - t));
                        if (alpha > 0)
                        {
                            using (Pen p = new Pen(Color.FromArgb(alpha, 255, 255, 255)))
                                g.DrawLine(p, b.Left, row, b.Right, row);
                        }
                    }
                    g.Clip = oldClip;
                }

                // N monogram
                using (GraphicsPath nPath = BuildBrandN(pad, pad, w / 512f))
                using (SolidBrush wb = new SolidBrush(Color.White))
                    g.FillPath(wb, nPath);
            }

            // 4x downscale with bicubic
            using (Bitmap finalBmp = new Bitmap(targetSize, targetSize, PixelFormat.Format32bppArgb))
            using (Graphics gF = Graphics.FromImage(finalBmp))
            {
                gF.SmoothingMode = SmoothingMode.AntiAlias;
                gF.InterpolationMode = InterpolationMode.HighQualityBicubic;
                gF.PixelOffsetMode = PixelOffsetMode.HighQuality;
                gF.CompositingQuality = CompositingQuality.HighQuality;
                gF.DrawImage(renderBmp,
                    new Rectangle(0, 0, targetSize, targetSize),
                    0, 0, rs, rs, GraphicsUnit.Pixel);
                finalBmp.Save(outputPath, ImageFormat.Png);
            }
            Console.WriteLine("OK: " + outputPath + " (" + targetSize + "x" + targetSize + ") [" + mode + "]");
        }
    }
}
"@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $baseDir "frontend-next\public\icons"
$publicDir = Join-Path $baseDir "frontend-next\public"
$appDir = Join-Path $baseDir "frontend-next\src\app"

[PremiumIconGen3]::Generate(1024, (Join-Path $iconsDir "icon-1024.png"), "standalone")
[PremiumIconGen3]::Generate(512,  (Join-Path $iconsDir "icon-512.png"),  "standalone")
[PremiumIconGen3]::Generate(192,  (Join-Path $iconsDir "icon-192.png"),  "standalone")

[PremiumIconGen3]::Generate(1024, (Join-Path $iconsDir "icon-maskable-1024.png"), "maskable")
[PremiumIconGen3]::Generate(512,  (Join-Path $iconsDir "icon-maskable-512.png"),  "maskable")

[PremiumIconGen3]::Generate(180, (Join-Path $publicDir "apple-icon.png"), "apple")
[PremiumIconGen3]::Generate(180, (Join-Path $appDir "apple-icon.png"), "apple")

Write-Output "`n=== ALL PREMIUM ICONS GENERATED ==="
