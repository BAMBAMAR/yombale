$csharp = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class NopalouIconGenerator
{
    private static GraphicsPath CreateSquirclePath(float x, float y, float w, float h, float r)
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

    public static void Generate(int size, string outputPath, string mode)
    {
        using (Bitmap bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.Clear(Color.Transparent);

            PointF startPoint = new PointF(0, 0);
            PointF endPoint = new PointF(size, size);

            Color c1 = ColorTranslator.FromHtml("#FF7E22"); // Solar radiant orange
            Color c2 = ColorTranslator.FromHtml("#EA580C"); // Pure energetic orange
            Color c3 = ColorTranslator.FromHtml("#C75B00"); // Signature Nopalou burnt orange
            Color c4 = ColorTranslator.FromHtml("#9E3C00"); // Deep bronze shadow

            ColorBlend colorBlend = new ColorBlend();
            colorBlend.Colors = new Color[] { c1, c2, c3, c4 };
            colorBlend.Positions = new float[] { 0.0f, 0.35f, 0.70f, 1.0f };

            Color white = Color.White;

            if (mode == "maskable")
            {
                // Mode Maskable Android : Plein écran sans coins coupés (l'OS Android découpe lui-même)
                using (LinearGradientBrush grad = new LinearGradientBrush(startPoint, endPoint, c1, c4))
                {
                    grad.InterpolationColors = colorBlend;
                    g.FillRectangle(grad, 0, 0, size, size);
                }

                // Monogramme N dans la zone de sécurité W3C (60% de diamètre, centré)
                float scale = 0.60f * ((float)size / 512.0f);
                float offsetX = 102.4f * ((float)size / 512.0f);
                float offsetY = 102.4f * ((float)size / 512.0f);

                DrawNMonogram(g, offsetX, offsetY, scale, white, true);
            }
            else if (mode == "apple")
            {
                // Mode Apple iOS : Fond plein 100% (iOS applique son propre squircle, JAMAIS de transparence dans les coins)
                using (LinearGradientBrush grad = new LinearGradientBrush(startPoint, endPoint, c1, c4))
                {
                    grad.InterpolationColors = colorBlend;
                    g.FillRectangle(grad, 0, 0, size, size);
                }

                // Subtile lueur supérieure de verre (Apple glass highlight)
                using (Pen sheenPen = new Pen(Color.FromArgb(45, 255, 255, 255), 2.0f))
                {
                    g.DrawRectangle(sheenPen, 1, 1, size - 2, size - 2);
                }

                float scale = 0.68f * ((float)size / 512.0f);
                float offsetX = 81.92f * ((float)size / 512.0f);
                float offsetY = 81.92f * ((float)size / 512.0f);

                DrawNMonogram(g, offsetX, offsetY, scale, white, true);
            }
            else
            {
                // Mode App / Splash Screen Standalone (icon-512, icon-192) :
                // Squircle harmonieux à 23% de rayon, avec ombre portée douce et reflet supérieur
                float pad = (float)size * 0.055f; // 5.5% marge pour l'ombre diffuse
                float w = (float)size - (pad * 2.0f);
                float h = (float)size - (pad * 2.0f);
                float radius = w * 0.23f;

                // 1. Ombre portée diffuse multi-couches
                int shadowSteps = 8;
                for (int s = shadowSteps; s >= 1; s--)
                {
                    float offset = s * (1.8f * (float)size / 512.0f);
                    float expand = s * (1.2f * (float)size / 512.0f);
                    int alpha = (int)(18 - (s * 1.8f));
                    if (alpha < 3) alpha = 3;

                    using (GraphicsPath shadowPath = CreateSquirclePath(pad - expand, pad + offset - expand, w + (expand * 2), h + (expand * 2), radius + expand))
                    using (SolidBrush shadowBrush = new SolidBrush(Color.FromArgb(alpha, 120, 45, 0)))
                    {
                        g.FillPath(shadowBrush, shadowPath);
                    }
                }

                // 2. Corps de l'icône Squircle avec dégradé chaud
                using (GraphicsPath squirclePath = CreateSquirclePath(pad, pad, w, h, radius))
                using (LinearGradientBrush grad = new LinearGradientBrush(new PointF(pad, pad), new PointF(pad + w, pad + h), c1, c4))
                {
                    grad.InterpolationColors = colorBlend;
                    g.FillPath(grad, squirclePath);

                    // 3. Reflet supérieur de verre (Specular Inner Sheen)
                    using (Pen sheenPen = new Pen(Color.FromArgb(70, 255, 255, 255), 2.2f * ((float)size / 512.0f)))
                    {
                        sheenPen.Alignment = PenAlignment.Inset;
                        g.DrawPath(sheenPen, squirclePath);
                    }
                }

                float scale = w / 512.0f;
                float offsetX = pad;
                float offsetY = pad;

                DrawNMonogram(g, offsetX, offsetY, scale, white, true);
            }

            bmp.Save(outputPath, ImageFormat.Png);
            Console.WriteLine("Pixel-perfect generated: " + outputPath + " (" + size + "x" + size + ") [" + mode + "]");
        }
    }

    private static void DrawNMonogram(Graphics g, float offsetX, float offsetY, float scale, Color color, bool withDepth)
    {
        // Si avec profondeur : dessine une micro-ombre douce sous la lettre N
        if (withDepth)
        {
            float shadowOffset = 2.5f * scale;
            using (GraphicsPath shadowPath = BuildNPath(offsetX, offsetY + shadowOffset, scale))
            using (SolidBrush shadowBrush = new SolidBrush(Color.FromArgb(40, 0, 0, 0)))
            {
                g.FillPath(shadowBrush, shadowPath);
            }
        }

        using (GraphicsPath nPath = BuildNPath(offsetX, offsetY, scale))
        using (SolidBrush brush = new SolidBrush(color))
        {
            g.FillPath(brush, nPath);
        }
    }

    private static GraphicsPath BuildNPath(float offsetX, float offsetY, float scale)
    {
        GraphicsPath nPath = new GraphicsPath(FillMode.Alternate);

        // Rectangle principal
        float rx = offsetX + (120.0f * scale);
        float ry = offsetY + (108.0f * scale);
        float rw = 272.0f * scale;
        float rh = 296.0f * scale;
        nPath.AddRectangle(new RectangleF(rx, ry, rw, rh));

        // Découpe triangulaire supérieure
        PointF[] pts1 = new PointF[]
        {
            new PointF(offsetX + (324.0f * scale), offsetY + (108.0f * scale)),
            new PointF(offsetX + (188.0f * scale), offsetY + (108.0f * scale)),
            new PointF(offsetX + (324.0f * scale), offsetY + (306.0f * scale))
        };
        nPath.AddPolygon(pts1);

        // Découpe triangulaire inférieure
        PointF[] pts2 = new PointF[]
        {
            new PointF(offsetX + (188.0f * scale), offsetY + (404.0f * scale)),
            new PointF(offsetX + (324.0f * scale), offsetY + (404.0f * scale)),
            new PointF(offsetX + (188.0f * scale), offsetY + (206.0f * scale))
        };
        nPath.AddPolygon(pts2);

        return nPath;
    }
}
"@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $baseDir "frontend-next\public\icons"
$publicDir = Join-Path $baseDir "frontend-next\public"
$appDir = Join-Path $baseDir "frontend-next\src\app"

[NopalouIconGenerator]::Generate(512, (Join-Path $iconsDir "icon-512.png"), "standalone")
[NopalouIconGenerator]::Generate(192, (Join-Path $iconsDir "icon-192.png"), "standalone")
[NopalouIconGenerator]::Generate(512, (Join-Path $iconsDir "icon-maskable-512.png"), "maskable")
[NopalouIconGenerator]::Generate(180, (Join-Path $publicDir "apple-icon.png"), "apple")
[NopalouIconGenerator]::Generate(180, (Join-Path $appDir "apple-icon.png"), "apple")

Write-Output "ALL ULTRA-PREMIUM PNG ICONS SUCCESSFULLY GENERATED!"

